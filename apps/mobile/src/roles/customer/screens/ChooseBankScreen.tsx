import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, Rect, Polygon } from 'react-native-svg';
import {
  customerFonts,
} from '../theme';

// ─────────────────────────────────────────────────────────────────────────────
// EXACT AUTHENTIC BANK SVG LOGOS (Matching user uploaded references)
// ─────────────────────────────────────────────────────────────────────────────

export const SbiLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="14" fill="#0084CA" />
    <Circle cx="16" cy="13.5" r="4.2" fill="#FFFFFF" />
    <Rect x="14.4" y="13.5" width="3.2" height="11.5" fill="#FFFFFF" />
  </Svg>
);

export const HdfcLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    <Path d="M6 6h9v3.5H9.5V15H6V6z" fill="#ED1C24" />
    <Path d="M26 6v9h-3.5V9.5H17V6h9z" fill="#ED1C24" />
    <Path d="M6 26v-9h3.5v5.5H15V26H6z" fill="#ED1C24" />
    <Path d="M26 26h-9v-3.5h5.5V17H26v9z" fill="#ED1C24" />
    <Rect x="12" y="12" width="8" height="8" fill="#004C8F" />
  </Svg>
);

export const IciciLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="14" fill="#DE4926" />
    <Circle cx="16" cy="9.5" r="2.2" fill="#FFFFFF" />
    <Path
      d="M14 14.5c2-1 4.5 0 4.5 2.8 0 3-2.5 5.5-4.5 6.5 3 0 6-3 6-6.5 0-3-2-4-4-4h-2z"
      fill="#FFFFFF"
    />
  </Svg>
);

export const YesBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    <Path
      d="M7 17.5l5.5 5.5L25 9.5"
      stroke="#D8232A"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const AxisLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    <Path d="M16 6L6 24h6l4-8 4 8h6L16 6z" fill="#97144D" />
  </Svg>
);

export const AuBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="14" fill="#F36F21" />
    <Path
      d="M9 21l3.5-10h2L18 21h-2l-.8-2.5h-3.4L11 21H9zm3.2-4.2h2.4L13.4 13l-1.2 3.8zM19 11h2v6.5c0 1.8 1 2.5 2 2.5s2-.7 2-2.5V11h2v6.5c0 3-1.8 4.5-4 4.5s-4-1.5-4-4.5V11z"
      fill="#FFFFFF"
    />
  </Svg>
);

export const AirtelBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="14" fill="#E51937" />
    <Path
      d="M19 11c-3.5 0-6 2.5-6 6 0 3 2.2 5 5 5 1.8 0 3.2-1 3.8-2.2v1.7H24V11h-2v1.8c-.8-1.1-2-1.8-3-1.8zm-.5 9c-2 0-3.5-1.5-3.5-4s1.5-4 3.5-4 3.5 1.5 3.5 4-1.5 4-3.5 4z"
      fill="#FFFFFF"
    />
  </Svg>
);

export const AllahabadBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    <Path d="M16 6L7 24h18L16 6zm0 5l5 10H11l5-10z" fill="#0080CC" />
    <Path d="M14 17h4l-2-4-2 4z" fill="#0080CC" />
  </Svg>
);

export const AndhraBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    <Path
      d="M12 11c-2.8 0-5 2.2-5 5s2.2 5 5 5c2 0 3.8-1.2 4.6-3L13 16c-.5 1-1.3 1.5-2 1.5-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5c.8 0 1.5.5 2 1.5l3.6-2c-.8-1.8-2.6-3-4.6-3z"
      fill="#004B87"
    />
    <Path
      d="M20 11c-2 0-3.8 1.2-4.6 3L19 16c.5-1 1.3-1.5 2-1.5 1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5c-.8 0-1.5-.5-2-1.5l-3.6 2c.8 1.8 2.6 3 4.6 3 2.8 0 5-2.2 5-5s-2.2-5-5-5z"
      fill="#DA291C"
    />
  </Svg>
);

export const BandhanBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    <Path
      d="M16 8c-4.4 0-8 3.6-8 8 0 3.2 1.9 6 4.6 7.3L16 16l3.4 7.3c2.7-1.3 4.6-4.1 4.6-7.3 0-4.4-3.6-8-8-8z"
      fill="#E31E24"
    />
    <Circle cx="16" cy="16" r="3" fill="#FFC72C" />
  </Svg>
);

export const BbkLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFF7ED" stroke="#FED7AA" strokeWidth="1" />
    <Path
      d="M16 6l2.5 6.5L25 10l-3.5 6 6 2.5-6.5 2.5L24 25l-6-3.5L16 28l-2.5-6.5L7 24l3.5-6-6-2.5 6.5-2.5L8 7l6 3.5L16 6z"
      fill="#F58220"
    />
    <Circle cx="16" cy="16" r="3" fill="#FFFFFF" />
  </Svg>
);

