import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../types/navigation";
import { colors } from "../lib/colors";

const { width, height } = Dimensions.get("window");
const ONBOARDING_KEY = "minyannow_onboarding_complete";

interface OnboardingScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Onboarding">;
}

interface Slide {
  key: string;
  emoji: string;
  gradient: [string, string];
  accentColor: string;
}

const SLIDES: Slide[] = [
  {
    key: "welcome",
    emoji: "🕍",
    gradient: ["#EEF2FF", "#DBEAFE"],
    accentColor: colors.accent,
  },
  {
    key: "map",
    emoji: "📍",
    gradient: ["#E8F4FD", "#DBEAFE"],
    accentColor: colors.primary,
  },
  {
    key: "join",
    emoji: "🤝",
    gradient: ["#D1FAE5", "#ECFDF5"],
    accentColor: colors.success,
  },
  {
    key: "notify",
    emoji: "🔔",
    gradient: ["#FEF3C7", "#FFFBEB"],
    accentColor: colors.warning,
  },
  {
    key: "ready",
    emoji: "✨",
    gradient: ["#EDE9FE", "#F5F3FF"],
    accentColor: colors.accent,
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const goToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    navigation.replace("MainTabs");
  };

  const skipOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    navigation.replace("MainTabs");
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const renderSlide = ({ item, index }: { item: Slide; index: number }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const emojiScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5],
      extrapolate: "clamp",
    });

    const emojiOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });

    const textTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [40, 0, 40],
      extrapolate: "clamp",
    });

    const textOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });

    return (
      <View style={[styles.slide, { width }]}>
        <View
          style={[
            styles.illustrationContainer,
            { backgroundColor: item.gradient[0] },
          ]}
        >
          <View
            style={[
              styles.circleOuter,
              { borderColor: item.accentColor + "20" },
            ]}
          >
            <View
              style={[
                styles.circleMiddle,
                { borderColor: item.accentColor + "30" },
              ]}
            >
              <Animated.View
                style={[
                  styles.emojiContainer,
                  {
                    backgroundColor: item.gradient[1],
                    borderColor: item.accentColor + "40",
                    transform: [{ scale: emojiScale }],
                    opacity: emojiOpacity,
                  },
                ]}
              >
                <Text style={styles.emoji}>{item.emoji}</Text>
              </Animated.View>
            </View>
          </View>
        </View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              transform: [{ translateY: textTranslateY }],
              opacity: textOpacity,
            },
          ]}
        >
          <Text style={[styles.title, { color: item.accentColor }]}>
            {t(`onboarding.slides.${item.key}.title`)}
          </Text>
          <Text style={styles.subtitle}>
            {t(`onboarding.slides.${item.key}.subtitle`)}
          </Text>
          <Text style={styles.description}>
            {t(`onboarding.slides.${item.key}.description`)}
          </Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!isLastSlide && (
        <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
          <Text style={styles.skipText}>{t("onboarding.skip")}</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        bounces={false}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((slide, index) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ],
              outputRange: [8, 28, 8],
              extrapolate: "clamp",
            });

            const dotOpacity = scrollX.interpolate({
              inputRange: [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ],
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });

            const dotColor =
              index === currentIndex
                ? SLIDES[currentIndex].accentColor
                : colors.border.dark;

            return (
              <Animated.View
                key={slide.key}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: dotColor,
                  },
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.nextButton,
            {
              backgroundColor: SLIDES[currentIndex].accentColor,
            },
            isLastSlide && styles.nextButtonLarge,
          ]}
          onPress={goToNext}
          activeOpacity={0.85}
        >
          <Text
            style={[styles.nextButtonText, isLastSlide && styles.nextButtonTextLarge]}
          >
            {isLastSlide ? t("onboarding.start") : t("onboarding.next")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  skipButton: {
    position: "absolute",
    top: 60,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  slide: {
    flex: 1,
    alignItems: "center",
  },
  illustrationContainer: {
    width: "100%",
    height: height * 0.48,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  circleOuter: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  circleMiddle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  emojiContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  emoji: {
    fontSize: 56,
  },
  textContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 36,
    paddingTop: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 24,
  },
  description: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    alignItems: "center",
    gap: 24,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  nextButtonLarge: {
    paddingVertical: 18,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.inverse,
  },
  nextButtonTextLarge: {
    fontSize: 18,
  },
});

export { ONBOARDING_KEY };
