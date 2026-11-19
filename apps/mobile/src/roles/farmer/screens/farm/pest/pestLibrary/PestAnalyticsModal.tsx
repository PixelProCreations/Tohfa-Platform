import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Skeleton, ModalSafeArea } from '@tohfa/mobile-ui';
import { authPalette as P } from '../../../../theme';
import type { PestAnalyticsSummary } from '../../../../api/pest';
import { CloseIcon } from '../pestManagement/icons';
import { SKELETON_ANALYTICS_HEIGHT, SKELETON_FULL_WIDTH } from './constants';
import { pl } from './i18n';
import { styles } from './styles';

const CLOSE_ICON_SIZE = 20;

interface Props {
  visible: boolean;
  summary: PestAnalyticsSummary | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

export function PestAnalyticsModal({ visible, summary, loading, error, onClose }: Props): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <ModalSafeArea style={styles.detailModalSafeArea}>
        <View style={styles.detailModalHeader}>
          <TouchableOpacity style={styles.detailModalCloseBtn} onPress={onClose}>
            <CloseIcon size={CLOSE_ICON_SIZE} color={P.twGray700} />
          </TouchableOpacity>
          <View style={styles.detailModalHeaderTitleCol}>
            <Text style={styles.detailModalMainTitle}>{pl('farmer.pestLibrary.analytics.title')}</Text>
            <Text style={styles.detailModalSubTitle}>{pl('farmer.pestLibrary.analytics.modalSubtitle')}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.detailModalScroll}
          contentContainerStyle={styles.detailModalContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <>
              <Skeleton height={SKELETON_ANALYTICS_HEIGHT} width={SKELETON_FULL_WIDTH} />
              <Skeleton height={SKELETON_ANALYTICS_HEIGHT} width={SKELETON_FULL_WIDTH} />
            </>
          ) : error ? (
            <Text style={styles.analyticsErrorText}>{error}</Text>
          ) : summary ? (
            <>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionHeading}>{pl('farmer.pestLibrary.analytics.seasonal')}</Text>
                {summary.detectionsBySeason.length > 0 ? (
                  summary.detectionsBySeason.map((row) => (
                    <View key={row.season} style={styles.analyticsBarRow}>
                      <Text style={styles.analyticsBarLabel}>{row.season}</Text>
                      <Text style={styles.analyticsBarValue}>{row.count}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyCardText}>{pl('farmer.pestLibrary.analytics.noDetections')}</Text>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionHeading}>{pl('farmer.pestLibrary.analytics.impactedCrops')}</Text>
                {summary.mostAffectedCrops.length > 0 ? (
                  summary.mostAffectedCrops.map((row) => (
                    <View key={row.crop} style={styles.impactCard}>
                      <Text style={styles.impactCardTitle}>{row.crop}</Text>
                      <Text style={styles.impactCardDesc}>
                        {pl('farmer.pestLibrary.analytics.detectionsLogged', { count: row.count })}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyCardText}>{pl('farmer.pestLibrary.analytics.noDetections')}</Text>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionHeading}>{pl('farmer.pestLibrary.analytics.efficacy')}</Text>
                {summary.treatmentEffectiveness.length > 0 ? (
                  summary.treatmentEffectiveness.map((row) => (
                    <View key={row.treatment} style={styles.efficacyRow}>
                      <Text style={styles.efficacyName}>{row.treatment}</Text>
                      <Text style={styles.efficacyPercent}>
                        {pl('farmer.pestLibrary.analytics.effective', {
                          effective: row.timesEffective,
                          used: row.timesUsed,
                        })}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyCardText}>{pl('farmer.pestLibrary.analytics.noResolved')}</Text>
                )}
              </View>
            </>
          ) : null}
        </ScrollView>

        <View style={styles.detailModalFooter}>
          <TouchableOpacity style={[styles.detailCloseBtn, styles.analyticsDoneBtn]} onPress={onClose}>
            <Text style={styles.detailCloseBtnText}>{pl('farmer.common.done')}</Text>
          </TouchableOpacity>
        </View>
      </ModalSafeArea>
    </Modal>
  );
}
