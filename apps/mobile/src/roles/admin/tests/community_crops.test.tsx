/**
 * BR-59r: the "Related crops" chips on the admin article and video forms.
 *
 * What is pinned here:
 *   - the options are the fetched crop_master list, not an array in the screen;
 *   - a selection is sent as `cropIds` on create and on update;
 *   - an edit prefills from the item's `crops`, and an edit the admin did not
 *     touch the tags of sends NO `cropIds` (omitted = unchanged; `[]` would
 *     wipe them);
 *   - the crop list is behind a different permission (admin.crop_taxonomy.manage)
 *     from the content (learning.admin.manage): when it cannot be browsed the
 *     picker says so, and loading, error and genuinely-empty are three
 *     different things, never one blank chip row.
 */
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import type { LearningArticleDto, LearningCropRef, LearningVideoDto } from '../api/learning';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  RefreshControl: 'RefreshControl',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  ClipPath: 'ClipPath',
  Defs: 'Defs',
  G: 'G',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));

vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));

const hooks = vi.hoisted(() => ({
  useLearningArticle: vi.fn(),
  useLearningVideo: vi.fn(),
  useLearningTraining: vi.fn(),
  useLearningGroup: vi.fn(),
  useCreateLearningArticle: vi.fn(),
  useCreateLearningVideo: vi.fn(),
  useUpdateLearningArticle: vi.fn(),
  useUpdateLearningVideo: vi.fn(),
}));
vi.mock('../api/learningHooks', () => hooks);

// CreateContentScreen's announcement path (BR-213); not exercised by the crop tests.
vi.mock('../api/announcementsHooks', () => ({
  useCreateAdminAnnouncement: () => ({ mutate: () => undefined, isPending: false, error: null }),
}));

const profile = vi.hoisted(() => ({ useMyAdminAccount: vi.fn() }));
vi.mock('../api/profileHooks', () => profile);

const produce = vi.hoisted(() => ({ useCropMasterList: vi.fn() }));
vi.mock('../api/produceHooks', () => produce);

import { AddVideoScreen } from '../screens/community/AddVideoScreen';
import { CreateContentScreen } from '../screens/community/CreateContentScreen';
import {
  CROP_TAXONOMY_MANAGE,
  LEARNING_MANAGE,
  buildArticleBody,
  buildArticleUpdateBody,
  buildVideoBody,
  buildVideoUpdateBody,
  cropChipLabel,
  cropPickerState,
  mergeCropOptions,
} from '../screens/community/communityLogic';
import { makeCan } from '../permissions/can';
import { en } from '../i18n';
import { ADMIN_NO_VALUE } from '../utils/noValue';

const noop = () => undefined;
const both = makeCan([LEARNING_MANAGE, CROP_TAXONOMY_MANAGE]);
const contentOnly = makeCan([LEARNING_MANAGE]);

const BRINJAL: LearningCropRef = { id: '11111111-1111-4111-8111-111111111111', name: 'Brinjal', nameTa: 'கத்தரிக்காய்' };
const OKRA: LearningCropRef = { id: '22222222-2222-4222-8222-222222222222', name: 'Okra', nameTa: null };
const GINGER: LearningCropRef = { id: '33333333-3333-4333-8333-333333333333', name: 'Ginger', nameTa: 'இஞ்சி' };
const CATALOGUE = [BRINJAL, OKRA, GINGER];

function cropRow(c: LearningCropRef) {
  return {
    ...c,
    slug: c.name.toLowerCase(),
    categoryId: 'cat-1',
    botanicalName: null,
    defaultUnit: 'kg',
    seasonMonths: null,
    shelfLifeDays: null,
    iconKey: null,
    isActive: true,
  };
}

type CropQuery = { data: { items: ReturnType<typeof cropRow>[] } | undefined; error: unknown; isPending: boolean; refetch: () => void };

function cropList(items: LearningCropRef[] = CATALOGUE): CropQuery {
  return { data: { items: items.map(cropRow) }, error: null, isPending: false, refetch: vi.fn() };
}

function textOf(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(textOf);
  return (node.children ?? []).flatMap(textOf);
}

function renderTree(element: React.ReactElement): renderer.ReactTestRenderer {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(element);
  });
  return tree;
}

