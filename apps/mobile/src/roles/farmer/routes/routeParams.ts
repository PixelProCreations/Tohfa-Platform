/**
 * Route keys and route params for the app root (App.tsx).
 *
 * App.tsx is a hand-rolled router: the current screen is a `ScreenName` and its
 * params are one untyped bag (`NavParams`) kept in state and on the history
 * stack. Most screens read that bag defensively (`typeof p === 'string'`), so
 * they stay `NavParams`. The screens that are handed a whole typed object
 * (a payout, a wallet transaction, an animal or worker form) are listed in
 * `RouteParamMap`: `navigate()` only accepts that shape for them, and
 * `readRouteParams()` reads it back. That pairing is what replaced the old
 * `params as any` casts.
 *
 * This file only imports farmer types: the cross-role import guard
 * (src/tests/cross_role_import_guard.test.ts) allows exactly one bridge file,
 * App.tsx, so admin-shaped params are typed there, not here.
 */
import type { PayoutRecord } from '../screens/payment/PayoutHistoryScreen';
import type { WalletTransactionItem } from '../screens/payment/WalletTransactionDetailScreen';
import type { AnimalFormData } from '../screens/farm/livestock/RegisterAnimalScreen';
import type { WorkerFormData } from '../screens/farm/workforce/AddWorkerScreen';

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
  | 'CreatePassword'
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
  | 'SubWarehouseDailyCashSummary'
  | 'SubWarehouseCustomerWallet'
  | 'SubWarehouseFiscalTag'
  | 'SubWarehouseTransactionDetail'
  | 'SubWarehouseTopUpSuccess'
  | 'SubWarehouseNeedsAttention'
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
  | 'CertificateDocument'
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
  | 'EditInputApplied'
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

/** The farmer bottom tabs (MainTabs). */
export type TabName = 'Home' | 'Listings' | 'Wallet' | 'Profile';

/** Params of a route that reads its values defensively, one key at a time. */
export type NavParams = Record<string, unknown>;

/**
 * Routes whose params are one typed object, handed over whole by the screen
 * that opens them and passed whole to the screen they open.
 */
export interface RouteParamMap {
  PayoutDetail: PayoutRecord;
  WalletTransactionDetail: WalletTransactionItem;
  EditAnimal: Partial<AnimalFormData>;
  RegisterAnimal: Partial<AnimalFormData>;
  /** Workforce opens it with only the farm; Worker Detail with the worker to edit. */
  AddWorker: Partial<WorkerFormData> & { farmId?: string | undefined };
}

/** The params `navigate(screen, ...)` accepts for `screen`. */
export type ParamsFor<S extends ScreenName> = S extends keyof RouteParamMap ? RouteParamMap[S] : NavParams;

/** Every params value navigate() can store. */
export type AnyRouteParams = NavParams | RouteParamMap[keyof RouteParamMap];

export type Navigate = <S extends ScreenName>(screen: S, params?: ParamsFor<S>) => void;

/** Back one step; with no history, to `fallbackScreen` (or the screen's own root). */
export type GoBack = (fallbackScreen?: ScreenName) => void;

/** One step of the navigation history. */
export interface StackEntry {
  screen: ScreenName;
  params?: NavParams;
  tab?: TabName;
}

/**
 * The params bag navigate() stores. A typed route object is kept as-is (same
 * reference, as before); this only widens its static type to the bag's.
 */
export function toNavParams(params: AnyRouteParams): NavParams {
  return params as NavParams;
}

/**
 * Reads the params of a `RouteParamMap` route back as its declared shape.
 * Sound because navigate() accepts only `RouteParamMap[S]` for those routes,
 * and the history stack restores a screen with the params it was opened with.
 */
export function readRouteParams<S extends keyof RouteParamMap>(_screen: S, params: NavParams): RouteParamMap[S] {
  return params as RouteParamMap[S];
}

/** A route param as a string, or undefined. */
export function stringParam(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
