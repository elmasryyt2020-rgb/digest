import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSpring,
  Easing,
} from 'react-native-reanimated';

interface WaterBottleProps {
  actualMl: number;
  targetMl: number;
}

export function WaterBottle({ actualMl, targetMl }: WaterBottleProps) {
  const percentage = Math.min(actualMl / (targetMl || 1), 1);
  
  // Shared values for animations
  const waveTranslateX = useSharedValue(0);
  const fluidHeightPercent = useSharedValue(0);

  useEffect(() => {
    // 1. Loop the wave horizontally
    waveTranslateX.value = withRepeat(
      withTiming(-100, {
        duration: 3000,
        easing: Easing.linear,
      }),
      -1, // Infinite loop
      false // Do not reverse, loop from 0 to -100
    );
  }, []);

  useEffect(() => {
    // 2. Rise the fluid height smoothly using a spring
    fluidHeightPercent.value = withSpring(percentage, {
      damping: 18,
      stiffness: 90,
    });
  }, [percentage]);

  // Style for rising fluid
  const fluidStyle = useAnimatedStyle(() => {
    return {
      height: `${fluidHeightPercent.value * 100}%`,
    };
  });

  // Style for wave movement
  const waveStyle1 = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: waveTranslateX.value }],
    };
  });

  const waveStyle2 = useAnimatedStyle(() => {
    // Offset second wave slightly for depth
    return {
      transform: [{ translateX: waveTranslateX.value - 50 }],
    };
  });

  return (
    <View style={styles.bottleContainer}>
      {/* Bottle Body */}
      <View style={styles.bottleOuter}>
        {/* Fluid Container */}
        <Animated.View style={[styles.bottleFluid, fluidStyle]}>
          {/* Wave SVGs placed on top of the fluid */}
          <View style={styles.waveWrapper}>
            {/* Front Wave */}
            <Animated.View style={[styles.waveRow, waveStyle1]}>
              <Svg width="200" height="24" viewBox="0 0 200 24" fill="none">
                <Path
                  d="M 0 12 Q 25 18, 50 12 T 100 12 Q 125 18, 150 12 T 200 12 L 200 24 L 0 24 Z"
                  fill="#7E9DB0" // Slate Blue Water Accent
                  opacity="0.85"
                />
              </Svg>
            </Animated.View>

            {/* Back Wave (slightly offset and lighter) */}
            <Animated.View style={[styles.waveRow, waveStyle2, { top: -2 }]}>
              <Svg width="200" height="24" viewBox="0 0 200 24" fill="none">
                <Path
                  d="M 0 12 Q 25 6, 50 12 T 100 12 Q 125 6, 150 12 T 200 12 L 200 24 L 0 24 Z"
                  fill="#A5C3D6" // Lighter water tint
                  opacity="0.5"
                />
              </Svg>
            </Animated.View>
          </View>

          {/* Under-wave solid blue fill */}
          <View style={styles.solidFill} />
        </Animated.View>

        {/* Level Indicators on side */}
        <View style={styles.indicators}>
          <View style={styles.indicatorLine}><Text style={styles.indicatorText}>75%</Text></View>
          <View style={styles.indicatorLine}><Text style={styles.indicatorText}>50%</Text></View>
          <View style={styles.indicatorLine}><Text style={styles.indicatorText}>25%</Text></View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottleContainer: {
    width: 100,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottleOuter: {
    width: 84,
    height: 160,
    borderWidth: 3,
    borderColor: '#EAECEB',
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  bottleFluid: {
    width: '100%',
    position: 'absolute',
    left: 0,
    bottom: 0,
    backgroundColor: '#7E9DB0', // Fallback/Main color
  },
  waveWrapper: {
    position: 'absolute',
    top: -16,
    left: 0,
    width: '100%',
    height: 24,
    overflow: 'visible',
  },
  waveRow: {
    position: 'absolute',
    left: 0,
    width: 200,
    height: 24,
  },
  solidFill: {
    width: '100%',
    height: '100%',
    backgroundColor: '#7E9DB0',
  },
  indicators: {
    position: 'absolute',
    right: 6,
    top: 0,
    bottom: 0,
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  indicatorLine: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(98, 106, 102, 0.15)',
    width: 24,
    alignItems: 'flex-end',
  },
  indicatorText: {
    fontSize: 8,
    color: '#626A66',
    fontFamily: 'Inter-Medium',
    marginBottom: 1,
  },
});
