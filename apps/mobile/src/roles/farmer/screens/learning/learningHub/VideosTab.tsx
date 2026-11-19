import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { colors, authPalette as P } from '../../../theme';
import { ICON } from './constants';
import { FEATURED_VIDEO, type VideoItem } from './data';
import { lh } from './i18n';
import { PlayCircleMiniIcon, PlayTriangleOutlineIcon, VerifiedBadgeIcon } from './icons';
import { styles } from './styles';

interface Props {
  videos: VideoItem[];
  isFeaturedMatch: boolean;
  onOpenVideo: (video: VideoItem) => void;
}

export function VideosTab({ videos, isFeaturedMatch, onOpenVideo }: Props): React.JSX.Element {
  return (
    <View>
      {isFeaturedMatch && (
        <TouchableOpacity
          style={styles.featuredCard}
          activeOpacity={0.92}
          onPress={() => onOpenVideo(FEATURED_VIDEO)}
          accessibilityRole="button"
          accessibilityLabel={lh('video.featuredA11y', { title: FEATURED_VIDEO.title })}
        >
          <View style={[styles.featuredThumbnail, { backgroundColor: FEATURED_VIDEO.bgColor }]}>
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>{lh('video.featured')}</Text>
            </View>
            <View style={styles.featuredPlayCircle}>
              <PlayTriangleOutlineIcon size={ICON.featuredPlay} color={P.greenDeep1} />
            </View>
            <View style={styles.featuredDurationBadge}>
              <Text style={styles.durationBadgeText}>{FEATURED_VIDEO.duration}</Text>
            </View>
          </View>

          <View style={styles.featuredInfo}>
            <Text style={styles.featuredTitle}>{FEATURED_VIDEO.title}</Text>
            <View style={styles.authorRow}>
              <VerifiedBadgeIcon size={ICON.verified} color={colors.brandGreen} />
              <Text style={styles.authorText}>
                {FEATURED_VIDEO.author} · {FEATURED_VIDEO.date}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionHeaderTitle}>{lh('video.latest')}</Text>

      {videos.map((video) => (
        <TouchableOpacity
          key={video.id}
          style={styles.videoCard}
          activeOpacity={0.88}
          onPress={() => onOpenVideo(video)}
          accessibilityRole="button"
          accessibilityLabel={lh('video.playA11y', { title: video.title })}
        >
          <View style={[styles.videoThumbnail, { backgroundColor: video.bgColor }]}>
            <PlayCircleMiniIcon size={ICON.videoPlay} color={P.weatherCloudWhite} />
            <View style={styles.videoDurationBadge}>
              <Text style={styles.videoDurationText}>{video.duration}</Text>
            </View>
          </View>

          <View style={styles.videoDetails}>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {video.title}
            </Text>
            <Text style={styles.videoSubtitle}>
              {video.author} · {video.date}
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      {videos.length === 0 && !isFeaturedMatch && (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateTitle}>{lh('video.emptyTitle')}</Text>
          <Text style={styles.emptyStateSubtitle}>{lh('video.emptyHint')}</Text>
        </View>
      )}
    </View>
  );
}