export const BobLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFF5ED" stroke="#FFEDD5" strokeWidth="1" />
    <Path
      d="M10 8h7c2.8 0 4.8 1.4 4.8 3.5 0 1.5-1 2.8-2.5 3.2 2 .5 3.2 1.8 3.2 3.8 0 2.5-2.2 4.5-5.5 4.5H10V8zm3.2 2.6v3.8h3.8c1.3 0 2.2-.8 2.2-1.9s-.9-1.9-2.2-1.9h-3.8zm0 6.2v4.4h4.2c1.4 0 2.4-.9 2.4-2.2 0-1.3-1-2.2-2.4-2.2h-4.2z"
      fill="#F26522"
    />
  </Svg>
);

export const BoiLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFF5F5" stroke="#FEE2E2" strokeWidth="1" />
    <Path
      d="M16 6l2.5 6.5 7 .5-5.5 4.5 2 6.5-6-4-6 4 2-6.5L6.5 13l7-.5L16 6z"
      fill="#ED1C24"
    />
    <Path
      d="M16 9l1.8 4.5 5 .5-4 3.2 1.5 4.8-4.3-2.8-4.3 2.8 1.5-4.8-4-3.2 5-.5L16 9z"
      fill="#F58220"
    />
  </Svg>
);

export const BomLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1" />
    <Circle cx="16" cy="16" r="11" stroke="#005A9C" strokeWidth="2" fill="none" />
    <Path d="M16 8l4 4h-3v7h-2v-7h-3l4-4z" fill="#005A9C" />
  </Svg>
);

export const CanaraBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    <Path d="M9 22L16 8l7 14H9z" stroke="#0091DA" strokeWidth="2.5" fill="none" />
    <Path d="M9 14l7 14 7-14H9z" stroke="#F9A825" strokeWidth="2.5" fill="none" />
  </Svg>
);

export const CanaraSynLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Rect x="6" y="6" width="20" height="20" rx="4" fill="#F37024" />
    <Path d="M16 10L10 14v1h12v-1l-6-4zm-4 6v5h1.5v-5H12zm3.2 0v5h1.5v-5h-1.5zm3.3 0v5H20v-5h-1.5zm-7.5 6v1.5h12V22H11z" fill="#FFFFFF" />
  </Svg>
);

export const CsbLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#EFF6FF" stroke="#DBEAFE" strokeWidth="1" />
    <Path
      d="M12 11c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm8 0c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5z"
      stroke="#005696"
      strokeWidth="2.5"
      fill="none"
    />
  </Svg>
);

export const CbiLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFF5F5" stroke="#FEE2E2" strokeWidth="1" />
    <Path d="M16 6v10l7-7-7-3zm0 20V16l-7 7 7 3zm10-10H16l7 7 3-7zm-20 0h10l-7-7-3 7z" fill="#D32F2F" />
  </Svg>
);

export const CityUnionLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FAF5FF" stroke="#E9D5FF" strokeWidth="1" />
    <Path d="M16 8l6 3.5v7l-6 3.5-6-3.5v-7L16 8zm-3 8.5c0 1.7 1.3 3 3 3s3-1.3 3-3-1.3-3-3-3-3 1.3-3 3z" fill="#5C2D91" />
  </Svg>
);

export const CosmosBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
    <Circle cx="16" cy="16" r="10" stroke="#1D4ED8" strokeWidth="2" fill="none" />
    <Path d="M16 8v16M8 16h16M10.5 10.5l11 11M10.5 21.5l11-11" stroke="#1D4ED8" strokeWidth="1.5" />
    <Circle cx="16" cy="16" r="3" fill="#1D4ED8" />
  </Svg>
);

export const DcbBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    <Path d="M8 10h6c3.5 0 6 2.5 6 6s-2.5 6-6 6H8V10z" fill="#1E40AF" />
    <Path d="M11 13h3c1.8 0 3 1.2 3 3s-1.2 3-3 3h-3v-6z" fill="#FFFFFF" />
    <Path d="M20 10h4v12h-4z" fill="#DC2626" />
  </Svg>
);

export const DeutscheBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Rect x="5" y="5" width="22" height="22" rx="4" fill="#0018A8" />
    <Rect x="7" y="7" width="18" height="18" rx="2" fill="#FFFFFF" />
    <Path d="M21 9l-9 14h-3l9-14h3z" fill="#0018A8" />
  </Svg>
);

export const DhanlaxmiBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FAF5FF" stroke="#E9D5FF" strokeWidth="1" />
    <Circle cx="16" cy="16" r="8" fill="#7C3AED" />
    <Path d="M16 6v20M6 16h20M9 9l14 14M9 23L23 9" stroke="#A855F7" strokeWidth="2" />
    <Circle cx="16" cy="16" r="3" fill="#FFFFFF" />
  </Svg>
);

