import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useStore } from '../store/useStore';
import TransactionRow from '../components/TransactionRow';
import { Transaction } from '../types/transaction';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { transactions, categories, deleteTransaction } = useStore();

  const now = new Date();
  const ym = now.toISOString().slice(0, 7);
  const monthTxns = transactions.filter((t) => t.date.startsWith(ym) && t.type === 'expense');
  const monthIncome = transactions.filter((t) => t.date.startsWith(ym) && t.type === 'income');

  const totalSpent = monthTxns.reduce((s, t) => s + t.amount, 0);
  const totalIncome = monthIncome.reduce((s, t) => s + t.amount, 0);
  const dailyAvg = totalSpent / now.getDate();
  const biggest = monthTxns.reduce((m: Transaction | null, t: Transaction) => (!m || t.amount > m.amount ? t : m), null as Transaction | null);

  const recent = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: theme.textPrimary }]}>Kharcha</Text>

        <View style={styles.metricsRow}>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Daily avg</Text>
            <Text style={[styles.bigAmount, { color: theme.textPrimary }]}>
              ₹{Math.round(dailyAvg).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>This month</Text>
            <Text style={[styles.bigAmount, { color: theme.textPrimary }]}>
              ₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Biggest expense</Text>
          <Text style={[styles.amount, { color: theme.textPrimary }]}>
            {biggest ? `₹${biggest.amount.toLocaleString('en-IN')}` : '—'}
          </Text>
          {biggest && (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {biggest.merchantName || biggest.description || 'Unknown'}
            </Text>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent transactions</Text>
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
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
  },
  bigAmount: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
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
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },
  empty: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
});
