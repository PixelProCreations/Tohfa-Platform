const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/JENI/Desktop/Tohfa/Tohfa-Platform/apps/mobile/src/roles/subwarehouse/screens';
const files = [
  'SubWarehouseCustomerDetailsScreen.tsx',
  'SubWarehouseExpenseDetailScreen.tsx',
  'SubWarehouseFinanceReportsScreen.tsx',
  'SubWarehouseFiscalTagScreen.tsx',
  'SubWarehouseInvoiceDetailScreen.tsx',
  'SubWarehouseInvoicePreviewScreen.tsx',
  'SubWarehouseReportsScreen.tsx',
  'SubWarehouseSettingsScreen.tsx',
  'SubWarehouseVoucherDetailScreen.tsx'
];

files.forEach(f => {
  const filePath = path.join(dir, f);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix 1: Orphaned Text and closing View
  content = content.replace(/<Text style=\{styles\.(infoText|lockNoticeText|redDisclaimerText|bottomNoticeText|infoBoxText)\}>[\s\S]*?<\/Text>\s*<\/View>/g, '');
  
  // Replace standalone warning texts without the closing view
  content = content.replace(/<Text style=\{styles\.(infoText|lockNoticeText|redDisclaimerText|bottomNoticeText|infoBoxText)\}>[\s\S]*?<\/Text>/g, '');
  
  fs.writeFileSync(filePath, content, 'utf8');
});
