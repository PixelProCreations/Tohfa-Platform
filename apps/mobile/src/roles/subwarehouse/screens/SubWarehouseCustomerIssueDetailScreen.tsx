import React from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Design Tokens (TOHFA Admin App — Design System PDF) ─────────────────────
const PALETTE = {
  primary:       '#F0562A', // Orange: primary actions
  orangeDeep:    '#7A2E14', // Orange Deep: section headings
  orangeTint:    '#FDF3F0', // Orange Tint: evidence & chips
  pageBg:        '#FAF7F2', // App canvas
  cardBg:        '#FFFFFF', // Card surfaces
  textInk:       '#1E1612', // Ink: primary text
  textSecondary: '#5F5E5A', // Muted: secondary text
  border:        '#EEDCD3', // Border: card and input borders
  success:       '#173404',
  successBg:     '#EAF3DE',
  lineGreen:     '#10B981',
  lineGray:      '#E5E7EB',
};

function ArrowBackIcon({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
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

function ImageIcon({ size = 26, color = '#7A2E14' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M21 15l-5-5L5 21"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckCircleDotIcon({ size = 20, color = '#10B981' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"
        stroke={color}
        strokeWidth="2"
      />
      <Path
        d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
        fill={color}
      />
    </Svg>
  );
}

function UncheckedCircleDotIcon({ size = 20, color = '#D1D5DB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  );
}

function RmaBoxIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M12 18v-6M9 15h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface SubWarehouseCustomerIssueDetailScreenProps {
  customerName?: string | undefined;
  issue?: {
    id?: string | undefined;
    issueNo?: string | undefined;
    orderNo?: string | undefined;
    category?: string | undefined;
    product?: string | undefined;
    quantity?: string | undefined;
    dateText?: string | undefined;
    description?: string | undefined;
    status?: string | undefined;
  } | undefined;
  onBack: () => void;
  onViewRma?: (() => void) | undefined;
}

export function SubWarehouseCustomerIssueDetailScreen({
  customerName = 'Rajesh Kumar',
  issue,
  onBack,
  onViewRma,
}: SubWarehouseCustomerIssueDetailScreenProps) {
  const issueNo = issue?.issueNo || 'ISSUE-00231';
  const orderNo = issue?.orderNo || 'ORD-00251';
  const category = issue?.category || 'Quality';
  const product = issue?.product || 'Tomato Grade 1';
  const quantity = issue?.quantity || '2 KG';
  const dateText = issue?.dateText || '24 Sep 2026';
  const description = issue?.description || 'Customer reported quality issue.';

  const timelineSteps = [
    { title: 'Issue Reported', completed: true },
    { title: 'Issue Received', completed: true },
    { title: 'Inspection', completed: true },
    { title: 'Review', completed: true },
    { title: 'Resolution', completed: false },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Orange Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Issue Detail</Text>
            <Text style={styles.headerSubtitle}>{customerName}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Main Issue Information Card ─── */}
        <View style={styles.infoCard}>
          <View style={styles.gridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.metaLabel}>Issue ID</Text>
              <Text style={styles.metaValueBold}>{issueNo}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.metaLabel}>Order</Text>
              <Text style={styles.metaValueBold}>{orderNo}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.metaLabel}>Customer</Text>
              <Text style={styles.metaValueBold}>{customerName}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.metaLabel}>Category</Text>
              <Text style={styles.metaValueBold}>{category}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.metaLabel}>Product</Text>
              <Text style={styles.metaValueBold}>{product}</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.metaLabel}>Quantity</Text>
              <Text style={styles.metaValueBold}>{quantity}</Text>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 14 }]}>
            <View style={styles.gridCol}>
              <Text style={styles.metaLabel}>Created</Text>
              <Text style={styles.metaValueBold}>{dateText}</Text>
            </View>
            <View style={styles.gridCol} />
          </View>
        </View>

        {/* ─── 2. Description Section ─── */}
        <Text style={styles.sectionHeading}>Description</Text>
        <View style={styles.descCard}>
          <Text style={styles.descText}>{description}</Text>
        </View>

        {/* ─── 3. Evidence Section ─── */}
        <Text style={styles.sectionHeading}>Evidence</Text>
        <View style={styles.evidenceBox}>
          <ImageIcon size={26} color={PALETTE.orangeDeep} />
        </View>

        {/* ─── 4. Timeline Section ─── */}
        <Text style={styles.sectionHeading}>Timeline</Text>
        <View style={styles.timelineCard}>
          {timelineSteps.map((step, index) => {
            const isLast = index === timelineSteps.length - 1;
            const nextCompleted = index < timelineSteps.length - 1 && !!timelineSteps[index + 1]?.completed;
            const lineColor = step.completed && nextCompleted ? PALETTE.lineGreen : PALETTE.lineGray;

            return (
              <View key={step.title} style={styles.timelineRow}>
                {/* Stepper Dot & Vertical Line */}
                <View style={styles.dotLineCol}>
                  {step.completed ? (
                    <CheckCircleDotIcon size={20} color={PALETTE.lineGreen} />
                  ) : (
                    <UncheckedCircleDotIcon size={20} color={PALETTE.lineGray} />
                  )}
                  {!isLast && (
                    <View style={[styles.timelineLine, { backgroundColor: lineColor }]} />
                  )}
                </View>

                {/* Step Title */}
                <View style={styles.stepTextWrap}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 20 }} />

        {/* ─── 5. Bottom Action Button ─── */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            if (onViewRma) {
              onViewRma();
            } else {
              Alert.alert('Issue / RMA', `Viewing return merchandise authorization for ${issueNo}`);
            }
          }}
          activeOpacity={0.8}
        >
          <RmaBoxIcon size={18} color="#FFFFFF" />
          <Text style={styles.actionBtnText}>View Issue / RMA</Text>
        </TouchableOpacity>

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  header: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    paddingRight: 12,
    paddingVertical: 4,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },

  /* Main Card */
  infoCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 6,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    marginBottom: 3,
  },
  metaValueBold: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
  },

  /* Headings */
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.orangeDeep,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.1,
  },

  /* Description */
  descCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
  },
  descText: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    lineHeight: 18,
  },

  /* Evidence */
  evidenceBox: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: PALETTE.orangeTint,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Timeline */
  timelineCard: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dotLineCol: {
    alignItems: 'center',
    width: 24,
  },
  timelineLine: {
    width: 2,
    height: 28,
    marginVertical: 2,
  },
  stepTextWrap: {
    marginLeft: 10,
    justifyContent: 'center',
    height: 20,
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },

  /* Bottom Button */
  actionBtn: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
