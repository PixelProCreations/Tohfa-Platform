import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenStatusBar, SafeAreaView } from '@tohfa/mobile-ui';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { adminColors, adminShadow, adminSpacing, adminType } from '../../theme';
import { adminErrorKey } from '../../api/errors';
import { useAdminQuery } from '../../api/hooks';
import {
  getInvoiceDownloadUrl,
  getInvoiceSummary,
  listInvoices,
  type InvoiceDto,
  type InvoiceStatus,
} from '../../api/invoices';
import { t, type TranslationKey } from '../../i18n';
import type { Can } from '../../permissions/can';
import { formatAdminDay } from '../../utils/datetime';
import { ADMIN_NO_VALUE } from '../../utils/noValue';
import { countText, moneyText } from '../dashboard/saOverviewFormat';
import { LiveInvoiceDetail } from '../warehouse/billing-invoices';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../warehouse/shared/AsyncStates';
import { TransactionHistoryScreen } from './TransactionHistoryScreen';

const INVOICE_PAGE = 50;

function BackArrowWhiteIcon({ size = 22, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = adminColors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="21" x2="4" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="4" y1="10" x2="4" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="8" x2="12" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="21" x2="20" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="20" y1="12" x2="20" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="1" y1="14" x2="7" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="16" x2="23" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

type InvoiceStatusLabel = 'Issued' | 'Draft' | 'Cancelled' | 'Credit noted';

const STATUS_LABEL: Record<InvoiceStatus, InvoiceStatusLabel> = {
  ISSUED: 'Issued',
  DRAFT: 'Draft',
  CANCELLED: 'Cancelled',
  CREDIT_NOTED: 'Credit noted',
};

type InvoiceAction = 'Download' | 'Details' | 'History';

/** The designed actions per status: an issued invoice has a PDF; a cancelled one shows its history. */
function actionsFor(status: InvoiceStatus): InvoiceAction[] {
  switch (status) {
    case 'ISSUED':
      return ['Download', 'Details'];
    case 'CANCELLED':
      return ['History'];
    default:
      return ['Details'];
  }
}

export interface InvoicesGstBillingScreenProps {
  onBack: () => void;
  /** The signed-in admin's permission check, handed to the live invoice and history screens. */
  can?: Can | undefined;
}

/**
 * Invoices & GST billing on GET /invoices (the caller's scope, newest first)
 * and GET /invoices/summary for the counter (R4: never one page's length).
 * The list row carries no buyer and no order number, so those slots are
 * dashed (R9: the order UUID is never shown in their place). Details opens
 * the live invoice detail by its real id; Download opens the signed PDF URL.
 */
export function InvoicesGstBillingScreen({ onBack, can = () => false }: InvoicesGstBillingScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const listQuery = useAdminQuery(['admin', 'invoices', 'list', INVOICE_PAGE], (signal) =>
    listInvoices({ limit: INVOICE_PAGE }, signal),
  );
  const summaryQuery = useAdminQuery(['admin', 'invoices', 'summary'], (signal) => getInvoiceSummary({}, signal));

  const rows = (listQuery.data?.items ?? []).map((dto: InvoiceDto) => ({
    dto,
    title: t('wiringFinance.invoices.title', { number: dto.invoiceNumber, order: ADMIN_NO_VALUE }),
    status: STATUS_LABEL[dto.status],
    subtitle: t('wiringFinance.invoices.subtitle', {
      buyer: ADMIN_NO_VALUE,
      type: t(`wiringFinance.invoices.type.${dto.invoiceType}` as TranslationKey),
      amount: moneyText(dto.totalAmount),
      date: formatAdminDay(dto.issueDate) || ADMIN_NO_VALUE,
    }),
    actions: actionsFor(dto.status),
  }));
  const query = searchQuery.toLowerCase().trim();
  const filteredItems = query
    ? rows.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.subtitle.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query),
      )
    : rows;

  async function handleDownload(invoiceId: string) {
    try {
      await Linking.openURL(await getInvoiceDownloadUrl(invoiceId));
    } catch (error) {
      Alert.alert(t('wiringFinance.invoices.downloadErrorTitle'), t(adminErrorKey(error)));
    }
  }

  if (showHistory) {
    return <TransactionHistoryScreen can={can} onBack={() => setShowHistory(false)} />;
  }

  // Details: the live invoice, read by its real id (GET /invoices/{id}).
  if (openInvoiceId !== null) {
    return (
      <LiveInvoiceDetail
        scope={{ warehouseId: undefined, warehouseName: undefined }}
        can={can}
        invoiceId={openInvoiceId}
        onBack={() => setOpenInvoiceId(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScreenStatusBar barStyle="light-content" backgroundColor={adminColors.brand} />

      {/* ── Top Header Banner ── */}
      <View style={styles.headerBanner}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to Accounts & Finance"
        >
          <BackArrowWhiteIcon size={22} color={adminColors.onBrand} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoices & GST Billing</Text>
      </View>


      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Search & Filter Bar ── */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color={adminColors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search invoice number, buyer..."
            placeholderTextColor={adminColors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.filterIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Filter"
          >
            <FilterSlidersIcon size={18} color={adminColors.brand} />
          </TouchableOpacity>
        </View>


        {/* ── Counter Line: the server's count over every invoice (R4); the list carries no warehouse. ── */}
        <Text style={styles.counterText} testID="finance.invoices.counter">
          {t('wiringFinance.invoices.counter', { count: countText(summaryQuery.data?.count), warehouses: ADMIN_NO_VALUE })}
        </Text>

        {/* ── Invoices List ── */}
        {listQuery.isPending ? (
          <AdminLoadingState />
        ) : listQuery.error ? (
          <AdminErrorState error={listQuery.error} onRetry={() => void listQuery.refetch()} />
        ) : filteredItems.length === 0 ? (
          <AdminEmptyState title={t(query ? 'wiringFinance.invoices.noMatch' : 'wiringFinance.invoices.empty')} />
        ) : (
          filteredItems.map((item) => {
            const isIssued = item.dto.status === 'ISSUED';
            const isCancelled = item.dto.status === 'CANCELLED';
            return (
              <TouchableOpacity
                key={item.dto.id}
                style={styles.invoiceCard}
                onPress={() => {
                  if (item.actions.includes('History')) setShowHistory(true);
                  else setOpenInvoiceId(item.dto.id);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.invoiceHeaderRow}>
                  <Text style={styles.invoiceTitle}>{item.title}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isIssued ? styles.badgeGreen : isCancelled ? styles.badgeRed : styles.badgeGray,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        isIssued ? styles.badgeTextGreen : isCancelled ? styles.badgeTextRed : styles.badgeTextGray,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.invoiceSubtitle}>{item.subtitle}</Text>

                {/* Action Buttons Row */}
                <View style={styles.actionsRow}>
                  {item.actions.map((act) => (
                    <TouchableOpacity
                      key={act}
                      testID={`finance.invoices.${act.toLowerCase()}.${item.dto.id}`}
                      onPress={() => {
                        if (act === 'History') setShowHistory(true);
                        else if (act === 'Download') void handleDownload(item.dto.id);
                        else setOpenInvoiceId(item.dto.id);
                      }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    >
                      <Text style={styles.actionBtnText}>{act}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: adminSpacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  headerBanner: {
    backgroundColor: adminColors.brand,
    paddingTop: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    paddingBottom: adminSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...adminType.title,
    color: adminColors.onBrand,
    letterSpacing: -0.3,
  },
  scroll: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  scrollContent: {
    paddingBottom: adminSpacing.xxxl,
  },
  searchBarContainer: {
    backgroundColor: adminColors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: adminSpacing.md,
    marginTop: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    ...adminType.body,
    color: adminColors.ink,
    paddingVertical: 0,
  },
  filterIconButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.muted,
    marginHorizontal: adminSpacing.md,
    marginTop: 12,
    marginBottom: 10,
  },
  invoiceCard: {
    backgroundColor: adminColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: adminSpacing.md,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  invoiceCardAlert: {
    borderColor: adminColors.danger.border,
    borderWidth: 1.5,
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  invoiceTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: adminColors.success.bg,
  },
  badgeRed: {
    backgroundColor: adminColors.danger.bg,
  },
  badgeGray: {
    backgroundColor: adminColors.canvas,
  },
  badgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  badgeTextGreen: {
    color: adminColors.success.text,
  },
  badgeTextRed: {
    color: adminColors.danger.text,
  },
  badgeTextGray: {
    color: adminColors.muted,
  },
  invoiceSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    marginTop: 2,
    lineHeight: 18,
  },
  invoiceSubtitle2: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 4,
  },
  actionBtnText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
});
