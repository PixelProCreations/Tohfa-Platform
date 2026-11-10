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
  params?: Record<string, unknown>;
}

export interface CommunityKnowledgeFlowProps {
  onBack: () => void;
  role?: string | undefined;
  can?: ((code: string) => boolean) | undefined;
}

export function CommunityKnowledgeFlow({
  onBack,
  role = 'SUPER_ADMIN',
  can: _can,
}: CommunityKnowledgeFlowProps) {
  const [stack, setStack] = useState<CommunityStackEntry[]>([{ screen: 'home' }]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('comm-1');
  const [createContentType, setCreateContentType] = useState<ContentTypeOption>('Article');
  const [createContentData, setCreateContentData] = useState<CreateContentInitialData | undefined>(undefined);
  const [isEditingCommunity, setIsEditingCommunity] = useState<boolean>(false);

  const current = stack[stack.length - 1] ?? { screen: 'home' };

  const navigate = (screen: CommunityRoute, params?: Record<string, unknown>) => {
    setStack((prev) => [...prev, { screen, params }]);
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
            onSelectItem={(_item) => navigate('content_item_detail')}
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
            onBack={back}
            onNavigateChat={() => navigate('qa_chat')}
            onNavigateMessages={() => navigate('article_details')}
            onNavigateEditContent={() => navigate('create_content')}
          />
        );

      case 'qa_chat':
        return (
          <QuestionAnswerChatScreen
            role={role}
            onBack={back}
            articleTitle={(current.params?.title as string) || 'Mulching for water retention'}
            contentType={(current.params?.type as string) || 'Article'}
            onNavigateDetails={() => navigate('community_details')}
            onNavigateEdit={() => {
              setIsEditingCommunity(true);
              navigate('create_community');
            }}
          />
        );

      case 'community_details':
        return (
          <CommunityDetailsScreen
            role={role}
            communityId={selectedCommunityId}
            onBack={back}
            onNavigateMemberDetail={(_memberId) => {}}
            onNavigateGroupDetail={(_groupId) => navigate('create_group')}
            onNavigateKnowledgeDetail={(_kId) => navigate('content_item_detail')}
            onNavigateDiscussionDetail={(_dId) => navigate('qa_chat')}
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
            onSelectCommunity={(commId) => {
              setSelectedCommunityId(commId);
              navigate('community_details');
            }}
            onNavigateCreateCommunity={() => {
              setIsEditingCommunity(false);
              navigate('create_community');
            }}
            onNavigateEditCommunity={(commId) => {
              setSelectedCommunityId(commId);
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
            onSelectGroup={() => navigate('create_group')}
            onNavigateCreateGroup={() => navigate('create_group')}
          />
        );

      case 'create_community':
        return (
          <CreateCommunityScreen
            onBack={back}
            isEditing={isEditingCommunity}
            communityId={isEditingCommunity ? selectedCommunityId : undefined}
            onSaveSuccess={() => navigate('all_communities')}
          />
        );

      case 'create_group':
        return (
          <CreateGroupScreen
            onBack={back}
            onSaveSuccess={() => navigate('all_groups')}
          />
        );

      case 'create_content':
        return (
          <CreateContentScreen
            onBack={back}
            initialContentType={createContentType}
            initialData={createContentData}
            onSaveSuccess={() => navigate('knowledge_library')}
          />
        );

      case 'add_video':
        return (
          <AddVideoScreen
            onBack={back}
            onSaveSuccess={() => navigate('knowledge_library')}
          />
        );

      case 'article_details':
        return (
          <ArticleDetailsScreen
            onBack={back}
            onOpenChatThread={() => navigate('qa_chat')}
            onOpenContentDetails={() => navigate('content_item_detail')}
          />
        );

      case 'content_pending_review':
        return (
          <ContentPendingReviewScreen
            onBack={back}
            onNavigateEditContent={() => navigate('create_content')}
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