export const EquitasBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
    <Path
      d="M10 16c0-3.3 2.7-6 6-6 2.2 0 4.1 1.2 5.1 3l-2.6 1.5C17.9 13.6 17 13 16 13c-1.7 0-3 1.3-3 3s1.3 3 3 3c1 0 1.9-.6 2.5-1.5l2.6 1.5c-1 1.8-2.9 3-5.1 3-3.3 0-6-2.7-6-6z"
      fill="#059669"
    />
    <Circle cx="20" cy="11" r="2" fill="#0284C7" />
  </Svg>
);

export const FederalBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#EFF6FF" stroke="#DBEAFE" strokeWidth="1" />
    <Path d="M10 8h12v4H15v3h6v4h-6v5h-5V8z" fill="#0D47A1" />
  </Svg>
);

export const HsbcLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    <Polygon points="16,10 22,16 16,22 10,16" fill="#DB0011" />
    <Polygon points="10,10 10,22 16,16" fill="#DB0011" />
    <Polygon points="22,10 22,22 16,16" fill="#DB0011" />
  </Svg>
);

export const IdbiLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="14" fill="#007A3D" />
    <Path d="M16 8l5 6-5 6-5-6 5-6z" fill="#FFFFFF" />
    <Circle cx="16" cy="14" r="2.5" fill="#F58220" />
  </Svg>
);

export const IdfcLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Rect x="5" y="5" width="22" height="22" rx="4" fill="#880E4F" />
    <Path d="M9 10h3v12H9V10zm5 0h4c2.5 0 4 1.5 4 4v4c0 2.5-1.5 4-4 4h-4V10zm3 3v6h1c1 0 1.5-.5 1.5-1.5v-3c0-1-.5-1.5-1.5-1.5h-1z" fill="#FFFFFF" />
  </Svg>
);

export const IndianBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="14" fill="#0A387E" />
    <Circle cx="16" cy="16" r="6" stroke="#E65100" strokeWidth="2.5" fill="none" />
    <Path d="M16 7v4M16 21v4M7 16h4M21 16h4" stroke="#E65100" strokeWidth="2.5" />
  </Svg>
);

export const IobLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
    <Circle cx="12" cy="16" r="5" stroke="#1E88E5" strokeWidth="2" fill="none" />
    <Circle cx="20" cy="16" r="5" stroke="#1E88E5" strokeWidth="2" fill="none" />
    <Circle cx="16" cy="16" r="2" fill="#1E88E5" />
  </Svg>
);

// ── EXACT LOGOS FROM USER ATTACHMENTS (Images 6 & 10) ─────────────────────────

// IndusInd: Teal circular ring with maroon zebu bull
export const IndusIndLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#00838F" strokeWidth="1.5" />
    <Circle cx="16" cy="16" r="12" stroke="#4DD0E1" strokeWidth="1" fill="#E0F7FA" />
    {/* Stylized Indus Zebu Bull */}
    <Path
      d="M10 18c1.5-4 4.5-5 7-4 1.5-.8 3-2 3.5-3.5.5 2-1 3.5-.5 4.5 1.5 0 3 1.5 3 3.5 0 2-2 3.5-4.5 3.5H12c-1.5 0-2.5-1-2-4z"
      fill="#8B0000"
    />
    <Path d="M13 18v5h2v-4h3v4h2v-5" stroke="#8B0000" strokeWidth="1.5" />
  </Svg>
);

// Jammu & Kashmir Bank: 3 teardrop petals (red, blue, green) forming triskelion
export const JkBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    {/* Red petal */}
    <Path d="M16 8c-3 0-5 2.5-5 5.5 0 3.5 5 8.5 5 8.5s5-5 5-8.5C21 10.5 19 8 16 8z" fill="#E53935" transform="rotate(0 16 16)" />
    {/* Blue petal */}
    <Path d="M16 8c-3 0-5 2.5-5 5.5 0 3.5 5 8.5 5 8.5s5-5 5-8.5C21 10.5 19 8 16 8z" fill="#1E88E5" transform="rotate(120 16 16)" />
    {/* Green petal */}
    <Path d="M16 8c-3 0-5 2.5-5 5.5 0 3.5 5 8.5 5 8.5s5-5 5-8.5C21 10.5 19 8 16 8z" fill="#43A047" transform="rotate(240 16 16)" />
    <Circle cx="16" cy="16" r="3" fill="#FFFFFF" />
  </Svg>
);

// Jana Small Finance Bank: pink/orange stylized 'j'
export const JanaBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#FCE7F3" strokeWidth="1" />
    <Circle cx="17.5" cy="10" r="1.8" fill="#FF5722" />
    <Path
      d="M19 13.5v7c0 3-2 4.5-5 4.5-2 0-3.5-.8-4-2l2.2-1.2c.4.8 1.1 1.2 2 1.2 1.5 0 2.4-.8 2.4-2.5v-7h2.4z"
      fill="#E91E63"
    />
  </Svg>
);

