/**
 * Microsecond UTC timestamps used inside opaque keyset cursors.
 *
 * Keyset cursors carry the row's timestamp as the text Postgres prints with
 * `to_char(col AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')` (see `MICRO_TS_SQL`). A JS
 * `Date` would round to the millisecond and skip rows that share one (the wallet keyset fix).
 *
 * The cursor is client-supplied, so its timestamp is validated here before it reaches a
 * `::timestamptz` cast: the shape regex alone accepts `2026-99-99T...`, which Postgres rejects with
 * a 500 instead of the 422 the caller deserves.
 */

const MICRO_TS = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.\d{6}Z$/;

/** SQL expression printing `column` as a microsecond UTC timestamp, the format `isMicroTimestamp` accepts. */
export const MICRO_TS_SQL = (column: string): string =>
  `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;

/** True only for a real instant in the exact `YYYY-MM-DDTHH:MM:SS.ffffffZ` shape. */
export function isMicroTimestamp(value: string): boolean {
  const match = MICRO_TS.exec(value);
  if (match === null) return false;
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number) as [number, number, number, number, number, number];
  if (year < 1 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59) return false;
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1]!;
  return day <= daysInMonth;
}
