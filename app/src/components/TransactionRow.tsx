import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder } from 'react-native';
import { Transaction } from '../types/transaction';
import { Category } from '../data/categories';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  transaction: Transaction;
  category?: Category;
  onDelete: () => void;
}

export default function TransactionRow({ transaction, category, onDelete }: Props) {
  const { theme } = useTheme();
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) pan.setValue(gs.dx);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -100) {
          Animated.timing(pan, {
            toValue: -400,
            duration: 200,
            useNativeDriver: true,
          }).start(onDelete);
        } else {
          Animated.spring(pan, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const isIncome = transaction.type === 'income';
  const dotColor = isIncome ? theme.border : `${category?.color || theme.border}33`;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Animated.View
        style={[{ transform: [{ translateX: pan }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: dotColor }]}>
            <Text style={[styles.dotText, { color: isIncome ? theme.positive : category?.color || theme.textSecondary }]}>
              {isIncome ? '+' : category?.symbol || 'O'}
            </Text>
          </View>
          <View style={styles.body}>
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
              {transaction.merchantName || transaction.description || category?.name || 'Unknown'}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
