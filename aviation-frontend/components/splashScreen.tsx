// app/components/splashScreen.tsx
import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';

type SplashScreenProps = {
  onAnimationComplete: () => void;
};

const SplashScreen = ({ onAnimationComplete }: SplashScreenProps) => {
  const fadeAnim = new Animated.Value(1);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(onAnimationComplete);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Image 
        source={require('@/assets/images/splash.png')} 
        style={styles.image}
        resizeMode="cover"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d47a1',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default SplashScreen;