// Janata Sahakari Bank: round circular shield/emblem
export const JanataBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFF5F5" stroke="#FECACA" strokeWidth="1" />
    <Circle cx="16" cy="16" r="11" stroke="#991B1B" strokeWidth="1.5" fill="none" />
    <Path d="M16 9l4 3v4c0 3-2 5-4 6-2-1-4-3-4-6v-4l4-3z" fill="#991B1B" />
    <Circle cx="16" cy="15" r="2" fill="#FFFFFF" />
  </Svg>
);

// Karnataka Bank: purple star / hexagram with rosette
export const KarnatakaBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FAF5FF" stroke="#E9D5FF" strokeWidth="1" />
    {/* Hexagram Star */}
    <Polygon points="16,6 23,20 9,20" stroke="#7E22CE" strokeWidth="1.8" fill="none" />
    <Polygon points="16,24 23,10 9,10" stroke="#7E22CE" strokeWidth="1.8" fill="none" />
    <Circle cx="16" cy="15" r="2.5" fill="#7E22CE" />
  </Svg>
);

// Karur Vysya: circular green border with bold KVB inside
export const KarurVysyaLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="1" />
    <Circle cx="16" cy="16" r="12" stroke="#15803D" strokeWidth="2" fill="none" />
    <Path
      d="M10 13h1.8v2.5l2-2.5h2.2l-2.4 2.8L16 19h-2.2l-2-2.8V19H10V13zm7 0h1.8l1.4 4.2L21.6 13h1.8l-2.4 6h-1.6L17 13z"
      fill="#15803D"
    />
  </Svg>
);

// Kotak Bank: exact red and blue interlocking ribbon / infinity loop
export const KotakBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    {/* Blue loop */}
    <Path
      d="M11 16c0-2.8 2.2-5 5-5 1.5 0 2.8.7 3.7 1.8l-2 2C17.3 14.3 16.7 14 16 14c-1.1 0-2 .9-2 2s.9 2 2 2c.7 0 1.3-.3 1.7-.8l2 2c-.9 1.1-2.2 1.8-3.7 1.8-2.8 0-5-2.2-5-5z"
      fill="#005696"
    />
    {/* Red loop */}
    <Path
      d="M21 16c0 2.8-2.2 5-5 5-1.5 0-2.8-.7-3.7-1.8l2-2c.4.5 1 .8 1.7.8 1.1 0 2-.9 2-2s-.9-2-2-2c-.7 0-1.3.3-1.7.8l-2-2c.9-1.1 2.2-1.8 3.7-1.8 2.8 0 5 2.2 5 5z"
      fill="#ED1B24"
    />
  </Svg>
);

// Lakshmi Vilas Bank: yellow circle with white/gold standing traditional deepam lamp
export const LvbLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="14" fill="#F59E0B" />
    {/* Standing Deepam Lamp */}
    <Path d="M16 7c.8 1 1 2 0 3-.8-1-.5-2 0-3z" fill="#FFFFFF" />
    <Rect x="14" y="10" width="4" height="2" rx="1" fill="#FFFFFF" />
    <Path d="M11 12h10c0 2-2 3.5-5 3.5s-5-1.5-5-3.5z" fill="#FFFFFF" />
    <Rect x="15" y="15.5" width="2" height="7" fill="#FFFFFF" />
    <Path d="M12 22.5h8c0 1.5-1.8 2.5-4 2.5s-4-1-4-2.5z" fill="#FFFFFF" />
  </Svg>
);

// North Kanara GSB: pink/maroon deity idol silhouette
export const NorthKanaraLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FDF2F8" stroke="#FBCFE8" strokeWidth="1" />
    {/* Deity idol / temple silhouette */}
    <Path d="M16 7l2 3h-4l2-3z" fill="#BE185D" />
    <Circle cx="16" cy="12" r="2" fill="#BE185D" />
    <Path d="M13 14h6l2 4h-10l2-4z" fill="#0284C7" />
    <Path d="M12 18h8v5h-8v-5z" fill="#BE185D" />
    <Rect x="10" y="23" width="12" height="2" fill="#F59E0B" />
  </Svg>
);

// Oriental Bank of Commerce: green cursive 'b' loop
export const ObcLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="1" />
    <Path
      d="M13 8h3v7.5c1.2-1 2.8-1.5 4.5-1.5 3.5 0 5.5 2.5 5.5 6s-2 6-5.5 6c-2 0-3.5-.8-4.5-2V24H13V8zm3 12c0 2 1.3 3.5 3 3.5s3-1.5 3-3.5-1.3-3.5-3-3.5-3 1.5-3 3.5z"
      fill="#16A34A"
    />
  </Svg>
);

