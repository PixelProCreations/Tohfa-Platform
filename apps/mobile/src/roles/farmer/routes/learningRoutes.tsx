import React from 'react';
import { LearningHubScreen } from '../screens/learning/LearningHubScreen';
import { ContentDetailScreen } from '../screens/learning/ContentDetailScreen';
import { GroupsScreen } from '../screens/learning/GroupsScreen';
import { GroupDetailScreen } from '../screens/learning/GroupDetailScreen';
import type { FarmerRouteRenderer } from './types';

/** The learning hub, its content detail and the farmer groups. */
export const renderLearningRoute: FarmerRouteRenderer = ({ screen, navigate, goBack, selections }) => {
  const { selectedContentDetail, setSelectedContentDetail, selectedGroup, setSelectedGroup } = selections;
  switch (screen) {
    case 'LearningHub':
      return (
        <LearningHubScreen
          onBack={goBack}
          onNavigateToContentDetail={(content) => {
            setSelectedContentDetail(content);
            navigate('ContentDetail');
          }}
          onNavigateToGroups={() => navigate('Groups')}
          onNavigateToGroupDetail={(group) => {
            setSelectedGroup(group);
            navigate('GroupDetail');
          }}
        />
      );
    case 'ContentDetail':
      return <ContentDetailScreen content={selectedContentDetail ?? undefined} onBack={goBack} />;
    case 'Groups':
      return (
        <GroupsScreen
          onBack={goBack}
          onNavigateToGroupDetail={(group) => {
            setSelectedGroup(group);
            navigate('GroupDetail');
          }}
        />
      );
    case 'GroupDetail':
      return <GroupDetailScreen group={selectedGroup ?? undefined} onBack={goBack} />;
    default:
      return undefined;
  }
};
