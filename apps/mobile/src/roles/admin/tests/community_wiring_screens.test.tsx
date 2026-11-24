/**
 * The Community & Knowledge screens that were wired once their backends
 * existed, rendered with react-test-renderer against mocked hooks (the clients
 * are covered by api_communities.test.ts and the decisions by
 * community_wiring_logic.test.ts):
 *
 *   Communities (BR-59s)  list, create, edit, detail, members, groups, archive
 *   Review (BR-59t)       submit-for-review and the decision, on two screens
 *   Q&A (BR-59u)          thread, reply, block, discussions and replies lists
 *   Announcements (BR-213) the announcement path of the content form
 *   Group parent (BR-59s) the parent-community selector
 *
 * Contract pinned throughout: a screen reads the API rather than a "not built"
 * panel; a success Alert exists only after a mutation settled; a failure shows
 * the error and no success; every control that still has no endpoint fires no
 * mutation.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import type { CommunityDto, CommunityMemberDto } from '../api/communities';
import type { LearningArticleDto, LearningGroupDto } from '../api/learning';
import type { QaQuestionDetailDto, QaQuestionSummaryDto } from '../api/qa';

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
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s, hairlineWidth: 1 },
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

const learning = vi.hoisted(() => ({
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
vi.mock('../api/learningHooks', () => learning);

const communities = vi.hoisted(() => ({
  useCommunities: vi.fn(),
  useCommunity: vi.fn(),
  useCommunityGroups: vi.fn(),
  useCommunityMembers: vi.fn(),
  useCreateCommunity: vi.fn(),
  useUpdateCommunity: vi.fn(),
  useArchiveCommunity: vi.fn(),
}));
vi.mock('../api/communitiesHooks', () => communities);

const qa = vi.hoisted(() => ({
  useAdminQaQuestions: vi.fn(),
  useAdminQaQuestion: vi.fn(),
  usePostAdminQaAnswer: vi.fn(),
  useModerateAdminQaQuestion: vi.fn(),
  useAskAdminQaQuestion: vi.fn(),
}));
vi.mock('../api/qaHooks', () => qa);

const announcements = vi.hoisted(() => ({ useCreateAdminAnnouncement: vi.fn() }));
vi.mock('../api/announcementsHooks', () => announcements);

const profile = vi.hoisted(() => ({ useMyAdminAccount: vi.fn() }));
vi.mock('../api/profileHooks', () => profile);

vi.mock('../api/produceHooks', () => ({
  useCropMasterList: () => ({ data: { items: [] }, error: null, isPending: false, refetch: () => undefined }),
}));

import { CommunitiesListScreen } from '../screens/community/CommunitiesListScreen';
import { CreateCommunityScreen } from '../screens/community/CreateCommunityScreen';
import { CommunityDetailsScreen } from '../screens/community/CommunityDetailsScreen';
import { ContentItemDetailScreen } from '../screens/community/ContentItemDetailScreen';
import { ContentPendingReviewScreen } from '../screens/community/ContentPendingReviewScreen';
import { QuestionAnswerChatScreen } from '../screens/community/QuestionAnswerChatScreen';
import { CreateContentScreen } from '../screens/community/CreateContentScreen';
import { CreateGroupScreen } from '../screens/community/CreateGroupScreen';
import { CommunityKnowledgeHomeScreen } from '../screens/community/CommunityKnowledgeHomeScreen';
import { makeCan } from '../permissions/can';
import { ApiError } from '../../../shell/api/client';
import { en } from '../i18n';
import { ADMIN_NO_VALUE } from '../utils/noValue';

const DASH = ADMIN_NO_VALUE;
const noop = () => undefined;
const CID = '6f0c6a53-9d1e-4f6e-8a55-1f6b2d0f5a11';

const moderator = makeCan(['community.group.moderate']);
const learner = makeCan(['learning.admin.manage']);
const reviewer = makeCan(['learning.admin.manage', 'learning.content.review']);
const everything = makeCan([
  'learning.admin.manage',
  'learning.content.review',
  'community.group.moderate',
  'farmer.learning.qa_participate',
  'announcement.system_wide.create',
]);

// ── helpers ──────────────────────────────────────────────────────────────────

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

function textsOf(tree: renderer.ReactTestRenderer): string[] {
  return textOf(tree.toJSON());
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

function has(tree: renderer.ReactTestRenderer, testID: string): boolean {
  return tree.root.findAllByProps({ testID }).length > 0;
}

function mutation() {
  return { mutate: vi.fn(), isPending: false, error: null as unknown };
}

function onSuccessOf(mutate: ReturnType<typeof vi.fn>, call = 0): () => void {
  const options = mutate.mock.calls[call]?.[1] as { onSuccess: () => void };
  return options.onSuccess;
}

function numberedList<T>(items: T[] = [], over: Record<string, unknown> = {}) {
  return {
    items,
    total: items.length,
    allPagesLoaded: true,
    loadMore: vi.fn(),
    hasMore: false,
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    isRefreshing: false,
    ...over,
  };
}

function loadedQuery(data: unknown) {
  return { data, error: null, isPending: false, refetch: vi.fn() };
}

function community(over: Partial<CommunityDto> = {}): CommunityDto {
  return {
    id: CID,
    name: 'Nilgiris Tea Growers',
    description: 'Tea growers of the hills',
    category: 'Regional Farmer Communities',
    rules: 'Be kind',
    isArchived: false,
    archivedAt: null,
    groupCount: 3,
    memberCount: 41,
    createdBy: null,
    createdAt: '2026-10-10T03:30:00.000Z',
    updatedAt: '2026-10-10T03:30:00.000Z',
    ...over,
  };
}

function member(over: Partial<CommunityMemberDto> = {}): CommunityMemberDto {
  return {
    farmerId: 'f1',
    farmerName: 'Ravi Kumar',
    phone: '+919876543210',
    village: 'Coonoor',
    joinedAt: '2026-10-10T03:30:00.000Z',
    groupCount: 2,
    groups: [{ id: 'g1', name: 'Tea circle' }],
    ...over,
  };
}

function group(over: Partial<LearningGroupDto> = {}): LearningGroupDto {
  return {
    id: 'g1',
    name: 'Tea circle',
    description: null,
    category: 'Crops',
    memberCount: 12,
    isArchived: false,
    archivedAt: null,
    communityId: CID,
    createdAt: '2026-10-10T03:30:00.000Z',
    updatedAt: '2026-10-10T03:30:00.000Z',
    ...over,
  };
}

function question(over: Partial<QaQuestionSummaryDto> = {}): QaQuestionSummaryDto {
  return {
    id: 'q1',
    communityId: CID,
    contentType: 'articles',
    contentId: 'art-1',
    title: 'Is neem oil safe?',
    content: 'On tomato flowers?',
    author: { id: 'u1', displayName: 'Selvi', role: 'FARMER' },
    answerCount: 1,
    isBlocked: false,
    blockReason: null,
    createdAt: '2026-10-10T03:30:00.000Z',
    updatedAt: '2026-10-10T03:30:00.000Z',
    ...over,
  };
}

function thread(over: Partial<QaQuestionDetailDto> = {}): QaQuestionDetailDto {
  return {
    ...question(),
    answers: [
      {
        id: 'an1',
        questionId: 'q1',
        content: 'Spray in the evening.',
        author: { id: 'u2', displayName: 'Admin Asha', role: 'ADMIN' },
        isBlocked: false,
        blockReason: null,
        createdAt: '2026-10-11T03:30:00.000Z',
        updatedAt: '2026-10-11T03:30:00.000Z',
      },
    ],
    ...over,
  };
}

function article(over: Partial<LearningArticleDto> = {}): LearningArticleDto {
  return {
    id: 'art-1',
    title: 'Mulching for water retention',
    snippet: 'Keep the soil covered.',
    content: 'The whole article.',
    readTime: '4 min read',
    author: 'Asha Menon',
    tag: 'Guide',
    language: 'en',
    isPublished: false,
    reviewStatus: 'NOT_SUBMITTED',
    crops: [],
    createdAt: '2026-10-10T03:30:00.000Z',
    updatedAt: '2026-10-10T03:30:00.000Z',
    ...over,
  };
}

/** Every hook the screens reach, with quiet defaults; a test overrides what it cares about. */
function reset() {
  alertSpy.mockClear();
  for (const fn of [...Object.values(learning), ...Object.values(communities), ...Object.values(qa), ...Object.values(announcements)]) fn.mockReset();
  for (const name of ['useLearningArticles', 'useLearningVideos', 'useLearningTrainings', 'useLearningGroups', 'useLearningHubArticles']) {
    learning[name as keyof typeof learning].mockReturnValue(numberedList());
  }
  for (const name of ['useLearningArticle', 'useLearningVideo', 'useLearningTraining', 'useLearningGroup']) {
    learning[name as keyof typeof learning].mockReturnValue(loadedQuery(undefined));
  }
  const writes = {
    updateArticle: mutation(),
    updateVideo: mutation(),
    updateTraining: mutation(),
    createArticle: mutation(),
    createGroup: mutation(),
    updateGroup: mutation(),
    submit: mutation(),
    review: mutation(),
    createCommunity: mutation(),
    updateCommunity: mutation(),
    archiveCommunity: mutation(),
    postAnswer: mutation(),
    moderate: mutation(),
    announce: mutation(),
  };
  learning.useUpdateLearningArticle.mockReturnValue(writes.updateArticle);
  learning.useUpdateLearningVideo.mockReturnValue(writes.updateVideo);
  learning.useUpdateLearningTraining.mockReturnValue(writes.updateTraining);
  learning.useCreateLearningArticle.mockReturnValue(writes.createArticle);
  learning.useCreateLearningGroup.mockReturnValue(writes.createGroup);
  learning.useUpdateLearningGroup.mockReturnValue(writes.updateGroup);
  learning.useSubmitLearningForReview.mockReturnValue(writes.submit);
  learning.useReviewLearningContent.mockReturnValue(writes.review);
  communities.useCommunities.mockReturnValue(numberedList());
  communities.useCommunity.mockReturnValue(loadedQuery(undefined));
  communities.useCommunityGroups.mockReturnValue(numberedList());
  communities.useCommunityMembers.mockReturnValue(numberedList());
  communities.useCreateCommunity.mockReturnValue(writes.createCommunity);
  communities.useUpdateCommunity.mockReturnValue(writes.updateCommunity);
  communities.useArchiveCommunity.mockReturnValue(writes.archiveCommunity);
  qa.useAdminQaQuestions.mockReturnValue(numberedList());
  qa.useAdminQaQuestion.mockReturnValue(loadedQuery(undefined));
  qa.usePostAdminQaAnswer.mockReturnValue(writes.postAnswer);
  qa.useModerateAdminQaQuestion.mockReturnValue(writes.moderate);
  announcements.useCreateAdminAnnouncement.mockReturnValue(writes.announce);
  profile.useMyAdminAccount.mockReturnValue({ account: undefined, authorName: 'Asha Menon', isLoading: false, error: null });
  return writes;
}

