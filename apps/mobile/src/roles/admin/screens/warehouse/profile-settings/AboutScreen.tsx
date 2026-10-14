/**
 * About TOHFA with the Privacy Policy, Terms & Conditions and Open Source
 * Licenses pages (FINAL_LIST #77), for Main and Sub.
 *
 * Was SubWarehouseAboutScreen. Static app and legal content: no gate. The
 * role and warehouse rows come from the scope (they named the Sub warehouse),
 * and the terms title no longer says "Sub Warehouse".
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import {
  Card,
  InfoCard,
  SectionTitle,
  ShieldCheckIcon,
  StatusBadge,
  WalletButton,
  WalletScreen,
} from '../wallet-cashtopup/WalletParts';
import { APP_INFO, roleLabelOf, scopeLabelOf } from './fixtures';
import { MenuCard, MenuRow, profileLayout, StatusRow } from './ProfileParts';
import type { AboutView, WarehouseScreenBaseProps } from './types';

export interface AboutScreenProps extends WarehouseScreenBaseProps {
  /** Open on one of the legal pages instead of the main page. */
  initialView?: AboutView | undefined;
}

interface LegalSection {
  title: string;
  body: string;
}

const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    title: '1. Data Protection Commitment',
    body:
      'The Nilgiris Horticulture Organic Farmers Association (TOHFA) is committed to safeguarding all operational data collected across warehouse receiving, farmer transactions, and customer dispatches in full compliance with the Indian Digital Personal Data Protection Act (DPDP).',
  },
  {
    title: '2. Information Collected',
    body:
      'We process batch barcode scans, produce weight and grading measurements, employee shift check-in records, customer contact details, and invoice receipts required exclusively for agricultural inventory administration and fulfillment.',
  },
  {
    title: '3. Storage & Encryption',
    body:
      'All authentication tokens, farmer payout records, and transaction ledgers are encrypted locally with AES-256 and transmitted over TLS 1.3 to authorized TOHFA cloud servers located within Indian data centers.',
  },
  {
    title: '4. Data Access & Sharing',
    body:
      'Access is strictly role-gated. Warehouse operators cannot export or distribute farmer or customer records without explicit authorization from the Main Warehouse Admin or Association Board.',
  },
  {
    title: '5. Contact & Grievance Officer',
    body:
      'For any data inquiries or privacy concerns, contact our designated Data Protection Officer at privacy@tohfa.example or via the Help & Support center.',
  },
];

const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    title: '1. Authorized Usage',
    body:
      'This mobile application is licensed strictly to certified warehouse operators and staff under the Nilgiris Horticulture Organic Farmers Association.',
  },
  {
    title: '2. Operator Responsibilities',
    body:
      'Operators must accurately log grade, moisture content, and weight upon produce intake and ensure customer order dispatches match system invoice numbers without discrepancy.',
  },
  {
    title: '3. Financial & Cash Handling',
    body:
      'All cash collected for wallet top-ups, customer retail orders, and operational expense outlays must be reconciled daily against the system cash summary ledger.',
  },
  {
    title: '4. Security Compliance',
    body:
      'Users may not share administrative credentials or operate on rooted/compromised terminal devices. Any suspected security breach must be reported immediately.',
  },
];

const LICENSES: readonly { name: string; license: string; description: string }[] = [
  {
    name: 'React Native',
    license: 'MIT License · Meta Platforms, Inc.',
    description: 'A framework for building native applications using React.',
  },
  {
    name: 'React Native SVG',
    license: 'MIT License · Horcrux / react-native-svg',
    description: 'SVG library for React Native providing vector graphics rendering support.',
  },
  {
    name: 'Lucide Icons',
    license: 'ISC License · Lucide Contributors',
    description: 'An open-source icon library designed for consistency and clarity.',
  },
  {
    name: 'Google Fonts (Inter & Outfit)',
    license: 'SIL Open Font License 1.1',
    description: 'Modern typeface fonts optimized for mobile readability and interface design.',
  },
];

