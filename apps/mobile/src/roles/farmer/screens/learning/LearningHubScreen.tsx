import React from 'react';
import { SafeAreaView, ScrollView, View } from 'react-native';
import { ScreenStatusBar } from '@tohfa/mobile-ui';
import { authPalette as P } from '../../theme';
import { ContentDetailScreen, type ContentDetailItem } from './ContentDetailScreen';
import { type GroupItem } from './GroupsScreen';
import { GroupDetailScreen } from './GroupDetailScreen';
import { BlogReaderModal } from './learningHub/BlogReaderModal';
import { BlogTab } from './learningHub/BlogTab';
import { GroupsTab } from './learningHub/GroupsTab';
import { LearningHubHeader } from './learningHub/LearningHubHeader';
import { SearchBar } from './learningHub/SearchBar';
import { styles } from './learningHub/styles';
import { TabBar } from './learningHub/TabBar';
import { TrainingsTab } from './learningHub/TrainingsTab';
import { useLearningHub } from './learningHub/useLearningHub';
import { VideosTab } from './learningHub/VideosTab';

interface LearningHubScreenProps {
  onBack: () => void;
  onNavigateToContentDetail?: (content: ContentDetailItem) => void;
  onNavigateToGroups?: () => void;
  onNavigateToGroupDetail?: (group: GroupItem) => void;
}

export function LearningHubScreen({
  onBack,
  onNavigateToContentDetail,
  onNavigateToGroupDetail,
}: LearningHubScreenProps): React.JSX.Element {
  const hub = useLearningHub({ onNavigateToContentDetail, onNavigateToGroupDetail });

  if (hub.activeGroupDetail) {
    return (
      <GroupDetailScreen
        group={hub.activeGroupDetail}
        onBack={() => hub.setActiveGroupDetail(null)}
      />
    );
  }

  if (hub.activeContentDetail) {
    return (
      <ContentDetailScreen
        content={hub.activeContentDetail}
        onBack={() => hub.setActiveContentDetail(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenStatusBar barStyle="dark-content" backgroundColor={P.weatherCloudWhite} />
      <LearningHubHeader onBack={onBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SearchBar
          activeTab={hub.activeTab}
          value={hub.searchQuery}
          onChange={hub.setSearchQuery}
        />
        <TabBar activeTab={hub.activeTab} onChange={hub.setActiveTab} />

        {hub.activeTab === 'Videos' && (
          <VideosTab
            videos={hub.filteredVideos}
            isFeaturedMatch={hub.isFeaturedMatch}
            onOpenVideo={hub.handleOpenVideo}
          />
        )}
        {hub.activeTab === 'Blog' && <BlogTab onOpen={hub.setSelectedBlog} />}
        {hub.activeTab === 'Groups' && (
          <GroupsTab
            groups={hub.groups}
            onOpen={hub.handleOpenGroupDetail}
            onToggleJoin={hub.toggleGroupJoin}
          />
        )}
        {hub.activeTab === 'Trainings' && (
          <TrainingsTab
            trainings={hub.trainings}
            onToggleRegistration={hub.toggleTrainingRegistration}
          />
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BlogReaderModal article={hub.selectedBlog} onClose={() => hub.setSelectedBlog(null)} />
    </SafeAreaView>
  );
}
