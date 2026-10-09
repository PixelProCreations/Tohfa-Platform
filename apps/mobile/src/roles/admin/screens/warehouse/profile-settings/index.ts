// Shared Main/Sub warehouse account screens (design module M16, part A).
// Explicit exports only (no `export *`), mirroring the other area barrels so
// type names can never clash across barrels.
export { SettingsScreen, type SettingsChildRoute, type SettingsScreenProps } from './SettingsScreen';
export { UserProfileScreen, type UserProfileScreenProps } from './UserProfileScreen';
export { NotificationSettingsScreen, type NotificationSettingsScreenProps } from './NotificationSettingsScreen';
export { SecurityScreen, type SecurityScreenProps } from './SecurityScreen';
export { SessionSecurityScreen, type SessionSecurityScreenProps } from './SessionSecurityScreen';
export { HelpSupportScreen, type HelpSupportScreenProps } from './HelpSupportScreen';
export { AboutScreen, type AboutScreenProps } from './AboutScreen';
export { ProfileFlow, type ProfileFlowProps } from './ProfileFlow';
// Part B: warehouse-facing profile screens (design module M15).
export { WarehouseInfoScreen, type WarehouseInfoScreenProps, type WarehouseProfileChildRoute } from './WarehouseInfoScreen';
export { StorageInfoScreen, type StorageInfoScreenProps } from './StorageInfoScreen';
export { OperatingInfoScreen, type OperatingInfoScreenProps } from './OperatingInfoScreen';
export { ContactScreen, type ContactScreenProps } from './ContactScreen';
export { DocumentsScreen, type DocumentsScreenProps } from './DocumentsScreen';
export { WarehouseSettingsScreen, type WarehouseSettingsScreenProps } from './WarehouseSettingsScreen';
export { WAREHOUSE_PROFILE_CODES } from './WarehouseProfileParts';
export { PROFILE_WAREHOUSES } from './warehouseFixtures';
export { PASSWORD_MIN_LENGTH, PROFILE_CODES } from './ProfileParts';
export { defaultProfile, FAQ_ITEMS, roleLabelOf, scopeLabelOf } from './fixtures';
export type {
  AboutView,
  AdminAccountProfile,
  FaqCategory,
  FaqItem,
  ProfileRoute,
  StorageLocationItem,
  SupportTicketItem,
  WarehouseDocItem,
  WarehouseProfileInfo,
  WarehouseSettingsValues,
} from './types';
