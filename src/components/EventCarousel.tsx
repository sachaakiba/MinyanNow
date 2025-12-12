import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Animated,
  TouchableOpacity,
  Text,
} from "react-native";
import { Event } from "../lib/api";
import { EventCard } from "./EventCard";
import { colors } from "../lib/colors";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 64;
const CARD_MARGIN = 8;

interface EventCarouselProps {
  events: Event[];
  onEventPress: (event: Event) => void;
  onRequestJoin: (event: Event) => void;
  onClose: () => void;
  isLoadingRequest: boolean;
  currentUserId?: string;
  requestedEventIds: Set<string>;
}

export const EventCarousel: React.FC<EventCarouselProps> = ({
  events,
  onEventPress,
  onRequestJoin,
  onClose,
  isLoadingRequest,
  currentUserId,
  requestedEventIds,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (CARD_WIDTH + CARD_MARGIN * 2));
    setActiveIndex(index);
  };

  const renderItem = ({ item }: { item: Event }) => {
    const canRequestJoin =
      item.organizerId !== currentUserId && !requestedEventIds.has(item.id);

    return (
      <View style={styles.cardWrapper}>
        <EventCard
          event={item}
          onPress={() => onEventPress(item)}
          onRequestJoin={canRequestJoin ? () => onRequestJoin(item) : undefined}
          isLoading={isLoadingRequest}
          hasRequested={requestedEventIds.has(item.id)}
        />
      </View>
    );
  };

  return (
    <Animated.View style={styles.container}>
      {/* Header avec compteur et bouton fermer */}
      <View style={styles.header}>
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {activeIndex + 1} / {events.length}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={events}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Indicateurs de pagination */}
      <View style={styles.pagination}>
        {events.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === activeIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 110,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  counter: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  counterText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  closeButton: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 24,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
});
