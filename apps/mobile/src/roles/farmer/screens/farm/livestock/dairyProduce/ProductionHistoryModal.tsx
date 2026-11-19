import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authPalette as P } from '../../../../theme';
import { t } from '../../../../../../i18n/farmer';
import { renderProductIcon } from './icons';
import { DAIRY_PRODUCTS, dp, type HistoryFilter, type ProduceHistoryLog } from './model';
import { styles } from './styles';

const FILTER_TABS: readonly HistoryFilter[] = ['all', 'milk', 'value_add', 'eggs'];

const TAB_LABEL_SUFFIX: Record<HistoryFilter, string> = {
  all: 'all',
  milk: 'milk',
  value_add: 'valueAdd',
  eggs: 'eggs',
};

interface ProductionHistoryModalProps {
  visible: boolean;
  filter: HistoryFilter;
  onFilterChange: (filter: HistoryFilter) => void;
  logs: ProduceHistoryLog[];
  onClose: () => void;
}

/** Unified production history, filterable by milk / value-added / eggs. */
export function ProductionHistoryModal({
  visible,
  filter,
  onFilterChange,
  logs,
  onClose,
}: ProductionHistoryModalProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, styles.modalCardHistory]}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{t(dp('history.title'))}</Text>
              <Text style={styles.modalSub}>{t(dp('history.subtitle'))}</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <Text style={styles.modalCloseBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <View style={styles.filterTabsRow}>
            {FILTER_TABS.map((tab) => {
              const isSelected = filter === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.filterTabBtn, isSelected && styles.filterTabBtnActive]}
                  onPress={() => onFilterChange(tab)}
                >
                  <Text style={[styles.filterTabBtnText, isSelected && styles.filterTabBtnTextActive]}>
                    {t(dp(`history.tab.${TAB_LABEL_SUFFIX[tab]}`))}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {logs
              .filter((log) => {
                if (filter === 'all') return true;
                if (filter === 'milk') return log.productType === 'milk';
                if (filter === 'eggs') return log.productType === 'eggs';
                return log.productType !== 'milk' && log.productType !== 'eggs';
              })
              .map((log) => {
                const meta = DAIRY_PRODUCTS.find((p) => p.id === log.productType);
                return (
                  <View key={log.id} style={styles.historyItemCard}>
                    <View style={[styles.itemIconBadge, { backgroundColor: meta?.badgeBg || P.twGray100 }]}>
                      {renderProductIcon(log.productType, 18)}
                    </View>
                    <View style={styles.flexFill}>
                      <Text style={styles.historyTitle}>{log.title}</Text>
                      <Text style={styles.historySub}>
                        {log.subtitle} · {log.time} · {log.date}
                      </Text>
                    </View>
                    <Text style={styles.historyValue}>{log.quantityFormatted}</Text>
                  </View>
                );
              })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.modalSaveBtn, styles.modalSaveBtnHistoryClose, styles.modalSaveBtnPrimary]}
            onPress={onClose}
          >
            <Text style={styles.modalSaveBtnText}>{t(dp('history.close'))}</Text>
          </TouchableOpacity>
          <View style={{ height: insets.bottom }} />
        </View>
      </View>
    </Modal>
  );
}
