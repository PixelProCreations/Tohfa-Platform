/**
 * Community & Knowledge READ screens rendered with react-test-renderer against
 * mocked learning hooks (the hooks themselves are covered by the api tests).
 *
 * What is pinned here:
 *   - live rows only: the demo communities, groups, library items and message
 *     threads these screens used to ship are gone and must not come back;
 *   - a sub-count renders the em-dash while pages remain, rather than a number
 *     taken from the first page;
 *   - the three async states are distinct: an empty result does not look like
 *     a failure, and a failure does not render as an empty list;
 *   - the designed elements with no endpoint behind them are still drawn.
 */
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import type { LearningArticleDto, LearningGroupDto, LearningVideoDto } from '../api/learning';

const alertSpy = vi.hoisted(() => vi.fn());

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: (...args: unknown[]) => alertSpy(...args) },
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
  useLearningArticles: vi.fn(),
  useLearningVideos: vi.fn(),
  useLearningTrainings: vi.fn(),
  useLearningGroups: vi.fn(),
  useLearningHubArticles: vi.fn(),
  useLearningArticle: vi.fn(),
  useLearningVideo: vi.fn(),
  useLearningTraining: vi.fn(),
  useLearningGroup: vi.fn(),
  useUpdateLearningArticle: vi.fn(),
  useUpdateLearningVideo: vi.fn(),
  useUpdateLearningTraining: vi.fn(),
  useCreateLearningArticle: vi.fn(),
  useCreateLearningVideo: vi.fn(),
  useCreateLearningGroup: vi.fn(),
  useUpdateLearningGroup: vi.fn(),
  useSubmitLearningForReview: vi.fn(),
  useReviewLearningContent: vi.fn(),
}));
vi.mock('../api/learningHooks', () => hooks);

// The wired community, Q&A and announcement hooks (BR-59s, BR-59u, BR-213). The
// screens in this file either do not reach them or want them quiet; the wired
// behaviour itself is pinned in community_wiring_screens.test.tsx.
const quiet = vi.hoisted(() => {
  const list = () => ({
    items: [],
    total: 0,
    allPagesLoaded: true,
    loadMore: () => undefined,
    hasMore: false,
    isLoading: false,
    error: null,
    refresh: () => undefined,
    isRefreshing: false,
  });
  const query = () => ({ data: undefined, error: null, isPending: false, refetch: () => undefined });
  const write = () => ({ mutate: () => undefined, isPending: false, error: null });
  return { list, query, write };
});
vi.mock('../api/communitiesHooks', () => ({
  useCommunities: () => quiet.list(),
  useCommunity: () => quiet.query(),
  useCommunityGroups: () => quiet.list(),
  useCommunityMembers: () => quiet.list(),
  useCreateCommunity: () => quiet.write(),
  useUpdateCommunity: () => quiet.write(),
  useArchiveCommunity: () => quiet.write(),
}));
vi.mock('../api/qaHooks', () => ({
  useAdminQaQuestions: () => quiet.list(),
  useAdminQaQuestion: () => quiet.query(),
  usePostAdminQaAnswer: () => quiet.write(),
  useModerateAdminQaQuestion: () => quiet.write(),
  useAskAdminQaQuestion: () => quiet.write(),
}));
vi.mock('../api/announcementsHooks', () => ({ useCreateAdminAnnouncement: () => quiet.write() }));

const profile = vi.hoisted(() => ({ useMyAdminAccount: vi.fn() }));
vi.mock('../api/profileHooks', () => profile);

// The forms' "Related crops" picker reads the crop list (BR-59r); the picker
// itself is covered by community_crops.test.tsx, here it just has a list.
vi.mock('../api/produceHooks', () => ({
  useCropMasterList: () => ({ data: { items: [] }, error: null, isPending: false, refetch: () => undefined }),
}));

import { CommunitiesListScreen } from '../screens/community/CommunitiesListScreen';
import { CommunityKnowledgeHomeScreen } from '../screens/community/CommunityKnowledgeHomeScreen';
import { ContentItemDetailScreen } from '../screens/community/ContentItemDetailScreen';
import { ContentPendingReviewScreen } from '../screens/community/ContentPendingReviewScreen';
import { GroupsListScreen } from '../screens/community/GroupsListScreen';
import { ArticleDetailsScreen } from '../screens/community/ArticleDetailsScreen';
import { AddVideoScreen } from '../screens/community/AddVideoScreen';
import { CommunityDetailsScreen } from '../screens/community/CommunityDetailsScreen';
import { CreateContentScreen } from '../screens/community/CreateContentScreen';
import { CreateGroupScreen } from '../screens/community/CreateGroupScreen';
import { QuestionAnswerChatScreen } from '../screens/community/QuestionAnswerChatScreen';
import { buildArticleBody, buildGroupBody, buildVideoBody, editRouteOf } from '../screens/community/communityLogic';
import { makeCan } from '../permissions/can';
import { LEARNING_MANAGE } from '../screens/community/communityLogic';
import { en } from '../i18n';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ADMIN_NO_VALUE } from '../utils/noValue';

const DASH = ADMIN_NO_VALUE;
const admin = makeCan([LEARNING_MANAGE]);

function group(over: Partial<LearningGroupDto> = {}): LearningGroupDto {
  return {
    id: 'grp-1',
    name: 'Tomato Growers Circle',
    description: null,
    category: 'Crops',
    memberCount: 24,
    isArchived: false,
    archivedAt: null,
    createdAt: '2026-10-10T03:30:00.000Z',
    updatedAt: '2026-10-10T03:30:00.000Z',
    ...over,
  };
}

interface NumberedOver<T> {
  items?: T[];
  total?: number | undefined;
  allPagesLoaded?: boolean;
  hasMore?: boolean;
  isLoading?: boolean;
  error?: unknown;
}

function numberedList<T>(over: NumberedOver<T> = {}) {
  return {
    items: over.items ?? [],
    total: over.total,
    allPagesLoaded: over.allPagesLoaded ?? true,
    loadMore: vi.fn(),
    hasMore: over.hasMore ?? false,
    isLoading: over.isLoading ?? false,
    error: over.error ?? null,
    refresh: vi.fn(),
    isRefreshing: false,
  };
}

function emptyQuery() {
  return { data: undefined, error: null, isPending: false, refetch: vi.fn() };
}

