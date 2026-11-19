import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { appAlert, ModalSafeArea } from '@tohfa/mobile-ui';
import { authPalette as P } from '../../../../theme';
import type { PestLibraryEntry } from '../../../../api/pest';
import { CalendarIcon, CloseIcon } from '../pestManagement/icons';
import { pl } from './i18n';
import { styles } from './styles';

const CLOSE_ICON_SIZE = 20;
const CALENDAR_BTN_ICON_SIZE = 16;

interface Props {
  pest: PestLibraryEntry | null;
  onClose: () => void;
  onNavigateToSchedule?: ((pestName?: string) => void) | undefined;
}

export function PestDetailModal({ pest, onClose, onNavigateToSchedule }: Props): React.JSX.Element {
  return (
    <Modal
      visible={pest !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      {pest && (
        <ModalSafeArea style={styles.detailModalSafeArea}>
          <View style={styles.detailModalHeader}>
            <TouchableOpacity style={styles.detailModalCloseBtn} onPress={onClose}>
              <CloseIcon size={CLOSE_ICON_SIZE} color={P.twGray700} />
            </TouchableOpacity>
            <View style={styles.detailModalHeaderTitleCol}>
              <Text style={styles.detailModalMainTitle}>{pest.name}</Text>
              {pest.scientificName ? (
                <Text style={styles.detailModalSubTitle}>{pest.scientificName}</Text>
              ) : null}
            </View>
            <View
              style={[
                styles.categoryPill,
                pest.category === 'Disease' ? styles.categoryPillDisease : styles.categoryPillPest,
              ]}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  pest.category === 'Disease'
                    ? styles.categoryPillTextDisease
                    : styles.categoryPillTextPest,
                ]}
              >
                {pest.category}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.detailModalScroll}
            contentContainerStyle={styles.detailModalContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Quick Summary Badges */}
            <View style={styles.detailSummaryRow}>
              <View style={styles.summaryBadgeItem}>
                <Text style={styles.summaryBadgeLabel}>{pl('farmer.pestLibrary.detail.riskLevel')}</Text>
                <Text
                  style={[
                    styles.summaryBadgeVal,
                    pest.riskLevel === 'High' && styles.riskValHigh,
                    pest.riskLevel === 'Medium' && styles.riskValMed,
                    pest.riskLevel === 'Low' && styles.riskValLow,
                  ]}
                >
                  {pest.riskLevel}
                </Text>
              </View>
              <View style={styles.summaryBadgeItem}>
                <Text style={styles.summaryBadgeLabel}>{pl('farmer.pestLibrary.detail.activeSeason')}</Text>
                <Text style={styles.summaryBadgeVal}>{pest.season ?? '—'}</Text>
              </View>
              <View style={styles.summaryBadgeItem}>
                <Text style={styles.summaryBadgeLabel}>{pl('farmer.pestLibrary.detail.hostCrops')}</Text>
                <Text style={styles.summaryBadgeVal}>{pest.crops.join(', ')}</Text>
              </View>
            </View>

            {pest.symptoms.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionHeading}>{pl('farmer.pestLibrary.detail.symptoms')}</Text>
                {pest.symptoms.map((sym, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{sym}</Text>
                  </View>
                ))}
              </View>
            )}

            {pest.organicTreatments.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionHeading}>{pl('farmer.pestLibrary.detail.treatments')}</Text>
                {pest.organicTreatments.map((treatment, idx) => (
                  <View key={idx} style={styles.treatmentItemCard}>
                    <Text style={styles.treatmentItemNumber}>0{idx + 1}</Text>
                    <Text style={styles.treatmentItemText}>{treatment}</Text>
                  </View>
                ))}
              </View>
            )}

            {pest.prevention.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionHeading}>{pl('farmer.pestLibrary.detail.prevention')}</Text>
                {pest.prevention.map((pr, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <View style={[styles.bulletDot, styles.bulletDotPrevention]} />
                    <Text style={styles.bulletText}>{pr}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.detailModalFooter}>
            <TouchableOpacity style={styles.detailCloseBtn} onPress={onClose}>
              <Text style={styles.detailCloseBtnText}>{pl('farmer.common.close')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailScheduleBtn}
              activeOpacity={0.85}
              onPress={() => {
                const pestName = pest.name;
                onClose();
                if (onNavigateToSchedule) {
                  onNavigateToSchedule(pestName);
                } else {
                  appAlert(
                    pl('farmer.pestLibrary.alert.scheduleTitle'),
                    pl('farmer.pestLibrary.alert.scheduleMessage', { pestName }),
                    undefined,
                    { tone: 'info' },
                  );
                }
              }}
            >
              <CalendarIcon size={CALENDAR_BTN_ICON_SIZE} color={P.white} />
              <Text style={styles.detailScheduleBtnText}>{pl('farmer.pestLibrary.detail.logTreatment')}</Text>
            </TouchableOpacity>
          </View>
        </ModalSafeArea>
      )}
    </Modal>
  );
}
