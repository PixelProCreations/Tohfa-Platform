import { useState } from 'react';
import { DEFAULT_CONTENT_DETAIL, type ContentDetailItem } from '../ContentDetailScreen';
import { INITIAL_FARMER_GROUPS, type GroupItem } from '../GroupsScreen';
import {
  FEATURED_VIDEO,
  INITIAL_TRAININGS,
  LATEST_VIDEOS,
  type BlogArticle,
  type TabType,
  type TrainingWorkshop,
  type VideoItem,
} from './data';
import { lh } from './i18n';

interface Options {
  onNavigateToContentDetail?: ((content: ContentDetailItem) => void) | undefined;
  onNavigateToGroupDetail?: ((group: GroupItem) => void) | undefined;
}

/** All state and handlers for the Learning Hub screen. */
export function useLearningHub({ onNavigateToContentDetail, onNavigateToGroupDetail }: Options) {
  const [activeTab, setActiveTab] = useState<TabType>('Videos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeContentDetail, setActiveContentDetail] = useState<ContentDetailItem | null>(null);
  const [activeGroupDetail, setActiveGroupDetail] = useState<GroupItem | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<BlogArticle | null>(null);
  const [groups, setGroups] = useState<GroupItem[]>(INITIAL_FARMER_GROUPS);
  const [trainings, setTrainings] = useState<TrainingWorkshop[]>(INITIAL_TRAININGS);

  const handleOpenGroupDetail = (group: GroupItem) => {
    if (onNavigateToGroupDetail) {
      onNavigateToGroupDetail(group);
    } else {
      setActiveGroupDetail(group);
    }
  };

  const handleOpenVideo = (video: VideoItem) => {
    const detailItem: ContentDetailItem = {
      id: video.id,
      title: video.title,
      author: video.author,
      date: video.date,
      duration: video.duration,
      type: 'Video',
      bgColor: video.bgColor,
      paragraphs:
        video.id === 'v-feat'
          ? DEFAULT_CONTENT_DETAIL.paragraphs
          : [
              video.description ??
                lh('video.fallbackDescription', { title: video.title.toLowerCase() }),
              lh('video.fallbackNote'),
            ],
      likesCount: video.id === 'v-feat' ? 42 : 31,
      commentsCount: video.id === 'v-feat' ? 3 : 2,
    };

    if (onNavigateToContentDetail) {
      onNavigateToContentDetail(detailItem);
    } else {
      setActiveContentDetail(detailItem);
    }
  };

  const toggleGroupJoin = (groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          const nextJoined = !g.isJoined;
          return {
            ...g,
            isJoined: nextJoined,
            membersCount: nextJoined ? g.membersCount + 1 : g.membersCount - 1,
          };
        }
        return g;
      }),
    );
  };

  const toggleTrainingRegistration = (trainingId: string) => {
    setTrainings((prev) =>
      prev.map((t) => (t.id === trainingId ? { ...t, isRegistered: !t.isRegistered } : t)),
    );
  };

  const query = searchQuery.toLowerCase();
  const filteredVideos = LATEST_VIDEOS.filter(
    (v) => v.title.toLowerCase().includes(query) || v.author.toLowerCase().includes(query),
  );
  const isFeaturedMatch =
    FEATURED_VIDEO.title.toLowerCase().includes(query) ||
    FEATURED_VIDEO.author.toLowerCase().includes(query);

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    activeContentDetail,
    setActiveContentDetail,
    activeGroupDetail,
    setActiveGroupDetail,
    selectedBlog,
    setSelectedBlog,
    groups,
    trainings,
    filteredVideos,
    isFeaturedMatch,
    handleOpenGroupDetail,
    handleOpenVideo,
    toggleGroupJoin,
    toggleTrainingRegistration,
  };
}
