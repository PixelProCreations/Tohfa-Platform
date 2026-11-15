import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
  StatusBar,
  Modal,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { ProductImages } from '../assets/images/products';
import { tohfaMarketLogo, pickupQrCode, divQrCode } from '../assets/images';
import { orderStore } from '../state/orderState';
import { ModalCloseCrossSvg } from './ProductModals';
import {
  customerColors,
  customerFonts,
  customerSpacing,
  customerRadius,
  customerShadow,
  customerPrimitives,
  customerType,
} from '../theme';
import {
  ChooseBankScreen,
  SbiLogo,
  HdfcLogo,
  IciciLogo,
  YesBankLogo,
} from './ChooseBankScreen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── CONFETTI ANIMATION COMPONENT (Shoots from Left Center & Right Center OVER Popup) ──

interface ConfettiPiece {
  id: number;
  originSide: 'left' | 'right';
  startX: number;
  startY: number;
  targetX: number;
  peakY: number;
  endY: number;
  size: { width: number; height: number };
  color: string;
  rotation: number;
  delay: number;
  duration: number;
}

const CONFETTI_COLORS = [
  '#EF4444', // Red
  '#F59E0B', // Amber / Gold
  '#10B981', // Emerald green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#14B8A6', // Teal
  '#E11D48', // Crimson
];

const TOTAL_CONFETTI = 88;

const GENERATED_PIECES: ConfettiPiece[] = Array.from({ length: TOTAL_CONFETTI }).map((_, i) => {
  const isLeft = i % 2 === 0;
  // Left center or right center cannon origin
  const startX = isLeft
    ? Math.random() * 24 - 12
    : SCREEN_WIDTH - Math.random() * 24 + 12;
  const startY = SCREEN_HEIGHT * 0.48 + (Math.random() - 0.5) * 160;
  const targetX = isLeft
    ? SCREEN_WIDTH * 0.2 + Math.random() * (SCREEN_WIDTH * 0.78)
    : SCREEN_WIDTH * 0.02 + Math.random() * (SCREEN_WIDTH * 0.78);
  const peakY = -(160 + Math.random() * 280);
  const endY = 180 + Math.random() * 280;

  // Varied real party paper dimensions: streamers, confetti flakes, rectangles
  const shapeType = i % 4;
  const size =
    shapeType === 0
      ? { width: 5, height: 14 }
      : shapeType === 1
      ? { width: 9, height: 11 }
      : shapeType === 2
      ? { width: 12, height: 6 }
      : { width: 7, height: 7 };

  return {
    id: i,
    originSide: isLeft ? 'left' : 'right',
    startX,
    startY,
    targetX,
    peakY,
    endY,
    size,
    color: (CONFETTI_COLORS[i % CONFETTI_COLORS.length] || '#10B981') as string,
    rotation: Math.floor(Math.random() * 360),
    delay: (i % 22) * 16,
    duration: 2200 + (i % 10) * 180,
  };
});

const ConfettiParticle = ({ piece }: { piece: ConfettiPiece }) => {
  const anim = useRef(new Animated.Value(0)).current;

  // Single-shot celebratory paper blast (ONE TIME ONLY, no looping)
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 1,
        duration: piece.duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, piece.delay);
    return () => clearTimeout(timer);
  }, [anim, piece.delay, piece.duration]);

  // Shoots inward from left or right towards the center / across the screen
  const translateX = anim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [piece.startX, (piece.startX + piece.targetX) * 0.55, piece.targetX],
  });

  // Explosive blast upwards, then falling gracefully with gravity
  const translateY = anim.interpolate({
    inputRange: [0, 0.32, 1],
    outputRange: [piece.startY, piece.startY + piece.peakY, piece.startY + piece.endY],
  });

  // Realistic tumbling 3D effect
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      `${piece.rotation}deg`,
      `${piece.rotation + (piece.originSide === 'left' ? 720 : -720)}deg`,
    ],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.08, 0.8, 1],
    outputRange: [0.5, 1, 1, 0.75],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.04, 0.88, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: piece.size.width,
        height: piece.size.height,
        backgroundColor: piece.color,
        borderRadius: 1.5,
        opacity,
        transform: [{ translateX }, { translateY }, { rotate }, { scale }],
        zIndex: 99999,
        // Absolutely NO black shadows - pure lightweight floating festive papers
        elevation: 0,
        shadowColor: 'transparent',
        shadowOpacity: 0,
        shadowRadius: 0,
      }}
    />
  );
};

const ConfettiOverlay = () => (
  <View
    pointerEvents="none"
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      elevation: 0,
    }}
  >
    {GENERATED_PIECES.map(p => (
      <ConfettiParticle key={p.id} piece={p} />
    ))}
  </View>
);

// ── VECTOR QR CODE COMPONENT ────────────────────────────────────────────────

const SvgQrCode = ({ size = 200 }: { size?: number }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <Rect width="200" height="200" fill="#FFFFFF" rx="8" />

      {/* Top Left Finder Pattern */}
      <Rect x="15" y="15" width="55" height="55" rx="6" fill="#1F2937" />
      <Rect x="23" y="23" width="39" height="39" rx="4" fill="#FFFFFF" />
      <Rect x="31" y="31" width="23" height="23" rx="3" fill="#1F2937" />

      {/* Top Right Finder Pattern */}
      <Rect x="130" y="15" width="55" height="55" rx="6" fill="#1F2937" />
      <Rect x="138" y="23" width="39" height="39" rx="4" fill="#FFFFFF" />
      <Rect x="146" y="31" width="23" height="23" rx="3" fill="#1F2937" />

      {/* Bottom Left Finder Pattern */}
      <Rect x="15" y="130" width="55" height="55" rx="6" fill="#1F2937" />
      <Rect x="23" y="138" width="39" height="39" rx="4" fill="#FFFFFF" />
      <Rect x="31" y="146" width="23" height="23" rx="3" fill="#1F2937" />

      {/* Data modules */}
      <Rect x="85" y="20" width="12" height="12" rx="2" fill="#1F2937" />
      <Rect x="105" y="20" width="12" height="12" rx="2" fill="#1F2937" />
      <Rect x="95" y="38" width="12" height="12" rx="2" fill="#1F2937" />
      <Rect x="78" y="52" width="14" height="14" rx="2" fill="#1F2937" />
      <Rect x="105" y="52" width="12" height="12" rx="2" fill="#1F2937" />

      {/* Middle section */}
      <Rect x="20" y="85" width="12" height="12" rx="2" fill="#1F2937" />
      <Rect x="38" y="85" width="12" height="12" rx="2" fill="#1F2937" />
      <Rect x="56" y="85" width="12" height="12" rx="2" fill="#1F2937" />
      <Rect x="78" y="75" width="14" height="24" rx="2" fill="#1F2937" />
      <Rect x="100" y="80" width="18" height="18" rx="2" fill="#1F2937" />
      <Rect x="130" y="85" width="14" height="14" rx="2" fill="#1F2937" />
      <Rect x="155" y="85" width="12" height="12" rx="2" fill="#1F2937" />
      <Rect x="175" y="85" width="12" height="12" rx="2" fill="#1F2937" />

      <Rect x="20" y="105" width="20" height="12" rx="2" fill="#1F2937" />
      <Rect x="50" y="105" width="12" height="12" rx="2" fill="#1F2937" />
      <Rect x="72" y="105" width="20" height="20" rx="2" fill="#1F2937" />
      <Rect x="102" y="105" width="15" height="15" rx="2" fill="#1F2937" />
      <Rect x="125" y="105" width="20" height="12" rx="2" fill="#1F2937" />
      <Rect x="155" y="105" width="30" height="12" rx="2" fill="#1F2937" />

      {/* Bottom Right section */}
      <Rect x="85" y="135" width="14" height="14" rx="2" fill="#1F2937" />
      <Rect x="108" y="130" width="20" height="20" rx="2" fill="#1F2937" />
      <Rect x="138" y="135" width="14" height="14" rx="2" fill="#1F2937" />
      <Rect x="160" y="130" width="25" height="25" rx="3" fill="#1F2937" />

      <Rect x="85" y="160" width="22" height="22" rx="3" fill="#1F2937" />
      <Rect x="115" y="165" width="15" height="15" rx="2" fill="#1F2937" />
      <Rect x="140" y="160" width="20" height="20" rx="2" fill="#1F2937" />
      <Rect x="170" y="165" width="15" height="15" rx="2" fill="#1F2937" />
    </Svg>
  );
};

