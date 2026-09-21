import React from 'react';
import { StyleSheet, Text, View, UIManager } from 'react-native';
import LottieView from 'lottie-react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Icon } from '@tohfa/mobile-ui';
import { authPalette as P, colors } from '../../theme';
import { t } from '../../../../i18n/farmer';

function ThermometerIcon({ size = 17, color = P.white }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14 14.76V4a2 2 0 0 0-4 0v10.76a4 4 0 1 0 4 0z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Fallback glyph if Lottie native module is not yet compiled into the running APK
function FallbackGlyph({ condition, size = 64 }: { condition: string; size?: number }) {
  const norm = condition.toLowerCase();
  if (norm.includes('rain') || norm.includes('shower')) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M7 18h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.9-1A4.5 4.5 0 0 0 7 18z" fill={P.white} />
        <Line x1="9" y1="19" x2="7.5" y2="23" stroke={P.white} strokeWidth="1.8" strokeLinecap="round" />
        <Line x1="13" y1="19" x2="11.5" y2="23" stroke={P.white} strokeWidth="1.8" strokeLinecap="round" />
        <Line x1="17" y1="19" x2="15.5" y2="23" stroke={P.white} strokeWidth="1.8" strokeLinecap="round" />
      </Svg>
    );
  }
  if (norm.includes('cloud')) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="8" cy="8" r="3.5" fill={P.amberAccent} />
        <Path d="M7 18h10a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.9-1A4.5 4.5 0 0 0 7 18z" fill={P.white} />
      </Svg>
    );
  }
  if (norm.includes('night')) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill={P.white} />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" fill={P.amberAccent} />
      <Line x1="12" y1="2" x2="12" y2="5" stroke={P.amberAccent} strokeWidth="2" strokeLinecap="round" />
      <Line x1="12" y1="19" x2="12" y2="22" stroke={P.amberAccent} strokeWidth="2" strokeLinecap="round" />
      <Line x1="2" y1="12" x2="5" y2="12" stroke={P.amberAccent} strokeWidth="2" strokeLinecap="round" />
      <Line x1="19" y1="12" x2="22" y2="12" stroke={P.amberAccent} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// Check if native Lottie module is linked into the currently running APK
const isLottieLinked = Boolean(
  UIManager.getViewManagerConfig?.('LottieAnimationView') ||
  UIManager.getViewManagerConfig?.('RNTLottieAnimationView')
);

import clearDayAnim from '../../assets/weather/clear-day.json';
import clearNightAnim from '../../assets/weather/clear-night.json';
import partlyCloudyDayAnim from '../../assets/weather/partly-cloudy-day.json';
import partlyCloudyNightAnim from '../../assets/weather/partly-cloudy-night.json';
import overcastAnim from '../../assets/weather/overcast.json';
import rainAnim from '../../assets/weather/rain.json';
import thunderstormsRainAnim from '../../assets/weather/thunderstorms-rain.json';
import fogAnim from '../../assets/weather/fog.json';
import snowflakeAnim from '../../assets/weather/snowflake.json';

export interface WeatherLottieHeroProps {
  temperature?: string | number;
  condition?: string;
  dateText?: string;
  humidity?: string | number;
  windSpeed?: string | number;
  feelsLike?: string | number;
  rainChance?: string | number;
  isNight?: boolean;
}

