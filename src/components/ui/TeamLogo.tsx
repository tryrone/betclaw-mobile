import React from 'react';
import { Image } from 'expo-image';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useAppTheme } from '@/theme/colors';

export type TeamName = 'Barcelona' | 'Chelsea' | 'Borussia D' | 'Man United' | string;

export function TeamLogo({ logoUrl, name, size = 40 }: { logoUrl?: string | null; name: TeamName; size?: number }) {
  const theme = useAppTheme();
  const normalized = name.toLowerCase().trim();

  if (logoUrl) {
    return (
      <View
        style={[
          styles.imageWrap,
          {
            backgroundColor: 'rgba(255,255,255,0.16)',
            borderColor: theme.borderStrong,
            borderRadius: size / 2,
            height: size,
            width: size,
          },
        ]}>
        <Image
          source={{ uri: logoUrl }}
          style={{ height: size * 0.78, width: size * 0.78 }}
          contentFit="contain"
          transition={180}
        />
      </View>
    );
  }

  if (normalized.includes('barcelona') || normalized.includes('bar')) {
    // Barcelona Crest: Shield with red and blue vertical stripes, gold upper section, yellow ball
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Shield background */}
        <Path
          d="M10,20 C10,10 50,5 50,5 C50,5 90,10 90,20 C90,55 70,85 50,95 C30,85 10,55 10,20 Z"
          fill="#004d98"
          stroke="#ffffff"
          strokeWidth="3"
        />
        {/* Vertical red stripes */}
        <Path
          d="M25,20 C25,50 35,75 35,75 M50,5 C50,85 50,90 50,90 M75,20 C75,50 65,75 65,75"
          stroke="#a50044"
          strokeWidth="12"
        />
        {/* Gold cross band at the top */}
        <Path
          d="M11,23 L89,23 L89,42 L11,42 Z"
          fill="#edbb00"
        />
        {/* Stylized ball/letters inside */}
        <Circle cx="50" cy="65" r="10" fill="#edbb00" />
        <Circle cx="50" cy="65" r="6" fill="#a50044" />
      </Svg>
    );
  }

  if (normalized.includes('chelsea') || normalized.includes('che')) {
    // Chelsea Circle: Blue circle with white lion rampant and gold border
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="46" fill="#034694" stroke="#e6efeb" strokeWidth="2.5" />
        <Circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="3,3" />
        {/* Stylized white lion in center */}
        <Path
          d="M45,30 C45,30 40,35 43,40 C46,45 52,43 55,48 C58,53 52,65 52,65 L60,65 C60,65 62,55 58,48 C54,41 48,42 48,36 C48,30 45,30 45,30 Z"
          fill="#ffffff"
        />
        <Path
          d="M38,62 L42,65 L48,65 L44,60 Z"
          fill="#ffffff"
        />
        <Path
          d="M58,32 C58,32 63,33 65,37 C67,41 63,45 63,45"
          stroke="#ffffff"
          strokeWidth="2.5"
          fill="none"
        />
      </Svg>
    );
  }

  if (normalized.includes('borussia') || normalized.includes('dortmund') || normalized.includes('bvb')) {
    // Dortmund: Yellow circle, black border, BVB text
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="46" fill="#FDE100" stroke="#000000" strokeWidth="6" />
        <Path
          d="M26,38 L38,38 C43,38 46,40 46,44 C46,47 44,49 41,50 C45,51 47,53 47,57 C47,61 43,63 38,63 L26,63 Z M32,44 L32,48 L37,48 C39,48 40,47 40,46 C40,45 39,44 37,44 Z M32,53 L32,57 L37,57 C39,57 41,56 41,55 C41,54 39,53 37,53 Z"
          fill="#000000"
        />
        <Path
          d="M50,38 L57,63 L64,63 L71,38 L65,38 L60,56 L55,38 Z"
          fill="#000000"
        />
        <Path
          d="M74,38 L86,38 C91,38 94,40 94,44 C94,47 92,49 89,50 C93,51 95,53 95,57 C95,61 91,63 86,63 L74,63 Z M80,44 L80,48 L85,48 C87,48 88,47 88,46 C88,45 87,44 85,44 Z M80,53 L80,57 L85,57 C87,57 89,56 89,55 C89,54 87,53 85,53 Z"
          fill="#000000"
        />
      </Svg>
    );
  }

  if (normalized.includes('united') || normalized.includes('manchester') || normalized.includes('man')) {
    // Manchester United: Red circle with gold shield and red details
    return (
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="46" fill="#DA291C" stroke="#FFE500" strokeWidth="4.5" />
        <Path
          d="M25,30 L75,30 L70,70 L50,85 L30,70 Z"
          fill="#FFE500"
        />
        <Path
          d="M35,42 C35,38 42,35 50,35 C58,35 65,38 65,42 L35,42 Z"
          fill="#DA291C"
        />
        <Rect x="47" y="44" width="6" height="6" fill="#DA291C" />
        <Path
          d="M50,52 L46,60 L54,60 Z M46,60 L44,72 L47,72 L46,65 L50,68 L54,65 L53,72 L56,72 L54,60 Z"
          fill="#DA291C"
        />
      </Svg>
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: theme.primarySubtle,
          borderColor: theme.selectionBorder,
          borderRadius: size / 2,
          height: size,
          width: size,
        },
      ]}>
      <Text style={[styles.avatarText, { color: theme.primarySoft, fontSize: size * 0.3 }]}>
        {name.slice(0, 3).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: 'bold',
  },
  imageWrap: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