// ── SVG ICONS ───────────────────────────────────────────────────────────────

const BackArrowSvg = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke="#1F2937"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LocationPinSvg = ({ color = '#16A34A' }: { color?: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21C16 16.5 19 12.2 19 8.5C19 4.9 15.9 2 12 2C8.1 2 5 4.9 5 8.5C5 12.2 8 16.5 12 21Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={8.5} r={2.5} stroke={color} strokeWidth={2} />
  </Svg>
);

const EditPencilSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke="#1F2937"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
      stroke="#1F2937"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CardHeaderSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke="#16A34A" strokeWidth={2} />
    <Path d="M2 10h20" stroke="#16A34A" strokeWidth={2} />
  </Svg>
);

const PhoneSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="2" width="14" height="20" rx="2" stroke="#4B5563" strokeWidth={1.8} />
    <Circle cx="12" cy="18" r="1" fill="#4B5563" />
  </Svg>
);

const CreditCardSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke="#4B5563" strokeWidth={1.8} />
    <Path d="M2 10h20" stroke="#4B5563" strokeWidth={1.8} />
    <Circle cx="6" cy="15" r="1" fill="#4B5563" />
    <Circle cx="10" cy="15" r="1" fill="#4B5563" />
  </Svg>
);

const CashSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="6" width="20" height="12" rx="2" stroke="#4B5563" strokeWidth={1.8} />
    <Circle cx="12" cy="12" r="3" stroke="#4B5563" strokeWidth={1.8} />
    <Path d="M6 12h.01M18 12h.01" stroke="#4B5563" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const BankSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M3 21h18M3 10h18M4 10V21M8 10V21M12 10V21M16 10V21M20 10V21M12 3L2 8h20L12 3z" stroke="#4B5563" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const WalletSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M20 12V8H6a2 2 0 01-2-2V4a2 2 0 012-2h14v6" stroke="#4B5563" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 6v14a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2z" stroke="#4B5563" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Circle cx="16" cy="14" r="1.5" fill="#4B5563" />
  </Svg>
);

const CartFloatingSvg = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
      stroke="#FFFFFF"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="9" cy="21" r="1.5" fill="#FFFFFF" />
    <Circle cx="18" cy="21" r="1.5" fill="#FFFFFF" />
  </Svg>
);

const EyeHideSvg = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
      stroke="#6B7280"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SearchMagnifierSvg = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth={2} />
    <Path d="M21 21l-4.35-4.35" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// ── UPI APP BADGES ──────────────────────────────────────────────────────────

const OtherUpiIcon = () => (
  <View style={styles.upiIconCircle}>
    <Text style={styles.otherUpiText}>UPI</Text>
  </View>
);

const GPayIcon = () => (
  <View style={styles.upiIconCircle}>
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#FFFFFF" />
      <Path d="M17.5 12.2c0-.4-.04-.8-.1-1.2H12v2.3h3.1c-.13.7-.54 1.4-1.14 1.8v1.5h1.84c1.08-1 1.7-2.5 1.7-4.4z" fill="#4285F4" />
      <Path d="M12 17.8c1.57 0 2.88-.52 3.84-1.4l-1.84-1.5c-.52.35-1.18.55-2 .55-1.53 0-2.83-1.03-3.3-2.42H6.8v1.5c1 1.98 3.03 3.27 5.2 3.27z" fill="#34A853" />
      <Path d="M8.7 13.03c-.12-.35-.19-.73-.19-1.12 0-.39.07-.77.19-1.12V9.29H6.8c-.42.84-.66 1.79-.66 2.8 0 1.01.24 1.96.66 2.8l1.9-1.86z" fill="#FBBC05" />
      <Path d="M12 6.18c.85 0 1.62.3 2.22.86l1.66-1.66C14.88 4.45 13.57 4 12 4 9.83 4 7.8 5.29 6.8 7.27l1.9 1.48c.47-1.39 1.77-2.42 3.3-2.42z" fill="#EA4335" />
    </Svg>
  </View>
);

const BhimIcon = () => (
  <View style={styles.upiIconCircle}>
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M12 2L4 12l8 10 8-10L12 2z" fill="#FF9933" />
      <Path d="M12 2L4 12h16L12 2z" fill="#138808" />
      <Circle cx="12" cy="12" r="3" fill="#000080" />
    </Svg>
  </View>
);

const PaytmIcon = () => (
  <View style={styles.upiIconCircle}>
    <Text style={styles.paytmText}>Paytm</Text>
  </View>
);

// ── POPULAR & ALL INDIAN BANKS ──────────────────────────────────────────────

interface BankInfo {
  id: string;
  name: string;
  shortName: string;
  bgColor: string;
  textColor: string;
  badgeText: string;
}

interface PopularBank {
  id: string;
  name: string;
  shortName: string;
  renderLogo: (size?: number | undefined) => React.ReactNode;
}