let writes: ReturnType<typeof reset>;
beforeEach(() => {
  writes = reset();
});

// ═══════════════════════════════════════════════════════════════════════════
// Communities
// ═══════════════════════════════════════════════════════════════════════════

describe('CommunitiesListScreen (BR-59s)', () => {
  it('BR-59s: renders the communities the API returned, not a "not built" panel', () => {
    communities.useCommunities.mockReturnValue(
      numberedList([community(), community({ id: 'c2', name: 'Anamalai Coffee', isArchived: true, memberCount: 7 })], { total: 2 }),
    );
    const text = textsOf(renderTree(<CommunitiesListScreen onBack={noop} can={moderator} />));
    expect(text).toContain('Nilgiris Tea Growers');
    expect(text).toContain('Anamalai Coffee');
    expect(text).toContain(en['community.status.Active']);
    expect(text).toContain(en['community.status.Archived']);
    expect(text).toContain(`${DASH} · ${DASH} · 41 farmers`);
    expect(text.join(' ')).not.toContain('not built yet');
    expect(text).not.toContain('Communities are not built yet');
  });

  it('BR-59s: the caption is the server total, with an active sub-count that is a dash while pages remain', () => {
    communities.useCommunities.mockReturnValue(numberedList([community()], { total: 8, allPagesLoaded: false, hasMore: true }));
    const text = textsOf(renderTree(<CommunitiesListScreen onBack={noop} can={moderator} />));
    expect(text).toContain(`8 communities (${DASH} active)`);
    expect(text.join(' ')).not.toContain('8 communities (1 active)');
  });

  it('states the active sub-count once every page is in', () => {
    communities.useCommunities.mockReturnValue(
      numberedList([community(), community({ id: 'c2', isArchived: true })], { total: 2, allPagesLoaded: true }),
    );
    expect(textsOf(renderTree(<CommunitiesListScreen onBack={noop} can={moderator} />))).toContain('2 communities (1 active)');
  });

  it('tells loading, error and genuinely empty apart', () => {
    communities.useCommunities.mockReturnValue(numberedList([], { isLoading: true, total: undefined }));
    expect(textsOf(renderTree(<CommunitiesListScreen onBack={noop} can={moderator} />))).toContain(en['async.loading']);

    communities.useCommunities.mockReturnValue(numberedList([], { error: new Error('boom'), total: undefined }));
    const failed = textsOf(renderTree(<CommunitiesListScreen onBack={noop} can={moderator} />));
    expect(failed).toContain(en['async.error.title']);
    expect(failed).not.toContain(en['community.empty.communities']);

    communities.useCommunities.mockReturnValue(numberedList([], { total: 0 }));
    const empty = textsOf(renderTree(<CommunitiesListScreen onBack={noop} can={moderator} />));
    expect(empty).toContain(en['community.empty.communities']);
    expect(empty).not.toContain(en['async.error.title']);
  });

  it('fails closed without community.group.moderate and requests nothing', () => {
    const text = textsOf(renderTree(<CommunitiesListScreen onBack={noop} can={learner} />));
    expect(text).toContain(en['community.denied.title']);
    expect(communities.useCommunities).toHaveBeenCalledWith(expect.anything(), { enabled: false });
  });

  it('opens the community when its card is pressed', () => {
    communities.useCommunities.mockReturnValue(numberedList([community()]));
    const onSelect = vi.fn();
    const tree = renderTree(<CommunitiesListScreen onBack={noop} can={moderator} onSelectCommunity={onSelect} />);
    press(tree, `community.communities.card.${CID}`);
    expect(onSelect).toHaveBeenCalledWith(CID);
  });

  it('BR-59s: the status chips are a server filter on isArchived', () => {
    const tree = renderTree(<CommunitiesListScreen onBack={noop} can={moderator} />);
    press(tree, 'community.communities.filter.status.Archived');
    expect(communities.useCommunities).toHaveBeenLastCalledWith(expect.objectContaining({ isArchived: true }), { enabled: true });
    press(tree, 'community.communities.filter.status.Active');
    expect(communities.useCommunities).toHaveBeenLastCalledWith(expect.objectContaining({ isArchived: false }), { enabled: true });
  });

  it('membership and discoverability have no field: their chips are drawn, disabled, and change no request', () => {
    const tree = renderTree(<CommunitiesListScreen onBack={noop} can={moderator} />);
    const before = communities.useCommunities.mock.calls.length;
    for (const id of ['membership.Open', 'membership.Invitation-only', 'discoverability.Hidden']) {
      expectUnavailable(tree, `community.communities.filter.${id}`);
    }
    expect(communities.useCommunities.mock.calls.length).toBe(before);
  });
});