// Post Office Savings Bank: red circle with mail horn/wings
export const PostOfficeLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="14" fill="#DC2626" />
    <Path
      d="M9 13h14v2l-7 4-7-4v-2zm0 3.5l7 4 7-4V21H9v-4.5z"
      fill="#FACC15"
    />
  </Svg>
);

// Punjab National Bank: modern gold/maroon logo
export const PnbModernLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="14" fill="#F59E0B" />
    <Circle cx="16" cy="16" r="10.5" stroke="#831843" strokeWidth="2.5" fill="none" />
    <Path d="M13 11h4c2 0 3 1 3 2.5s-1 2.5-3 2.5h-2v4h-2V11zm2 2v2h2c.8 0 1.2-.4 1.2-1s-.4-1-1.2-1h-2z" fill="#831843" />
  </Svg>
);

// Punjab & Sind Bank: golden Ik Onkar symbol
export const PsbLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1" />
    <Path
      d="M13 11c0-2 1.8-3.5 4-3.5 2.5 0 4.5 1.8 4.5 4 0 2-1.5 3.5-3.5 4 2.5.5 4 2.2 4 4.5 0 2.8-2.2 5-5 5-2.8 0-4.5-1.8-4.5-4h2.5c0 1.2.8 2 2 2s2-.8 2-2-.8-2-2-2h-1.5v-2H17c1 0 1.8-.8 1.8-1.8s-.8-1.8-1.8-1.8c-1 0-1.8.8-1.8 1.8H13z"
      fill="#D97706"
    />
  </Svg>
);

// RBL Bank: blue & red chevron
export const RblLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    <Path d="M10 9h6c3 0 5 1.5 5 4s-2 4-5 4h-3v5h-3V9zm3 2.5v3h3c1.2 0 2-.6 2-1.5s-.8-1.5-2-1.5h-3z" fill="#1D4ED8" />
    <Path d="M18 17l4 5h-3.5l-3.5-5h3z" fill="#DC2626" />
  </Svg>
);

// Ratnakar Bank
export const RatnakarLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    <Path d="M8 10h6c3 0 5 1.8 5 4.5s-2 4.5-5 4.5h-3v4H8V10zm3 3v4h3c1.5 0 2.2-.8 2.2-2s-.7-2-2.2-2h-3z" fill="#1E40AF" />
    <Circle cx="22" cy="16" r="3.5" fill="#EF4444" />
  </Svg>
);

// Saraswat Bank: orange & red stacked chevrons
export const SaraswatLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFF7ED" stroke="#FFEDD5" strokeWidth="1" />
    <Path d="M10 11l6 5-6 5h4l6-5-6-5h-4z" fill="#EA580C" />
    <Path d="M16 11l6 5-6 5h4l6-5-6-5h-4z" fill="#DC2626" />
  </Svg>
);

// Shamrao Vithal Coop Bank (SVC): cyan & deep blue ascending wings
export const SvcbLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#F0F9FF" stroke="#BAE6FD" strokeWidth="1" />
    <Path d="M8 20l7-10 2 3-5 7H8z" fill="#0284C7" />
    <Path d="M15 20l6-10 3 3-5 7h-4z" fill="#0369A1" />
  </Svg>
);

// South Indian Bank: red spiral helix
export const SouthIndianBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFF1F2" stroke="#FECDD3" strokeWidth="1" />
    <Path
      d="M16 8c4.4 0 8 3.6 8 8 0 3-1.6 5.6-4 7l-1.5-2.5c1.5-.9 2.5-2.6 2.5-4.5 0-2.8-2.2-5-5-5s-5 2.2-5 5c0 1.2.4 2.3 1.2 3.1L10.5 21C9.2 19.6 8.5 17.9 8.5 16c0-4.4 3.6-8 8-8z"
      fill="#DC2626"
    />
    <Circle cx="16" cy="16" r="2.5" fill="#DC2626" />
  </Svg>
);

// Standard Chartered Bank: blue & green intertwined double helix
export const StandardCharteredLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    {/* Blue helix curve */}
    <Path
      d="M10 19c-1.5-2-1.5-5 0-7 2-2.5 5.5-2.5 8 0l4 4.5c1.5 1.5 3.5 1.5 5 0"
      stroke="#0284C7"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Green helix curve */}
    <Path
      d="M10 13c1.5 2 1.5 5 0 7 2 2.5 5.5 2.5 8 0l4-4.5c1.5-1.5 3.5-1.5 5 0"
      stroke="#22C55E"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

// Suryoday Small Finance Bank: bright orange sun with radiant rays
export const SuryodayLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="14" fill="#F97316" />
    <Circle cx="16" cy="16" r="6" fill="#FDE047" />
    <Path d="M16 6v3M16 23v3M6 16h3M23 16h3M9 9l2 2M21 21l2 2M9 23l2-2M21 11l2-2" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// Tamilnad Mercantile Bank: pink & blue rectangular TMB badge
