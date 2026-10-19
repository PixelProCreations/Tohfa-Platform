import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { BackHandler, Platform, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { configureTokenStorage, setOnAuthFailure } from '../../shell/api/client';
import { SessionQueryProvider } from '../../shell/api/SessionQueryProvider';
import { deleteFarmAsset } from './api/farmAssets';
import { tokenStorage } from './storage/tokenStorage';
import { fetchMe, hasSessionCredentials, logout } from './api/auth';
import { useWarehousePermissions } from '../admin/permissions/useWarehousePermissions';
import {
  authFailureTarget,
  emptyHistoryBackTarget,
  resetsHistoryOn,
  shouldLoadWarehousePermissions,
} from './utils/navigationSession';
import { adminShellForRole } from './utils/adminShell';
import { endSession } from './utils/signOut';
import { Icon } from '@tohfa/mobile-ui';
import { t } from '../../i18n/farmer';
import { ApplicationStatusScreen } from './screens/auth/ApplicationStatusScreen';
import { ForgotPasswordScreen } from './screens/auth/ForgotPasswordScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { OtpScreen } from './screens/auth/OtpScreen';
import { ResetPasswordScreen } from './screens/auth/ResetPasswordScreen';
import { PasswordChangedSuccessScreen } from './screens/auth/PasswordChangedSuccessScreen';
import { RoleSelectionScreen } from './screens/auth/RoleSelectionScreen';
import { HomeIcon } from './assets/icons/AssetIcons';
import { SplashScreen } from './screens/auth/SplashScreen';
import { WelcomeScreen } from './screens/auth/WelcomeScreen';
import { AddCertificationScreen } from './screens/certifications/AddCertificationScreen';
import { CertificationsScreen } from './screens/certifications/CertificationsScreen';
import { EditCertificationScreen } from './screens/certifications/EditCertificationScreen';
import { DashboardScreen } from './screens/dashboard/DashboardScreen';
import { WeatherScreen } from './screens/dashboard/WeatherScreen';
import { ActiveCropsScreen } from './screens/dashboard/ActiveCropsScreen';
import { TohfaCalendarScreen } from './screens/dashboard/TohfaCalendarScreen';
import { CropPlanningInsightScreen } from './screens/dashboard/CropPlanningInsightScreen';
import { FarmManagementScreen } from './screens/farm/FarmManagementScreen';
import { DairyProduceScreen } from './screens/farm/livestock/DairyProduceScreen';
import { CropManagementScreen } from './screens/farm/crops/CropManagementScreen';
import { LivestockScreen } from './screens/farm/livestock/LivestockScreen';
import { RegisterAnimalScreen } from './screens/farm/livestock/RegisterAnimalScreen';
import { EditAnimalScreen } from './screens/farm/livestock/EditAnimalScreen';
import { AnimalDetailScreen } from './screens/farm/livestock/AnimalDetailScreen';
import { SaleTransferCullScreen } from './screens/farm/livestock/SaleTransferCullScreen';
import { WorkforceScreen } from './screens/farm/workforce/WorkforceScreen';
import { AddWorkerScreen } from './screens/farm/workforce/AddWorkerScreen';
import { WorkerDetailScreen } from './screens/farm/workforce/WorkerDetailScreen';
import { PayrollScreen } from './screens/farm/workforce/PayrollScreen';
import { ProduceCalendarScreen, type CropItem } from './screens/farm/crops/ProduceCalendarScreen';
import { NewCropScreen } from './screens/farm/crops/NewCropScreen';
import { CropDetailScreen } from './screens/farm/crops/CropDetailScreen';
import { CropMilestonesScreen } from './screens/farm/crops/CropMilestonesScreen';
import { CropDiaryEntriesScreen } from './screens/farm/diary/CropDiaryEntriesScreen';
import { CropInputsAppliedScreen } from './screens/farm/crops/CropInputsAppliedScreen';
import { InputManagementScreen } from './screens/farm/crops/InputManagementScreen';
import { LogFertigationScreen } from './screens/farm/crops/LogFertigationScreen';
import { LogPestTreatmentScreen } from './screens/farm/pest/LogPestTreatmentScreen';
import { AddInputAppliedScreen } from './screens/farm/crops/AddInputAppliedScreen';
import { SoilManagementScreen } from './screens/farm/soil/SoilManagementScreen';
import { SoilTestRecordsScreen } from './screens/farm/soil/SoilTestRecordsScreen';
import { SoilHealthTrackerScreen } from './screens/farm/soil/SoilHealthTrackerScreen';
import { SoilTypeClassificationScreen } from './screens/farm/soil/SoilTypeClassificationScreen';
import { SoilAmendmentsLogScreen } from './screens/farm/soil/SoilAmendmentsLogScreen';
import { CreateSoilAmendmentScreen } from './screens/farm/CreateSoilAmendmentScreen';
import { CropRotationScreen } from './screens/farm/crops/CropRotationScreen';
import { SoilMoistureTrackingScreen } from './screens/farm/soil/SoilMoistureTrackingScreen';
import { ErosionConservationScreen } from './screens/farm/soil/ErosionConservationScreen';
import { CreateErosionNoteScreen } from './screens/farm/CreateErosionNoteScreen';
import { ExportSoilReportsScreen } from './screens/farm/soil/ExportSoilReportsScreen';
import { UploadNewSoilTestScreen } from './screens/farm/soil/UploadNewSoilTestScreen';
import { PestManagementScreen } from './screens/farm/pest/PestManagementScreen';
import { PestLibraryScreen } from './screens/farm/pest/PestLibraryScreen';
import { TreatmentScheduleScreen } from './screens/farm/pest/TreatmentScheduleScreen';
import { WeatherRiskAnalyticsScreen } from './screens/farm/pest/WeatherRiskAnalyticsScreen';
import { CropWorkforceHoursScreen } from './screens/farm/crops/CropWorkforceHoursScreen';
import { CropNPKContributionScreen } from './screens/farm/crops/CropNPKContributionScreen';
import { FarmDiaryScreen } from './screens/farm/diary/FarmDiaryScreen';
import { DiaryCalendarScreen } from './screens/farm/diary/DiaryCalendarScreen';
import { DailyAttendanceScreen } from './screens/farm/workforce/DailyAttendanceScreen';
import { FarmInventoryScreen } from './screens/farm/FarmInventoryScreen';
import { ToolsListScreen, type ToolItem } from './screens/farm/assets/ToolsListScreen';
import { AddToolScreen } from './screens/farm/assets/AddToolScreen';
import { EditToolScreen } from './screens/farm/assets/EditToolScreen';
import { EquipmentListScreen, type EquipmentItem } from './screens/farm/assets/EquipmentListScreen';
import { AddEquipmentScreen } from './screens/farm/assets/AddEquipmentScreen';
import { EditEquipmentScreen } from './screens/farm/assets/EditEquipmentScreen';
import { TreesListScreen, type TreePlantingItem } from './screens/farm/assets/TreesListScreen';
import { AddPlantingScreen } from './screens/farm/crops/AddPlantingScreen';
import { EditPlantingScreen } from './screens/farm/crops/EditPlantingScreen';
import { MachineryListScreen, type MachineryItem } from './screens/farm/assets/MachineryListScreen';
import { AddMachineryScreen } from './screens/farm/assets/AddMachineryScreen';
import { EditMachineryScreen } from './screens/farm/assets/EditMachineryScreen';
import { RemoveItemScreen, canDeleteAsset, type RemoveItemData } from './screens/farm/assets/RemoveItemScreen';
import { LearningHubScreen } from './screens/learning/LearningHubScreen';
import { ContentDetailScreen, type ContentDetailItem } from './screens/learning/ContentDetailScreen';
import { GroupsScreen, type GroupItem } from './screens/learning/GroupsScreen';
import { GroupDetailScreen } from './screens/learning/GroupDetailScreen';
import { NewFarmDiaryEntryScreen } from './screens/farm/diary/NewFarmDiaryEntryScreen';
import { NewFarmDiaryEntryStep2Screen } from './screens/farm/diary/NewFarmDiaryEntryStep2Screen';
import { NewFarmDiaryEntryStep3Screen } from './screens/farm/diary/NewFarmDiaryEntryStep3Screen';
import { CounterOfferScreen } from './screens/listings/CounterOfferScreen';
import { CreateListingScreen } from './screens/listings/CreateListingScreen';
import { CreateListingStep2Screen } from './screens/listings/CreateListingStep2Screen';
import { ListingDetailScreen } from './screens/listings/ListingDetailScreen';
import { ListingsScreen } from './screens/listings/ListingsScreen';
import { MyListingsScreen } from './screens/listings/MyListingsScreen';
import { NotificationsScreen } from './screens/notifications/NotificationsScreen';
import { AuditsScreen } from './screens/audits/AuditsScreen';
import { AuditResultScreen } from './screens/audits/AuditResultScreen';
import { ProfileScreen } from './screens/profile/ProfileScreen';
import { SettingsScreen } from './screens/profile/SettingsScreen';
import { ChangePasswordScreen } from './screens/profile/ChangePasswordScreen';
import { AboutSupportScreen } from './screens/profile/AboutSupportScreen';
import { FMBSketchScreen } from './screens/profile/FMBSketchScreen';
import { FieldContextScreen } from './screens/profile/FieldContextScreen';
import { ZonesScreen } from './screens/profile/ZonesScreen';
import { PersonalDetailsScreen } from './screens/profile/PersonalDetailsScreen';
import { FarmRatingsScreen } from './screens/profile/FarmRatingsScreen';
import { SoilTestScreen } from './screens/profile/SoilTestScreen';
import { BankPaymentScreen } from './screens/payment/BankPaymentScreen';
import { BankAccountScreen } from './screens/payment/BankAccountScreen';
import { UpiIdScreen } from './screens/payment/UpiIdScreen';
import { PayoutHistoryScreen } from './screens/payment/PayoutHistoryScreen';
import { PayoutDetailScreen } from './screens/payment/PayoutDetailScreen';
import { WithdrawFundsScreen } from './screens/payment/WithdrawFundsScreen';
import { WalletTransactionDetailScreen } from './screens/payment/WalletTransactionDetailScreen';
import { AddMoneyScreen } from './screens/payment/AddMoneyScreen';
import { CashTopUpScreen } from './screens/payment/CashTopUpScreen';
import { RegistrationFlowScreen } from './screens/registration/RegistrationFlowScreen';
import { WalletScreen } from './screens/wallet/WalletScreen';
import { type Listing, type ListingCropChoice } from './api/listings';
import { type Certification } from './api/farmer';
import { authPalette, colors, spacing, typography, weights } from './theme';
import { CustomerMainApp } from '../customer/CustomerMainApp';
import {
  SuperAdminDashboardScreen,
  TohfaAdminDashboardScreen,
  FarmerAdminDashboardScreen,
  MainWarehouseAdminDashboardScreen,
  SubWarehouseAdminDashboardScreen,
  OrdersModule,
  ChannelSalesScreen,
  ChannelOrderDetailScreen,
  type ChannelOrderItem,
  type SalesChannel,
  WalletFlow,
  type WalletRoute,
  type WalletRouteParams,
  CustomerSearchScreen,
  HomeFlow,
  type AttentionFilter,
  MoreScreen,
  ReceivingFlow,
  StaffFlow,
  type AttendanceFilter,
  type StaffRoute,
  type StaffRouteParams,
  StorageFlow,
  type ActivityModule,
  type StorageRoute,
  type StorageRouteParams,
  type WarehouseScope,
  WarehouseScopeGate,
  isAreaAvailable,
  billingRouteArea,
  inventoryRouteArea,
  storageRouteArea,
  type WarehouseArea,
  FinanceFlow,
  type FinanceRoute,
  NotificationsFlow,
  type NotificationItem,
  type NotificationsRoute,
  type NotificationsRouteParams,
  type FinanceRouteParams,
  ReportsScreen,
  ProfileFlow,
  type ProfileRoute,
  type StaffMember,
  AuditCalendarScreen,
  type AuditEntry,
  ScheduleNewAuditScreen,
  AuditInspectionScreen,
  AuditReportScreen,
  type AuditReportData,
  FarmerAuditHistoryScreen,
  BulkRescheduleAuditsScreen,
  AuditPdfPreviewScreen,
  AuditDetailRecordScreen,
  ComplianceAlertResolutionScreen,
  FinancialDashboardScreen,
  PLStatementScreen,
  FarmerPayoutDuesScreen,
  PayoutProcessingScreen,
  ExpensesScreen,
  AddExpenseScreen,
  GSTAccountingScreen,
  GSTFilingReportDetailScreen,
  BasicAccountingLedgerScreen,
  AddManualJournalEntryScreen,
  AdminAllFarmersScreen,
  AdminFarmerDetailScreen,
  AdminFarmMapScreen,
  AdminRatingScorecardScreen,
  AdminEditFarmerScreen,
  AdminEditRatingCategoriesScreen,
  type FarmerDetailTabType,
  type FarmerListItem,
  DEMO_ALL_FARMERS,
  AdminPendingApplicationsScreen,
  AdminApplicationDetailScreen,
  type PendingApplicationItem,
  DEMO_PENDING_APPLICATIONS,
  AdminApplicationApproveScreen,
  AdminApplicationRejectScreen,
  AdminApplicationRequestInfoScreen,
  AdminCertVerificationScreen,
  AdminComplianceTiersScreen,
  AdminKycReviewScreen,
  SalesChannelOverviewScreen,
  SalesOnlineOrdersScreen,
  SalesMarketDayScreen,
  SalesHorecaOrdersScreen,
  SalesB2BOrdersScreen,
  SalesFulfillmentAssignmentScreen,
  SalesInvoiceScreen,
  SalesReturnsRefundsScreen,
  type OnlineOrderItem,
  type B2BAccount,
  WarehouseAdminFlow,
  TransfersFlow,
  InventoryFlow,
  ReturnsFlow,
  type ReturnsRoute,
  BillingFlow,
  type BillingRoute,
  type BillingRouteParams,
  CustomersFlow,
  type CustomersExternalRoute,
  type CustomersRoute,
  type CustomersRouteParams,
} from '../admin/screens';
import {
  SalesFlow,
  type SaleRecord,
  type SalesRoute,
  type SalesRouteParams,
} from '../admin/screens/warehouse/sales-direct';
import { MarketPricingHomeScreen } from '../admin/screens/dashboard/MarketPricingHomeScreen';
import { FairPriceCeilingScreen } from '../admin/screens/dashboard/FairPriceCeilingScreen';
import { UpdateFairPriceScreen } from '../admin/screens/dashboard/UpdateFairPriceScreen';
import { BulkPriceUpdateScreen } from '../admin/screens/dashboard/BulkPriceUpdateScreen';
import { PriceHistoryScreen } from '../admin/screens/dashboard/PriceHistoryScreen';
import { MarketDayScheduleScreen, MOCK_DAYS, type MarketDay } from '../admin/screens/dashboard/MarketDayScheduleScreen';
import { AddMarketDayScreen } from '../admin/screens/dashboard/AddMarketDayScreen';
import { ListingApprovalQueueScreen } from '../admin/screens/dashboard/ListingApprovalQueueScreen';
import { AdminSupportScreen } from '../admin/screens/dashboard/AdminSupportScreen';
import { ReportBuilderScreen } from '../admin/screens/reports';
import { TohfaToast, type ToastData } from '../admin/components/TohfaToast';
import { makeCan } from '../admin/permissions/can';
import { OrderStatusHistoryScreen } from '../admin/screens/warehouse/orders';
import type { WarehouseTab } from '../admin/screens/warehouse/finance-expenses';

export type ScreenName =
  | 'Splash'
  | 'Welcome'
  | 'Login'
  | 'RoleSelection'
  | 'Register'
  | 'Otp'
  | 'ForgotPassword'
  | 'ResetPassword'
  | 'PasswordChangedSuccess'
  | 'ApplicationStatus'
  | 'MainTabs'
  | 'AdminMain'
  | 'SuperAdminDashboard'
  | 'TohfaAdminDashboard'
  | 'FarmerAdminDashboard'
  | 'MainWarehouseAdminDashboard'
  | 'SubWarehouseAdminDashboard'
  | 'SubWarehouseProfile'
  | 'SubWarehouseWarehouseProfile'
  | 'SubWarehouseUserProfile'
  | 'SubWarehouseOverview'
  | 'SubWarehouseRecentActivity'
  | 'SubWarehouseStorageInfo'
  | 'SubWarehouseOperatingInfo'
  | 'SubWarehouseContact'
  | 'SubWarehouseDocuments'
  | 'SubWarehouseNotifications'
  | 'SubWarehouseTodayOverview'
  | 'SubWarehouseNotificationDetail'
  | 'SubWarehouseReviewReceiving'
  | 'SubWarehouseSales'
  | 'SubWarehouseNewSale'
  | 'SubWarehouseSelectProducts'
  | 'SubWarehouseSaleSummary'
  | 'SubWarehouseSelectCustomer'
  | 'SubWarehouseCustomerList'
  | 'SubWarehousePayment'
  | 'SubWarehouseSaleConfirmation'
  | 'SubWarehouseSalesHistory'
  | 'SubWarehouseSaleDetail'
  | 'SubWarehouseMarketDaySales'
  | 'SubWarehouseHorecaSales'
  | 'SubWarehouseHorecaDetail'
  | 'SubWarehouseB2BSales'
  | 'SubWarehouseB2BDetail'
  | 'SubWarehouseOrderStatusHistory'
  | 'WarehouseWalletOperations'
  | 'SubWarehouseCashTopUp'
  | 'SubWarehouseConfirmCashTopUp'
  | 'WarehouseCustomerSearch'
  | 'SubWarehouseTopUpHistory'
  | 'SubWarehouseDailyCashSummary'
  | 'SubWarehouseTopUpDetails'
  | 'SubWarehouseCustomerWallet'
  | 'SubWarehouseFiscalTag'
  | 'SubWarehouseTransactionDetail'
  | 'SubWarehouseTopUpSuccess'
  | 'SubWarehouseNeedsAttention'
  | 'SubWarehouseWalletAttention'
  | 'SubWarehouseReturnsIssues'
  | 'SubWarehouseRmaDetail'
  | 'SubWarehouseInspectProduct'
  | 'SubWarehouseReviewReturnRequest'
  | 'SubWarehouseRejectReturnRequest'
  | 'SubWarehouseRequestRejected'
  | 'SubWarehouseApproveReturn'
  | 'SubWarehouseReturnApproved'
  | 'SubWarehouseRefundStatus'
  | 'SubWarehouseRefundFailed'
  | 'SubWarehouseRefundCompleted'
  | 'SubWarehouseReturnHistory'
  | 'SubWarehouseReturnHistoryDetail'
  | 'SubWarehouseStaff'
  | 'SubWarehouseStaffDetail'
  | 'SubWarehouseAttendance'
  | 'SubWarehouseTodayAttendance'
  | 'SubWarehouseAttendanceHistory'
  | 'WarehouseMore'
  | 'SubWarehouseCustomerDetail'
  | 'SubWarehouseCustomerPurchases'
  | 'SubWarehousePurchaseHistory'
  | 'SubWarehouseCustomerOrders'
  | 'SubWarehouseCustomerIssues'
  | 'SubWarehouseCustomerIssueDetail'
  | 'SubWarehouseCustomerSupport'
  | 'SubWarehouseCustomerSupportDetail'
  | 'SubWarehouseBillingHub'
  | 'SubWarehouseInvoiceList'
  | 'SubWarehouseInvoiceFilters'
  | 'SubWarehouseInvoiceDetail'
  | 'SubWarehouseGenerateInvoice'
  | 'SubWarehouseInvoiceWizard'
  | 'SubWarehouseInvoiceGenerated'
  | 'SubWarehouseOrderFilters'
  | 'SubWarehousePurchaseFilters'
  | 'SubWarehouseTaskActionCenter'
  | 'SubWarehouseTaskDetail'
  | 'SubWarehouseOrderDetail'
  | 'SubWarehouseApprovalAlerts'
  | 'SubWarehouseExpenseRecord'
  | 'SubWarehouseGoodsReceiptDetail'
  | 'SubWarehouseSystemMessages'
  | 'SubWarehouseMessageHistory'
  | 'SubWarehouseDailyCash'
  | 'SubWarehouseFinance'
  | 'SubWarehouseRevenue'
  | 'SubWarehouseRevenueDetail'
  | 'WarehouseExpenses'
  | 'WarehouseAddExpense'
  | 'WarehouseExpenseDetail'
  | 'SubWarehouseExpenseCategories'
  | 'WarehouseFinanceHistory'
  | 'WarehouseFinanceReports'
  | 'SubWarehouseVouchers'
  | 'SubWarehouseWarehouseOperations'
  | 'SubWarehouseWarehouseActivity'
  | 'SubWarehouseStorageLocationDetail'
  | 'SubWarehouseCapacity'
  | 'SubWarehouseOperationalIssues'
  | 'SubWarehouseReportIssue'
  | 'SubWarehouseIssueSubmitted'
  | 'SubWarehouseOperationalIssueDetail'
  | 'SubWarehouseAttendanceDetail'
  | 'SubWarehouseEditStaffProfile'
  | 'SubWarehouseReports'
  | 'SubWarehouseSettings'
  | 'SubWarehouseCustomers'
  | 'SubWarehouseCustomerDetails'
  | 'SubWarehouseSupportHistory'
  | 'WarehouseOverview'
  | 'StockLedger'
  | 'VerifyStock'
  | 'StockAdjustmentApproval'
  | 'LowStockAlerts'
  | 'WarehouseSettings'
  | 'InterWarehouseTransfer'
  | 'InitiateNewTransfer'
  | 'SalesChannelOverview'
  | 'SalesOnlineOrders'
  | 'SalesMarketDay'
  | 'SalesHorecaOrders'
  | 'SalesB2BOrders'
  | 'SalesFulfillmentAssignment'
  | 'SalesInvoice'
  | 'SalesReturnsRefunds'
  | 'AuditCalendar'
  | 'ScheduleNewAudit'
  | 'AuditInspection'
  | 'AuditReport'
  | 'FarmerAuditHistory'
  | 'AuditDetailRecord'
  | 'BulkRescheduleAudits'
  | 'AuditPdfPreview'
  | 'ComplianceAlertResolution'
  | 'FinancialDashboard'
  | 'ScheduleAudit'
  | 'AdminSupport'
  | 'ReportBuilder'
  | 'PLStatement'
  | 'FarmerPayoutDues'
  | 'PayoutProcessing'
  | 'Expenses'
  | 'AddExpense'
  | 'GSTAccounting'
  | 'GSTFilingReportDetail'
  | 'BasicAccountingLedger'
  | 'AddManualJournalEntry'
  | 'AdminAllFarmers'
  | 'AdminFarmerDetail'
  | 'AdminFarmMap'
  | 'AdminRatingScorecard'
  | 'AdminEditFarmer'
  | 'AdminEditRatingCategories'
  | 'AdminComplianceTiers'
  | 'AdminKycReview'
  | 'AdminCertVerification'
  | 'AdminPendingApplications'
  | 'AdminApplicationDetail'
  | 'AdminApplicationApprove'
  | 'AdminApplicationReject'
  | 'AdminApplicationRequestInfo'
  | 'CustomerMain'
  | 'Unsupported'
  | 'Certifications'
  | 'AddCertification'
  | 'CreateListing'
  | 'CreateListingStep2'
  | 'ListingDetail'
  | 'CounterOffer'
  | 'FMBSketch'
  | 'FieldContext'
  | 'Zones'
  | 'EditCertification'
  | 'Notifications'
  | 'PersonalDetails'
  | 'Audits'
  | 'AuditResult'
  | 'FarmManagement'
  | 'DairyProduce'
  | 'CropManagement'
  | 'Livestock'
  | 'Workforce'
  | 'ProduceCalendar'
  | 'NewCrop'
  | 'CropDetail'
  | 'CropMilestones'
  | 'FarmRatings'
  | 'SoilTest'
  | 'NewSoilTest'
  | 'Weather'
  | 'FarmDiary'
  | 'DiaryCalendar'
  | 'NewFarmDiaryEntry'
  | 'NewFarmDiaryEntryStep2'
  | 'NewFarmDiaryEntryStep3'
  | 'ActiveCrops'
  | 'MyListings'
  | 'DailyAttendance'
  | 'TohfaCalendar'
  | 'CropPlanningInsight'
  | 'FarmInventory'
  | 'ToolsList'
  | 'AddTool'
  | 'EditTool'
  | 'EquipmentList'
  | 'AddEquipment'
  | 'EditEquipment'
  | 'TreesList'
  | 'AddPlanting'
  | 'EditPlanting'
  | 'MachineryList'
  | 'AddMachinery'
  | 'EditMachinery'
  | 'RemoveItem'
  | 'AddWorker'
  | 'WorkerDetail'
  | 'Payroll'
  | 'RegisterAnimal'
  | 'EditAnimal'
  | 'AnimalDetail'
  | 'SaleTransferCull'
  | 'LearningHub'
  | 'ContentDetail'
  | 'Groups'
  | 'GroupDetail'
  | 'Settings'
  | 'ChangePassword'
  | 'AboutSupport'
  | 'InputManagement'
  | 'LogFertigation'
  | 'LogPestTreatment'
  | 'CropDiaryEntries'
  | 'CropInputsApplied'
  | 'AddInputApplied'
  | 'CropWorkforceHours'
  | 'CropNPKContribution'
  | 'SoilManagement'
  | 'SoilTestRecords'
  | 'SoilHealthTracker'
  | 'SoilTypeClassification'
  | 'SoilAmendmentsLog'
  | 'CreateSoilAmendment'
  | 'LogSoilAmendment'
  | 'CropRotation'
  | 'SoilMoistureTracking'
  | 'ErosionConservation'
  | 'CreateErosionNote'
  | 'LogErosionNote'
  | 'ExportSoilReports'
  | 'UploadNewSoilTest'
  | 'MarketPricingHome'
  | 'FairPriceCeiling'
  | 'UpdateFairPrice'
  | 'BulkPriceUpdate'
  | 'PriceHistory'
  | 'MarketDaySchedule'
  | 'AddMarketDay'
  | 'ListingApprovalQueue'
  | 'SubWarehouseHelpSupport'
  | 'SubWarehouseVoucherDetail'
  | 'SubWarehouseTodayOperations'
  | 'SubWarehouseActivityDetail'
  | 'PestManagement'
  | 'PestLibrary'
  | 'TreatmentSchedule'
  | 'WeatherRiskAnalytics'
  | 'BankPayment'
  | 'BankAccount'
  | 'UpiId'
  | 'PayoutHistory'
  | 'PayoutDetail'
  | 'Wallet'
  | 'WithdrawFunds'
  | 'WalletTransactionDetail'
  | 'AddMoney'
  | 'CashTopUp';

type TabName = 'Home' | 'Listings' | 'Wallet' | 'Profile';

/** Near-black green used behind the splash photo + status bar while Splash shows. */
const SPLASH_DARK = authPalette.splashDark;

function TabPlusIcon({ size = 22, color = colors.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5V19M5 12H19"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Sales channel shown by a B2B / HORECA route (the merged ChannelSales / ChannelOrderDetail screens). */
function channelForRoute(route: 'SubWarehouseB2BSales' | 'SubWarehouseB2BDetail' | 'SubWarehouseHorecaSales' | 'SubWarehouseHorecaDetail'): SalesChannel {
  return route === 'SubWarehouseB2BSales' || route === 'SubWarehouseB2BDetail' ? 'B2B' : 'HORECA';
}

/**
 * Main Warehouse view: no warehouseId = all warehouses. The Sub Warehouse
 * scope is not a constant: it is the SUB_WH_ADMIN assignment from GET
 * /auth/me (BR-30), rendered through WarehouseScopeGate (renderWithSubScope).
 */
const MAIN_WAREHOUSE_SCOPE: WarehouseScope = {};
/** Legacy Main inventory route keys -> shared InventoryFlow design ids (W4). */
/** Legacy Sub RMA route keys -> shared ReturnsFlow routes (W4). 'SubWarehouseImageViewer' was dropped (FINAL_LIST #106). */
const RETURNS_ROUTE_ENTRY: Partial<Record<ScreenName, ReturnsRoute>> = {
  SubWarehouseReturnsIssues: 'ReturnsIssues',
  SubWarehouseRmaDetail: 'RmaDetail',
  SubWarehouseInspectProduct: 'InspectProduct',
  SubWarehouseReviewReturnRequest: 'ReviewReturnRequest',
  SubWarehouseApproveReturn: 'ApproveReturn',
  SubWarehouseRejectReturnRequest: 'RejectReturnRequest',
  SubWarehouseRequestRejected: 'RequestRejected',
  SubWarehouseReturnApproved: 'ReturnApproved',
  SubWarehouseRefundStatus: 'RefundStatus',
  SubWarehouseRefundFailed: 'RefundFailed',
  SubWarehouseRefundCompleted: 'RefundCompleted',
  SubWarehouseReturnHistory: 'ReturnHistory',
  SubWarehouseReturnHistoryDetail: 'ReturnHistoryDetail',
};
/**
 * Legacy Sub billing route keys -> shared BillingFlow routes (W4). Removed with
 * their folded screens: SubWarehouseInvoiceHistory(+Filters) -> InvoiceList
 * layout 'history', SubWarehouseInvoicePreview -> InvoiceDetail,
 * SubWarehouseReviewInvoice -> InvoiceWizard with `review`, and the dropped
 * WarehouseGSTInvoice.
 */
const BILLING_ROUTE_ENTRY: Partial<Record<ScreenName, BillingRoute>> = {
  SubWarehouseBillingHub: 'BillingHub',
  SubWarehouseInvoiceList: 'InvoiceList',
  SubWarehouseInvoiceFilters: 'InvoiceFilters',
  SubWarehouseInvoiceDetail: 'InvoiceDetail',
  SubWarehouseGenerateInvoice: 'GenerateInvoice',
  SubWarehouseInvoiceWizard: 'InvoiceWizard',
  SubWarehouseInvoiceGenerated: 'InvoiceGenerated',
};
/**
 * Legacy Sub sales route keys -> shared SalesFlow routes (W4). Every old key
 * still opens; the flow then owns the rest of the sale, so each step gets the
 * viewer's scope and `can` (the nested Payment -> Confirmation and History ->
 * Detail paths used to lose them and hide View Invoice).
 */
const SALES_ROUTE_ENTRY: Partial<Record<ScreenName, SalesRoute>> = {
  SubWarehouseSales: 'Sales',
  SubWarehouseNewSale: 'NewSale',
  SubWarehouseSelectProducts: 'SelectProducts',
  SubWarehouseSaleSummary: 'SaleSummary',
  SubWarehouseSelectCustomer: 'SelectCustomer',
  SubWarehousePayment: 'Payment',
  SubWarehouseSaleConfirmation: 'SaleConfirmation',
  SubWarehouseSalesHistory: 'SalesHistory',
  SubWarehouseSaleDetail: 'SaleDetail',
  SubWarehouseMarketDaySales: 'MarketDaySales',
};
/**
 * Legacy Sub staff & attendance route keys -> shared StaffFlow routes (W4, M14).
 * Today's Attendance was folded into Attendance: its key opens Attendance on
 * the 'All' chip. The roster routes (Staff, StaffDetail, EditStaffProfile) need
 * warehouse.staff.list_view; StaffFlow and the screens check it.
 */
const STAFF_ROUTE_ENTRY: Partial<Record<ScreenName, { route: StaffRoute; filter?: AttendanceFilter }>> = {
  SubWarehouseStaff: { route: 'Staff' },
  SubWarehouseStaffDetail: { route: 'StaffDetail' },
  SubWarehouseEditStaffProfile: { route: 'EditStaffProfile' },
  SubWarehouseAttendance: { route: 'Attendance' },
  SubWarehouseTodayAttendance: { route: 'Attendance', filter: 'All' },
  SubWarehouseAttendanceDetail: { route: 'AttendanceDetail' },
  SubWarehouseAttendanceHistory: { route: 'AttendanceHistory' },
};
/**
 * Legacy Sub storage-ops route keys -> shared StorageFlow routes (W4, M4 part
 * A). `back` is where the old screen's back button went when the key is the
 * first screen of the flow.
 */
const STORAGE_ROUTE_ENTRY: Partial<
  Record<
    ScreenName,
    {
      route: StorageRoute;
      back: ScreenName;
      backParams?: Record<string, unknown> | undefined;
      params?: StorageRouteParams | undefined;
    }
  >
> = {
  // Part B: the Warehouse Operations hub; its capacity / issues /
  // activity tiles open inside the flow, the rest leave through onOpenModule.
  SubWarehouseWarehouseOperations: { route: 'Operations', back: 'SubWarehouseAdminDashboard', backParams: { initialTab: 'More' } },
  SubWarehouseStorageLocationDetail: { route: 'StorageLocationDetail', back: 'SubWarehouseStorageInfo' },
  SubWarehouseCapacity: { route: 'Capacity', back: 'SubWarehouseWarehouseOperations' },
  // Part B: operational issues. Report an Issue / Request Submitted need
  // support.ticket.create_own (neither warehouse admin role holds it today), so
  // StorageFlow refuses them and the screens render a not-available note. The
  // App-level key is the Help & Support path ('support' mode).
  // Warehouse Activity absorbed Today's Operations (the Today preset) and Recent
  // Activity; no view code (SPEC_GAPS W4v-4).
  SubWarehouseWarehouseActivity: { route: 'Activity', back: 'SubWarehouseWarehouseOperations', params: { activityPreset: 'All' } },
  SubWarehouseTodayOperations: { route: 'Activity', back: 'SubWarehouseWarehouseOperations', params: { activityPreset: 'Today' } },
  SubWarehouseRecentActivity: { route: 'Activity', back: 'SubWarehouseAdminDashboard', params: { activityPreset: 'Today' } },
  SubWarehouseActivityDetail: { route: 'ActivityDetail', back: 'SubWarehouseWarehouseActivity' },
  SubWarehouseOperationalIssues: { route: 'OperationalIssues', back: 'SubWarehouseWarehouseOperations' },
  SubWarehouseOperationalIssueDetail: { route: 'OperationalIssueDetail', back: 'SubWarehouseOperationalIssues' },
  SubWarehouseReportIssue: { route: 'ReportIssue', back: 'SubWarehouseHelpSupport', params: { reportMode: 'support' } },
  SubWarehouseIssueSubmitted: { route: 'IssueSubmitted', back: 'SubWarehouseHelpSupport', params: { reportMode: 'support' } },
};
/**
 * Legacy Sub customer route keys -> shared CustomersFlow routes (W4). Several
 * keys were aliases of one screen (CustomerList/Customers, CustomerDetail/
 * CustomerDetails, CustomerPurchases/PurchaseHistory, CustomerSupport/
 * SupportHistory). SubWarehouseCustomerActions was removed with the dropped
 * Customer Actions screen (customer.profile.edit is none/none, SPEC_GAPS W4h-1).
 */
const CUSTOMERS_ROUTE_ENTRY: Partial<Record<ScreenName, CustomersRoute>> = {
  SubWarehouseCustomerList: 'CustomersList',
  SubWarehouseCustomers: 'CustomersList',
  SubWarehouseCustomerDetail: 'CustomerDetails',
  SubWarehouseCustomerDetails: 'CustomerDetails',
  SubWarehouseCustomerOrders: 'CustomerOrders',
  SubWarehouseOrderFilters: 'OrderFilters',
  SubWarehouseCustomerPurchases: 'PurchaseHistory',
  SubWarehousePurchaseHistory: 'PurchaseHistory',
  SubWarehousePurchaseFilters: 'PurchaseFilters',
  SubWarehouseCustomerIssues: 'CustomerIssues',
  SubWarehouseCustomerIssueDetail: 'CustomerIssueDetail',
  SubWarehouseCustomerSupport: 'SupportHistory',
  SubWarehouseSupportHistory: 'SupportHistory',
  SubWarehouseCustomerSupportDetail: 'SupportDetail',
};
/**
 * Legacy wallet route keys -> shared WalletFlow routes (W4). Every key still
 * works; SubWarehouseTransactionDetail is TopUpDetails' 'transaction' variant
 * (SubWarehouseTransactionDetailScreen was absorbed) and SubWarehouseDailyCash
 * is the daily cash ledger reached from the finance hub and the daily summary.
 */
const WALLET_ROUTE_ENTRY: Partial<Record<ScreenName, WalletRoute>> = {
  WarehouseWalletOperations: 'WalletOperations',
  SubWarehouseCustomerWallet: 'CustomerWallet',
  SubWarehouseCashTopUp: 'CashTopUp',
  SubWarehouseFiscalTag: 'FiscalTag',
  SubWarehouseConfirmCashTopUp: 'ConfirmCashTopUp',
  SubWarehouseTopUpSuccess: 'TopUpSuccess',
  SubWarehouseTopUpDetails: 'TopUpDetails',
  SubWarehouseTransactionDetail: 'TransactionDetail',
  SubWarehouseTopUpHistory: 'TopUpHistory',
  SubWarehouseDailyCashSummary: 'DailyCashSummary',
  SubWarehouseDailyCash: 'DailyCash',
  SubWarehouseWalletAttention: 'WalletAttention',
};
/**
 * Legacy finance route keys -> shared FinanceFlow routes (W4). Every key still
 * works. SubWarehouseExpenseRecord (a duplicate stub offering an 'Approve'
 * action no rbac code grants) is the read-only ExpenseDetail; SubWarehouseDailyCash
 * stays a WalletFlow key (W4i).
 */
const FINANCE_ROUTE_ENTRY: Partial<Record<ScreenName, FinanceRoute>> = {
  SubWarehouseFinance: 'FinanceHub',
  SubWarehouseRevenue: 'Revenue',
  SubWarehouseRevenueDetail: 'RevenueDetail',
  WarehouseExpenses: 'Expenses',
  WarehouseAddExpense: 'AddExpense',
  WarehouseExpenseDetail: 'ExpenseDetail',
  SubWarehouseExpenseRecord: 'ExpenseDetail',
  SubWarehouseExpenseCategories: 'ExpenseCategories',
  WarehouseFinanceHistory: 'FinanceHistory',
  WarehouseFinanceReports: 'FinanceReports',
  SubWarehouseVouchers: 'Vouchers',
  SubWarehouseVoucherDetail: 'VoucherDetail',
};
/**
 * Legacy notification route keys -> shared NotificationsFlow routes (W4). Every
 * key still works: System Messages and Message History were absorbed into the
 * list (same row shape) and open it on the 'System' / 'Messages' filter tab.
 */
const NOTIFICATIONS_ROUTE_ENTRY: Partial<Record<ScreenName, NotificationsRoute>> = {
  SubWarehouseNotifications: 'Notifications',
  SubWarehouseNotificationDetail: 'NotificationDetail',
  SubWarehouseApprovalAlerts: 'ApprovalAlerts',
  SubWarehouseSystemMessages: 'Notifications',
  SubWarehouseMessageHistory: 'Notifications',
};
/**
 * Legacy account route keys -> shared ProfileFlow routes (W4). Settings opens the
 * hub (Profile, Notification Settings, Security, Change Password, Session &
 * Security, Help & Support, About and Logout are reached from it); Help & Support
 * keeps its own key for the More menu. The warehouse profile keys open the
 * warehouse-facing screens (W4 part B).
 */
const PROFILE_ROUTE_ENTRY: Partial<Record<ScreenName, ProfileRoute>> = {
  SubWarehouseSettings: 'Settings',
  SubWarehouseHelpSupport: 'HelpSupport',
  // Part B: the warehouse-facing profile screens (Profile -> Storage /
  // Operating / Contact / Documents are also reachable inside the flow).
  SubWarehouseProfile: 'WarehouseProfile',
  SubWarehouseWarehouseProfile: 'WarehouseProfile',
  SubWarehouseUserProfile: 'UserProfile',
  SubWarehouseStorageInfo: 'StorageInfo',
  SubWarehouseOperatingInfo: 'OperatingInfo',
  SubWarehouseContact: 'Contact',
  SubWarehouseDocuments: 'Documents',
};
/**
 * The warehouse area a route key opens, for isAreaAvailable; undefined when the
 * key is not gated. Five areas have no API and Staff needs admin.staff.list_view
 * (owner decision 2), and the legacy inventory keys into stock counts and
 * adjustments have no API either (phase 3), so navigate() refuses these keys
 * even if a stale handler or notification still points at one. The screens
 * stay in the code.
 */
function warehouseAreaForScreen(screen: ScreenName): WarehouseArea | undefined {
  if (screen === 'InterWarehouseTransfer' || screen === 'InitiateNewTransfer') return 'interWarehouseTransfers';
  if (STAFF_ROUTE_ENTRY[screen] !== undefined) return 'staff';
  if (PROFILE_ROUTE_ENTRY[screen] === 'Documents') return 'warehouseDocuments';
  const billing = BILLING_ROUTE_ENTRY[screen];
  if (billing !== undefined) return billingRouteArea(billing);
  const inventory = INVENTORY_ROUTE_ENTRY[screen];
  if (inventory !== undefined) return inventoryRouteArea(inventory);
  const storage = STORAGE_ROUTE_ENTRY[screen];
  return storage !== undefined ? storageRouteArea(storage.route) : undefined;
}
/** NotificationsFlow params for a legacy key (detail carries `notification`). */
function notificationsParamsFor(screen: ScreenName, params: Record<string, unknown>): NotificationsRouteParams {
  if (screen === 'SubWarehouseSystemMessages') return { filter: 'System' };
  if (screen === 'SubWarehouseMessageHistory') return { filter: 'Messages' };
  const notification = params['notification'] as NotificationItem | undefined;
  return notification !== undefined ? { notification } : {};
}
/** A route param as a string, or undefined. */
function stringParam(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
const INVENTORY_ROUTE_ENTRY: Record<string, string> = {
  StockLedger: 'M3S06',
  VerifyStock: 'M3S11',
  StockAdjustmentApproval: 'M3S17',
  LowStockAlerts: 'M3S09',
};

interface StackEntry {
  screen: ScreenName;
  params?: Record<string, any>;
  tab?: TabName;
}

export default function App(): React.JSX.Element {
  const [screen, setScreen] = useState<ScreenName>('Splash');
  // Navigation history stack: keeps true chronological breadcrumbs so back buttons
  // always return to the actual prior screen without getting trapped in loops.
  const [history, setHistory] = useState<StackEntry[]>([]);
  const [currentTab, setCurrentTab] = useState<TabName>('Home');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  // Crop picked on create-listing step 1, carried to step 2.
  const [listingDraftCrop, setListingDraftCrop] = useState<ListingCropChoice | null>(null);
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [selectedContentDetail, setSelectedContentDetail] = useState<ContentDetailItem | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupItem | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<CropItem | null>(null);
  const [selectedToolForEdit, setSelectedToolForEdit] = useState<ToolItem | null>(null);
  const [selectedEquipmentForEdit, setSelectedEquipmentForEdit] = useState<EquipmentItem | null>(null);
  const [selectedTreeForEdit, setSelectedTreeForEdit] = useState<TreePlantingItem | null>(null);
  const [selectedMachineryForEdit, setSelectedMachineryForEdit] = useState<MachineryItem | null>(null);
  const [selectedItemForRemove, setSelectedItemForRemove] = useState<RemoveItemData | null>(null);
  const [selectedAuditEntry, setSelectedAuditEntry] = useState<AuditEntry | undefined>(undefined);
  const [auditReportData, setAuditReportData] = useState<AuditReportData | undefined>(undefined);
  const [selectedAuditHistoryRecord, setSelectedAuditHistoryRecord] = useState<any | undefined>(undefined);
  const [selectedPayoutDue, setSelectedPayoutDue] = useState<any | undefined>(undefined);
  const [selectedAdminFarmer, setSelectedAdminFarmer] = useState<FarmerListItem | undefined>(undefined);
  const [adminFarmerActiveTab, setAdminFarmerActiveTab] = useState<FarmerDetailTabType>('Overview');
  const [selectedPendingApp, setSelectedPendingApp] = useState<PendingApplicationItem | undefined>(undefined);
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<OnlineOrderItem | null>(null);
  const [selectedSalesB2B, setSelectedSalesB2B] = useState<B2BAccount | null>(null);
  const [selectedSaleRecord] = useState<any | null>(null);
  const [selectedChannelOrder, setSelectedChannelOrder] = useState<ChannelOrderItem | null>(null);
  const [selectedStatusOrderId, setSelectedStatusOrderId] = useState<string>('ORD-1024');
  const [toast, setToast] = useState<ToastData | null>(null);
  const [params, setParams] = useState<Record<string, any>>({});
  const [marketDays, setMarketDays] = useState<MarketDay[]>(MOCK_DAYS);
  // The admin role the last admin sign-in opened (params.adminRole). Warehouse
  // routes reached from the Sub shell do not all carry it, so remember it for
  // the dev-only demo fallback in useWarehousePermissions.
  const [lastAdminRole, setLastAdminRole] = useState<string | undefined>(undefined);
  // Bumped on every sign-out and every dead session (failed refresh). App never
  // unmounts, so state keyed to the signed-in account (the warehouse permission
  // list below, lastAdminRole) must be dropped explicitly or the next admin to
  // sign in on this device would render with the previous one's.
  const [sessionEpoch, setSessionEpoch] = useState(0);
  useEffect(() => {
    const role = params['adminRole'];
    if (typeof role === 'string') setLastAdminRole(role);
  }, [params]);
  // Permission codes of the signed-in warehouse admin, from GET /v1/auth/me,
  // loaded while the Sub shell or any warehouse route is mounted
  // (shouldLoadWarehousePermissions) and retried until it arrives: the demo
  // sign-in opens the shell without waiting for its token, so a one-shot fetch
  // left `can` deny-all (Receiving: "You do not have permission to view goods
  // receiving"). Until a list arrives makeCan fails closed; in __DEV__ only,
  // after the retries, the role's docs/rbac.json grants stand in (see
  // roles/admin/permissions/warehousePermissions.ts). The server re-checks
  // every action anyway (CLAUDE.md 2.1).
  // The same /auth/me also yields the Sub admin's own warehouse (roles[] ->
  // SUB_WH_ADMIN warehouseId/warehouseName, BR-30); see renderWithSubScope.
  const warehouseSession = useWarehousePermissions({
    enabled: shouldLoadWarehousePermissions(screen, params),
    adminRole: lastAdminRole,
    isDev: __DEV__,
    loadSession: async () => {
      const me = await fetchMe();
      return { permissions: me.permissions ?? [], roles: me.roles ?? [] };
    },
    hasCredentials: hasSessionCredentials,
    sessionKey: sessionEpoch,
  });
  const warehousePermissions = warehouseSession.permissions;
  const warehouseCan = useMemo(() => makeCan(warehousePermissions), [warehousePermissions]);
  // Params for a BillingFlow entry, memoised so the flow does not restart its
  // stack on every App render. An invoice opened from a sale record falls back
  // to that record's invoice number, as the old SubWarehouseInvoiceDetail did.
  const billingParams = useMemo<BillingRouteParams>(() => {
    const invoiceNo = (selectedSaleRecord as { invoiceNo?: unknown } | null)?.invoiceNo;
    return {
      invoiceId:
        typeof params['invoiceId'] === 'string'
          ? params['invoiceId']
          : typeof invoiceNo === 'string'
            ? invoiceNo
            : undefined,
      transaction: params['transaction'],
      review: params['review'],
      layout: params['layout'] === 'history' ? 'history' : undefined,
    };
  }, [params, selectedSaleRecord]);
  // Params for a SalesFlow entry, memoised so the flow does not restart its
  // stack on every App render. A deep link to a sale detail carries flat fields.
  const salesParams = useMemo<SalesRouteParams>(() => {
    const saleId = stringParam(params['saleId']);
    const sale: SaleRecord | undefined =
      (selectedSaleRecord as SaleRecord | null) ??
      (saleId
        ? {
          id: saleId,
          customerName: stringParam(params['customerName']) ?? 'Walk-in Customer',
          customerCode: stringParam(params['customerCode']),
          channel: stringParam(params['channel']) ?? 'Direct Sale',
          dateText: stringParam(params['dateText']) ?? '',
          amount: typeof params['amount'] === 'number' ? params['amount'] : 0,
          status: stringParam(params['status']) ?? 'Completed',
          invoiceNo: stringParam(params['invoiceNo']),
          paymentMethod: stringParam(params['paymentMethod']),
        }
        : undefined);
    return {
      sale,
      customerName: stringParam(params['customerName']),
      customerCode: stringParam(params['customerCode']),
    };
  }, [params, selectedSaleRecord]);
  // Params for a StaffFlow entry, memoised so the flow does not restart its stack.
  const staffParams = useMemo<StaffRouteParams>(
    () => ({
      staff: params['staff'] as StaffMember | undefined,
      attendanceFilter: STAFF_ROUTE_ENTRY[screen]?.filter,
    }),
    [params, screen],
  );
  // Params for a StorageFlow entry, memoised so the flow does not restart its stack.
  const storageParams = useMemo<StorageRouteParams>(
    () => ({
      ...STORAGE_ROUTE_ENTRY[screen]?.params,
      locationId: stringParam(params['locationId']),
      issueId: stringParam(params['issueId']),
      // Old callers passed the whole activity row; the flow wants its id.
      activityId: stringParam(params['activityId']) ?? stringParam((params['activity'] as { id?: unknown } | undefined)?.id),
    }),
    [params, screen],
  );
  // Params for a CustomersFlow entry, memoised so the flow does not restart its
  // stack on every App render. Deep links carry a flat customer name and id;
  // the customer screens look a customer up by its uuid only (a CUS- code
  // shows "not found"). Issue and ticket detail open from their live lists,
  // so flat issueNo / ticketNo deep-link fields are no longer turned into
  // sample records.
  const customersParams = useMemo<CustomersRouteParams>(() => {
    const customerName = stringParam(params['customerName']) ?? stringParam(params['name']);
    const customerId = stringParam(params['customerId']) ?? stringParam(params['id']);
    return {
      customer:
        customerName !== undefined || customerId !== undefined
          ? { name: customerName, id: customerId, code: stringParam(params['customerCode']) ?? customerId }
          : undefined,
      defaultFilter: stringParam(params['defaultFilter']),
    };
  }, [params]);

  // Params for a FinanceFlow entry, memoised so the flow does not restart its
  // stack on every App render. Deep links carry flat revenue / expense fields.
  const financeParams = useMemo<FinanceRouteParams>(() => {
    const revenueId = stringParam(params['revenueId']);
    const expenseId = stringParam(params['expenseId']);
    const amount = params['amount'];
    const expense =
      expenseId !== undefined
        ? {
          expenseId,
          amount: typeof amount === 'number' || typeof amount === 'string' ? amount : undefined,
          category: stringParam(params['category']),
          date: stringParam(params['date']),
          description: stringParam(params['description']),
          paymentMethod: stringParam(params['paymentMethod']),
          vendorPayee: stringParam(params['vendorPayee']),
          warehouse: stringParam(params['warehouse']),
          createdBy: stringParam(params['createdBy']),
          status: stringParam(params['status']),
        }
        : undefined;
    const method = stringParam(params['paymentMethod']);
    return {
      revenue:
        revenueId !== undefined
          ? {
            revenueId,
            finalAmount: stringParam(params['finalAmount']),
            salesChannel: stringParam(params['salesChannel']),
            transactionDate: stringParam(params['transactionDate']),
          }
          : undefined,
      expense,
      // An expense key opened with an expense id is an edit (the form prefills).
      expenseDraft:
        expense !== undefined
          ? {
            expenseId: expense.expenseId,
            amount: String(expense.amount ?? ''),
            category: expense.category ?? '',
            date: expense.date ?? '',
            description: expense.description ?? '',
            paymentMethod: method === 'UPI' || method === 'Bank' ? method : 'Cash',
            vendorPayee: expense.vendorPayee ?? '',
          }
          : undefined,
      isReceiptView: params['isReceiptView'] === 'true' || params['isReceiptView'] === true,
    };
  }, [params]);

  // Params for a WalletFlow entry, memoised so the flow does not restart its
  // stack on every App render. Deep links carry flat customer fields
  // (customerName / name, customerCode / customerId / id, mobile, balance).
  const walletParams = useMemo<WalletRouteParams>(() => {
    const customerName = stringParam(params['customerName']) ?? stringParam(params['name']);
    const customerId =
      stringParam(params['customerCode']) ?? stringParam(params['customerId']) ?? stringParam(params['id']);
    const balance = stringParam(params['balance']) ?? stringParam(params['currentBalance']);
    const category = stringParam(params['category']);
    return {
      customer:
        customerName !== undefined || customerId !== undefined
          ? {
            name: customerName,
            id: customerId,
            mobile: stringParam(params['mobile']),
            balance,
            customerUuid: stringParam(params['customerUuid']),
          }
          : undefined,
      category:
        category === 'pending' || category === 'failed' || category === 'fiscal' || category === 'reconciliation'
          ? category
          : undefined,
    };
  }, [params]);

  const navigate = useCallback(
    (nextScreen: ScreenName, nextParams: Record<string, any> = {}) => {
      const area = warehouseAreaForScreen(nextScreen);
      if (area !== undefined && !isAreaAvailable(area, warehouseCan)) return;
      if (nextScreen === screen) {
        setParams(nextParams);
        return;
      }

      // Sign-in ('AdminMain') and sign-out ('Login') also start a fresh stack, so
      // back from the Sub warehouse dashboard never pops to the Login screen.
      if (resetsHistoryOn(nextScreen)) {
        setHistory([]);
      } else {
        setHistory((prev) => [...prev, { screen, params, tab: currentTab }]);
      }

      setParams(nextParams);
      setScreen(nextScreen);
    },
    [screen, params, currentTab, warehouseCan],
  );

  /**
   * Every admin and warehouse sign-out. Revokes the server session and clears
   * the Keychain tokens (api/auth `logout`), drops the account's cached state,
   * then leaves for `target`. If the server call fails (offline) the tokens are
   * still cleared and the user still leaves; see utils/signOut.ts. Navigating
   * alone, as these used to, kept the session alive and a cold start
   * (SplashScreen) restored the previous admin.
   */
  const signOutTo = useCallback(
    (target: 'Login' | 'Welcome') => {
      void endSession({
        revoke: logout,
        forget: () => {
          setLastAdminRole(undefined);
          setSessionEpoch((n) => n + 1);
        },
        leave: () => navigate(target),
      });
    },
    [navigate],
  );

  /**
   * Every Sub warehouse render site goes through here (BR-30): the screens
   * get the admin's own warehouse from GET /auth/me, and render only once it
   * is known. Loading and "no warehouse" states belong to WarehouseScopeGate;
   * there is no fallback warehouse.
   */
  const renderWithSubScope = (render: (scope: WarehouseScope) => React.ReactNode): React.ReactNode => (
    <WarehouseScopeGate
      subScope={warehouseSession.subScope}
      failed={warehouseSession.subScopeFailed}
      onRetry={warehouseSession.retry}
      onSignOut={() => signOutTo('Login')}
    >
      {render}
    </WarehouseScopeGate>
  );
  /** Routes shared by both warehouse roles: Main keeps the all-warehouses scope, Sub is gated. */
  const renderWithScope = (isMain: boolean, render: (scope: WarehouseScope) => React.ReactNode): React.ReactNode =>
    isMain ? render(MAIN_WAREHOUSE_SCOPE) : renderWithSubScope(render);

  /**
   * Sub warehouse modules outside storage-ops that own an activity record or a
   * Today metric tile (StorageFlow onOpenModule). Same targets the old Today's
   * Operations / Recent Activity / Warehouse Activity handlers used.
   */
  const openSubWarehouseModule = useCallback(
    (module: ActivityModule) => {
      if (module === 'receiving') navigate('SubWarehouseAdminDashboard', { initialTab: 'Receiving', initialReceivingSubView: 'incoming_shipments' });
      else if (module === 'verification' && isAreaAvailable('stockCounts', warehouseCan))
        navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S10' });
      else if (module === 'storage') navigate('SubWarehouseStorageInfo');
      else if (module === 'orders') navigate('SubWarehouseAdminDashboard', { showOrders: true });
      else if (module === 'cash') navigate('SubWarehouseCashTopUp');
      else if (module === 'staff' && isAreaAvailable('staff', warehouseCan)) navigate('SubWarehouseTodayAttendance');
      else if (module === 'qc') {
        const notification: NotificationItem = {
          id: 'qc-1',
          category: 'quality',
          title: 'QC Required',
          message: 'Tomato batch GR-1024 is waiting for quality inspection.',
          timestamp: '10 minutes ago',
          isRead: false,
          reference: 'GR-1024',
          target: 'ReviewReceiving',
        };
        navigate('SubWarehouseNotificationDetail', { notification });
      }
    },
    [navigate],
  );

  /**
   * Bottom-tab handler shared by the Sub warehouse flows rendered from this file.
   * Every tab lands on the Sub shell with the params its tab needs, so a tab tap
   * never falls through to an unknown screen key (the old 'ReceivingQcScreen'
   * key had no render branch and dropped the admin into the farmer MainTabs).
   * More opens the warehouse More screen; flows whose More differs pass their own.
   */
  const openWarehouseTab = useCallback(
    (tab: WarehouseTab) => {
      if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
      else if (tab === 'Receiving') navigate('SubWarehouseAdminDashboard', { initialTab: 'Receiving', initialReceivingSubView: 'overview' });
      else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S01' });
      else if (tab === 'More') navigate('WarehouseMore');
    },
    [navigate],
  );

  const goBack = useCallback(
    (fallbackScreen?: ScreenName) => {
      if (history.length > 0) {
        setHistory((prev) => {
          const nextHistory = [...prev];
          const previous = nextHistory.pop();
          if (previous) {
            setScreen(previous.screen);
            setParams(previous.params || {});
            if (previous.tab && previous.screen === 'MainTabs') {
              setCurrentTab(previous.tab);
            }
          }
          return nextHistory;
        });
      } else {
        if (fallbackScreen) {
          setScreen(fallbackScreen);
          setParams({});
          return;
        }
        // Auth screens go to Welcome; a warehouse screen goes to its dashboard
        // (not the farmer tabs); a root screen stays put.
        const target = emptyHistoryBackTarget(screen) as ScreenName | null;
        if (target !== null) {
          setScreen(target);
          setParams({});
        }
      }
    },
    [history, screen],
  );

  useEffect(() => {
    const onBackPress = () => {
      if (screen === 'Splash' || screen === 'Welcome') {
        return false;
      }
      if (screen === 'MainTabs' && history.length === 0) {
        if (currentTab !== 'Home') {
          setCurrentTab('Home');
          return true;
        }
        return false;
      }
      // A root screen with nothing behind it (e.g. the admin dashboard right
      // after sign-in): let Android leave the app instead of swallowing the press.
      if (history.length === 0 && emptyHistoryBackTarget(screen) === null) {
        return false;
      }
      goBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [screen, currentTab, history, goBack]);

  useEffect(() => {
    // Wires the shared API client's silent-refresh path to farmer's own
    // Keychain-backed store. Replaces what the old private roles/farmer/api/client.ts
    // used to hardcode internally (it imported ./storage/tokenStorage directly).
    configureTokenStorage(tokenStorage);
    setOnAuthFailure(() => {
      // The client has already cleared the tokens; drop the account's cached
      // state too. Admin and warehouse routes go to Login, everything else to
      // Welcome (utils/navigationSession.ts).
      setLastAdminRole(undefined);
      setSessionEpoch((n) => n + 1);
      setParams({});
      setScreen((prev) => {
        setHistory([]);
        return authFailureTarget(prev);
      });
    });
    return () => {
      setOnAuthFailure(null);
    };
  }, []);

  // Splash and Welcome are full-bleed photo screens: no header, dark chrome.
  const isAuthLanding = screen === 'Splash' || screen === 'Welcome';

  // The admin shell AdminMain renders, from the role the server returned at
  // sign-in. null (unknown or missing) renders no admin shell: AdminMain falls
  // through to the 'Unsupported' branch below instead of the Super Admin one.
  const adminShell = adminShellForRole(params['adminRole']);

  const isSubWarehouse =
    screen.startsWith('SubWarehouse') ||
    screen.startsWith('MainWarehouse') ||
    Boolean(params && (params['adminRole'] === 'SUB_WH_ADMIN' || params['adminRole'] === 'MAIN_WH_ADMIN'));

  // One TanStack Query cache per session: sessionEpoch changes on every
  // sign-out, and the provider then drops the previous account's cache.
  // CustomerMainApp mounts its own provider below; the nearest one wins.
  // (Children left at their old indentation to keep this diff reviewable.)
  return (
    <SessionQueryProvider sessionKey={sessionEpoch}>
    <SafeAreaView style={[styles.screen, isAuthLanding && styles.screenSplash]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={isAuthLanding ? SPLASH_DARK : isSubWarehouse ? '#F0562A' : colors.primaryPressed}
      />

      <TohfaToast toast={toast} onDismiss={() => setToast(null)} />

      <View style={styles.content}>
        {screen === 'Splash' ? (
          <SplashScreen onNavigate={(s, p) => navigate(s, p)} />
        ) : screen === 'Welcome' ? (
          <WelcomeScreen onNavigate={(s) => navigate(s)} />
        ) : screen === 'Login' ? (
          <LoginScreen onNavigate={(s, p) => navigate(s, p)} />
        ) : screen === 'RoleSelection' ? (
          <RoleSelectionScreen onNavigate={(s) => navigate(s)} />
        ) : screen === 'Register' ? (
          <RegistrationFlowScreen onNavigate={(s, p) => navigate(s, p)} />
        ) : screen === 'Otp' ? (
          <OtpScreen
            mobile={String(params['mobile'] ?? '')}
            challengeId={typeof params['challengeId'] === 'string' ? params['challengeId'] : undefined}
            resendAvailableAt={
              typeof params['resendAvailableAt'] === 'string'
                ? params['resendAvailableAt']
                : undefined
            }
            attemptsRemaining={
              typeof params['attemptsRemaining'] === 'number'
                ? params['attemptsRemaining']
                : undefined
            }
            purpose={
              (params['purpose'] as 'LOGIN' | 'PASSWORD_RESET') ?? 'LOGIN'
            }
            linkToken={typeof params['linkToken'] === 'string' ? params['linkToken'] : undefined}
            onNavigate={(s, p) => navigate(s, p)}
          />
        ) : screen === 'ForgotPassword' ? (
          <ForgotPasswordScreen onNavigate={(s, p) => navigate(s, p)} />
        ) : screen === 'ResetPassword' ? (
          <ResetPasswordScreen
            challengeId={String(params['challengeId'] ?? '')}
            code={String(params['code'] ?? '')}
            onNavigate={(s) => navigate(s)}
          />
        ) : screen === 'PasswordChangedSuccess' ? (
          <PasswordChangedSuccessScreen onNavigate={(s) => navigate(s)} />
        ) : screen === 'ApplicationStatus' ? (
          <ApplicationStatusScreen
            applicationId={String(params['applicationId'] ?? 'DEMO-APP-001')}
            onNavigate={(s) => navigate(s)}
          />
        ) : screen === 'AdminMain' && adminShell !== null ? (
          adminShell === 'TOHFA_ADMIN' ? (
            <TohfaAdminDashboardScreen
              onSignOut={() => signOutTo('Welcome')}
              onNavigate={(s) => navigate(s as ScreenName)}
            />
          ) : adminShell === 'FARMER_ADMIN' ? (
            <FarmerAdminDashboardScreen
              onSignOut={() => signOutTo('Welcome')}
              onNavigate={(s) => navigate(s as ScreenName)}
            />
          ) : adminShell === 'MAIN_WH_ADMIN' ? (
            <MainWarehouseAdminDashboardScreen
              onSignOut={() => signOutTo('Welcome')}
              onNavigate={(s) => navigate(s as ScreenName)}
            />
          ) : adminShell === 'SUB_WH_ADMIN' ? (
            renderWithSubScope((subScope) => (
              <SubWarehouseAdminDashboardScreen
                scope={subScope}
                can={warehouseCan}
                onSignOut={() => signOutTo('Welcome')}
                onNavigate={(s, p) => navigate(s as ScreenName, p)}
                onBack={goBack}
                initialTab={params['initialTab'] as any}
                initialReceivingSubView={params['initialReceivingSubView'] as any}
                initialInventoryScreen={params['initialInventoryScreen'] as any}
                initialShowOrders={!!params['showOrders']}
                initialOrdersScreen={params['ordersInitialScreen'] as any}
                initialOrdersParams={params['ordersInitialParams'] as any}
              />
            ))
          ) : (
            // adminShell is 'SUPER_ADMIN' here: null never reaches this branch.
            <SuperAdminDashboardScreen
              onSignOut={() => signOutTo('Welcome')}
              onNavigate={(s) => navigate(s as ScreenName)}
            />
          )
        ) : screen === 'SuperAdminDashboard' ? (
          <SuperAdminDashboardScreen
            onSignOut={() => signOutTo('Welcome')}
            onNavigate={(s) => navigate(s as ScreenName)}
          />
        ) : screen === 'TohfaAdminDashboard' ? (
          <TohfaAdminDashboardScreen
            initialTab={params['initialTab'] === 'Profile' ? 'Profile' : undefined}
            onSignOut={() => signOutTo('Welcome')}
            onNavigate={(s) => navigate(s as ScreenName)}
          />
        ) : screen === 'FarmerAdminDashboard' ? (
          <FarmerAdminDashboardScreen
            onSignOut={() => signOutTo('Welcome')}
            onNavigate={(s) => navigate(s as ScreenName)}
          />
        ) : screen === 'MainWarehouseAdminDashboard' ? (
          <MainWarehouseAdminDashboardScreen
            onSignOut={() => signOutTo('Welcome')}
            onNavigate={(s) => navigate(s as ScreenName)}
          />
        ) : screen === 'SubWarehouseAdminDashboard' || screen === 'SubWarehouseTodayOverview' || screen === 'SubWarehouseRecentActivity' ? (
          // 'SubWarehouseTodayOverview' kept as a key: that screen was absorbed by the shell's Home (FINAL_LIST 26).
          params?.['adminRole'] === 'MAIN_WH_ADMIN' || lastAdminRole === 'MAIN_WH_ADMIN' ? (
            <MainWarehouseAdminDashboardScreen
              onSignOut={() => signOutTo('Welcome')}
              onNavigate={(s) => navigate(s as ScreenName)}
            />
          ) : (
            renderWithSubScope((subScope) => (
              <SubWarehouseAdminDashboardScreen
                scope={subScope}
                can={warehouseCan}
                initialTab={params?.initialTab as any}
                initialReceivingSubView={params?.initialReceivingSubView as any}
                initialInventoryScreen={params?.initialInventoryScreen as any}
                initialShowOrders={!!params?.showOrders}
                initialOrdersScreen={params?.ordersInitialScreen as any}
              initialOrdersParams={params?.ordersInitialParams as any}
              initialShowTodayOverview={screen === 'SubWarehouseTodayOverview' || !!params?.showTodayOverview}
                onSignOut={() => signOutTo('Welcome')}
                onNavigate={(s, p) => navigate(s as ScreenName, p)}
                onBack={goBack}
              />
            ))
          )
        ) : screen === 'SubWarehouseOverview' ? (
          // Was SubWarehouseOverviewScreen: the shared single-warehouse WarehouseSnapshotScreen (W4), scope-locked.
          renderWithSubScope((subScope) => (
            <HomeFlow
              scope={subScope}
              can={warehouseCan}
              initialScreen="WarehouseSnapshot"
              onBack={goBack}
              onTabChange={(tab) => {
                // More from the Snapshot opens Wallet Operations (unchanged); every other tab is the shared handler.
                if (tab === 'More') navigate('WarehouseWalletOperations');
                else openWarehouseTab(tab);
              }}
              onOpenTarget={(target) => {
                if (target === 'Inventory') navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S01' });
                else if (target === 'ReceivingDashboard') navigate('SubWarehouseAdminDashboard', { initialTab: 'Receiving', initialReceivingSubView: 'overview' });
                else if (target === 'Orders') navigate('SubWarehouseAdminDashboard', { showOrders: true });
                else if (target === 'Operations') navigate('SubWarehouseWarehouseOperations');
              }}
            />
          ))
        ) : NOTIFICATIONS_ROUTE_ENTRY[screen] !== undefined ? (
          // The notification screens live in the shared warehouse/notifications area
          // (W4); each old notification key opens NotificationsFlow on the matching
          // route. System Messages / Message History are filter tabs of the list.
          renderWithSubScope((subScope) => (
            <NotificationsFlow
              scope={subScope}
              can={warehouseCan}
              initialScreen={NOTIFICATIONS_ROUTE_ENTRY[screen]}
              initialParams={notificationsParamsFor(screen, params)}
              onBack={goBack}
              onTabChange={openWarehouseTab}
              onOpenTarget={(target) => {
                if (target === 'ReviewReceiving') navigate('SubWarehouseReviewReceiving');
                else if (target === 'Receiving') navigate('SubWarehouseAdminDashboard', { initialTab: 'Receiving', initialReceivingSubView: 'overview' });
                else if (target === 'Stock') navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S02' });
                else if (target === 'Orders') navigate('SubWarehouseAdminDashboard', { showOrders: true });
                else if (target === 'Wallet') navigate('WarehouseWalletOperations');
                else navigate('SubWarehouseReturnsIssues');
              }}
              onOpenAlertRecord={(alert) => {
                if (alert.record === 'ExpenseRecord') navigate('SubWarehouseExpenseRecord');
                else if (alert.record === 'GoodsReceipt') navigate('SubWarehouseGoodsReceiptDetail');
                else if (alert.record === 'LowStock') navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S09' });
                else if (alert.record === 'Transfer' && isAreaAvailable('interWarehouseTransfers', warehouseCan))
                  navigate('InterWarehouseTransfer', { transferScope: 'sub' });
              }}
            />
          ))
        ) : screen === 'SubWarehouseReviewReceiving' ? (
          // The one-page review had no API; a receipt is recorded against a real
          // purchase order, so this entry opens the incoming shipments to pick one.
          renderWithSubScope((subScope) => (
            <ReceivingFlow scope={subScope} can={warehouseCan} initialScreen="Shipments" onBack={goBack} />
          ))
        ) : screen === 'SubWarehouseNeedsAttention' ? (
          // Shared dashboard-home-more NeedsAttentionScreen through HomeFlow (W4), own warehouse only.
          renderWithSubScope((subScope) => (
            <HomeFlow
              scope={subScope}
              can={warehouseCan}
              initialScreen="NeedsAttention"
              initialParams={{ category: params['category'] as AttentionFilter | undefined }}
              onBack={goBack}
            />
          ))
        ) : SALES_ROUTE_ENTRY[screen] !== undefined ? (
          // The direct sales screens live in the shared warehouse/sales-direct area
          // (W4); each old 'SubWarehouseXxx' key opens SalesFlow on the matching route.
          renderWithScope(params?.['adminRole'] === 'MAIN_WH_ADMIN' || lastAdminRole === 'MAIN_WH_ADMIN', (scope) => (
            <SalesFlow
              scope={scope}
              can={warehouseCan}
              initialScreen={SALES_ROUTE_ENTRY[screen]}
              initialParams={salesParams}
              onBack={goBack}
              onTabChange={openWarehouseTab}
              onNavigateToNotifications={() => navigate('SubWarehouseNotifications')}
              onNavigateToNeedsAttention={(category) => navigate('SubWarehouseNeedsAttention', category ? { category } : {})}
            />
          ))
        ) : screen === 'SubWarehouseB2BSales' || screen === 'SubWarehouseHorecaSales' ? (
          renderWithScope(params?.['adminRole'] === 'MAIN_WH_ADMIN' || lastAdminRole === 'MAIN_WH_ADMIN', (scope) => (
            <ChannelSalesScreen
              scope={scope}
              can={warehouseCan}
              channel={channelForRoute(screen)}
              onBack={goBack}
              onSelectOrder={(ord) => {
                setSelectedChannelOrder(ord);
                navigate(ord.channel === 'B2B' ? 'SubWarehouseB2BDetail' : 'SubWarehouseHorecaDetail');
              }}
            />
          ))
        ) : screen === 'SubWarehouseB2BDetail' || screen === 'SubWarehouseHorecaDetail' ? (
          renderWithScope(params?.['adminRole'] === 'MAIN_WH_ADMIN' || lastAdminRole === 'MAIN_WH_ADMIN', (scope) => (
            <ChannelOrderDetailScreen
              scope={scope}
              can={warehouseCan}
              channel={channelForRoute(screen)}
              // Only reuse the selection if it belongs to this route's channel.
              order={selectedChannelOrder?.channel === channelForRoute(screen) ? selectedChannelOrder : undefined}
              onBack={goBack}
              onNavigate={(next, nextParams) => navigate(next as ScreenName, nextParams)}
              onViewInvoice={(invoiceId) => navigate('SubWarehouseInvoiceDetail', { invoiceId })}
              onViewStatus={(orderId) => {
                setSelectedStatusOrderId(orderId);
                navigate('SubWarehouseOrderStatusHistory');
              }}
            />
          ))
        ) : screen === 'SubWarehouseOrderStatusHistory' ? (
          renderWithSubScope((subScope) => (
            <OrderStatusHistoryScreen
              scope={subScope}
              can={warehouseCan}
              orderId={selectedStatusOrderId || (params?.orderId as string) || 'ORD-1024'}
              onNavigate={(nextScreen) => navigate(nextScreen as ScreenName)}
              onBack={goBack}
            />
          ))
        ) : PROFILE_ROUTE_ENTRY[screen] !== undefined ? (
          // The account screens live in the shared warehouse/profile-settings area
          // (W4); 'SubWarehouseSettings' opens the hub, 'SubWarehouseHelpSupport'
          // the help centre, 'SubWarehouseProfile' / 'SubWarehouseStorageInfo' / ...
          // the warehouse-facing screens (part B; a location's detail stays here).
          // Report an issue is offered by the screen only with
          // support.ticket.create_own (none for warehouse admins today).
          renderWithSubScope((subScope) => (
            <ProfileFlow
              scope={subScope}
              can={warehouseCan}
              initialScreen={PROFILE_ROUTE_ENTRY[screen]}
              onBack={goBack}
              onLogout={() => signOutTo('Login')}
              onReportIssue={() => navigate('SubWarehouseReportIssue')}
              onSelectStorageLocation={(id) => navigate('SubWarehouseStorageLocationDetail', { locationId: id })}
              onTabChange={openWarehouseTab}
            />
          ))
        ) : screen === 'WarehouseMore' ? (
          renderWithSubScope((subScope) => (
            <MoreScreen
              scope={subScope}
              can={warehouseCan}
              onBack={goBack}
              onNavigateToDashboard={() => navigate('SubWarehouseAdminDashboard')}
              onTabChange={openWarehouseTab}
              onNavigateToNotifications={() => navigate('SubWarehouseNotifications')}
              onNavigateToCustomers={() => navigate('SubWarehouseCustomerList')}
              // Wallet and Profile rows: same targets as the Sub shell's More tab
              // (they only showed an "Opening ..." alert here before).
              onNavigateToWallet={() => navigate('WarehouseWalletOperations')}
              onNavigateToProfile={() => navigate('SubWarehouseProfile')}
              onNavigateToBilling={() => navigate('SubWarehouseBillingHub')}
              onNavigateToOrders={() => navigate('SubWarehouseCustomerOrders')}
              onNavigateToSales={() => navigate('SubWarehouseSales')}
              onNavigateToReturns={() => navigate('SubWarehouseReturnsIssues')}
              onNavigateToReturnHistory={() => navigate('SubWarehouseReturnHistory')}
              onNavigateToFinance={() => navigate('SubWarehouseFinance')}
              onNavigateToReports={() => navigate('SubWarehouseReports')}
              onNavigateToStaff={isAreaAvailable('staff', warehouseCan) ? () => navigate('SubWarehouseStaff') : undefined}
              onNavigateToAttendance={isAreaAvailable('staff', warehouseCan) ? () => navigate('SubWarehouseAttendance') : undefined}
              onNavigateToWarehouseOperations={() => navigate('SubWarehouseWarehouseOperations')}
              onNavigateToStorageLocations={() => navigate('SubWarehouseStorageInfo')}
              onNavigateToSettings={() => navigate('SubWarehouseSettings')}
              onLogout={() => signOutTo('Login')}
            />
          ))
        ) : CUSTOMERS_ROUTE_ENTRY[screen] !== undefined ? (
          // The customer screens live in the shared warehouse/customers area (W4);
          // each old 'SubWarehouseXxx' key opens CustomersFlow on the matching route.
          // Wallet, cash top-up, new sale, order detail and RMA stay App routes.
          renderWithSubScope((subScope) => (
            <CustomersFlow
              scope={subScope}
              can={warehouseCan}
              initialScreen={CUSTOMERS_ROUTE_ENTRY[screen]}
              initialParams={customersParams}
              onBack={goBack}
              onTabChange={openWarehouseTab}
              onOpenExternal={(target: CustomersExternalRoute, p: CustomersRouteParams) => {
                const customerName = p.customer?.name;
                const customerCode = p.customer?.code;
                if (target === 'CustomerWallet') {
                  // The wallet reads the live summary by the customer uuid (plan phase 6).
                  navigate('SubWarehouseCustomerWallet', {
                    customerName,
                    name: customerName,
                    id: customerCode,
                    customerId: customerCode,
                    customerUuid: p.customer?.id,
                    mobile: p.customer?.mobileMasked,
                  });
                } else if (target === 'CashTopUp') {
                  // Real uuid + masked mobile only: the wizard looks the wallet up by uuid.
                  navigate('SubWarehouseCashTopUp', {
                    customerName,
                    customerCode,
                    customerUuid: p.customer?.id,
                    mobile: p.customer?.mobileMasked,
                  });
                } else if (target === 'NewSale') {
                  navigate('SubWarehouseNewSale', { customerName });
                } else if (target === 'OrderDetail') {
                  // The order detail looks the order up by its uuid.
                  navigate('SubWarehouseOrderDetail', { orderId: p.orderId, orderNo: p.orderNo, customerName });
                } else if (target === 'RmaDetail') {
                  // A customer issue is a return request: open the live return by its uuid.
                  navigate('SubWarehouseRmaDetail', { returnId: p.issue?.id });
                }
              }}
              onNavigateToNotifications={() => navigate('SubWarehouseNotifications')}
            />
          ))
        ) : screen === 'WarehouseCustomerSearch' ? (
          renderWithSubScope((subScope) => (
            <CustomerSearchScreen
              scope={subScope}
              can={warehouseCan}
              onBack={goBack}
              onNavigateToWallet={(cust) => {
                navigate('SubWarehouseCustomerWallet', {
                  customerName: cust.name,
                  name: cust.name,
                  id: cust.code,
                  customerId: cust.code,
                  mobile: cust.phone || '+91 98765 43210',
                  balance: cust.balance,
                });
              }}
              onSelectCustomer={(custOrName: any, id?: string) => {
                if (typeof custOrName === 'string') {
                  navigate('SubWarehouseCustomerDetail', { customerName: custOrName, customerId: id });
                } else {
                  navigate('SubWarehouseCustomerWallet', {
                    customerName: custOrName.name,
                    name: custOrName.name,
                    id: custOrName.code,
                    customerId: custOrName.code,
                    mobile: custOrName.phone || '+91 98765 43210',
                    balance: custOrName.balance,
                  });
                }
              }}
              onNavigateToCashTopUp={(cust) =>
                navigate('SubWarehouseCashTopUp', cust ? {
                  customerName: cust.name,
                  customerCode: cust.code,
                  currentBalance: cust.balance,
                } : undefined)
              }
            />
          ))
        ) : FINANCE_ROUTE_ENTRY[screen] !== undefined ? (
          // The finance screens live in the shared warehouse/finance-expenses area
          // (W4); each old finance key opens FinanceFlow on the matching route.
          renderWithSubScope((subScope) => (
            <FinanceFlow
              scope={subScope}
              can={warehouseCan}
              initialScreen={FINANCE_ROUTE_ENTRY[screen]}
              initialParams={financeParams}
              onBack={goBack}
              onTabChange={openWarehouseTab}
              onNavigateToNotifications={() => navigate('SubWarehouseNotifications')}
              onOpenWallet={() => navigate('WarehouseWalletOperations')}
              onNavigateToCustomerOrders={() => navigate('SubWarehouseCustomerOrders')}
              onNavigateToInvoiceList={() => navigate('SubWarehouseInvoiceList')}
            />
          ))
        ) : WALLET_ROUTE_ENTRY[screen] !== undefined ? (
          // The wallet & cash top-up screens live in the shared warehouse/wallet-cashtopup
          // area (W4); each old wallet key opens WalletFlow on the matching route.
          renderWithSubScope((subScope) => (
            <WalletFlow
              scope={subScope}
              can={warehouseCan}
              initialScreen={WALLET_ROUTE_ENTRY[screen]}
              initialParams={walletParams}
              onBack={goBack}
              onTabChange={openWarehouseTab}
              onNavigateToNotifications={() => navigate('SubWarehouseNotifications')}
              onNavigateToProfile={() => navigate('SubWarehouseProfile')}
            />
          ))
        ) : BILLING_ROUTE_ENTRY[screen] !== undefined ? (
          // The billing & invoice screens live in the shared warehouse/billing-invoices
          // area (W4); each old 'SubWarehouseXxx' key opens BillingFlow on the matching route.
          renderWithSubScope((subScope) => (
            <BillingFlow
              scope={subScope}
              can={warehouseCan}
              initialScreen={BILLING_ROUTE_ENTRY[screen]}
              initialParams={billingParams}
              onBack={goBack}
              onTabChange={openWarehouseTab}
              onNavigateToNotifications={() => navigate('SubWarehouseNotifications')}
            />
          ))
        ) : screen === 'SubWarehouseTaskActionCenter' || screen === 'SubWarehouseTaskDetail' ? (
          // Shared task screens through HomeFlow (W4): the list opens Task Details inside the
          // flow; an order task hands its order id to the Sub order detail. No task rbac code (ungated).
          renderWithSubScope((subScope) => (
            <HomeFlow
              scope={subScope}
              can={warehouseCan}
              initialScreen={screen === 'SubWarehouseTaskDetail' ? 'TaskDetail' : 'TaskActionCenter'}
              initialParams={screen === 'SubWarehouseTaskDetail' ? { id: (params['taskId'] as string | undefined) ?? 'TSK-001' } : undefined}
              onBack={goBack}
              onOpenTarget={(target, ref) => {
                if (target === 'OrderDetail') navigate('SubWarehouseOrderDetail', ref ? { orderNo: ref } : {});
              }}
            />
          ))
        ) : screen === 'SubWarehouseOrderDetail' ? (
          renderWithSubScope((subScope) => (
            <OrdersModule
              scope={subScope}
              can={warehouseCan}
              initialScreen="M5S04"
              // An order uuid (customer screens send orderId); a task's sample
              // reference in orderNo still gets "not found" (plan phase 14).
              initialParams={{
                orderId: stringParam(params['orderId']) ?? stringParam(params['orderNo']),
                customerName: stringParam(params['customerName']),
              }}
              onBack={goBack}
              onTabChange={openWarehouseTab}
            />
          ))
        ) : screen === 'SubWarehouseGoodsReceiptDetail' ? (
          // The alert carries no receipt id, so this entry opens the live Receiving History.
          renderWithSubScope((subScope) => (
            <ReceivingFlow scope={subScope} can={warehouseCan} initialScreen="History" onBack={goBack} />
          ))
        ) : RETURNS_ROUTE_ENTRY[screen] !== undefined ? (
          // The RMA screens live in the shared warehouse/returns-rma area (W4);
          // each old 'SubWarehouseXxx' key opens ReturnsFlow on the matching route.
          renderWithSubScope((subScope) => (
            <ReturnsFlow
              scope={subScope}
              can={warehouseCan}
              initialScreen={RETURNS_ROUTE_ENTRY[screen]}
              initialParams={params}
              onBack={goBack}
              onTabChange={openWarehouseTab}
              onNavigateToNotifications={() => navigate('SubWarehouseNotifications')}
            />
          ))
        ) : STAFF_ROUTE_ENTRY[screen] !== undefined ? (
          // The staff & attendance screens live in the shared warehouse/staff-attendance
          // area (W4); each old key opens StaffFlow on the matching route.
          renderWithSubScope((subScope) => (
            <StaffFlow
              scope={subScope}
              can={warehouseCan}
              initialScreen={STAFF_ROUTE_ENTRY[screen]?.route}
              initialParams={staffParams}
              onBack={goBack}
              onTabChange={openWarehouseTab}
              onAssignDelivery={() => {
                navigate('SubWarehouseAdminDashboard', {
                  showOrders: true,
                  initialTab: 'Home',
                  ordersInitialScreen: 'M5S02',
                  ordersInitialParams: { fulfillment: 'Delivery' },
                });
              }}
            />
          ))
        ) : STORAGE_ROUTE_ENTRY[screen] !== undefined ? (
          // The storage-ops screens live in the shared warehouse/storage-ops area
          // (W4, M4 parts A and B); each old key opens StorageFlow on the matching route.
          renderWithSubScope((subScope) => (
            <StorageFlow
              scope={subScope}
              can={warehouseCan}
              initialScreen={STORAGE_ROUTE_ENTRY[screen]?.route}
              initialParams={storageParams}
              onBack={() =>
                navigate(STORAGE_ROUTE_ENTRY[screen]?.back ?? 'SubWarehouseWarehouseOperations', STORAGE_ROUTE_ENTRY[screen]?.backParams)
              }
              onOpenNotifications={() => navigate('SubWarehouseNotifications')}
              onSupportRequestDone={() => navigate('SubWarehouseSettings')}
              onOpenModule={openSubWarehouseModule}
              onViewStock={() => navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S02' })}
              onViewProductDetail={() => navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S02' })}
              onTabChange={(tab) => {
                if (tab === 'Home') navigate('SubWarehouseAdminDashboard', { initialTab: 'Home' });
                else if (tab === 'Receiving') navigate('SubWarehouseAdminDashboard', { initialTab: 'Receiving', initialReceivingSubView: 'incoming_shipments' });
                else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S01' });
                // More from the hub itself returns to the dashboard's More tab, as the old hub did.
                else if (tab === 'More')
                  navigate(screen === 'SubWarehouseWarehouseOperations' ? 'SubWarehouseAdminDashboard' : 'SubWarehouseWarehouseOperations', screen === 'SubWarehouseWarehouseOperations' ? { initialTab: 'More' } : {});
              }}
            />
          ))
        ) : screen === 'SubWarehouseReports' ? (
          renderWithSubScope((subScope) => (
            <ReportsScreen
              scope={subScope}
              can={warehouseCan}
              canExport={warehouseCan('report.export.file')}
              onBack={goBack}
              onTabChange={openWarehouseTab}
              onNavigateToNotifications={() => navigate('SubWarehouseNotifications')}
            />
          ))
        ) : screen === 'WarehouseOverview' ? (
          // Main-only warehouse-admin flow (W4): overview -> city detail ->
          // settings / capacity / performance / documents, overview -> manage SWAs.
          // Route-guarded on warehouse.all.view (Manage SWAs: admin.sub_wh_admin.create).
          // Comparison opens the consolidated stock ledger, as the old tile fallback did.
          <WarehouseAdminFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={warehouseCan}
            onBack={goBack}
            onNavigateComparison={() => navigate('StockLedger')}
          />
        ) : screen === 'StockLedger' ||
          screen === 'VerifyStock' ||
          screen === 'StockAdjustmentApproval' ||
          screen === 'LowStockAlerts' ? (
          // The Main-only inventory screens were folded into the shared
          // warehouse/inventory area; the old keys open the flow on the survivor.
          <InventoryFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={warehouseCan}
            initialScreen={INVENTORY_ROUTE_ENTRY[screen]}
            initialParams={params}
            onBack={goBack}
            onInitiateTransfer={
              isAreaAvailable('interWarehouseTransfers', warehouseCan) ? () => navigate('InterWarehouseTransfer') : undefined
            }
          />
        ) : screen === 'InterWarehouseTransfer' || screen === 'InitiateNewTransfer' ? (
          // Shared transfers flow (W4). The key is reached from the Main
          // inventory flow and from a Sub transfer alert; the Sub entries pass
          // { transferScope: 'sub' } so the list shows only incoming transfers.
          // Initiate is refused by the flow without transfer.inter_warehouse.initiate.
          renderWithScope(params['transferScope'] !== 'sub', (scope) => (
            <TransfersFlow
              scope={scope}
              can={warehouseCan}
              initialScreen={screen === 'InitiateNewTransfer' ? 'InitiateNewTransfer' : 'Transfers'}
              onBack={goBack}
            />
          ))
        ) : screen === 'WarehouseSettings' ? (
          // Main-only warehouse settings now live in the shared profile-settings
          // area; ProfileFlow opens them for the Main scope (the screen is
          // route-guarded on warehouse.capacity.set).
          <ProfileFlow
            scope={MAIN_WAREHOUSE_SCOPE}
            can={warehouseCan}
            initialScreen="WarehouseSettings"
            onBack={goBack}
          />
        ) : screen === 'SalesChannelOverview' ? (
          <SalesChannelOverviewScreen
            onBack={goBack}
            onSelectChannel={(channel) => {
              if (channel === 'online') navigate('SalesOnlineOrders');
              else if (channel === 'market') navigate('SalesMarketDay');
              else if (channel === 'horeca') navigate('SalesHorecaOrders');
              else if (channel === 'b2b') navigate('SalesB2BOrders');
            }}
            onOpenFulfillment={() => navigate('SalesFulfillmentAssignment')}
            onOpenReturns={() => navigate('SalesReturnsRefunds')}
          />
        ) : screen === 'SalesOnlineOrders' ? (
          <SalesOnlineOrdersScreen
            onBack={goBack}
            onSelectOrder={(ord) => {
              setSelectedSalesOrder(ord);
              navigate('SalesFulfillmentAssignment');
            }}
            onOpenInvoice={(ord) => {
              setSelectedSalesOrder(ord);
              navigate('SalesInvoice');
            }}
          />
        ) : screen === 'SalesMarketDay' ? (
          <SalesMarketDayScreen onBack={goBack} />
        ) : screen === 'SalesHorecaOrders' ? (
          <SalesHorecaOrdersScreen onBack={goBack} />
        ) : screen === 'SalesB2BOrders' ? (
          <SalesB2BOrdersScreen
            onBack={goBack}
            onOpenInvoice={(acc) => {
              setSelectedSalesB2B(acc);
              navigate('SalesInvoice');
            }}
          />
        ) : screen === 'SalesFulfillmentAssignment' ? (
          <SalesFulfillmentAssignmentScreen
            onBack={goBack}
            orderNumber={selectedSalesOrder?.orderNumber ?? 'ORD-20260910-0091'}
            customerName={selectedSalesOrder?.customerName ?? 'Divya Ramesh'}
            onNavigateToInvoice={() => navigate('SalesInvoice')}
          />
        ) : screen === 'SalesInvoice' ? (
          <SalesInvoiceScreen
            onBack={goBack}
            orderNumber={
              selectedSalesOrder?.orderNumber ??
              (selectedSalesB2B ? 'B2B-20260909-001' : 'ORD-20260909-0084')
            }
            customerName={
              selectedSalesOrder?.customerName ??
              (selectedSalesB2B ? selectedSalesB2B.name : 'Ramesh P.')
            }
          />
        ) : screen === 'SalesReturnsRefunds' ? (
          <SalesReturnsRefundsScreen onBack={goBack} />
        ) : screen === 'FinancialDashboard' ? (
          <FinancialDashboardScreen
            onBack={goBack}
            onNavigate={(s) => navigate(s as ScreenName)}
          />
        ) : screen === 'ScheduleAudit' ? (
          <FinancialDashboardScreen
            title="Schedule Audit"
            subtitle="Platform-wide audit schedule & compliance overview · September 2026"
            onBack={goBack}
            onNavigate={(s) => navigate(s as ScreenName)}
          />
        ) : screen === 'AdminSupport' ? (
          <AdminSupportScreen onBack={goBack} />
        ) : screen === 'ReportBuilder' ? (
          <ReportBuilderScreen onBack={goBack} />
        ) : screen === 'PLStatement' ? (
          <PLStatementScreen
            onBack={goBack}
          />
        ) : screen === 'FarmerPayoutDues' ? (
          <FarmerPayoutDuesScreen
            onBack={goBack}
            onNavigateToProcessing={(due) => {
              if (due) setSelectedPayoutDue(due);
              navigate('PayoutProcessing');
            }}
          />
        ) : screen === 'PayoutProcessing' ? (
          <PayoutProcessingScreen
            onBack={goBack}
            payoutAmount={selectedPayoutDue?.amount ?? 15400}
            farmerName={selectedPayoutDue?.farmerName ?? 'Ramasamy S.'}
            farmerId={selectedPayoutDue?.farmId ?? '#TOHFA-F-00189'}
            zone={selectedPayoutDue?.location ?? 'Coonoor'}
            onApprovedSuccess={goBack}
          />
        ) : screen === 'Expenses' ? (
          <ExpensesScreen
            onBack={goBack}
            onNavigateToAddExpense={() => navigate('AddExpense')}
          />
        ) : screen === 'AddExpense' ? (
          <AddExpenseScreen
            onBack={goBack}
            onSuccess={goBack}
          />
        ) : screen === 'GSTAccounting' ? (
          <GSTAccountingScreen
            onBack={goBack}
            onNavigateToReport={() => navigate('GSTFilingReportDetail')}
            onNavigateToLedger={() => navigate('BasicAccountingLedger')}
          />
        ) : screen === 'GSTFilingReportDetail' ? (
          <GSTFilingReportDetailScreen
            onBack={goBack}
          />
        ) : screen === 'BasicAccountingLedger' ? (
          <BasicAccountingLedgerScreen
            onBack={goBack}
            onNavigateToAddEntry={() => navigate('AddManualJournalEntry')}
          />
        ) : screen === 'AddManualJournalEntry' ? (
          <AddManualJournalEntryScreen
            onBack={goBack}
            onSuccess={goBack}
          />
        ) : screen === 'AuditCalendar' ? (
          <AuditCalendarScreen
            onBack={goBack}
            onAddAudit={() => navigate('ScheduleNewAudit')}
            onSelectAudit={(entry) => {
              setSelectedAuditEntry(entry);
              navigate('AuditInspection');
            }}
            onBulkReschedule={() => navigate('BulkRescheduleAudits')}
            onResolveCompliance={() => navigate('ComplianceAlertResolution')}
          />
        ) : screen === 'ScheduleNewAudit' ? (
          <ScheduleNewAuditScreen
            onBack={goBack}
            onSuccess={() => navigate('AuditCalendar')}
          />
        ) : screen === 'AuditInspection' ? (
          <AuditInspectionScreen
            onBack={goBack}
            farmerName={selectedAuditEntry?.farmerName ?? 'Vijay Anand'}
            farmId={selectedAuditEntry?.farmId ?? '#TOHFA-F-00234'}
            zone={selectedAuditEntry?.location ?? 'Ooty'}
            onSubmitted={(data: AuditReportData) => {
              setAuditReportData(data);
              navigate('AuditReport');
            }}
          />
        ) : screen === 'AuditReport' ? (
          <AuditReportScreen
            onBack={goBack}
            report={auditReportData}
            onNavigateToPdfPreview={() => navigate('AuditPdfPreview')}
            onNavigateToAuditHistory={() => navigate('FarmerAuditHistory')}
          />
        ) : screen === 'FarmerAuditHistory' ? (
          <FarmerAuditHistoryScreen
            onBack={goBack}
            farmerName={selectedAuditEntry?.farmerName ?? 'Vijay Anand'}
            farmId={selectedAuditEntry?.farmId ?? '#TOHFA-F-00234'}
            zone={selectedAuditEntry?.location ?? 'Ooty'}
            onSelectAuditRecord={(record: any) => {
              setSelectedAuditHistoryRecord(record);
              navigate('AuditDetailRecord');
            }}
          />
        ) : screen === 'AuditDetailRecord' ? (
          <AuditDetailRecordScreen
            onBack={goBack}
            farmerName={selectedAuditEntry?.farmerName ?? 'Vijay Anand'}
            farmId={selectedAuditEntry?.farmId ?? '#TOHFA-F-00234'}
            record={selectedAuditHistoryRecord}
          />
        ) : screen === 'BulkRescheduleAudits' ? (
          <BulkRescheduleAuditsScreen
            onBack={goBack}
            onSuccess={() => navigate('AuditCalendar')}
          />
        ) : screen === 'AuditPdfPreview' ? (
          <AuditPdfPreviewScreen
            onBack={goBack}
            farmerName={selectedAuditEntry?.farmerName ?? 'Vijay Anand'}
            farmId={selectedAuditEntry?.farmId ?? '#TOHFA-F-00234'}
            score={auditReportData?.totalScore ?? 86}
          />
        ) : screen === 'ComplianceAlertResolution' ? (
          <ComplianceAlertResolutionScreen
            onBack={goBack}
            onSuccess={() => navigate('AuditCalendar')}
          />
        ) : screen === 'AdminAllFarmers' ? (
          <AdminAllFarmersScreen
            onBack={goBack}
            onNavigateTab={(tab) => {
              if (tab === 'Dashboard') {
                navigate('TohfaAdminDashboard');
              } else if (tab === 'Sales') {
                navigate('SalesChannelOverview');
              } else if (tab === 'Reports') {
                navigate('ReportBuilder');
              } else if (tab === 'Profile') {
                // Same as the Profile tab on the other admin shells: the
                // dashboard's Profile tab (AdminProfileScreen, which owns sign-out).
                navigate('TohfaAdminDashboard', { initialTab: 'Profile' });
              }
            }}
            onSelectFarmer={(f) => {
              setSelectedAdminFarmer(f);
              setAdminFarmerActiveTab('Overview');
              navigate('AdminFarmerDetail');
            }}
          />
        ) : screen === 'AdminFarmerDetail' ? (
          <AdminFarmerDetailScreen
            farmer={selectedAdminFarmer ?? DEMO_ALL_FARMERS[0]!}
            initialTab={adminFarmerActiveTab}
            onTabChange={setAdminFarmerActiveTab}
            onBack={goBack}
            onEdit={(tab) => {
              setAdminFarmerActiveTab(tab);
              navigate('AdminEditFarmer');
            }}
            onOpenFarmMap={() => {
              setAdminFarmerActiveTab('Farm');
              navigate('AdminFarmMap');
            }}
            onOpenRatingScorecard={() => {
              setAdminFarmerActiveTab('Ratings');
              navigate('AdminRatingScorecard');
            }}
            onOpenKycReview={() => {
              setAdminFarmerActiveTab('KYC');
              navigate('AdminKycReview');
            }}
          />
        ) : screen === 'AdminEditFarmer' ? (
          <AdminEditFarmerScreen
            farmer={selectedAdminFarmer ?? DEMO_ALL_FARMERS[0]!}
            initialTab={adminFarmerActiveTab}
            onBack={goBack}
            onSave={(updated, tab) => {
              setSelectedAdminFarmer(updated);
              setAdminFarmerActiveTab(tab);
              setToast({
                type: 'approve',
                title: 'Changes Saved',
                message: `${tab} details for ${updated.name} updated successfully.`,
              });
              goBack();
            }}
            onNavigateToEditCategories={() => navigate('AdminEditRatingCategories')}
          />
        ) : screen === 'AdminEditRatingCategories' ? (
          <AdminEditRatingCategoriesScreen
            farmer={selectedAdminFarmer ?? DEMO_ALL_FARMERS[0]!}
            onBack={goBack}
            onSave={(score, tier) => {
              if (selectedAdminFarmer) {
                setSelectedAdminFarmer({
                  ...selectedAdminFarmer,
                  rating: score,
                  ratingTier: tier,
                });
              }
              goBack();
            }}
          />
        ) : screen === 'AdminFarmMap' ? (
          <AdminFarmMapScreen
            farmer={selectedAdminFarmer ?? DEMO_ALL_FARMERS[0]!}
            onBack={goBack}
          />
        ) : screen === 'AdminRatingScorecard' ? (
          <AdminRatingScorecardScreen
            farmer={selectedAdminFarmer ?? DEMO_ALL_FARMERS[0]!}
            onBack={goBack}
            onOpenComplianceTiers={() => navigate('AdminComplianceTiers')}
            onEditCategories={() => navigate('AdminEditRatingCategories')}
          />
        ) : screen === 'AdminComplianceTiers' ? (
          <AdminComplianceTiersScreen
            onBack={goBack}
          />
        ) : screen === 'AdminKycReview' ? (
          <AdminKycReviewScreen
            farmer={selectedAdminFarmer ?? DEMO_ALL_FARMERS[0]!}
            onBack={goBack}
            onGoToCertificationVerification={() => navigate('AdminCertVerification')}
          />
        ) : screen === 'AdminCertVerification' ? (
          <AdminCertVerificationScreen
            farmer={selectedAdminFarmer ?? DEMO_ALL_FARMERS[0]!}
            onBack={goBack}
            onVerified={goBack}
            onUnverified={goBack}
          />
        ) : screen === 'AdminPendingApplications' ? (
          <AdminPendingApplicationsScreen
            onBack={goBack}
            onSelectApplication={(item) => {
              setSelectedPendingApp(item);
              navigate('AdminApplicationDetail');
            }}
          />
        ) : screen === 'AdminApplicationDetail' ? (
          <AdminApplicationDetailScreen
            application={selectedPendingApp ?? DEMO_PENDING_APPLICATIONS[0]!}
            onBack={goBack}
            onApprove={() => navigate('AdminApplicationApprove')}
            onReject={() => navigate('AdminApplicationReject')}
            onRequestMoreInfo={() => navigate('AdminApplicationRequestInfo')}
          />
        ) : screen === 'AdminApplicationApprove' ? (
          <AdminApplicationApproveScreen
            application={selectedPendingApp ?? DEMO_PENDING_APPLICATIONS[0]!}
            onBack={goBack}
            onConfirmApprove={() => {
              const app = selectedPendingApp ?? DEMO_PENDING_APPLICATIONS[0]!;
              setToast({
                type: 'approve',
                title: 'Application Approved',
                message: `${app.name} onboarded to Tohfa Platform successfully.`,
              });
              goBack();
            }}
          />
        ) : screen === 'AdminApplicationReject' ? (
          <AdminApplicationRejectScreen
            application={selectedPendingApp ?? DEMO_PENDING_APPLICATIONS[0]!}
            onBack={goBack}
            onConfirmReject={(reason) => {
              const app = selectedPendingApp ?? DEMO_PENDING_APPLICATIONS[0]!;
              setToast({
                type: 'reject',
                title: 'Application Rejected',
                message: `Notice sent to ${app.name}: ${reason}`,
              });
              goBack();
            }}
          />
        ) : screen === 'AdminApplicationRequestInfo' ? (
          <AdminApplicationRequestInfoScreen
            application={selectedPendingApp ?? DEMO_PENDING_APPLICATIONS[0]!}
            onBack={goBack}
            onConfirmRequest={() => {
              const app = selectedPendingApp ?? DEMO_PENDING_APPLICATIONS[0]!;
              setToast({
                type: 'info_request',
                title: 'Info Request Sent',
                message: `Checklist sent to ${app.name} via SMS and notification.`,
              });
              goBack();
            }}
          />
        ) : screen === 'MarketPricingHome' ? (
          <MarketPricingHomeScreen
            onBack={goBack}
            onNavigateToFairPrice={() => navigate('FairPriceCeiling')}
            onNavigateToMarketDay={() => navigate('MarketDaySchedule')}
            onNavigateToListingApproval={() => navigate('ListingApprovalQueue')}
          />
        ) : screen === 'FairPriceCeiling' ? (
          <FairPriceCeilingScreen
            onBack={goBack}
            onUpdatePrice={(item) => navigate('UpdateFairPrice')}
            onBulkUpdate={() => navigate('BulkPriceUpdate')}
            onViewHistory={(item) => navigate('PriceHistory')}
          />
        ) : screen === 'UpdateFairPrice' ? (
          <UpdateFairPriceScreen
            onBack={goBack}
            onSave={(newPrice) => {
              // Save logic here
              goBack();
            }}
          />
        ) : screen === 'BulkPriceUpdate' ? (
          <BulkPriceUpdateScreen
            onBack={goBack}
          />
        ) : screen === 'PriceHistory' ? (
          <PriceHistoryScreen
            onBack={goBack}
          />
        ) : screen === 'MarketDaySchedule' ? (
          <MarketDayScheduleScreen
            onBack={goBack}
            onAddMarketDay={() => navigate('AddMarketDay')}
            onToggle={(id, value) => {
              // Handle toggle
            }}
            days={MOCK_DAYS}
            onDaysChange={(updatedDays) => {
              // Handle days change
            }}
          />
        ) : screen === 'AddMarketDay' ? (
          <AddMarketDayScreen
            onBack={goBack}
            onSave={(marketDay) => {
              // Save market day logic here
              navigate('MarketDaySchedule');
            }}
          />
        ) : screen === 'ListingApprovalQueue' ? (
          <ListingApprovalQueueScreen
            onBack={goBack}
            onApprove={(id) => {
              // Handle approve
            }}
            onCounter={(id) => {
              // Handle counter
            }}
            onReject={(id) => {
              // Handle reject
            }}
          />
        ) : screen === 'CustomerMain' ? (
          <CustomerMainApp onSignOut={() => signOutTo('Welcome')} />
        ) : screen === 'Unsupported' || screen === 'AdminMain' ? (
          // 'AdminMain' reaches here only when adminShell is null (an unknown or
          // missing role): fail closed with the unsupported-account message and
          // its sign-out, never an admin shell.
          <View style={styles.unsupportedContainer}>
            <Icon name="block" size={48} color={colors.danger} style={{ marginBottom: 16 }} />
            <Text style={styles.unsupportedText}>{t('farmer.app.unsupportedRole')}</Text>
            <Text style={{ fontSize: typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: 10, marginBottom: 24, paddingHorizontal: 20 }}>
              This mobile application is built for Farmers and Customers. Administrative and Warehouse accounts operate through the Web Admin Portal.
            </Text>
            <Pressable
              style={({ pressed }) => [
                {
                  backgroundColor: pressed ? colors.primaryPressed : colors.primary,
                  paddingHorizontal: 28,
                  paddingVertical: 14,
                  borderRadius: 12,
                  elevation: 2,
                },
              ]}
              onPress={() => signOutTo('Welcome')}
            >
              <Text style={{ color: colors.white, fontWeight: '700', fontSize: typography.body }}>
                Sign Out & Return to Login
              </Text>
            </Pressable>
          </View>
        ) : screen === 'Certifications' ? (
          <CertificationsScreen
            onBack={goBack}
            onNavigateToAddCertification={() => navigate('AddCertification')}
            onNavigateToEditCertification={(certification) => {
              setSelectedCertification(certification);
              navigate('EditCertification');
            }}
          />
        ) : screen === 'AddCertification' ? (
          <AddCertificationScreen
            onSuccess={goBack}
            onCancel={goBack}
          />
        ) : screen === 'EditCertification' && selectedCertification ? (
          <EditCertificationScreen
            certification={selectedCertification}
            onCancel={() => navigate('Certifications')}
            // The screen has already saved / deleted through the API; the list reloads on mount.
            onSaved={() => navigate('Certifications')}
            onDeleted={() => navigate('Certifications')}
          />
        ) : screen === 'CreateListing' ? (
          <CreateListingScreen
            onCancel={goBack}
            onNext={(crop) => {
              setListingDraftCrop(crop);
              navigate('CreateListingStep2');
            }}
          />
        ) : screen === 'CreateListingStep2' ? (
          <CreateListingStep2Screen
            crop={listingDraftCrop}
            onCancel={goBack}
            onBack={goBack}
            onSuccess={() => {
              // Land on My Listings (it fetches on mount, so the new listing is
              // on it) with the create flow dropped from history: Back goes to
              // the Marketing tab, not to an emptied step 2. The draft crop is
              // cleared last so step 2 never re-renders without it.
              setHistory([{ screen: 'MainTabs', params: {}, tab: 'Listings' }]);
              setCurrentTab('Listings');
              setParams({});
              setScreen('MyListings');
              setListingDraftCrop(null);
            }}
          />
        ) : screen === 'CounterOffer' ? (
          <CounterOfferScreen
            listing={selectedListing}
            listingId={
              typeof params['listingId'] === 'string' ? params['listingId'] : selectedListing?.id
            }
            // The screen we return to re-fetches on mount, so it shows the new
            // status. selectedListing is left as-is (the next open overwrites it):
            // clearing it here would re-render this screen as "no longer open"
            // for a frame before the back navigation lands.
            onSuccess={() => goBack()}
            onCancel={goBack}
          />
        ) : screen === 'ListingDetail' ? (
          <ListingDetailScreen listing={selectedListing} onBack={goBack} />
        ) : screen === 'FMBSketch' ? (
          <FMBSketchScreen
            onNavigateBack={goBack}
            onNavigateToFieldContext={(farmId) => navigate('FieldContext', { farmId })}
          />
        ) : screen === 'FieldContext' ? (
          <FieldContextScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : ''}
            onNavigateBack={goBack}
            onNavigateToZones={(farmId) => {
              if (params['returnTo'] === 'UploadNewSoilTest' || params['returnTo'] === 'NewSoilTest') {
                goBack();
              } else {
                navigate('Zones', { farmId });
              }
            }}
          />
        ) : screen === 'Zones' ? (
          <ZonesScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : ''}
            onNavigateBack={goBack}
            onSave={goBack}
          />
        ) : screen === 'PersonalDetails' ? (
          <PersonalDetailsScreen onBack={goBack} />
        ) : screen === 'Notifications' ? (
          <NotificationsScreen
            onBack={goBack}
            onNavigateToCounterOffer={(listingId) => {
              // Only the id is known here; CounterOfferScreen resolves the real
              // listing from the farmer's own listings (no GET /listings/{id}).
              setSelectedListing(null);
              if (listingId) {
                navigate('CounterOffer', { listingId });
              } else {
                setCurrentTab('Listings');
                navigate('MainTabs');
              }
            }}
          />
        ) : screen === 'AuditResult' ? (
          <AuditResultScreen
            onBack={goBack}
            auditId={typeof params['auditId'] === 'string' ? params['auditId'] : undefined}
          />
        ) : screen === 'Audits' ? (
          <AuditsScreen
            onBack={goBack}
            onNavigateToResult={(auditId) => navigate('AuditResult', { auditId })}
          />
        ) : screen === 'CropManagement' ? (
          <CropManagementScreen
            onBack={goBack}
            onNavigateToInputManagement={() => navigate('InputManagement')}
            onNavigateToSoilManagement={() => navigate('SoilManagement')}
            onNavigateToPestManagement={() => navigate('PestManagement')}
          />
        ) : screen === 'InputManagement' ? (
          <InputManagementScreen
            onBack={goBack}
            onNavigateToLogFertigation={(crop) => {
              if (crop) setSelectedCrop(crop);
              navigate('LogFertigation');
            }}
            onNavigateToLogPestTreatment={(crop) => {
              if (crop) setSelectedCrop(crop);
              navigate('LogPestTreatment');
            }}
            onNavigateToLogInput={(crop, inputType) => {
              if (crop) setSelectedCrop(crop);
              if (inputType === 'Fertigation') {
                navigate('LogFertigation');
              } else if (inputType === 'Pest Treatment') {
                navigate('LogPestTreatment');
              } else {
                navigate('AddInputApplied', { initialInputType: inputType });
              }
            }}
            onNavigateToFullHistory={() => navigate('CropInputsApplied')}
          />
        ) : screen === 'LogFertigation' ? (
          <LogFertigationScreen
            crop={selectedCrop}
            onBack={goBack}
            onSave={() => goBack('InputManagement')}
          />
        ) : screen === 'LogPestTreatment' ? (
          <LogPestTreatmentScreen
            crop={selectedCrop}
            onBack={goBack}
            onSave={() => goBack('InputManagement')}
          />
        ) : screen === 'PestManagement' ? (
          <PestManagementScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : undefined}
            onBack={goBack}
            onNavigateToSchedule={(farmId) => navigate('TreatmentSchedule', { farmId })}
            onNavigateToPestLibrary={(farmId) => navigate('PestLibrary', { farmId })}
            onNavigateToWeatherRisk={(farmId) => navigate('WeatherRiskAnalytics', { farmId })}
          />
        ) : screen === 'PestLibrary' ? (
          <PestLibraryScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : undefined}
            onBack={goBack}
            onNavigateToSchedule={() => {
              navigate('TreatmentSchedule', { farmId: params['farmId'] });
            }}
          />
        ) : screen === 'TreatmentSchedule' ? (
          <TreatmentScheduleScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : undefined}
            onBack={goBack}
          />
        ) : screen === 'WeatherRiskAnalytics' ? (
          <WeatherRiskAnalyticsScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : undefined}
            onBack={goBack}
          />
        ) : screen === 'FarmManagement' ? (
          <FarmManagementScreen
            onBack={() => goBack('MainTabs')}
            onNavigateToAudits={() => navigate('Audits')}
            onNavigateToDiary={() => navigate('FarmDiary')}
            onNavigateToCertifications={() => navigate('Certifications')}
            onNavigateToProduceCalendar={() => navigate('ProduceCalendar')}
            onNavigateToWeather={() => navigate('Weather')}
            onNavigateToCalendar={() => navigate('TohfaCalendar')}
            onNavigateToActiveCrops={() => navigate('ActiveCrops')}
            onNavigateToCropManagement={() => navigate('CropManagement')}
            onNavigateToAttendance={() => navigate('DailyAttendance')}
            onNavigateToWorkforce={() => navigate('Workforce')}
            onNavigateToLivestock={() => navigate('Livestock')}
            onNavigateToDairyProduce={() => navigate('DairyProduce')}
            onNavigateToLearningHub={() => navigate('LearningHub')}
            onNavigateToSoilManagement={() => navigate('SoilManagement')}
          />
        ) : screen === 'DairyProduce' ? (
          <DairyProduceScreen onBack={goBack} />
        ) : screen === 'ProduceCalendar' ? (
          <ProduceCalendarScreen
            onBack={() => goBack('FarmManagement')}
            onNavigateToNewCrop={() => navigate('NewCrop')}
            onNavigateToCropDetail={(item) => {
              setSelectedCrop(item);
              navigate('CropDetail');
            }}
          />
        ) : screen === 'CropDetail' ? (
          <CropDetailScreen
            crop={selectedCrop}
            onBack={() => goBack('ProduceCalendar')}
            onEdit={() => navigate('NewCrop')}
            onNavigateToMilestones={() => navigate('CropMilestones')}
            onNavigateToDiary={() => navigate('FarmDiary')}
            onNavigateToInputs={() => navigate('CropInputsApplied')}
            onNavigateToWorkforce={() => navigate('CropWorkforceHours')}
            onNavigateToNPK={() => navigate('CropNPKContribution')}
          />
        ) : screen === 'CropMilestones' ? (
          <CropMilestonesScreen
            crop={selectedCrop}
            onBack={() => goBack('CropDetail')}
          />
        ) : screen === 'CropDiaryEntries' ? (
          <CropDiaryEntriesScreen
            crop={selectedCrop}
            onBack={() => goBack('CropDetail')}
            onNewEntry={() => navigate('AddInputApplied', { fromDiary: '1', initialInputType: 'Fertigation' })}
          />
        ) : screen === 'CropInputsApplied' ? (
          <CropInputsAppliedScreen
            crop={selectedCrop}
            onBack={goBack}
            onNewInput={() => navigate('AddInputApplied')}
          />
        ) : screen === 'AddInputApplied' ? (
          <AddInputAppliedScreen
            crop={selectedCrop}
            initialInputType={params['initialInputType'] as 'Fertigation' | 'Pest Treatment' | undefined}
            onBack={goBack}
            onSave={goBack}
          />
        ) : screen === 'CropWorkforceHours' ? (
          <CropWorkforceHoursScreen
            crop={selectedCrop}
            onBack={() => goBack('CropDetail')}
          />
        ) : screen === 'CropNPKContribution' ? (
          <CropNPKContributionScreen
            crop={selectedCrop}
            onBack={() => goBack('CropDetail')}
          />
        ) : screen === 'NewCrop' ? (
          <NewCropScreen
            onBack={() => goBack('ProduceCalendar')}
            onCancel={() => goBack('ProduceCalendar')}
            onSaveCrop={() => {
              // NewCropScreen already persisted the crop via createFarmCrop();
              // ProduceCalendarScreen re-fetches from the API when it remounts.
              goBack('ProduceCalendar');
            }}
          />
        ) : screen === 'Livestock' ? (
          <LivestockScreen
            onBack={goBack}
            onNavigateToAddAnimal={() => navigate('RegisterAnimal')}
            onNavigateToAnimalDetail={(animal) =>
              navigate('AnimalDetail', {
                animalId: animal.id,
                animalName: animal.name,
                animalCode: animal.code,
                species: animal.type,
                breed: animal.breed,
                gender: animal.gender,
                age: animal.age,
                statusBadge: animal.statusBadge,
              })
            }
          />
        ) : screen === 'AnimalDetail' ? (
          <AnimalDetailScreen
            animalId={typeof params['animalId'] === 'string' ? params['animalId'] : 'a1'}
            animalName={typeof params['animalName'] === 'string' ? params['animalName'] : 'Lakshmi'}
            animalCode={typeof params['animalCode'] === 'string' ? params['animalCode'] : 'C-014'}
            species={typeof params['species'] === 'string' ? params['species'] : 'Cattle'}
            breed={typeof params['breed'] === 'string' ? params['breed'] : 'Jersey cross'}
            gender={typeof params['gender'] === 'string' ? params['gender'] : 'Female'}
            age={typeof params['age'] === 'string' ? params['age'] : '4 yr'}
            statusBadge={typeof params['statusBadge'] === 'string' ? params['statusBadge'] : 'Fully Organic'}
            onBack={goBack}
            onNavigateToEdit={(animalData) => navigate('EditAnimal', animalData || {})}
            onNavigateToSale={() =>
              navigate('SaleTransferCull', {
                animalId: params['animalId'] || 'a1',
                animalName: params['animalName'] || 'Lakshmi',
                animalCode: params['animalCode'] || 'C-014',
              })
            }
          />
        ) : screen === 'EditAnimal' ? (
          <EditAnimalScreen
            initialAnimal={params as any}
            onBack={goBack}
            onCancel={goBack}
            onSave={() => goBack()}
          />
        ) : screen === 'SaleTransferCull' ? (
          <SaleTransferCullScreen
            animalId={typeof params['animalId'] === 'string' ? params['animalId'] : 'a1'}
            animalName={typeof params['animalName'] === 'string' ? params['animalName'] : 'Lakshmi'}
            animalCode={typeof params['animalCode'] === 'string' ? params['animalCode'] : 'C-014'}
            onBack={goBack}
            onSuccess={() => navigate('Livestock')}
          />
        ) : screen === 'RegisterAnimal' ? (
          <RegisterAnimalScreen
            initialAnimal={params as any}
            onBack={goBack}
            onCancel={goBack}
            onSave={() => goBack()}
          />
        ) : screen === 'Workforce' ? (
          <WorkforceScreen
            onBack={goBack}
            onNavigateToAddWorker={(fid) => navigate('AddWorker', { farmId: fid })}
            onNavigateToTimesheet={() => navigate('DailyAttendance')}
            onNavigateToPayroll={() => navigate('Payroll')}
            onNavigateToWorkerDetail={(id, name, role) =>
              navigate('WorkerDetail', { workerId: id, workerName: name, workerRole: role })
            }
          />
        ) : screen === 'Payroll' ? (
          <PayrollScreen
            onBack={goBack}
            onNavigateToWorkerDetail={(id, name) =>
              navigate('WorkerDetail', { workerId: id, workerName: name })
            }
          />
        ) : screen === 'WorkerDetail' ? (
          <WorkerDetailScreen
            workerId={typeof params['workerId'] === 'string' ? params['workerId'] : 'w1'}
            workerName={typeof params['workerName'] === 'string' ? params['workerName'] : 'Murugan R.'}
            workerRole={
              typeof params['workerRole'] === 'string'
                ? params['workerRole']
                : 'Field Worker · Daily wage'
            }
            onBack={goBack}
            onNavigateToEditWorker={(workerData) => navigate('AddWorker', workerData || {})}
          />
        ) : screen === 'AddWorker' ? (
          <AddWorkerScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : undefined}
            initialWorker={params as any}
            onBack={goBack}
            onCancel={goBack}
            onSave={() => goBack()}
          />
        ) : screen === 'FarmDiary' ? (
          <FarmDiaryScreen
            onBack={goBack}
            onNavigateToNewEntry={() => navigate('NewFarmDiaryEntry')}
            onNavigateToCalendar={() => navigate('DiaryCalendar')}
          />
        ) : screen === 'DiaryCalendar' ? (
          <DiaryCalendarScreen
            onBack={goBack}
          />
        ) : screen === 'NewFarmDiaryEntry' ? (
          <NewFarmDiaryEntryScreen
            crop={selectedCrop}
            onBack={goBack}
            onCancel={() => navigate('FarmDiary')}
            onNext={(data) => {
              // `navigate` replaces `params` with its second argument, so the
              // accumulated entry state must be passed forward explicitly.
              navigate('NewFarmDiaryEntryStep2', {
                ...params,
                plotId: data.plotId,
                plotName: data.plotName,
                farmCropId: data.farmCropId, // undefined clears a stale pick
                cropName: data.cropName,
                date: data.date,
              });
            }}
          />
        ) : screen === 'NewFarmDiaryEntryStep2' ? (
          <NewFarmDiaryEntryStep2Screen
            crop={selectedCrop}
            categoryKey={typeof params['categoryKey'] === 'string' ? params['categoryKey'] : undefined}
            onChangeCategory={goBack}
            onBack={goBack}
            onCancel={() => navigate('FarmDiary')}
            onNext={(entryData) => {
              navigate('NewFarmDiaryEntryStep3', {
                ...params,
                categoryKey: entryData.categoryKey,
                categoryName: entryData.categoryName,
                subActivityKey: entryData.subActivityKey,
                subActivityName: entryData.subActivityName,
              });
            }}
          />
        ) : screen === 'NewFarmDiaryEntryStep3' ? (
          // Ids are passed through without fallbacks: a missing plotId/categoryKey/
          // subActivityKey is a navigation bug that Step 3 surfaces, not something to mock.
          <NewFarmDiaryEntryStep3Screen
            crop={selectedCrop}
            plotId={typeof params['plotId'] === 'string' ? params['plotId'] : undefined}
            farmCropId={typeof params['farmCropId'] === 'string' ? params['farmCropId'] : undefined}
            categoryKey={typeof params['categoryKey'] === 'string' ? params['categoryKey'] : undefined}
            subActivityKey={typeof params['subActivityKey'] === 'string' ? params['subActivityKey'] : undefined}
            entryCategory={typeof params['categoryName'] === 'string' ? params['categoryName'] : undefined}
            entrySubActivity={typeof params['subActivityName'] === 'string' ? params['subActivityName'] : undefined}
            fieldZone={typeof params['plotName'] === 'string' ? params['plotName'] : undefined}
            cropName={typeof params['cropName'] === 'string' ? params['cropName'] : undefined}
            onBack={goBack}
            onCancel={() => navigate('FarmDiary')}
            onDone={() => {
              if (selectedCrop) {
                navigate('CropDiaryEntries');
              } else {
                navigate('FarmDiary');
              }
            }}
            onSave={() => {
              if (selectedCrop) {
                navigate('CropDiaryEntries');
              } else {
                navigate('FarmDiary');
              }
            }}
          />
        ) : screen === 'FarmRatings' ? (
          <FarmRatingsScreen onNavigateBack={goBack} />
        ) : screen === 'SoilManagement' ? (
          <SoilManagementScreen
            onBack={goBack}
            onNavigateToSoilTestRecords={(farmId) => navigate('SoilTestRecords', { farmId })}
            onNavigateToSoilHealthTracker={(farmId) => navigate('SoilHealthTracker', { farmId })}
            onNavigateToSoilTypeClassification={(farmId) => navigate('SoilTypeClassification', { farmId })}
            onNavigateToAmendments={(farmId) => navigate('SoilAmendmentsLog', { farmId })}
            onNavigateToCropRotation={(farmId) => navigate('CropRotation', { farmId })}
            onNavigateToMoistureTracking={(farmId) => navigate('SoilMoistureTracking', { farmId })}
            onNavigateToErosionConservation={(farmId) => navigate('ErosionConservation', { farmId })}
            onNavigateToExportReports={(farmId) => navigate('ExportSoilReports', { farmId })}
            onNavigateToNewSoilTest={(farmId) => navigate('UploadNewSoilTest', { farmId })}
          />
        ) : screen === 'SoilTestRecords' ? (
          <SoilTestRecordsScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : ''}
            onBack={goBack}
            onNavigateToRecordDetail={() => navigate('SoilTest', { farmId: params['farmId'] })}
            onUploadNewTest={() => navigate('UploadNewSoilTest', { farmId: params['farmId'] })}
          />
        ) : screen === 'SoilHealthTracker' ? (
          <SoilHealthTrackerScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : ''}
            onBack={goBack}
          />
        ) : screen === 'SoilTypeClassification' ? (
          <SoilTypeClassificationScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : ''}
            onBack={goBack}
          />
        ) : screen === 'SoilAmendmentsLog' ? (
          <SoilAmendmentsLogScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : ''}
            onBack={goBack}
            onLogAmendment={() => navigate('CreateSoilAmendment', { farmId: params['farmId'] })}
          />
        ) : screen === 'CreateSoilAmendment' || screen === 'LogSoilAmendment' ? (
          <CreateSoilAmendmentScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : ''}
            plotId={typeof params['plotId'] === 'string' ? params['plotId'] : undefined}
            onBack={goBack}
            onSave={goBack}
          />
        ) : screen === 'CropRotation' ? (
          <CropRotationScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : ''}
            onBack={goBack}
          />
        ) : screen === 'SoilMoistureTracking' ? (
          <SoilMoistureTrackingScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : ''}
            onBack={goBack}
          />
        ) : screen === 'ErosionConservation' ? (
          <ErosionConservationScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : ''}
            onBack={goBack}
            onLogErosionNote={() => navigate('CreateErosionNote', { farmId: params['farmId'] })}
          />
        ) : screen === 'CreateErosionNote' || screen === 'LogErosionNote' ? (
          <CreateErosionNoteScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : ''}
            plotId={typeof params['plotId'] === 'string' ? params['plotId'] : undefined}
            onBack={goBack}
            onSave={goBack}
          />
        ) : screen === 'ExportSoilReports' ? (
          <ExportSoilReportsScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : ''}
            onBack={goBack}
          />
        ) : screen === 'UploadNewSoilTest' || screen === 'NewSoilTest' ? (
          <UploadNewSoilTestScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : ''}
            onBack={goBack}
            onSave={goBack}
            onNavigateToFieldContext={() => navigate('FieldContext', { farmId: params['farmId'], returnTo: screen })}
          />
        ) : screen === 'SoilTest' ? (
          <SoilTestScreen
            farmId={typeof params['farmId'] === 'string' ? params['farmId'] : ''}
            onNavigateBack={goBack}
            onNavigateToNewSoilTest={() => navigate('UploadNewSoilTest', { farmId: params['farmId'] })}
          />
        ) : screen === 'BankPayment' ? (
          <BankPaymentScreen
            onBack={goBack}
            onNavigateToBankAccount={() => navigate('BankAccount')}
            onNavigateToUpiId={() => navigate('UpiId')}
            onNavigateToPayoutHistory={() => navigate('PayoutHistory')}
            onNavigateToWallet={() => navigate('Wallet')}
          />
        ) : screen === 'BankAccount' ? (
          <BankAccountScreen
            onBack={goBack}
          />
        ) : screen === 'UpiId' ? (
          <UpiIdScreen
            onBack={goBack}
            onSaveSuccess={goBack}
          />
        ) : screen === 'PayoutHistory' ? (
          <PayoutHistoryScreen
            onBack={goBack}
            onNavigateToDetail={(payout) => navigate('PayoutDetail', payout as any)}
          />
        ) : screen === 'PayoutDetail' ? (
          <PayoutDetailScreen
            payout={params as any}
            onBack={goBack}
          />
        ) : screen === 'WithdrawFunds' ? (
          <WithdrawFundsScreen
            onClose={goBack}
            onRequestSuccess={goBack}
          />
        ) : screen === 'WalletTransactionDetail' ? (
          <WalletTransactionDetailScreen
            transaction={params as any}
            onBack={goBack}
          />
        ) : screen === 'AddMoney' ? (
          <AddMoneyScreen
            onClose={goBack}
            onSuccess={goBack}
            onNavigateToCashTopUp={(data) => navigate('CashTopUp', data)}
          />
        ) : screen === 'CashTopUp' ? (
          <CashTopUpScreen
            amount={typeof params['amount'] === 'string' ? params['amount'] : '2,000'}
            referenceCode={typeof params['referenceCode'] === 'string' ? params['referenceCode'] : 'CASH-TU-7734'}
            onBack={goBack}
            onDone={goBack}
          />
        ) : screen === 'Wallet' ? (
          <WalletScreen
            onBack={goBack}
            onNavigateToAddMoney={() => navigate('AddMoney')}
            onNavigateToWithdraw={() => navigate('WithdrawFunds')}
            onNavigateToPayoutHistory={() => navigate('PayoutHistory')}
            onNavigateToTransactionDetail={(txn) => navigate('WalletTransactionDetail', txn as any)}
          />
        ) : screen === 'Weather' ? (
          <WeatherScreen
            onNavigateBack={goBack}
          />
        ) : screen === 'ActiveCrops' ? (
          <ActiveCropsScreen
            onNavigateBack={goBack}
            onNavigateToCropDetail={(crop) => {
              setSelectedCrop(crop);
              navigate('CropDetail');
            }}
            onNavigateToNewCrop={() => navigate('NewCrop')}
          />
        ) : screen === 'MyListings' ? (
          <MyListingsScreen
            onNavigateBack={goBack}
            onNavigateToListingDetail={(listing) => {
              setSelectedListing(listing);
              navigate('ListingDetail');
            }}
            onNavigateToCounterOffer={(listing) => {
              setSelectedListing(listing);
              navigate('CounterOffer');
            }}
          />
        ) : screen === 'TohfaCalendar' ? (
          <TohfaCalendarScreen
            onNavigateBack={goBack}
            onNavigateToCropInsight={() => navigate('CropPlanningInsight')}
          />
        ) : screen === 'CropPlanningInsight' ? (
          <CropPlanningInsightScreen onNavigateBack={goBack} />
        ) : screen === 'FarmInventory' ? (
          <FarmInventoryScreen
            onNavigateBack={goBack}
            onNavigateToCategory={(category) => {
              if (category === 'Tools') navigate('ToolsList');
              else if (category === 'Equipment') navigate('EquipmentList');
              else if (category === 'Trees') navigate('TreesList');
              else if (category === 'Machinery') navigate('MachineryList');
            }}
          />
        ) : screen === 'ToolsList' ? (
          <ToolsListScreen
            onNavigateBack={goBack}
            onNavigateToAddTool={() => navigate('AddTool')}
            onNavigateToEditTool={(tool) => {
              setSelectedToolForEdit(tool);
              navigate('EditTool');
            }}
          />
        ) : screen === 'AddTool' ? (
          <AddToolScreen onNavigateBack={goBack} />
        ) : screen === 'EditTool' ? (
          <EditToolScreen
            tool={
              selectedToolForEdit
                ? {
                  id: selectedToolForEdit.id,
                  name: selectedToolForEdit.name,
                  purchaseDate: selectedToolForEdit.purchaseDate?.replace('Purchased ', ''),
                  serviceInterval: selectedToolForEdit.serviceInterval ?? '90',
                }
                : undefined
            }
            onNavigateBack={goBack}
            onSave={() => goBack()}
            onRemove={() => {
              setSelectedItemForRemove({
                id: selectedToolForEdit?.id,
                name: selectedToolForEdit?.name || 'Knapsack Sprayer',
                category: 'Tools',
                dateInfo: `Tools · ${selectedToolForEdit?.purchaseDate || 'Purchased 04 Jan 2025'}`,
              });
              navigate('RemoveItem');
            }}
          />
        ) : screen === 'EquipmentList' ? (
          <EquipmentListScreen
            onBack={goBack}
            onNavigateToAddEquipment={() => navigate('AddEquipment')}
            onNavigateToEditEquipment={(item) => {
              setSelectedEquipmentForEdit(item);
              navigate('EditEquipment');
            }}
          />
        ) : screen === 'AddEquipment' ? (
          <AddEquipmentScreen onNavigateBack={goBack} onSave={goBack} />
        ) : screen === 'EditEquipment' ? (
          <EditEquipmentScreen
            equipment={
              selectedEquipmentForEdit
                ? {
                  id: selectedEquipmentForEdit.id,
                  name: selectedEquipmentForEdit.name,
                  purchaseDate: selectedEquipmentForEdit.purchaseDate?.replace('Purchased ', ''),
                  coverageArea: selectedEquipmentForEdit.coverageArea ?? '2.5',
                  serviceInterval: selectedEquipmentForEdit.serviceInterval ?? '120',
                }
                : undefined
            }
            onNavigateBack={goBack}
            onSave={() => goBack()}
            onRemove={() => {
              setSelectedItemForRemove({
                id: selectedEquipmentForEdit?.id,
                name: selectedEquipmentForEdit?.name || 'Drip Irrigation Kit',
                category: 'Equipment',
                dateInfo: `Equipment · ${selectedEquipmentForEdit?.purchaseDate || 'Purchased 22 Feb 2024'}`,
              });
              navigate('RemoveItem');
            }}
          />
        ) : screen === 'TreesList' ? (
          <TreesListScreen
            onBack={goBack}
            onNavigateToAddPlanting={() => navigate('AddPlanting')}
            onNavigateToEditPlanting={(item) => {
              setSelectedTreeForEdit(item);
              navigate('EditPlanting');
            }}
          />
        ) : screen === 'AddPlanting' ? (
          <AddPlantingScreen onNavigateBack={goBack} onSave={goBack} />
        ) : screen === 'EditPlanting' ? (
          <EditPlantingScreen
            planting={
              selectedTreeForEdit
                ? {
                  id: selectedTreeForEdit.id,
                  species: selectedTreeForEdit.species ?? selectedTreeForEdit.name.split(' (')[0],
                  treeCount: selectedTreeForEdit.treeCount ?? 12,
                  plantedDate: selectedTreeForEdit.plantedDate?.replace('Planted ', ''),
                  locationZone: selectedTreeForEdit.zoneInfo,
                  purpose: selectedTreeForEdit.purposeText ?? 'Shade & windbreak',
                }
                : undefined
            }
            onNavigateBack={goBack}
            onSave={() => goBack()}
            onRemove={() => {
              setSelectedItemForRemove({
                id: selectedTreeForEdit?.id,
                name: selectedTreeForEdit?.name || 'Silver Oak (12 trees)',
                category: 'Trees',
                dateInfo: `Trees · ${selectedTreeForEdit?.plantedDate || 'Planted 14 Jun 2019'}`,
              });
              navigate('RemoveItem');
            }}
          />
        ) : screen === 'MachineryList' ? (
          <MachineryListScreen
            onBack={goBack}
            onNavigateToAddMachinery={() => navigate('AddMachinery')}
            onNavigateToEditMachinery={(item) => {
              setSelectedMachineryForEdit(item);
              navigate('EditMachinery');
            }}
          />
        ) : screen === 'AddMachinery' ? (
          <AddMachineryScreen onNavigateBack={goBack} onSave={goBack} />
        ) : screen === 'EditMachinery' ? (
          <EditMachineryScreen
            machinery={
              selectedMachineryForEdit
                ? {
                  id: selectedMachineryForEdit.id,
                  name: selectedMachineryForEdit.name,
                  makeModel: selectedMachineryForEdit.makeModel,
                  purchaseDate: selectedMachineryForEdit.purchaseDate?.replace('Purchased ', ''),
                  fuelType: selectedMachineryForEdit.fuelType,
                  serviceInterval: selectedMachineryForEdit.serviceInterval ?? '60',
                }
                : undefined
            }
            onNavigateBack={goBack}
            onSave={() => goBack()}
            onRemove={() => {
              setSelectedItemForRemove({
                id: selectedMachineryForEdit?.id,
                name: selectedMachineryForEdit?.name || 'Power Tiller',
                category: 'Machinery',
                dateInfo: `Machinery · ${selectedMachineryForEdit?.purchaseDate || 'Purchased 08 Feb 2023'}`,
              });
              navigate('RemoveItem');
            }}
          />
        ) : screen === 'RemoveItem' ? (
          <RemoveItemScreen
            item={selectedItemForRemove ?? undefined}
            onNavigateBack={goBack}
            onConfirmRemove={async () => {
              // canDeleteAsset is the single source of truth for which categories have no
              // backend delete endpoint yet (see RemoveItemScreen.tsx) -- RemoveItemScreen
              // already refuses to call onConfirmRemove for those, so this is belt-and-braces,
              // not the gate itself.
              if (
                selectedItemForRemove?.id &&
                canDeleteAsset(selectedItemForRemove.category)
              ) {
                try {
                  await deleteFarmAsset(selectedItemForRemove.id);
                } catch {
                  // Ignore error and navigate back to list which refreshes
                }
              }
              if (selectedItemForRemove?.category === 'Tools') {
                navigate('ToolsList');
              } else if (selectedItemForRemove?.category === 'Equipment') {
                navigate('EquipmentList');
              } else {
                navigate('MachineryList');
              }
            }}
          />
        ) : screen === 'DailyAttendance' ? (
          <DailyAttendanceScreen onNavigateBack={goBack} />
        ) : screen === 'LearningHub' ? (
          <LearningHubScreen
            onBack={goBack}
            onNavigateToContentDetail={(content) => {
              setSelectedContentDetail(content);
              navigate('ContentDetail');
            }}
            onNavigateToGroups={() => navigate('Groups')}
            onNavigateToGroupDetail={(group) => {
              setSelectedGroup(group);
              navigate('GroupDetail');
            }}
          />
        ) : screen === 'ContentDetail' ? (
          <ContentDetailScreen
            content={selectedContentDetail ?? undefined}
            onBack={goBack}
          />
        ) : screen === 'Groups' ? (
          <GroupsScreen
            onBack={goBack}
            onNavigateToGroupDetail={(group) => {
              setSelectedGroup(group);
              navigate('GroupDetail');
            }}
          />
        ) : screen === 'GroupDetail' ? (
          <GroupDetailScreen
            group={selectedGroup ?? undefined}
            onBack={goBack}
          />
        ) : screen === 'AboutSupport' ? (
          <AboutSupportScreen onBack={goBack} />
        ) : screen === 'ChangePassword' ? (
          <ChangePasswordScreen onBack={goBack} onSuccess={() => navigate('PasswordChangedSuccess')} />
        ) : screen === 'Settings' ? (
          <SettingsScreen
            onBack={goBack}
            onNavigateToProfile={() => navigate('PersonalDetails')}
            onNavigateToChangePassword={() => navigate('ChangePassword')}
            onNavigateToAboutSupport={() => navigate('AboutSupport')}
            onSignOut={() => signOutTo('Welcome')}
          />
        ) : (
          /* MainTabs layout */
          <View style={styles.mainTabsContainer}>
            <View style={styles.tabScreenContainer}>
              {currentTab === 'Home' ? (
                <DashboardScreen
                  onNavigateToCertifications={() => navigate('Certifications')}
                  onNavigateToCreateListing={() => navigate('CreateListing')}
                  onNavigateToListings={() => setCurrentTab('Listings')}
                  onNavigateToWallet={() => setCurrentTab('Wallet')}
                  onNavigateToProfile={() => setCurrentTab('Profile')}
                  onNavigateToNotifications={() => navigate('Notifications')}
                  onNavigateToCounterOffer={(item) => {
                    // Only a real listing from DashboardScreen's GET /listings opens the
                    // counter-offer screen; with none, there is nothing to respond to.
                    if (item && item.id) {
                      setSelectedListing(item);
                      navigate('CounterOffer');
                    } else {
                      // No specific offer: the Marketing tab lists every one that needs a reply.
                      setCurrentTab('Listings');
                    }
                  }}
                  onNavigateToFarmManagement={() => navigate('CropManagement')}
                  onNavigateToCropManagement={() => navigate('CropManagement')}
                  onNavigateToWeather={() => navigate('Weather')}
                  onNavigateToActiveCrops={() => navigate('ActiveCrops')}
                  onNavigateToFarmDiary={() => navigate('FarmDiary')}
                  onNavigateToMyListings={() => setCurrentTab('Listings')}
                  onNavigateToAttendance={() => navigate('DailyAttendance')}
                  onNavigateToTohfaCalendar={() => navigate('TohfaCalendar')}
                  onNavigateToLearningHub={() => navigate('LearningHub')}
                  onNavigateToProduceCalendar={() => navigate('ProduceCalendar')}
                  onNavigateToInventory={() => navigate('FarmInventory')}
                  // The dashboard's crop preview is built from real farm_crops rows
                  // (listAllActiveFarmCrops + toActiveCropData), so each card carries
                  // the same CropItem payload ActiveCropsScreen hands CropDetailScreen.
                  onNavigateToCropDetail={(crop) => {
                    setSelectedCrop(crop);
                    navigate('CropDetail');
                  }}
                  onNavigateToAudits={() => navigate('Audits')}
                />
              ) : currentTab === 'Listings' ? (
                <ListingsScreen
                  onNavigateToCreateListing={() => navigate('CreateListing')}
                  onNavigateToCounterOffer={(listing) => {
                    setSelectedListing(listing);
                    navigate('CounterOffer');
                  }}
                  onNavigateToListingDetail={(listing) => {
                    setSelectedListing(listing);
                    navigate('ListingDetail');
                  }}
                  onNavigateToMyListings={() => navigate('MyListings')}
                />
              ) : currentTab === 'Wallet' ? (
                <WalletScreen
                  onNavigateToAddMoney={() => navigate('AddMoney')}
                  onNavigateToWithdraw={() => navigate('WithdrawFunds')}
                  onNavigateToPayoutHistory={() => navigate('PayoutHistory')}
                  onNavigateToTransactionDetail={(txn) => navigate('WalletTransactionDetail', txn as any)}
                />
              ) : (
                <ProfileScreen
                  onNavigateToHome={() => setCurrentTab('Home')}
                  onNavigateToCertifications={() => navigate('Certifications')}
                  onNavigateToMarket={() => setCurrentTab('Listings')}
                  onNavigateToFMBSketch={() => navigate('FMBSketch')}
                  onNavigateToPersonalDetails={() => navigate('PersonalDetails')}
                  onNavigateToAudits={() => navigate('Audits')}
                  onNavigateToFarmRatings={() => navigate('FarmRatings')}
                  onNavigateToSoilTest={() => navigate('SoilTest')}
                  onNavigateToSettings={() => navigate('Settings')}
                  onNavigateToAboutSupport={() => navigate('AboutSupport')}
                  onNavigateToBankPayment={() => navigate('BankPayment')}
                  onSignOut={() => signOutTo('Welcome')}
                />
              )}
            </View>

            {/* Bottom Tab Bar */}
            <View style={[styles.bottomTabBar, { borderTopWidth: 0, shadowColor: colors.onSurface, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 10, height: 58 }]}>
              <Pressable
                style={styles.tabItem}
                onPress={() => setCurrentTab('Home')}
                accessibilityRole="tab"
              >
                <HomeIcon size={24} color={currentTab === 'Home' ? colors.brandGreen : colors.onSurfaceVariant} />
                <Text
                  style={[
                    styles.tabItemText,
                    currentTab === 'Home' && styles.tabItemTextActive,
                    currentTab === 'Home' && { color: colors.brandGreen }
                  ]}
                >
                  Home
                </Text>
              </Pressable>

              <Pressable
                style={styles.tabItem}
                onPress={() => navigate('FarmManagement')}
                accessibilityRole="tab"
              >
                <Icon name="eco" size={24} color={colors.onSurfaceVariant} />
                <Text style={styles.tabItemText}>Farm</Text>
              </Pressable>

              <View style={styles.centerTabContainer}>
                <Pressable
                  style={({ pressed }) => [
                    styles.centerAddButton,
                    pressed && { opacity: 0.88, transform: [{ scale: 0.96 }] },
                  ]}
                  onPress={() => navigate('CreateListing')}
                  accessibilityRole="button"
                  accessibilityLabel="Create listing"
                >
                  <TabPlusIcon size={22} color={colors.white} />
                </Pressable>
              </View>

              <Pressable
                style={styles.tabItem}
                onPress={() => setCurrentTab('Listings')}
                accessibilityRole="tab"
              >
                <Icon name="shopping_cart" size={24} color={currentTab === 'Listings' ? colors.brandGreen : colors.onSurfaceVariant} style={currentTab === 'Listings' ? undefined : { opacity: 0.5 }} />
                <Text
                  style={[
                    styles.tabItemText,
                    currentTab === 'Listings' && styles.tabItemTextActive,
                    currentTab === 'Listings' && { color: colors.brandGreen }
                  ]}
                >
                  Market
                </Text>
              </Pressable>

              <Pressable
                style={styles.tabItem}
                onPress={() => setCurrentTab('Profile')}
                accessibilityRole="tab"
              >
                <Icon name="person" size={24} color={currentTab === 'Profile' ? colors.brandGreen : colors.onSurfaceVariant} style={currentTab === 'Profile' ? undefined : { opacity: 0.5 }} />
                <Text
                  style={[
                    styles.tabItemText,
                    currentTab === 'Profile' && styles.tabItemTextActive,
                    currentTab === 'Profile' && { color: colors.brandGreen }
                  ]}
                >
                  Profile
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
    </SessionQueryProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  screenSplash: {
    backgroundColor: SPLASH_DARK,
  },
  header: {
    backgroundColor: colors.primaryPressed,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    color: colors.white,
    fontSize: typography.title,
    fontWeight: weights.bold,
  },
  localeRow: { flexDirection: 'row', gap: 6 },
  localeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  localeChipActive: { backgroundColor: colors.white },
  localeText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  localeTextActive: { color: colors.primaryPressed, fontSize: 12, fontWeight: '700' },
  content: { flex: 1 },
  mainTabsContainer: { flex: 1 },
  tabScreenContainer: { flex: 1 },
  bottomTabBar: {
    flexDirection: 'row',
    height: 56,
    borderTopWidth: 1,
    borderTopColor: colors.surfacePressed,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: '100%',
  },
  tabItemText: {
    fontSize: typography.caption,
    color: colors.onSurfaceVariant,
    fontWeight: weights.medium,
  },
  tabItemTextActive: {
    color: colors.primary,
    fontWeight: weights.bold,
  },
  centerTabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  centerAddButton: {
    backgroundColor: authPalette.deepGreen,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    shadowColor: authPalette.deepGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
    borderWidth: 3,
    borderColor: colors.white,
  },
  unsupportedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  unsupportedText: { fontSize: typography.body, color: colors.onSurface, textAlign: 'center' },
});

