import React, { useMemo, useState } from 'react';
import {
  Alert,
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
import { SubWarehouseReportIssueScreen } from './SubWarehouseReportIssueScreen';
import { SubWarehouseIssueSubmittedScreen } from './SubWarehouseIssueSubmittedScreen';

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

  categoryTitle: '#8B5E3C',
  amberBadge:    '#FEF3C7',
  amberText:     '#D97706',

  tabInactive:   '#786F66',
  tabBorder:     '#EAE4DB',
};

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

function SearchIcon({ size = 18, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronUpIcon({ size = 16, color = '#6B7280' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AlertWarningIcon({ size = 18, color = '#8B5E3C' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Category Icons ──────────────────────────────────────────────────────────

function GettingStartedIcon({ color = '#8B5E3C' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 19l7-7 3 3-7 7-3-3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 2l7.586 7.586"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="11" cy="11" r="1.5" fill={color} />
    </Svg>
  );
}

function WarehouseIcon({ color = '#8B5E3C' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21V10l9-6 9 6v11H3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 21v-6a3 3 0 0 1 6 0v6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BagIcon({ color = '#8B5E3C' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 10a4 4 0 0 1-8 0"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BoxIcon({ color = '#8B5E3C' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Path
        d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InvoiceIcon({ color = '#8B5E3C' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WalletIcon({ color = '#8B5E3C' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect
        x="2"
        y="5"
        width="20"
        height="14"
        rx="2"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M18 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"
        stroke={color}
        strokeWidth="1.8"
      />
    </Svg>
  );
}

function DocumentIcon({ color = '#8B5E3C' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect
        x="5"
        y="3"
        width="14"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth="1.8"
      />
      <Path
        d="M9 7h6M9 11h6M9 15h4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ShieldIcon({ color = '#8B5E3C' }: { color?: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Bottom Tab Icons ────────────────────────────────────────────────────────

function HomeTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function InventoryTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoreTabIcon({ active }: { active: boolean }) {
  const color = active ? PALETTE.primary : PALETTE.tabInactive;
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="5" r="2" fill={color} />
      <Circle cx="12" cy="5" r="2" fill={color} />
      <Circle cx="19" cy="5" r="2" fill={color} />
      <Circle cx="5" cy="12" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="12" r="2" fill={color} />
      <Circle cx="5" cy="19" r="2" fill={color} />
      <Circle cx="12" cy="19" r="2" fill={color} />
      <Circle cx="19" cy="19" r="2" fill={color} />
    </Svg>
  );
}

// ─── Dynamic FAQ Database ───────────────────────────────────────────────────

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATABASE: FAQItem[] = [
  // 1. Getting Started
  {
    id: 'gs-1',
    category: 'Getting Started',
    question: 'How do I navigate the Sub Warehouse Admin dashboard?',
    answer: 'Use the bottom navigation bar to switch between Home, Receiving, Inventory, and More. The Home dashboard provides high-level cards for today’s receiving schedule, customer dispatch orders, and warehouse capacity.',
  },
  {
    id: 'gs-2',
    category: 'Getting Started',
    question: 'What are the main duties of a Sub Warehouse Admin?',
    answer: 'Sub Warehouse Admins log inbound produce batches from farmers, perform quality grading, update inventory storage, fulfill customer orders, and manage daily warehouse cash and expenses.',
  },
  {
    id: 'gs-3',
    category: 'Getting Started',
    question: 'How do I switch or view my assigned warehouse facility?',
    answer: 'Your account is linked to Coonoor Warehouse. Warehouse facility assignment is controlled by Super Admin RBAC policies.',
  },

  // 2. Warehouse Operations
  {
    id: 'wo-1',
    category: 'Warehouse Operations',
    question: 'How do I log a warehouse operational expense?',
    answer: 'Navigate to More > Finance & Expenses > Add Expense. Enter the amount, select an expense category (Packaging, Fuel, Utilities, Labour, Maintenance), and attach the receipt photo.',
  },
  {
    id: 'wo-2',
    category: 'Warehouse Operations',
    question: 'How do I monitor warehouse storage zones and crate capacity?',
    answer: 'Go to More > Warehouse Operations > Storage Info to view Cold Storage, Ambient Dry Storage, and Staging Bay capacity percentages.',
  },
  {
    id: 'wo-3',
    category: 'Warehouse Operations',
    question: 'How do I mark daily staff attendance and shifts?',
    answer: 'Open More > Warehouse Staff > Staff & Attendance to mark employee attendance, check-in times, and assign warehouse duty shifts.',
  },

  // 3. Orders
  {
    id: 'ord-1',
    category: 'Orders',
    question: "How do I view and filter today's customer orders?",
    answer: 'Open Customer Orders from the More menu or Home dashboard. Use the filter chips (Pending, Picked, Dispatched, Fulfilled) to view order status.',
  },
  {
    id: 'ord-2',
    category: 'Orders',
    question: 'How do I process customer pickup orders?',
    answer: 'Scan or enter the Order ID, verify payment confirmation or customer wallet deduction, inspect packed crates, and tap "Confirm Handover".',
  },
  {
    id: 'ord-3',
    category: 'Orders',
    question: 'How do I handle customer cancellation or item returns?',
    answer: 'Go to More > Returns & Issues > Review Return Request to verify customer return items, check produce quality, and issue instant wallet credit.',
  },

  // 4. Inventory
  {
    id: 'inv-1',
    category: 'Inventory',
    question: 'How do I record newly received farm produce?',
    answer: 'Go to the Receiving tab, tap "New Goods Receipt", select the farmer batch or intake manifest, record weighed crates, and print barcode bin tags.',
  },
  {
    id: 'inv-2',
    category: 'Inventory',
    question: 'How do I report damaged or spoilt produce?',
    answer: 'Navigate to More > Returns & Issues > Report Issue. Select "Inventory" issue type, enter damaged quantity, and attach crate photos for audit clearance.',
  },
  {
    id: 'inv-3',
    category: 'Inventory',
    question: 'How do I perform physical stock reconciliation?',
    answer: 'Open the Inventory bottom tab, tap "Stock Reconciliation", enter counted physical crate quantities against system ledger count, and submit for verification.',
  },

  // 5. Billing
  {
    id: 'bil-1',
    category: 'Billing',
    question: 'How do I generate a GST tax invoice?',
    answer: 'Open More > Billing & Invoices > Generate Invoice. Select the customer or B2B buyer, add products with HSN code, and calculate SGST/CGST breakdown.',
  },
  {
    id: 'bil-2',
    category: 'Billing',
    question: 'How do I download or print an invoice receipt?',
    answer: 'In More > Billing & Invoices > Invoice History, tap any invoice record and choose "Download PDF" or "Thermal Print".',
  },
  {
    id: 'bil-3',
    category: 'Billing',
    question: 'Can I issue a credit note for disputed orders?',
    answer: 'Yes, navigate to Billing > Invoices > Select Invoice > Issue Credit Note to adjust previous billing records.',
  },

  // 6. Wallet
  {
    id: 'wal-1',
    category: 'Wallet',
    question: 'How do I process a customer wallet cash top-up?',
    answer: 'Go to More > Wallet & Cash Top-Up > New Top-Up. Search customer by phone number, receive physical cash, and confirm wallet balance credit.',
  },
  {
    id: 'wal-2',
    category: 'Wallet',
    question: 'How do I process a wallet refund for a customer?',
    answer: 'Open More > Wallet & Cash Top-Up > Customer Search, locate the customer wallet transaction, and tap "Initiate Refund".',
  },
  {
    id: 'wal-3',
    category: 'Wallet',
    question: 'Where can I see the daily cash collection summary?',
    answer: 'Go to More > Finance > Daily Cash Summary to reconcile total cash collected in till vs bank deposit slips.',
  },

  // 7. Reports
  {
    id: 'rep-1',
    category: 'Reports',
    question: 'How do I export sales and dispatch reports?',
    answer: 'Navigate to More > Reports > Sales Report. Choose date range (Daily, Weekly, Monthly) and tap "Export Excel" or "View Analytics".',
  },
  {
    id: 'rep-2',
    category: 'Reports',
    question: 'How do I track produce wastage and shrinkage rates?',
    answer: 'Open More > Reports > Shrinkage Report to view percentage weight loss, transit damage, and storage decay trends.',
  },
  {
    id: 'rep-3',
    category: 'Reports',
    question: 'How do I generate the warehouse operational audit report?',
    answer: 'Go to More > Reports > Financial Reports to download the complete ledger of revenue, staff wages, and operational costs.',
  },

  // 8. Account & Security
  {
    id: 'sec-1',
    category: 'Account & Security',
    question: 'How do I change my account login password?',
    answer: 'Go to Settings > Security > Change Password. Enter current password and new password (minimum 6 characters) and tap "Update Password".',
  },
  {
    id: 'sec-2',
    category: 'Account & Security',
    question: 'How do I review active login devices and sessions?',
    answer: 'Open Settings > Session & Security to view device model, IP address, login timestamps, and tap "Logout Current Session" if needed.',
  },
  {
    id: 'sec-3',
    category: 'Account & Security',
    question: 'What should I do if I suspect unauthorized access?',
    answer: 'Immediately terminate active sessions from Session & Security and change your password. You can also report an urgent security ticket.',
  },
];

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

function MailIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 6l-10 7L2 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TicketIcon({ size = 18, color = PALETTE.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13 5v2M13 11v2M13 17v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Dynamic Category Definitions ──────────────────────────────────────────
const CATEGORIES = [
  { id: 'Getting Started', label: 'Getting Started', shortLabel: 'Start', icon: GettingStartedIcon },
  { id: 'Warehouse Operations', label: 'Warehouse Operations', shortLabel: 'Operations', icon: WarehouseIcon },
  { id: 'Orders', label: 'Orders', shortLabel: 'Orders', icon: BagIcon },
  { id: 'Inventory', label: 'Inventory', shortLabel: 'Inventory', icon: BoxIcon },
  { id: 'Billing', label: 'Billing', shortLabel: 'Billing', icon: InvoiceIcon },
  { id: 'Wallet', label: 'Wallet', shortLabel: 'Wallet', icon: WalletIcon },
  { id: 'Reports', label: 'Reports', shortLabel: 'Reports', icon: DocumentIcon },
  { id: 'Account & Security', label: 'Account & Security', shortLabel: 'Security', icon: ShieldIcon },
];

export interface SubWarehouseHelpSupportScreenProps {
  warehouseName?: string | undefined;
  onBack?: (() => void | ((fallbackScreen?: any) => void)) | undefined;
  onTabChange?: ((tab: any) => void) | undefined;
}

export function SubWarehouseHelpSupportScreen({
  onBack,
  onTabChange,
}: SubWarehouseHelpSupportScreenProps) {
  const [currentView, setCurrentView] = useState<'main' | 'report_issue' | 'submitted'>('main');
  const [submittedTicketId, setSubmittedTicketId] = useState('SUP-00246');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [reportIssueCategory, setReportIssueCategory] = useState<string>('Inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('ord-1');

  // Filter FAQs based on selectedCategory and searchQuery
  const filteredFaqs = useMemo(() => {
    let list = FAQ_DATABASE;
    if (selectedCategory) {
      list = list.filter((faq) => faq.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (faq) =>
          faq.question.toLowerCase().includes(q) ||
          faq.answer.toLowerCase().includes(q) ||
          faq.category.toLowerCase().includes(q),
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  const handleToggleCategory = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null); // toggle off to show all
    } else {
      setSelectedCategory(categoryName);
      setReportIssueCategory(categoryName);
      // Automatically expand first FAQ of that category
      const firstFaq = FAQ_DATABASE.find((f) => f.category === categoryName);
      if (firstFaq) {
        setExpandedFaqId(firstFaq.id);
      }
    }
  };

  const handleToggleFaq = (id: string) => {
    setExpandedFaqId(expandedFaqId === id ? null : id);
  };

  // ─── Sub-view: Report an Issue Screen ─────────────────────────────────────
  if (currentView === 'report_issue') {
    return (
      <SubWarehouseReportIssueScreen
        initialIssueType={reportIssueCategory}
        onBack={() => setCurrentView('main')}
        onSubmitSuccess={(ticketId) => {
          setSubmittedTicketId(ticketId);
          setCurrentView('submitted');
        }}
      />
    );
  }

  // ─── Sub-view: Request Submitted Screen ───────────────────────────────────
  if (currentView === 'submitted') {
    return (
      <SubWarehouseIssueSubmittedScreen
        supportId={submittedTicketId}
        onBack={() => setCurrentView('main')}
        onBackToSettings={() => {
          setCurrentView('main');
          if (onBack) onBack();
        }}
      />
    );
  }

  // ─── Main Help & Support View ─────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.primary} />

      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (onBack) onBack();
            }}
            activeOpacity={0.75}
            accessibilityLabel="Back"
          >
            <ArrowBackIcon size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitleText}>Help & Support</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <SearchIcon size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search FAQs, topics, or issues..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchBtn}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Section 1: Help Categories Horizontal Pills */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Help Categories</Text>
          {selectedCategory && (
            <TouchableOpacity onPress={() => setSelectedCategory(null)}>
              <Text style={styles.clearFilterText}>Show All (24)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Scrollable Category Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsScroll}
        >
          {/* All Chip */}
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === null && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(null)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === null && styles.categoryChipTextActive,
              ]}
            >
              All Topics
            </Text>
            <View
              style={[
                styles.chipBadge,
                selectedCategory === null && styles.chipBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.chipBadgeText,
                  selectedCategory === null && styles.chipBadgeTextActive,
                ]}
              >
                24
              </Text>
            </View>
          </TouchableOpacity>

          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const IconComp = cat.icon;
            const catFaqCount = FAQ_DATABASE.filter((f) => f.category === cat.id).length;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  isActive && styles.categoryChipActive,
                ]}
                onPress={() => handleToggleCategory(cat.id)}
                activeOpacity={0.75}
              >
                <IconComp color={isActive ? '#FFFFFF' : '#8B5E3C'} />
                <Text
                  style={[
                    styles.categoryChipText,
                    isActive && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.shortLabel}
                </Text>
                <View
                  style={[
                    styles.chipBadge,
                    isActive && styles.chipBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipBadgeText,
                      isActive && styles.chipBadgeTextActive,
                    ]}
                  >
                    {catFaqCount}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Compact Grid of Categories (2x4) */}
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const IconComp = cat.icon;
            return (
              <TouchableOpacity
                key={`grid-${cat.id}`}
                style={[
                  styles.gridTile,
                  isActive && styles.gridTileActive,
                ]}
                onPress={() => handleToggleCategory(cat.id)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.gridIconCircle,
                    isActive && styles.gridIconCircleActive,
                  ]}
                >
                  <IconComp color={isActive ? PALETTE.primary : '#8B5E3C'} />
                </View>
                <Text
                  style={[
                    styles.gridTileLabel,
                    isActive && styles.gridTileLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section 2: Dynamic Frequently Asked Questions */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>
            {selectedCategory ? `${selectedCategory} FAQs` : 'Frequently Asked Questions'}
          </Text>
          <View style={styles.faqCountPill}>
            <Text style={styles.faqCountPillText}>{filteredFaqs.length} Questions</Text>
          </View>
        </View>

        {filteredFaqs.length === 0 ? (
          <View style={styles.emptyFaqCard}>
            <Text style={styles.emptyFaqText}>No matching questions found.</Text>
            <TouchableOpacity onPress={() => { setSelectedCategory(null); setSearchQuery(''); }}>
              <Text style={styles.resetFilterBtnText}>Reset Search & Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.faqListContainer}>
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              return (
                <View
                  key={faq.id}
                  style={[
                    styles.faqCard,
                    isExpanded && styles.faqCardExpanded,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.faqRow}
                    onPress={() => handleToggleFaq(faq.id)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.faqQuestionWrap}>
                      {!selectedCategory && (
                        <View style={styles.faqCategoryBadge}>
                          <Text style={styles.faqCategoryBadgeText}>{faq.category}</Text>
                        </View>
                      )}
                      <Text
                        style={[
                          styles.faqQuestion,
                          isExpanded && styles.faqQuestionActive,
                        ]}
                      >
                        {faq.question}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.faqChevronBox,
                        isExpanded && styles.faqChevronBoxActive,
                      ]}
                    >
                      {isExpanded ? (
                        <ChevronUpIcon color={PALETTE.primary} />
                      ) : (
                        <ChevronDownIcon color="#6B7280" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.faqAnswerBox}>
                      <Text style={styles.faqAnswer}>{faq.answer}</Text>
                      <TouchableOpacity
                        style={styles.faqReportPill}
                        onPress={() => {
                          setReportIssueCategory(faq.category);
                          setCurrentView('report_issue');
                        }}
                        activeOpacity={0.8}
                      >
                        <AlertWarningIcon size={14} color={PALETTE.primary} />
                        <Text style={styles.faqReportPillText}>
                          Need help with this? Report an issue →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Section 3: Need More Help? */}
        <Text style={styles.sectionHeading}>Need More Help?</Text>
        <View style={styles.contactGrid}>
          {/* Card 1: Phone Support */}
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => {
              Alert.alert('Customer Support', 'Calling TOHFA Warehouse Helpdesk:\n+91 1800-845-6677');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.contactIconCircle}>
              <PhoneIcon size={18} color={PALETTE.primary} />
            </View>
            <Text style={styles.contactCardTitle}>Call Helpline</Text>
            <Text style={styles.contactCardSub}>+91 1800-845-6677</Text>
            <View style={styles.contactBadge}>
              <Text style={styles.contactBadgeText}>Toll Free · 8 AM - 8 PM</Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Email Support */}
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => {
              Alert.alert('Email Support', 'Drafting email to:\nsupport@tohfa.in');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.contactIconCircle}>
              <MailIcon size={18} color={PALETTE.primary} />
            </View>
            <Text style={styles.contactCardTitle}>Email Support</Text>
            <Text style={styles.contactCardSub}>support@tohfa.in</Text>
            <View style={styles.contactBadge}>
              <Text style={styles.contactBadgeText}>24/7 Response</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Primary Call to Action: Report an Issue */}
        <TouchableOpacity
          style={styles.primaryReportBtn}
          onPress={() => {
            setReportIssueCategory(selectedCategory || 'Warehouse Operations');
            setCurrentView('report_issue');
          }}
          activeOpacity={0.85}
        >
          <AlertWarningIcon size={20} color="#FFFFFF" />
          <Text style={styles.primaryReportBtnText}>Report an Issue</Text>
        </TouchableOpacity>

        {/* Section 4: My Support Requests */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>My Support Requests</Text>
          <Text style={styles.ticketCountText}>1 Active Ticket</Text>
        </View>

        <TouchableOpacity
          style={styles.requestCard}
          onPress={() => {
            Alert.alert(
              'Ticket SUP-00245',
              'Subject: Unable to generate invoice\nStatus: Under Review\nOpened: 25 Sep 2026',
            );
          }}
          activeOpacity={0.8}
        >
          <View style={styles.requestIconBox}>
            <TicketIcon size={20} color={PALETTE.primary} />
          </View>
          <View style={styles.requestLeft}>
            <Text style={styles.requestTitle}>Unable to generate invoice</Text>
            <Text style={styles.requestSub}>SUP-00245 · 25 Sep 2026 · Billing</Text>
          </View>
          <View style={styles.openBadge}>
            <Text style={styles.openBadgeText}>Open</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>


    </SafeAreaView>
  );
}

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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: PALETTE.textInk,
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 14,
    color: PALETTE.textSecondary,
    fontWeight: '700',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    letterSpacing: -0.2,
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  faqCountPill: {
    backgroundColor: PALETTE.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  faqCountPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  ticketCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: PALETTE.textSecondary,
  },

  // Category Horizontal Chips
  categoryChipsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
    paddingTop: 2,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PALETTE.textInk,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  chipBadge: {
    backgroundColor: PALETTE.divider,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  chipBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  chipBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.textSecondary,
  },
  chipBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Compact Grid of Categories (4 columns x 2 rows)
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  gridTile: {
    width: '23%',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  gridTileActive: {
    borderColor: PALETTE.primary,
    borderWidth: 1.5,
    backgroundColor: PALETTE.primaryLight,
  },
  gridIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PALETTE.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridIconCircleActive: {
    backgroundColor: '#FFFFFF',
  },
  gridTileLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    textAlign: 'center',
  },
  gridTileLabelActive: {
    color: PALETTE.primary,
    fontWeight: '800',
  },

  // FAQs
  faqListContainer: {
    gap: 8,
    marginBottom: 12,
  },
  faqCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  faqCardExpanded: {
    borderColor: PALETTE.primaryBorder,
    backgroundColor: '#FFFCFA',
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  faqQuestionWrap: {
    flex: 1,
    paddingRight: 10,
  },
  faqCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: PALETTE.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  faqCategoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: PALETTE.primary,
  },
  faqQuestion: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PALETTE.textInk,
    lineHeight: 19,
  },
  faqQuestionActive: {
    color: PALETTE.primary,
  },
  faqChevronBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PALETTE.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqChevronBoxActive: {
    backgroundColor: PALETTE.primaryLight,
  },
  faqAnswerBox: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: PALETTE.divider,
  },
  faqAnswer: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    lineHeight: 19.5,
  },
  faqReportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: PALETTE.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: PALETTE.primaryBorder,
  },
  faqReportPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.primary,
  },

  emptyFaqCard: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyFaqText: {
    fontSize: 13.5,
    color: PALETTE.textSecondary,
    marginBottom: 8,
  },
  resetFilterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primary,
  },

  // Contact Grid
  contactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  contactIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PALETTE.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  contactCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 2,
  },
  contactCardSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: PALETTE.textSecondary,
    marginBottom: 6,
  },
  contactBadge: {
    backgroundColor: PALETTE.pageBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  contactBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#8B5E3C',
  },

  // Primary Action Button
  primaryReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 14,
    gap: 8,
    shadowColor: PALETTE.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryReportBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Requests Card
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  requestIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: PALETTE.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestLeft: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: PALETTE.textInk,
    marginBottom: 3,
  },
  requestSub: {
    fontSize: 11.5,
    color: PALETTE.textSecondary,
    fontWeight: '500',
  },
  openBadge: {
    backgroundColor: PALETTE.amberBadge,
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  openBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.amberText,
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: PALETTE.tabBorder,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: PALETTE.tabInactive,
    marginTop: 3,
  },
  navLabelActive: {
    color: PALETTE.primary,
    fontWeight: '700',
  },
});