const chipId = (id: string) => `community.cropPicker.chip.${id}`;
const find = (tree: renderer.ReactTestRenderer, testID: string) => tree.root.findAllByProps({ testID });
const has = (tree: renderer.ReactTestRenderer, testID: string) => find(tree, testID).length > 0;
const press = (tree: renderer.ReactTestRenderer, testID: string) => {
  act(() => {
    tree.root.findByProps({ testID }).props.onPress();
  });
};
const type = (tree: renderer.ReactTestRenderer, testID: string, value: string) => {
  act(() => {
    tree.root.findByProps({ testID }).props.onChangeText(value);
  });
};
const isSelected = (tree: renderer.ReactTestRenderer, id: string) =>
  tree.root.findByProps({ testID: chipId(id) }).props.accessibilityState.selected === true;
const noteText = (tree: renderer.ReactTestRenderer) => textOf(tree.root.findByProps({ testID: 'community.cropPicker.note' }).props.children as never) ;

function setup(crops: CropQuery = cropList()) {
  const write = () => ({ mutate: vi.fn(), isPending: false, error: null as unknown });
  const writes = { createArticle: write(), createVideo: write(), updateArticle: write(), updateVideo: write() };
  hooks.useCreateLearningArticle.mockReturnValue(writes.createArticle);
  hooks.useCreateLearningVideo.mockReturnValue(writes.createVideo);
  hooks.useUpdateLearningArticle.mockReturnValue(writes.updateArticle);
  hooks.useUpdateLearningVideo.mockReturnValue(writes.updateVideo);
  const idle = { data: undefined, error: null, isPending: false, refetch: vi.fn() };
  hooks.useLearningArticle.mockReturnValue(idle);
  hooks.useLearningVideo.mockReturnValue(idle);
  hooks.useLearningTraining.mockReturnValue(idle);
  hooks.useLearningGroup.mockReturnValue(idle);
  profile.useMyAdminAccount.mockReturnValue({ account: undefined, authorName: 'Asha Menon', isLoading: false, error: null });
  produce.useCropMasterList.mockReset();
  produce.useCropMasterList.mockReturnValue(crops);
  return writes;
}

const filled = {
  title: 'Mulching for water retention',
  shortDescription: 'Keep the soil covered.',
  farmingCategory: 'Soil Health',
  instructions: 'Lay straw two inches deep.',
};

function createArticle(can = both) {
  return <CreateContentScreen onBack={noop} can={can} initialData={filled} />;
}

const storedArticle = (crops: LearningCropRef[]): LearningArticleDto => ({
  id: 'art-1',
  title: 'Composting basics',
  snippet: 'Start with green and brown layers.',
  content: 'Alternate layers and turn weekly.',
  readTime: '5 min read',
  author: 'Original Author',
  tag: 'Composting',
  language: 'en',
  isPublished: false,
  crops,
  createdAt: '2026-10-10T03:30:00.000Z',
  updatedAt: '2026-10-10T03:30:00.000Z',
});

const storedVideo = (crops: LearningCropRef[]): LearningVideoDto => ({
  id: 'vid-1',
  title: 'Drip irrigation',
  description: 'A walkthrough.',
  videoUrl: 'https://video.example.org/drip',
  duration: '8:20',
  author: 'Original Author',
  language: 'ta',
  isFeatured: false,
  isPublished: true,
  crops,
  createdAt: '2026-10-10T03:30:00.000Z',
  updatedAt: '2026-10-10T03:30:00.000Z',
});

function editArticle(crops: LearningCropRef[], can = both) {
  return (
    <CreateContentScreen
      onBack={noop}
      can={can}
      editing={{ kind: 'article', id: 'art-1', content: { kind: 'article', dto: storedArticle(crops) } }}
    />
  );
}

function editVideo(crops: LearningCropRef[], can = both) {
  return (
    <AddVideoScreen
      onBack={noop}
      can={can}
      editing={{ kind: 'video', id: 'vid-1', content: { kind: 'video', dto: storedVideo(crops) } }}
    />
  );
}

function bodyOf(mutate: ReturnType<typeof vi.fn>): Record<string, unknown> {
  const arg = mutate.mock.calls[0]?.[0] as { body?: Record<string, unknown> } & Record<string, unknown>;
  return arg.body ?? arg;
}

// ─── Pure logic ──────────────────────────────────────────────────────────────

