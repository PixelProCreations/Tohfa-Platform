import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// ─── Design Tokens (#F0562A Brand Palette) ──────────────────────────────────
const PALETTE = {
  primary:       '#F0562A',
  primaryDark:   '#D4451B',
  primaryLight:  '#FFF0EB',
  primarySoft:   '#FEF1EC',
  primaryBorder: '#FCD9CE',

  pageBg:        '#FAF7F2',
  cardBg:        '#FFFFFF',
  textInk:       '#1E1612',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',
  border:        '#EBE5DC',
  divider:       '#F3EFEA',

  greenBadge:    '#DCFCE7',
  greenText:     '#15803D',
  greenBorder:   '#86EFAC',
  amberBadge:    '#FEF3C7',
  amberText:     '#B45309',
  amberBorder:   '#FDE68A',
  blueBadge:     '#DBEAFE',
  blueText:      '#1D4ED8',
  blueBorder:    '#93C5FD',
  redBadge:      '#FEE2E2',
  redText:       '#DC2626',

  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

type SubWHTab = 'Home' | 'Receiving' | 'Inventory' | 'More';

export interface SupportTicketItem {
  id: string;
  ticketNo: string;
  subject: string;
  category: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  priority: 'Urgent' | 'High' | 'Normal';
  createdAt: string;
  lastUpdated: string;
  description: string;
  referenceId?: string | undefined;
  resolution?: string | undefined;
}

const INITIAL_TICKETS: SupportTicketItem[] = [
  {
    id: '1',
    ticketNo: 'TKT-WH-0428',
    subject: 'Barcode scanner connectivity timeout during intake',
    category: 'Hardware / Scanner',
    status: 'In Progress',
    priority: 'High',
    createdAt: 'Today, 10:15 AM',
    lastUpdated: '10 min ago',
    description: 'Bluetooth handheld scanner is disconnecting intermittently when reading crate QR tags.',
    referenceId: 'GR-00124',
    resolution: 'IT Support dispatched replacement firmware config. Please restart device.',
  },
  {
    id: '2',
    ticketNo: 'TKT-WH-0395',
    subject: 'Weight scale calibration verification for 500 KG dock',
    category: 'Hardware & Scale',
    status: 'Resolved',
    priority: 'Normal',
    createdAt: '23 Sep 2026',
    lastUpdated: '23 Sep 2026',
    description: 'Annual calibration certificate inspection required for primary produce weighing scale.',
    resolution: 'Calibration verified and certified by Metrology Inspector.',
  },
  {
    id: '3',
    ticketNo: 'TKT-WH-0312',
    subject: 'Crate count mismatch in Online staging bay',
    category: 'Inventory Discrepancy',
    status: 'Resolved',
    priority: 'Normal',
    createdAt: '18 Sep 2026',
    lastUpdated: '19 Sep 2026',
    description: 'Discrepancy of 4 crates in Staging Bay 2 reconciled after second audit count.',
    referenceId: 'BATCH-CRT-88',
    resolution: 'System count adjusted post-supervisor signoff.',
  },
];

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'f1',
    question: 'How do I handle quality reject crates during receiving?',
    answer: 'Mark the crate as "Rejected" during the QC step in the Receiving tab, select the reason (Rot/Size/Damage), take a photo, and click Submit. An RMA voucher is generated automatically.',
  },
  {
    id: 'f2',
    question: 'What should I do if a customer wallet top-up cash fails to sync?',
    answer: 'Navigate to "Wallet Operations" > "Needs Attention". Locate the pending transaction and tap "Retry Sync". If network is unavailable, the voucher will sync automatically once online.',
  },
  {
    id: 'f3',
    question: 'How do I perform end-of-day daily cash reconciliation?',
    answer: 'Go to "More" > "Warehouse Finance" > "Daily Cash Reconciliation". Enter the physical currency denomination counts and tap "Reconcile & Close Register".',
  },
  {
    id: 'f4',
    question: 'How to request emergency inventory adjustment?',
    answer: 'Open "More" > "Warehouse Operations" > "Adjustments". Enter reason code and quantity. Adjustments above ₹5,000 require Central HQ approval.',
  },
];

// ─── SVG Icons ───────────────────────────────────────────────────────────────

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

function PhoneIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WhatsAppIcon({ size = 18, color = '#25D366' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function MailIcon({ size = 18, color = '#2563EB' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 6l-10 7L2 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronUpIcon({ size = 16, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TicketIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12h6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export interface SubWarehouseHelpSupportScreenProps {
  warehouseName?: string | undefined;
  onBack?: (() => void) | undefined;
  onTabChange?: ((tab: SubWHTab) => void) | undefined;
}

export function SubWarehouseHelpSupportScreen({
  warehouseName = 'Coonoor Warehouse',
  onBack,
}: SubWarehouseHelpSupportScreenProps) {
  const [activeTab, setActiveTab] = useState<'faq' | 'tickets'>('faq');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('f1');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tickets, setTickets] = useState<SupportTicketItem[]>(INITIAL_TICKETS);

  // Form State
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('Receiving / QC');
  const [newPriority, setNewPriority] = useState<'Urgent' | 'High' | 'Normal'>('Normal');
  const [newReference, setNewReference] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleCall = () => {
    Linking.openURL('tel:18008643248').catch(() => {
      Alert.alert('Phone Helpline', 'Dialing Toll-Free Warehouse Support: 1800-864-3248');
    });
  };

  const handleWhatsApp = () => {
    Linking.openURL('whatsapp://send?phone=+919876543210&text=Hi%20Tohfa%20Support').catch(() => {
      Alert.alert('WhatsApp Support', 'Opening WhatsApp Support chat with +91 98765 43210');
    });
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@tohfa.com?subject=Warehouse%20Support').catch(() => {
      Alert.alert('Email Support', 'Sending email to support@tohfa.com');
    });
  };

  const handleCreateTicket = () => {
    if (!newSubject.trim() || !newDescription.trim()) {
      Alert.alert('Missing Info', 'Please enter a ticket title and description.');
      return;
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newTicket: SupportTicketItem = {
      id: Date.now().toString(),
      ticketNo: `TKT-WH-${randomNum}`,
      subject: newSubject.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'Open',
      createdAt: 'Just now',
      lastUpdated: 'Just now',
      description: newDescription.trim(),
      referenceId: newReference.trim() || undefined,
    };

    setTickets([newTicket, ...tickets]);
    setShowCreateModal(false);
    setNewSubject('');
    setNewDescription('');
    setNewReference('');
    setActiveTab('tickets');

    Alert.alert('Ticket Submitted', `Your ticket #${newTicket.ticketNo} has been registered.`);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* ─── Compact Neat Header Banner ─── */}
      <View style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.75}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowBackIcon size={22} />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Help & Support</Text>
            <Text style={styles.headerSub}>{warehouseName}</Text>
          </View>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <PlusIcon size={14} color="#FFFFFF" />
            <Text style={styles.headerActionBtnText}>New Ticket</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── Quick Contact Channels ─── */}
        <Text style={styles.sectionHeading}>CONTACT SUPPORT</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactCard} onPress={handleCall} activeOpacity={0.8}>
            <View style={[styles.contactIconCircle, { backgroundColor: '#FEF2F2' }]}>
              <PhoneIcon size={18} color="#DC2626" />
            </View>
            <Text style={styles.contactCardTitle}>Call Helpline</Text>
            <Text style={styles.contactCardSub}>1800-864-3248</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleWhatsApp} activeOpacity={0.8}>
            <View style={[styles.contactIconCircle, { backgroundColor: '#F0FDF4' }]}>
              <WhatsAppIcon size={18} color="#16A34A" />
            </View>
            <Text style={styles.contactCardTitle}>WhatsApp</Text>
            <Text style={styles.contactCardSub}>Instant Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmail} activeOpacity={0.8}>
            <View style={[styles.contactIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <MailIcon size={18} color="#2563EB" />
            </View>
            <Text style={styles.contactCardTitle}>Email</Text>
            <Text style={styles.contactCardSub}>support@tohfa.com</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Segment Tab Switcher ─── */}
        <View style={styles.segmentWrapper}>
          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'faq' && styles.segmentTabActive]}
            onPress={() => setActiveTab('faq')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentTabText, activeTab === 'faq' && styles.segmentTabTextActive]}>
              FAQs & Guides
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'tickets' && styles.segmentTabActive]}
            onPress={() => setActiveTab('tickets')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentTabText, activeTab === 'tickets' && styles.segmentTabTextActive]}>
              My Tickets ({tickets.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── TAB 1: FAQS ─── */}
        {activeTab === 'faq' && (
          <View style={styles.sectionBlock}>
            {FAQS.map(faq => {
              const isOpen = expandedFaqId === faq.id;
              return (
                <TouchableOpacity
                  key={faq.id}
                  style={styles.faqCard}
                  onPress={() => setExpandedFaqId(isOpen ? null : faq.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    {isOpen ? <ChevronUpIcon size={16} color={PALETTE.primary} /> : <ChevronDownIcon size={16} color={PALETTE.textMuted} />}
                  </View>
                  {isOpen && (
                    <View style={styles.faqBody}>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.createTicketBanner} onPress={() => setShowCreateModal(true)} activeOpacity={0.85}>
              <View style={styles.createTicketIcon}>
                <TicketIcon size={20} color={PALETTE.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.createTicketTitle}>Need more assistance?</Text>
                <Text style={styles.createTicketSub}>Raise a support ticket for immediate assistance.</Text>
              </View>
              <View style={styles.createTicketBtnSmall}>
                <Text style={styles.createTicketBtnSmallText}>Raise Ticket</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── TAB 2: MY TICKETS ─── */}
        {activeTab === 'tickets' && (
          <View style={styles.sectionBlock}>
            {tickets.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No support tickets yet</Text>
                <Text style={styles.emptySub}>When you submit a query, it will appear here with live tracking.</Text>
              </View>
            ) : (
              tickets.map(item => {
                const isOpen = item.status === 'Open';
                const isInProgress = item.status === 'In Progress';
                const isResolved = item.status === 'Resolved';

                return (
                  <View key={item.id} style={styles.ticketCard}>
                    <View style={styles.ticketCardHeader}>
                      <View>
                        <Text style={styles.ticketNoText}>{item.ticketNo}</Text>
                        <Text style={styles.ticketDateText}>{item.createdAt}</Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          isOpen && { backgroundColor: PALETTE.blueBadge },
                          isInProgress && { backgroundColor: PALETTE.amberBadge },
                          isResolved && { backgroundColor: PALETTE.greenBadge },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isOpen && { color: PALETTE.blueText },
                            isInProgress && { color: PALETTE.amberText },
                            isResolved && { color: PALETTE.greenText },
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.ticketSubject}>{item.subject}</Text>
                    <Text style={styles.ticketDesc}>{item.description}</Text>

                    {item.resolution && (
                      <View style={styles.ticketResolutionBox}>
                        <Text style={styles.resolutionTitle}>Resolution:</Text>
                        <Text style={styles.resolutionText}>{item.resolution}</Text>
                      </View>
                    )}

                    <View style={styles.ticketFooter}>
                      <Text style={styles.ticketCategory}>{item.category}</Text>
                      {item.referenceId && (
                        <Text style={styles.ticketRef}>Ref: {item.referenceId}</Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* ─── Simple Modal for Raising Ticket ─── */}
      <Modal visible={showCreateModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Support Ticket</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Subject / Issue Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Weighing scale calibration error"
                placeholderTextColor={PALETTE.textMuted}
                value={newSubject}
                onChangeText={setNewSubject}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.pillRow}>
                {['Receiving / QC', 'Inventory', 'Wallet / Cash', 'Hardware', 'Other'].map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryPill, newCategory === cat && styles.categoryPillActive]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text style={[styles.categoryPillText, newCategory === cat && styles.categoryPillTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.pillRow}>
                {(['Normal', 'High', 'Urgent'] as const).map(pri => (
                  <TouchableOpacity
                    key={pri}
                    style={[styles.priorityPill, newPriority === pri && styles.priorityPillActive]}
                    onPress={() => setNewPriority(pri)}
                  >
                    <Text style={[styles.priorityPillText, newPriority === pri && styles.priorityPillTextActive]}>
                      {pri}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Reference ID (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. GR-00124 or CRT-99"
                placeholderTextColor={PALETTE.textMuted}
                value={newReference}
                onChangeText={setNewReference}
              />

              <Text style={styles.inputLabel}>Problem Description *</Text>
              <TextInput
                style={[styles.textInput, { height: 90, textAlignVertical: 'top' }]}
                placeholder="Describe the issue in detail..."
                placeholderTextColor={PALETTE.textMuted}
                multiline
                numberOfLines={4}
                value={newDescription}
                onChangeText={setNewDescription}
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleCreateTicket}
                >
                  <Text style={styles.modalSubmitBtnText}>Submit Ticket</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.pageBg,
  },
  headerBanner: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  headerActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: PALETTE.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  contactCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  contactIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contactCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  contactCardSub: {
    fontSize: 10,
    fontWeight: '500',
    color: PALETTE.textSecondary,
    textAlign: 'center',
  },
  segmentWrapper: {
    flexDirection: 'row',
    backgroundColor: '#EAE4DC',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.tabInactive,
  },
  segmentTabTextActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
  sectionBlock: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    lineHeight: 18,
  },
  faqBody: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
  },
  faqAnswer: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    lineHeight: 18,
  },
  createTicketBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.primarySoft,
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginTop: 6,
  },
  createTicketIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
  },
  createTicketTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  createTicketSub: {
    fontSize: 11,
    color: PALETTE.textSecondary,
    marginTop: 1,
  },
  createTicketBtnSmall: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createTicketBtnSmallText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ticketCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketNoText: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.primary,
  },
  ticketDateText: {
    fontSize: 11,
    color: PALETTE.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ticketSubject: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 4,
  },
  ticketDesc: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    lineHeight: 17,
  },
  ticketResolutionBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  resolutionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.greenText,
    marginBottom: 2,
  },
  resolutionText: {
    fontSize: 11,
    color: '#166534',
    lineHeight: 15,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
  },
  ticketCategory: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textMuted,
  },
  ticketRef: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.primary,
  },
  emptyCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textInk,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: PALETTE.textSecondary,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.divider,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PALETTE.textInk,
  },
  modalCloseText: {
    fontSize: 16,
    color: PALETTE.textSecondary,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: PALETTE.textInk,
    marginBottom: 14,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  categoryPillActive: {
    backgroundColor: PALETTE.primaryLight,
    borderColor: PALETTE.primary,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  categoryPillTextActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
  priorityPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  priorityPillActive: {
    backgroundColor: PALETTE.primaryLight,
    borderColor: PALETTE.primary,
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },
  priorityPillTextActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PALETTE.border,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  modalSubmitBtn: {
    flex: 1.5,
    backgroundColor: PALETTE.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
