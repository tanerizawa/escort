import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, withSequence,
} from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING } from '../../constants/theme';
import dayjs from 'dayjs';

interface ChatBubbleProps {
  content: string;
  time: string;
  isMe: boolean;
  isRead?: boolean;
  style?: ViewStyle;
}

export function ChatBubble({ content, time, isMe, isRead, style }: ChatBubbleProps) {
  return (
    <View style={[styles.wrapper, isMe ? styles.wrapperMe : styles.wrapperOther, style]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={[styles.text, isMe && styles.textMe]}>{content}</Text>
        <View style={styles.meta}>
          <Text style={[styles.time, isMe && styles.timeMe]}>
            {dayjs(time).format('HH:mm')}
          </Text>
          {isMe && (
            <Text style={[styles.readStatus, isRead && styles.readStatusRead]}>
              {isRead ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

interface DateSeparatorProps {
  date: string;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const d = dayjs(date);
  const today = dayjs();
  let label = d.format('DD MMM YYYY');
  if (d.isSame(today, 'day')) label = 'Hari Ini';
  else if (d.isSame(today.subtract(1, 'day'), 'day')) label = 'Kemarin';

  return (
    <View style={styles.separatorWrap}>
      <View style={styles.separatorLine} />
      <Text style={styles.separatorText}>{label}</Text>
      <View style={styles.separatorLine} />
    </View>
  );
}

function BouncingDot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);
  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 300 }),
          withTiming(0, { duration: 300 }),
        ),
        -1,
        false,
      ),
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  return <Animated.View style={[styles.dot, style]} />;
}

export function TypingIndicator() {
  return (
    <View style={[styles.wrapper, styles.wrapperOther]}>
      <View style={[styles.bubble, styles.bubbleOther, styles.typingBubble]}>
        <View style={styles.dots}>
          <BouncingDot delay={0} />
          <BouncingDot delay={150} />
          <BouncingDot delay={300} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.base,
  },
  wrapperMe: { alignItems: 'flex-end' },
  wrapperOther: { alignItems: 'flex-start' },

  bubble: {
    maxWidth: '80%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  bubbleMe: {
    backgroundColor: COLORS.gold + '20',
    borderBottomRightRadius: RADIUS.xs,
  },
  bubbleOther: {
    backgroundColor: COLORS.darkCard,
    borderBottomLeftRadius: RADIUS.xs,
  },

  text: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  textMe: {},

  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  time: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  timeMe: {
    color: COLORS.goldDark,
  },
  readStatus: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  readStatusRead: {
    color: COLORS.info,
  },

  separatorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.darkBorder,
  },
  separatorText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.textMuted,
  },
});
