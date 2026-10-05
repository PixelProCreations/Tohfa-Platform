import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const PALETTE = {
  primary: '#F0562A',
  headerOrange: '#F0562A',
  pageBg: '#F4F0EB',
  cardBg: '#FFFFFF',
  textInk: '#1E1612',
  textSecondary: '#6B7280',
  border: '#EBE5DC',
  brownText: '#8A5A30',
  btnOrange: '#E88B38',
  presentText: '#15803D',
  absentText: '#DC2626',
  leaveText: '#D97706',
};

function ArrowBackIcon({ size = 20, color = '#FFFFFF' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 12H4M10 18l-6-6 6-6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = '#999' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function ChevronLeftIcon({ size = 16, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 16, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DriverIcon({ size = 24, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 5h12v14H3V5zm12 3h4l3 3v8h-7V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="7" cy="19" r="2" stroke={color} strokeWidth="2" />
      <Circle cx="17" cy="19" r="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function StaffIcon({ size = 24, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
      <Path d="M20 21c0-4-3-7-8-7s-8 3-8 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function BlockIcon({ size = 16, color = '#666' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path d="M4.93 4.93l14.14 14.14" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function CalendarIcon({ size = 20, color = '#8A5A30' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M9 16h2v2H9v-2zm4 0h2v2h-2v-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CloseIcon({ size = 20, color = '#1E1612' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export type AttendanceView = 'main' | 'detail' | 'today' | 'history';

export interface MainWarehouseAttendanceScreenProps {
  initialView?: AttendanceView;
  onBack: () => void;
}

export function MainWarehouseAttendanceScreen({ initialView = 'main', onBack }: MainWarehouseAttendanceScreenProps) {
  const [view, setView] = useState<AttendanceView>(initialView);
  const [historyTab, setHistoryTab] = useState<'By Date' | 'By Staff'>('By Date');
  const [historyDuration, setHistoryDuration] = useState<'7 Days' | '30 Days'>('7 Days');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [selectedDay, setSelectedDay] = useState(25);
  const [appliedDay, setAppliedDay] = useState(25);

  const handleBack = () => {
    if (view === 'main' || view === 'history' || view === 'today') {
      onBack();
    } else {
      setView('main');
    }
  };

  if (view === 'detail') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ArrowBackIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Attendance</Text>
          </View>
        </View>

        <View style={styles.mainContainer}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Date</Text>
                  <Text style={styles.value}>25 Sep 2026</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Employee</Text>
                  <Text style={styles.value}>Arun Kumar</Text>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>Status</Text>
                  <Text style={[styles.value, {color: PALETTE.presentText}]}>Present</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>Check-in</Text>
                  <Text style={styles.value}>09:02 AM</Text>
                </View>
              </View>
              <View style={[styles.row, {marginBottom: 0}]}>
                <View style={styles.col}>
                  <Text style={styles.label}>Check-out</Text>
                  <Text style={styles.value}>06:10 PM</Text>
                </View>
              </View>
            </View>

            <View style={styles.infoBox}>
              <View style={{marginRight: 8, marginTop: 2}}><BlockIcon /></View>
              <Text style={styles.infoText}>
                View-only — no Mark Attendance, Edit Attendance, Approve Leave, or manual check-in/out here.
              </Text>
            </View>

          </ScrollView>
        </View>
      </View>
    );
  }

  if (view === 'today') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ArrowBackIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Today's Attendance</Text>
          </View>
        </View>

        <View style={styles.mainContainer}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.dateBanner}>
              <Text style={styles.dateBannerText}>{appliedDay} Sep 2026</Text>
            </View>

            <View style={styles.sectionHeaderRow}>
              <View style={[styles.dot, {backgroundColor: PALETTE.presentText}]} />
              <Text style={[styles.sectionTitle, {color: PALETTE.presentText}]}>PRESENT</Text>
            </View>
            <TouchableOpacity style={styles.employeeCard} onPress={() => setView('detail')} activeOpacity={0.8}>
              <View style={styles.iconCircle}><DriverIcon /></View>
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>Arun Kumar</Text>
                <Text style={styles.employeeRole}>Driver</Text>
              </View>
              <Text style={[styles.employeeTime, {color: PALETTE.presentText}]}>09:02 AM</Text>
            </TouchableOpacity>
            
            {appliedDay === 25 && (
              <TouchableOpacity style={styles.employeeCard} onPress={() => setView('detail')} activeOpacity={0.8}>
                <View style={styles.iconCircle}><StaffIcon /></View>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>Karthik</Text>
                  <Text style={styles.employeeRole}>Warehouse Staff</Text>
                </View>
                <Text style={[styles.employeeTime, {color: PALETTE.presentText}]}>09:18 AM</Text>
              </TouchableOpacity>
            )}

            {appliedDay !== 25 && (
              <TouchableOpacity style={styles.employeeCard} activeOpacity={0.8}>
                <View style={styles.iconCircle}><DriverIcon /></View>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>Manoj</Text>
                  <Text style={styles.employeeRole}>Driver</Text>
                </View>
                <Text style={[styles.employeeTime, {color: PALETTE.presentText}]}>08:45 AM</Text>
              </TouchableOpacity>
            )}

            {appliedDay === 25 && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.dot, {backgroundColor: PALETTE.absentText}]} />
                  <Text style={[styles.sectionTitle, {color: PALETTE.absentText}]}>ABSENT</Text>
                </View>
                <TouchableOpacity style={styles.employeeCard} activeOpacity={0.8}>
                  <View style={[styles.iconCircle, {backgroundColor: '#FEE2E2'}]}><DriverIcon color="#DC2626" /></View>
                  <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName}>Manoj</Text>
                    <Text style={styles.employeeRole}>Driver</Text>
                  </View>
                  <Text style={[styles.employeeStatus, {color: PALETTE.absentText}]}>Absent</Text>
                </TouchableOpacity>

                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.dot, {backgroundColor: PALETTE.leaveText}]} />
                  <Text style={[styles.sectionTitle, {color: PALETTE.leaveText}]}>ON LEAVE</Text>
                </View>
                <TouchableOpacity style={styles.employeeCard} activeOpacity={0.8}>
                  <View style={[styles.iconCircle, {backgroundColor: '#FEF3C7'}]}><StaffIcon color="#D97706" /></View>
                  <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName}>Suresh</Text>
                    <Text style={styles.employeeRole}>Warehouse Staff</Text>
                  </View>
                  <Text style={[styles.employeeStatus, {color: PALETTE.leaveText}]}>On Leave</Text>
                </TouchableOpacity>
              </>
            )}

            {appliedDay !== 25 && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <View style={[styles.dot, {backgroundColor: PALETTE.absentText}]} />
                  <Text style={[styles.sectionTitle, {color: PALETTE.absentText}]}>ABSENT</Text>
                </View>
                <TouchableOpacity style={styles.employeeCard} activeOpacity={0.8}>
                  <View style={[styles.iconCircle, {backgroundColor: '#FEE2E2'}]}><StaffIcon color="#DC2626" /></View>
                  <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName}>Karthik</Text>
                    <Text style={styles.employeeRole}>Warehouse Staff</Text>
                  </View>
                  <Text style={[styles.employeeStatus, {color: PALETTE.absentText}]}>Absent</Text>
                </TouchableOpacity>
              </>
            )}

          </ScrollView>
        </View>
      </View>
    );
  }

  if (view === 'history') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ArrowBackIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Attendance History</Text>
          </View>
        </View>

        <View style={styles.mainContainer}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.filterRow}>
              <TouchableOpacity 
                style={historyDuration === '7 Days' ? styles.filterBtnActive : styles.filterBtn}
                onPress={() => setHistoryDuration('7 Days')}
              >
                <Text style={historyDuration === '7 Days' ? styles.filterBtnTextActive : styles.filterBtnText}>7 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={historyDuration === '30 Days' ? styles.filterBtnActive : styles.filterBtn}
                onPress={() => setHistoryDuration('30 Days')}
              >
                <Text style={historyDuration === '30 Days' ? styles.filterBtnTextActive : styles.filterBtnText}>30 Days</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.label}>From</Text>
                  <Text style={styles.value}>{historyDuration === '7 Days' ? '19 Sep 2026' : '26 Aug 2026'}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.label}>To</Text>
                  <Text style={styles.value}>25 Sep 2026</Text>
                </View>
              </View>
            </View>

            <View style={styles.filterRow}>
              <TouchableOpacity 
                style={historyTab === 'By Date' ? styles.filterBtnSolid : styles.filterBtn}
                onPress={() => setHistoryTab('By Date')}
              >
                <Text style={historyTab === 'By Date' ? styles.filterBtnSolidText : styles.filterBtnText}>By Date</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={historyTab === 'By Staff' ? styles.filterBtnSolid : styles.filterBtn}
                onPress={() => setHistoryTab('By Staff')}
              >
                <Text style={historyTab === 'By Staff' ? styles.filterBtnSolidText : styles.filterBtnText}>By Staff</Text>
              </TouchableOpacity>
            </View>

            {historyTab === 'By Date' ? (
              <>
                <Text style={styles.dateSubTitle}>25 SEP 2026</Text>
                <TouchableOpacity style={styles.employeeCard} activeOpacity={0.8}>
                  <View style={styles.iconCircle}><DriverIcon /></View>
                  <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName}>Arun Kumar</Text>
                    <Text style={styles.employeeRole}>Driver</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={[styles.employeeStatusSm, {color: PALETTE.presentText}]}>Present</Text>
                    <Text style={styles.employeeTimeSm}>09:02 AM</Text>
                  </View>
                </TouchableOpacity>

                <Text style={styles.dateSubTitle}>24 SEP 2026</Text>
                <TouchableOpacity style={styles.employeeCard} activeOpacity={0.8}>
                  <View style={styles.iconCircle}><DriverIcon /></View>
                  <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName}>Arun Kumar</Text>
                    <Text style={styles.employeeRole}>Driver</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={[styles.employeeStatusSm, {color: PALETTE.presentText}]}>Present</Text>
                    <Text style={styles.employeeTimeSm}>08:58 AM</Text>
                  </View>
                </TouchableOpacity>

                {historyDuration === '30 Days' && (
                  <>
                    <Text style={styles.dateSubTitle}>28 AUG 2026</Text>
                    <TouchableOpacity style={styles.employeeCard} activeOpacity={0.8}>
                      <View style={styles.iconCircle}><DriverIcon /></View>
                      <View style={styles.employeeInfo}>
                        <Text style={styles.employeeName}>Arun Kumar</Text>
                        <Text style={styles.employeeRole}>Driver</Text>
                      </View>
                      <View style={{alignItems: 'flex-end'}}>
                        <Text style={[styles.employeeStatusSm, {color: PALETTE.presentText}]}>Present</Text>
                        <Text style={styles.employeeTimeSm}>09:12 AM</Text>
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : (
              <>
                <Text style={styles.dateSubTitle}>ARUN KUMAR · DRIVER</Text>
                <TouchableOpacity style={styles.employeeCard} activeOpacity={0.8}>
                  <View style={styles.iconCircle}><CalendarIcon /></View>
                  <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName}>September 2026</Text>
                    <Text style={styles.employeeTimeSm}>Present 22 · Absent 2 · Leave 1</Text>
                  </View>
                  <ChevronRightIcon />
                </TouchableOpacity>

                {historyDuration === '30 Days' && (
                  <TouchableOpacity style={styles.employeeCard} activeOpacity={0.8}>
                    <View style={styles.iconCircle}><CalendarIcon /></View>
                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeName}>August 2026</Text>
                      <Text style={styles.employeeTimeSm}>Present 25 · Absent 0 · Leave 1</Text>
                    </View>
                    <ChevronRightIcon />
                  </TouchableOpacity>
                )}

                <Text style={styles.dateSubTitle}>KARTHIK · WAREHOUSE STAFF</Text>
                <TouchableOpacity style={styles.employeeCard} activeOpacity={0.8}>
                  <View style={styles.iconCircle}><CalendarIcon /></View>
                  <View style={styles.employeeInfo}>
                    <Text style={styles.employeeName}>September 2026</Text>
                    <Text style={styles.employeeTimeSm}>Present 24 · Absent 1 · Leave 0</Text>
                  </View>
                  <ChevronRightIcon />
                </TouchableOpacity>

                {historyDuration === '30 Days' && (
                  <TouchableOpacity style={styles.employeeCard} activeOpacity={0.8}>
                    <View style={styles.iconCircle}><CalendarIcon /></View>
                    <View style={styles.employeeInfo}>
                      <Text style={styles.employeeName}>August 2026</Text>
                      <Text style={styles.employeeTimeSm}>Present 26 · Absent 0 · Leave 0</Text>
                    </View>
                    <ChevronRightIcon />
                  </TouchableOpacity>
                )}
              </>
            )}

          </ScrollView>
        </View>
      </View>
    );
  }

  // Main View (Image 1)
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={PALETTE.headerOrange} />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <ArrowBackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Attendance</Text>
        </View>
      </View>

      <View style={styles.mainContainer}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.dateSelector}>
            <TouchableOpacity hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ChevronLeftIcon />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
              <Text style={styles.dateSelectorText}>All Warehouses · {appliedDay} Sep 2026</Text>
            </TouchableOpacity>
            <TouchableOpacity hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <ChevronRightIcon />
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statBox} onPress={() => setView('today')} activeOpacity={0.8}>
              <Text style={styles.statLabel}>PRESENT</Text>
              <Text style={[styles.statValue, {color: PALETTE.presentText}]}>{appliedDay === 25 ? '2' : '2'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statBox} onPress={() => setView('today')} activeOpacity={0.8}>
              <Text style={styles.statLabel}>ABSENT</Text>
              <Text style={[styles.statValue, {color: PALETTE.absentText}]}>{appliedDay === 25 ? '1' : '1'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.statBox} onPress={() => setView('today')} activeOpacity={0.8}>
              <Text style={styles.statLabel}>LEAVE</Text>
              <Text style={[styles.statValue, {color: PALETTE.leaveText}]}>{appliedDay === 25 ? '1' : '0'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <SearchIcon />
            <TextInput style={styles.searchInput} placeholder="Search employee..." placeholderTextColor="#999" />
          </View>

          <TouchableOpacity style={styles.employeeCard} onPress={() => setView('detail')} activeOpacity={0.8}>
            <View style={styles.iconCircle}><DriverIcon /></View>
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>Arun Kumar</Text>
              <Text style={styles.employeeRole}>Driver</Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <Text style={[styles.employeeStatusSm, {color: PALETTE.presentText}]}>Present</Text>
              <Text style={styles.employeeTimeSm}>09:02 AM</Text>
            </View>
          </TouchableOpacity>

          {appliedDay === 25 ? (
            <>
              <TouchableOpacity style={styles.employeeCard} onPress={() => setView('detail')} activeOpacity={0.8}>
                <View style={styles.iconCircle}><StaffIcon /></View>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>Karthik</Text>
                  <Text style={styles.employeeRole}>Warehouse Staff</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={[styles.employeeStatusSm, {color: PALETTE.presentText}]}>Present</Text>
                  <Text style={styles.employeeTimeSm}>09:18 AM</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.employeeCard} onPress={() => setView('detail')} activeOpacity={0.8}>
                <View style={[styles.iconCircle, {backgroundColor: '#FEE2E2'}]}><DriverIcon color="#DC2626" /></View>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>Manoj</Text>
                  <Text style={styles.employeeRole}>Driver</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={[styles.employeeStatusSm, {color: PALETTE.absentText}]}>Absent</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.employeeCard} onPress={() => setView('detail')} activeOpacity={0.8}>
                <View style={styles.iconCircle}><DriverIcon /></View>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>Manoj</Text>
                  <Text style={styles.employeeRole}>Driver</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={[styles.employeeStatusSm, {color: PALETTE.presentText}]}>Present</Text>
                  <Text style={styles.employeeTimeSm}>08:45 AM</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.employeeCard} onPress={() => setView('detail')} activeOpacity={0.8}>
                <View style={[styles.iconCircle, {backgroundColor: '#FEE2E2'}]}><StaffIcon color="#DC2626" /></View>
                <View style={styles.employeeInfo}>
                  <Text style={styles.employeeName}>Karthik</Text>
                  <Text style={styles.employeeRole}>Warehouse Staff</Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={[styles.employeeStatusSm, {color: PALETTE.absentText}]}>Absent</Text>
                </View>
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      </View>

      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                <CloseIcon />
              </TouchableOpacity>
            </View>
            
            <View style={styles.calendarHeader}>
              <TouchableOpacity style={styles.calNavBtn}><ChevronLeftIcon size={20} /></TouchableOpacity>
              <Text style={styles.calendarMonth}>September 2026</Text>
              <TouchableOpacity style={styles.calNavBtn}><ChevronRightIcon size={20} /></TouchableOpacity>
            </View>

            <View style={styles.calendarGrid}>
              {['S','M','T','W','T','F','S'].map((day, idx) => (
                <View key={`day-${idx}`} style={styles.calDayBox}>
                  <Text style={styles.calendarDayHeader}>{day}</Text>
                </View>
              ))}
              {Array.from({length: 2}).map((_, i) => (
                <View key={`empty-${i}`} style={styles.calDayBox} />
              ))}
              {Array.from({length: 30}).map((_, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.calDayBox, selectedDay === i+1 && styles.calDayBoxActive]}
                  onPress={() => setSelectedDay(i+1)}
                >
                  <Text style={[styles.calDayText, selectedDay === i+1 && styles.calDayTextActive]}>{i+1}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.applyBtn} 
              onPress={() => {
                setAppliedDay(selectedDay);
                setShowDatePicker(false);
              }}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.pageBg },
  header: {
    backgroundColor: PALETTE.headerOrange,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 12 },
  headerTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  
  mainContainer: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  dateSelectorText: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: '#000' },
  
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
  },
  statLabel: { fontFamily: 'Poppins', fontSize: 10, fontWeight: '800', color: PALETTE.textSecondary, marginBottom: 4 },
  statValue: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 13,
    color: '#000',
    marginLeft: 8,
  },

  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FAEEE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  employeeInfo: { flex: 1 },
  employeeName: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#000' },
  employeeRole: { fontFamily: 'Poppins', fontSize: 11, color: '#666' },
  employeeTime: { fontFamily: 'Poppins', fontSize: 12, fontWeight: '800' },
  employeeStatus: { fontFamily: 'Poppins', fontSize: 12, fontWeight: '800' },
  
  employeeStatusSm: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', marginBottom: 2 },
  employeeTimeSm: { fontFamily: 'Poppins', fontSize: 10, color: '#666' },

  // Detail
  card: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    marginBottom: 16,
  },
  row: { flexDirection: 'row', marginBottom: 16 },
  col: { flex: 1 },
  label: { fontFamily: 'Poppins', fontSize: 11, color: '#666', marginBottom: 4, fontWeight: '600' },
  value: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '800', color: '#000' },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F4F0EB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6DFD5',
    padding: 16,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Poppins',
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
    lineHeight: 18,
  },

  // Today view
  dateBanner: {
    backgroundColor: PALETTE.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  dateBannerText: { fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', color: '#666' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  sectionTitle: { fontFamily: 'Poppins', fontSize: 12, fontWeight: '800' },

  // History view
  filterRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  filterBtn: {
    flex: 1,
    backgroundColor: '#FAEEE3',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterBtnText: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: PALETTE.brownText },
  filterBtnActive: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: PALETTE.brownText,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterBtnTextActive: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: PALETTE.brownText },
  filterBtnSolid: {
    flex: 1,
    backgroundColor: '#E88B38',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterBtnSolidText: { fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', color: '#FFF' },
  
  dateSubTitle: { fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', color: '#666', marginBottom: 8, marginTop: 8 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { fontFamily: 'Poppins', fontSize: 18, fontWeight: '800', color: '#000' },
  
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  calNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAEEE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonth: { fontFamily: 'Poppins', fontSize: 16, fontWeight: '800', color: '#000' },
  
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  calDayBox: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayBoxActive: {
    backgroundColor: '#E88B38',
    borderRadius: 8,
  },
  calendarDayHeader: { fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', color: '#999' },
  calDayText: { fontFamily: 'Poppins', fontSize: 14, fontWeight: '600', color: '#333' },
  calDayTextActive: { color: '#FFF', fontWeight: '800' },

  applyBtn: {
    backgroundColor: '#F0562A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyBtnText: { fontFamily: 'Poppins', fontSize: 16, fontWeight: '800', color: '#FFF' },
});
