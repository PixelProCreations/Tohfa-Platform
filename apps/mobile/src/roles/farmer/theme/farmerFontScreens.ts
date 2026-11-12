/**
 * Which of App.tsx's `screen` values are rendered by FARMER-owned code.
 *
 * Why this exists: farmer/App.tsx is the root of the one app binary and also switches to the
 * customer app (CustomerMainApp) and to the admin / warehouse screens under roles/admin. Poppins
 * is applied to the farmer role only, so FarmerFontProvider is enabled by this list and nothing
 * else. It is an ALLOW-list on purpose: a screen forgotten here renders in the system font
 * (visible, harmless), whereas a deny-list would silently restyle a customer/admin screen.
 *
 * Built from the branches of App.tsx whose first rendered component is imported from ./screens
 * (the farmer folder), plus MainTabs (the farmer tab shell). Admin ('../admin/...'), customer
 * ('../customer/...'), 'AdminMain' and 'Unsupported' are deliberately absent.
 */
const FARMER_FONT_SCREENS: ReadonlySet<string> = new Set([
  'MainTabs', 'Splash', 'Welcome', 'Login', 'RoleSelection', 'Register', 'Otp', 'ForgotPassword',
  'ResetPassword', 'PasswordChangedSuccess', 'ApplicationStatus', 'Certifications',
  'AddCertification', 'EditCertification', 'CreateListing', 'CreateListingStep2', 'CounterOffer',
  'ListingDetail', 'FMBSketch', 'FieldContext', 'Zones', 'PersonalDetails', 'Notifications',
  'AuditResult', 'Audits', 'CropManagement', 'InputManagement', 'LogFertigation',
  'LogPestTreatment', 'PestManagement', 'PestLibrary', 'TreatmentSchedule', 'WeatherRiskAnalytics',
  'FarmManagement', 'DairyProduce', 'ProduceCalendar', 'CropDetail', 'CropMilestones',
  'CropDiaryEntries', 'CropInputsApplied', 'AddInputApplied', 'EditInputApplied', 'CropWorkforceHours',
  'CropNPKContribution', 'NewCrop', 'Livestock', 'AnimalDetail', 'EditAnimal', 'SaleTransferCull',
  'RegisterAnimal', 'Workforce', 'Payroll', 'WorkerDetail', 'AddWorker', 'FarmDiary',
  'DiaryCalendar', 'NewFarmDiaryEntry', 'NewFarmDiaryEntryStep2', 'NewFarmDiaryEntryStep3',
  'FarmRatings', 'SoilManagement', 'SoilTestRecords', 'SoilHealthTracker',
  'SoilTypeClassification', 'SoilAmendmentsLog', 'CreateSoilAmendment', 'LogSoilAmendment',
  'CropRotation', 'SoilMoistureTracking', 'ErosionConservation', 'CreateErosionNote',
  'LogErosionNote', 'ExportSoilReports', 'UploadNewSoilTest', 'NewSoilTest', 'SoilTest',
  'BankPayment', 'BankAccount', 'UpiId', 'PayoutHistory', 'PayoutDetail', 'WithdrawFunds',
  'WalletTransactionDetail', 'AddMoney', 'CashTopUp', 'Wallet', 'Weather', 'ActiveCrops',
  'MyListings', 'TohfaCalendar', 'CropPlanningInsight', 'FarmInventory', 'ToolsList', 'AddTool',
  'EditTool', 'EquipmentList', 'AddEquipment', 'EditEquipment', 'TreesList', 'AddPlanting',
  'EditPlanting', 'MachineryList', 'AddMachinery', 'EditMachinery', 'RemoveItem',
  'DailyAttendance', 'LearningHub', 'ContentDetail', 'Groups', 'GroupDetail', 'AboutSupport',
  'ChangePassword', 'Settings',
]);

export function isFarmerFontScreen(screen: string): boolean {
  return FARMER_FONT_SCREENS.has(screen);
}