describe('CreateCommunityScreen (BR-59s)', () => {
  function form(over: Partial<React.ComponentProps<typeof CreateCommunityScreen>> = {}) {
    return <CreateCommunityScreen onBack={noop} can={moderator} {...over} />;
  }

  function fill(tree: renderer.ReactTestRenderer) {
    type(tree, 'community.createCommunity.name', ' Nilgiris Tea ');
    type(tree, 'community.createCommunity.description', 'Tea growers');
    press(tree, 'community.createCommunity.category.Regional Farmer Communities');
  }

  it('BR-59s: Create POSTs name, description, category and rules and nothing the API has no field for', () => {
    const tree = renderTree(form());
    fill(tree);
    type(tree, 'community.createCommunity.rules', 'Be kind');
    press(tree, 'community.createCommunity.submit');
    expect(writes.createCommunity.mutate).toHaveBeenCalledTimes(1);
    expect(writes.createCommunity.mutate.mock.calls[0]?.[0]).toEqual({
      name: 'Nilgiris Tea',
      description: 'Tea growers',
      category: 'Regional Farmer Communities',
      rules: 'Be kind',
    });
    expect(writes.updateCommunity.mutate).not.toHaveBeenCalled();
  });

  it('BR-59s: reports success, and tells the parent, only once the mutation has settled', () => {
    const onSubmitSuccess = vi.fn();
    const tree = renderTree(form({ onSubmitSuccess }));
    fill(tree);
    press(tree, 'community.createCommunity.submit');
    expect(alertSpy).not.toHaveBeenCalled();
    expect(onSubmitSuccess).not.toHaveBeenCalled();

    act(() => onSuccessOf(writes.createCommunity.mutate)());
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0]?.[1]).toBe(en['community.community.created']);
    // The Alert's own OK button is what moves on.
    const buttons = alertSpy.mock.calls[0]?.[2] as { onPress?: () => void }[] | undefined;
    buttons?.[0]?.onPress?.();
    expect(onSubmitSuccess).toHaveBeenCalled();
  });

  it('shows the server failure and never a success message', () => {
    writes.createCommunity.error = new ApiError({ type: 'x', title: 't', status: 422, code: 'VALIDATION_FAILED' } as never);
    communities.useCreateCommunity.mockReturnValue({ ...writes.createCommunity });
    const tree = renderTree(form());
    expect(has(tree, 'community.createCommunity.error')).toBe(true);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('sends nothing, and says why, when a required field is missing', () => {
    const tree = renderTree(form());
    press(tree, 'community.createCommunity.submit');
    expect(writes.createCommunity.mutate).not.toHaveBeenCalled();
    expect(textsOf(tree)).toContain(en['community.validation.communityName']);
  });

  it('fails closed without community.group.moderate: Save is unavailable', () => {
    const tree = renderTree(form({ can: learner }));
    expectUnavailable(tree, 'community.createCommunity.submit');
  });

  it('BR-59s: Edit loads the community, prefills it, and PATCHes its own id — never a POST', () => {
    communities.useCommunity.mockReturnValue(loadedQuery(community()));
    const tree = renderTree(form({ isEditing: true, communityId: CID }));
    expect(communities.useCommunity).toHaveBeenCalledWith(CID, { enabled: true });
    expect(tree.root.findByProps({ testID: 'community.createCommunity.name' }).props.value).toBe('Nilgiris Tea Growers');
    type(tree, 'community.createCommunity.name', 'Renamed');
    press(tree, 'community.createCommunity.submit');
    expect(writes.updateCommunity.mutate.mock.calls[0]?.[0]).toEqual({
      id: CID,
      body: { name: 'Renamed', description: 'Tea growers of the hills', category: 'Regional Farmer Communities', rules: 'Be kind' },
    });
    expect(writes.createCommunity.mutate).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
    act(() => onSuccessOf(writes.updateCommunity.mutate)());
    expect(alertSpy.mock.calls[0]?.[1]).toBe(en['community.community.updated']);
  });

  it('BR-59s: Edit never opens a blank form while the community loads, and cannot save a duplicate', () => {
    communities.useCommunity.mockReturnValue({ data: undefined, error: null, isPending: true, refetch: vi.fn() });
    const tree = renderTree(form({ isEditing: true, communityId: CID }));
    expect(textsOf(tree)).toContain(en['async.loading']);
    expect(has(tree, 'community.createCommunity.name')).toBe(false);
    expect(writes.createCommunity.mutate).not.toHaveBeenCalled();
  });

  it('BR-59s: Edit with no community opened sends nothing', () => {
    const tree = renderTree(form({ isEditing: true }));
    expect(writes.createCommunity.mutate).not.toHaveBeenCalled();
    expect(writes.updateCommunity.mutate).not.toHaveBeenCalled();
    if (has(tree, 'community.createCommunity.submit')) expectUnavailable(tree, 'community.createCommunity.submit');
  });

  it('the settings with no field in the API are drawn and disabled, and send nothing', () => {
    const tree = renderTree(form());
    for (const id of ['cover', 'language', 'visibility', 'membership', 'posting', 'discussion']) {
      expectUnavailable(tree, `community.createCommunity.${id}`);
    }
    expect(writes.createCommunity.mutate).not.toHaveBeenCalled();
    expect(textsOf(tree).join(' ')).not.toContain('has nowhere to send anything');
  });
});

