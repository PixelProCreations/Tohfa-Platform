/**
 * Community & Knowledge Flow (Module 15: CKM-01 to CKM-10)
 * In-module navigator for Community & Knowledge Management screens.
 * Serves as the shared-screen flow for both Super Admin and Tohfa Admin.
 * Strictly adheres to Admin Design Tokens from ../../theme.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useFlowBack } from '../warehouse/useFlowBack';
import { adminColors } from '../../theme';

import { CommunityKnowledgeHomeScreen } from './CommunityKnowledgeHomeScreen';
import { KnowledgeLibraryScreen } from './KnowledgeLibraryScreen';
import { CommunityDetailsScreen } from './CommunityDetailsScreen';
import { CommunitiesListScreen } from './CommunitiesListScreen';
import { GroupsListScreen } from './GroupsListScreen';
import { CreateContentScreen, type ContentTypeOption, type CreateContentInitialData } from './CreateContentScreen';
import { CreateGroupScreen } from './CreateGroupScreen';
import { CreateCommunityScreen } from './CreateCommunityScreen';
import { AddVideoScreen } from './AddVideoScreen';
import { ArticleDetailsScreen } from './ArticleDetailsScreen';
import { ContentItemDetailScreen } from './ContentItemDetailScreen';
import { ContentPendingReviewScreen } from './ContentPendingReviewScreen';
import { QuestionAnswerChatScreen } from './QuestionAnswerChatScreen';
import { EditItemGate, type EditTarget } from './EditItemGate';
import { editRouteOf, type ContentDto, type ContentKind, type LibraryRowView } from './communityLogic';
import { canReviewLearning } from './reviewLogic';

export type CommunityRoute =
  | 'home'
  | 'knowledge_library'
  | 'community_details'
  | 'all_communities'
  | 'create_group'
  | 'all_groups'
  | 'create_content'
  | 'create_community'
  | 'add_video'
  | 'article_details'
  | 'content_pending_review'
  | 'content_item_detail'
  | 'qa_chat';

export interface CommunityStackEntry {
  screen: CommunityRoute;
  params?: Record<string, unknown> | undefined;
}

export interface CommunityKnowledgeFlowProps {
  onBack: () => void;
  role?: string | undefined;
  can?: ((code: string) => boolean) | undefined;
}

export function CommunityKnowledgeFlow({
  onBack,
  role = 'SUPER_ADMIN',
  can,
}: CommunityKnowledgeFlowProps) {
  const [stack, setStack] = useState<CommunityStackEntry[]>([{ screen: 'home' }]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | undefined>(undefined);
  const [createContentType, setCreateContentType] = useState<ContentTypeOption>('Article');
  const [createContentData, setCreateContentData] = useState<CreateContentInitialData | undefined>(undefined);
  const [isEditingCommunity, setIsEditingCommunity] = useState<boolean>(false);
  /** The Q&A thread the chat screen shows; undefined means no conversation is open. */
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | undefined>(undefined);
  /**
   * Which Learning Hub row the detail screens should read. The library row
   * carries both halves because the four resources live at four paths; a bare
   * id would not say which one to ask.
   */
  const [selectedContent, setSelectedContent] = useState<{ kind: ContentKind; id: string } | undefined>(undefined);

  /**
   * The item an Edit was pressed on. Set only by openEdit; every other way into
   * a form clears it, so "create" can never inherit a previous edit and an edit
   * can never fall back to an empty create form (which would POST a duplicate).
   */
  const [editTarget, setEditTarget] = useState<EditTarget | undefined>(undefined);

  const current = stack[stack.length - 1] ?? { screen: 'home' };

  const navigate = (screen: CommunityRoute, params?: Record<string, unknown> | undefined) => {
    if (screen === 'create_content' || screen === 'add_video' || screen === 'create_group') setEditTarget(undefined);
    setStack((prev) => [...prev, params ? { screen, params } : { screen }]);
  };

  /** Edit on the opened item: to the form for its kind, carrying kind, id and the loaded item. */
  const openEdit = (content: ContentDto | undefined) => {
    const route = editRouteOf(selectedContent?.kind);
    if (selectedContent === undefined || route === null) return;
    navigate(route);
    setEditTarget({ kind: selectedContent.kind, id: selectedContent.id, content });
  };

  const back = () => {
    if (stack.length > 1) {
      setStack((prev) => prev.slice(0, -1));
    } else {
      onBack();
    }
  };

  useFlowBack(() => {
    if (stack.length <= 1) return false;
    back();
    return true;
  });

  const renderScreen = () => {
    switch (current.screen) {
      case 'home':
        return (
          <CommunityKnowledgeHomeScreen
            onBack={back}
            can={can}
            onNavigateCreateContent={(type) => {
              setCreateContentData(undefined);
              setCreateContentType(type || 'Article');
              navigate('create_content');
            }}
            onNavigateAddVideo={() => navigate('add_video')}
            onNavigateKnowledgeLibrary={() => navigate('knowledge_library')}
            onNavigateCommunityDetails={(commId) => {
              if (commId) setSelectedCommunityId(commId);
              navigate('community_details');
            }}
            onNavigateAllCommunities={() => navigate('all_communities')}
            onNavigateCreateGroup={() => navigate('create_group')}
            onNavigateAllGroups={() => navigate('all_groups')}
            onNavigateCreateCommunity={() => {
              setIsEditingCommunity(false);
              navigate('create_community');
            }}
            onViewActivityDetails={() => navigate('article_details')}
          />
        );

      case 'knowledge_library':
        return (
          <KnowledgeLibraryScreen
            onBack={back}
            can={can}
            onSelectItem={(item: LibraryRowView) => {
              setSelectedContent({ kind: item.kind, id: item.id });
              // BR-59t: an item waiting on a decision opens where a reviewer can make it;
              // everything else opens the ordinary detail. Review state never decides
              // whether the item is published.
              navigate(item.reviewStatus === 'PENDING_REVIEW' && canReviewLearning(can) ? 'content_pending_review' : 'content_item_detail');
            }}
            onSelectCommunity={(commId) => {
              setSelectedCommunityId(commId);
              navigate('community_details');
            }}
            onNavigateAddVideo={() => navigate('add_video')}
            onNavigateCreateContent={() => {
              setCreateContentData(undefined);
              navigate('create_content');
            }}
          />
        );

      case 'content_item_detail':
        return (
          <ContentItemDetailScreen
            role={role}
            can={can}
            contentKind={selectedContent?.kind}
            contentId={selectedContent?.id}
            onBack={back}
            onNavigateChat={(questionId) => {
              setSelectedQuestionId(questionId);
              navigate('qa_chat');
            }}
            onNavigateMessages={() => navigate('article_details')}
            onNavigateEditContent={openEdit}
          />
        );

      case 'qa_chat':
        return (
          <QuestionAnswerChatScreen
            role={role}
            can={can}
            questionId={selectedQuestionId}
            onBack={back}
            onNavigateDetails={(commId) => {
              if (commId) setSelectedCommunityId(commId);
              navigate('community_details');
            }}
            onNavigateEdit={(commId) => {
              if (commId) setSelectedCommunityId(commId);
              setIsEditingCommunity(true);
              navigate('create_community');
            }}
          />
        );

      case 'community_details':
        return (
          <CommunityDetailsScreen
            role={role}
            can={can}
            communityId={selectedCommunityId}
            onBack={back}
            onNavigateMemberDetail={(_memberId) => {}}
            onNavigateGroupDetail={(groupId) => {
              setSelectedContent({ kind: 'group', id: groupId });
              navigate('content_item_detail');
            }}
            onNavigateKnowledgeDetail={(_kId) => navigate('content_item_detail')}
            onNavigateDiscussionDetail={(questionId) => {
              setSelectedQuestionId(questionId);
              navigate('qa_chat');
            }}
            onNavigateAnnouncementDetail={(_aId) => navigate('article_details')}
            onNavigateEditCommunity={(commId) => {
              if (commId) setSelectedCommunityId(commId);
              setIsEditingCommunity(true);
              navigate('create_community');
            }}
            onNavigateCreatePost={(_commId) => navigate('create_content')}
          />
        );

      case 'all_communities':
        return (
          <CommunitiesListScreen
            onBack={back}
            can={can}
            onSelectCommunity={(commId) => {
              setSelectedCommunityId(commId);
              navigate('community_details');
            }}
            onNavigateCreateCommunity={() => {
              setIsEditingCommunity(false);
              navigate('create_community');
            }}
            onNavigateEditCommunity={(commId) => {
              if (commId) setSelectedCommunityId(commId);
              setIsEditingCommunity(true);
              navigate('create_community');
            }}
            onNavigateCreatePost={(_commId) => navigate('create_content')}
          />
        );

      case 'all_groups':
        return (
          <GroupsListScreen
            onBack={back}
            can={can}
            onSelectGroup={(groupId) => {
              setSelectedContent({ kind: 'group', id: groupId });
              navigate('content_item_detail');
            }}
            onNavigateCreateGroup={() => navigate('create_group')}
          />
        );

      case 'create_community':
        return (
          <CreateCommunityScreen
            onBack={back}
            can={can}
            isEditing={isEditingCommunity}
            communityId={isEditingCommunity ? selectedCommunityId : undefined}
            onSubmitSuccess={() => navigate('all_communities')}
          />
        );

      case 'create_group':
        return (
          editTarget !== undefined && editTarget.kind === 'group' ? (
            <EditItemGate target={editTarget} onBack={back} can={can}>
              {(content) =>
                content.kind === 'group' ? (
                  <CreateGroupScreen
                    key={content.dto.id}
                    onBack={back}
                    can={can}
                    isEditing
                    groupId={content.dto.id}
                    initialGroup={{
                      name: content.dto.name,
                      description: content.dto.description,
                      category: content.dto.category,
                      communityId: content.dto.communityId,
                    }}
                    onSubmitSuccess={() => navigate('all_groups')}
                  />
                ) : (
                  <></>
                )
              }
            </EditItemGate>
          ) : (
            <CreateGroupScreen
              onBack={back}
              can={can}
              onSubmitSuccess={() => navigate('all_groups')}
            />
          )
        );

      case 'create_content':
        return (
          <CreateContentScreen
            onBack={back}
            can={can}
            initialType={createContentType}
            initialData={createContentData}
            editing={editTarget?.kind === 'article' ? editTarget : undefined}
            onSubmitSuccess={() => navigate('knowledge_library')}
          />
        );

      case 'add_video':
        return (
          <AddVideoScreen
            onBack={back}
            can={can}
            editing={editTarget?.kind === 'video' ? editTarget : undefined}
            onSubmitSuccess={() => navigate('knowledge_library')}
          />
        );

      case 'article_details':
        return (
          <ArticleDetailsScreen
            onBack={back}
            can={can}
            articleId={selectedContent?.kind === 'article' ? selectedContent.id : undefined}
            onOpenChatThread={() => navigate('qa_chat')}
            onOpenContentDetails={() => navigate('content_item_detail')}
          />
        );

      case 'content_pending_review':
        return (
          <ContentPendingReviewScreen
            onBack={back}
            can={can}
            contentKind={selectedContent?.kind}
            contentId={selectedContent?.id}
            onNavigateEditContent={openEdit}
            onPublishSuccess={() => navigate('knowledge_library')}
          />
        );

      default:
        return (
          <CommunityKnowledgeHomeScreen
            onBack={back}
            onNavigateCreateContent={() => navigate('create_content')}
          />
        );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: adminColors.canvas }}>
      {renderScreen()}
    </View>
  );
}

