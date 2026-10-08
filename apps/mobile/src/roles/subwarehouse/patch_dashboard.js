const fs = require('fs');

const file = 'c:/Users/JENI/Desktop/Tohfa/Tohfa-Platform/apps/mobile/src/roles/subwarehouse/screens/SubWarehouseAdminDashboardScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import
if (!content.includes('import { SubWarehouseNotificationDetailScreen }')) {
  content = content.replace(
    "import { SubWarehouseNotificationsScreen } from './SubWarehouseNotificationsScreen';",
    "import { SubWarehouseNotificationsScreen } from './SubWarehouseNotificationsScreen';\nimport { SubWarehouseNotificationDetailScreen } from './SubWarehouseNotificationDetailScreen';"
  );
}

// Add state
if (!content.includes('const [selectedNotification, setSelectedNotification]')) {
  content = content.replace(
    "const [showNotifications, setShowNotifications] = useState(false);",
    "const [showNotifications, setShowNotifications] = useState(false);\n  const [selectedNotification, setSelectedNotification] = useState<any>(null);"
  );
}

// Render SubWarehouseNotificationDetailScreen
if (!content.includes('<SubWarehouseNotificationDetailScreen')) {
  const detailScreenRender = `
  if (selectedNotification) {
    return (
      <SubWarehouseNotificationDetailScreen
        onBack={() => setSelectedNotification(null)}
        notificationData={selectedNotification}
        onActionPress={() => {
          setSelectedNotification(null);
          setShowNotifications(false);
          if (selectedNotification.type === 'wallet') {
            setShowWalletOperations(true);
          } else {
            navigateTo('Receiving', 'overview');
          }
        }}
      />
    );
  }
`;
  content = content.replace(
    "if (showNotifications) {",
    `${detailScreenRender}\n  if (showNotifications) {`
  );
}

// Update SubWarehouseNotificationsScreen props to handle onSelectNotification
content = content.replace(
  "onNavigateToAction={(actionLabel)",
  "onSelectNotification={(item) => setSelectedNotification(item)}\n        onNavigateToAction={(actionLabel)"
);

fs.writeFileSync(file, content, 'utf8');