export function WeatherLottieHero({
  temperature = '19°',
  condition = 'Partly Cloudy',
  dateText = 'Thursday, 17 July · 12:40 PM',
  humidity = '78%',
  windSpeed = '12 km/h',
  feelsLike = '17°',
  rainChance = '65%',
  isNight = false,
}: WeatherLottieHeroProps): React.JSX.Element {
  const normCond = (condition || '').toLowerCase();

  // Resolve condition to Lottie animation & hero theme colors
  let animationSource: any = partlyCloudyDayAnim;
  let cardBg: string = P.blue600;

  if (normCond.includes('thunder') || normCond.includes('storm')) {
    animationSource = thunderstormsRainAnim;
    cardBg = P.slate800;
  } else if (normCond.includes('rain') || normCond.includes('shower') || normCond.includes('drizzle')) {
    animationSource = rainAnim;
    cardBg = P.slate700;
  } else if (normCond.includes('frost') || normCond.includes('snow') || normCond.includes('freeze')) {
    animationSource = snowflakeAnim;
    cardBg = P.teal800;
  } else if (normCond.includes('fog') || normCond.includes('mist') || normCond.includes('haze')) {
    animationSource = fogAnim;
    cardBg = P.blueGrey700;
  } else if (normCond.includes('cloud') || normCond.includes('overcast')) {
    if (normCond.includes('partly')) {
      animationSource = isNight ? partlyCloudyNightAnim : partlyCloudyDayAnim;
      cardBg = isNight ? P.slate900 : P.blue600;
    } else {
      animationSource = overcastAnim;
      cardBg = P.blueGrey600;
    }
  } else if (normCond.includes('sun') || normCond.includes('clear')) {
    if (isNight) {
      animationSource = clearNightAnim;
      cardBg = P.slate900;
    } else {
      animationSource = clearDayAnim;
      cardBg = P.blue600;
    }
  } else if (isNight) {
    animationSource = clearNightAnim;
    cardBg = P.slate900;
  }

  const formattedTemp = typeof temperature === 'number' ? `${Math.round(temperature)}°` : String(temperature);
  const formattedFeels = typeof feelsLike === 'number' ? `${Math.round(feelsLike)}°` : String(feelsLike);

  return (
    <View style={[styles.heroCard, { backgroundColor: cardBg }]}>
      {/* Top row: Date & Live indicator */}
      <View style={styles.topRow}>
        <Text style={styles.heroDate}>{dateText}</Text>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Center hero row: Temperature, Condition label + Lottie animation */}
      <View style={styles.heroMain}>
        <View style={styles.tempColumn}>
          <Text style={styles.heroTemp}>{formattedTemp}</Text>
          <Text style={styles.heroCondition}>{condition}</Text>
        </View>
        <View style={styles.lottieContainer}>
          {isLottieLinked ? (
            <LottieView
              source={animationSource}
              autoPlay
              loop
              style={styles.lottieView}
            />
          ) : (
            <FallbackGlyph condition={condition} size={72} />
          )}
        </View>
      </View>

      {/* Bottom stats row: Humidity, Wind, Feels Like, Rain % */}
      <View style={styles.heroStatsRow}>
        <View style={styles.heroStatItem}>
          <Icon name="water_drop" size={17} color={P.white} style={styles.heroStatIcon} />
          <Text style={styles.heroStatValue}>{humidity}</Text>
          <Text style={styles.heroStatLabel}>{t('farmer.dashboard.weather.humidity')}</Text>
        </View>

        <View style={styles.heroStatItem}>
          <Icon name="air" size={17} color={P.white} style={styles.heroStatIcon} />
          <Text style={styles.heroStatValue}>{windSpeed}</Text>
          <Text style={styles.heroStatLabel}>{t('farmer.dashboard.weather.wind')}</Text>
        </View>

        <View style={styles.heroStatItem}>
          <ThermometerIcon size={17} color={P.white} />
          <Text style={styles.heroStatValue}>{formattedFeels}</Text>
          <Text style={styles.heroStatLabel}>{t('farmer.weather.feelsLike')}</Text>
        </View>

        <View style={styles.heroStatItem}>
          <Icon name="rainy" size={17} color={P.white} style={styles.heroStatIcon} />
          <Text style={styles.heroStatValue}>{rainChance}</Text>
          <Text style={styles.heroStatLabel}>{t('farmer.dashboard.weather.rain')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 22,
    padding: 20,
    marginBottom: 24,
    shadowColor: P.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroDate: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  liveText: {
    color: P.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tempColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  heroTemp: {
    color: P.white,
    fontSize: 60,
    fontWeight: '900',
    letterSpacing: -2,
    lineHeight: 64,
  },
  heroCondition: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  lottieContainer: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieView: {
    width: 110,
    height: 110,
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroStatItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  heroStatIcon: {
    marginBottom: 4,
  },
  heroStatValue: {
    color: P.white,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  heroStatLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
});
