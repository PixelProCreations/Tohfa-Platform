/**
 * AboutSupportScreen's feedback form used to tell the farmer "Your feedback has been submitted
 * to the TOHFA team" without sending anything. It must call POST /farmers/me/support-tickets
 * (BR-60) and show the thank-you only after a real 2xx.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';

const alertSpy = vi.hoisted(() => vi.fn());

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: alertSpy },
  Linking: { openURL: () => Promise.resolve() },
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  Rect: 'Rect',
}));

vi.mock('@tohfa/mobile-ui', () => ({
  ScreenStatusBar: 'ScreenStatusBar',
  SafeAreaView: 'SafeAreaView',
}));

const api = vi.hoisted(() => ({
  createSupportTicket: vi.fn(),
  SUPPORT_TICKET_DESCRIPTION_MAX: 2000,
}));
vi.mock('../api/supportTickets', () => api);

import { ApiError } from '../../../shell/api/client';
import { AboutSupportScreen } from '../screens/profile/AboutSupportScreen';
import { t } from '../../../i18n/farmer';

type Json = ReactTestRendererJSON | ReactTestRendererJSON[] | string | null;
function renderedText(node: Json): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(renderedText);
  return (node.children ?? []).flatMap(renderedText);
}

async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function mount(): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<AboutSupportScreen onBack={() => undefined} />);
  });
  await settle();
  return tree;
}

const PLACEHOLDER = t('farmer.support.feedback.placeholder');
const SUBMIT = t('farmer.support.feedback.submit');

function typeFeedback(tree: renderer.ReactTestRenderer, value: string): void {
  act(() => {
    tree.root.findByProps({ accessibilityLabel: PLACEHOLDER }).props.onChangeText(value);
  });
}
async function submit(tree: renderer.ReactTestRenderer): Promise<void> {
  await act(async () => {
    tree.root.findByProps({ accessibilityLabel: SUBMIT }).props.onPress();
  });
  await settle();
}

function problem(status: number, code: string, detail: string): ApiError {
  return new ApiError({ type: 'about:blank', title: 'Error', status, code, detail } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AboutSupportScreen feedback (BR-60)', () => {
  it('BR-60: POSTs the feedback to /farmers/me/support-tickets with the rating and shows thanks only after 2xx', async () => {
    api.createSupportTicket.mockResolvedValue({ ticket: { id: 't-1', ticketNumber: 'TKT-1001' } });
    const tree = await mount();

    typeFeedback(tree, '  Photos upload slowly  ');
    await submit(tree);

    expect(api.createSupportTicket).toHaveBeenCalledTimes(1);
    const body = api.createSupportTicket.mock.calls[0]?.[0] as {
      categoryCode: string;
      subject: string;
      description: string;
    };
    expect(body.categoryCode).toBe('OTHER');
    expect(body.subject).toBe('App feedback: 4 out of 5 stars');
    expect(body.description).toBe('App rating: 4 out of 5 stars\n\nPhotos upload slowly');
    expect(Object.keys(body).sort()).toEqual(['categoryCode', 'description', 'subject']);
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0]?.[0]).toBe(t('farmer.support.feedback.successTitle'));
  });

  it('BR-60: does NOT show the thank-you when the request fails, and shows the server error', async () => {
    api.createSupportTicket.mockRejectedValue(problem(422, 'VALIDATION_FAILED', 'Subject is too long'));
    const tree = await mount();

    typeFeedback(tree, 'Great app');
    await submit(tree);

    expect(api.createSupportTicket).toHaveBeenCalledTimes(1);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(renderedText(tree.toJSON()).join('\n')).toContain('Subject is too long');
    // The draft is kept so the farmer can retry.
    expect(tree.root.findByProps({ accessibilityLabel: PLACEHOLDER }).props.value).toBe('Great app');
  });

  it('BR-60: refuses an empty feedback body locally without making a request', async () => {
    const tree = await mount();

    typeFeedback(tree, '   ');
    await submit(tree);

    expect(api.createSupportTicket).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(renderedText(tree.toJSON()).join('\n')).toContain(t('farmer.support.feedback.empty'));
  });

  it('BR-60: sends the star rating the farmer picked', async () => {
    api.createSupportTicket.mockResolvedValue({ ticket: { id: 't-2', ticketNumber: 'TKT-1002' } });
    const tree = await mount();

    // Stars are the five TouchableOpacity children of the stars row; tap the 2nd.
    const stars = tree.root.findAll(
      (n) => (n.type as unknown) === 'TouchableOpacity' && n.props.style?.padding === 2,
    );
    expect(stars).toHaveLength(5);
    act(() => {
      stars[1]!.props.onPress();
    });
    typeFeedback(tree, 'Needs work');
    await submit(tree);

    const body = api.createSupportTicket.mock.calls[0]?.[0] as { subject: string; description: string };
    expect(body.subject).toBe('App feedback: 2 out of 5 stars');
    expect(body.description.startsWith('App rating: 2 out of 5 stars')).toBe(true);
  });
});
