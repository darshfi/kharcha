import React, { useRef } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { enter, exit, itemLayout, pressSpring, feedback, useMotionDisabled } from '../lib/motion';
import { Transaction } from '../types/transaction';
import { Category } from '../data/categories';
import { useTheme } from '../theme/ThemeProvider';
import MotionPressable from './MotionPressable';

interface Props {
  transaction: Transaction;
  category?: Category;
  onDelete: () => Promise<void>;
  onPress?: () => void;
  onEdit?: () => void;
}

export default function TransactionRow({ transaction, category, onDelete, onPress, onEdit }: Props) {
  const { theme } = useTheme();
  const pan = useSharedValue(0);
  const scale = useSharedValue(1);
  const crossed = useSharedValue(false);
  const reduced = useMotionDisabled();
  const deleting = useRef(false);
  const remove = async () => {
    if (deleting.current) return;
    deleting.current = true;
    try {
      await onDelete();
      feedback.success();
    } catch (error: any) {
      feedback.error();
      Alert.alert('Could not delete transaction', error?.message ?? 'Please try again.');
    } finally { deleting.current = false; }
  };
  const open = () => { if (!deleting.current) onPress?.(); };
  const swipe = Gesture.Pan()
    .activeOffsetX([-12, 12]).failOffsetY([-10, 10])
    .onUpdate((event) => {
      pan.value = Math.max(-140, Math.min(0, event.translationX));
      if (pan.value <= -100 && !crossed.value) {
        crossed.value = true;
        runOnJS(feedback.snap)();
      } else if (pan.value > -100) crossed.value = false;
    })
    .onEnd(() => { if (pan.value <= -100) runOnJS(remove)(); })
    .onFinalize(() => {
      pan.value = reduced ? 0 : withTiming(0, { duration: 180 });
      crossed.value = false;
    });
  const tap = Gesture.Tap().maxDistance(12)
    .onBegin(() => { if (onPress) scale.value = reduced ? 1 : withSpring(0.985, pressSpring); })
    .onFinalize(() => { scale.value = reduced ? 1 : withSpring(1, pressSpring); })
    .onEnd((_event, success) => {
    if (success && onPress) runOnJS(open)();
  });
  const moving = useAnimatedStyle(() => ({ transform: [{ translateX: pan.value }, { scale: scale.value }] }));
  const reveal = useAnimatedStyle(() => ({ opacity: Math.min(1, -pan.value / 100) }));

  const isIncome = transaction.type === 'income';
  const dotColor = isIncome ? theme.border : `${category?.color || theme.border}33`;

  return (
    <Animated.View layout={reduced ? undefined : itemLayout} entering={reduced ? undefined : enter} exiting={reduced ? undefined : exit} style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.deleteHint, reveal]}>
        <Text style={{ color: theme.negative, fontWeight: '600' }}>Delete</Text>
      </Animated.View>
      <GestureDetector gesture={Gesture.Exclusive(swipe, tap)}>
      <Animated.View
        style={[{ backgroundColor: theme.surface }, moving]}
        accessible
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={`${transaction.description || transaction.merchantName || category?.name || 'Transaction'}, ${transaction.amount} rupees, ${transaction.date}`}
        accessibilityHint={onPress ? 'Opens transaction. Swipe left to delete.' : 'Swipe left to delete.'}
        accessibilityActions={[{ name: 'delete', label: 'Delete transaction' }, ...(onPress ? [{ name: 'activate', label: 'Open transaction' }] : [])]}
        onAccessibilityAction={({ nativeEvent }) => { if (nativeEvent.actionName === 'delete') void remove(); else if (nativeEvent.actionName === 'activate') open(); }}
      >
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: dotColor }]}>
            <Text style={[styles.dotText, { color: isIncome ? theme.positive : category?.color || theme.textSecondary }]}>
              {isIncome ? '+' : category?.symbol || 'O'}
            </Text>
          </View>
          <View style={styles.body}>
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
              {transaction.description || transaction.merchantName || category?.name || 'Unknown'}
              {transaction.transactionType === 'upi' && (
                <Text style={[styles.tag, { color: theme.textSecondary, borderColor: theme.border }]}>
                  {' '}UPI
                </Text>
              )}
              {transaction.paymentMode && transaction.transactionType !== 'upi' && (
                <Text style={[styles.tag, { color: theme.textSecondary, borderColor: theme.border }]}>
                  {' '}{transaction.paymentMode}
                </Text>
              )}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {isIncome ? 'Income' : category?.name || 'Unknown'} · {transaction.date}
            </Text>
          </View>
          <Text style={[styles.amount, { color: isIncome ? theme.positive : theme.textPrimary }]}>
            {isIncome ? '+' : '−'}₹{transaction.amount.toLocaleString('en-IN', { maximumFractionDigits: transaction.amount % 1 ? 2 : 0 })}
          </Text>
        </View>
      </Animated.View>
      </GestureDetector>
      {onEdit && <View style={[styles.editActions, { borderTopColor: theme.border }]}>
        <MotionPressable
          accessibilityLabel={`Edit ${transaction.description || transaction.merchantName || 'transaction'}`}
          accessibilityHint="Change this transaction’s amount, description, category, payment mode or date."
          onPress={() => { if (!deleting.current) onEdit(); }}
          style={[styles.editButton, { backgroundColor: theme.accentSoft }]}
        >
          <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '600' }}>Edit</Text>
        </MotionPressable>
      </View>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  editActions: { alignItems: 'flex-end', borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 4 },
  editButton: { minHeight: 44, minWidth: 72, alignItems: 'center', justifyContent: 'center', borderRadius: 8, paddingHorizontal: 16 },
  deleteHint: { justifyContent: 'center', alignItems: 'flex-end', paddingRight: 16 },
  container: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    marginVertical: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 12,
  },
  dot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: {
    fontSize: 18,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
  tag: {
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
    borderWidth: 1,
    overflow: 'hidden',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
    textAlign: 'right',
    flexShrink: 0,
  },
});