export function AboutScreen({ scope, onBack, initialView = 'main' }: AboutScreenProps) {
  const [view, setView] = useState<AboutView>(initialView);
  // Opened straight on a legal page: Done / back leaves the screen.
  const closeLegal = () => (initialView === 'main' ? setView('main') : onBack());

  if (view === 'privacy') {
    return (
      <LegalPage title="Privacy Policy" onBack={closeLegal}>
        <Text style={styles.docTitle}>TOHFA Digital Privacy Policy</Text>
        <Text style={styles.docSubtitle}>Last updated: September 2026 · Compliant with Digital Personal Data Protection Act (DPDP)</Text>
        <Sections sections={PRIVACY_SECTIONS} />
      </LegalPage>
    );
  }

  if (view === 'terms') {
    return (
      <LegalPage title="Terms & Conditions" onBack={closeLegal}>
        <Text style={styles.docTitle}>Warehouse Operating Terms</Text>
        <Text style={styles.docSubtitle}>Version 1.0 · Governing all warehouse administrative operations</Text>
        <Sections sections={TERMS_SECTIONS} />
      </LegalPage>
    );
  }

  if (view === 'licenses') {
    return (
      <LegalPage title="Open Source Licenses" onBack={closeLegal}>
        <Text style={styles.docTitle}>Third-Party Software Notices</Text>
        <Text style={styles.docSubtitle}>We gratefully acknowledge the following open-source software libraries</Text>
        {LICENSES.map((item) => (
          <View key={item.name} style={styles.licenseItem}>
            <Text style={styles.licenseName}>{item.name}</Text>
            <Text style={styles.licenseType}>{item.license}</Text>
            <Text style={styles.paragraph}>{item.description}</Text>
          </View>
        ))}
      </LegalPage>
    );
  }

  return (
    <WalletScreen title="About TOHFA" onBack={onBack}>
      <ScrollView contentContainerStyle={profileLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <Card centered>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>T</Text>
            <View style={styles.logoLeaf}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 2C6.5 2 2 6.5 2 12c0 4.5 3 8.3 7.2 9.5-.2-1.8.1-3.7 1-5.3 1.2-2.1 3.2-3.6 5.5-4.2.3-.1.7 0 .8.3.1.3 0 .7-.3.8-2.1.6-3.9 2-5 3.9-.8 1.4-1.1 3.1-1 4.7 6.1-.7 10.8-5.8 10.8-12 0-4.3-3.6-7.7-8-7.7z"
                  fill={adminColors.toast.icon}
                />
              </Svg>
            </View>
          </View>
          <Text style={styles.appTitle}>TOHFA</Text>
          <Text style={styles.appSubtitle}>Nilgiris Horticulture Organic Farmers Association</Text>
          <StatusBadge label={`Version ${APP_INFO.version} (Build ${APP_INFO.build})`} tone="brandSoft" />
        </Card>

        <SectionTitle>APPLICATION INFORMATION</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Application', value: APP_INFO.application },
              { label: 'Version', value: APP_INFO.version },
            ],
            [
              { label: 'Build', value: APP_INFO.build },
              { label: 'Environment', value: APP_INFO.environment },
            ],
            [
              { label: 'Role', value: roleLabelOf(scope) },
              { label: 'Warehouse', value: scopeLabelOf(scope) },
            ],
          ]}
        />

        <SectionTitle>SYSTEM STATUS</SectionTitle>
        <MenuCard>
          <StatusRow label="Backend & API Server" right={<StatusWithIcon label="Connected" />} />
          <StatusRow label="Local Offline Sync" right={<StatusWithIcon label="Synchronized" />} />
        </MenuCard>

        <SectionTitle>LEGAL INFORMATION</SectionTitle>
        <MenuCard>
          <MenuRow icon={<ShieldCheckIcon size={18} color={adminColors.brandDeep} />} title="Privacy Policy" onPress={() => setView('privacy')} />
          <MenuRow icon={<ShieldCheckIcon size={18} color={adminColors.brandDeep} />} title="Terms & Conditions" onPress={() => setView('terms')} />
          <MenuRow icon={<ShieldCheckIcon size={18} color={adminColors.brandDeep} />} title="Open Source Licenses" onPress={() => setView('licenses')} />
        </MenuCard>
      </ScrollView>
    </WalletScreen>
  );
}

function LegalPage({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <WalletScreen title={title} onBack={onBack}>
      <ScrollView contentContainerStyle={profileLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <Card>
          {children}
          <View style={styles.doneButton}>
            <WalletButton label="Done" onPress={onBack} />
          </View>
        </Card>
      </ScrollView>
    </WalletScreen>
  );
}

function Sections({ sections }: { sections: readonly LegalSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <View key={section.title}>
          <Text style={styles.sectionHeading}>{section.title}</Text>
          <Text style={styles.paragraph}>{section.body}</Text>
        </View>
      ))}
    </>
  );
}

function StatusWithIcon({ label }: { label: string }) {
  return (
    <View style={styles.statusWithIcon}>
      <ShieldCheckIcon size={16} />
      <StatusBadge label={label} tone="success" />
    </View>
  );
}

// Logo tile size: a brand mark, not spacing.
const LOGO = 76;

const styles = StyleSheet.create({
  logoBox: {
    width: LOGO,
    height: LOGO,
    borderRadius: adminRadius.xl,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: adminSpacing.md,
    ...adminShadow.md,
  },
  // Was 38 / 900, far above the admin type scale; the largest admin style is title (19 / 800).
  logoLetter: { ...adminType.title, color: adminColors.onBrand },
  logoLeaf: { position: 'absolute', top: adminSpacing.sm, right: adminSpacing.sm },
  appTitle: { ...adminType.title, color: adminColors.ink, textAlign: 'center' },
  appSubtitle: {
    ...adminType.body,
    color: adminColors.muted,
    textAlign: 'center',
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.sm,
  },
  statusWithIcon: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },

  docTitle: { ...adminType.title, color: adminColors.ink },
  docSubtitle: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs, marginBottom: adminSpacing.sm },
  sectionHeading: { ...adminType.sectionHead, color: adminColors.brandDeep, marginTop: adminSpacing.md },
  paragraph: { ...adminType.body, color: adminColors.muted, marginTop: adminSpacing.xs },
  licenseItem: { paddingVertical: adminSpacing.sm, borderTopWidth: 1, borderTopColor: adminColors.border },
  licenseName: { ...adminType.rowTitle, color: adminColors.ink },
  licenseType: { ...adminType.caption, color: adminColors.brand, marginTop: 2 },
  doneButton: { marginTop: adminSpacing.lg },
});