describe('BR-59r crop chip logic', () => {
  it('BR-59r: a chip reads "English · Tamil" when the crop has a Tamil name, and the English name alone when it has none', () => {
    expect(cropChipLabel(BRINJAL)).toBe('Brinjal · கத்தரிக்காய்');
    expect(cropChipLabel(OKRA)).toBe('Okra');
  });

  it('BR-59r: loading, error, empty and denied are four different states', () => {
    const base = { canBrowse: true, isPending: false, error: null as unknown, optionCount: 3 };
    expect(cropPickerState(base)).toBe('ready');
    expect(cropPickerState({ ...base, isPending: true })).toBe('loading');
    expect(cropPickerState({ ...base, error: new Error('boom') })).toBe('error');
    expect(cropPickerState({ ...base, optionCount: 0 })).toBe('empty');
    expect(cropPickerState({ ...base, canBrowse: false })).toBe('denied');
    // A request that was never made is not "loading" and its absence is not "empty".
    expect(cropPickerState({ ...base, canBrowse: false, isPending: true, optionCount: 0 })).toBe('denied');
  });

  it('BR-59r: a crop already tagged but missing from the list is still an option, once', () => {
    const merged = mergeCropOptions([BRINJAL, OKRA], [GINGER, BRINJAL]);
    expect(merged.map((c) => c.id)).toEqual([BRINJAL.id, OKRA.id, GINGER.id]);
  });

  it('BR-59r: the builders send cropIds only when told to, deduplicated, and [] is sent as []', () => {
    const article = { title: 'T', summary: '', body: 'B', category: 'Soil', readTime: '1 min', author: 'A' };
    const video = { title: 'T', description: '', videoUrl: 'https://v.example/x', duration: '1:00', language: 'English', author: 'A' };
    const plain = buildArticleBody(article);
    expect(plain.ok && 'cropIds' in plain.body).toBe(false);
    const tagged = buildArticleBody({ ...article, cropIds: [BRINJAL.id, BRINJAL.id, OKRA.id] });
    expect(tagged.ok && tagged.body.cropIds).toEqual([BRINJAL.id, OKRA.id]);
    const cleared = buildArticleUpdateBody({ ...article, cropIds: [] });
    expect(cleared.ok && cleared.body.cropIds).toEqual([]);
    const untouched = buildArticleUpdateBody(article);
    expect(untouched.ok && 'cropIds' in untouched.body).toBe(false);
    const vTagged = buildVideoBody({ ...video, cropIds: [GINGER.id] });
    expect(vTagged.ok && vTagged.body.cropIds).toEqual([GINGER.id]);
    const vCleared = buildVideoUpdateBody({ ...video, cropIds: [] });
    expect(vCleared.ok && vCleared.body.cropIds).toEqual([]);
    const vUntouched = buildVideoUpdateBody(video);
    expect(vUntouched.ok && 'cropIds' in vUntouched.body).toBe(false);
  });
});

// ─── Options come from the fetched list ──────────────────────────────────────

describe('BR-59r the chip options are the fetched crop list', () => {
  it('BR-59r: the article form offers exactly the fetched crops and none of the six it used to invent', () => {
    setup();
    const tree = renderTree(createArticle());
    for (const c of CATALOGUE) expect(has(tree, chipId(c.id))).toBe(true);
    const text = textOf(tree.toJSON());
    expect(text).toContain('Brinjal · கத்தரிக்காய்');
    expect(text).toContain('Okra');
    for (const invented of ['Tomato', 'Beans', 'Cabbage', 'Carrot', 'Potato', 'Garlic']) {
      expect(text).not.toContain(invented);
    }
  });

  it('BR-59r: the video form offers the fetched crops too', () => {
    setup(cropList([GINGER]));
    const tree = renderTree(<AddVideoScreen onBack={noop} can={both} />);
    expect(has(tree, chipId(GINGER.id))).toBe(true);
    expect(has(tree, chipId(BRINJAL.id))).toBe(false);
    expect(textOf(tree.toJSON())).toContain('Ginger · இஞ்சி');
  });

  it('BR-59r: the crop list is requested only for an admin who may browse it', () => {
    setup();
    renderTree(createArticle(both));
    expect(produce.useCropMasterList.mock.calls.at(-1)?.[0]).toMatchObject({ enabled: true });
    renderTree(createArticle(contentOnly));
    expect(produce.useCropMasterList.mock.calls.at(-1)?.[0]).toMatchObject({ enabled: false });
  });

  it('BR-59r: no screen file still declares the invented AVAILABLE_CROPS array', () => {
    for (const file of ['CreateContentScreen.tsx', 'AddVideoScreen.tsx']) {
      const source = fs.readFileSync(path.join(__dirname, '../screens/community', file), 'utf8');
      expect(source).not.toContain('AVAILABLE_CROPS');
    }
  });
});