function setLists(over: NumberedOver<LearningGroupDto> = {}) {
  hooks.useSubmitLearningForReview.mockReturnValue({ mutate: vi.fn(), isPending: false, error: null });
  hooks.useReviewLearningContent.mockReturnValue({ mutate: vi.fn(), isPending: false, error: null });
  hooks.useLearningGroups.mockReturnValue(numberedList(over));
  hooks.useLearningArticles.mockReturnValue(numberedList());
  hooks.useLearningVideos.mockReturnValue(numberedList());
  hooks.useLearningTrainings.mockReturnValue(numberedList());
  hooks.useLearningArticle.mockReturnValue(emptyQuery());
  hooks.useLearningVideo.mockReturnValue(emptyQuery());
  hooks.useLearningTraining.mockReturnValue(emptyQuery());
  hooks.useLearningGroup.mockReturnValue(emptyQuery());
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

function render(element: React.ReactElement): string[] {
  return textOf(renderTree(element).toJSON());
}

describe('GroupsListScreen', () => {
  it('renders live groups and never the demo fixtures it used to ship', () => {
    setLists({ items: [group()], total: 1 });
    const text = render(<GroupsListScreen onBack={() => undefined} can={admin} />);
    expect(text).toContain('Tomato Growers Circle');
    expect(text.join(' ')).not.toContain('Nilgiris Coffee Planters');
    expect(text.join(' ')).not.toContain('Nilgiris Organic Growers');
  });

  it("shows the server's total, not a count of the loaded rows", () => {
    setLists({ items: [group()], total: 7, hasMore: true });
    const text = render(<GroupsListScreen onBack={() => undefined} can={admin} />);
    expect(text).toContain(en['community.groups.count'].replace('{{total}}', '7'));
  });

  it('dashes the community a group row has no field for', () => {
    setLists({ items: [group()], total: 1 });
    const text = render(<GroupsListScreen onBack={() => undefined} can={admin} />);
    expect(text).toContain(`${DASH} · 24 farmers`);
  });

  it('tells loading, error and empty apart', () => {
    setLists({ isLoading: true });
    expect(render(<GroupsListScreen onBack={() => undefined} can={admin} />)).toContain(en['async.loading']);

    setLists({ error: new Error('boom') });
    const failed = render(<GroupsListScreen onBack={() => undefined} can={admin} />);
    expect(failed).toContain(en['async.error.title']);
    expect(failed).not.toContain(en['community.empty.groups']);

    setLists({ total: 0 });
    const empty = render(<GroupsListScreen onBack={() => undefined} can={admin} />);
    expect(empty).toContain(en['community.empty.groups']);
    expect(empty).not.toContain(en['async.error.title']);
  });

  it('fails closed without the permission and does not request anything', () => {
    setLists({ items: [group()], total: 1 });
    const text = render(<GroupsListScreen onBack={() => undefined} can={makeCan([])} />);
    expect(text).toContain(en['community.denied.title']);
    expect(hooks.useLearningGroups).toHaveBeenCalledWith(expect.anything(), { enabled: false });
  });
});

describe('CommunityKnowledgeHomeScreen', () => {
  const noop = () => undefined;

  it('renders the active sub-count as a DASH while pages remain', () => {
    // The server says 8 groups exist; only the first page is loaded.
    setLists({ items: [group(), group({ id: 'g2' })], total: 8, allPagesLoaded: false, hasMore: true });
    const text = render(<CommunityKnowledgeHomeScreen onNavigateCreateContent={noop} can={admin} />);
    expect(text).toContain(`8 (${DASH} active)`);
    expect(text.join(' ')).not.toContain('8 (2 active)');
  });

  it('states the sub-count once every page is in', () => {
    setLists({ items: [group(), group({ id: 'g2', isArchived: true })], total: 2, allPagesLoaded: true });
    const text = render(<CommunityKnowledgeHomeScreen onNavigateCreateContent={noop} can={admin} />);
    expect(text).toContain('2 (1 active)');
  });

  it('keeps every designed tile and dashes the ones with no endpoint', () => {
    setLists({ items: [group()], total: 1 });
    const text = render(<CommunityKnowledgeHomeScreen onNavigateCreateContent={noop} can={admin} />);
    // The tiles themselves are still drawn.
    for (const title of ['Communities', 'Announcements', 'Discussions', 'Open reports', 'Pending review', 'Unverified crop content']) {
      expect(text).toContain(title);
    }
    // ...and none of the demo numbers survived.
    expect(text.join(' ')).not.toContain('5 (4 active)');
    expect(text.join(' ')).not.toContain('Tomato leaf curl management');
    expect(text.join(' ')).not.toContain('214 views');
    // Announcements, Open reports, Unverified crop content, growth and Most viewed.
    expect(text.filter((s) => s === DASH).length).toBeGreaterThanOrEqual(5);
  });

  it('does not invent a growth figure or an activity feed', () => {
    setLists({ total: 0 });
    const text = render(<CommunityKnowledgeHomeScreen onNavigateCreateContent={noop} can={admin} />);
    expect(text).toContain('Community growth (30 days)');
    expect(text).toContain(en['community.gap.activity.title']);
    expect(text.join(' ')).not.toContain('Demo TOHFA Admin');
  });
});

/**
 * The content detail footer. What is pinned: the two buttons that used to
 * raise a success alert while sending nothing now either send a real PATCH or
 * say they cannot, and the sections that belong to one resource are not drawn
 * on another.
 */
describe('ContentItemDetailScreen', () => {
  const noop = () => undefined;

  function articleDto(over: Partial<LearningArticleDto> = {}): LearningArticleDto {
    return {
      id: 'art-1',
      title: 'Mulching for water retention',
      snippet: 'Keep the soil covered.',
      content: 'The whole article, several paragraphs long.',
      readTime: '4 min read',
      author: 'Demo TOHFA Admin',
      tag: 'Guide',
      language: 'en',
      isPublished: false,
      crops: [],
      createdAt: '2026-10-10T03:30:00.000Z',
      updatedAt: '2026-10-10T03:30:00.000Z',
      ...over,
    };
  }

  function videoDto(over: Partial<LearningVideoDto> = {}): LearningVideoDto {
    return {
      id: 'vid-1',
      title: 'Organic practices',
      description: 'A demonstration.',
      videoUrl: 'https://video.example.org/organic',
      duration: '6:10',
      author: 'Demo TOHFA Admin',
      language: 'en',
      isFeatured: false,
      isPublished: true,
      crops: [],
      createdAt: '2026-10-10T03:30:00.000Z',
      updatedAt: '2026-10-10T03:30:00.000Z',
      ...over,
    };
  }

  function loadedQuery(data: unknown) {
    return { data, error: null, isPending: false, refetch: vi.fn() };
  }

  function mutation() {
    return { mutate: vi.fn(), isPending: false, error: null };
  }

  interface Writes {
    article: ReturnType<typeof mutation>;
    video: ReturnType<typeof mutation>;
    training: ReturnType<typeof mutation>;
  }

  function setItem(kind: 'article' | 'video', dto: unknown): Writes {
    setLists();
    if (kind === 'article') hooks.useLearningArticle.mockReturnValue(loadedQuery(dto));
    else hooks.useLearningVideo.mockReturnValue(loadedQuery(dto));
    const writes: Writes = { article: mutation(), video: mutation(), training: mutation() };
    hooks.useUpdateLearningArticle.mockReturnValue(writes.article);
    hooks.useUpdateLearningVideo.mockReturnValue(writes.video);
    hooks.useUpdateLearningTraining.mockReturnValue(writes.training);
    return writes;
  }

  function detail(kind: 'article' | 'video', id = kind === 'article' ? 'art-1' : 'vid-1') {
    return (
      <ContentItemDetailScreen onBack={noop} role="SUPER_ADMIN" contentKind={kind} contentId={id} can={admin} />
    );
  }

  it('BR-59l: offers Publish for a draft and Unpublish for a published item', () => {
    setItem('article', articleDto({ isPublished: false }));
    expect(render(detail('article'))).toContain(en['community.action.publish']);

    setItem('video', videoDto({ isPublished: true }));
    const published = render(detail('video'));
    expect(published).toContain(en['community.action.unpublish']);
    expect(published).not.toContain(en['community.action.publish']);
  });

  it('BR-59d: publishing sends the PATCH for the item’s own resource', () => {
    const writes = setItem('article', articleDto({ isPublished: false }));
    const tree = renderTree(detail('article'));
    act(() => {
      tree.root.findByProps({ testID: 'community.contentItem.publish' }).props.onPress();
    });
    expect(writes.article.mutate).toHaveBeenCalledWith(
      { id: 'art-1', body: { isPublished: true } },
      expect.anything(),
    );
    expect(writes.video.mutate).not.toHaveBeenCalled();
    expect(writes.training.mutate).not.toHaveBeenCalled();
  });

  it('BR-59d: Edit hands the opened item to the parent, so the form edits it instead of starting blank', () => {
    setItem('article', articleDto());
    const onEdit = vi.fn();
    const tree = renderTree(
      <ContentItemDetailScreen onBack={noop} role="SUPER_ADMIN" contentKind="article" contentId="art-1" can={admin} onNavigateEditContent={onEdit} />,
    );
    act(() => {
      tree.root.findByProps({ testID: 'community.contentItem.edit' }).props.onPress();
    });
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit.mock.calls[0]?.[0]).toMatchObject({ kind: 'article', dto: { id: 'art-1' } });
  });

  it('BR-59d: Edit is disabled when no item is open or the kind has no edit form', () => {
    setItem('article', articleDto());
    const onEdit = vi.fn();
    const none = renderTree(
      <ContentItemDetailScreen onBack={noop} role="SUPER_ADMIN" can={admin} onNavigateEditContent={onEdit} />,
    );
    expect(none.root.findByProps({ testID: 'community.contentItem.edit' }).props.disabled).toBe(true);
    const training = renderTree(
      <ContentItemDetailScreen onBack={noop} role="SUPER_ADMIN" contentKind="training" contentId="trn-1" can={admin} onNavigateEditContent={onEdit} />,
    );
    expect(training.root.findByProps({ testID: 'community.contentItem.edit' }).props.disabled).toBe(true);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('disables the action when the published flag is absent rather than assuming a draft', () => {
    const writes = setItem('article', { ...articleDto(), isPublished: undefined });
    const tree = renderTree(detail('article'));
    const button = tree.root.findByProps({ testID: 'community.contentItem.publish' });
    expect(button.props.disabled).toBe(true);
    act(() => {
      button.props.onPress();
    });
    expect(writes.article.mutate).not.toHaveBeenCalled();
    expect(textOf(tree.toJSON())).toContain(en['community.gap.publish.unknown']);
  });

  it('keeps the review button visible, disabled, and firing no mutation when the server sent no review status', () => {
    // BR-59t: absent is not NOT_SUBMITTED, so nothing is offered to send.
    const writes = setItem('article', articleDto());
    const tree = renderTree(detail('article'));
    const approval = tree.root.findByProps({ testID: 'community.contentItem.approval' });
    expect(approval.props.disabled).toBe(true);
    expect(approval.props.onPress).toBeUndefined();
    expect(textOf(tree.toJSON())).toContain(en['community.action.review']);
    expect(writes.article.mutate).not.toHaveBeenCalled();
    expect(writes.video.mutate).not.toHaveBeenCalled();
  });

  it('shows the server’s failure instead of a success message', () => {
    const writes = setItem('article', articleDto());
    writes.article.error = new Error('boom') as never;
    const text = render(detail('article'));
    expect(text).toContain(en['admin.error.generic']);
  });

  it('BR-59m: renders the full article body, and a dash when the detail carried none', () => {
    setItem('article', articleDto());
    const text = render(detail('article'));
    expect(text).toContain(en['community.section.body']);
    expect(text).toContain('The whole article, several paragraphs long.');

    setItem('article', { ...articleDto(), content: undefined });
    const noBody = render(detail('article'));
    expect(noBody).toContain(en['community.section.body']);
    expect(noBody).toContain(DASH);
  });

  it('draws the Video section for a video and not for an article', () => {
    setItem('video', videoDto());
    const video = render(detail('video'));
    expect(video).toContain(en['community.section.video']);
    expect(video).toContain('6:10');

    setItem('article', articleDto());
    expect(render(detail('article'))).not.toContain(en['community.section.video']);
  });
});

describe('CommunitiesListScreen', () => {
  it('shows no demo rows: without the permission it requests nothing and says the module is unavailable', () => {
    setLists();
    const text = render(<CommunitiesListScreen onBack={() => undefined} />);
    expect(text).toContain(en['community.denied.title']);
    expect(text.join(' ')).not.toContain('Nilgiris Organic Growers (demo)');
    expect(text.join(' ')).not.toContain('142 members');
  });
});

/**
 * The same contract as ContentItemDetailScreen's footer, on the screen next
 * door: its Publish used to set local state and raise a success alert without
 * sending anything at all, and its Pending button did nothing while looking
 * like it would.
 */
describe('ContentPendingReviewScreen', () => {
  const noop = () => undefined;

  function pendingArticle(over: Partial<LearningArticleDto> = {}): LearningArticleDto {
    return {
      id: 'art-9',
      title: 'Composting basics',
      snippet: 'Start with green and brown layers.',
      content: 'The whole article.',
      readTime: '5 min read',
      author: 'Demo TOHFA Admin',
      tag: 'Guide',
      language: 'en',
      isPublished: false,
      crops: [],
      createdAt: '2026-10-10T03:30:00.000Z',
      updatedAt: '2026-10-10T03:30:00.000Z',
      ...over,
    };
  }

  function pendingVideo(over: Partial<LearningVideoDto> = {}): LearningVideoDto {
    return {
      id: 'vid-9',
      title: 'Drip irrigation',
      description: 'A walkthrough.',
      videoUrl: 'https://video.example.org/drip',
      duration: '8:20',
      author: 'Demo TOHFA Admin',
      language: 'en',
      isFeatured: false,
      isPublished: true,
      crops: [],
      createdAt: '2026-10-10T03:30:00.000Z',
      updatedAt: '2026-10-10T03:30:00.000Z',
      ...over,
    };
  }

  function writeMock() {
    return { mutate: vi.fn(), isPending: false, error: null };
  }

  interface PendingWrites {
    article: ReturnType<typeof writeMock>;
    video: ReturnType<typeof writeMock>;
    training: ReturnType<typeof writeMock>;
  }

  function setPendingItem(kind: 'article' | 'video', dto: unknown): PendingWrites {
    setLists();
    const loaded = { data: dto, error: null, isPending: false, refetch: vi.fn() };
    if (kind === 'article') hooks.useLearningArticle.mockReturnValue(loaded);
    else hooks.useLearningVideo.mockReturnValue(loaded);
    const writes: PendingWrites = { article: writeMock(), video: writeMock(), training: writeMock() };
    hooks.useUpdateLearningArticle.mockReturnValue(writes.article);
    hooks.useUpdateLearningVideo.mockReturnValue(writes.video);
    hooks.useUpdateLearningTraining.mockReturnValue(writes.training);
    return writes;
  }

  function review(kind: 'article' | 'video', onPublishSuccess: () => void = noop) {
    return (
      <ContentPendingReviewScreen
        onBack={noop}
        can={admin}
        contentKind={kind}
        contentId={kind === 'article' ? 'art-9' : 'vid-9'}
        onPublishSuccess={onPublishSuccess}
      />
    );
  }

  it('BR-59d: publishing sends the PATCH for the item’s own resource and no other', () => {
    const writes = setPendingItem('article', pendingArticle({ isPublished: false }));
    const tree = renderTree(review('article'));
    act(() => {
      tree.root.findByProps({ testID: 'community.pendingReview.publish' }).props.onPress();
    });
    expect(writes.article.mutate).toHaveBeenCalledWith({ id: 'art-9', body: { isPublished: true } }, expect.anything());
    expect(writes.video.mutate).not.toHaveBeenCalled();
    expect(writes.training.mutate).not.toHaveBeenCalled();
  });

  it('BR-59d: reports success, and tells the parent, only once the mutation has settled', () => {
    const onPublishSuccess = vi.fn();
    const writes = setPendingItem('article', pendingArticle({ isPublished: false }));
    const tree = renderTree(review('article', onPublishSuccess));
    act(() => {
      tree.root.findByProps({ testID: 'community.pendingReview.publish' }).props.onPress();
    });
    // The press alone proves nothing: a request was sent, not answered.
    expect(onPublishSuccess).not.toHaveBeenCalled();
    const handlers = writes.article.mutate.mock.calls[0]?.[1] as { onSuccess: () => void };
    act(() => {
      handlers.onSuccess();
    });
    expect(onPublishSuccess).toHaveBeenCalledTimes(1);
  });

  it('BR-59l: offers Unpublish for a published item and Publish for a draft', () => {
    setPendingItem('article', pendingArticle({ isPublished: false }));
    expect(render(review('article'))).toContain(en['community.action.publish']);

    setPendingItem('video', pendingVideo({ isPublished: true }));
    const published = render(review('video'));
    expect(published).toContain(en['community.action.unpublish']);
    expect(published).not.toContain(en['community.action.publish']);
  });

  it('BR-59d: Edit hands the opened item to the parent, so the form edits it instead of starting blank', () => {
    setPendingItem('article', pendingArticle());
    const onEdit = vi.fn();
    const tree = renderTree(
      <ContentPendingReviewScreen onBack={noop} can={admin} contentKind="article" contentId="art-9" onNavigateEditContent={onEdit} />,
    );
    act(() => {
      tree.root.findByProps({ testID: 'community.pendingReview.edit' }).props.onPress();
    });
    expect(onEdit.mock.calls[0]?.[0]).toMatchObject({ kind: 'article', dto: { id: 'art-9' } });
  });

  it('BR-59d: Edit is disabled when no item is open', () => {
    setPendingItem('article', pendingArticle());
    const onEdit = vi.fn();
    const tree = renderTree(<ContentPendingReviewScreen onBack={noop} can={admin} onNavigateEditContent={onEdit} />);
    expect(tree.root.findByProps({ testID: 'community.pendingReview.edit' }).props.disabled).toBe(true);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('disables the action when the published flag is absent rather than assuming a draft', () => {
    const writes = setPendingItem('article', { ...pendingArticle(), isPublished: undefined });
    const tree = renderTree(review('article'));
    const button = tree.root.findByProps({ testID: 'community.pendingReview.publish' });
    expect(button.props.disabled).toBe(true);
    act(() => {
      button.props.onPress();
    });
    expect(writes.article.mutate).not.toHaveBeenCalled();
    expect(textOf(tree.toJSON())).toContain(en['community.gap.publish.unknown']);
  });

  it('keeps the review button visible, disabled, and firing no mutation when the server sent no review status', () => {
    const writes = setPendingItem('article', pendingArticle());
    const tree = renderTree(review('article'));
    const pending = tree.root.findByProps({ testID: 'community.pendingReview.pending' });
    expect(pending.props.disabled).toBe(true);
    expect(pending.props.onPress).toBeUndefined();
    expect(textOf(tree.toJSON())).toContain(en['community.action.review']);
    expect(writes.article.mutate).not.toHaveBeenCalled();
    expect(writes.video.mutate).not.toHaveBeenCalled();
    expect(writes.training.mutate).not.toHaveBeenCalled();
  });

  it('shows the server’s failure instead of a success message', () => {
    const writes = setPendingItem('article', pendingArticle());
    writes.article.error = new Error('boom') as never;
    const text = render(review('article'));
    expect(text).toContain(en['admin.error.generic']);
    expect(text).not.toContain(en['community.publish.success.title']);
    expect(text).not.toContain(en['community.publish.published']);
  });
});


// ─── Writes ──────────────────────────────────────────────────────────────────

/**
 * The create / edit screens. The contract pinned here: a save sends the right
 * POST or PATCH, and the success message exists only inside the mutation's
 * onSuccess; a failure shows the server's error and never a success message;
 * a control with no endpoint behind it is visible, disabled, and has no onPress.
 */
describe('community writes', () => {
  const noop = () => undefined;

  function write() {
    return { mutate: vi.fn(), isPending: false, error: null as unknown };
  }

  function press(tree: renderer.ReactTestRenderer, testID: string) {
    act(() => {
      tree.root.findByProps({ testID }).props.onPress();
    });
  }

  function type(tree: renderer.ReactTestRenderer, testID: string, value: string) {
    act(() => {
      tree.root.findByProps({ testID }).props.onChangeText(value);
    });
  }

  function expectUnavailable(tree: renderer.ReactTestRenderer, testID: string) {
    const control = tree.root.findByProps({ testID });
    expect(control.props.disabled).toBe(true);
    expect(control.props.onPress).toBeUndefined();
    expect(control.props.accessibilityState).toMatchObject({ disabled: true });
  }

  function onSuccessOf(mutate: ReturnType<typeof vi.fn>): () => void {
    const options = mutate.mock.calls[0]?.[1] as { onSuccess: () => void };
    return options.onSuccess;
  }

  function setAuthor(name: string | undefined) {
    profile.useMyAdminAccount.mockReturnValue({ account: undefined, authorName: name, isLoading: false, error: null });
  }

  function resetWrites() {
    alertSpy.mockClear();
    const writes = {
      createArticle: write(),
      createVideo: write(),
      createGroup: write(),
      updateGroup: write(),
      updateArticle: write(),
      updateVideo: write(),
    };
    hooks.useCreateLearningArticle.mockReturnValue(writes.createArticle);
    hooks.useCreateLearningVideo.mockReturnValue(writes.createVideo);
    hooks.useCreateLearningGroup.mockReturnValue(writes.createGroup);
    hooks.useUpdateLearningGroup.mockReturnValue(writes.updateGroup);
    hooks.useUpdateLearningArticle.mockReturnValue(writes.updateArticle);
    hooks.useUpdateLearningVideo.mockReturnValue(writes.updateVideo);
    setAuthor('Asha Menon');
    setLists();
    return writes;
  }

  // ── CreateContentScreen ────────────────────────────────────────────────────

  describe('CreateContentScreen', () => {
    const filled = {
      title: 'Mulching for water retention',
      shortDescription: 'Keep the soil covered.',
      farmingCategory: 'Soil Health',
      instructions: 'Lay straw two inches deep.',
    };

    function create(onSubmitSuccess: () => void = noop) {
      return <CreateContentScreen onBack={noop} can={admin} initialData={filled} onSubmitSuccess={onSubmitSuccess} />;
    }

    it('BR-59d: Publish POSTs the article with the signed-in author, and nothing is invented', () => {
      const writes = resetWrites();
      const tree = renderTree(create());
      type(tree, 'community.createContent.readTime', '4 min read');
      press(tree, 'community.createContent.publish');
      expect(writes.createArticle.mutate).toHaveBeenCalledTimes(1);
      expect(writes.createArticle.mutate.mock.calls[0]?.[0]).toEqual({
        title: 'Mulching for water retention',
        content: 'Lay straw two inches deep.',
        snippet: 'Keep the soil covered.',
        readTime: '4 min read',
        author: 'Asha Menon',
        tag: 'Soil Health',
        isPublished: true,
      });
    });

    it('BR-59d: reports success, and tells the parent, only once the mutation has settled', () => {
      const writes = resetWrites();
      const onSubmitSuccess = vi.fn();
      const tree = renderTree(create(onSubmitSuccess));
      type(tree, 'community.createContent.readTime', '4 min read');
      press(tree, 'community.createContent.publish');
      // The press alone proves nothing: a request was sent, not answered.
      expect(alertSpy).not.toHaveBeenCalled();
      expect(onSubmitSuccess).not.toHaveBeenCalled();
      act(() => {
        onSuccessOf(writes.createArticle.mutate)();
      });
      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(alertSpy.mock.calls[0]?.[1]).toBe(en['community.content.created']);
      expect(onSubmitSuccess).toHaveBeenCalledTimes(1);
    });

    it('shows the server failure and never a success message', () => {
      const writes = resetWrites();
      writes.createArticle.error = new Error('boom');
      const text = render(create());
      expect(text).toContain(en['admin.error.generic']);
      expect(text).not.toContain(en['community.content.created']);
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('sends nothing, and says why, when a required field is missing', () => {
      const writes = resetWrites();
      const tree = renderTree(create());
      // No read time typed.
      press(tree, 'community.createContent.publish');
      expect(writes.createArticle.mutate).not.toHaveBeenCalled();
      expect(textOf(tree.toJSON())).toContain(en['community.validation.readTime']);
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('records the signed-in administrator as author, never a hard-coded name', () => {
      const writes = resetWrites();
      setAuthor(undefined);
      const tree = renderTree(create());
      expect(tree.root.findByProps({ testID: 'community.createContent.author' }).props.children).toBe(DASH);
      expect(textOf(tree.toJSON())).not.toContain('Super Admin');
      type(tree, 'community.createContent.readTime', '4 min read');
      press(tree, 'community.createContent.publish');
      expect(writes.createArticle.mutate).not.toHaveBeenCalled();
      expect(textOf(tree.toJSON())).toContain(en['community.gap.author.unknown']);
    });

    it('keeps Submit for Review and the attachment picker visible, disabled, and sending nothing', () => {
      const writes = resetWrites();
      const tree = renderTree(create());
      expectUnavailable(tree, 'community.createContent.submitForReview');
      expectUnavailable(tree, 'community.createContent.attachments');
      const text = textOf(tree.toJSON());
      expect(text).toContain('Submit for Review');
      expect(text).toContain(en['community.gap.content.review']);
      expect(text).toContain(en['community.gap.content.attachments']);
      expect(writes.createArticle.mutate).not.toHaveBeenCalled();
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('BR-213: Publish for an Announcement needs announcement.system_wide.create, not the learning permission', () => {
      const writes = resetWrites();
      const tree = renderTree(
        <CreateContentScreen onBack={noop} can={admin} initialType="Announcement" initialData={{ contentType: 'Announcement' }} />,
      );
      const publish = tree.root.findByProps({ testID: 'community.createContent.publish' });
      expect(publish.props.disabled).toBe(true);
      expect(publish.props.onPress).toBeUndefined();
      expect(textOf(tree.toJSON())).toContain(en['community.denied.announcement']);
      expect(writes.createArticle.mutate).not.toHaveBeenCalled();
    });

    it('fails closed without the permission', () => {
      const writes = resetWrites();
      const tree = renderTree(<CreateContentScreen onBack={noop} can={makeCan([])} initialData={filled} />);
      const publish = tree.root.findByProps({ testID: 'community.createContent.publish' });
      expect(publish.props.disabled).toBe(true);
      expect(writes.createArticle.mutate).not.toHaveBeenCalled();
    });
  });

  // ── AddVideoScreen ─────────────────────────────────────────────────────────

  // ── Edit mode: Edit must UPDATE the opened item, never duplicate it ─────────

  describe('edit mode', () => {
    const storedArticle: LearningArticleDto = {
      id: 'art-1',
      title: 'Composting basics',
      snippet: 'Start with green and brown layers.',
      content: 'Alternate layers and turn weekly.',
      readTime: '5 min read',
      author: 'Original Author',
      tag: 'Composting',
      language: 'en',
      isPublished: false,
      crops: [],
      createdAt: '2026-10-10T03:30:00.000Z',
      updatedAt: '2026-10-10T03:30:00.000Z',
    };

    const storedVideo: LearningVideoDto = {
      id: 'vid-1',
      title: 'Drip irrigation',
      description: 'A walkthrough.',
      videoUrl: 'https://video.example.org/drip',
      duration: '8:20',
      author: 'Original Author',
      language: 'ta',
      isFeatured: false,
      isPublished: true,
      crops: [],
      createdAt: '2026-10-10T03:30:00.000Z',
      updatedAt: '2026-10-10T03:30:00.000Z',
    };

    const loaded = (data: unknown) => ({ data, error: null, isPending: false, refetch: vi.fn() });
    const pending = () => ({ data: undefined, error: null, isPending: true, refetch: vi.fn() });

    function editArticle(withContent: boolean, onSubmitSuccess: () => void = noop) {
      return (
        <CreateContentScreen
          onBack={noop}
          can={admin}
          onSubmitSuccess={onSubmitSuccess}
          editing={{
            kind: 'article',
            id: 'art-1',
            content: withContent ? { kind: 'article', dto: storedArticle } : undefined,
          }}
        />
      );
    }

    function editVideo(withContent: boolean) {
      return (
        <AddVideoScreen
          onBack={noop}
          can={admin}
          editing={{
            kind: 'video',
            id: 'vid-1',
            content: withContent ? { kind: 'video', dto: storedVideo } : undefined,
          }}
        />
      );
    }

    const valueOf = (tree: renderer.ReactTestRenderer, testID: string) =>
      tree.root.findByProps({ testID }).props.value as string;
    const has = (tree: renderer.ReactTestRenderer, testID: string) =>
      tree.root.findAllByProps({ testID }).length > 0;

    it('BR-59d: Edit PATCHes the article’s own id and never POSTs a duplicate', () => {
      const writes = resetWrites();
      const tree = renderTree(editArticle(true));
      type(tree, 'community.createContent.title', 'Composting, revised');
      press(tree, 'community.createContent.publish');
      expect(writes.updateArticle.mutate).toHaveBeenCalledTimes(1);
      const vars = writes.updateArticle.mutate.mock.calls[0]?.[0] as { id: string; body: Record<string, unknown> };
      expect(vars.id).toBe('art-1');
      expect(vars.body).toEqual({
        title: 'Composting, revised',
        content: 'Alternate layers and turn weekly.',
        snippet: 'Start with green and brown layers.',
        readTime: '5 min read',
        // The stored author stays; the person editing does not become the author.
        author: 'Original Author',
        tag: 'Composting',
      });
      // An edit must not flip the item's published state as a side effect.
      expect('isPublished' in vars.body).toBe(false);
      expect(writes.createArticle.mutate).not.toHaveBeenCalled();
    });

    it('BR-59d: Create mode still POSTs and never PATCHes', () => {
      const writes = resetWrites();
      const tree = renderTree(
        <CreateContentScreen
          onBack={noop}
          can={admin}
          initialData={{ title: 'New', shortDescription: 'S', farmingCategory: 'Soil Health', instructions: 'Body.' }}
        />,
      );
      type(tree, 'community.createContent.readTime', '4 min read');
      press(tree, 'community.createContent.publish');
      expect(writes.createArticle.mutate).toHaveBeenCalledTimes(1);
      expect(writes.updateArticle.mutate).not.toHaveBeenCalled();
    });

    it('BR-59d: Edit prefills every field it can from the loaded item', () => {
      resetWrites();
      const tree = renderTree(editArticle(true));
      expect(valueOf(tree, 'community.createContent.title')).toBe('Composting basics');
      expect(valueOf(tree, 'community.createContent.shortDescription')).toBe('Start with green and brown layers.');
      expect(valueOf(tree, 'community.createContent.instructions')).toBe('Alternate layers and turn weekly.');
      expect(valueOf(tree, 'community.createContent.readTime')).toBe('5 min read');
      const text = textOf(tree.toJSON());
      expect(text).toContain('Composting');
      expect(text).toContain('Original Author');
    });

    it('BR-59d: Edit with no item carried fetches it and prefills from the fetched item', () => {
      resetWrites();
      hooks.useLearningArticle.mockReturnValue(loaded(storedArticle));
      const tree = renderTree(editArticle(false));
      expect(valueOf(tree, 'community.createContent.title')).toBe('Composting basics');
      expect(valueOf(tree, 'community.createContent.readTime')).toBe('5 min read');
    });

    it('BR-59d: Edit never opens a blank form while the item loads, and cannot save a duplicate', () => {
      const writes = resetWrites();
      hooks.useLearningArticle.mockReturnValue(pending());
      const tree = renderTree(editArticle(false));
      expect(has(tree, 'community.createContent.publish')).toBe(false);
      expect(has(tree, 'community.createContent.title')).toBe(false);
      expect(tree.root.findAllByType('ActivityIndicator' as never).length).toBeGreaterThan(0);
      expect(writes.createArticle.mutate).not.toHaveBeenCalled();
      expect(writes.updateArticle.mutate).not.toHaveBeenCalled();
    });

    it('BR-59d: Edit whose item failed to load shows the failure and no form', () => {
      resetWrites();
      hooks.useLearningArticle.mockReturnValue({ data: undefined, error: new Error('boom'), isPending: false, refetch: vi.fn() });
      const tree = renderTree(editArticle(false));
      expect(has(tree, 'community.createContent.publish')).toBe(false);
      expect(textOf(tree.toJSON())).toContain(en['admin.error.generic']);
    });

    it('fails closed: Edit without the permission shows no form and requests nothing', () => {
      resetWrites();
      hooks.useLearningArticle.mockClear();
      hooks.useLearningArticle.mockReturnValue(pending());
      const tree = renderTree(
        <CreateContentScreen onBack={noop} can={makeCan([])} editing={{ kind: 'article', id: 'art-1' }} />,
      );
      expect(has(tree, 'community.createContent.publish')).toBe(false);
      for (const call of hooks.useLearningArticle.mock.calls) {
        expect(call[1]).toMatchObject({ enabled: false });
      }
    });

    it('BR-59d: Edit reports success, and tells the parent, only once the PATCH has settled', () => {
      const writes = resetWrites();
      const onSubmitSuccess = vi.fn();
      const tree = renderTree(editArticle(true, onSubmitSuccess));
      press(tree, 'community.createContent.publish');
      expect(alertSpy).not.toHaveBeenCalled();
      expect(onSubmitSuccess).not.toHaveBeenCalled();
      act(() => {
        onSuccessOf(writes.updateArticle.mutate)();
      });
      expect(alertSpy.mock.calls[0]?.[1]).toBe(en['community.content.updated']);
      expect(onSubmitSuccess).toHaveBeenCalledTimes(1);
    });

    it('BR-59d: Edit of a video PATCHes the video’s own id and never POSTs a duplicate', () => {
      const writes = resetWrites();
      const tree = renderTree(editVideo(true));
      type(tree, 'community.addVideo.title', 'Drip irrigation, revised');
      press(tree, 'community.addVideo.publish');
      expect(writes.updateVideo.mutate).toHaveBeenCalledTimes(1);
      const vars = writes.updateVideo.mutate.mock.calls[0]?.[0] as { id: string; body: Record<string, unknown> };
      expect(vars.id).toBe('vid-1');
      expect(vars.body).toEqual({
        title: 'Drip irrigation, revised',
        description: 'A walkthrough.',
        videoUrl: 'https://video.example.org/drip',
        duration: '8:20',
        author: 'Original Author',
        language: 'ta',
      });
      expect('isPublished' in vars.body).toBe(false);
      expect(writes.createVideo.mutate).not.toHaveBeenCalled();
    });

    it('BR-59d: Edit of a video prefills from the loaded item and never opens blank while loading', () => {
      const writes = resetWrites();
      const filled = renderTree(editVideo(true));
      expect(valueOf(filled, 'community.addVideo.title')).toBe('Drip irrigation');
      expect(valueOf(filled, 'community.addVideo.link')).toBe('https://video.example.org/drip');
      expect(valueOf(filled, 'community.addVideo.duration')).toBe('8:20');
      expect(textOf(filled.toJSON())).toContain('Tamil');

      hooks.useLearningVideo.mockReturnValue(pending());
      const blank = renderTree(editVideo(false));
      expect(has(blank, 'community.addVideo.publish')).toBe(false);
      expect(writes.createVideo.mutate).not.toHaveBeenCalled();
      expect(writes.updateVideo.mutate).not.toHaveBeenCalled();
    });

    it('BR-59d: Edit routes by kind, and a kind with no edit form has no Edit', () => {
      expect(editRouteOf('article')).toBe('create_content');
      expect(editRouteOf('video')).toBe('add_video');
      expect(editRouteOf('group')).toBe('create_group');
      expect(editRouteOf('training')).toBeNull();
      expect(editRouteOf(undefined)).toBeNull();
    });
  });

  describe('AddVideoScreen', () => {
    function fillVideo(tree: renderer.ReactTestRenderer, over: { link?: string; duration?: string } = {}) {
      type(tree, 'community.addVideo.title', 'Drip irrigation');
      type(tree, 'community.addVideo.description', 'A walkthrough.');
      type(tree, 'community.addVideo.link', over.link ?? 'https://video.example.org/drip');
      type(tree, 'community.addVideo.duration', over.duration ?? '8:20');
      press(tree, 'community.addVideo.language.English');
    }

    it('BR-59d: Publish POSTs the video with its https link, duration and the signed-in author', () => {
      const writes = resetWrites();
      const tree = renderTree(<AddVideoScreen onBack={noop} can={admin} />);
      fillVideo(tree);
      press(tree, 'community.addVideo.publish');
      expect(writes.createVideo.mutate.mock.calls[0]?.[0]).toEqual({
        title: 'Drip irrigation',
        description: 'A walkthrough.',
        videoUrl: 'https://video.example.org/drip',
        duration: '8:20',
        author: 'Asha Menon',
        language: 'en',
        isPublished: true,
      });
    });

    it('BR-59j: refuses a link that is not https before sending anything', () => {
      const writes = resetWrites();
      const tree = renderTree(<AddVideoScreen onBack={noop} can={admin} />);
      fillVideo(tree, { link: 'http://video.example.org/drip' });
      press(tree, 'community.addVideo.publish');
      expect(writes.createVideo.mutate).not.toHaveBeenCalled();
      expect(textOf(tree.toJSON())).toContain(en['community.validation.videoUrl']);
    });

    it('BR-59d: reports success, and navigates on, only once the mutation has settled', () => {
      const writes = resetWrites();
      const onSubmitSuccess = vi.fn();
      const tree = renderTree(<AddVideoScreen onBack={noop} can={admin} onSubmitSuccess={onSubmitSuccess} />);
      fillVideo(tree);
      press(tree, 'community.addVideo.publish');
      expect(alertSpy).not.toHaveBeenCalled();
      expect(onSubmitSuccess).not.toHaveBeenCalled();
      act(() => {
        onSuccessOf(writes.createVideo.mutate)();
      });
      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(alertSpy.mock.calls[0]?.[1]).toBe(en['community.video.created']);
      expect(onSubmitSuccess).toHaveBeenCalledTimes(1);
    });

    it('shows the server failure and never a success message', () => {
      const writes = resetWrites();
      writes.createVideo.error = new Error('boom');
      const text = render(<AddVideoScreen onBack={noop} can={admin} />);
      expect(text).toContain(en['admin.error.generic']);
      expect(text).not.toContain(en['community.video.created']);
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('keeps Submit for Review and the three pickers visible, disabled, and sending nothing', () => {
      const writes = resetWrites();
      const tree = renderTree(<AddVideoScreen onBack={noop} can={admin} />);
      for (const id of [
        'community.addVideo.submitForReview',
        'community.addVideo.thumbnailPicker',
        'community.addVideo.videoPicker',
        'community.addVideo.attachments',
      ]) {
        expectUnavailable(tree, id);
      }
      expect(textOf(tree.toJSON())).toContain(en['community.gap.video.review']);
      expect(writes.createVideo.mutate).not.toHaveBeenCalled();
      expect(alertSpy).not.toHaveBeenCalled();
    });
  });

  // ── CreateGroupScreen ──────────────────────────────────────────────────────

  describe('CreateGroupScreen', () => {
    function fillGroup(tree: renderer.ReactTestRenderer) {
      type(tree, 'community.createGroup.name', 'Tomato Growers Circle');
      type(tree, 'community.createGroup.description', 'Share what works.');
      press(tree, 'community.createGroup.category.Training');
    }

    it('BR-59d: Create POSTs only name, description and category', () => {
      const writes = resetWrites();
      const tree = renderTree(<CreateGroupScreen onBack={noop} can={admin} />);
      fillGroup(tree);
      press(tree, 'community.createGroup.submit');
      expect(writes.createGroup.mutate.mock.calls[0]?.[0]).toEqual({
        name: 'Tomato Growers Circle',
        description: 'Share what works.',
        category: 'Training',
      });
      expect(writes.updateGroup.mutate).not.toHaveBeenCalled();
    });

    it('BR-59d: editing PATCHes the opened group and never POSTs', () => {
      const writes = resetWrites();
      const tree = renderTree(
        <CreateGroupScreen
          onBack={noop}
          can={admin}
          isEditing
          groupId="grp-1"
          initialGroup={{ name: 'Old name', description: 'Old.', category: 'Market' }}
        />,
      );
      type(tree, 'community.createGroup.name', 'New name');
      press(tree, 'community.createGroup.submit');
      expect(writes.updateGroup.mutate.mock.calls[0]?.[0]).toEqual({
        id: 'grp-1',
        // BR-59s: an edit always states the parent; this group has none stored, so null.
        body: { name: 'New name', description: 'Old.', category: 'Market', communityId: null },
      });
      expect(writes.createGroup.mutate).not.toHaveBeenCalled();
    });

    it('disables an edit with no group opened rather than creating a new one', () => {
      const writes = resetWrites();
      const tree = renderTree(<CreateGroupScreen onBack={noop} can={admin} isEditing />);
      expectUnavailable(tree, 'community.createGroup.submit');
      expect(textOf(tree.toJSON())).toContain(en['community.gap.group.noId']);
      expect(writes.createGroup.mutate).not.toHaveBeenCalled();
      expect(writes.updateGroup.mutate).not.toHaveBeenCalled();
    });

    it('reports success only once the mutation has settled, and never claims farmers were added', () => {
      const writes = resetWrites();
      const tree = renderTree(<CreateGroupScreen onBack={noop} can={admin} />);
      fillGroup(tree);
      press(tree, 'community.createGroup.submit');
      expect(alertSpy).not.toHaveBeenCalled();
      act(() => {
        onSuccessOf(writes.createGroup.mutate)();
      });
      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(alertSpy.mock.calls[0]?.[1]).toBe(en['community.group.created']);
      expect(JSON.stringify(alertSpy.mock.calls[0])).not.toMatch(/farmers added/);
    });

    it('shows the server failure and never a success message', () => {
      const writes = resetWrites();
      writes.createGroup.error = new Error('boom');
      const text = render(<CreateGroupScreen onBack={noop} can={admin} />);
      expect(text).toContain(en['admin.error.generic']);
      expect(text).not.toContain(en['community.group.created']);
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('a parent community is optional: without one the group still saves, and sends no communityId', () => {
      const writes = resetWrites();
      const tree = renderTree(<CreateGroupScreen onBack={noop} can={admin} />);
      fillGroup(tree);
      press(tree, 'community.createGroup.submit');
      expect(writes.createGroup.mutate).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(writes.createGroup.mutate.mock.calls[0]?.[0])).not.toContain('communityId');
    });

    it('keeps the cover picker visible, disabled, and sending nothing', () => {
      const writes = resetWrites();
      const tree = renderTree(<CreateGroupScreen onBack={noop} can={admin} />);
      expectUnavailable(tree, 'community.createGroup.cover');
      expect(textOf(tree.toJSON())).toContain(en['community.gap.group.cover']);
      expect(textOf(tree.toJSON())).toContain(en['community.gap.group.members']);
      expect(writes.createGroup.mutate).not.toHaveBeenCalled();
    });
  });

  // ── ArticleDetailsScreen ───────────────────────────────────────────────────

  describe('ArticleDetailsScreen edit', () => {
    function article(): LearningArticleDto {
      return {
        id: 'art-1',
        title: 'Mulching for water retention',
        snippet: null,
        content: 'Body.',
        readTime: '4 min read',
        author: 'Asha Menon',
        tag: 'Guide',
        language: 'en',
        isPublished: false,
        crops: [],
        createdAt: '2026-10-10T03:30:00.000Z',
        updatedAt: '2026-10-10T03:30:00.000Z',
      };
    }

    function open() {
      const writes = resetWrites();
      hooks.useLearningArticle.mockReturnValue({ data: article(), error: null, isPending: false, refetch: vi.fn() });
      const tree = renderTree(<ArticleDetailsScreen onBack={noop} can={admin} articleId="art-1" />);
      return { writes, tree };
    }

    it('BR-59d: Save PATCHes the article with the new title instead of discarding it', () => {
      const { writes, tree } = open();
      type(tree, 'community.article.editTitle', 'Mulching, revised');
      press(tree, 'community.article.editSave');
      expect(writes.updateArticle.mutate.mock.calls[0]?.[0]).toEqual({ id: 'art-1', body: { title: 'Mulching, revised' } });
    });

    it('BR-59d: reports success only once the PATCH has settled', () => {
      const { writes, tree } = open();
      type(tree, 'community.article.editTitle', 'Mulching, revised');
      press(tree, 'community.article.editSave');
      expect(alertSpy).not.toHaveBeenCalled();
      act(() => {
        onSuccessOf(writes.updateArticle.mutate)();
      });
      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(alertSpy.mock.calls[0]?.[1]).toBe(en['community.article.updated']);
    });

    it('shows the server failure and never a success message', () => {
      const { writes } = open();
      writes.updateArticle.error = new Error('boom');
      const text = render(<ArticleDetailsScreen onBack={noop} can={admin} articleId="art-1" />);
      expect(text).toContain(en['admin.error.generic']);
      expect(alertSpy).not.toHaveBeenCalled();
    });

    it('sends nothing for an empty title', () => {
      const { writes, tree } = open();
      type(tree, 'community.article.editTitle', '   ');
      press(tree, 'community.article.editSave');
      expect(writes.updateArticle.mutate).not.toHaveBeenCalled();
      expect(textOf(tree.toJSON())).toContain(en['community.validation.articleTitle']);
    });

    it('keeps the three status chips visible, disabled, and sending nothing', () => {
      const { writes, tree } = open();
      for (const st of ['Approved', 'Pending Review', 'Draft']) expectUnavailable(tree, `community.article.status.${st}`);
      expect(writes.updateArticle.mutate).not.toHaveBeenCalled();
    });
  });

  // ── CommunityDetailsScreen / QuestionAnswerChatScreen ─────────────────────

  describe('community and chat actions with no endpoint', () => {
    it('CommunityDetailsScreen: archive, deactivate, block and block-chat are disabled and fire nothing', () => {
      const writes = resetWrites();
      const tree = renderTree(<CommunityDetailsScreen onBack={noop} role="SUPER_ADMIN" />);
      expectUnavailable(tree, 'community.details.archive');
      for (const id of ['blockChat', 'blockCommunity', 'deactivate', 'archive']) {
        expectUnavailable(tree, `community.details.menu.${id}`);
      }
      const text = textOf(tree.toJSON());
      expect(text).toContain(en['community.gap.community.actions']);
      expect(alertSpy).not.toHaveBeenCalled();
      for (const w of Object.values(writes)) expect(w.mutate).not.toHaveBeenCalled();
    });

    it('CommunityDetailsScreen: shows no fabricated farm name and no invented status', () => {
      resetWrites();
      const tree = renderTree(<CommunityDetailsScreen onBack={noop} role="SUPER_ADMIN" />);
      const all = textOf(tree.toJSON()).join(' ');
      expect(all).not.toContain('Nilgiris Organic Growers');
      expect(tree.root.findByProps({ testID: 'community.details.status' }).props.children).toBe(DASH);
    });

    it('QuestionAnswerChatScreen: every moderation item and Send is disabled and fires nothing', () => {
      const writes = resetWrites();
      const tree = renderTree(<QuestionAnswerChatScreen onBack={noop} role="SUPER_ADMIN" />);
      for (const id of ['blockChat', 'blockCommunity', 'deactivate', 'archive']) {
        expectUnavailable(tree, `community.chat.menu.${id}`);
      }
      expectUnavailable(tree, 'community.chat.send');
      const text = textOf(tree.toJSON());
      expect(text).toContain(en['community.gap.chat.actions']);
      expect(alertSpy).not.toHaveBeenCalled();
      for (const w of Object.values(writes)) expect(w.mutate).not.toHaveBeenCalled();
    });
  });

  // ── No invented people, farms or fixtures ──────────────────────────────────

  describe('no fabricated demo content', () => {
    const allText = (element: React.ReactElement) => render(element).join('\n');

    it('QuestionAnswerChatScreen: with no thread open it says so, and never draws a conversation', () => {
      resetWrites();
      const text = allText(<QuestionAnswerChatScreen onBack={noop} role="SUPER_ADMIN" can={admin} />);
      for (const invented of ['Ramesh Kumar', 'Selvi', 'Demo TOHFA Admin', 'Mulching for water retention', 'Awaiting your reply']) {
        expect(text).not.toContain(invented);
      }
      expect(text).toContain(en['community.chat.noThread']);
    });

    it('CreateGroupScreen: no invented parent communities, farmers or unsaved summary values', () => {
      resetWrites();
      const tree = renderTree(<CreateGroupScreen onBack={noop} can={admin} />);
      const text = textOf(tree.toJSON()).join('\n');
      for (const invented of [
        'Demo Farmer',
        'FMR-001',
        'Coonoor Organic Farmers',
        'Ooty Vegetable Growers',
        'Selected farmers',
        'In-app, if enabled',
        '24 farmers match',
      ]) {
        expect(text).not.toContain(invented);
      }
      // The designed controls stay, visible, with nothing behind them to fire.
      expectUnavailable(tree, 'community.createGroup.parent');
      expectUnavailable(tree, 'community.createGroup.farmerRegion');
      expectUnavailable(tree, 'community.createGroup.farmerType');
      expectUnavailable(tree, 'community.createGroup.notify');
      expect(tree.root.findByProps({ testID: 'community.createGroup.farmerSearch' }).props.editable).toBe(false);
      expect(text).toContain(en['community.gap.group.farmers']);
    });

    it('no invented person, thread title or community id remains in screens/community/', () => {
      const dir = path.resolve(__dirname, '../screens/community');
      const banned = ['Ramesh Kumar', 'Selvi', 'Demo Farmer', 'Mulching for water retention', 'comm-1'];
      const hits: string[] = [];
      for (const name of fs.readdirSync(dir)) {
        if (!/\.(ts|tsx)$/.test(name)) continue;
        const src = fs.readFileSync(path.join(dir, name), 'utf8');
        for (const word of banned) if (src.includes(word)) hits.push(`${name}: ${word}`);
      }
      expect(hits).toEqual([]);
    });
  });

  // ── The builders behind the forms ──────────────────────────────────────────

  describe('form body builders', () => {
    it('BR-59d: an article body respects the spec bounds and omits an empty summary', () => {
      const base = { title: 'T', summary: '', body: 'B', category: 'Soil Health', readTime: '4 min', author: 'A' };
      expect(buildArticleBody(base)).toMatchObject({ ok: true, body: { snippet: null, isPublished: true } });
      expect(buildArticleBody({ ...base, category: 'Select' })).toEqual({ ok: false, errorKey: 'community.validation.category' });
      expect(buildArticleBody({ ...base, readTime: 'x'.repeat(21) })).toEqual({ ok: false, errorKey: 'community.validation.readTime' });
      expect(buildArticleBody({ ...base, author: undefined })).toEqual({ ok: false, errorKey: 'community.gap.author.unknown' });
    });

    it('BR-59j: a video link must be https', () => {
      const base = { title: 'T', description: '', videoUrl: 'https://a.example/v', duration: '1:00', language: 'Tamil', author: 'A' };
      expect(buildVideoBody(base)).toMatchObject({ ok: true, body: { language: 'ta', description: null } });
      for (const bad of ['http://a.example/v', 'javascript:alert(1)', 'data:text/html,x', 'file:///x', 'https://']) {
        expect(buildVideoBody({ ...base, videoUrl: bad })).toEqual({ ok: false, errorKey: 'community.validation.videoUrl' });
      }
    });

    it('BR-59d: a group body carries exactly name, description and category', () => {
      expect(buildGroupBody({ name: ' N ', description: ' D ', category: 'Market' })).toEqual({
        ok: true,
        body: { name: 'N', description: 'D', category: 'Market' },
      });
      expect(buildGroupBody({ name: '', description: 'D', category: 'Market' })).toEqual({ ok: false, errorKey: 'community.validation.groupName' });
    });
  });
});