const POPULAR_BANKS: PopularBank[] = [
  { id: 'sbi', name: 'State Bank of India', shortName: 'SBI', renderLogo: s => <SbiLogo size={s} /> },
  { id: 'hdfc', name: 'HDFC Bank', shortName: 'HDFC', renderLogo: s => <HdfcLogo size={s} /> },
  { id: 'icici', name: 'ICICI Netbanking', shortName: 'ICICI', renderLogo: s => <IciciLogo size={s} /> },
  { id: 'yes', name: 'YES Bank', shortName: 'YES Bank', renderLogo: s => <YesBankLogo size={s} /> },
];

const ALL_INDIAN_BANKS: BankInfo[] = [
  { id: 'sbi', name: 'State Bank of India', shortName: 'SBI', bgColor: '#0084CA', textColor: '#FFFFFF', badgeText: 'SBI' },
  { id: 'hdfc', name: 'HDFC Bank', shortName: 'HDFC', bgColor: '#004C8F', textColor: '#FFFFFF', badgeText: 'HDFC' },
  { id: 'icici', name: 'ICICI Netbanking', shortName: 'ICICI', bgColor: '#F37021', textColor: '#FFFFFF', badgeText: 'ICICI' },
  { id: 'axis', name: 'Axis Bank', shortName: 'Axis', bgColor: '#97144D', textColor: '#FFFFFF', badgeText: 'AXIS' },
  { id: 'au', name: 'AU Small Finance Bank', shortName: 'AU Bank', bgColor: '#E65100', textColor: '#FFFFFF', badgeText: 'AU' },
  { id: 'airtel', name: 'Airtel Payments Bank', shortName: 'Airtel', bgColor: '#E53935', textColor: '#FFFFFF', badgeText: 'AIR' },
  { id: 'allahabad', name: 'Allahabad Bank', shortName: 'Allahabad', bgColor: '#0288D1', textColor: '#FFFFFF', badgeText: 'ALH' },
  { id: 'andhra', name: 'Andhra Bank', shortName: 'Andhra', bgColor: '#1E88E5', textColor: '#FFFFFF', badgeText: 'AND' },
  { id: 'bandhan', name: 'Bandhan Bank', shortName: 'Bandhan', bgColor: '#C2185B', textColor: '#FFFFFF', badgeText: 'BDN' },
  { id: 'bob', name: 'Bank of Baroda', shortName: 'BOB', bgColor: '#F26522', textColor: '#FFFFFF', badgeText: 'BOB' },
  { id: 'boi', name: 'Bank of India', shortName: 'BOI', bgColor: '#E65100', textColor: '#FFFFFF', badgeText: 'BOI' },
  { id: 'canara', name: 'Canara Bank', shortName: 'Canara', bgColor: '#00A3E0', textColor: '#FFFFFF', badgeText: 'CAN' },
  { id: 'central', name: 'Central Bank of India', shortName: 'Central Bank', bgColor: '#D32F2F', textColor: '#FFFFFF', badgeText: 'CBI' },
  { id: 'federal', name: 'Federal Bank', shortName: 'Federal', bgColor: '#0D47A1', textColor: '#FFFFFF', badgeText: 'FED' },
  { id: 'idbi', name: 'IDBI Bank', shortName: 'IDBI', bgColor: '#007A3D', textColor: '#FFFFFF', badgeText: 'IDBI' },
  { id: 'idfc', name: 'IDFC Bank', shortName: 'IDFC', bgColor: '#880E4F', textColor: '#FFFFFF', badgeText: 'IDFC' },
  { id: 'indusind', name: 'IndusInd Bank', shortName: 'IndusInd', bgColor: '#8B0000', textColor: '#FFFFFF', badgeText: 'INB' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', shortName: 'Kotak', bgColor: '#ED1B24', textColor: '#FFFFFF', badgeText: 'KM' },
  { id: 'pnb', name: 'Punjab National Bank', shortName: 'PNB', bgColor: '#A20000', textColor: '#FFFFFF', badgeText: 'PNB' },
  { id: 'union', name: 'Union Bank of India', shortName: 'UBI', bgColor: '#005A9C', textColor: '#FFFFFF', badgeText: 'UBI' },
];

// ── TYPES ───────────────────────────────────────────────────────────────────

export type PaymentMethod = 'upi' | 'card' | 'cod' | 'netbanking' | 'wallets';

export interface CheckoutScreenProps {
  onNavigate?: (screen: string, params?: Record<string, unknown>) => void;
  onGoBack?: () => void;
  params?: Record<string, unknown>;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  onNavigate,
  onGoBack,
  params,
}) => {
  // ── STATE ─────────────────────────────────────────────────────────────────
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);

  // Card details (initially empty per Image 2 left)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Net banking state (Image 4 & Image 5)
  const [selectedBank, setSelectedBank] = useState<string | null>(
    (params?.selectedBank as string) || null
  );
  const [bankSearch, setBankSearch] = useState('');

  useEffect(() => {
    if (params?.selectedBank) {
      setSelectedBank(params.selectedBank as string);
      setSelectedMethod('netbanking');
      if (params?.autoProceed) {
        handleProceedToPay();
      }
    }
  }, [params?.selectedBank, params?.autoProceed]);

  // ── POPUP MODALS STATE ───────────────────────────────────────────────────
  // Screen 2: Pay with Wallet modal
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletOtp, setWalletOtp] = useState('');

  // Screen 3: Order Success Modal with Confetti
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Screen 4: Pickup Code / QR Modal
  const [showPickupModal, setShowPickupModal] = useState(false);

  // Address and total passed from CartScreen
  const total = typeof params?.total === 'number' ? params.total : 465.0;
  const itemsCount = typeof params?.itemsCount === 'number' ? params.itemsCount : 3;

  // Filtered banks for Search in Image 5
  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return ALL_INDIAN_BANKS;
    const q = bankSearch.toLowerCase();
    return ALL_INDIAN_BANKS.filter(
      b => b.name.toLowerCase().includes(q) || b.shortName.toLowerCase().includes(q)
    );
  }, [bankSearch]);

  // ── ENABLE "PROCEED TO PAY" LOGIC ─────────────────────────────────────────
  const isPaymentReady = useMemo(() => {
    if (!selectedMethod) return false;
    if (selectedMethod === 'upi') {
      return !!selectedUpiApp;
    }
    if (selectedMethod === 'card') {
      return cardNumber.trim().length > 0;
    }
    if (selectedMethod === 'netbanking') {
      return !!selectedBank;
    }
    if (selectedMethod === 'cod') {
      return true;
    }
    if (selectedMethod === 'wallets') {
      return true;
    }
    return false;
  }, [selectedMethod, selectedUpiApp, cardNumber, selectedBank]);

  // ── HANDLE PROCEED TO PAY ─────────────────────────────────────────────────
  const handleProceedToPay = () => {
    if (!isPaymentReady) return;

    // Record ordered products so they show "Coming tomorrow" and green shading on Home screen
    orderStore.addOrderedItems([
      'Royal Gala',
      'Fuji',
      'Green Curly Lettuce',
      'Red Tomato',
      'Fresh Tomatoes',
      'Watermelon',
    ]);

    if (selectedMethod === 'wallets') {
      // 2nd screen: Show "Pay with Wallet" popup modal
      setShowWalletModal(true);
      return;
    }

    // For all other methods (UPI, Card, COD, Netbanking):
    // Show 3rd screen popup directly with colored flying confetti animation!
    setShowSuccessModal(true);
  };

  const handleWalletConfirmPayment = () => {
    orderStore.addOrderedItems([
      'Royal Gala',
      'Fuji',
      'Green Curly Lettuce',
      'Red Tomato',
      'Fresh Tomatoes',
      'Watermelon',
    ]);
    setShowWalletModal(false);
    // Proceed to 3rd screen (Order success modal with flying paper animation)
    setShowSuccessModal(true);
  };

  // Helper to autofill demo card details (for quick verification of Image 2 right)
  const autofillDemoCard = () => {
    setCardNumber('9876 9876 5432 5432');
    setCardExpiry('05/36');
    setCardCvv('•••');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── TOP HEADER (Back Button + Editorial Title) ──────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => (onGoBack ? onGoBack() : onNavigate?.('Cart'))}
          style={styles.backButton}
        >
          <BackArrowSvg />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pay & Checkout</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. DELIVERY ADDRESS CARD ──────────────────────────────────────── */}
        <View style={styles.addressCard}>
          <View style={styles.addressCardHeader}>
            <View style={styles.addressCardHeaderLeft}>
              <LocationPinSvg color="#16A34A" />
              <Text style={styles.addressCardTitle}>Delivery Address</Text>
              <View style={styles.homeBadge}>
                <Text style={styles.homeBadgeText}>Home</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => (onGoBack ? onGoBack() : onNavigate?.('Cart'))}
            >
              <EditPencilSvg />
            </TouchableOpacity>
          </View>

          <View style={styles.addressCardBody}>
            <Text style={styles.addressLine}>Suresh,</Text>
            <Text style={styles.addressLine}>
              77, Sylks Road, Ooty – 643001, Tamil Nadu.
            </Text>
            <Text style={styles.addressPhone}>Phone: 99944 99944</Text>
          </View>
        </View>

        {/* ── 2. CART SUMMARY FLOATING DARK PILL ────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => (onGoBack ? onGoBack() : onNavigate?.('Cart'))}
          style={styles.darkCartPill}
        >
          <View style={styles.darkCartLeft}>
            <View style={styles.cartThumbnailCircle}>
              <Image
                source={ProductImages.fruitApple}
                style={styles.cartThumbnailImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.darkCartTexts}>
              <Text style={styles.darkCartTitle}>{itemsCount} items in your cart</Text>
              <Text style={styles.darkCartViewLink}>View cart</Text>
            </View>
          </View>
          <Text style={styles.darkCartTotal}>₹{total.toFixed(2)}</Text>
        </TouchableOpacity>

        {/* ── 3. PAYMENT METHOD CARD ────────────────────────────────────────── */}
        <View style={styles.paymentCard}>
          {/* Header */}
          <View style={styles.paymentCardHeader}>
            <CardHeaderSvg />
            <Text style={styles.paymentCardTitle}>Payment Method</Text>
          </View>

          {/* Body List */}
          <View style={styles.paymentList}>
            {/* ── OPTION 1: UPI ── */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedMethod('upi');
              }}
              style={[
                styles.methodRow,
                selectedMethod === 'upi' && styles.methodRowSelected,
              ]}
            >
              <View style={styles.methodLeft}>
                <PhoneSvg />
                <Text style={styles.methodLabel}>UPI</Text>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  selectedMethod === 'upi' && styles.radioCircleSelected,
                ]}
              >
                {selectedMethod === 'upi' && <View style={styles.radioInnerDot} />}
              </View>
            </TouchableOpacity>

            {/* UPI Expanded Sub-section */}
            {selectedMethod === 'upi' && (
              <View style={styles.subSectionBox}>
                <Text style={styles.subSectionTitle}>UPI Apps</Text>
                <View style={styles.upiAppsRow}>
                  {/* Other */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedUpiApp('Other')}
                    style={[
                      styles.upiAppBtn,
                      selectedUpiApp === 'Other' && styles.upiAppBtnSelected,
                    ]}
                  >
                    <OtherUpiIcon />
                    <Text style={styles.upiAppLabel}>Other</Text>
                  </TouchableOpacity>

                  {/* GPay */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedUpiApp('GPay')}
                    style={[
                      styles.upiAppBtn,
                      selectedUpiApp === 'GPay' && styles.upiAppBtnSelected,
                    ]}
                  >
                    <GPayIcon />
                    <Text style={styles.upiAppLabel}>GPay</Text>
                  </TouchableOpacity>

                  {/* BHIM App */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedUpiApp('BHIM')}
                    style={[
                      styles.upiAppBtn,
                      selectedUpiApp === 'BHIM' && styles.upiAppBtnSelected,
                    ]}
                  >
                    <BhimIcon />
                    <Text style={styles.upiAppLabel}>BHIM App</Text>
                  </TouchableOpacity>

                  {/* Paytm */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setSelectedUpiApp('Paytm')}
                    style={[
                      styles.upiAppBtn,
                      selectedUpiApp === 'Paytm' && styles.upiAppBtnSelected,
                    ]}
                  >
                    <PaytmIcon />
                    <Text style={styles.upiAppLabel}>Paytm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── OPTION 2: Credit/Debit Card (Image 2) ── */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedMethod('card');
              }}
              style={[
                styles.methodRow,
                selectedMethod === 'card' && styles.methodRowSelected,
              ]}
            >
              <View style={styles.methodLeft}>
                <CreditCardSvg />
                <Text style={styles.methodLabel}>Credit/Debit Card</Text>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  selectedMethod === 'card' && styles.radioCircleSelected,
                ]}
              >
                {selectedMethod === 'card' && <View style={styles.radioInnerDot} />}
              </View>
            </TouchableOpacity>

            {/* Credit/Debit Card Expanded Sub-section: Enter card details */}
            {selectedMethod === 'card' && (
              <View style={styles.subSectionBox}>
                <View style={styles.subSectionHeaderRow}>
                  <Text style={styles.subSectionTitle}>Enter card details</Text>
                  {!cardNumber && (
                    <TouchableOpacity onPress={autofillDemoCard} activeOpacity={0.7}>
                      <Text style={styles.autofillHint}>Demo Autofill</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Card Number Input with Eye Hide Icon */}
                <View style={styles.cardInputRow}>
                  <TextInput
                    style={styles.cardNumberInput}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    placeholder="Enter card Number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                  <TouchableOpacity activeOpacity={0.7}>
                    <EyeHideSvg />
                  </TouchableOpacity>
                </View>

                {/* Expiry & CVV Row */}
                <View style={styles.cardDetailRow}>
                  <TextInput
                    style={[styles.cardSmallInput, { flex: 1, marginRight: 16 }]}
                    value={cardExpiry}
                    onChangeText={setCardExpiry}
                    placeholder="MM/YY"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.cardSmallInput, { flex: 1 }]}
                    value={cardCvv}
                    onChangeText={setCardCvv}
                    placeholder="CVV"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    secureTextEntry
                  />
                </View>
              </View>
            )}

            {/* ── OPTION 3: Cash on Delivery or Shop (Image 3) ── */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedMethod('cod');
              }}
              style={[
                styles.methodRow,
                selectedMethod === 'cod' && styles.methodRowSelected,
              ]}
            >
              <View style={styles.methodLeft}>
                <CashSvg />
                <Text style={styles.methodLabel}>Cash on Delivery or Shop</Text>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  selectedMethod === 'cod' && styles.radioCircleSelected,
                ]}
              >
                {selectedMethod === 'cod' && <View style={styles.radioInnerDot} />}
              </View>
            </TouchableOpacity>

            {/* ── OPTION 4: Net banking (Image 4 & Image 5) ── */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedMethod('netbanking');
              }}
              style={[
                styles.methodRow,
                selectedMethod === 'netbanking' && styles.methodRowSelected,
              ]}
            >
              <View style={styles.methodLeft}>
                <BankSvg />
                <Text style={styles.methodLabel}>Net banking</Text>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  selectedMethod === 'netbanking' && styles.radioCircleSelected,
                ]}
              >
                {selectedMethod === 'netbanking' && <View style={styles.radioInnerDot} />}
              </View>
            </TouchableOpacity>

            {/* Net banking Expanded Sub-section: Popular Banks + Other Bank button */}
            {selectedMethod === 'netbanking' && (
              <View style={styles.subSectionBox}>
                {/* Header row: "UPI Apps" on Left, "Other Bank" on Right */}
                <View style={styles.subSectionHeaderRow}>
                  <Text style={styles.subSectionTitle}>UPI Apps</Text>
                  <TouchableOpacity
                    onPress={() =>
                      onNavigate?.('ChooseBank', {
                        ...params,
                        selectedBank,
                        total,
                        itemsCount,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <Text style={styles.otherBankLink}>Other Bank</Text>
                  </TouchableOpacity>
                </View>

                {/* Popular 4 Banks (SBI, HDFC, ICICI, YES Bank) with exact logos */}
                <View style={styles.popularBanksRow}>
                  {POPULAR_BANKS.map(bank => {
                    const isSelected = selectedBank === bank.name || selectedBank === bank.shortName;
                    return (
                      <TouchableOpacity
                        key={bank.id}
                        activeOpacity={0.8}
                        onPress={() => setSelectedBank(bank.name)}
                        style={[
                          styles.popularBankCard,
                          isSelected && styles.popularBankCardSelected,
                        ]}
                      >
                        <View style={styles.bankLogoCircle}>
                          {bank.renderLogo(34)}
                        </View>
                        <Text style={styles.popularBankName}>{bank.shortName}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── OPTION 5: Wallets (Image 2) ── */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedMethod('wallets');
                // Open 2nd screen: Pay with Wallet popup modal
                setShowWalletModal(true);
              }}
              style={[
                styles.methodRow,
                selectedMethod === 'wallets' && styles.methodRowSelected,
              ]}
            >
              <View style={styles.methodLeft}>
                <WalletSvg />
                <Text style={styles.methodLabel}>Wallets</Text>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  selectedMethod === 'wallets' && styles.radioCircleSelected,
                ]}
              >
                {selectedMethod === 'wallets' && <View style={styles.radioInnerDot} />}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 4. RETURN / REFUND POLICY ─────────────────────────────────────── */}
        <View style={styles.policyContainer}>
          <Text style={styles.policyTitle}>Return/Refund Policy</Text>
          <Text style={styles.policyText}>
            Freshly sourced from local farmers, thoughtfully delivered to your home.
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                'Return & Refund Policy',
                'We guarantee 100% farm-fresh quality. If any item is damaged or unscheduled, report within 24 hours for instant refund or replacement.'
              )
            }
          >
            <Text style={styles.readPolicyLink}>Read policy</Text>
          </TouchableOpacity>
        </View>

        {/* Extra bottom padding for sticky checkout bar */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── 5. STICKY BOTTOM CHECKOUT BAR ──────────────────────────────────── */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPillContainer}>
          <Text style={styles.bottomPriceText}>₹{total.toFixed(2)}</Text>

          <TouchableOpacity
            activeOpacity={isPaymentReady ? 0.85 : 1}
            onPress={handleProceedToPay}
            disabled={!isPaymentReady}
            style={[
              styles.proceedToPayBtn,
              isPaymentReady ? styles.proceedToPayBtnActive : styles.proceedToPayBtnDisabled,
            ]}
          >
            <Text
              style={[
                styles.proceedToPayBtnText,
                isPaymentReady ? styles.proceedToPayBtnTextActive : styles.proceedToPayBtnTextDisabled,
              ]}
            >
              Proceed to Pay
            </Text>
          </TouchableOpacity>
        </View>

        {/* Floating Green Cart Circle Badge */}
        <TouchableOpacity
          style={styles.floatingCartCircle}
          onPress={() => (onGoBack ? onGoBack() : onNavigate?.('Cart'))}
          activeOpacity={0.85}
        >
          <CartFloatingSvg />
        </TouchableOpacity>
      </View>

      {/* ═══════════════════════════════════════════════════════════════════════
          2ND SCREEN: PAY WITH WALLET POPUP MODAL (Exact Image 2)
          ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showWalletModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWalletModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.walletModalCard}>
            {/* Top Close Button ✕ (Exact Figma Image 1 left) */}
            <TouchableOpacity
              style={styles.modalCloseCircle}
              onPress={() => setShowWalletModal(false)}
              activeOpacity={0.7}
              accessibilityLabel="Close"
            >
              <ModalCloseCrossSvg size={13} color="#1F2937" />
            </TouchableOpacity>

            {/* Header: Green Wallet Icon + Title */}
            <View style={styles.walletHeaderRow}>
              <View style={styles.walletIconHeader}>
                <WalletSvg />
              </View>
              <Text style={styles.walletModalTitle}>Pay with Wallet</Text>
            </View>

            {/* Top Light Green Banner: Order ID & Amount */}
            <View style={styles.walletOrderBanner}>
              <View style={styles.walletOrderBannerLeft}>
                <View style={styles.walletOrderCartIcon}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M3 3h2l2 12h11l2-8H6"
                      stroke="#16A34A"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Circle cx="9" cy="20" r="1.5" fill="#16A34A" />
                    <Circle cx="17" cy="20" r="1.5" fill="#16A34A" />
                  </Svg>
                </View>
                <View>
                  <Text style={styles.walletOrderId}>Order ID: #TOH123456</Text>
                  <Text style={styles.walletOrderLabel}>Order Payment</Text>
                </View>
              </View>
              <Text style={styles.walletOrderPrice}>₹{total.toFixed(2)}</Text>
            </View>

            {/* Balance Summary Card */}
            <View style={styles.walletSummaryCard}>
              {/* Row 1: TOHFA Wallet Balance */}
              <View style={styles.walletBalanceRow}>
                <View style={styles.walletBalanceLeft}>
                  <WalletSvg />
                  <Text style={styles.walletBalanceLabel}>TOHFA Wallet Balance</Text>
                </View>
                <Text style={styles.walletBalanceVal}>₹2,580.00</Text>
              </View>

              <View style={styles.walletDivider} />

              {/* Row 2: Payment Amount */}
              <View style={styles.walletBalanceRow}>
                <Text style={styles.walletAmountLabel}>Payment Amount</Text>
                <Text style={styles.walletAmountVal}>₹{total.toFixed(2)}</Text>
              </View>

              {/* Row 3: Balance after Payment */}
              <View style={styles.walletBalanceAfterBanner}>
                <Text style={styles.walletBalanceAfterLabel}>Balance after Payment</Text>
                <Text style={styles.walletBalanceAfterVal}>₹{(2580 - total).toFixed(2)}</Text>
              </View>
            </View>

            {/* Sub-section: Enter OTP */}
            <View style={styles.walletOtpSection}>
              <View style={styles.walletOtpHeader}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Rect x="4" y="11" width="16" height="11" rx="2" stroke="#1F2937" strokeWidth="2" />
                  <Path d="M7 11V7a5 5 0 0110 0v4" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
                </Svg>
                <Text style={styles.walletOtpTitle}>Enter OTP</Text>
              </View>
              <Text style={styles.walletOtpSubtitle}>
                Enter the OTP sent to your registered mobile number to complete the payment.
              </Text>

              {/* OTP Input with Phone Icon & Eye */}
              <View style={styles.walletOtpInputBox}>
                <PhoneSvg />
                <TextInput
                  style={styles.walletOtpInput}
                  value={walletOtp}
                  onChangeText={setWalletOtp}
                  placeholder="Enter OTP"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setWalletOtp('1234')}
                >
                  <EyeHideSvg />
                </TouchableOpacity>
              </View>
            </View>

            {/* Buttons Row: Cancel & Confirm Payment */}
            <View style={styles.walletActionRow}>
              <TouchableOpacity
                style={styles.walletCancelBtn}
                onPress={() => setShowWalletModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.walletCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.walletConfirmBtn}
                onPress={handleWalletConfirmPayment}
                activeOpacity={0.85}
              >
                <Text style={styles.walletConfirmBtnText}>Confirm Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          3RD SCREEN: ORDER SUCCESS MODAL WITH FLYING CONFETTI (Exact Image 3)
          ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModalCard}>
            {/* Top Close Button ✕ (Exact Figma Image 1 left) */}
            <TouchableOpacity
              style={styles.modalCloseCircle}
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={0.7}
              accessibilityLabel="Close"
            >
              <ModalCloseCrossSvg size={13} color="#1F2937" />
            </TouchableOpacity>

            <ScrollView
              style={{ maxHeight: SCREEN_HEIGHT * 0.82 }}
              showsVerticalScrollIndicator={false}
            >
              {/* TOHFA Logo & Association Header */}
              <View style={styles.successLogoHeader}>
                <Image
                  source={tohfaMarketLogo}
                  style={styles.successLogoImage}
                  resizeMode="contain"
                />
                <Text style={styles.associationSubtitle}>
                  Nilgiris Horticulture Organic Farmers Association
                </Text>
              </View>

              {/* Dotted Divider */}
              <View style={styles.dottedDivider} />

              {/* Order Meta details */}
              <View style={styles.orderMetaBlock}>
                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderMetaLabel}>Order ID</Text>
                  <Text style={styles.orderMetaValBold}>ORD-20260712-0028</Text>
                </View>
                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderMetaLabel}>Order Date</Text>
                  <Text style={styles.orderMetaValBold}>12 Jul 2026, 6:15 PM</Text>
                </View>
                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderMetaLabel}>Payment method</Text>
                  <Text style={styles.orderMetaValBold}>
                    {selectedMethod === 'wallets'
                      ? 'Paid via Wallet'
                      : selectedMethod === 'upi'
                      ? (selectedUpiApp || 'GPay')
                      : selectedMethod === 'card'
                      ? 'Credit/Debit Card'
                      : selectedMethod === 'cod'
                      ? 'Cash on Delivery'
                      : 'Net Banking'}
                  </Text>
                </View>
                <View style={styles.orderMetaRow}>
                  <Text style={styles.orderMetaLabel}>Pickup location</Text>
                  <Text style={styles.orderMetaValBold}>Ooty Market</Text>
                </View>
              </View>

              {/* Items List Breakdown */}
              <View style={styles.orderItemsBlock}>
                {/* Item 1 */}
                <View style={styles.orderItemRow}>
                  <View>
                    <Text style={styles.orderItemName}>Royal Gala</Text>
                    <Text style={styles.orderItemSub}>1 kg × Rs. 160 / kg</Text>
                  </View>
                  <Text style={styles.orderItemPrice}>Rs. 160.00</Text>
                </View>

                {/* Item 2 */}
                <View style={styles.orderItemRow}>
                  <View>
                    <Text style={styles.orderItemName}>Fuji</Text>
                    <Text style={styles.orderItemSub}>1 kg × Rs. 152 / kg</Text>
                  </View>
                  <Text style={styles.orderItemPrice}>Rs. 152.00</Text>
                </View>

                {/* Item 3 */}
                <View style={styles.orderItemRow}>
                  <View>
                    <Text style={styles.orderItemName}>Green Curly Lettuce</Text>
                    <Text style={styles.orderItemSub}>1 kg × Rs. 132 / kg</Text>
                  </View>
                  <Text style={styles.orderItemPrice}>Rs. 132.00</Text>
                </View>
              </View>

              {/* Dotted Divider */}
              <View style={styles.dottedDivider} />

              {/* 5-Step Order Progress Tracker */}
              <Text style={styles.orderProgressHeading}>Order progress</Text>
              <View style={styles.progressTracker}>
                {/* Step 1 */}
                <View style={styles.trackerStepRow}>
                  <View style={styles.trackerLeftCol}>
                    <Text style={styles.trackerNumber}>1</Text>
                    <View style={[styles.trackerLine, styles.trackerLineActive]} />
                  </View>
                  <View style={styles.trackerTextCol}>
                    <View style={styles.trackerTitleRow}>
                      <Text style={styles.trackerTitle}>Order progress</Text>
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedBadgeText}>Completed</Text>
                      </View>
                    </View>
                    <Text style={styles.trackerSubtitle}>Your payment was successful.</Text>
                  </View>
                </View>

                {/* Step 2 */}
                <View style={styles.trackerStepRow}>
                  <View style={styles.trackerLeftCol}>
                    <Text style={styles.trackerNumber}>2</Text>
                    <View style={[styles.trackerLine, styles.trackerLineActive]} />
                  </View>
                  <View style={styles.trackerTextCol}>
                    <View style={styles.trackerTitleRow}>
                      <Text style={styles.trackerTitle}>Order confirmed</Text>
                      <View style={styles.completedBadge}>
                        <Text style={styles.completedBadgeText}>Completed</Text>
                      </View>
                    </View>
                    <Text style={styles.trackerSubtitle}>Your order has been accepted.</Text>
                  </View>
                </View>

                {/* Step 3 */}
                <View style={styles.trackerStepRow}>
                  <View style={styles.trackerLeftCol}>
                    <Text style={styles.trackerNumber}>3</Text>
                    <View style={styles.trackerLine} />
                  </View>
                  <View style={styles.trackerTextCol}>
                    <View style={styles.trackerTitleRow}>
                      <Text style={styles.trackerTitle}>Preparing your order</Text>
                      <View style={styles.inProgressBadge}>
                        <Text style={styles.inProgressBadgeText}>In progress</Text>
                      </View>
                    </View>
                    <Text style={styles.trackerSubtitle}>Your items are being collected and packed.</Text>
                  </View>
                </View>

                {/* Step 4 */}
                <View style={styles.trackerStepRow}>
                  <View style={styles.trackerLeftCol}>
                    <Text style={styles.trackerNumber}>4</Text>
                    <View style={styles.trackerLine} />
                  </View>
                  <View style={styles.trackerTextCol}>
                    <Text style={styles.trackerTitle}>Ready for pickup</Text>
                    <Text style={styles.trackerSubtitle}>We'll notify you when your order is ready.</Text>
                  </View>
                </View>

                {/* Step 5 */}
                <View style={styles.trackerStepRow}>
                  <View style={styles.trackerLeftCol}>
                    <Text style={styles.trackerNumber}>5</Text>
                  </View>
                  <View style={styles.trackerTextCol}>
                    <Text style={styles.trackerTitle}>Order collected</Text>
                    <Text style={styles.trackerSubtitle}>Your order has been handed over.</Text>
                  </View>
                </View>
              </View>

              {/* Total Paid & Payment Method Pill */}
              <View style={styles.totalPaidRow}>
                <Text style={styles.totalPaidLabel}>Total paid</Text>
                <Text style={styles.totalPaidAmount}>Rs. {total.toFixed(0)}</Text>
              </View>

              <View style={styles.paidMethodBanner}>
                <WalletSvg />
                <Text style={styles.paidMethodText}>
                  {selectedMethod === 'wallets'
                    ? 'Paid via Wallet'
                    : selectedMethod === 'upi'
                    ? `Paid via ${selectedUpiApp || 'UPI'}`
                    : selectedMethod === 'card'
                    ? 'Paid via Credit/Debit Card'
                    : selectedMethod === 'cod'
                    ? 'Cash on Delivery or Shop'
                    : 'Paid via Net Banking'}
                </Text>
              </View>

              {/* Solid Green Button: Check Pickup code */}
              <TouchableOpacity
                style={styles.checkPickupBtn}
                onPress={() => {
                  setShowSuccessModal(false);
                  setShowPickupModal(true);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.checkPickupBtnText}>Check Pickup code</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Confetti Flying OVER the Popup from Left Center and Right Center */}
          <ConfettiOverlay />
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════════
          4TH SCREEN: PICKUP CODE & QR CODE MODAL (Exact Image 4)
          ═══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showPickupModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPickupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickupModalCard}>
            {/* Top Close Button ✕ (Exact Figma Image 1 left) */}
            <TouchableOpacity
              style={styles.modalCloseCircle}
              onPress={() => setShowPickupModal(false)}
              activeOpacity={0.7}
              accessibilityLabel="Close"
            >
              <ModalCloseCrossSvg size={13} color="#1F2937" />
            </TouchableOpacity>

            {/* TOHFA Logo & Association Header */}
            <View style={styles.successLogoHeader}>
              <Image
                source={tohfaMarketLogo}
                style={styles.successLogoImage}
                resizeMode="contain"
              />
              <Text style={styles.associationSubtitle}>
                Nilgiris Horticulture Organic Farmers Association
              </Text>
            </View>

            {/* Dotted Divider */}
            <View style={styles.dottedDivider} />

            {/* Exact Crisp QR Code from div(1).png (Image 3) */}
            <View style={styles.qrCodeContainer}>
              <Image
                source={divQrCode || pickupQrCode}
                style={{ width: 190, height: 190 }}
                resizeMode="contain"
              />
            </View>

            {/* OR READ OUT THIS CODE */}
            <Text style={styles.orReadOutText}>OR READ OUT THIS CODE</Text>
            <Text style={styles.pickupCodeNumber}>PICKUP-0039</Text>

            {/* Order Summary Pill */}
            <View style={styles.pickupSummaryPill}>
              <View>
                <Text style={styles.pickupOrderIdText}>ORD-20260715-0039</Text>
                <Text style={styles.pickupItemsLocationText}>{itemsCount} items · Ooty Market</Text>
              </View>
              <Text style={styles.pickupPriceText}>Rs. {total.toFixed(0)}</Text>
            </View>

            {/* Continue Shopping Button (Navigates to Home Page) */}
            <TouchableOpacity
              style={styles.continueShoppingBtn}
              onPress={() => {
                setShowPickupModal(false);
                onNavigate?.('Home');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.continueShoppingBtnText}>Continue shopping</Text>
            </TouchableOpacity>
          </View>

          {/* Confetti Flying OVER the Popup from Left Center and Right Center */}
          <ConfettiOverlay />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 16 : 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // ── 1. DELIVERY ADDRESS CARD ──────────────────────────────────────────────
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 14,
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addressCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  homeBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  homeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  addressCardBody: {
    paddingLeft: 4,
  },
  addressLine: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
  },
  addressPhone: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 4,
  },

  // ── 2. CART SUMMARY FLOATING DARK PILL ────────────────────────────────────
  darkCartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#374151',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  darkCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartThumbnailCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cartThumbnailImage: {
    width: 24,
    height: 24,
  },
  darkCartTexts: {},
  darkCartTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  darkCartViewLink: {
    fontSize: 11,
    color: '#D1D5DB',
  },
  darkCartTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── 3. PAYMENT METHOD CARD ────────────────────────────────────────────────
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 16,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF7EE',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  paymentCardTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 15,
    color: '#1F2937',
  },
  paymentList: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  methodRowSelected: {
    backgroundColor: '#E8F5E9',
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#2E7D32',
  },
  radioInnerDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#2E7D32',
  },

  // ── EXPANDED SUB-SECTIONS ─────────────────────────────────────────────────
  subSectionBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginTop: -4,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  subSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  autofillHint: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
  otherBankLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  upiAppsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upiAppBtn: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  upiAppBtnSelected: {
    backgroundColor: '#E8F5E9',
  },
  upiIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  otherUpiText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
  },
  paytmText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00BAF2',
  },
  upiAppLabel: {
    fontSize: 11,
    color: '#4B5563',
  },

  // Popular banks row (Image 4)
  popularBanksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  popularBankCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  popularBankCardSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: '#16A34A',
  },
  bankLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bankLogoText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  popularBankName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },

  // Other bank search & list (Image 1 & 5)
  otherBanksContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 2 : 6,
    marginBottom: 10,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    marginLeft: 8,
    paddingVertical: 2,
  },
  banksListContainer: {
    maxHeight: 220,
  },
  bankListItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  bankListItemRowSelected: {
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
  },
  bankInlineProceedBtn: {
    backgroundColor: '#2D7A47',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  bankInlineProceedBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  bankListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bankItemCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankItemCircleText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  bankItemName: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
  },
  radioCircleSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInnerDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2E7D32',
  },

  // Card details inputs (Image 2)
  cardInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
    marginBottom: 12,
  },
  cardNumberInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
    paddingVertical: 2,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSmallInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    fontSize: 13,
    color: '#1F2937',
    paddingVertical: 2,
  },

  // ── 4. RETURN / REFUND POLICY ─────────────────────────────────────────────
  policyContainer: {
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  policyTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 4,
  },
  policyText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 6,
  },
  readPolicyLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },

  // ── 5. STICKY BOTTOM CHECKOUT BAR ─────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'android' ? 16 : 24,
    paddingTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bottomPillContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bottomPriceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  proceedToPayBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  proceedToPayBtnActive: {
    backgroundColor: '#2E7D32',
  },
  proceedToPayBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  proceedToPayBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  proceedToPayBtnTextActive: {
    color: '#FFFFFF',
  },
  proceedToPayBtnTextDisabled: {
    color: '#9CA3AF',
  },
  floatingCartCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MODAL STYLES (Screen 2, 3 & 4)
  // ═══════════════════════════════════════════════════════════════════════════
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCloseCircle: {
    position: 'absolute',
    top: -14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 100,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },

  // ── 2ND SCREEN: PAY WITH WALLET STYLES ────────────────────────────────────
  walletModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  walletHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  walletIconHeader: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletModalTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 20,
    color: '#1F2937',
  },
  walletOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  walletOrderBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  walletOrderCartIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletOrderId: {
    fontSize: 11,
    color: '#4B5563',
  },
  walletOrderLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  walletOrderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  walletSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 16,
  },
  walletBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  walletBalanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletBalanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  walletBalanceVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  walletDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  walletAmountLabel: {
    fontSize: 13,
    color: '#4B5563',
  },
  walletAmountVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  walletBalanceAfterBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  walletBalanceAfterLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#166534',
  },
  walletBalanceAfterVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#166534',
  },
  walletOtpSection: {
    marginBottom: 18,
  },
  walletOtpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  walletOtpTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  walletOtpSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 10,
  },
  walletOtpInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'android' ? 4 : 8,
    backgroundColor: '#FFFFFF',
  },
  walletOtpInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 8,
    paddingVertical: 2,
  },
  walletActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  walletCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  walletCancelBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  walletConfirmBtn: {
    flex: 1.3,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletConfirmBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ── 3RD SCREEN: ORDER SUCCESS MODAL STYLES ────────────────────────────────
  successModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  successLogoHeader: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  successLogoImage: {
    width: 140,
    height: 38,
  },
  associationSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 10,
  },
  dottedDivider: {
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: '#D1D5DB',
    marginVertical: 12,
  },
  orderMetaBlock: {
    marginBottom: 10,
  },
  orderMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  orderMetaLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  orderMetaValBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  orderItemsBlock: {
    marginBottom: 4,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  orderItemSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  orderProgressHeading: {
    fontFamily: customerFonts.editorial,
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 10,
  },
  progressTracker: {
    paddingLeft: 4,
    marginBottom: 12,
  },
  trackerStepRow: {
    flexDirection: 'row',
    minHeight: 46,
  },
  trackerLeftCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  trackerNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  trackerLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  trackerLineActive: {
    backgroundColor: '#16A34A',
  },
  trackerTextCol: {
    flex: 1,
    paddingBottom: 8,
  },
  trackerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
  },
  trackerSubtitle: {
    fontSize: 10.5,
    color: '#6B7280',
    marginTop: 2,
  },
  completedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  completedBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#15803D',
  },
  inProgressBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  inProgressBadgeText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#B45309',
  },
  totalPaidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  totalPaidLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalPaidAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  paidMethodBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  paidMethodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  checkPickupBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkPickupBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ── 4TH SCREEN: PICKUP CODE & QR MODAL STYLES ─────────────────────────────
  pickupModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 12,
  },
  qrCodeContainer: {
    marginVertical: 14,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  orReadOutText: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  pickupCodeNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 1.5,
    marginVertical: 8,
  },
  pickupSummaryPill: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 12,
  },
  pickupOrderIdText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  pickupItemsLocationText: {
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
  },
  pickupPriceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  continueShoppingBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2E7D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  continueShoppingBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
