import React from 'react';
import Animated from 'react-native-reanimated';
import { enter, useMotionDisabled } from '../lib/motion';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import MotionPressable from '../components/MotionPressable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useStore } from '../store/useStore';
import TransactionRow from '../components/TransactionRow';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { getInsights } from '../lib/insights';

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const reduced = useMotionDisabled();
  const { transactions, categories, deleteTransaction } = useStore();

  const { totalBalance, totalSpent, totalIncome, avgExpensePerDay: dailyAvg } = getInsights(transactions, categories);

  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 15);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: theme.textPrimary }]}>Kharcha</Text>

        <Animated.View entering={reduced ? undefined : enter} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Total balance</Text>
          <Animated.Text key={totalBalance} entering={reduced ? undefined : enter} style={[styles.bigAmount, styles.balanceAmount, { color: totalBalance < 0 ? theme.negative : theme.textPrimary }]}>
            {totalBalance < 0 ? '−' : ''}₹{Math.abs(totalBalance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </Animated.Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>All recorded income minus expenses</Text>
        </Animated.View>

        <View style={styles.metricsRow}>
          <View style={[styles.card, styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Daily avg</Text>
            <Text style={[styles.bigAmount, { color: theme.textPrimary }]}>
              ₹{Math.round(dailyAvg).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.card, styles.metricCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>This month</Text>
            <Text style={[styles.bigAmount, { color: theme.textPrimary }]}>
              ₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
          </View>
        </View>

        <Animated.View entering={reduced ? undefined : enter} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Income vs Spend</Text>
          <Text style={[styles.amount, { color: theme.positive }]}>
            +₹{totalIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={[styles.amount, { color: theme.negative }]}>
            −₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
          {totalIncome > 0 && (
            <Text style={[styles.net, { color: totalIncome >= totalSpent ? theme.positive : theme.negative }]}>
              {totalIncome >= totalSpent ? 'Saved' : 'Overspent'} ₹{Math.abs(totalIncome - totalSpent).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
          )}
        </Animated.View>

        <MotionPressable style={styles.sectionHeader} accessibilityLabel="View all transactions" onPress={() => navigation.navigate('History')}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent transactions</Text>
          <Text style={[styles.sectionLink, { color: theme.accent }]}>View all →</Text>
        </MotionPressable>
        {recent.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={{ color: theme.textSecondary }}>No transactions yet.</Text>
          </View>
        ) : (
          recent.map((t) => (
            <TransactionRow
              key={t.id}
              transaction={t}
              category={categories.find((c) => c.id === t.categoryId)}
              onDelete={() => deleteTransaction(t.id)}
              onPress={() => navigation.navigate('History')}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flexShrink: 0,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  metricCard: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
    marginBottom: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  bigAmount: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  balanceAmount: {
    fontSize: 32,
    letterSpacing: -0.8,
  },
  amount: {
    fontSize: 19,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: 6,
  },
  net: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 12,
    rowGap: 6,
    marginTop: 12,
    marginBottom: 14,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  empty: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
});