export const TmbLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    <Rect x="6" y="11" width="20" height="10" rx="2" fill="#EC4899" />
    <Path d="M8 13h4v1.5h-1.3v4H9.4v-4H8V13zm5 0h1.8l1.2 3.5 1.2-3.5H19v5.5h-1.2v-3.8l-1 3.2h-1l-1-3.2v3.8H13V13zm7 0h2.4c1 0 1.6.5 1.6 1.3 0 .6-.4 1-1 1.1.7.2 1.1.6 1.1 1.3 0 .9-.8 1.4-1.8 1.4H20V13z" fill="#FFFFFF" />
  </Svg>
);

// UCO Bank: blue safe vault with white keyhole
export const UcoLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="14" fill="#0284C7" />
    <Rect x="10" y="10" width="12" height="12" rx="3" stroke="#FFFFFF" strokeWidth="2" fill="none" />
    <Circle cx="16" cy="15" r="2" fill="#FFFFFF" />
    <Path d="M16 17v2.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// Ujjivan Small Finance Bank: blue & green emblem
export const UjjivanLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    <Path d="M10 10h3v8c0 2 1 3 3 3s3-1 3-3v-8h3v8c0 3.8-2.6 6-6 6s-6-2.2-6-6v-8z" fill="#0284C7" />
    <Circle cx="22" cy="11" r="2.5" fill="#10B981" />
  </Svg>
);

// Union Bank of India: interlocking red U and blue U
export const UnionBankExactLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    {/* Red U */}
    <Path
      d="M9 10h3v6c0 1.8 1.2 2.8 2.5 2.8s2.5-1 2.5-2.8v-6h3v6c0 3.5-2.2 5.5-5.5 5.5S9 19.5 9 16v-6z"
      fill="#DC2626"
    />
    {/* Blue Interlocking U */}
    <Path
      d="M15 12h3v6c0 1.8 1.2 2.8 2.5 2.8s2.5-1 2.5-2.8v-6h3v6c0 3.5-2.2 5.5-5.5 5.5S15 21.5 15 18v-6z"
      fill="#1D4ED8"
    />
  </Svg>
);

// United Bank of India
export const UnitedBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
    <Circle cx="16" cy="16" r="11" stroke="#B91C1C" strokeWidth="2" fill="none" />
    <Path d="M12 11h2.5v6c0 1 .6 1.8 1.5 1.8s1.5-.8 1.5-1.8v-6H20v6c0 2.5-1.7 4-4 4s-4-1.5-4-4v-6z" fill="#1E3A8A" />
  </Svg>
);

