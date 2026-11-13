import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import {
  StarSvg,
  CheckboxSvg,
} from './ContactSupportIcons';
import {
  REVIEW_ASPECTS,
} from './contactSupportData';
import type { ReviewItem } from './contactSupportData';

export interface ReviewFeedbackSectionProps {
  reviewItems: ReviewItem[];
  activeReviewProductId: string;
  setActiveReviewProductId: (id: string) => void;
  setReviewItems: React.Dispatch<React.SetStateAction<ReviewItem[]>>;
  overallRating: number;
  setOverallRating: (rating: number) => void;
  description: string;
  setDescription: (desc: string) => void;
  selectedAspects: string[];
  setSelectedAspects: React.Dispatch<React.SetStateAction<string[]>>;
}

export const ReviewFeedbackSection: React.FC<ReviewFeedbackSectionProps> = ({
  reviewItems,
  activeReviewProductId,
  setActiveReviewProductId,
  setReviewItems,
  overallRating,
  setOverallRating,
  description,
  setDescription,
  selectedAspects,
  setSelectedAspects,
}) => {
  return (
    <View style={styles.container}>
      {/* ── REVIEW YOUR ITEMS ────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Review your items</Text>
      <View style={styles.reviewItemsContainer}>
        {reviewItems.map((item) => {
          const isActive = activeReviewProductId === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.reviewItemCard,
                isActive && styles.reviewItemCardActive,
              ]}
              activeOpacity={0.8}
              onPress={() => setActiveReviewProductId(item.id)}
              accessibilityLabel={`Review ${item.name}`}
            >
              <Image source={item.image} style={styles.reviewThumb} resizeMode="contain" />
              <View style={styles.reviewInfoCol}>
                <Text style={styles.reviewItemName}>
                  {item.name} <Text style={styles.reviewItemWeight}>{item.weight}</Text>
                </Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      hitSlop={{ top: 6, bottom: 6, left: 3, right: 3 }}
                      onPress={() => {
                        setActiveReviewProductId(item.id);
                        setReviewItems((prev) =>
                          prev.map((p) =>
                            p.id === item.id
                              ? {
                                  ...p,
                                  rating: star,
                                  statusLabel:
                                    star >= 4 ? 'Excellent' : star >= 3 ? 'Good' : 'Average',
                                }
                              : p,
                          ),
                        );
                      }}
                      accessibilityLabel={`Rate ${item.name} ${star} stars`}
                    >
                      <StarSvg filled={star <= item.rating} size={15} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {item.rating > 0 ? (
                <View style={styles.excellentBadge}>
                  <Text style={styles.excellentBadgeText}>{item.statusLabel || 'Excellent'}</Text>
                </View>
              ) : (
                <Text style={styles.tapToRateText}>Tap to rate</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── OVERALL RATING ───────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Overall rating</Text>
      <View style={styles.overallRatingRow}>
        <View style={styles.overallStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              onPress={() => setOverallRating(star)}
              accessibilityLabel={`Rate overall ${star} stars`}
            >
              <StarSvg filled={star <= overallRating} size={30} />
            </TouchableOpacity>
          ))}
        </View>
        <View
          style={[
            styles.scoreBadge,
            overallRating > 0 ? styles.scoreBadgePositive : styles.scoreBadgeZero,
          ]}
        >
          <Text
            style={[
              styles.scoreText,
              overallRating > 0 ? styles.scoreTextPositive : styles.scoreTextZero,
            ]}
          >
            {overallRating > 0 ? `${overallRating}.0` : '0.0'}
          </Text>
        </View>
      </View>

      {/* ── YOUR REVIEW ──────────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>Your Review</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Describe your issue or question..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
          value={description}
          onChangeText={setDescription}
        />
        <Text style={styles.charCounter}>{`${description.length}/500`}</Text>
      </View>

      {/* ── WHAT DID YOU LIKE? ────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>What did you like?</Text>
      <View style={styles.aspectsGrid}>
        {REVIEW_ASPECTS.map((aspect) => {
          const isChecked = selectedAspects.includes(aspect.id);
          return (
            <TouchableOpacity
              key={aspect.id}
              style={[styles.aspectCard, isChecked && styles.aspectCardChecked]}
              activeOpacity={0.8}
              onPress={() => {
                setSelectedAspects((prev) =>
                  prev.includes(aspect.id)
                    ? prev.filter((id) => id !== aspect.id)
                    : [...prev, aspect.id],
                );
              }}
              accessibilityLabel={aspect.label}
            >
              <CheckboxSvg checked={isChecked} size={18} />
              <Text style={[styles.aspectLabel, isChecked && styles.aspectLabelChecked]}>
                {aspect.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    marginTop: 6,
  },

  /* Review your items */
  reviewItemsContainer: {
    gap: 10,
    marginBottom: 22,
  },
  reviewItemCard: {
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewItemCardActive: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0F8EE',
  },
  reviewThumb: {
    width: 38,
    height: 38,
    marginRight: 12,
  },
  reviewInfoCol: {
    flex: 1,
    gap: 4,
  },
  reviewItemName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111827',
  },
  reviewItemWeight: {
    fontWeight: '400',
    color: '#374151',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  excellentBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  excellentBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#2E7D32',
  },
  tapToRateText: {
    fontSize: 11.5,
    color: '#6B7280',
  },

  /* Overall Rating */
  overallRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
  },
  overallStars: {
    flexDirection: 'row',
    gap: 6,
  },
  scoreBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  scoreBadgeZero: {
    backgroundColor: '#FEE2E2',
  },
  scoreBadgePositive: {
    backgroundColor: '#E8F5E9',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scoreTextZero: {
    color: '#EF4444',
  },
  scoreTextPositive: {
    color: '#2E7D32',
  },

  /* Your Review */
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 22,
  },
  textInput: {
    fontSize: 14,
    color: '#111827',
    minHeight: 46,
    textAlignVertical: 'top',
    padding: 0,
  },
  charCounter: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },

  /* What did you like? */
  aspectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 26,
  },
  aspectCard: {
    width: '48.2%',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aspectCardChecked: {
    borderColor: '#2E7D32',
    backgroundColor: '#F0F8EE',
  },
  aspectLabel: {
    fontSize: 12.5,
    color: '#4B5563',
    fontWeight: '500',
    flexShrink: 1,
  },
  aspectLabelChecked: {
    color: '#2E7D32',
    fontWeight: '700',
  },
});

