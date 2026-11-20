/**
 * Minimal Server-Sent Events client for React Native.
 *
 * RN's `fetch` has no streaming body, so this reads the stream through
 * `XMLHttpRequest` progress events: RN's XHR switches to incremental
 * `responseText` updates when an `onprogress`/`onreadystatechange` handler is
 * attached before `send()` (this is the same transport `react-native-sse` uses).
 * Written in-house rather than adding that dependency: it is ~150 lines, needs
 * our refresh-on-401 path (`refreshAuthTokens`) and the shared `resolveUrl`,
 * and has no native code, so it is safe on the New Architecture.
 *
 * Behaviour:
 *  - `Authorization: Bearer <token>`; a 401 refreshes the token ONCE and
 *    reconnects; a second 401 (or a failed refresh) gives up.
 *  - network errors, 5xx and server-side closes reconnect with backoff
 *    (`backoffMs`), up to `maxRetries` consecutive failures; any received frame
 *    resets the counter.
 *  - other 4xx, a non-`text/event-stream` response, no XHR at all, or retries
 *    exhausted call `onFallback` once and stop — the caller polls instead.
 *  - `close()` stops everything (no further callbacks).
 */
import { getAccessToken, refreshAuthTokens, resolveUrl } from './client';

export interface SseMessage {
  event: string;
  data: string;
}

export const SSE_BACKOFF_MS = [1_000, 2_000, 5_000, 10_000, 30_000] as const;

/** Incremental `text/event-stream` parser (WHATWG rules, minus `id`/`retry`, which we ignore). */
export class SseParser {
  private buffer = '';
  private event = '';
  private data: string[] = [];

  feed(chunk: string): SseMessage[] {
    this.buffer += chunk;
    const out: SseMessage[] = [];
    let nl: number;
    while ((nl = this.buffer.search(/\r\n|\r|\n/)) !== -1) {
      const line = this.buffer.slice(0, nl);
      const sepLen = this.buffer.startsWith('\r\n', nl) ? 2 : 1;
      // A lone trailing '\r' may be the first half of '\r\n': wait for more.
      if (sepLen === 1 && this.buffer[nl] === '\r' && nl === this.buffer.length - 1) break;
      this.buffer = this.buffer.slice(nl + sepLen);
      if (line === '') {
        if (this.data.length > 0) out.push({ event: this.event || 'message', data: this.data.join('\n') });
        this.event = '';
        this.data = [];
        continue;
      }
      if (line.startsWith(':')) continue; // comment / keepalive
      const colon = line.indexOf(':');
      const field = colon === -1 ? line : line.slice(0, colon);
      let value = colon === -1 ? '' : line.slice(colon + 1);
      if (value.startsWith(' ')) value = value.slice(1);
      if (field === 'event') this.event = value;
      else if (field === 'data') this.data.push(value);
    }
    return out;
  }
}

/** The slice of XMLHttpRequest this client uses (lets tests inject a fake). */
export interface XhrLike {
  readyState: number;
  status: number;
  responseText: string;
  onreadystatechange: (() => void) | null;
  onprogress: (() => void) | null;
  onerror: (() => void) | null;
  open(method: string, url: string): void;
  setRequestHeader(name: string, value: string): void;
  getResponseHeader(name: string): string | null;
  send(body?: null): void;
  abort(): void;
}

export interface EventStreamOptions {
  /** API path, e.g. `/orders/{id}/events` (resolved like every other API call). */
  path: string;
  onMessage: (msg: SseMessage) => void;
  /** Stream connected (status 200, event-stream content type). Fires on every (re)connect. */
  onOpen?: () => void;
  /** The stream dropped and a reconnect is scheduled (poll meanwhile if you need freshness). */
  onDisconnect?: () => void;
  /** Stream unusable: fall back to polling. Called at most once; the stream is closed. */
  onFallback?: (reason: string) => void;
  /** Asked when the server closes the stream cleanly: return true to stop instead of reconnecting. */
  isDone?: () => boolean;
  maxRetries?: number;
  backoffMs?: readonly number[];
  xhrFactory?: () => XhrLike;
}

export interface EventStreamHandle {
  close(): void;
}