// Vijaya Bank: red circle with golden lamp
export const VijayaBankLogo = ({ size = 32 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="14" fill="#B91C1C" />
    <Path d="M16 8c1 1.2 1.2 2.2 0 3.5-1.2-1.3-.8-2.3 0-3.5z" fill="#F59E0B" />
    <Path d="M11 15h10c0 2.5-2 4-5 4s-5-1.5-5-4z" fill="#FFFFFF" />
    <Rect x="15" y="19" width="2" height="4" fill="#FFFFFF" />
    <Rect x="12" y="23" width="8" height="2" rx="1" fill="#FFFFFF" />
  </Svg>
);

export const BankBuildingLogo = ({ size = 32, color = '#64748B' }: { size?: number | undefined; color?: string | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <Circle cx="16" cy="16" r="15" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
    <Path d="M16 7L7 12v2h18v-2L16 7zm-7 8v8h2v-8H9zm5 0v8h2v-8h-2zm5 0v8h2v-8h-2zm-11 9v2h18v-2H7z" fill={color} />
  </Svg>
);

export const SearchIcon = ({ size = 18 }: { size?: number | undefined }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke="#9CA3AF" strokeWidth="2" />
    <Path d="M20 20l-4-4" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE BANK REGISTRY (Matching user uploaded images 6 & 10)
// ─────────────────────────────────────────────────────────────────────────────

export interface FullBankItem {
  id: string;
  name: string;
  renderLogo: (size?: number | undefined) => React.ReactNode;
}

export const ALL_FULL_BANKS: FullBankItem[] = [
  { id: 'sbi', name: 'State Bank of India', renderLogo: s => <SbiLogo size={s} /> },
  { id: 'hdfc', name: 'HDFC Bank', renderLogo: s => <HdfcLogo size={s} /> },
  { id: 'icici', name: 'ICICI Netbanking', renderLogo: s => <IciciLogo size={s} /> },
  { id: 'axis', name: 'Axis Bank', renderLogo: s => <AxisLogo size={s} /> },
  { id: 'au', name: 'AU Small Finance Bank', renderLogo: s => <AuBankLogo size={s} /> },
  { id: 'airtel', name: 'Airtel Payments Bank', renderLogo: s => <AirtelBankLogo size={s} /> },
  { id: 'allahabad', name: 'Allahabad Bank', renderLogo: s => <AllahabadBankLogo size={s} /> },
  { id: 'andhra', name: 'Andhra Bank', renderLogo: s => <AndhraBankLogo size={s} /> },
  { id: 'bandhan', name: 'Bandhan Bank', renderLogo: s => <BandhanBankLogo size={s} /> },
  { id: 'bbk', name: 'Bank of Bahrain and Kuwait', renderLogo: s => <BbkLogo size={s} /> },
  { id: 'bob', name: 'Bank of Baroda', renderLogo: s => <BobLogo size={s} /> },
  { id: 'bob_corp', name: 'Bank of Baroda Corporate', renderLogo: s => <BobLogo size={s} /> },
  { id: 'boi', name: 'Bank of India', renderLogo: s => <BoiLogo size={s} /> },
  { id: 'bom', name: 'Bank of Maharashtra', renderLogo: s => <BomLogo size={s} /> },
  { id: 'canara', name: 'Canara Bank', renderLogo: s => <CanaraBankLogo size={s} /> },
  { id: 'canara_syn', name: 'Canara Bank (e-Syndicate)', renderLogo: s => <CanaraSynLogo size={s} /> },
  { id: 'csb', name: 'Catholic Syrian Bank', renderLogo: s => <CsbLogo size={s} /> },
  { id: 'cbi', name: 'Central Bank Of India', renderLogo: s => <CbiLogo size={s} /> },
  { id: 'cub', name: 'CityUnion', renderLogo: s => <CityUnionLogo size={s} /> },
  { id: 'cosmos', name: 'Cosmos Bank', renderLogo: s => <CosmosBankLogo size={s} /> },
  { id: 'dcb', name: 'DCB Bank', renderLogo: s => <DcbBankLogo size={s} /> },
  { id: 'db', name: 'Deutsche Bank', renderLogo: s => <DeutscheBankLogo size={s} /> },
  { id: 'dhanlaxmi', name: 'Dhanlaxmi Bank', renderLogo: s => <DhanlaxmiBankLogo size={s} /> },
  { id: 'equitas', name: 'Equitas Small Finance Bank', renderLogo: s => <EquitasBankLogo size={s} /> },
  { id: 'federal', name: 'Federal Bank', renderLogo: s => <FederalBankLogo size={s} /> },
  { id: 'hsbc', name: 'HSBC BANK', renderLogo: s => <HsbcLogo size={s} /> },
  { id: 'idbi', name: 'IDBI Bank', renderLogo: s => <IdbiLogo size={s} /> },
  { id: 'idfc', name: 'IDFC Bank', renderLogo: s => <IdfcLogo size={s} /> },
  { id: 'indian', name: 'Indian Bank', renderLogo: s => <IndianBankLogo size={s} /> },
  { id: 'iob', name: 'Indian Overseas Bank', renderLogo: s => <IobLogo size={s} /> },
  { id: 'indusind', name: 'IndusInd Bank', renderLogo: s => <IndusIndLogo size={s} /> },
  { id: 'jk', name: 'Jammu and Kashmir Bank', renderLogo: s => <JkBankLogo size={s} /> },
  { id: 'jana', name: 'Jana Small Finance Bank', renderLogo: s => <JanaBankLogo size={s} /> },
  { id: 'janata', name: 'Janata Sahakari Bank', renderLogo: s => <JanataBankLogo size={s} /> },
  { id: 'karnataka', name: 'Karnataka Bank', renderLogo: s => <KarnatakaBankLogo size={s} /> },
  { id: 'karur', name: 'Karur Vysya', renderLogo: s => <KarurVysyaLogo size={s} /> },
  { id: 'karur_corp', name: 'Karur Vysya Corporate Banking', renderLogo: s => <KarurVysyaLogo size={s} /> },
  { id: 'kotak', name: 'Kotak Bank', renderLogo: s => <KotakBankLogo size={s} /> },
  { id: 'lvb', name: 'Lakshmi Vilas Bank Retail', renderLogo: s => <LvbLogo size={s} /> },
  { id: 'northkanara', name: 'North Kanara GSB', renderLogo: s => <NorthKanaraLogo size={s} /> },
  { id: 'obc', name: 'Oriental Bank Of Commerce', renderLogo: s => <ObcLogo size={s} /> },
  { id: 'post', name: 'Post Office savings Bank', renderLogo: s => <PostOfficeLogo size={s} /> },
  { id: 'pnb_corp', name: 'Punjab National Bank Corporate', renderLogo: s => <PnbModernLogo size={s} /> },
  { id: 'pnb_retail', name: 'Punjab National Bank Retail', renderLogo: s => <PnbModernLogo size={s} /> },
  { id: 'psb', name: 'Punjab and Sind Bank', renderLogo: s => <PsbLogo size={s} /> },
  { id: 'rbl', name: 'RBL', renderLogo: s => <RblLogo size={s} /> },
  { id: 'ratnakar', name: 'Ratnakar Bank', renderLogo: s => <RatnakarLogo size={s} /> },
  { id: 'saraswat', name: 'Saraswat Bank', renderLogo: s => <SaraswatLogo size={s} /> },
  { id: 'svcb', name: 'Shamrao Vithal Coop Bank', renderLogo: s => <SvcbLogo size={s} /> },
  { id: 'sib', name: 'South Indian Bank', renderLogo: s => <SouthIndianBankLogo size={s} /> },
  { id: 'scb', name: 'Standard Chartered Bank', renderLogo: s => <StandardCharteredLogo size={s} /> },
  { id: 'suryoday', name: 'Suryoday Small Finance Bank', renderLogo: s => <SuryodayLogo size={s} /> },
  { id: 'tmb', name: 'Tamilnad Mercantile Bank', renderLogo: s => <TmbLogo size={s} /> },
  { id: 'uco', name: 'UCO Bank', renderLogo: s => <UcoLogo size={s} /> },
  { id: 'ujjivan', name: 'Ujjivan Small Finance Bank', renderLogo: s => <UjjivanLogo size={s} /> },
  { id: 'union', name: 'Union Bank of India', renderLogo: s => <UnionBankExactLogo size={s} /> },
  { id: 'united', name: 'United Bank Of India', renderLogo: s => <UnitedBankLogo size={s} /> },
  { id: 'vijaya', name: 'Vijaya Bank', renderLogo: s => <VijayaBankLogo size={s} /> },
];

// ─────────────────────────────────────────────────────────────────────────────
// CHOOSE BANK SCREEN (Dedicated full screen matching user image 6 & 10)
// ─────────────────────────────────────────────────────────────────────────────

export interface ChooseBankScreenProps {
  selectedBank: string | null;
  onSelectBank: (bankName: string) => void;
  onProceed: (bankName: string) => void;
  onBack: () => void;
}

export function ChooseBankScreen({
  selectedBank,
  onSelectBank,
  onProceed,
  onBack,
}: ChooseBankScreenProps) {
  const [search, setSearch] = useState('');

  const filteredBanks = useMemo(() => {
    if (!search.trim()) return ALL_FULL_BANKS;
    const q = search.toLowerCase();
    return ALL_FULL_BANKS.filter(b => b.name.toLowerCase().includes(q));
  }, [search]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── TOP HEADER BAR: Back Arrow + Choose Bank ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircleBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrowText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Bank</Text>
      </View>

      {/* ── SEARCH BAR WITH MAGNIFYING GLASS (Exact Image 6) ── */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search..."
            placeholderTextColor="#9CA3AF"
          />
          <SearchIcon size={18} />
        </View>
      </View>

      {/* ── FULL SCROLLABLE LIST OF BANKS ── */}
      <ScrollView
        style={styles.bankListScroll}
        contentContainerStyle={styles.bankListContent}
        showsVerticalScrollIndicator={true}
      >
        {filteredBanks.map((item) => {
          const isSelected = selectedBank === item.name;
          return (
            <View key={item.id} style={styles.bankItemWrapper}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onSelectBank(item.name)}
                style={[styles.bankRow, isSelected && styles.bankRowSelected]}
              >
                {/* Bank SVG Logo */}
                <View style={styles.logoWrap}>{item.renderLogo(28)}</View>

                {/* Bank Name */}
                <Text style={styles.bankNameText}>{item.name}</Text>

                {/* Radio Circle */}
                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>

              {/* Exact Green Proceed to Pay Button directly below selected bank (Image 6) */}
              {isSelected && (
                <View style={styles.proceedButtonWrapper}>
                  <TouchableOpacity
                    style={styles.proceedButton}
                    activeOpacity={0.85}
                    onPress={() => onProceed(item.name)}
                  >
                    <Text style={styles.proceedButtonText}>Proceed to Pay</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Divider Line */}
              <View style={styles.bankDivider} />
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 16 : 14,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  backArrowText: {
    fontSize: 20,
    color: '#1F2937',
  },
  headerTitle: {
    fontFamily: customerFonts.editorial,
    fontSize: 22,
    color: '#1F2937',
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 44,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: customerFonts.regular,
    color: '#1F2937',
    paddingVertical: 0,
  },
  bankListScroll: {
    flex: 1,
  },
  bankListContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 30,
  },
  bankItemWrapper: {
    width: '100%',
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  bankRowSelected: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  logoWrap: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bankNameText: {
    flex: 1,
    fontSize: 14,
    fontFamily: customerFonts.regular,
    color: '#1F2937',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#15803D',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#15803D',
  },
  proceedButtonWrapper: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  proceedButton: {
    backgroundColor: '#1E7E34',
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E7E34',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    fontFamily: customerFonts.bold,
  },
  bankDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
});
