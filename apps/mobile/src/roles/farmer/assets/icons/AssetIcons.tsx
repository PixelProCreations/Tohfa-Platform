import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export interface SvgIconProps {
  size?: number;
  color?: string;
  style?: StyleProp<any>;
}

export interface ImageIconProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export const backButtonSource = require('./backbuton.png');
export const googleIconSource = require('./googleee.png');
export const facebookIconSource = require('./facebook.png');

/**
 * BackButton icon using assets/icons/backbuton.png
 */
export const BackButtonIcon: React.FC<ImageIconProps> = ({ size = 20, style }) => (
  <Image
    source={backButtonSource}
    style={[{ width: size, height: size }, style]}
    resizeMode="contain"
  />
);

/**
 * Call/Phone icon using path from assets/icons/call.svg
 */
export const CallIcon: React.FC<SvgIconProps> = ({ size = 20, color = '#B7B7B7', style }) => (
  <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color} style={style}>
    <Path d="M796-120q-119 0-240-55.5T333-333Q231-435 175.5-556T120-796q0-18.86 12.57-31.43T164-840h147.33q14 0 24.34 9.83Q346-820.33 349.33-806l26.62 130.43q2.05 14.9-.62 26.24-2.66 11.33-10.82 19.48L265.67-530q24 41.67 52.5 78.5T381-381.33q35 35.66 73.67 65.5Q493.33-286 536-262.67l94.67-96.66q9.66-10.34 23.26-14.5 13.61-4.17 26.74-2.17L806-349.33q14.67 4 24.33 15.53Q840-322.27 840-308v144q0 18.86-12.57 31.43T796-120ZM233-592l76-76.67-21-104.66H187q3 41.66 13.67 86Q211.33-643 233-592Zm365.33 361.33q40.34 18.34 85.84 29.67 45.5 11.33 89.16 13.67V-288l-100-20.33-75 77.66ZM233-592Zm365.33 361.33Z" />
  </Svg>
);

/**
 * Lock/Security icon using path from assets/icons/lock.svg
 */
export const LockIcon: React.FC<SvgIconProps> = ({ size = 20, color = '#CCCCCC', style }) => (
  <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color} style={style}>
    <Path d="M226.67-80q-27.5 0-47.09-19.58Q160-119.17 160-146.67v-422.66q0-27.5 19.58-47.09Q199.17-636 226.67-636h60v-90.67q0-80.23 56.57-136.78T480.07-920q80.26 0 136.76 56.55 56.5 56.55 56.5 136.78V-636h60q27.5 0 47.09 19.58Q800-596.83 800-569.33v422.66q0 27.5-19.58 47.09Q760.83-80 733.33-80H226.67Zm0-66.67h506.66v-422.66H226.67v422.66Zm308.5-155.85Q558-325.04 558-356.67q0-31-22.95-55.16Q512.11-436 479.89-436t-55.06 24.17Q402-387.67 402-356.33q0 31.33 22.95 53.83 22.94 22.5 55.16 22.5t55.06-22.52ZM353.33-636h253.34v-90.67q0-52.77-36.92-89.72-36.93-36.94-89.67-36.94-52.75 0-89.75 36.94-37 36.95-37 89.72V-636ZM226.67-146.67v-422.66 422.66Z" />
  </Svg>
);

/**
 * Home icon using path from assets/icons/home.svg
 */
export const HomeIcon: React.FC<SvgIconProps> = ({ size = 24, color = '#78A75A', style }) => (
  <Svg width={size} height={size} viewBox="0 -960 960 960" fill={color} style={style}>
    <Path d="M226.67-186.67h140v-246.66h226.66v246.66h140v-380L480-756.67l-253.33 190v380ZM160-120v-480l320-240 320 240v480H526.67v-246.67h-93.34V-120H160Zm320-352Z" />
  </Svg>
);

/**
 * Google Icon using assets/icons/googleee.png
 */
export const GoogleIcon: React.FC<ImageIconProps> = ({ size = 24, style }) => (
  <Image
    source={googleIconSource}
    style={[{ width: size, height: size }, style]}
    resizeMode="contain"
  />
);

/**
 * Facebook Icon using assets/icons/facebook.png
 */
export const FacebookIcon: React.FC<ImageIconProps> = ({ size = 24, style }) => (
  <Image
    source={facebookIconSource}
    style={[{ width: size, height: size }, style]}
    resizeMode="contain"
  />
);