// ─── Create sends cropIds ────────────────────────────────────────────────────

describe('BR-59r a selection is sent as cropIds', () => {
  it('BR-59r: creating an article sends the selected crop ids', () => {
    const writes = setup();
    const tree = renderTree(createArticle());
    type(tree, 'community.createContent.readTime', '4 min read');
    press(tree, chipId(BRINJAL.id));
    press(tree, chipId(GINGER.id));
    press(tree, chipId(OKRA.id));
    press(tree, chipId(OKRA.id)); // toggled off again
    press(tree, 'community.createContent.publish');
    expect(bodyOf(writes.createArticle.mutate)['cropIds']).toEqual([BRINJAL.id, GINGER.id]);
  });

  it('BR-59r: creating an article with no crop selected sends no cropIds at all', () => {
    const writes = setup();
    const tree = renderTree(createArticle());
    type(tree, 'community.createContent.readTime', '4 min read');
    press(tree, 'community.createContent.publish');
    expect('cropIds' in bodyOf(writes.createArticle.mutate)).toBe(false);
  });

  it('BR-59r: creating a video sends the selected crop ids', () => {
    const writes = setup();
    const tree = renderTree(<AddVideoScreen onBack={noop} can={both} />);
    type(tree, 'community.addVideo.title', 'Drip irrigation');
    type(tree, 'community.addVideo.link', 'https://video.example.org/drip');
    type(tree, 'community.addVideo.duration', '8:20');
    press(tree, 'community.addVideo.language.English');
    press(tree, chipId(OKRA.id));
    press(tree, 'community.addVideo.publish');
    expect(bodyOf(writes.createVideo.mutate)['cropIds']).toEqual([OKRA.id]);
  });
});

// ─── Edit does not clear tags ────────────────────────────────────────────────

describe('BR-59r editing does not silently clear tags', () => {
  it('BR-59r: an article edit prefills its chips from the item’s crops', () => {
    setup();
    const tree = renderTree(editArticle([BRINJAL, GINGER]));
    expect(isSelected(tree, BRINJAL.id)).toBe(true);
    expect(isSelected(tree, GINGER.id)).toBe(true);
    expect(isSelected(tree, OKRA.id)).toBe(false);
  });

  it('BR-59r: saving an article edit without touching the crops omits cropIds, so the tags stay', () => {
    const writes = setup();
    const tree = renderTree(editArticle([BRINJAL, GINGER]));
    type(tree, 'community.createContent.title', 'Composting, revised');
    press(tree, 'community.createContent.publish');
    expect('cropIds' in bodyOf(writes.updateArticle.mutate)).toBe(false);
  });

  it('BR-59r: changing the selection on an article edit sends the whole new set, and clearing sends []', () => {
    const writes = setup();
    const tree = renderTree(editArticle([BRINJAL, GINGER]));
    press(tree, chipId(GINGER.id));
    press(tree, chipId(OKRA.id));
    press(tree, 'community.createContent.publish');
    expect(bodyOf(writes.updateArticle.mutate)['cropIds']).toEqual([BRINJAL.id, OKRA.id]);

    const w2 = setup();
    const t2 = renderTree(editArticle([BRINJAL]));
    press(t2, chipId(BRINJAL.id));
    press(t2, 'community.createContent.publish');
    expect(bodyOf(w2.updateArticle.mutate)['cropIds']).toEqual([]);
  });

  it('BR-59r: a tagged crop the list does not return is still shown selected and can be un-tagged', () => {
    const writes = setup(cropList([OKRA]));
    const tree = renderTree(editArticle([GINGER]));
    expect(isSelected(tree, GINGER.id)).toBe(true);
    press(tree, chipId(GINGER.id));
    press(tree, 'community.createContent.publish');
    expect(bodyOf(writes.updateArticle.mutate)['cropIds']).toEqual([]);
  });

  it('BR-59r: a video edit prefills, omits cropIds untouched, and sends the new set when changed', () => {
    const writes = setup();
    const tree = renderTree(editVideo([OKRA]));
    expect(isSelected(tree, OKRA.id)).toBe(true);
    type(tree, 'community.addVideo.title', 'Drip irrigation, revised');
    press(tree, 'community.addVideo.publish');
    expect('cropIds' in bodyOf(writes.updateVideo.mutate)).toBe(false);

    const w2 = setup();
    const t2 = renderTree(editVideo([OKRA]));
    press(t2, chipId(BRINJAL.id));
    press(t2, 'community.addVideo.publish');
    expect(bodyOf(w2.updateVideo.mutate)['cropIds']).toEqual([OKRA.id, BRINJAL.id]);
  });
});