function defaultXhrFactory(): XhrLike | null {
  const Ctor = (globalThis as { XMLHttpRequest?: new () => XhrLike }).XMLHttpRequest;
  return Ctor ? new Ctor() : null;
}

export function openEventStream(options: EventStreamOptions): EventStreamHandle {
  const backoff = options.backoffMs ?? SSE_BACKOFF_MS;
  const maxRetries = options.maxRetries ?? 5;
  let closed = false;
  let xhr: XhrLike | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let failures = 0;
  let refreshedOnce = false;

  const stop = (): void => {
    closed = true;
    if (timer) clearTimeout(timer);
    timer = null;
    const x = xhr;
    xhr = null;
    if (x) {
      x.onreadystatechange = null;
      x.onprogress = null;
      x.onerror = null;
      try {
        x.abort();
      } catch {
        /* already finished */
      }
    }
  };

  const fallback = (reason: string): void => {
    if (closed) return;
    stop();
    options.onFallback?.(reason);
  };

  const scheduleReconnect = (): void => {
    if (closed) return;
    if (failures >= maxRetries) return fallback('retries-exhausted');
    options.onDisconnect?.();
    const delay = backoff[Math.min(failures, backoff.length - 1)] ?? 30_000;
    failures += 1;
    timer = setTimeout(() => {
      timer = null;
      connect();
    }, delay);
  };

  const connect = (): void => {
    if (closed) return;
    const x = options.xhrFactory ? options.xhrFactory() : defaultXhrFactory();
    if (!x) return fallback('unsupported');
    xhr = x;
    const parser = new SseParser();
    let seen = 0;
    let opened = false;
    let settled = false;

    const detach = (): void => {
      x.onreadystatechange = null;
      x.onprogress = null;
      x.onerror = null;
      if (xhr === x) xhr = null;
    };

    const drain = (): void => {
      const text = x.responseText ?? '';
      if (text.length <= seen) return;
      const chunk = text.slice(seen);
      seen = text.length;
      for (const msg of parser.feed(chunk)) {
        if (closed || xhr !== x) return;
        failures = 0;
        options.onMessage(msg);
      }
    };

    const onHeaders = (): boolean => {
      const status = x.status;
      if (status === 401) {
        settled = true;
        detach();
        try {
          x.abort();
        } catch {
          /* ignore */
        }
        if (refreshedOnce) {
          fallback('unauthorized');
          return false;
        }
        refreshedOnce = true;
        void refreshAuthTokens().then(
          (token) => (token ? connect() : fallback('unauthorized')),
          () => fallback('unauthorized'),
        );
        return false;
      }
      if (status < 200 || status >= 300) {
        settled = true;
        detach();
        try {
          x.abort();
        } catch {
          /* ignore */
        }
        if (status >= 500 || status === 0) scheduleReconnect();
        else fallback(`http-${status}`);
        return false;
      }
      const type = x.getResponseHeader('Content-Type') ?? x.getResponseHeader('content-type') ?? '';
      if (!type.toLowerCase().includes('text/event-stream')) {
        settled = true;
        detach();
        try {
          x.abort();
        } catch {
          /* ignore */
        }
        fallback('not-event-stream');
        return false;
      }
      opened = true;
      refreshedOnce = false;
      options.onOpen?.();
      return true;
    };

    x.onreadystatechange = () => {
      if (closed || settled || xhr !== x) return;
      if (x.readyState >= 2 && !opened && !onHeaders()) return;
      if (x.readyState >= 3) drain();
      if (x.readyState === 4) {
        settled = true;
        detach();
        if (options.isDone?.()) return stop();
        scheduleReconnect();
      }
    };
    x.onprogress = () => {
      if (closed || settled || xhr !== x) return;
      if (!opened && !onHeaders()) return;
      drain();
    };
    x.onerror = () => {
      if (closed || settled || xhr !== x) return;
      settled = true;
      detach();
      scheduleReconnect();
    };

    try {
      x.open('GET', resolveUrl(options.path));
      x.setRequestHeader('Accept', 'text/event-stream');
      x.setRequestHeader('Cache-Control', 'no-cache');
      const token = getAccessToken();
      if (token) x.setRequestHeader('Authorization', `Bearer ${token}`);
      x.send(null);
    } catch {
      detach();
      fallback('unsupported');
    }
  };

  connect();
  return { close: stop };
}
