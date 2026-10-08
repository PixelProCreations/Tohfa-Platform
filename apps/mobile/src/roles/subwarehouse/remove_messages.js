const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');
const path = require('path');

const project = new Project();
const dirPath = 'c:/Users/JENI/Desktop/Tohfa/Tohfa-Platform/apps/mobile/src/roles/subwarehouse/screens';
const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.tsx'));

const styleNamesToRemove = [
  'infoBox',
  'blueInfoBox',
  'blueAlertBox',
  'blueInfoCard',
  'noticeCard',
  'restrictionCard',
  'lockNoticeCard',
  'redWarningBox',
  'orangeInfoBox',
  'infoCard',
  'blueCallout'
];

for (const file of files) {
  const filePath = path.join(dirPath, file);
  const sourceFile = project.addSourceFileAtPath(filePath);
  
  let changed = false;
  
  // Find all JSX elements
  const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement);
  const jsxSelfClosingElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
  
  const allElements = [...jsxElements, ...jsxSelfClosingElements];
  
  for (const element of allElements) {
    if (element.wasForgotten()) continue;
    
    // Check if it's <Text style={styles.screenFooterCode}>
    let isFooterCode = false;
    let tagName = '';
    
    if (element.getKind() === SyntaxKind.JsxElement) {
      tagName = element.getOpeningElement().getTagNameNode().getText();
    } else {
      tagName = element.getTagNameNode().getText();
    }
    
    if (tagName === 'Text') {
      const attributes = element.getKind() === SyntaxKind.JsxElement 
        ? element.getOpeningElement().getAttributes() 
        : element.getAttributes();
        
      for (const attr of attributes) {
        if (attr.getKind() === SyntaxKind.JsxAttribute && attr.getName() === 'style') {
          const initializer = attr.getInitializer();
          if (initializer && initializer.getText().includes('styles.screenFooterCode')) {
            isFooterCode = true;
          }
        }
      }
      
      if (isFooterCode) {
        element.remove();
        changed = true;
        continue;
      }
    }
    
    // Check if it's a <View> with one of the warning box styles
    if (tagName === 'View') {
      const attributes = element.getKind() === SyntaxKind.JsxElement 
        ? element.getOpeningElement().getAttributes() 
        : element.getAttributes();
        
      let isWarningBox = false;
      for (const attr of attributes) {
        if (attr.getKind() === SyntaxKind.JsxAttribute && attr.getName() === 'style') {
          const initializer = attr.getInitializer();
          if (initializer) {
            const text = initializer.getText();
            for (const styleName of styleNamesToRemove) {
              if (text.includes(`styles.${styleName}`)) {
                isWarningBox = true;
                break;
              }
            }
          }
        }
      }
      
      if (isWarningBox) {
        element.remove();
        changed = true;
      }
    }
  }
  
  if (changed) {
    sourceFile.saveSync();
    console.log('Modified', file);
  }
}