// ─── Unavailable states ──────────────────────────────────────────────────────

describe('BR-59r the picker says why it is unavailable', () => {
  it('BR-59r: without admin.crop_taxonomy.manage the picker is a disabled note, not an empty chip row, and nothing is fetched', () => {
    setup();
    const tree = renderTree(createArticle(contentOnly));
    expect(noteText(tree)).toEqual([en['community.crops.denied']]);
    // The designed element stays: one inert dash chip, no real chips.
    const none = tree.root.findByProps({ testID: 'community.cropPicker.none' });
    expect(none.props.disabled).toBe(true);
    expect(textOf(tree.toJSON())).toContain(ADMIN_NO_VALUE);
    for (const c of CATALOGUE) expect(has(tree, chipId(c.id))).toBe(false);
    expect(produce.useCropMasterList.mock.calls.at(-1)?.[0]).toMatchObject({ enabled: false });
  });

  it('BR-59r: when the crop list cannot be browsed, an edit still shows its tags read-only and does not send or clear them', () => {
    const writes = setup();
    const tree = renderTree(editArticle([BRINJAL, GINGER], contentOnly));
    const chip = tree.root.findByProps({ testID: chipId(BRINJAL.id) });
    expect(chip.props.disabled).toBe(true);
    expect(chip.props.accessibilityState.selected).toBe(true);
    expect(has(tree, 'community.cropPicker.none')).toBe(false);
    expect(noteText(tree)).toEqual([en['community.crops.denied']]);
    type(tree, 'community.createContent.title', 'Composting, revised');
    press(tree, 'community.createContent.publish');
    expect('cropIds' in bodyOf(writes.updateArticle.mutate)).toBe(false);
  });

  it('BR-59r: a failed crop fetch shows an error with Retry, no chips, and an edit still sends no cropIds', () => {
    const refetch = vi.fn();
    const writes = setup({ data: undefined, error: new Error('boom'), isPending: false, refetch });
    const tree = renderTree(editArticle([BRINJAL]));
    expect(noteText(tree)).toEqual([en['community.crops.error']]);
    expect(has(tree, chipId(OKRA.id))).toBe(false);
    expect(tree.root.findByProps({ testID: chipId(BRINJAL.id) }).props.disabled).toBe(true);
    press(tree, 'community.cropPicker.retry');
    expect(refetch).toHaveBeenCalledTimes(1);
    press(tree, 'community.createContent.publish');
    expect('cropIds' in bodyOf(writes.updateArticle.mutate)).toBe(false);
  });

  it('BR-59r: a crop fetch still in flight says loading, with no chips and no "no crops" message', () => {
    setup({ data: undefined, error: null, isPending: true, refetch: vi.fn() });
    const tree = renderTree(<AddVideoScreen onBack={noop} can={both} />);
    expect(noteText(tree)).toEqual([en['community.crops.loading']]);
    expect(has(tree, 'community.cropPicker.retry')).toBe(false);
    expect(textOf(tree.toJSON())).not.toContain(en['community.crops.empty']);
  });

  it('BR-59r: a crop list that is genuinely empty says so, which is not the loading, error or denied message', () => {
    setup(cropList([]));
    const tree = renderTree(createArticle());
    expect(noteText(tree)).toEqual([en['community.crops.empty']]);
    const notes = new Set([
      en['community.crops.empty'],
      en['community.crops.loading'],
      en['community.crops.error'],
      en['community.crops.denied'],
    ]);
    expect(notes.size).toBe(4);
  });

  it('BR-59r: the same four states render on the video form', () => {
    setup(cropList([]));
    expect(noteText(renderTree(<AddVideoScreen onBack={noop} can={both} />))).toEqual([en['community.crops.empty']]);
    setup({ data: undefined, error: new Error('boom'), isPending: false, refetch: vi.fn() });
    expect(noteText(renderTree(<AddVideoScreen onBack={noop} can={both} />))).toEqual([en['community.crops.error']]);
    setup();
    expect(noteText(renderTree(<AddVideoScreen onBack={noop} can={contentOnly} />))).toEqual([en['community.crops.denied']]);
  });

  it('BR-59r: a ready picker shows no note at all', () => {
    setup();
    const tree = renderTree(createArticle());
    expect(has(tree, 'community.cropPicker.note')).toBe(false);
  });
});
