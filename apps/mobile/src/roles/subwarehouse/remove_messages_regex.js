const fs = require('fs');
const path = require('path');

const dirPath = 'c:/Users/JENI/Desktop/Tohfa/Tohfa-Platform/apps/mobile/src/roles/subwarehouse/screens';
const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.tsx'));

let modifiedCount = 0;

for (const file of files) {
  const filePath = path.join(dirPath, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Remove screen footer code
  content = content.replace(/\s*(?:\{\/\*.*?\*\/\}\s*)?<Text style=\{styles\.screenFooterCode\}>.*?<\/Text>/g, '');

  // Remove warning/info boxes (assumes no nested <View> inside the box)
  content = content.replace(/\s*(?:\{\/\*.*?\*\/\}\s*)?<View style=\{styles\.(blueCallout|infoBox|blueInfoBox|blueAlertBox|blueInfoCard|noticeCard|restrictionCard|lockNoticeCard|redWarningBox|orangeInfoBox|infoCard)\}>[\s\S]*?<\/View>/g, '');

  // Some info boxes might use an array of styles, e.g. style={[styles.infoBox, ...]}
  content = content.replace(/\s*(?:\{\/\*.*?\*\/\}\s*)?<View style=\{\[styles\.(blueCallout|infoBox|blueInfoBox|blueAlertBox|blueInfoCard|noticeCard|restrictionCard|lockNoticeCard|redWarningBox|orangeInfoBox|infoCard).*?\]\}>[\s\S]*?<\/View>/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
    console.log(`Modified ${file}`);
  }
}

console.log(`\nModified ${modifiedCount} files.`);
