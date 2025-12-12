import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Dimensions,
} from "react-native";
import { colors } from "../lib/colors";

const { width } = Dimensions.get("window");

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Fade in and scale up
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Start bouncing animation
    const bounceAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -20,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.bounce),
          useNativeDriver: true,
        }),
      ])
    );

    bounceAnimation.start();

    // Auto-dismiss after 2.5 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2500);

    return () => {
      clearTimeout(timer);
      bounceAnimation.stop();
    };
  }, [bounceAnim, fadeAnim, scaleAnim, onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [{ translateY: bounceAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require("../../assets/rabin.png")}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Text style={styles.title}>MinyanNow</Text>
          <Text style={styles.subtitle}>Trouvez votre minyan</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.loadingDots}>
          <LoadingDot delay={0} />
          <LoadingDot delay={150} />
          <LoadingDot delay={300} />
        </View>
      </View>
    </Animated.View>
  );
};

// Animated loading dot component
const LoadingDot: React.FC<{ delay: number }> = ({ delay }) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [scaleAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          transform: [{ scale: scaleAnim }],
          opacity: scaleAnim,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: 32,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: "center",
  },
  footer: {
    paddingBottom: 60,
  },
  loadingDots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
});
