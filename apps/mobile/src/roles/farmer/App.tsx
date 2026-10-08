import React, { useEffect, useState, useCallback } from 'react';
import { Alert, BackHandler, Platform, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { configureTokenStorage, setOnAuthFailure } from '../../shell/api/client';
import { tokenStorage } from './storage/tokenStorage';
import { logout } from './api/auth';
import { Icon } from '@tohfa/mobile-ui';
import { LOCALES, setLocale, t, type Locale } from '../../i18n/farmer';
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
import { CropManagementScreen } from './screens/farm/CropManagementScreen';
import { LivestockScreen } from './screens/farm/LivestockScreen';
import { RegisterAnimalScreen } from './screens/farm/RegisterAnimalScreen';
import { EditAnimalScreen } from './screens/farm/EditAnimalScreen';
import { AnimalDetailScreen } from './screens/farm/AnimalDetailScreen';
import { SaleTransferCullScreen } from './screens/farm/SaleTransferCullScreen';
import { WorkforceScreen } from './screens/farm/WorkforceScreen';
import { AddWorkerScreen } from './screens/farm/AddWorkerScreen';
import { WorkerDetailScreen } from './screens/farm/WorkerDetailScreen';
import { PayrollScreen } from './screens/farm/PayrollScreen';
import {
  ProduceCalendarScreen,
  addProduceCropLocally,
  localProduceCropsCache,
  type CropItem,
} from './screens/farm/ProduceCalendarScreen';
import { NewCropScreen } from './screens/farm/NewCropScreen';
import { CropDetailScreen } from './screens/farm/CropDetailScreen';
import { CropDiaryEntriesScreen } from './screens/farm/CropDiaryEntriesScreen';
import { CropInputsAppliedScreen } from './screens/farm/CropInputsAppliedScreen';
import { InputManagementScreen } from './screens/farm/InputManagementScreen';
import { LogFertigationScreen } from './screens/farm/LogFertigationScreen';
import { LogPestTreatmentScreen } from './screens/farm/LogPestTreatmentScreen';
import { AddInputAppliedScreen } from './screens/farm/AddInputAppliedScreen';
import { SoilManagementScreen } from './screens/farm/SoilManagementScreen';
import { SoilTestRecordsScreen } from './screens/farm/SoilTestRecordsScreen';
import { SoilHealthTrackerScreen } from './screens/farm/SoilHealthTrackerScreen';
import { SoilTypeClassificationScreen } from './screens/farm/SoilTypeClassificationScreen';
import { SoilAmendmentsLogScreen } from './screens/farm/SoilAmendmentsLogScreen';
import { CropRotationScreen } from './screens/farm/CropRotationScreen';
import { SoilMoistureTrackingScreen } from './screens/farm/SoilMoistureTrackingScreen';
import { ErosionConservationScreen } from './screens/farm/ErosionConservationScreen';
import { ExportSoilReportsScreen } from './screens/farm/ExportSoilReportsScreen';
import { UploadNewSoilTestScreen } from './screens/farm/UploadNewSoilTestScreen';
import { CropWorkforceHoursScreen } from './screens/farm/CropWorkforceHoursScreen';
import { CropNPKContributionScreen } from './screens/farm/CropNPKContributionScreen';
import { FarmDiaryScreen } from './screens/farm/FarmDiaryScreen';
import { DiaryCalendarScreen } from './screens/farm/DiaryCalendarScreen';
import { DailyAttendanceScreen } from './screens/farm/DailyAttendanceScreen';
import { FarmInventoryScreen } from './screens/farm/FarmInventoryScreen';
import { ToolsListScreen, type ToolItem } from './screens/farm/ToolsListScreen';
import { AddToolScreen } from './screens/farm/AddToolScreen';
import { EditToolScreen } from './screens/farm/EditToolScreen';
import { EquipmentListScreen, type EquipmentItem } from './screens/farm/EquipmentListScreen';
import { AddEquipmentScreen } from './screens/farm/AddEquipmentScreen';
import { EditEquipmentScreen } from './screens/farm/EditEquipmentScreen';
import { TreesListScreen, type TreePlantingItem } from './screens/farm/TreesListScreen';
import { AddPlantingScreen } from './screens/farm/AddPlantingScreen';
import { EditPlantingScreen } from './screens/farm/EditPlantingScreen';
import { MachineryListScreen, type MachineryItem } from './screens/farm/MachineryListScreen';
import { AddMachineryScreen } from './screens/farm/AddMachineryScreen';
import { EditMachineryScreen } from './screens/farm/EditMachineryScreen';
import { RemoveItemScreen, type RemoveItemData } from './screens/farm/RemoveItemScreen';
import { LearningHubScreen } from './screens/learning/LearningHubScreen';
import { ContentDetailScreen, type ContentDetailItem } from './screens/learning/ContentDetailScreen';
import { GroupsScreen, type GroupItem } from './screens/learning/GroupsScreen';
import { GroupDetailScreen } from './screens/learning/GroupDetailScreen';
import { NewFarmDiaryEntryScreen } from './screens/farm/NewFarmDiaryEntryScreen';
import { NewFarmDiaryEntryStep2Screen } from './screens/farm/NewFarmDiaryEntryStep2Screen';
import { NewFarmDiaryEntryStep3Screen } from './screens/farm/NewFarmDiaryEntryStep3Screen';
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
import { ChangeMobileScreen } from './screens/profile/ChangeMobileScreen';
import { AboutSupportScreen } from './screens/profile/AboutSupportScreen';
import { FMBSketchScreen } from './screens/profile/FMBSketchScreen';
import { FieldContextScreen } from './screens/profile/FieldContextScreen';
import { ZonesScreen } from './screens/profile/ZonesScreen';
import { AddZoneScreen } from './screens/profile/AddZoneScreen';
import { PersonalDetailsScreen } from './screens/profile/PersonalDetailsScreen';
import { FarmRatingsScreen } from './screens/profile/FarmRatingsScreen';
import { SoilTestScreen } from './screens/profile/SoilTestScreen';
import { NewSoilTestScreen } from './screens/profile/NewSoilTestScreen';
import { RegistrationFlowScreen } from './screens/registration/RegistrationFlowScreen';
import { WalletScreen } from './screens/wallet/WalletScreen';
import { type Listing } from './api/listings';
import {
  type Certification,
  updateCertificationLocally,
  deleteCertificationLocally,
} from './api/farmer';
import { authPalette, colors, spacing, typography, weights } from './theme';
import { CustomerMainApp } from '../customer/CustomerMainApp';
import {
  SuperAdminDashboardScreen,
  TohfaAdminDashboardScreen,
  FarmerAdminDashboardScreen,
  MainWarehouseAdminDashboardScreen,
  SubWarehouseAdminDashboardScreen,
  OrdersModule,
  SubWarehouseProfileScreen,
  SubWarehouseOverviewScreen,
  SubWarehouseRecentActivityScreen,
  SubWarehouseStorageInfoScreen,
  SubWarehouseOperatingInfoScreen,
  SubWarehouseContactScreen,
  SubWarehouseDocumentsScreen,
  SubWarehouseNotificationsScreen,
  SubWarehouseTodayOverviewScreen,
  SubWarehouseNotificationDetailScreen,
  SubWarehouseReviewReceivingScreen,
  SubWarehouseSalesScreen,
  SubWarehouseNewSaleScreen,
  SubWarehouseSelectProductsScreen,
  SubWarehouseSaleSummaryScreen,
  SubWarehouseSelectCustomerScreen,
  SubWarehousePaymentScreen,
  SubWarehouseSaleConfirmationScreen,
  SubWarehouseSalesHistoryScreen,
  SubWarehouseSaleDetailScreen,
  SubWarehouseMarketDaySalesScreen,
  SubWarehouseHorecaSalesScreen,
  SubWarehouseHorecaDetailScreen,
  type HorecaOrderItem,
  SubWarehouseB2BSalesScreen,
  SubWarehouseB2BDetailScreen,
  type B2BOrderItem,
  SubWarehouseWalletOperationsScreen,
  SubWarehouseCashTopUpScreen,
  SubWarehouseFiscalTagScreen,
  SubWarehouseConfirmCashTopUpScreen,
  SubWarehouseCustomerSearchScreen,
  SubWarehouseCustomerWalletScreen,
  SubWarehouseTopUpHistoryScreen,
  SubWarehouseDailyCashSummaryScreen,
  SubWarehouseTopUpDetailsScreen,
  SubWarehouseTransactionDetailScreen,
  SubWarehouseTopUpSuccessScreen,
  SubWarehouseNeedsAttentionScreen,
  SubWarehouseWalletAttentionScreen,
  SubWarehouseMoreScreen,
  SubWarehouseCustomersScreen,
  SubWarehouseCustomerDetailsScreen,
  SubWarehouseCustomerActionsScreen,
  SubWarehousePurchaseHistoryScreen,
  SubWarehouseCustomerOrdersScreen,
  SubWarehouseCustomerIssuesScreen,
  SubWarehouseCustomerIssueDetailScreen,
  SubWarehouseSupportHistoryScreen,
  SubWarehouseCustomerSupportDetailScreen,
  SubWarehouseBillingHubScreen,
  SubWarehouseInvoiceListScreen,
  SubWarehouseInvoiceDetailScreen,
  SubWarehouseGenerateInvoiceScreen,
  SubWarehouseReviewInvoiceScreen,
  SubWarehouseGSTInvoiceScreen,
  SubWarehouseInvoicePreviewScreen,
  SubWarehouseInvoiceHistoryScreen,
  SubWarehouseInvoiceFiltersScreen,
  type InvoiceFilterState,
  SubWarehouseInvoiceHistoryFiltersScreen,
  type InvoiceHistoryFilterState,
  SubWarehouseOrderFiltersScreen,
  type OrderFilterState,
  SubWarehousePurchaseFiltersScreen,
  type PurchaseFilterState,
  SubWarehouseTaskActionCenterScreen,
  SubWarehouseTaskDetailScreen,
  SubWarehouseOrderDetailScreen,
  SubWarehouseApprovalAlertsScreen,
  SubWarehouseExpenseRecordScreen,
  SubWarehouseGoodsReceiptDetailScreen,
  SubWarehouseSystemMessagesScreen,
  SubWarehouseMessageHistoryScreen,
  SubWarehouseReturnsIssuesScreen,
  INITIAL_RMA_ITEMS,
  type RmaRecord,
  SubWarehouseRmaDetailScreen,
  SubWarehouseImageViewerScreen,
  SubWarehouseInspectProductScreen,
  SubWarehouseReviewReturnRequestScreen,
  SubWarehouseRejectReturnRequestScreen,
  SubWarehouseRequestRejectedScreen,
  SubWarehouseApproveReturnScreen,
  SubWarehouseReturnApprovedScreen,
  SubWarehouseRefundStatusScreen,
  SubWarehouseRefundFailedScreen,
  SubWarehouseRefundCompletedScreen,
  SubWarehouseReturnHistoryScreen,
  SubWarehouseReturnHistoryDetailScreen,
  SubWarehouseRmaResolutionSuccessScreen,
  SubWarehouseStaffScreen,
  SubWarehouseStaffDetailScreen,
  SubWarehouseEditStaffProfileScreen,
  SubWarehouseAttendanceScreen,
  SubWarehouseTodayAttendanceScreen,
  SubWarehouseAttendanceHistoryScreen,
  SubWarehouseDailyCashScreen,
  SubWarehouseFinanceScreen,
  SubWarehouseRevenueScreen,
  SubWarehouseRevenueDetailScreen,
  SubWarehouseExpensesScreen,
  SubWarehouseAddExpenseScreen,
  SubWarehouseExpenseDetailScreen,
  SubWarehouseExpenseCategoriesScreen,
  SubWarehouseFinanceHistoryScreen,
  SubWarehouseFinanceReportsScreen,
  SubWarehouseVouchersScreen,
  SubWarehouseVoucherDetailScreen,
  SubWarehouseWarehouseOperationsScreen,
  SubWarehouseWarehouseActivityScreen,
  SubWarehouseTodayOperationsScreen,
  SubWarehouseActivityDetailScreen,
  SubWarehouseStorageLocationDetailScreen,
  SubWarehouseMaterialHandlingScreen,
  SubWarehouseMaterialDetailScreen,
  SubWarehouseAddMaterialScreen,
  SubWarehouseCapacityScreen,
  SubWarehouseOperationalIssuesScreen,
  SubWarehouseReportIssueScreen,
  SubWarehouseIssueSubmittedScreen,
  SubWarehouseOperationalIssueDetailScreen,
  SubWarehouseStaffAndAttendanceScreen,
  SubWarehouseAttendanceDetailScreen,
  SubWarehouseReportsScreen,
  SubWarehouseSettingsScreen,
  SubWarehouseHelpSupportScreen,
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
  WarehouseOverviewScreen,
  StockLedgerScreen,
  VerifyStockScreen,
  StockAdjustmentApprovalScreen,
  LowStockAlertsScreen,
  WarehouseSettingsScreen,
  InterWarehouseTransferScreen,
  InitiateNewTransferScreen,
  type StockBatchItem,
  type VerifyStockAdjustmentData,
} from '../admin/screens';
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
import { TohfaToast, type ToastData } from '../admin';
import { M5S15_OrderStatusHistory } from '../admin/screens/swa/orders/M5S15_OrderStatusHistory';

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
  | 'SubWarehouseWalletOperations'
  | 'SubWarehouseCashTopUp'
  | 'SubWarehouseConfirmCashTopUp'
  | 'SubWarehouseCustomerSearch'
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
  | 'SubWarehouseImageViewer'
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
  | 'SubWarehouseRmaResolutionSuccess'
  | 'SubWarehouseStaff'
  | 'SubWarehouseStaffDetail'
  | 'SubWarehouseAttendance'
  | 'SubWarehouseTodayAttendance'
  | 'SubWarehouseAttendanceHistory'
  | 'SubWarehouseMore'
  | 'SubWarehouseCustomerList'
  | 'SubWarehouseCustomerSearch'
  | 'SubWarehouseCustomerDetail'
  | 'SubWarehouseCustomerPurchases'
  | 'SubWarehousePurchaseHistory'
  | 'SubWarehouseCustomerOrders'
  | 'SubWarehouseCustomerWallet'
  | 'SubWarehouseCashTopUp'
  | 'SubWarehouseCustomerIssues'
  | 'SubWarehouseCustomerIssueDetail'
  | 'SubWarehouseCustomerSupport'
  | 'SubWarehouseCustomerSupportDetail'
  | 'SubWarehouseCustomerActions'
  | 'SubWarehouseBillingHub'
  | 'SubWarehouseInvoiceList'
  | 'SubWarehouseInvoiceFilters'
  | 'SubWarehouseInvoiceDetail'
  | 'SubWarehouseGenerateInvoice'
  | 'SubWarehouseReviewInvoice'
  | 'SubWarehouseGSTInvoice'
  | 'SubWarehouseInvoicePreview'
  | 'SubWarehouseInvoiceHistory'
  | 'SubWarehouseInvoiceHistoryFilters'
  | 'SubWarehouseOrderFilters'
  | 'SubWarehousePurchaseFilters'
  | 'SubWarehouseNotifications'
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
  | 'SubWarehouseExpenses'
  | 'SubWarehouseAddExpense'
  | 'SubWarehouseExpenseDetail'
  | 'SubWarehouseExpenseCategories'
  | 'SubWarehouseFinanceHistory'
  | 'SubWarehouseFinanceReports'
  | 'SubWarehouseVouchers'
  | 'SubWarehouseWarehouseOperations'
  | 'SubWarehouseWarehouseActivity'
  | 'SubWarehouseStorageLocationDetail'
  | 'SubWarehouseMaterialHandling'
  | 'SubWarehouseMaterialDetail'
  | 'SubWarehouseCapacity'
  | 'SubWarehouseOperationalIssues'
  | 'SubWarehouseReportIssue'
  | 'SubWarehouseIssueSubmitted'
  | 'SubWarehouseOperationalIssueDetail'
  | 'SubWarehouseStaffAndAttendance'
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
  | 'AddZone'
  | 'EditCertification'
  | 'Notifications'
  | 'PersonalDetails'
  | 'Audits'
  | 'AuditResult'
  | 'FarmManagement'
  | 'CropManagement'
  | 'Livestock'
  | 'Workforce'
  | 'ProduceCalendar'
  | 'NewCrop'
  | 'CropDetail'
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
  | 'ChangeMobile'
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
  | 'CropRotation'
  | 'SoilMoistureTracking'
  | 'ErosionConservation'
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
  | 'AdminAllFarmers'
  | 'AdminFarmerDetail'
  | 'AdminEditFarmer'
  | 'AdminEditRatingCategories'
  | 'AdminFarmMap'
  | 'AdminRatingScorecard'
  | 'AdminComplianceTiers'
  | 'AdminKycReview'
  | 'AdminCertVerification'
  | 'AdminPendingApplications'
  | 'AdminApplicationDetail'
  | 'AdminApplicationApprove'
  | 'AdminApplicationReject'
  | 'AdminApplicationRequestInfo'
  | 'SubWarehouseAdminDashboard'
  | 'SubWarehouseOverview'
  | 'SubWarehouseRecentActivity'
  | 'SubWarehouseNotifications'
  | 'SubWarehouseProfile'
  | 'SubWarehouseReviewReceiving'
  | 'SubWarehouseTodayOverview'
  | 'SubWarehouseReports'
  | 'SubWarehouseSales'
  | 'SubWarehouseWalletOperations'
  | 'SubWarehouseMore'
  | 'SubWarehouseHelpSupport'
  | 'SubWarehouseFinance'
  | 'SubWarehouseExpenses'
  | 'SubWarehouseRevenue'
  | 'SubWarehouseRevenueDetail'
  | 'SubWarehouseVouchers'
  | 'SubWarehouseVoucherDetail'
  | 'SubWarehouseInvoiceDetail'
  | 'SubWarehouseDailyCash'
  | 'SubWarehouseExpenseCategories'
  | 'SubWarehouseFinanceHistory'
  | 'SubWarehouseFinanceReports'
  | 'SubWarehouseWarehouseOperations'
  | 'SubWarehouseTodayOperations'
  | 'SubWarehouseWarehouseActivity'
  | 'SubWarehouseActivityDetail'
  | 'SubWarehouseAddMaterial'
  | 'SubWarehouseReturnsIssues'
  | 'SubWarehouseRmaDetail'
  | 'SubWarehouseImageViewer'
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
  | 'SubWarehouseRmaResolutionSuccess'
  | 'SubWarehouseStorageLocationDetail'
  | 'SubWarehouseMaterialHandling'
  | 'SubWarehouseMaterialDetail'
  | 'SubWarehouseCapacity'
  | 'SubWarehouseStorageInfo'
  | 'SubWarehouseOperationalIssues'
  | 'SubWarehouseReportIssue'
  | 'SubWarehouseIssueSubmitted'
  | 'SubWarehouseOperationalIssueDetail'
  | 'SubWarehouseStaffAndAttendance'
  | 'SubWarehouseAttendanceDetail'
  | 'SubWarehouseNewSale'
  | 'SubWarehouseSelectProducts'
  | 'SubWarehouseSaleSummary'
  | 'SubWarehouseSelectCustomer'
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
  | 'SubWarehouseCashTopUp'
  | 'SubWarehouseFiscalTag'
  | 'SubWarehouseConfirmCashTopUp'
  | 'SubWarehouseCustomerSearch'
  | 'SubWarehouseCustomerWallet'
  | 'SubWarehouseTopUpHistory'
  | 'SubWarehouseDailyCashSummary'
  | 'SubWarehouseTopUpDetails'
  | 'SubWarehouseTransactionDetail'
  | 'SubWarehouseTopUpSuccess'
  | 'SubWarehouseNeedsAttention'
  | 'SubWarehouseWalletAttention';

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
  const [selectedStockBatch, setSelectedStockBatch] = useState<StockBatchItem | null>(null);
  const [selectedStockAdjustment, setSelectedStockAdjustment] = useState<VerifyStockAdjustmentData | null>(null);
  const [selectedSaleRecord, setSelectedSaleRecord] = useState<any | null>(null);
  const [selectedHorecaOrder, setSelectedHorecaOrder] = useState<HorecaOrderItem | null>(null);
  const [selectedB2BOrder, setSelectedB2BOrder] = useState<B2BOrderItem | null>(null);
  const [selectedStatusOrderId, setSelectedStatusOrderId] = useState<string>('ORD-1024');
  const [toast, setToast] = useState<ToastData | null>(null);
  const [params, setParams] = useState<Record<string, any>>({});
  const [locale, setLocaleState] = useState<Locale>('en');
  const [marketDays, setMarketDays] = useState<MarketDay[]>(MOCK_DAYS);
  const [invoiceFilters, setInvoiceFilters] = useState<InvoiceFilterState | undefined>(undefined);
  const [invoiceHistoryFilters, setInvoiceHistoryFilters] = useState<InvoiceHistoryFilterState | undefined>(undefined);
  const [orderFilters, setOrderFilters] = useState<OrderFilterState | undefined>(undefined);
  const [purchaseFilters, setPurchaseFilters] = useState<PurchaseFilterState | undefined>(undefined);

  const navigate = useCallback(
    (nextScreen: ScreenName, nextParams: Record<string, any> = {}) => {
      if (nextScreen === screen) {
        setParams(nextParams);
        return;
      }

      if (nextScreen === 'Splash' || nextScreen === 'Welcome') {
        setHistory([]);
      } else if (nextScreen === 'MainTabs') {
        setHistory([]);
      } else {
        setHistory((prev) => [...prev, { screen, params, tab: currentTab }]);
      }

      setParams(nextParams);
      setScreen(nextScreen);
    },
    [screen, params, currentTab],
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
        const authScreens: ScreenName[] = [
          'Login',
          'RoleSelection',
          'Register',
          'Otp',
          'ForgotPassword',
          'ResetPassword',
          'PasswordChangedSuccess',
          'ApplicationStatus',
        ];
        if (authScreens.includes(screen)) {
          setScreen('Welcome');
          setParams({});
        } else if (screen !== 'MainTabs' && screen !== 'Splash' && screen !== 'Welcome') {
          setScreen('MainTabs');
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
      setScreen((prev) => {
        if (
          prev === 'AdminMain' ||
          prev === 'SuperAdminDashboard' ||
          prev === 'TohfaAdminDashboard' ||
          prev === 'FarmerAdminDashboard' ||
          prev === 'MainWarehouseAdminDashboard' ||
          prev === 'SubWarehouseAdminDashboard'
        ) {
          return prev;
        }
        setHistory([]);
        return 'Welcome';
      });
    });
    return () => {
      setOnAuthFailure(null);
    };
  }, []);

  const switchLocale = (next: Locale): void => {
    setLocale(next);
    setLocaleState(next);
  };

  // Splash and Welcome are full-bleed photo screens: no header, dark chrome.
  const isAuthLanding = screen === 'Splash' || screen === 'Welcome';

  const isSubWarehouse =
    screen.startsWith('SubWarehouse') ||
    screen.startsWith('MainWarehouse') ||
    (screen as string) === 'ReceivingQcScreen' ||
    (screen as string) === 'BatchInspectionScreen' ||
    (screen as string) === 'RmaDetailScreen' ||
    (screen as string) === 'IssueReportedSuccessScreen' ||
    (screen as string) === 'SupplierCommunicationScreen' ||
    Boolean(params && (params['adminRole'] === 'SUB_WH_ADMIN' || params['adminRole'] === 'MAIN_WH_ADMIN'));

  return (
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
        ) : screen === 'AdminMain' ? (
          params['adminRole'] === 'TOHFA_ADMIN' ? (
            <TohfaAdminDashboardScreen
              onSignOut={() => navigate('Welcome')}
              onNavigate={(s) => navigate(s as ScreenName)}
            />
          ) : params['adminRole'] === 'FARMER_ADMIN' ? (
            <FarmerAdminDashboardScreen
              onSignOut={() => navigate('Welcome')}
              onNavigate={(s) => navigate(s as ScreenName)}
            />
          ) : params['adminRole'] === 'MAIN_WH_ADMIN' ? (
            <MainWarehouseAdminDashboardScreen
              onSignOut={() => navigate('Welcome')}
              onNavigate={(s) => navigate(s as ScreenName)}
            />
          ) : params['adminRole'] === 'SUB_WH_ADMIN' ? (
            <SubWarehouseAdminDashboardScreen
              onSignOut={() => navigate('Welcome')}
              onNavigate={(s, p) => navigate(s as ScreenName, p)}
              initialTab={params['initialTab'] as any}
              initialReceivingSubView={params['initialReceivingSubView'] as any}
              initialInventoryScreen={params['initialInventoryScreen'] as any}
            />
          ) : (
            <SuperAdminDashboardScreen
              onSignOut={() => navigate('Welcome')}
              onNavigate={(s) => navigate(s as ScreenName)}
            />
          )
        ) : screen === 'SuperAdminDashboard' ? (
          <SuperAdminDashboardScreen
            onSignOut={() => navigate('Welcome')}
            onNavigate={(s) => navigate(s as ScreenName)}
          />
        ) : screen === 'TohfaAdminDashboard' ? (
          <TohfaAdminDashboardScreen
            onSignOut={() => navigate('Welcome')}
            onNavigate={(s) => navigate(s as ScreenName)}
          />
        ) : screen === 'FarmerAdminDashboard' ? (
          <FarmerAdminDashboardScreen
            onSignOut={() => navigate('Welcome')}
            onNavigate={(s) => navigate(s as ScreenName)}
          />
        ) : screen === 'MainWarehouseAdminDashboard' ? (
          <MainWarehouseAdminDashboardScreen
            onSignOut={() => navigate('Welcome')}
            onNavigate={(s) => navigate(s as ScreenName)}
          />
        ) : screen === 'SubWarehouseAdminDashboard' ? (
          <SubWarehouseAdminDashboardScreen
            initialTab={params?.initialTab as any}
            onSignOut={() => navigate('Welcome')}
            onNavigate={(s, p) => navigate(s as ScreenName, p)}
            initialTab={params['initialTab'] as any}
            initialReceivingSubView={params['initialReceivingSubView'] as any}
            initialInventoryScreen={params['initialInventoryScreen'] as any}
          />
        ) : screen === 'SubWarehouseProfile' ? (
          <SubWarehouseProfileScreen
            onBack={goBack}
            onNavigateToStorageInfo={() => navigate('SubWarehouseStorageInfo')}
            onNavigateToOperatingInfo={() => navigate('SubWarehouseOperatingInfo')}
            onNavigateToContact={() => navigate('SubWarehouseContact')}
            onNavigateToDocuments={() => navigate('SubWarehouseDocuments')}
            onTabChange={(tab) => {
              if (tab === 'Home') goBack();
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
            }}
          />
        ) : screen === 'SubWarehouseOverview' ? (
          <SubWarehouseOverviewScreen
            warehouseName="Coonoor Warehouse"
            warehouseId="COO-WH-001"
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseWalletOperations');
            }}
            onNavigateToInventory={() => navigate('SubWarehouseAdminDashboard')}
            onNavigateToReceiving={() => navigate('ReceivingQcScreen' as any)}
            onNavigateToOrders={() => navigate('SubWarehouseSales')}
            onNavigateToOperations={() => navigate('SubWarehouseWalletOperations')}
          />
        ) : screen === 'SubWarehouseRecentActivity' ? (
          <SubWarehouseRecentActivityScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseWalletOperations');
            }}
          />
        ) : screen === 'SubWarehouseStorageInfo' ? (
          <SubWarehouseStorageInfoScreen
            onBack={() => navigate('SubWarehouseWarehouseOperations')}
            onSelectLocation={(id) => navigate('SubWarehouseStorageLocationDetail', { locationId: id })}
            onViewStock={() => navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory' })}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard', { initialTab: 'Home' });
              else if (tab === 'Receiving') navigate('SubWarehouseAdminDashboard', { initialTab: 'Receiving', initialReceivingSubView: 'incoming_shipments' });
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S01' });
              else if (tab === 'More') navigate('SubWarehouseWarehouseOperations');
            }}
          />
        ) : screen === 'SubWarehouseOperatingInfo' ? (
          <SubWarehouseOperatingInfoScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseWalletOperations');
            }}
          />
        ) : screen === 'SubWarehouseContact' ? (
          <SubWarehouseContactScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseWalletOperations');
            }}
          />
        ) : screen === 'SubWarehouseDocuments' ? (
          <SubWarehouseDocumentsScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseWalletOperations');
            }}
          />
        ) : screen === 'SubWarehouseNotifications' ? (
          <SubWarehouseNotificationsScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onNavigateToTasks={() => navigate('SubWarehouseTaskActionCenter')}
            onNavigateToAlerts={() => navigate('SubWarehouseApprovalAlerts')}
            onNavigateToSystemMessages={() => navigate('SubWarehouseSystemMessages')}
            onSelectNotification={(item) =>
              navigate('SubWarehouseNotificationDetail', { notification: item })
            }
            onNavigateToAction={(actionLabel, item) => {
              if (actionLabel.includes('Review') || item?.type === 'quality') {
                navigate('SubWarehouseReviewReceiving');
              } else if (actionLabel.includes('Stock') || item?.type === 'inventory') {
                navigate('SubWarehouseAdminDashboard');
              } else if (actionLabel.includes('Order') || item?.type === 'order') {
                navigate('SubWarehouseCustomerOrders');
              } else if (actionLabel.includes('Wallet') || actionLabel.includes('Top-Up') || item?.type === 'wallet') {
                navigate('SubWarehouseWalletOperations');
              } else if (actionLabel.includes('Return') || item?.type === 'returns') {
                navigate('SubWarehouseReturnsIssues');
              } else if (item?.type === 'system') {
                navigate('SubWarehouseSystemMessages');
              }
            }}
          />
        ) : screen === 'SubWarehouseNotificationDetail' ? (
          <SubWarehouseNotificationDetailScreen
            onBack={goBack}
            notificationData={
              params['notification']
                ? {
                  type:
                    (params['notification'] as any).type === 'wallet'
                      ? 'wallet'
                      : (params['notification'] as any).type === 'order'
                        ? 'order'
                        : 'goods',
                  title: (params['notification'] as any).title,
                  message: (params['notification'] as any).subtitle,
                  reference:
                    (params['notification'] as any).type === 'quality'
                      ? 'GR-1024'
                      : (params['notification'] as any).type === 'order'
                        ? 'ORD-10245'
                        : 'TOP-002845',
                }
                : undefined
            }
            onActionPress={() => {
              const notif = params['notification'] as any;
              if (notif?.actionLabel?.includes('Review') || notif?.type === 'quality') {
                navigate('SubWarehouseReviewReceiving');
              } else if (notif?.actionLabel?.includes('Stock') || notif?.type === 'inventory') {
                navigate('SubWarehouseAdminDashboard');
              } else if (notif?.actionLabel?.includes('Order') || notif?.type === 'order') {
                navigate('SubWarehouseCustomerOrders');
              } else if (notif?.actionLabel?.includes('Wallet') || notif?.type === 'wallet') {
                navigate('SubWarehouseWalletOperations');
              } else if (notif?.actionLabel?.includes('Return') || notif?.type === 'returns') {
                navigate('SubWarehouseReturnsIssues');
              } else {
                navigate('SubWarehouseReviewReceiving');
              }
            }}
          />
        ) : screen === 'SubWarehouseReviewReceiving' ? (
          <SubWarehouseReviewReceivingScreen
            onBack={goBack}
            onSuccess={() => navigate('SubWarehouseAdminDashboard')}
            shipmentData={{
              reference: 'GR-1024',
              source: 'Main Warehouse (Ooty Hub)',
              product: 'Tomato (Grade 1)',
              expectedQuantity: '150 KG',
            }}
          />
        ) : screen === 'SubWarehouseTodayOverview' ? (
          <SubWarehouseTodayOverviewScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseWalletOperations');
            }}
            onNavigateToSection={(section) => {
              if (section === 'Receiving') navigate('SubWarehouseReviewReceiving');
              else if (section === 'Inventory') navigate('SubWarehouseAdminDashboard');
              else if (section === 'Orders') navigate('SubWarehouseCustomerOrders');
              else if (section === 'Sales') navigate('SubWarehouseSales');
              else if (section === 'Cash Top-Up') navigate('SubWarehouseWalletOperations');
            }}
          />
        ) : screen === 'SubWarehouseSales' ? (
          <SubWarehouseSalesScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onNavigateToNotifications={() => navigate('SubWarehouseNotifications')}
            onNavigateToNewSale={() => navigate('SubWarehouseNewSale')}
            onNavigateToSalesHistory={() => navigate('SubWarehouseSalesHistory')}
            onNavigateToMarketDaySales={() => navigate('SubWarehouseMarketDaySales')}
            onNavigateToHorecaSales={() => navigate('SubWarehouseHorecaSales')}
            onNavigateToB2BSales={() => navigate('SubWarehouseB2BSales')}
            onNavigateToNeedsAttention={() => navigate('SubWarehouseNeedsAttention')}
            onNavigateToSaleDetail={(saleId) => navigate('SubWarehouseSaleDetail', {
              saleId: saleId || 'SALE-00251',
              customerName: 'Rajesh Kumar',
              customerCode: 'CUS-00291',
              channel: 'Direct Sale',
              dateText: 'Today · 6:35 PM',
              amount: 500,
              status: 'Paid',
              invoiceNo: 'INV-00251',
              paymentMethod: 'UPI',
            })}
          />
        ) : screen === 'SubWarehouseNeedsAttention' ? (
          <SubWarehouseNeedsAttentionScreen
            onBack={goBack}
          />
        ) : screen === 'SubWarehouseNewSale' ? (
          <SubWarehouseNewSaleScreen
            initialCustomerName={(params['customerName'] as string) || 'Rajesh Kumar'}
            onBack={goBack}
            onSelectProducts={() => navigate('SubWarehouseSelectProducts')}
          />
        ) : screen === 'SubWarehouseSelectProducts' ? (
          <SubWarehouseSelectProductsScreen
            onBack={goBack}
            onContinue={(items) => {
              navigate('SubWarehouseSaleSummary');
            }}
          />
        ) : screen === 'SubWarehouseSaleSummary' ? (
          <SubWarehouseSaleSummaryScreen
            onBack={goBack}
            onContinueToCustomer={() => {
              navigate('SubWarehouseSelectCustomer');
            }}
          />
        ) : screen === 'SubWarehouseSelectCustomer' ? (
          <SubWarehouseSelectCustomerScreen
            onBack={goBack}
            onContinueToPayment={(cust: any) => {
              navigate('SubWarehousePayment', { customerName: cust.name, customerCode: cust.code });
            }}
          />
        ) : screen === 'SubWarehousePayment' ? (
          <SubWarehousePaymentScreen
            amountDue={320}
            onBack={goBack}
            onPaymentConfirmed={() => {
              navigate('SubWarehouseSaleConfirmation', {
                saleId: 'SALE-00251',
                customerName: typeof params['customerName'] === 'string' ? params['customerName'] : 'Rajesh Kumar',
                customerCode: typeof params['customerCode'] === 'string' ? params['customerCode'] : 'CUS-00291',
                paymentMethod: 'Wallet',
                totalAmount: 320,
              });
            }}
          />
        ) : screen === 'SubWarehouseSaleConfirmation' ? (
          <SubWarehouseSaleConfirmationScreen
            saleId={typeof params['saleId'] === 'string' ? params['saleId'] : 'SALE-00251'}
            customerName={typeof params['customerName'] === 'string' ? params['customerName'] : 'Rajesh Kumar'}
            customerCode={typeof params['customerCode'] === 'string' ? params['customerCode'] : 'CUS-00291'}
            paymentMethod={typeof params['paymentMethod'] === 'string' ? params['paymentMethod'] : 'Wallet'}
            totalAmount={typeof params['totalAmount'] === 'number' ? params['totalAmount'] : 320}
            onBack={goBack}
            onViewInvoice={() => {
              navigate('SubWarehouseReviewInvoice', {
                invoiceType: 'Direct Sale',
                customerName: typeof params['customerName'] === 'string' ? params['customerName'] : 'Rajesh Kumar',
                itemsCount: 2,
                subtotal: '₹320',
                gst: '₹0',
                total: '₹320',
              });
            }}
            onNewSale={() => {
              navigate('SubWarehouseNewSale');
            }}
          />
        ) : screen === 'SubWarehouseSalesHistory' ? (
          <SubWarehouseSalesHistoryScreen
            onBack={goBack}
            onSelectSale={(sale) => {
              setSelectedSaleRecord(sale);
              navigate('SubWarehouseSaleDetail');
            }}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseWalletOperations');
            }}
          />
        ) : screen === 'SubWarehouseSaleDetail' ? (
          <SubWarehouseSaleDetailScreen
            sale={selectedSaleRecord ?? {
              id: typeof params['saleId'] === 'string' ? params['saleId'] : 'SALE-00251',
              customerName: typeof params['customerName'] === 'string' ? params['customerName'] : 'Rajesh Kumar',
              customerCode: typeof params['customerCode'] === 'string' ? params['customerCode'] : 'CUS-00291',
              channel: typeof params['channel'] === 'string' ? params['channel'] : 'Direct Sale',
              dateText: typeof params['dateText'] === 'string' ? params['dateText'] : '24 Sep, 6:35 PM',
              amount: typeof params['amount'] === 'number' ? params['amount'] : 320,
              status: typeof params['status'] === 'string' ? params['status'] : 'Completed',
              invoiceNo: typeof params['invoiceNo'] === 'string' ? params['invoiceNo'] : 'INV-00251',
              paymentMethod: typeof params['paymentMethod'] === 'string' ? params['paymentMethod'] : 'UPI',
              items: [
                {
                  name: 'Tomato',
                  grade: 'Grade 1',
                  batch: 'BTH-00231',
                  qtyText: '2 KG @ ₹100',
                  pricePerUnit: 100,
                  lineTotal: 200,
                },
              ],
            }}
            onBack={goBack}
            onViewInvoice={() => navigate('SubWarehouseInvoiceDetail', {
              invoiceId: (selectedSaleRecord as any)?.invoiceNo || (params['invoiceNo'] as string) || 'INV-00251',
            })}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseWalletOperations');
            }}
          />
        ) : screen === 'SubWarehouseMarketDaySales' ? (
          <SubWarehouseMarketDaySalesScreen
            warehouseName="Coonoor Warehouse"
            marketDate="24 Sep 2026"
            onBack={goBack}
            onNavigateToNewMarketSale={() => navigate('SubWarehouseNewSale')}
            onNavigateToSalesHistory={() => navigate('SubWarehouseSalesHistory')}
            onSelectTransaction={(tx) => {
              setSelectedSaleRecord(tx);
              navigate('SubWarehouseSaleDetail');
            }}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseWalletOperations');
            }}
          />
        ) : screen === 'SubWarehouseHorecaSales' ? (
          <SubWarehouseHorecaSalesScreen
            onBack={goBack}
            onSelectOrder={(ord) => {
              setSelectedHorecaOrder(ord);
              navigate('SubWarehouseHorecaDetail');
            }}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseWalletOperations');
            }}
          />
        ) : screen === 'SubWarehouseHorecaDetail' ? (
          <SubWarehouseHorecaDetailScreen
            order={selectedHorecaOrder || undefined}
            onBack={goBack}
            onViewInvoice={() =>
              navigate('SubWarehouseInvoiceDetail', {
                invoiceId: `INV-${(selectedHorecaOrder?.id || 'HORECA-0021').replace('HORECA-', '')}`,
              })
            }
            onViewStatus={() => {
              setSelectedStatusOrderId(selectedHorecaOrder?.id || 'HORECA-0021');
              navigate('SubWarehouseOrderStatusHistory');
            }}
          />
        ) : screen === 'SubWarehouseB2BSales' ? (
          <SubWarehouseB2BSalesScreen
            onBack={goBack}
            onSelectOrder={(ord) => {
              setSelectedB2BOrder(ord);
              navigate('SubWarehouseB2BDetail');
            }}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseWalletOperations');
            }}
          />
        ) : screen === 'SubWarehouseB2BDetail' ? (
          <SubWarehouseB2BDetailScreen
            order={selectedB2BOrder || undefined}
            onBack={goBack}
            onViewInvoice={() =>
              navigate('SubWarehouseInvoiceDetail', {
                invoiceId: `INV-${(selectedB2BOrder?.id || 'B2B-00124').replace('B2B-', '')}`,
              })
            }
            onViewStatus={() => {
              setSelectedStatusOrderId(selectedB2BOrder?.id || 'B2B-00124');
              navigate('SubWarehouseOrderStatusHistory');
            }}
          />
        ) : screen === 'SubWarehouseOrderStatusHistory' ? (
          <M5S15_OrderStatusHistory
            orderId={selectedStatusOrderId || (params?.orderId as string) || 'ORD-1024'}
            onNavigate={(nextScreen) => navigate(nextScreen as ScreenName)}
            onBack={goBack}
          />
        ) : screen === 'SubWarehouseHelpSupport' ? (
          <SubWarehouseHelpSupportScreen
            warehouseName="Coonoor Warehouse"
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
          />
        ) : screen === 'SubWarehouseMore' ? (
          <SubWarehouseMoreScreen
            onBack={goBack}
            onNavigateToDashboard={() => navigate('SubWarehouseAdminDashboard')}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onNavigateToNotifications={() => navigate('SubWarehouseNotifications')}
            onNavigateToCustomers={() => navigate('SubWarehouseCustomerList')}
            onNavigateToBilling={() => navigate('SubWarehouseBillingHub')}
            onNavigateToOrders={() => navigate('SubWarehouseCustomerOrders')}
            onNavigateToSales={() => navigate('SubWarehouseSales')}
            onNavigateToReturns={() => navigate('SubWarehouseReturnsIssues')}
            onNavigateToReturnHistory={() => navigate('SubWarehouseReturnHistory')}
            onNavigateToFinance={() => navigate('SubWarehouseFinance')}
            onNavigateToReports={() => navigate('SubWarehouseReports')}
            onNavigateToStaff={() => navigate('SubWarehouseStaff')}
            onNavigateToAttendance={() => navigate('SubWarehouseAttendance')}
            onNavigateToWarehouseOperations={() => navigate('SubWarehouseWarehouseOperations')}
            onNavigateToStorageLocations={() => navigate('SubWarehouseStorageInfo')}
            onNavigateToCapacity={() => navigate('SubWarehouseCapacity')}
            onNavigateToMaterialHandling={() => navigate('SubWarehouseMaterialHandling')}
            onNavigateToOperationalIssues={() => navigate('SubWarehouseOperationalIssues')}
            onNavigateToWarehouseActivity={() => navigate('SubWarehouseWarehouseActivity')}
            onNavigateToSettings={() => navigate('SubWarehouseSettings')}
            onLogout={() => navigate('Login')}
          />
        ) : screen === 'SubWarehouseCustomerList' ? (
          <SubWarehouseCustomersScreen
            onBack={goBack}
            onNavigateToSearch={() => navigate('SubWarehouseCustomerSearch')}
            onSelectCustomer={(cust) => navigate('SubWarehouseCustomerDetail', { customerName: cust.name, customerId: cust.code })}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
          />
        ) : screen === 'SubWarehouseCustomerSearch' ? (
          <SubWarehouseCustomerSearchScreen
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
        ) : screen === 'SubWarehouseCustomerDetail' ? (
          <SubWarehouseCustomerDetailsScreen
            customer={{
              name: (params['customerName'] as string) || 'Rajesh Kumar',
              id: (params['customerId'] as string) || 'CUS-00291',
              code: (params['customerId'] as string) || 'CUS-00291',
              phone: (params['customerPhone'] as string) || '+91 98765 43210',
              ordersCount: typeof params['customerOrders'] === 'number' ? params['customerOrders'] : 12,
              lastPurchase: (params['customerPurchases'] as string) || '24 Sep 2026',
            }}
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onNavigateToOrders={() =>
              navigate('SubWarehouseCustomerOrders', {
                customerName:
                  (params['customer'] as any)?.name ||
                  (params['customerName'] as string) ||
                  'Rajesh Kumar',
              })
            }
            onNavigateToPurchases={() =>
              navigate('SubWarehouseCustomerPurchases', {
                customerName:
                  (params['customer'] as any)?.name ||
                  (params['customerName'] as string) ||
                  'Rajesh Kumar',
              })
            }
            onNavigateToWallet={() =>
              navigate('SubWarehouseCustomerWallet', {
                customerName:
                  (params['customer'] as any)?.name ||
                  (params['customerName'] as string) ||
                  'Rajesh Kumar',
              })
            }
            onNavigateToIssues={() =>
              navigate('SubWarehouseCustomerIssues', {
                customerName:
                  (params['customer'] as any)?.name ||
                  (params['customerName'] as string) ||
                  'Rajesh Kumar',
              })
            }
            onNavigateToSupport={() =>
              navigate('SubWarehouseCustomerSupport', {
                customerName:
                  (params['customer'] as any)?.name ||
                  (params['customerName'] as string) ||
                  'Rajesh Kumar',
              })
            }
            onOpenCustomerActions={() =>
              navigate('SubWarehouseCustomerActions', {
                customerName:
                  (params['customer'] as any)?.name ||
                  (params['customerName'] as string) ||
                  'Rajesh Kumar',
                customerId:
                  (params['customer'] as any)?.id ||
                  (params['customerId'] as string) ||
                  'CUS-00291',
                customerPhone:
                  (params['customer'] as any)?.phone ||
                  (params['customerPhone'] as string) ||
                  '+91 98765 43210',
              })
            }
            onNavigateToNewSale={() =>
              navigate('SubWarehouseNewSale', {
                customerName:
                  (params['customer'] as any)?.name ||
                  (params['customerName'] as string) ||
                  'Rajesh Kumar',
              })
            }
            onNavigateToCashTopUp={() =>
              navigate('SubWarehouseCashTopUp', {
                customerName:
                  (params['customer'] as any)?.name ||
                  (params['customerName'] as string) ||
                  'Rajesh Kumar',
                customerCode:
                  (params['customer'] as any)?.id ||
                  (params['customerId'] as string) ||
                  'CUS-00291',
                currentBalance:
                  (params['customer'] as any)?.walletBalance ||
                  '₹1,250',
              })
            }
          />
        ) : screen === 'SubWarehouseCustomerActions' ? (
          <SubWarehouseCustomerActionsScreen
            customer={{
              name: (params['customerName'] as string) || 'Rajesh Kumar',
              id: (params['customerId'] as string) || 'CUS-00291',
              code: (params['customerId'] as string) || 'CUS-00291',
              phone: (params['customerPhone'] as string) || '+91 98765 43210',
            }}
            onBack={goBack}
            onNavigateToNewSale={() =>
              navigate('SubWarehouseNewSale', {
                customerName: (params['customerName'] as string) || 'Rajesh Kumar',
              })
            }
            onNavigateToOrders={() =>
              navigate('SubWarehouseCustomerOrders', {
                customerName: (params['customerName'] as string) || 'Rajesh Kumar',
              })
            }
            onNavigateToPurchases={() =>
              navigate('SubWarehouseCustomerPurchases', {
                customerName: (params['customerName'] as string) || 'Rajesh Kumar',
              })
            }
            onNavigateToCashTopUp={() =>
              navigate('SubWarehouseCashTopUp', {
                customerName: (params['customerName'] as string) || 'Rajesh Kumar',
                customerCode: (params['customerId'] as string) || 'CUS-00291',
                currentBalance: '₹1,250',
              })
            }
          />
        ) : screen === 'SubWarehouseCustomerOrders' ? (
          <SubWarehouseCustomerOrdersScreen
            customerName={(params['customerName'] as string) || 'Rajesh Kumar'}
            onBack={goBack}
            onOpenFilters={() =>
              navigate('SubWarehouseOrderFilters', {
                customerName: (params['customerName'] as string) || 'Rajesh Kumar',
              })
            }
            appliedFilters={orderFilters}
            onClearFilters={() => setOrderFilters(undefined)}
            onNavigateToOrderDetail={(order) =>
              navigate('SubWarehouseOrderDetail', {
                orderNo: order?.orderNo,
                orderStatus: order?.status,
                orderItems: order?.items,
                orderPrice: order?.price,
                orderDate: order?.date,
                orderType: order?.type,
                customerName: (params['customerName'] as string) || 'Rajesh Kumar',
              })
            }
            onViewPickupStatus={(order) =>
              navigate('SubWarehouseOrderDetail', {
                orderNo: order?.orderNo,
                orderStatus: order?.status,
                orderItems: order?.items,
                orderPrice: order?.price,
                orderDate: order?.date,
                orderType: order?.type,
                customerName: (params['customerName'] as string) || 'Rajesh Kumar',
              })
            }
            onViewInvoice={(order) =>
              navigate('SubWarehouseOrderDetail', {
                orderNo: order?.orderNo,
                orderStatus: order?.status,
                orderItems: order?.items,
                orderPrice: order?.price,
                orderDate: order?.date,
                orderType: order?.type,
                customerName: (params['customerName'] as string) || 'Rajesh Kumar',
              })
            }
          />
        ) : screen === 'SubWarehouseOrderFilters' ? (
          <SubWarehouseOrderFiltersScreen
            initialFilters={orderFilters}
            customerName={(params['customerName'] as string) || 'Rajesh Kumar'}
            onBack={goBack}
            onApplyFilters={(f) => {
              setOrderFilters(f);
              goBack();
            }}
          />
        ) : screen === 'SubWarehouseCustomerWallet' ? (
          <SubWarehouseCustomerWalletScreen
            customerName={(params['customerName'] as string) || (params['name'] as string) || 'Rajesh Kumar'}
            customer={{
              name: (params['name'] as string) || (params['customerName'] as string) || 'Ravi Kumar',
              id: (params['id'] as string) || (params['customerId'] as string) || 'CUS-001245',
              mobile: (params['mobile'] as string) || '+91 XXXXX XXXXX',
              balance: typeof params['balance'] === 'string'
                ? (params['balance'].includes('.00') ? params['balance'] : `${params['balance']}.00`)
                : '₹4,500.00',
              totalCredited: '₹25,000',
              totalUsed: '₹20,500',
            }}
            onBack={goBack}
            onCashTopUp={(cust) =>
              navigate('SubWarehouseCashTopUp', {
                customerName: cust?.name || (params['customerName'] as string) || (params['name'] as string) || 'Rajesh Kumar',
                customerCode: cust?.id || (params['customerId'] as string) || (params['id'] as string) || 'CUS-001245',
                currentBalance: cust?.balance || (params['balance'] as string) || '₹4,500.00',
              })
            }
            onNavigateToCashTopUp={(cust) =>
              navigate('SubWarehouseCashTopUp', {
                customerName: cust?.name || (params['customerName'] as string) || (params['name'] as string) || 'Rajesh Kumar',
                customerCode: cust?.id || (params['customerId'] as string) || (params['id'] as string) || 'CUS-001245',
                currentBalance: cust?.balance || (params['balance'] as string) || '₹4,500.00',
              })
            }
            onNavigateToTransactionDetail={(tx) => navigate('SubWarehouseTransactionDetail', tx as any)}
          />
        ) : screen === 'SubWarehouseCashTopUp' ? (
          <SubWarehouseCashTopUpScreen
            customerName={(params['customerName'] as string) || (params['name'] as string) || 'Rajesh Kumar'}
            customerCode={(params['customerCode'] as string) || (params['id'] as string) || (params['customerId'] as string) || 'CUS-00291'}
            currentBalance={typeof params['currentBalance'] === 'number' ? params['currentBalance'] : (params['currentBalance'] as string) || (params['balance'] as string) || '₹1,250'}
            warehouseName={(params['warehouseName'] as string) || 'Coonoor Warehouse'}
            processedBy={(params['processedBy'] as string) || 'SWA Name'}
            onBack={goBack}
            onSuccess={() => goBack()}
            onContinue={(data) => {
              navigate('SubWarehouseFiscalTag', {
                customerName: data.customerName,
                customerCode: data.customerCode,
                currentBalance: data.currentBalance,
                topUpAmount: data.topUpAmount,
                warehouseName: data.warehouseName,
                processedBy: data.processedBy,
                fiscalCashTag: 'FC-20260925-0012',
              });
            }}
          />
        ) : screen === 'SubWarehouseCustomerIssues' ? (
          <SubWarehouseCustomerIssuesScreen
            customerName={(params['customerName'] as string) || 'Rajesh Kumar'}
            onBack={goBack}
            onSelectIssue={(issue) =>
              navigate('SubWarehouseCustomerIssueDetail', {
                issueNo: issue.issueNo,
                orderNo: issue.orderNo,
                category: issue.category,
                status: issue.status,
                dateText: issue.dateText,
                customerName: (params['customerName'] as string) || 'Rajesh Kumar',
              })
            }
          />
        ) : screen === 'SubWarehouseCustomerIssueDetail' ? (
          <SubWarehouseCustomerIssueDetailScreen
            customerName={(params['customerName'] as string) || 'Rajesh Kumar'}
            issue={{
              issueNo: (params['issueNo'] as string) || 'ISSUE-00231',
              orderNo: (params['orderNo'] as string) || 'ORD-00251',
              category: (params['category'] as string) || 'Quality',
              status: (params['status'] as string) || 'In Review',
              dateText: (params['dateText'] as string) || '24 Sep 2026',
              product: (params['product'] as string) || 'Tomato Grade 1',
              quantity: (params['quantity'] as string) || '2 KG',
              description: (params['description'] as string) || 'Customer reported quality issue.',
            }}
            onBack={goBack}
            onViewRma={() => navigate('SubWarehouseReturnsIssues')}
          />
        ) : screen === 'SubWarehouseCustomerSupport' ? (
          <SubWarehouseSupportHistoryScreen
            customerName={(params['customerName'] as string) || 'Rajesh Kumar'}
            onBack={goBack}
            onSelectTicket={(ticket) =>
              navigate('SubWarehouseCustomerSupportDetail', {
                ticketNo: ticket.ticketNo,
                orderRef: ticket.orderRef,
                subject: ticket.subject,
                status: ticket.status,
                dateText: ticket.dateText,
                customerName: (params['customerName'] as string) || 'Rajesh Kumar',
              })
            }
          />
        ) : screen === 'SubWarehouseCustomerSupportDetail' ? (
          <SubWarehouseCustomerSupportDetailScreen
            customerName={(params['customerName'] as string) || 'Rajesh Kumar'}
            ticket={{
              ticketNo: (params['ticketNo'] as string) || 'SUP-00182',
              orderRef: (params['orderRef'] as string) || 'ORD-00251',
              subject: (params['subject'] as string) || 'Pickup Issue',
              status: (params['status'] as string) || 'Resolved',
              dateText: (params['dateText'] as string) || '24 Sep 2026',
              resolvedBy: (params['resolvedBy'] as string) || 'Admin',
            }}
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
          />
        ) : screen === 'SubWarehouseCustomerPurchases' || screen === 'SubWarehousePurchaseHistory' ? (
          <SubWarehousePurchaseHistoryScreen
            customerName={(params['customerName'] as string) || 'Rajesh Kumar'}
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onOpenFilters={() =>
              navigate('SubWarehousePurchaseFilters', {
                customerName: (params['customerName'] as string) || 'Rajesh Kumar',
              })
            }
            appliedFilters={purchaseFilters}
            onClearFilters={() => setPurchaseFilters(undefined)}
            onNavigateToSaleDetail={(invoiceNo) => {
              setSelectedSaleRecord({
                id: 'SALE-00251',
                customerName: (params['customerName'] as string) || 'Rajesh Kumar',
                customerCode: 'CUS-00291',
                channel: 'Direct Sale',
                dateText: '24 Sep, 6:35 PM',
                amount: 200,
                status: 'Completed',
                invoiceNo: invoiceNo || 'INV-00251',
                paymentMethod: 'UPI',
                items: [
                  {
                    name: 'Tomato',
                    grade: 'Grade 1',
                    batch: 'BTH-00231',
                    qtyText: '2 KG @ ₹100',
                    pricePerUnit: 100,
                    lineTotal: 200,
                  },
                ],
              });
              navigate('SubWarehouseSaleDetail', {
                saleId: 'SALE-00251',
                invoiceNo: invoiceNo || 'INV-00251',
                customerName: (params['customerName'] as string) || 'Rajesh Kumar',
              });
            }}
            onNavigateToOrderDetail={(orderNo) => {
              const is238 = orderNo === 'ORD-00238' || orderNo === 'INV-00238';
              navigate('SubWarehouseOrderDetail', {
                orderNo: orderNo || (is238 ? 'ORD-00238' : 'ORD-00251'),
                orderStatus: 'Completed',
                orderItems: is238 ? '3 Items' : '1 Item',
                orderPrice: is238 ? '₹650' : '₹200',
                orderDate: is238 ? '20 Sep 2026' : '24 Sep 2026',
                orderType: 'Pickup',
                customerName: (params['customerName'] as string) || 'Rajesh Kumar',
              });
            }}
          />
        ) : screen === 'SubWarehousePurchaseFilters' ? (
          <SubWarehousePurchaseFiltersScreen
            initialFilters={purchaseFilters}
            onBack={goBack}
            onApplyFilters={(f) => {
              setPurchaseFilters(f);
              goBack();
            }}
          />
        ) : screen === 'SubWarehouseBillingHub' ? (
          <SubWarehouseBillingHubScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onNavigateToInvoiceList={() => navigate('SubWarehouseInvoiceList')}
            onNavigateToInvoiceDetail={(id) =>
              navigate('SubWarehouseInvoiceDetail', { invoiceId: id || 'INV-2026-001245' })
            }
            onGenerateInvoice={() => navigate('SubWarehouseGenerateInvoice')}
            onNavigateToInvoiceHistory={() => navigate('SubWarehouseInvoiceHistory')}
            onNavigateToNotifications={() => navigate('SubWarehouseNotifications')}
          />
        ) : screen === 'SubWarehouseGenerateInvoice' ? (
          <SubWarehouseGenerateInvoiceScreen
            onBack={goBack}
            onSelectTransaction={(tx) =>
              navigate('SubWarehouseInvoicePreview', { invoiceId: 'INV-2026-001245' })
            }
            onNavigateToGSTInvoice={() => navigate('SubWarehouseGSTInvoice')}
          />
        ) : screen === 'SubWarehouseReviewInvoice' ? (
          <SubWarehouseReviewInvoiceScreen
            onBack={goBack}
            invoiceData={{
              invoiceType: (params['invoiceType'] as string) || 'Direct Sale',
              customerName: (params['customerName'] as string) || 'Rajesh Kumar',
              itemsCount: (params['itemsCount'] as number) || 2,
              subtotal: (params['subtotal'] as string) || '₹320',
              gst: (params['gst'] as string) || '₹0',
              total: (params['total'] as string) || '₹320',
            }}
            onGenerateSuccess={() =>
              navigate('SubWarehouseInvoicePreview', { invoiceId: 'INV-2026-001245' })
            }
          />
        ) : screen === 'SubWarehouseGSTInvoice' ? (
          <SubWarehouseGSTInvoiceScreen
            onBack={goBack}
            onViewExisting={() =>
              navigate('SubWarehouseInvoiceDetail', { invoiceId: 'INV-2026-001245' })
            }
            onPreviewAuthorized={() =>
              navigate('SubWarehouseInvoicePreview', { invoiceId: 'INV-2026-001245' })
            }
          />
        ) : screen === 'SubWarehouseInvoicePreview' ? (
          <SubWarehouseInvoicePreviewScreen
            invoiceId={(params['invoiceId'] as string) || 'INV-2026-001245'}
            onBack={goBack}
          />
        ) : screen === 'SubWarehouseInvoiceHistory' ? (
          <SubWarehouseInvoiceHistoryScreen
            onBack={goBack}
            onNavigateToInvoiceDetail={(id) =>
              navigate('SubWarehouseInvoiceDetail', { invoiceId: id })
            }
            onOpenFilters={() => navigate('SubWarehouseInvoiceHistoryFilters')}
            appliedFilters={invoiceHistoryFilters}
            onClearFilters={() => setInvoiceHistoryFilters(undefined)}
          />
        ) : screen === 'SubWarehouseInvoiceHistoryFilters' ? (
          <SubWarehouseInvoiceHistoryFiltersScreen
            initialFilters={invoiceHistoryFilters}
            onBack={goBack}
            onApplyFilters={(f) => {
              setInvoiceHistoryFilters(f);
              goBack();
            }}
          />
        ) : screen === 'SubWarehouseInvoiceList' ? (
          <SubWarehouseInvoiceListScreen
            onBack={goBack}
            onNavigateToInvoiceDetail={(id) =>
              navigate('SubWarehouseInvoiceDetail', { invoiceId: id })
            }
            onOpenFilters={() => navigate('SubWarehouseInvoiceFilters')}
            appliedFilters={invoiceFilters}
            onClearFilters={() => setInvoiceFilters(undefined)}
          />
        ) : screen === 'SubWarehouseInvoiceFilters' ? (
          <SubWarehouseInvoiceFiltersScreen
            initialFilters={invoiceFilters}
            onBack={goBack}
            onApplyFilters={(f) => {
              setInvoiceFilters(f);
              goBack();
            }}
          />
        ) : screen === 'SubWarehouseInvoiceDetail' ? (
          <SubWarehouseInvoiceDetailScreen
            invoiceId={(params['invoiceId'] as string) || (selectedSaleRecord as any)?.invoiceNo || 'INV-2026-001245'}
            onBack={goBack}
          />
        ) : screen === 'SubWarehouseTaskActionCenter' ? (
          <SubWarehouseTaskActionCenterScreen
            onBack={goBack}
            onNavigateToTaskDetail={() => navigate('SubWarehouseTaskDetail')}
            onNavigateToOrderDetail={() => navigate('SubWarehouseOrderDetail')}
            onStartTask={(task) => {
              if (task?.id === 'TSK-002' || task?.title?.includes('Pickup')) {
                navigate('SubWarehouseOrderDetail');
              } else {
                navigate('SubWarehouseTaskDetail');
              }
            }}
          />
        ) : screen === 'SubWarehouseTaskDetail' ? (
          <SubWarehouseTaskDetailScreen
            onBack={goBack}
            onMarkInProgress={() => {
              Alert.alert('Task Updated', 'Task marked as In Progress');
              goBack();
            }}
          />
        ) : screen === 'SubWarehouseOrderDetail' ? (
          <OrdersModule
            initialScreen="M5S04"
            initialParams={{
              orderId: (params['orderNo'] as string) || 'ORD-00251',
              customerName: (params['customerName'] as string) || 'Rajesh Kumar',
            }}
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
          />
        ) : screen === 'SubWarehouseApprovalAlerts' ? (
          <SubWarehouseApprovalAlertsScreen
            onBack={goBack}
            onNavigateToExpenseRecord={() => navigate('SubWarehouseExpenseRecord')}
            onNavigateToGoodsReceiptDetail={() => navigate('SubWarehouseGoodsReceiptDetail')}
            onOpenRecord={(alertId) => {
              if (alertId === 'GR-00245') {
                navigate('SubWarehouseGoodsReceiptDetail');
              } else {
                navigate('SubWarehouseExpenseRecord');
              }
            }}
          />
        ) : screen === 'SubWarehouseExpenseRecord' ? (
          <SubWarehouseExpenseRecordScreen
            onBack={goBack}
            onApprove={() => {
              Alert.alert('Approved', 'Expense EXP-001245 approved successfully.');
              goBack();
            }}
          />
        ) : screen === 'SubWarehouseGoodsReceiptDetail' ? (
          <SubWarehouseGoodsReceiptDetailScreen
            onBack={goBack}
            onTakeAction={() => {
              Alert.alert('Action Taken', 'Variance reconciliation initiated.');
              goBack();
            }}
          />
        ) : screen === 'SubWarehouseSystemMessages' ? (
          <SubWarehouseSystemMessagesScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onNavigateToHistory={() => navigate('SubWarehouseMessageHistory')}
          />
        ) : screen === 'SubWarehouseMessageHistory' ? (
          <SubWarehouseMessageHistoryScreen
            onBack={goBack}
            onNavigateToReturns={() => navigate('SubWarehouseReturnsIssues')}
            onNavigateToStaff={() => navigate('SubWarehouseStaff')}
            onNavigateToAttendance={() => navigate('SubWarehouseAttendance')}
          />
        ) : screen === 'SubWarehouseWalletOperations' ? (
          <SubWarehouseWalletOperationsScreen
            warehouseName="Coonoor Warehouse"
            onBack={goBack}
            onNavigateToCashTopUp={() => navigate('SubWarehouseCashTopUp')}
            onNavigateToCustomerSearch={() => navigate('SubWarehouseCustomerSearch')}
            onNavigateToTopUpHistory={() => navigate('SubWarehouseTopUpHistory')}
            onNavigateToDailySummary={() => navigate('SubWarehouseDailyCashSummary')}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onNavigateToNotifications={() => navigate('SubWarehouseNotifications')}
            onNavigateToProfile={() => navigate('SubWarehouseProfile')}
          />
        ) : screen === 'SubWarehouseTransactionDetail' ? (
          <SubWarehouseTransactionDetailScreen
            details={params as any}
            onBack={goBack}
          />
        ) : screen === 'SubWarehouseFiscalTag' ? (
          <SubWarehouseFiscalTagScreen
            initialData={{
              customerName: typeof params['customerName'] === 'string' ? params['customerName'] : 'Ravi Kumar',
              customerId: typeof params['customerCode'] === 'string' ? params['customerCode'] : 'CUS-001245',
              currentBalance: typeof params['currentBalance'] === 'number' ? params['currentBalance'] : 4500,
              topUpAmount: typeof params['topUpAmount'] === 'number' ? params['topUpAmount'] : 2000,
              warehouseName: typeof params['warehouseName'] === 'string' ? params['warehouseName'] : 'Coonoor Warehouse',
              processedBy: typeof params['processedBy'] === 'string' ? params['processedBy'] : 'SWA – Suresh',
              fiscalCashTag: typeof params['fiscalCashTag'] === 'string' ? params['fiscalCashTag'] : 'FC-20260925-0012',
            }}
            onBack={goBack}
            onReviewTopUp={(tagData) => {
              navigate('SubWarehouseConfirmCashTopUp', {
                ...params,
                fiscalCashTag: tagData.fiscalCashTag || 'FC-20260925-0012',
                dateStr: '25 Sep 2026',
                timeStr: '10:42 AM',
              });
            }}
          />
        ) : screen === 'SubWarehouseConfirmCashTopUp' ? (
          <SubWarehouseConfirmCashTopUpScreen
            details={{
              customerName: typeof params['customerName'] === 'string' ? params['customerName'] : 'Ravi Kumar',
              customerCode: typeof params['customerCode'] === 'string' ? params['customerCode'] : 'CUS-001245',
              currentBalance: typeof params['currentBalance'] === 'number' ? params['currentBalance'] : 4500,
              topUpAmount: typeof params['topUpAmount'] === 'number' ? params['topUpAmount'] : 2000,
              warehouseName: typeof params['warehouseName'] === 'string' ? params['warehouseName'] : 'Coonoor Warehouse',
              processedBy: typeof params['processedBy'] === 'string' ? params['processedBy'] : 'SWA – Suresh',
              fiscalCashTag: typeof params['fiscalCashTag'] === 'string' ? params['fiscalCashTag'] : 'FC-20260925-0012',
              dateStr: typeof params['dateStr'] === 'string' ? params['dateStr'] : '25 Sep 2026',
              timeStr: typeof params['timeStr'] === 'string' ? params['timeStr'] : '10:42 AM',
            }}
            onBack={goBack}
            onSuccess={() => {
              navigate('SubWarehouseWalletOperations');
            }}
          />
        ) : screen === 'SubWarehouseTopUpHistory' ? (
          <SubWarehouseTopUpHistoryScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
          />
        ) : screen === 'SubWarehouseDailyCashSummary' ? (
          <SubWarehouseDailyCashSummaryScreen
            onBack={goBack}
            onViewTopUpHistory={() => navigate('SubWarehouseTopUpHistory')}
            onNavigateToDailyCash={() => navigate('SubWarehouseDailyCash')}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
          />
        ) : screen === 'SubWarehouseTopUpDetails' ? (
          <SubWarehouseTopUpDetailsScreen
            details={params['topUpDetails'] as any}
            onBack={goBack}
          />
        ) : screen === 'SubWarehouseTopUpSuccess' ? (
          <SubWarehouseTopUpSuccessScreen
            data={params['topUpSuccess'] as any}
            onBack={goBack}
            onDone={() => navigate('SubWarehouseWalletOperations')}
            onViewTransaction={(data) => {
              navigate('SubWarehouseTopUpDetails', {
                topUpDetails: {
                  customerName: data.customerName,
                  customerId: 'CUS-001245',
                  previousBalance: '₹4,500',
                  topUpAmount: data.topUpAmount,
                  newBalance: data.walletBalance,
                  transactionId: data.transactionId,
                  status: 'Completed',
                  type: 'Cash Top-Up',
                  fiscalCashTag: data.fiscalCashTag,
                  dateTime: data.dateTime,
                  createdBy: 'SWA – Suresh',
                  createdAt: data.dateTime,
                  warehouse: 'Coonoor',
                } as any,
              });
            }}
          />
        ) : screen === 'SubWarehouseWalletAttention' ? (
          <SubWarehouseWalletAttentionScreen
            initialCategory={(params['category'] as any) || 'all'}
            onBack={goBack}
            onNavigateToCashTopUp={() => navigate('SubWarehouseCashTopUp')}
          />
        ) : screen === 'SubWarehouseReturnsIssues' ? (
          <SubWarehouseReturnsIssuesScreen
            warehouseName="Coonoor Warehouse"
            onBack={goBack}
            onSelectRma={(rma) => navigate('SubWarehouseRmaDetail', { rma: rma as any })}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onNavigateToHistory={() => navigate('SubWarehouseReturnHistory')}
            onNavigateToNotifications={() => navigate('SubWarehouseNotifications')}
          />
        ) : screen === 'SubWarehouseRmaDetail' ? (
          <SubWarehouseRmaDetailScreen
            rma={(params['rma'] as unknown as RmaRecord) || INITIAL_RMA_ITEMS[0]}
            onBack={goBack}
            onInspectProduct={(rma) => navigate('SubWarehouseInspectProduct', { rma: rma as any })}
            onViewImage={(photoIndex) =>
              navigate('SubWarehouseImageViewer', {
                rma: params['rma'] as any,
                photoIndex,
              })
            }
          />
        ) : screen === 'SubWarehouseImageViewer' ? (
          <SubWarehouseImageViewerScreen
            rma={(params['rma'] as unknown as RmaRecord) || INITIAL_RMA_ITEMS[0]}
            photoIndex={(params['photoIndex'] as number) || 1}
            onBack={goBack}
          />
        ) : screen === 'SubWarehouseInspectProduct' ? (
          <SubWarehouseInspectProductScreen
            rma={(params['rma'] as unknown as RmaRecord) || INITIAL_RMA_ITEMS[0]}
            onBack={goBack}
            onContinueToReview={(inspectionData) => {
              navigate('SubWarehouseReviewReturnRequest', {
                rma: inspectionData.rma as any,
                inspectedQty: inspectionData.receivedQty,
                notes: inspectionData.notes,
              });
            }}
          />
        ) : screen === 'SubWarehouseReviewReturnRequest' ? (
          <SubWarehouseReviewReturnRequestScreen
            rma={(params['rma'] as unknown as RmaRecord) || INITIAL_RMA_ITEMS[0]}
            inspectedQty={typeof params['inspectedQty'] === 'string' ? params['inspectedQty'] : '1.8 KG'}
            inspectionNotes={typeof params['notes'] === 'string' ? params['notes'] : 'Product partially damaged...'}
            onBack={goBack}
            onApprove={(rma) => {
              navigate('SubWarehouseApproveReturn', { rma: rma as any });
            }}
            onReject={(rma) => {
              navigate('SubWarehouseRejectReturnRequest', { rma: rma as any });
            }}
          />
        ) : screen === 'SubWarehouseApproveReturn' ? (
          <SubWarehouseApproveReturnScreen
            rma={(params['rma'] as unknown as RmaRecord) || INITIAL_RMA_ITEMS[0]}
            onBack={goBack}
            onConfirmApprove={(rma) => {
              navigate('SubWarehouseReturnApproved', { rma: rma as any });
            }}
          />
        ) : screen === 'SubWarehouseRejectReturnRequest' ? (
          <SubWarehouseRejectReturnRequestScreen
            rma={(params['rma'] as unknown as RmaRecord) || INITIAL_RMA_ITEMS[0]}
            onBack={goBack}
            onRejectSuccess={(data) => {
              navigate('SubWarehouseRequestRejected', { rma: data.rma as any, reason: data.reason });
            }}
          />
        ) : screen === 'SubWarehouseRequestRejected' ? (
          <SubWarehouseRequestRejectedScreen
            rma={(params['rma'] as unknown as RmaRecord) || INITIAL_RMA_ITEMS[0]}
            onDone={() => navigate('SubWarehouseReturnsIssues')}
          />
        ) : screen === 'SubWarehouseReturnApproved' ? (
          <SubWarehouseReturnApprovedScreen
            rma={(params['rma'] as unknown as RmaRecord) || INITIAL_RMA_ITEMS[0]}
            onBack={goBack}
            onGoToRefundStatus={(rma) => {
              navigate('SubWarehouseRefundStatus', { rma: rma as any });
            }}
          />
        ) : screen === 'SubWarehouseRefundStatus' ? (
          <SubWarehouseRefundStatusScreen
            rma={(params['rma'] as unknown as RmaRecord) || INITIAL_RMA_ITEMS[0]}
            refundAmount="₹200.00"
            onBack={goBack}
            onConfirmSuccess={(data) => {
              navigate('SubWarehouseRefundCompleted', {
                rma: data.rma as any,
                refundAmount: data.refundAmount,
              });
            }}
            onSimulateFailure={(rma) => {
              navigate('SubWarehouseRefundFailed', { rma: rma as any });
            }}
          />
        ) : screen === 'SubWarehouseRefundCompleted' ? (
          <SubWarehouseRefundCompletedScreen
            rma={(params['rma'] as unknown as RmaRecord) || INITIAL_RMA_ITEMS[0]}
            refundAmount={typeof params['refundAmount'] === 'string' ? params['refundAmount'] : '₹200'}
            transactionId="REF-2026-001245"
            onBack={() => navigate('SubWarehouseReturnsIssues')}
          />
        ) : screen === 'SubWarehouseReturnHistory' ? (
          <SubWarehouseReturnHistoryScreen
            onBack={goBack}
            onSelectRecord={(rec) => navigate('SubWarehouseReturnHistoryDetail', { record: rec as any })}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseReturnsIssues');
            }}
          />
        ) : screen === 'SubWarehouseReturnHistoryDetail' ? (
          <SubWarehouseReturnHistoryDetailScreen
            record={params['record'] as any}
            onBack={goBack}
          />
        ) : screen === 'SubWarehouseRefundFailed' ? (
          <SubWarehouseRefundFailedScreen
            rma={(params['rma'] as unknown as RmaRecord) || INITIAL_RMA_ITEMS[0]}
            onBack={goBack}
          />
        ) : screen === 'SubWarehouseRmaResolutionSuccess' ? (
          <SubWarehouseRmaResolutionSuccessScreen
            rma={(params['rma'] as unknown as RmaRecord) || INITIAL_RMA_ITEMS[0]}
            status={(params['status'] as any) || 'Approved'}
            approvedQty={typeof params['approvedQty'] === 'string' ? params['approvedQty'] : '1.8 KG'}
            refundAmount={typeof params['refundAmount'] === 'string' ? params['refundAmount'] : '₹180.00'}
            onViewReturnsList={() => navigate('SubWarehouseReturnsIssues')}
            onBackToMore={() => navigate('SubWarehouseMore')}
          />
        ) : screen === 'SubWarehouseStaff' ? (
          <SubWarehouseStaffScreen
            onBack={goBack}
            onSelectStaff={(staff) => navigate('SubWarehouseStaffDetail', { staff: staff as any })}
            onNavigateToAttendance={() => navigate('SubWarehouseAttendance')}
            onNavigateToTodayAttendance={() => navigate('SubWarehouseTodayAttendance')}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
          />
        ) : screen === 'SubWarehouseStaffDetail' ? (
          <SubWarehouseStaffDetailScreen
            staff={params['staff'] as any}
            onBack={goBack}
            onViewAttendance={() => navigate('SubWarehouseAttendance', { staff: params['staff'] as any })}
            onEditProfile={(staff) => navigate('SubWarehouseEditStaffProfile', { staff: staff as any })}
          />
        ) : screen === 'SubWarehouseEditStaffProfile' ? (
          <SubWarehouseEditStaffProfileScreen
            staff={params['staff'] as any}
            onBack={goBack}
            onSave={(staff) => {
              // Usually we'd update state or refetch, but here just go back to Staff
              goBack();
              goBack();
            }}
          />
        ) : screen === 'SubWarehouseAttendance' ? (
          <SubWarehouseAttendanceScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
          />
        ) : screen === 'SubWarehouseTodayAttendance' ? (
          <SubWarehouseTodayAttendanceScreen
            onBack={goBack}
            onNavigateToHistory={() => navigate('SubWarehouseAttendanceHistory')}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
          />
        ) : screen === 'SubWarehouseAttendanceHistory' ? (
          <SubWarehouseAttendanceHistoryScreen
            onBack={goBack}
            onNavigateToToday={() => navigate('SubWarehouseTodayAttendance')}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
          />
        ) : screen === 'SubWarehouseDailyCash' ? (
          <SubWarehouseDailyCashScreen
            warehouseName="Coonoor Warehouse"
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
          />
        ) : screen === 'SubWarehouseFinance' ? (
          <SubWarehouseFinanceScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onNavigateToNotifications={() => navigate('SubWarehouseNotifications')}
            onNavigateToReports={() => navigate('SubWarehouseFinanceReports')}
            onNavigateToRevenue={() => navigate('SubWarehouseRevenue')}
            onNavigateToExpenses={() => navigate('SubWarehouseExpenses')}
            onNavigateToAddExpense={() => navigate('SubWarehouseAddExpense')}
            onNavigateToVouchers={() => navigate('SubWarehouseVouchers')}
            onNavigateToDailyCash={() => navigate('SubWarehouseDailyCash')}
            onNavigateToHistory={() => navigate('SubWarehouseFinanceHistory')}
            onNavigateToCategories={() => navigate('SubWarehouseExpenseCategories')}
            onNavigateToCustomerOrders={() => navigate('SubWarehouseCustomerOrders')}
            onNavigateToInvoiceList={() => navigate('SubWarehouseInvoiceList')}
          />
        ) : screen === 'SubWarehouseRevenue' ? (
          <SubWarehouseRevenueScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onNavigateToDetail={(id) => navigate('SubWarehouseRevenueDetail')}
          />
        ) : screen === 'SubWarehouseRevenueDetail' ? (
          <SubWarehouseRevenueDetailScreen
            onBack={goBack}
            revenueId={(params['revenueId'] as string) || 'REV-000845'}
            finalAmount={(params['finalAmount'] as string) || '3,450'}
            salesChannel={(params['salesChannel'] as string) || 'Market Sale'}
            transactionDate={(params['transactionDate'] as string) || '25 Sep, 11:20 AM'}
            onViewOrder={() => navigate('SubWarehouseCustomerOrders')}
            onViewInvoice={() => navigate('SubWarehouseInvoiceList')}
            onViewTransactionHistory={() => navigate('SubWarehouseFinanceHistory')}
          />
        ) : screen === 'SubWarehouseExpenses' ? (
          <SubWarehouseExpensesScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onAddExpense={() => navigate('SubWarehouseAddExpense')}
          />
        ) : screen === 'SubWarehouseAddExpense' ? (
          <SubWarehouseAddExpenseScreen
            onBack={goBack}
            onSaveSuccess={() => {
              navigate('SubWarehouseExpenseDetail', {
                expenseId: 'EXP-001245',
                amount: 2400,
                category: 'Transport',
                date: '25 Sep 2026',
                description: 'Transport from Coonoor collection point to warehouse',
                paymentMethod: 'Cash',
                vendorPayee: 'Coonoor Transport Co.',
                warehouse: 'Coonoor Warehouse',
                createdBy: 'SWA - Suresh',
                status: 'Recorded',
              });
            }}
            initialExpense={{
              expenseId: (params['expenseId'] as string) || 'EXP-001245',
              amount: String(params['amount'] || '2400'),
              category: (params['category'] as string) || 'Transport',
              date: (params['date'] as string) || '25 Sep 2026',
              description: (params['description'] as string) || 'Transport from Coonoor collection point to warehouse',
              paymentMethod: (params['paymentMethod'] as 'Cash' | 'UPI' | 'Bank') || 'Cash',
              vendorPayee: (params['vendorPayee'] as string) || 'Coonoor Transport Co.'
            }}
          />
        ) : screen === 'SubWarehouseExpenseDetail' ? (
          <SubWarehouseExpenseDetailScreen
            expenseId={(params['expenseId'] as string) || 'EXP-001245'}
            amount={params['amount'] as any}
            category={params['category'] as string}
            date={params['date'] as string}
            description={params['description'] as string}
            paymentMethod={params['paymentMethod'] as string}
            vendorPayee={params['vendorPayee'] as string}
            warehouse={(params['warehouse'] as string) || 'Coonoor Warehouse'}
            createdBy={params['createdBy'] as string}
            status={params['status'] as string}
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}

            onEdit={() => navigate('SubWarehouseAddExpense', params)}
            isReceiptView={!!params['isReceiptView'] && params['isReceiptView'] === 'true'}
            onViewReceipt={() => navigate('SubWarehouseExpenseDetail', { ...params, isReceiptView: 'true' })}
          />
        ) : screen === 'SubWarehouseExpenseCategories' ? (
          <SubWarehouseExpenseCategoriesScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
          />
        ) : screen === 'SubWarehouseFinanceHistory' ? (
          <SubWarehouseFinanceHistoryScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onSelectItem={(item) => {
              if (item.type === 'Revenue') {
                navigate('SubWarehouseRevenueDetail', {
                  revenueId: item.id,
                  finalAmount: item.amount.toString(),
                  salesChannel: item.title,
                  transactionDate: item.time,
                });
              } else {
                navigate('SubWarehouseExpenseDetail', {
                  expenseId: item.id,
                  amount: item.amount,
                  category: item.title,
                  date: item.time,
                });
              }
            }}
          />
        ) : screen === 'SubWarehouseFinanceReports' ? (
          <SubWarehouseFinanceReportsScreen
            warehouseName="Coonoor Warehouse"
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}

            onNavigateToCustomerOrders={() => navigate('SubWarehouseCustomerOrders')}
            onNavigateToInvoiceList={() => navigate('SubWarehouseInvoiceList')}
            onNavigateToHistory={() => navigate('SubWarehouseFinanceHistory')}
          />
        ) : screen === 'SubWarehouseVouchers' ? (
          <SubWarehouseVouchersScreen
            warehouseName="Coonoor Warehouse"
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onSelectVoucher={(voucher) => {
              Alert.alert('Voucher Record', `Voucher ${voucher.id} - Amount: ₹${voucher.amount}`);
            }}
          />
        ) : screen === 'SubWarehouseWarehouseOperations' ? (
          <SubWarehouseWarehouseOperationsScreen
            onBack={() => navigate('SubWarehouseAdminDashboard', { initialTab: 'More' })}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard', { initialTab: 'Home' });
              else if (tab === 'Receiving') navigate('SubWarehouseAdminDashboard', { initialTab: 'Receiving', initialReceivingSubView: 'incoming_shipments' });
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S01' });
              else if (tab === 'More') navigate('SubWarehouseAdminDashboard', { initialTab: 'More' });
            }}
            onNavigateToStorageLocations={() => navigate('SubWarehouseStorageInfo')}
            onNavigateToCapacity={() => navigate('SubWarehouseCapacity')}
            onNavigateToMaterialHandling={() => navigate('SubWarehouseMaterialHandling')}
            onNavigateToOperationalIssues={() => navigate('SubWarehouseOperationalIssues')}
            onNavigateToStaffAttendance={() => navigate('SubWarehouseTodayAttendance')}
            onNavigateToReceiveGoods={() => navigate('SubWarehouseAdminDashboard', { initialTab: 'Receiving', initialReceivingSubView: 'incoming_shipments' })}
            onNavigateToStockVerification={() => navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S10' })}
            onNavigateToTodayOperations={() => navigate('SubWarehouseTodayOperations')}
            onNavigateToWarehouseActivity={() => navigate('SubWarehouseWarehouseActivity')}
          />
        ) : screen === 'SubWarehouseTodayOperations' ? (
          <SubWarehouseTodayOperationsScreen
            onBack={() => navigate('SubWarehouseWarehouseOperations')}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard', { initialTab: 'Home' });
              else if (tab === 'Receiving') navigate('SubWarehouseAdminDashboard', { initialTab: 'Receiving', initialReceivingSubView: 'incoming_shipments' });
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S01' });
              else if (tab === 'More') navigate('SubWarehouseWarehouseOperations');
            }}
            onSelectActivity={(activity) => navigate('SubWarehouseActivityDetail', { activity })}
            onNavigateToReceiving={() => navigate('SubWarehouseAdminDashboard', { initialTab: 'Receiving', initialReceivingSubView: 'incoming_shipments' })}
            onNavigateToMaterialHandling={() => navigate('SubWarehouseMaterialHandling')}
            onNavigateToStorage={() => navigate('SubWarehouseStorageInfo')}
            onNavigateToStockVerification={() => navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S10' })}
            onNavigateToOperationalIssues={() => navigate('SubWarehouseOperationalIssues')}
          />
        ) : screen === 'SubWarehouseWarehouseActivity' ? (
          <SubWarehouseWarehouseActivityScreen
            onBack={() => navigate('SubWarehouseWarehouseOperations')}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard', { initialTab: 'Home' });
              else if (tab === 'Receiving') navigate('SubWarehouseAdminDashboard', { initialTab: 'Receiving', initialReceivingSubView: 'incoming_shipments' });
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S01' });
              else if (tab === 'More') navigate('SubWarehouseWarehouseOperations');
            }}
            onSelectActivity={(activity) => navigate('SubWarehouseActivityDetail', { activity })}
            onNavigateToReceiving={() => navigate('SubWarehouseAdminDashboard', { initialTab: 'Receiving', initialReceivingSubView: 'incoming_shipments' })}
            onNavigateToMaterialHandling={() => navigate('SubWarehouseMaterialHandling')}
            onNavigateToStorage={() => navigate('SubWarehouseStorageInfo')}
            onNavigateToStockVerification={() => navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S10' })}
            onNavigateToOperationalIssues={() => navigate('SubWarehouseOperationalIssues')}
          />
        ) : screen === 'SubWarehouseActivityDetail' ? (
          <SubWarehouseActivityDetailScreen
            activity={params['activity'] as any}
            onBack={() => navigate('SubWarehouseWarehouseActivity')}
          />
        ) : screen === 'SubWarehouseStorageLocationDetail' ? (
          <SubWarehouseStorageLocationDetailScreen
            locationId={(params?.['locationId'] as string) || 'CS-A01'}
            warehouseName="Coonoor Warehouse"
            onBack={() => navigate('SubWarehouseStorageInfo')}
            onViewStock={() => navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S02' })}
            onViewActivity={() => navigate('SubWarehouseWarehouseActivity')}
            onViewStock={() => {
              navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory' });
            }}
          />
        ) : screen === 'SubWarehouseMaterialHandling' ? (
          <SubWarehouseMaterialHandlingScreen
            onBack={() => navigate('SubWarehouseWarehouseOperations')}
            onSelectMaterial={(id) => navigate('SubWarehouseMaterialDetail', { materialId: id })}
            onAddMaterial={() => navigate('SubWarehouseAddMaterial')}
          />
        ) : screen === 'SubWarehouseMaterialDetail' ? (
          <SubWarehouseMaterialDetailScreen
            materialId={(params['materialId'] as string) || 'MAT-01'}
            onBack={() => navigate('SubWarehouseMaterialHandling')}
            onAddStock={() => navigate('SubWarehouseAddMaterial')}
          />
        ) : screen === 'SubWarehouseAddMaterial' ? (
          <SubWarehouseAddMaterialScreen
            onBack={() => navigate('SubWarehouseMaterialHandling')}
            onSave={() => navigate('SubWarehouseMaterialHandling')}
          />
        ) : screen === 'SubWarehouseCapacity' ? (
          <SubWarehouseCapacityScreen
            onBack={() => navigate('SubWarehouseWarehouseOperations')}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard', { initialTab: 'Home' });
              else if (tab === 'Receiving') navigate('SubWarehouseAdminDashboard', { initialTab: 'Receiving', initialReceivingSubView: 'incoming_shipments' });
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S01' });
              else if (tab === 'More') navigate('SubWarehouseWarehouseOperations');
            }}
          />
        ) : screen === 'SubWarehouseOperationalIssues' ? (
          <SubWarehouseOperationalIssuesScreen
            onBack={() => navigate('SubWarehouseWarehouseOperations')}
            onNavigateToReport={() => navigate('SubWarehouseReportIssue')}
            onViewIssueDetail={() => navigate('SubWarehouseOperationalIssueDetail')}
          />
        ) : screen === 'SubWarehouseReportIssue' ? (
          <SubWarehouseReportIssueScreen
            onBack={() => navigate('SubWarehouseOperationalIssues')}
            onSubmit={() => navigate('SubWarehouseIssueSubmitted')}
          />
        ) : screen === 'SubWarehouseIssueSubmitted' ? (
          <SubWarehouseIssueSubmittedScreen
            onViewIssue={() => navigate('SubWarehouseOperationalIssues')}
          />
        ) : screen === 'SubWarehouseOperationalIssueDetail' ? (
          <SubWarehouseOperationalIssueDetailScreen
            onBack={() => navigate('SubWarehouseOperationalIssues')}
          />
        ) : screen === 'SubWarehouseStaffAndAttendance' ? (
          <SubWarehouseStaffAndAttendanceScreen
            onBack={() => navigate('SubWarehouseWarehouseOperations')}
            onNavigateToDetail={(staffId) => navigate('SubWarehouseAttendanceDetail', { staffId })}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard', { initialTab: 'Home' });
              else if (tab === 'Receiving') navigate('SubWarehouseAdminDashboard', { initialTab: 'Receiving', initialReceivingSubView: 'incoming_shipments' });
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard', { initialTab: 'Inventory', initialInventoryScreen: 'M3S01' });
              else if (tab === 'More') navigate('SubWarehouseWarehouseOperations');
            }}
          />
        ) : screen === 'SubWarehouseAttendanceDetail' ? (
          <SubWarehouseAttendanceDetailScreen
            staffId={(params['staffId'] as string) || 'STAFF-1'}
            onBack={() => navigate('SubWarehouseStaffAndAttendance')}
          />
        ) : screen === 'SubWarehouseReports' ? (
          <SubWarehouseReportsScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onNavigateToNotifications={() => navigate('SubWarehouseNotifications')}
            onSelectReport={(reportKey) => {
              Alert.alert('Report Selected', `Viewing analytics for: ${reportKey}`);
            }}
          />
        ) : screen === 'SubWarehouseSettings' ? (
          <SubWarehouseSettingsScreen
            onBack={goBack}
            onLogout={() => navigate('Login')}
          />
        ) : screen === 'SubWarehouseCustomers' ? (
          <SubWarehouseCustomersScreen
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onNavigateToSearch={() => navigate('SubWarehouseCustomerSearch')}
            onSelectCustomer={(cust) =>
              navigate('SubWarehouseCustomerDetail', {
                customerName: cust.name,
                customerId: cust.code || cust.id,
                customerPhone: cust.phone,
                customerOrders: (cust as any).ordersCount ?? (cust as any).orders,
                customerPurchases: cust.lastPurchase,
              })
            }
            onNavigateToNotifications={() => navigate('SubWarehouseNotifications')}
          />
        ) : screen === 'SubWarehouseCustomerDetails' ? (
          <SubWarehouseCustomerDetailsScreen
            customer={{
              name: (params['customerName'] as string) || 'Rajesh Kumar',
              id: (params['customerId'] as string) || 'CUS-00291',
              code: (params['customerId'] as string) || 'CUS-00291',
              phone: (params['customerPhone'] as string) || '+91 98765 43210',
              ordersCount: typeof params['customerOrders'] === 'number' ? params['customerOrders'] : 12,
              lastPurchase: (params['customerPurchases'] as string) || '24 Sep 2026',
            }}
            onBack={goBack}
            onTabChange={(tab) => {
              if (tab === 'Home') navigate('SubWarehouseAdminDashboard');
              else if (tab === 'Receiving') navigate('ReceivingQcScreen' as any);
              else if (tab === 'Inventory') navigate('SubWarehouseAdminDashboard' as any);
              else if (tab === 'More') navigate('SubWarehouseMore');
            }}
            onNavigateToOrders={() =>
              navigate('SubWarehouseCustomerOrders', {
                customerName:
                  (params['customer'] as any)?.name ||
                  (params['customerName'] as string) ||
                  'Rajesh Kumar',
              })
            }
            onNavigateToPurchases={() =>
              navigate('SubWarehouseCustomerPurchases', {
                customerName:
                  (params['customer'] as any)?.name ||
                  (params['customerName'] as string) ||
                  'Rajesh Kumar',
              })
            }
            onNavigateToWallet={() =>
              navigate('SubWarehouseCustomerWallet', {
                customerName:
                  (params['customer'] as any)?.name ||
                  (params['customerName'] as string) ||
                  'Rajesh Kumar',
              })
            }
            onNavigateToIssues={() =>
              navigate('SubWarehouseCustomerIssues', {
                customerName:
                  (params['customer'] as any)?.name ||
                  (params['customerName'] as string) ||
                  'Rajesh Kumar',
              })
            }
            onNavigateToSupport={() =>
              navigate('SubWarehouseCustomerSupport', {
                customerName:
                  (params['customer'] as any)?.name ||
                  (params['customerName'] as string) ||
                  'Rajesh Kumar',
              })
            }
            onNavigateToNewSale={() =>
              navigate('SubWarehouseNewSale', {
                customerName:
                  (params['customer'] as any)?.name ||
                  (params['customerName'] as string) ||
                  'Rajesh Kumar',
              })
            }
            onNavigateToCashTopUp={() =>
              navigate('SubWarehouseCashTopUp', {
                customerName:
                  (params['customer'] as any)?.name ||
                  (params['customerName'] as string) ||
                  'Rajesh Kumar',
                customerCode:
                  (params['customer'] as any)?.id ||
                  (params['customerId'] as string) ||
                  'CUS-00291',
                currentBalance:
                  (params['customer'] as any)?.walletBalance ||
                  '₹1,250',
              })
            }
            onOpenCustomerActions={() =>
              navigate('SubWarehouseCustomerActions', {
                customerName:
                  (params['customer'] as any)?.name ||
                  (params['customerName'] as string) ||
                  'Rajesh Kumar',
                customerId:
                  (params['customer'] as any)?.id ||
                  (params['customerId'] as string) ||
                  'CUS-00291',
                customerPhone:
                  (params['customer'] as any)?.phone ||
                  (params['customerPhone'] as string) ||
                  '+91 98765 43210',
              })
            }
          />
        ) : screen === 'SubWarehouseSupportHistory' ? (
          <SubWarehouseSupportHistoryScreen
            customerName={(params['customerName'] as string) || 'Rajesh Kumar'}
            onBack={goBack}
          />
        ) : screen === 'WarehouseOverview' ? (
          <WarehouseOverviewScreen
            onBack={goBack}
            onSelectWarehouse={(wh) => navigate('StockLedger', { warehouseName: wh })}
            onViewLowStock={() => navigate('LowStockAlerts')}
            onOpenSettings={() => navigate('WarehouseSettings')}
          />
        ) : screen === 'StockLedger' ? (
          <StockLedgerScreen
            warehouseName={String(params['warehouseName'] ?? 'Ooty Warehouse')}
            onBack={goBack}
            onVerifyBatch={(b) => {
              setSelectedStockBatch(b ?? null);
              navigate('VerifyStock');
            }}
          />
        ) : screen === 'VerifyStock' ? (
          <VerifyStockScreen
            produceName={selectedStockBatch?.name ?? 'Carrots'}
            batchId={selectedStockBatch?.batchId ?? 'BT-4471'}
            zone={selectedStockBatch?.zone ?? 'Zone A-2'}
            systemCount={selectedStockBatch?.quantityKg ?? 240}
            onBack={goBack}
            onSubmitApproval={(data) => {
              setSelectedStockAdjustment(data);
              navigate('StockAdjustmentApproval');
            }}
          />
        ) : screen === 'StockAdjustmentApproval' ? (
          <StockAdjustmentApprovalScreen
            produceName={selectedStockAdjustment?.produceName ?? 'Carrots'}
            batchId={selectedStockAdjustment?.batchId ?? 'BT-4471'}
            zone={selectedStockAdjustment?.zone ?? 'Zone A-2'}
            systemCount={selectedStockAdjustment?.systemCount ?? 240}
            physicalCount={selectedStockAdjustment?.physicalCount ?? 225}
            varianceKg={selectedStockAdjustment?.varianceKg ?? -15}
            variancePct={selectedStockAdjustment?.variancePct ?? -6.25}
            reason={selectedStockAdjustment?.reason ?? 'Spoilage during storage.'}
            onBack={goBack}
            onReturnToLedger={() => navigate('StockLedger')}
          />
        ) : screen === 'LowStockAlerts' ? (
          <LowStockAlertsScreen
            onBack={goBack}
            onInitiateTransfer={() => navigate('InterWarehouseTransfer')}
            onAdjustThresholds={() => navigate('WarehouseSettings')}
          />
        ) : screen === 'InterWarehouseTransfer' ? (
          <InterWarehouseTransferScreen
            onBack={goBack}
            onNewTransfer={() => navigate('InitiateNewTransfer')}
          />
        ) : screen === 'InitiateNewTransfer' ? (
          <InitiateNewTransferScreen
            onBack={goBack}
            onSubmitTransfer={() => navigate('InterWarehouseTransfer')}
          />
        ) : screen === 'WarehouseSettings' ? (
          <WarehouseSettingsScreen
            warehouseName="Kotagiri Warehouse"
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
                navigate('Welcome');
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
          <CustomerMainApp onSignOut={() => navigate('Welcome')} />
        ) : screen === 'Unsupported' ? (
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
              onPress={() => {
                void (async () => {
                  await logout();
                  navigate('Welcome');
                })();
              }}
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
            onSave={(updated) => {
              if (updated) updateCertificationLocally(updated);
              navigate('Certifications');
            }}
            onDelete={(id) => {
              if (id) deleteCertificationLocally(id);
              navigate('Certifications');
            }}
          />
        ) : screen === 'CreateListing' ? (
          <CreateListingScreen
            onSuccess={() => {
              setCurrentTab('Listings');
              navigate('MainTabs');
            }}
            onCancel={() => {
              setCurrentTab('Listings');
              navigate('MainTabs');
            }}
            onNext={() => navigate('CreateListingStep2')}
          />
        ) : screen === 'CreateListingStep2' ? (
          <CreateListingStep2Screen
            onCancel={goBack}
            onBack={goBack}
            onSuccess={() => {
              navigate('MyListings');
            }}
          />
        ) : screen === 'CounterOffer' ? (
          <CounterOfferScreen
            listing={selectedListing}
            listingId={selectedListing?.id}
            cropName={selectedListing?.cropName}
            offer={selectedListing?.activeCounterOffer}
            onAccept={() => {
              setCurrentTab('Listings');
              navigate('MainTabs');
            }}
            onReject={() => {
              setCurrentTab('Listings');
              navigate('MainTabs');
            }}
            onCancel={goBack}
          />
        ) : screen === 'ListingDetail' ? (
          <ListingDetailScreen onBack={goBack} />
        ) : screen === 'FMBSketch' ? (
          <FMBSketchScreen
            onNavigateBack={goBack}
            onNavigateToFieldContext={() => navigate('FieldContext')}
          />
        ) : screen === 'FieldContext' ? (
          <FieldContextScreen
            onNavigateBack={goBack}
            onNavigateToZones={() => navigate('Zones')}
          />
        ) : screen === 'Zones' ? (
          <ZonesScreen
            onNavigateBack={goBack}
            onNavigateToAddZone={() => navigate('AddZone')}
            onSave={goBack}
          />
        ) : screen === 'AddZone' ? (
          <AddZoneScreen
            onNavigateBack={goBack}
            onSave={goBack}
          />
        ) : screen === 'PersonalDetails' ? (
          <PersonalDetailsScreen onBack={goBack} />
        ) : screen === 'Notifications' ? (
          <NotificationsScreen
            onBack={goBack}
            onNavigateToCounterOffer={(listingId) => {
              setSelectedListing({
                id: listingId || 'dummy-listing',
                listingNumber: 'L-9821',
                cropName: 'Carrot - Ooty - Grade 1',
                quantityKg: '150',
                askingPricePerKg: '40',
                ceilingPricePerKg: '45',
                status: 'COUNTER_OFFER',
                grade: 'Grade 1',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                activeCounterOffer: {
                  id: 'dummy-offer',
                  pricePerKg: '34',
                  quantityKg: '150',
                  message: 'On inspection the batch grades as Grade 2 (minor forking & size variance), not the claimed Grade 1. Counter reflects the Grade 2 ceiling.',
                  round: 1,
                  expiresAt: new Date(Date.now() + (22 * 60 * 60 + 30 * 60) * 1000).toISOString(),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              } as any);
              navigate('CounterOffer');
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
            onNavigateToPestManagement={() => navigate('LogPestTreatment')}
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
            onNavigateToLearningHub={() => navigate('LearningHub')}
            onNavigateToSoilManagement={() => navigate('SoilManagement')}
          />
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
            onNavigateToDiary={() => navigate('CropDiaryEntries')}
            onNavigateToInputs={() => navigate('CropInputsApplied')}
            onNavigateToWorkforce={() => navigate('CropWorkforceHours')}
            onNavigateToNPK={() => navigate('CropNPKContribution')}
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
            onSaveCrop={(newCrop) => {
              addProduceCropLocally(newCrop);
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
            gender={typeof params['gender'] === 'string' ? params['gender'] : 'F'}
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
            onNavigateToAddWorker={() => navigate('AddWorker')}
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
            onNext={(cat) => {
              setParams((prev) => ({ ...prev, diaryCategory: cat }));
              if (cat.toLowerCase() === 'nutrients') {
                navigate('AddInputApplied', { initialInputType: 'Fertigation', fromDiary: '1' });
              } else if (cat.toLowerCase() === 'crop care') {
                navigate('AddInputApplied', { initialInputType: 'Pest Treatment', fromDiary: '1' });
              } else {
                navigate('NewFarmDiaryEntryStep2', { diaryCategory: cat });
              }
            }}
          />
        ) : screen === 'NewFarmDiaryEntryStep2' ? (
          <NewFarmDiaryEntryStep2Screen
            crop={selectedCrop}
            category={typeof params['diaryCategory'] === 'string' ? params['diaryCategory'] : 'Crop Care'}
            onChangeCategory={goBack}
            onBack={goBack}
            onNext={() => navigate('NewFarmDiaryEntryStep3')}
          />
        ) : screen === 'NewFarmDiaryEntryStep3' ? (
          <NewFarmDiaryEntryStep3Screen
            crop={selectedCrop}
            onBack={goBack}
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
            onNavigateToSoilTestRecords={() => navigate('SoilTestRecords')}
            onNavigateToSoilHealthTracker={() => navigate('SoilHealthTracker')}
            onNavigateToSoilTypeClassification={() => navigate('SoilTypeClassification')}
            onNavigateToAmendments={() => navigate('SoilAmendmentsLog')}
            onNavigateToCropRotation={() => navigate('CropRotation')}
            onNavigateToMoistureTracking={() => navigate('SoilMoistureTracking')}
            onNavigateToErosionConservation={() => navigate('ErosionConservation')}
            onNavigateToExportReports={() => navigate('ExportSoilReports')}
            onNavigateToSoilTest={() => navigate('SoilTest')}
            onNavigateToNewSoilTest={() => navigate('UploadNewSoilTest')}
          />
        ) : screen === 'SoilTestRecords' ? (
          <SoilTestRecordsScreen
            onBack={goBack}
            onNavigateToRecordDetail={() => navigate('SoilTest')}
            onUploadNewTest={() => navigate('UploadNewSoilTest')}
          />
        ) : screen === 'SoilHealthTracker' ? (
          <SoilHealthTrackerScreen
            onBack={goBack}
          />
        ) : screen === 'SoilTypeClassification' ? (
          <SoilTypeClassificationScreen
            onBack={goBack}
          />
        ) : screen === 'SoilAmendmentsLog' ? (
          <SoilAmendmentsLogScreen
            onBack={goBack}
            onLogAmendment={() => navigate('UploadNewSoilTest')}
          />
        ) : screen === 'CropRotation' ? (
          <CropRotationScreen
            onBack={goBack}
          />
        ) : screen === 'SoilMoistureTracking' ? (
          <SoilMoistureTrackingScreen
            onBack={goBack}
          />
        ) : screen === 'ErosionConservation' ? (
          <ErosionConservationScreen
            onBack={goBack}
          />
        ) : screen === 'ExportSoilReports' ? (
          <ExportSoilReportsScreen
            onBack={goBack}
          />
        ) : screen === 'UploadNewSoilTest' || screen === 'NewSoilTest' ? (
          <UploadNewSoilTestScreen
            onBack={goBack}
            onSave={goBack}
          />
        ) : screen === 'SoilTest' ? (
          <SoilTestScreen
            onNavigateBack={goBack}
            onNavigateToNewSoilTest={() => navigate('UploadNewSoilTest')}
          />
        ) : screen === 'Weather' ? (
          <WeatherScreen
            onNavigateBack={goBack}
          />
        ) : screen === 'ActiveCrops' ? (
          <ActiveCropsScreen
            onNavigateBack={goBack}
          />
        ) : screen === 'MyListings' ? (
          <MyListingsScreen
            onNavigateBack={goBack}
            onNavigateToListingDetail={() => navigate('ListingDetail')}
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
                serviceEntriesCount: 3,
                recordedCost: 450,
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
                serviceEntriesCount: 3,
                recordedCost: 450,
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
                serviceEntriesCount: 3,
                recordedCost: 450,
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
                serviceEntriesCount: 3,
                recordedCost: 450,
              });
              navigate('RemoveItem');
            }}
          />
        ) : screen === 'RemoveItem' ? (
          <RemoveItemScreen
            item={selectedItemForRemove ?? undefined}
            onNavigateBack={goBack}
            onConfirmRemove={() => {
              if (selectedItemForRemove?.category === 'Tools') {
                navigate('ToolsList');
              } else if (selectedItemForRemove?.category === 'Equipment') {
                navigate('EquipmentList');
              } else if (selectedItemForRemove?.category === 'Trees') {
                navigate('TreesList');
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
        ) : screen === 'ChangeMobile' ? (
          <ChangeMobileScreen
            onBack={goBack}
            onNavigateToPassword={() => navigate('ChangePassword')}
          />
        ) : screen === 'ChangePassword' ? (
          <ChangePasswordScreen onBack={goBack} />
        ) : screen === 'Settings' ? (
          <SettingsScreen
            onBack={goBack}
            onNavigateToProfile={() => navigate('PersonalDetails')}
            onNavigateToChangePassword={() => navigate('ChangePassword')}
            onNavigateToChangeMobile={() => navigate('ChangeMobile')}
            onNavigateToAboutSupport={() => navigate('AboutSupport')}
            onSignOut={() => navigate('Welcome')}
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
                    if (item && item.id) {
                      setSelectedListing(item);
                    } else {
                      setSelectedListing({
                        id: 'dummy-listing',
                        listingNumber: 'L-9821',
                        cropName: 'Carrot - Ooty - Grade 1',
                        quantityKg: '150',
                        askingPricePerKg: '40',
                        ceilingPricePerKg: '45',
                        status: 'COUNTER_OFFERED',
                        grade: 'GRADE_1',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        activeCounterOffer: {
                          id: 'dummy-offer',
                          listingId: 'dummy-listing',
                          round: 1,
                          offeredBy: 'ADMIN',
                          pricePerKg: '34',
                          quantityKg: '150',
                          message: 'On inspection the batch grades as Grade 2 (minor forking & size variance), not the claimed Grade 1. Counter reflects the Grade 2 ceiling.',
                          status: 'PENDING',
                          expiresAt: new Date(Date.now() + (22 * 60 * 60 + 30 * 60) * 1000).toISOString(),
                        },
                      } as any);
                    }
                    navigate('CounterOffer');
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
                  onNavigateToCropDetail={(cropName: string) => {
                    const found = localProduceCropsCache.find(
                      (c: CropItem) => c.name.toLowerCase() === cropName.toLowerCase(),
                    ) ?? localProduceCropsCache[0];
                    setSelectedCrop(found ?? null);
                    navigate('CropDetail');
                  }}
                />
              ) : currentTab === 'Listings' ? (
                <ListingsScreen
                  onNavigateToCreateListing={() => navigate('CreateListing')}
                  onNavigateToCounterOffer={(item) => {
                    if (item && item.id) {
                      setSelectedListing(item);
                    } else {
                      setSelectedListing({
                        id: 'dummy-listing',
                        listingNumber: 'L-9821',
                        cropName: 'Carrot - Ooty - Grade 1',
                        quantityKg: '150',
                        askingPricePerKg: '40',
                        ceilingPricePerKg: '45',
                        status: 'COUNTER_OFFER',
                        grade: 'Grade 1',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        activeCounterOffer: {
                          id: 'dummy-offer',
                          pricePerKg: '34',
                          quantityKg: '150',
                          message: 'On inspection the batch grades as Grade 2 (minor forking & size variance), not the claimed Grade 1. Counter reflects the Grade 2 ceiling.',
                          round: 1,
                          expiresAt: new Date(Date.now() + (22 * 60 * 60 + 30 * 60) * 1000).toISOString(),
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        },
                      } as any);
                    }
                    navigate('CounterOffer');
                  }}
                />
              ) : currentTab === 'Wallet' ? (
                <WalletScreen />
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
                />
              )}
            </View>

            {/* Bottom Tab Bar */}
            <View style={[styles.bottomTabBar, { borderTopWidth: 0, shadowColor: colors.onSurface, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 10, height: 70 }]}>
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
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    shadowColor: authPalette.deepGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 3.5,
    borderColor: colors.white,
  },
  unsupportedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  unsupportedText: { fontSize: typography.body, color: colors.onSurface, textAlign: 'center' },
});