describe('CommunityDetailsScreen (BR-59s)', () => {
  function details(over: Partial<React.ComponentProps<typeof CommunityDetailsScreen>> = {}) {
    return <CommunityDetailsScreen onBack={noop} role="SUPER_ADMIN" communityId={CID} can={everything} {...over} />;
  }

  function loaded(c: CommunityDto = community()) {
    communities.useCommunity.mockReturnValue(loadedQuery(c));
  }

  it('BR-59s: shows the community the API returned with its derived counts', () => {
    loaded();
    const tree = renderTree(details());
    expect(tree.root.findByProps({ testID: 'community.details.name' }).props.children).toBe('Nilgiris Tea Growers');
    expect(tree.root.findByProps({ testID: 'community.details.status' }).props.children).toBe(en['community.status.Active']);
    const text = textsOf(tree);
    expect(text).toContain('41');
    expect(text).toContain('3');
    expect(communities.useCommunity).toHaveBeenCalledWith(CID, { enabled: true });
  });

  it('a value the API cannot supply is the dash: no discoverability, membership or per-community post counts', () => {
    loaded();
    const tree = renderTree(details());
    // Knowledge posts, open discussions, announcements, discoverability, membership.
    expect(textsOf(tree).filter((s) => s === DASH).length).toBeGreaterThanOrEqual(5);
  });

  it('BR-59s: the Members section lists the derived members', () => {
    loaded();
    communities.useCommunityMembers.mockReturnValue(numberedList([member()], { total: 1 }));
    const tree = renderTree(details());
    expect(has(tree, 'community.details.member.f1')).toBe(true);
    const text = textsOf(tree);
    expect(text).toContain('Ravi Kumar');
    expect(text).toContain(`+919876543210 · Coonoor · 2 groups`);
    expect(communities.useCommunityMembers).toHaveBeenCalledWith(CID, { enabled: true });
  });

  it('BR-59s: the Groups section lists the community’s groups and opens one', () => {
    loaded();
    communities.useCommunityGroups.mockReturnValue(numberedList([group()], { total: 1 }));
    const onGroup = vi.fn();
    const tree = renderTree(details({ onNavigateGroupDetail: onGroup }));
    expect(textsOf(tree)).toContain('Tea circle');
    press(tree, 'community.details.group.g1');
    expect(onGroup).toHaveBeenCalledWith('g1');
  });

  it('the Discussions section lists this community’s questions and opens one', () => {
    loaded();
    qa.useAdminQaQuestions.mockReturnValue(numberedList([question()], { total: 1 }));
    const onDiscussion = vi.fn();
    const tree = renderTree(details({ onNavigateDiscussionDetail: onDiscussion }));
    expect(qa.useAdminQaQuestions).toHaveBeenCalledWith(expect.objectContaining({ communityId: CID }), { enabled: true });
    expect(textsOf(tree)).toContain('Is neem oil safe?');
    press(tree, 'community.details.discussion.q1');
    expect(onDiscussion).toHaveBeenCalledWith('q1');
  });

  it('loading, error and genuinely empty stay distinct inside a section', () => {
    loaded();
    communities.useCommunityMembers.mockReturnValue(numberedList([], { isLoading: true }));
    expect(textsOf(renderTree(details()))).toContain(en['async.loading']);

    communities.useCommunityMembers.mockReturnValue(numberedList([], { error: new Error('boom') }));
    const failed = textsOf(renderTree(details()));
    expect(failed).toContain(en['async.error.title']);
    expect(failed).not.toContain(en['community.empty.members']);

    communities.useCommunityMembers.mockReturnValue(numberedList([], { total: 0 }));
    const empty = textsOf(renderTree(details()));
    expect(empty).toContain(en['community.empty.members']);
  });

  it('fails closed without community.group.moderate: nothing is requested and the values are dashes', () => {
    const tree = renderTree(details({ can: learner }));
    expect(communities.useCommunity).toHaveBeenCalledWith(CID, { enabled: false });
    expect(tree.root.findByProps({ testID: 'community.details.name' }).props.children).toBe(DASH);
    expectUnavailable(tree, 'community.details.archive');
  });

  it('BR-59s: Archive asks first, and sends the archive only when confirmed', () => {
    loaded();
    const tree = renderTree(details());
    press(tree, 'community.details.archive');
    expect(writes.archiveCommunity.mutate).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledTimes(1);
    const buttons = alertSpy.mock.calls[0]?.[2] as { text: string; style?: string; onPress?: () => void }[];
    expect(buttons.some((b) => b.style === 'cancel')).toBe(true);
    const confirm = buttons.find((b) => b.text === en['community.archive.confirm.action']);
    act(() => confirm?.onPress?.());
    expect(writes.archiveCommunity.mutate).toHaveBeenCalledTimes(1);
    expect(writes.archiveCommunity.mutate.mock.calls[0]?.[0]).toBe(CID);
  });

  it('BR-59s: the archived success message exists only after the archive has settled', () => {
    loaded();
    const tree = renderTree(details());
    press(tree, 'community.details.archive');
    const confirm = (alertSpy.mock.calls[0]?.[2] as { text: string; onPress?: () => void }[]).find(
      (b) => b.text === en['community.archive.confirm.action'],
    );
    act(() => confirm?.onPress?.());
    expect(alertSpy.mock.calls.some((c) => c[1] === en['community.community.archived'])).toBe(false);
    act(() => onSuccessOf(writes.archiveCommunity.mutate)());
    expect(alertSpy.mock.calls.some((c) => c[1] === en['community.community.archived'])).toBe(true);
  });

  it('a server failure on archive shows the error and no success', () => {
    loaded();
    communities.useArchiveCommunity.mockReturnValue({ ...writes.archiveCommunity, error: new Error('boom') });
    const tree = renderTree(details());
    expect(has(tree, 'community.details.archiveError')).toBe(true);
    expect(alertSpy.mock.calls.some((c) => c[1] === en['community.community.archived'])).toBe(false);
  });

  it('an archived community cannot be archived again', () => {
    loaded(community({ isArchived: true }));
    const tree = renderTree(details());
    expectUnavailable(tree, 'community.details.archive');
    expect(tree.root.findByProps({ testID: 'community.details.status' }).props.children).toBe(en['community.status.Archived']);
  });

  it('the menu: block chat, block community and deactivate have no endpoint — disabled, firing nothing; archive is live', () => {
    loaded();
    const tree = renderTree(details());
    for (const id of ['blockChat', 'blockCommunity', 'deactivate']) expectUnavailable(tree, `community.details.menu.${id}`);
    expect(writes.archiveCommunity.mutate).not.toHaveBeenCalled();
    press(tree, 'community.details.menu.archive');
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(writes.archiveCommunity.mutate).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Review workflow
// ═══════════════════════════════════════════════════════════════════════════

describe.each([
  {
    name: 'ContentItemDetailScreen',
    button: 'community.contentItem.approval',
    reviewError: 'community.contentItem.reviewError',
    publish: 'community.contentItem.publish',
    render: (can: (c: string) => boolean) => (
      <ContentItemDetailScreen onBack={noop} role="SUPER_ADMIN" contentKind="article" contentId="art-1" can={can} />
    ),
  },
  {
    name: 'ContentPendingReviewScreen',
    button: 'community.pendingReview.pending',
    reviewError: 'community.pendingReview.reviewError',
    publish: 'community.pendingReview.publish',
    render: (can: (c: string) => boolean) => (
      <ContentPendingReviewScreen onBack={noop} contentKind="article" contentId="art-1" can={can} />
    ),
  },
])('$name: the review workflow (BR-59t)', ({ button, reviewError, publish, render }) => {
  function open(over: Partial<LearningArticleDto>, can = reviewer) {
    learning.useLearningArticle.mockReturnValue(loadedQuery(article(over)));
    return renderTree(render(can));
  }

  it('BR-59t: an unsubmitted item offers Submit for review, and it POSTs submit-review for that item', () => {
    const tree = open({ reviewStatus: 'NOT_SUBMITTED' });
    expect(textsOf(tree)).toContain(en['community.action.submitReview']);
    press(tree, button);
    expect(writes.submit.mutate).toHaveBeenCalledTimes(1);
    expect(writes.submit.mutate.mock.calls[0]?.[0]).toEqual({ type: 'articles', id: 'art-1' });
    expect(writes.review.mutate).not.toHaveBeenCalled();
  });

  it('BR-59t: the submit success message exists only once the mutation has settled', () => {
    const tree = open({ reviewStatus: 'NOT_SUBMITTED' });
    press(tree, button);
    expect(alertSpy).not.toHaveBeenCalled();
    act(() => onSuccessOf(writes.submit.mutate)());
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(alertSpy.mock.calls[0]?.[1]).toBe(en['community.review.submitted']);
  });

  it('BR-59t: a pending item offers the decision to a reviewer; Approve and Reject each send their own status', () => {
    const tree = open({ reviewStatus: 'PENDING_REVIEW' });
    expect(textsOf(tree)).toContain(en['community.action.review']);
    press(tree, button);
    expect(writes.review.mutate).not.toHaveBeenCalled();
    const buttons = alertSpy.mock.calls[0]?.[2] as { text: string; style?: string; onPress?: () => void }[];
    expect(buttons.map((b) => b.text)).toEqual([
      en['community.review.approve'],
      en['community.review.reject'],
      en['community.action.cancel'],
    ]);
    act(() => buttons[0]?.onPress?.());
    expect(writes.review.mutate.mock.calls[0]?.[0]).toEqual({ type: 'articles', id: 'art-1', status: 'APPROVED' });
    act(() => buttons[1]?.onPress?.());
    expect(writes.review.mutate.mock.calls[1]?.[0]).toEqual({ type: 'articles', id: 'art-1', status: 'REJECTED' });
  });

  it('BR-59t: a review decision does not change isPublished — no publish write is made, and none carries the flag', () => {
    const tree = open({ reviewStatus: 'PENDING_REVIEW', isPublished: false });
    press(tree, button);
    const buttons = alertSpy.mock.calls[0]?.[2] as { onPress?: () => void }[];
    act(() => buttons[0]?.onPress?.());
    expect(JSON.stringify(writes.review.mutate.mock.calls[0]?.[0])).not.toContain('isPublished');
    act(() => onSuccessOf(writes.review.mutate)());
    expect(writes.updateArticle.mutate).not.toHaveBeenCalled();
    expect(writes.updateVideo.mutate).not.toHaveBeenCalled();
    expect(writes.updateTraining.mutate).not.toHaveBeenCalled();
    expect(alertSpy.mock.calls.some((c) => c[1] === en['community.review.approved'])).toBe(true);
  });

  it('BR-59t: Publish is never blocked by review state — a draft that is pending review can still be published', () => {
    const tree = open({ reviewStatus: 'PENDING_REVIEW', isPublished: false });
    const control = tree.root.findByProps({ testID: publish });
    expect(control.props.disabled).toBe(false);
    press(tree, publish);
    expect(writes.updateArticle.mutate.mock.calls[0]?.[0]).toEqual({ id: 'art-1', body: { isPublished: true } });
    expect(writes.review.mutate).not.toHaveBeenCalled();
    expect(writes.submit.mutate).not.toHaveBeenCalled();
  });

  it('BR-59t: published AND pending review at once is shown as both, and both controls are live', () => {
    const tree = open({ reviewStatus: 'PENDING_REVIEW', isPublished: true });
    const text = textsOf(tree);
    expect(text).toContain(en['community.action.unpublish']);
    expect(text).toContain(en['community.action.review']);
    expect(tree.root.findByProps({ testID: publish }).props.disabled).toBe(false);
    expect(tree.root.findByProps({ testID: button }).props.disabled).toBe(false);
  });

  it('BR-59t: without learning.content.review a pending item is a status, not a decision, and fires nothing', () => {
    const tree = open({ reviewStatus: 'PENDING_REVIEW' }, learner);
    expectUnavailable(tree, button);
    expect(textsOf(tree)).toContain(en['community.review.status.PENDING_REVIEW']);
    expect(writes.review.mutate).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('BR-59t: approved content has nothing to send', () => {
    const tree = open({ reviewStatus: 'APPROVED' });
    expectUnavailable(tree, button);
  });

  it('a server failure shows the error and no success message', () => {
    learning.useSubmitLearningForReview.mockReturnValue({ ...writes.submit, error: new Error('boom') });
    const tree = open({ reviewStatus: 'NOT_SUBMITTED' });
    expect(has(tree, reviewError)).toBe(true);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('the review state is drawn as its own row beside the published state', () => {
    const tree = open({ reviewStatus: 'PENDING_REVIEW', isPublished: true });
    const text = textsOf(tree);
    expect(text).toContain(en['community.meta.reviewStatus']);
    expect(text).toContain(en['community.review.status.PENDING_REVIEW']);
    expect(text).toContain(en['community.status.Published']);
  });
});

describe('ContentItemDetailScreen: Replies and View chat (BR-59u)', () => {
  function open(role: string, items: QaQuestionSummaryDto[], onNavigateChat = vi.fn()) {
    learning.useLearningArticle.mockReturnValue(loadedQuery(article()));
    qa.useAdminQaQuestions.mockReturnValue(numberedList(items, { total: items.length }));
    const tree = renderTree(
      <ContentItemDetailScreen onBack={noop} role={role} contentKind="article" contentId="art-1" can={everything} onNavigateChat={onNavigateChat} />,
    );
    return { tree, onNavigateChat };
  }

  it('BR-59u: lists the questions asked about this item, and opens one', () => {
    const { tree, onNavigateChat } = open('SUPER_ADMIN', [question()]);
    expect(qa.useAdminQaQuestions).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'articles', contentId: 'art-1' }),
      { enabled: true },
    );
    expect(textsOf(tree)).toContain('Is neem oil safe?');
    expect(textsOf(tree)).not.toContain('Replies are not built yet');
    press(tree, 'community.contentItem.reply.q1');
    expect(onNavigateChat).toHaveBeenCalledWith('q1');
  });

  it('a genuinely empty replies list says so, and is not the error state', () => {
    const { tree } = open('SUPER_ADMIN', []);
    expect(textsOf(tree)).toContain(en['community.empty.replies']);
    expect(textsOf(tree)).not.toContain(en['async.error.title']);
  });

  it('View chat opens the first thread, and is unavailable when there is none', () => {
    const { tree, onNavigateChat } = open('TOHFA_ADMIN', [question()]);
    press(tree, 'community.contentItem.viewChat');
    expect(onNavigateChat).toHaveBeenCalledWith('q1');

    const none = open('TOHFA_ADMIN', []);
    expectUnavailable(none.tree, 'community.contentItem.viewChat');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Q&A chat
// ═══════════════════════════════════════════════════════════════════════════

describe('QuestionAnswerChatScreen (BR-59u)', () => {
  function chat(over: Partial<React.ComponentProps<typeof QuestionAnswerChatScreen>> = {}) {
    return <QuestionAnswerChatScreen onBack={noop} role="SUPER_ADMIN" questionId="q1" can={everything} {...over} />;
  }

  function open(t: QaQuestionDetailDto = thread(), over: Partial<React.ComponentProps<typeof QuestionAnswerChatScreen>> = {}) {
    qa.useAdminQaQuestion.mockReturnValue(loadedQuery(t));
    return renderTree(chat(over));
  }

  it('BR-59u: renders the thread the API returned — the question, then the answers — not a "not built" panel', () => {
    const tree = open();
    const text = textsOf(tree);
    expect(text).toContain('Is neem oil safe?');
    expect(text).toContain('On tomato flowers?');
    expect(text).toContain('Spray in the evening.');
    expect(text).toContain('Selvi');
    expect(text).toContain('Admin Asha');
    expect(text).not.toContain(en['community.gap.messages.title']);
    expect(qa.useAdminQaQuestion).toHaveBeenCalledWith('q1', { enabled: true });
  });

  it('BR-59u: a farmer’s answer is a farmer bubble — anyone can answer, so it is not admin-only', () => {
    const t = thread({
      answers: [
        {
          id: 'an2',
          questionId: 'q1',
          content: 'Dilute it first.',
          author: { id: 'u3', displayName: 'Muthu', role: 'FARMER' },
          isBlocked: false,
          createdAt: '2026-10-11T03:30:00.000Z',
          updatedAt: '2026-10-11T03:30:00.000Z',
        },
      ],
    });
    const tree = open(t);
    expect(textsOf(tree)).toContain('Muthu');
    expect(textsOf(tree)).toContain('Dilute it first.');
  });

  it('a blocked message is shown to the moderator with its reason', () => {
    const tree = open(thread({ isBlocked: true, blockReason: 'off-topic' }));
    expect(textsOf(tree).join(' ')).toContain('off-topic');
  });

  it('loading, error, no thread and no answers are four different things', () => {
    qa.useAdminQaQuestion.mockReturnValue({ data: undefined, error: null, isPending: true, refetch: vi.fn() });
    expect(textsOf(renderTree(chat()))).toContain(en['async.loading']);

    qa.useAdminQaQuestion.mockReturnValue({ data: undefined, error: new Error('boom'), isPending: false, refetch: vi.fn() });
    const failed = textsOf(renderTree(chat()));
    expect(failed).toContain(en['async.error.title']);

    const none = textsOf(renderTree(chat({ questionId: undefined })));
    expect(none).toContain(en['community.chat.noThread']);
    expect(qa.useAdminQaQuestion).toHaveBeenCalledWith(undefined, { enabled: true });

    const unanswered = textsOf(open(thread({ answers: [], answerCount: 0 })));
    expect(unanswered).toContain(en['community.chat.noAnswers']);
    expect(unanswered).not.toContain(en['async.error.title']);
  });

  it('BR-59u: Send posts the trimmed reply to this question, and the box clears only once it settled', () => {
    const tree = open();
    type(tree, 'community.chat.input', '  Use compost.  ');
    press(tree, 'community.chat.send');
    expect(writes.postAnswer.mutate).toHaveBeenCalledTimes(1);
    expect(writes.postAnswer.mutate.mock.calls[0]?.[0]).toEqual({ questionId: 'q1', content: 'Use compost.' });
    expect(tree.root.findByProps({ testID: 'community.chat.input' }).props.value).toBe('  Use compost.  ');
    act(() => onSuccessOf(writes.postAnswer.mutate)());
    expect(tree.root.findByProps({ testID: 'community.chat.input' }).props.value).toBe('');
  });

  it('BR-59u: Send is unavailable for an empty reply and for a caller without qa_participate', () => {
    const tree = open();
    expectUnavailable(tree, 'community.chat.send');
    const noParticipate = open(thread(), { can: makeCan(['learning.admin.manage', 'community.group.moderate']) });
    type(noParticipate, 'community.chat.input', 'hello');
    expectUnavailable(noParticipate, 'community.chat.send');
    expect(writes.postAnswer.mutate).not.toHaveBeenCalled();
  });

  it('a failed reply shows the error and keeps what was typed', () => {
    qa.usePostAdminQaAnswer.mockReturnValue({ ...writes.postAnswer, error: new Error('boom') });
    const tree = open();
    type(tree, 'community.chat.input', 'hello');
    expect(has(tree, 'community.chat.error')).toBe(true);
    expect(tree.root.findByProps({ testID: 'community.chat.input' }).props.value).toBe('hello');
  });

  it('BR-59u: there is no edit control for anyone’s message — editing is the author’s act on the server, not an admin override', () => {
    const tree = open();
    const ids = tree.root
      .findAll((n) => typeof n.props.testID === 'string')
      .map((n) => n.props.testID as string);
    expect(ids.filter((id) => /edit|delete/i.test(id) && !/menu\.edit/.test(id))).toEqual([]);
  });

  it('Block Chat asks first, then moderates this question with isBlocked, and flips to Unblock when blocked', () => {
    const tree = open();
    press(tree, 'community.chat.menu.blockChat');
    expect(writes.moderate.mutate).not.toHaveBeenCalled();
    const buttons = alertSpy.mock.calls[0]?.[2] as { text: string; onPress?: () => void }[];
    act(() => buttons.find((b) => b.text === en['community.chat.block.confirm.action'])?.onPress?.());
    expect(writes.moderate.mutate.mock.calls[0]?.[0]).toEqual({ id: 'q1', body: { isBlocked: true } });

    alertSpy.mockClear();
    const blocked = open(thread({ isBlocked: true, blockReason: 'off-topic' }));
    expect(textsOf(blocked)).toContain(en['community.chat.unblock']);
    press(blocked, 'community.chat.menu.blockChat');
    const unblock = (alertSpy.mock.calls[0]?.[2] as { text: string; onPress?: () => void }[]).find(
      (b) => b.text === en['community.chat.unblock.confirm.action'],
    );
    act(() => unblock?.onPress?.());
    expect(writes.moderate.mutate.mock.calls[1]?.[0]).toEqual({ id: 'q1', body: { isBlocked: false } });
  });

  it('block community and deactivate have no endpoint: disabled, firing nothing', () => {
    const tree = open();
    for (const id of ['blockCommunity', 'deactivate']) expectUnavailable(tree, `community.chat.menu.${id}`);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('Archive community in the menu archives the question’s own community, after asking', () => {
    const tree = open();
    press(tree, 'community.chat.menu.archive');
    expect(writes.archiveCommunity.mutate).not.toHaveBeenCalled();
    const confirm = (alertSpy.mock.calls[0]?.[2] as { text: string; onPress?: () => void }[]).find(
      (b) => b.text === en['community.archive.confirm.action'],
    );
    act(() => confirm?.onPress?.());
    expect(writes.archiveCommunity.mutate.mock.calls[0]?.[0]).toBe(CID);
  });

  it('a question with no community has no community to archive, view or edit', () => {
    const tree = open(thread({ communityId: null }));
    expectUnavailable(tree, 'community.chat.menu.archive');
    expectUnavailable(tree, 'community.chat.menu.details');
    expectUnavailable(tree, 'community.chat.menu.edit');
  });

  it('a moderator-less caller cannot block or archive', () => {
    const tree = open(thread(), { can: makeCan(['learning.admin.manage', 'farmer.learning.qa_participate']) });
    expectUnavailable(tree, 'community.chat.menu.blockChat');
    expectUnavailable(tree, 'community.chat.menu.archive');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Announcements
// ═══════════════════════════════════════════════════════════════════════════

describe('CreateContentScreen: the announcement path (BR-213)', () => {
  const filled = {
    contentType: 'Announcement' as const,
    announcementTitle: ' Rain alert ',
    shortSummary: 'Heavy rain',
    fullDescription: 'Cover the nursery.',
    announcementCategory: 'Weather Alert',
    audience: 'All',
  };

  function form(can = everything, initialData: Record<string, unknown> = filled) {
    return <CreateContentScreen onBack={noop} can={can} initialType="Announcement" initialData={initialData} />;
  }

  it('BR-213: Publish POSTs a SYSTEM_WIDE announcement — and not an article', () => {
    const tree = renderTree(form());
    press(tree, 'community.createContent.publish');
    expect(writes.announce.mutate).toHaveBeenCalledTimes(1);
    expect(writes.announce.mutate.mock.calls[0]?.[0]).toEqual({
      target: 'SYSTEM_WIDE',
      type: 'ALERT',
      title: 'Rain alert',
      body: 'Heavy rain\n\nCover the nursery.',
    });
    expect(writes.createArticle.mutate).not.toHaveBeenCalled();
  });

  it('BR-213: success is reported only once the announcement has been published', () => {
    const onSubmitSuccess = vi.fn();
    const tree = renderTree(<CreateContentScreen onBack={noop} can={everything} initialType="Announcement" initialData={filled} onSubmitSuccess={onSubmitSuccess} />);
    press(tree, 'community.createContent.publish');
    expect(alertSpy).not.toHaveBeenCalled();
    expect(onSubmitSuccess).not.toHaveBeenCalled();
    act(() => onSuccessOf(writes.announce.mutate)());
    expect(alertSpy.mock.calls[0]?.[1]).toBe(en['community.announcement.published']);
    expect(onSubmitSuccess).toHaveBeenCalled();
  });

  it('a server failure shows the error and no success message', () => {
    announcements.useCreateAdminAnnouncement.mockReturnValue({ ...writes.announce, error: new Error('boom') });
    const tree = renderTree(form());
    expect(has(tree, 'community.createContent.error')).toBe(true);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('BR-213: the audiences that would be ROLE targets are drawn, disabled, with a note, and send nothing', () => {
    const tree = renderTree(form());
    for (const label of ['All Farmers', 'Sub-Warehouse Managers', 'Buyers & Retailers', 'Field Officers']) {
      expectUnavailable(tree, `community.createContent.audience.${label}`);
    }
    expect(tree.root.findByProps({ testID: 'community.createContent.audience.All' }).props.disabled).toBeFalsy();
    expect(textsOf(tree)).toContain(en['community.gap.announcement.audience']);
    expect(writes.announce.mutate).not.toHaveBeenCalled();
  });

  it('BR-213: without announcement.system_wide.create Publish is unavailable', () => {
    const tree = renderTree(form(learner));
    expectUnavailable(tree, 'community.createContent.publish');
  });

  it('sends nothing, and says why, when a required field is missing', () => {
    const tree = renderTree(form(everything, { ...filled, announcementTitle: '' }));
    press(tree, 'community.createContent.publish');
    expect(writes.announce.mutate).not.toHaveBeenCalled();
    expect(textsOf(tree)).toContain(en['community.validation.announcementTitle']);
  });

  it('the old "no announcement resource" note is gone', () => {
    const tree = renderTree(form());
    expect(textsOf(tree).join(' ')).not.toContain('no announcement resource');
  });

  it('the article path is unchanged: Publish still POSTs an article, never an announcement', () => {
    const article = { title: 'Mulching', shortDescription: 'Keep covered', farmingCategory: 'Soil Health', instructions: 'Lay straw.', readTime: '4 min read' };
    const tree = renderTree(<CreateContentScreen onBack={noop} can={everything} initialData={article} />);
    press(tree, 'community.createContent.publish');
    expect(writes.createArticle.mutate).toHaveBeenCalledTimes(1);
    expect(writes.announce.mutate).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Group parent community
// ═══════════════════════════════════════════════════════════════════════════

describe('CreateGroupScreen: the parent-community selector (BR-59s)', () => {
  const filled = { name: 'Tea circle', description: 'Tea', category: 'Market' };

  function form(over: Partial<React.ComponentProps<typeof CreateGroupScreen>> = {}) {
    return <CreateGroupScreen onBack={noop} can={everything} {...over} />;
  }

  function withCommunities() {
    communities.useCommunities.mockReturnValue(
      numberedList([community(), community({ id: 'c2', name: 'Old', isArchived: true })], { total: 2 }),
    );
  }

  it('BR-59s: the selector is live, offers the active communities, and an archived one is not offered', () => {
    withCommunities();
    const tree = renderTree(form());
    const parent = tree.root.findByProps({ testID: 'community.createGroup.parent' });
    expect(parent.props.disabled).toBeFalsy();
    expect(tree.root.findAllByProps({ testID: `community.createGroup.parent.option.${CID}` }).length).toBeGreaterThan(0);
    expect(has(tree, 'community.createGroup.parent.option.c2')).toBe(false);
    expect(communities.useCommunities).toHaveBeenCalledWith(expect.anything(), { enabled: true });
  });

  it('BR-59s: choosing a parent files the new group under it', () => {
    withCommunities();
    const tree = renderTree(form());
    press(tree, `community.createGroup.parent.option.${CID}`);
    type(tree, 'community.createGroup.name', filled.name);
    type(tree, 'community.createGroup.description', filled.description);
    press(tree, `community.createGroup.category.${filled.category}`);
    press(tree, 'community.createGroup.submit');
    expect(writes.createGroup.mutate.mock.calls[0]?.[0]).toEqual({ ...filled, communityId: CID });
    expect(textsOf(tree)).toContain('Nilgiris Tea Growers');
  });

  it('BR-59s: with no parent chosen no communityId is sent at all', () => {
    withCommunities();
    const tree = renderTree(form());
    type(tree, 'community.createGroup.name', filled.name);
    type(tree, 'community.createGroup.description', filled.description);
    press(tree, `community.createGroup.category.${filled.category}`);
    press(tree, 'community.createGroup.submit');
    expect(writes.createGroup.mutate.mock.calls[0]?.[0]).toEqual(filled);
  });

  it('BR-59s: editing keeps the stored parent, and clearing it sends null', () => {
    withCommunities();
    const initialGroup = { name: 'Tea circle', description: 'Tea', category: 'Market', communityId: CID };
    const tree = renderTree(form({ isEditing: true, groupId: 'g1', initialGroup }));
    press(tree, 'community.createGroup.submit');
    expect(writes.updateGroup.mutate.mock.calls[0]?.[0]).toEqual({ id: 'g1', body: { ...filled, communityId: CID } });

    press(tree, 'community.createGroup.parent.none');
    press(tree, 'community.createGroup.submit');
    expect(writes.updateGroup.mutate.mock.calls[1]?.[0]).toEqual({ id: 'g1', body: { ...filled, communityId: null } });
  });

  it('without community.group.moderate the community list is not requested and the selector is drawn disabled', () => {
    const tree = renderTree(form({ can: learner }));
    expect(communities.useCommunities).toHaveBeenCalledWith(expect.anything(), { enabled: false });
    expectUnavailable(tree, 'community.createGroup.parent');
  });

  it('the parent no longer carries the "no community resource" note', () => {
    const tree = renderTree(form());
    expect(textsOf(tree).join(' ')).not.toContain('no community resource');
  });

  it('a failed communities read shows the error in the selector, and the group can still be saved', () => {
    communities.useCommunities.mockReturnValue(numberedList([], { error: new Error('boom'), total: undefined }));
    const tree = renderTree(form());
    expect(textsOf(tree)).toContain(en['async.error.title']);
    type(tree, 'community.createGroup.name', filled.name);
    type(tree, 'community.createGroup.description', filled.description);
    press(tree, `community.createGroup.category.${filled.category}`);
    press(tree, 'community.createGroup.submit');
    expect(writes.createGroup.mutate).toHaveBeenCalledTimes(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Home tiles
// ═══════════════════════════════════════════════════════════════════════════

describe('CommunityKnowledgeHomeScreen: the tiles the new endpoints answer', () => {
  function home() {
    return renderTree(<CommunityKnowledgeHomeScreen onNavigateCreateContent={noop} can={everything} />);
  }

  it('BR-59s / BR-59u: Communities and Discussions are the server totals', () => {
    communities.useCommunities.mockReturnValue(numberedList([community()], { total: 5 }));
    qa.useAdminQaQuestions.mockReturnValue(numberedList([question()], { total: 12 }));
    const text = textsOf(home());
    expect(text).toContain('5');
    expect(text).toContain('12');
  });

  it('BR-59t: Pending review is the sum of the four reviewStatus=PENDING_REVIEW totals', () => {
    for (const name of ['useLearningArticles', 'useLearningVideos', 'useLearningTrainings', 'useLearningGroups'] as const) {
      learning[name].mockImplementation((params: { reviewStatus?: string }) =>
        numberedList([], { total: params.reviewStatus === 'PENDING_REVIEW' ? 2 : 40 }),
      );
    }
    const text = textsOf(home());
    expect(text).toContain('8');
    expect(learning.useLearningArticles).toHaveBeenCalledWith(expect.objectContaining({ reviewStatus: 'PENDING_REVIEW' }), { enabled: true });
  });

  it('BR-59t: Pending review is a dash while any one of the four has not answered', () => {
    learning.useLearningArticles.mockImplementation((params: { reviewStatus?: string }) =>
      numberedList([], { total: params.reviewStatus === 'PENDING_REVIEW' ? undefined : 40 }),
    );
    const tree = home();
    const card = tree.root.findAll((n) => n.props.title === 'Pending review' && n.props.value !== undefined)[0];
    expect(card?.props.value).toBe(DASH);
  });

  it('Announcements has no count in the API and stays the dash', () => {
    expect(textsOf(home()).filter((s) => s === DASH).length).toBeGreaterThanOrEqual(1);
  });
});
