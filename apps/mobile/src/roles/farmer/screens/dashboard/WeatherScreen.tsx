import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { ErrorState, Icon } from '@tohfa/mobile-ui';
import { t } from '../../../../i18n/farmer';
import { authPalette as P, colors } from '../../theme';
import {
  getFarmWeather,
  type FarmWeather,
  type FarmWeatherAlert,
  type WeatherCondition,
} from '../../api/weather';
import { WeatherLottieHero } from './WeatherLottieHero';

// ─────────────────────────────────────────────
// Inline condition glyphs for hourly & 7-day rows
// (Strict zero raw emoji rule per foundation.test.ts)
// ─────────────────────────────────────────────

type WeatherKind = 'sunny' | 'partlyCloudy' | 'cloudy' | 'rain' | 'lightRain' | 'night' | 'frost';

function WeatherGlyph({ kind, size = 22 }: { kind: WeatherKind; size?: number }) {
  const sun = (
    <>
      <Circle cx="12" cy="12" r="4.5" fill={P.amberAccent} />
      <Line x1="12" y1="2" x2="12" y2="4.5" stroke={P.amberAccent} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="12" y1="19.5" x2="12" y2="22" stroke={P.amberAccent} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="2" y1="12" x2="4.5" y2="12" stroke={P.amberAccent} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="19.5" y1="12" x2="22" y2="12" stroke={P.amberAccent} strokeWidth="1.6" strokeLinecap="round" />
    </>
  );
  const cloud = (
    <Path
      d="M7 18h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.9-1A4.5 4.5 0 0 0 7 18z"
      fill={P.slate300}
      stroke={P.slate400}
      strokeWidth="1"
    />
  );
  const rain = (
    <>
      <Line x1="9" y1="19" x2="7.5" y2="22" stroke={P.blue700} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="13" y1="19" x2="11.5" y2="22" stroke={P.blue700} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="17" y1="19" x2="15.5" y2="22" stroke={P.blue700} strokeWidth="1.6" strokeLinecap="round" />
    </>
  );
  const moon = <Path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill={P.blueGrey600} />;
  const frost = (
    <>
      <Line x1="12" y1="3" x2="12" y2="21" stroke={P.frostAlertBorder} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="3" y1="12" x2="21" y2="12" stroke={P.frostAlertBorder} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="12" r="2.2" fill={P.frostAlertBorder} />
    </>
  );

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {kind === 'sunny' && sun}
      {kind === 'partlyCloudy' && (
        <>
          <Circle cx="8" cy="8" r="3.2" fill={P.amberAccent} />
          {cloud}
        </>
      )}
      {kind === 'cloudy' && cloud}
      {kind === 'rain' && (
        <>
          {cloud}
          {rain}
        </>
      )}
      {kind === 'lightRain' && (
        <>
          {cloud}
          <Line x1="10" y1="19" x2="9" y2="21.5" stroke={P.blue700} strokeWidth="1.4" strokeLinecap="round" />
          <Line x1="14" y1="19" x2="13" y2="21.5" stroke={P.blue700} strokeWidth="1.4" strokeLinecap="round" />
        </>
      )}
      {kind === 'night' && moon}
      {kind === 'frost' && frost}
    </Svg>
  );
}

function toWeatherKind(condition: WeatherCondition | string): WeatherKind {
  switch (condition) {
    case 'CLEAR':
      return 'sunny';
    case 'CLEAR_NIGHT':
      return 'night';
    case 'PARTLY_CLOUDY':
      return 'partlyCloudy';
    case 'CLOUDY':
    case 'FOG':
      return 'cloudy';
    case 'LIGHT_RAIN':
      return 'lightRain';
    case 'RAIN':
    case 'THUNDERSTORM':
      return 'rain';
    default:
      return 'sunny';
  }
}

function conditionToLabel(condition: WeatherCondition | string): string {
  switch (condition) {
    case 'CLEAR':
      return t('farmer.dashboard.weather.sunny');
    case 'CLEAR_NIGHT':
      return t('farmer.weather.condition.CLEAR_NIGHT');
    case 'PARTLY_CLOUDY':
      return t('farmer.weather.partlyCloudy');
    case 'CLOUDY':
      return t('farmer.weather.cloudy');
    case 'FOG':
      return t('farmer.weather.condition.FOG');
    case 'LIGHT_RAIN':
      return t('farmer.weather.lightShowers');
    case 'RAIN':
      return t('farmer.dashboard.weather.rain');
    case 'THUNDERSTORM':
      return t('farmer.weather.condition.THUNDERSTORM');
    default:
      return condition;
  }
}

function formatObservedDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekday = dayNames[d.getDay()] ?? '';
    const day = d.getDate();
    const month = monthNames[d.getMonth()] ?? '';
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${weekday}, ${day} ${month} · ${hours}:${minutes} ${ampm}`;
  } catch {
    return 'Today';
  }
}

function formatHourlyTime(isoString: string, index: number): string {
  if (index === 0) return t('farmer.weather.now');
  try {
    const d = new Date(isoString);
    let hours = d.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours} ${ampm}`;
  } catch {
    return '';
  }
}

function formatDailyDay(dateString: string, index: number): string {
  if (index === 0) return t('farmer.weather.today');
  try {
    const d = new Date(dateString);
    const dayShorts = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayShorts[d.getDay()] ?? dateString;
  } catch {
    return dateString;
  }
}

function getMinutesAgo(isoString: string): number {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    return Math.max(1, Math.round(diffMs / (60 * 1000)));
  } catch {
    return 1;
  }
}

interface WeatherScreenProps {
  onNavigateBack: () => void;
}

export function WeatherScreen({ onNavigateBack }: WeatherScreenProps): React.JSX.Element {
  const [weather, setWeather] = useState<FarmWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFarmWeather();
      setWeather(data);
      if (data.alerts && data.alerts.length > 0 && data.alerts[0]) {
        setExpandedAlert(data.alerts[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to load real-time farm weather data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const toggleAlert = (id: string) => {
    setExpandedAlert((prev) => (prev === id ? null : id));
  };

  const locationText =
    weather?.location.farmName ||
    weather?.location.village ||
    t('farmer.dashboard.weather.location');

  const minutesAgo = weather?.observedAt ? getMinutesAgo(weather.observedAt) : 5;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={P.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navCircleButton} onPress={onNavigateBack}>
          <Text style={styles.navBackIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>{t('farmer.weather.title')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('farmer.weather.subtitleUpdated', {
              location: locationText,
              minutes: minutesAgo,
            })}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching real-time Nilgiris weather...</Text>
          </View>
        ) : error || !weather ? (
          <ErrorState
            title="Weather Unavailable"
            message={error || 'Could not connect to farm weather station.'}
            onRetry={fetchWeather}
          />
        ) : (
          <>
            {/* Real-time Animated Weather Hero */}
            <WeatherLottieHero
              temperature={weather.current.temperatureC}
              condition={conditionToLabel(weather.current.condition)}
              dateText={formatObservedDate(weather.observedAt)}
              humidity={`${Math.round(weather.current.humidityPct)}%`}
              windSpeed={`${Math.round(weather.current.windKph)} km/h`}
              feelsLike={`${Math.round(weather.current.feelsLikeC)}°`}
              rainChance={`${Math.round(weather.current.precipitationChancePct)}%`}
              isNight={weather.current.condition === 'CLEAR_NIGHT'}
            />

            {/* Active Agricultural Weather Alerts */}
            <Text style={styles.sectionHeading}>{t('farmer.weather.activeAlerts')}</Text>
            {weather.alerts && weather.alerts.length > 0 ? (
              <View style={styles.alertsList}>
                {weather.alerts.map((alert: FarmWeatherAlert) => {
                  const isFrost = alert.type === 'FROST';
                  const isExpanded = expandedAlert === alert.id;

                  return (
                    <TouchableOpacity
                      key={alert.id}
                      style={[
                        styles.alertCard,
                        isFrost
                          ? { backgroundColor: P.frostAlertBg, borderColor: P.frostAlertBorder }
                          : { backgroundColor: P.white, borderColor: P.borderLight },
                      ]}
                      onPress={() => toggleAlert(alert.id)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.alertHeaderRow}>
                        <View style={styles.alertIconBox}>
                          <WeatherGlyph kind={isFrost ? 'frost' : 'rain'} size={24} />
                        </View>
                        <View style={styles.alertTitleBox}>
                          <Text
                            style={[
                              styles.alertTitle,
                              { color: isFrost ? P.frostAlertText : P.ink },
                            ]}
                          >
                            {alert.title}
                          </Text>
                          <Text
                            style={[
                              styles.alertSubtitle,
                              { color: isFrost ? P.frostAlertSub : P.stoneMuted },
                            ]}
                          >
                            {alert.subtitle}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.chevron,
                            { color: isFrost ? P.frostAlertSub : P.stoneMuted },
                          ]}
                        >
                          {isExpanded ? '⌃' : '⌄'}
                        </Text>
                      </View>

                      {isExpanded && alert.advisory ? (
                        <View
                          style={[
                            styles.alertDetailsBox,
                            {
                              borderTopColor: isFrost
                                ? 'rgba(240, 86, 42, 0.22)'
                                : colors.borderSoft,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.alertDetailsText,
                              { color: isFrost ? P.frostAlertDetail : colors.textBody },
                            ]}
                          >
                            {alert.advisory}
                          </Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.noAlertsCard}>
                <Icon name="check_circle" size={20} color={colors.brandGreen} />
                <Text style={styles.noAlertsText}>
                  No severe weather alerts active for your farm location.
                </Text>
              </View>
            )}

            {/* Next 24 Hours Real-time Hourly Steps */}
            {weather.hourly && weather.hourly.length > 0 && (
              <>
                <Text style={styles.sectionHeading}>{t('farmer.weather.next24Hours')}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.hourlyScroll}
                  contentContainerStyle={styles.hourlyScrollContent}
                >
                  {weather.hourly.map((h, idx) => (
                    <View key={`${h.at}-${idx}`} style={styles.hourlyBox}>
                      <Text style={styles.hourlyTime}>{formatHourlyTime(h.at, idx)}</Text>
                      <View style={styles.hourlyGlyphBox}>
                        <WeatherGlyph kind={toWeatherKind(h.condition)} size={24} />
                      </View>
                      <Text style={styles.hourlyTemp}>{Math.round(h.temperatureC)}°</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}

            {/* 7-Day Real Forecast Outlook */}
            {weather.daily && weather.daily.length > 0 && (
              <>
                <Text style={styles.sectionHeading}>{t('farmer.weather.sevenDayForecast')}</Text>
                <View style={styles.forecastList}>
                  {weather.daily.map((d, idx) => {
                    const isLast = idx === weather.daily.length - 1;
                    const conditionText = conditionToLabel(d.condition);
                    const summary =
                      d.precipitationMm > 0
                        ? `${conditionText} · ${Math.round(d.precipitationMm)} mm`
                        : conditionText;

                    return (
                      <View
                        key={`${d.date}-${idx}`}
                        style={[styles.forecastRow, isLast && { borderBottomWidth: 0 }]}
                      >
                        <Text style={styles.forecastDay}>{formatDailyDay(d.date, idx)}</Text>
                        <View style={styles.forecastGlyphBox}>
                          <WeatherGlyph kind={toWeatherKind(d.condition)} size={20} />
                        </View>
                        <Text style={styles.forecastSummary} numberOfLines={1}>
                          {summary}
                        </Text>
                        <View style={styles.forecastTemps}>
                          <Text style={styles.forecastHigh}>{Math.round(d.maxTempC)}°</Text>
                          <Text style={styles.forecastLow}>{Math.round(d.minTempC)}°</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: P.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: P.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDivider,
  },
  navCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: P.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBackIcon: {
    color: colors.primary,
    fontSize: 24,
    lineHeight: 28,
    marginRight: 2,
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    color: colors.textDark,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: colors.textSubtle,
    fontSize: 13,
    marginTop: 2,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  loadingContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSubtle,
    fontWeight: '500',
  },

  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSubtle,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  alertsList: {
    gap: 12,
    marginBottom: 24,
  },
  alertCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIconBox: {
    marginRight: 12,
  },
  alertTitleBox: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 13,
  },
  chevron: {
    fontSize: 20,
    marginLeft: 8,
  },
  alertDetailsBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  alertDetailsText: {
    fontSize: 13,
    lineHeight: 20,
  },
  noAlertsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: P.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 24,
  },
  noAlertsText: {
    flex: 1,
    fontSize: 13,
    color: colors.textBody,
    lineHeight: 18,
  },

  hourlyScroll: {
    marginHorizontal: -16,
    marginBottom: 24,
  },
  hourlyScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  hourlyBox: {
    backgroundColor: P.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: 68,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  hourlyTime: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSubtle,
    marginBottom: 8,
  },
  hourlyGlyphBox: {
    marginBottom: 8,
  },
  hourlyTemp: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textDark,
  },

  forecastList: {
    backgroundColor: P.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  forecastDay: {
    width: 44,
    fontSize: 13,
    fontWeight: '800',
    color: colors.textDark,
  },
  forecastGlyphBox: {
    width: 32,
    alignItems: 'center',
    marginRight: 6,
  },
  forecastSummary: {
    flex: 1,
    fontSize: 13,
    color: colors.textSubtle,
    marginLeft: 4,
  },
  forecastTemps: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  forecastHigh: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textDark,
    width: 28,
    textAlign: 'right',
  },
  forecastLow: {
    fontSize: 13,
    color: colors.textSubtle,
    width: 28,
    textAlign: 'right',
  },
});
