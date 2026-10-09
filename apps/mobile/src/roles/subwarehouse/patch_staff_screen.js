const fs = require('fs');

const file = 'c:/Users/JENI/Desktop/Tohfa/Tohfa-Platform/apps/mobile/src/roles/subwarehouse/screens/SubWarehouseStaffScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add HistoryIcon
if (!content.includes('function HistoryIcon')) {
  const historyIconCode = `
function HistoryIcon({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 8v4l3 3M3.05 11a9 9 0 1 1 .5 4m-.5-4v-4h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
`;
  content = content.replace(
    'function CalendarIcon(',
    historyIconCode + '\nfunction CalendarIcon('
  );
}

// Add the buttons just before the Red Disclaimer
const actionButtonsStr = `
        {/* ─── Bottom Action Tabs ─── */}
        <View style={styles.actionTabsRow}>
          <TouchableOpacity
            style={styles.actionTabCard}
            onPress={onNavigateToTodayAttendance}
            activeOpacity={0.8}
          >
            <CalendarIcon size={22} color={PALETTE.primaryDark} />
            <Text style={styles.actionTabText}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionTabCard}
            onPress={onNavigateToAttendance}
            activeOpacity={0.8}
          >
            <HistoryIcon size={22} color={PALETTE.primaryDark} />
            <Text style={styles.actionTabText}>Attendance History</Text>
          </TouchableOpacity>
        </View>
`;
if (!content.includes('actionTabsRow')) {
  content = content.replace(
    '{/* ─── Red HR Disclaimer Card ─── */}',
    actionButtonsStr + '\n        {/* ─── Red HR Disclaimer Card ─── */}'
  );
}

// Add styles
const newStyles = `
  actionTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  actionTabCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEDCD3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  actionTabText: {
    fontFamily: 'Poppins',
    fontSize: 13,
    fontWeight: '700',
    color: PALETTE.primaryDark,
    marginTop: 8,
  },
`;

if (!content.includes('actionTabsRow: {')) {
  content = content.replace(
    'redDisclaimerCard: {',
    newStyles + '\n  redDisclaimerCard: {'
  );
}

fs.writeFileSync(file, content, 'utf8');
