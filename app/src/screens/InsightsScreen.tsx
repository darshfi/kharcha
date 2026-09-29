import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useStore } from '../store/useStore';

export default function InsightsScreen() {
  const { theme } = useTheme();
  const { transactions, categories } = useStore();

  const now = new Date();
  const ym = now.toISOString().slice(0, 7);
  const monthExpenses = transactions.filter((t) => t.date.startsWith(ym) && t.type === 'expense');
  const monthIncome = transactions.filter((t) => t.date.startsWith(ym) && t.type === 'income');

  const totalSpent = monthExpenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = monthIncome.reduce((s, t) => s + t.amount, 0);

  const byCategory: Record<string, number> = {};
  monthExpenses.forEach((t) => {
    byCategory[t.categoryId || ''] = (byCategory[t.categoryId || ''] || 0) + t.amount;
  });
  const categoryRows = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([id, amount]) => ({
      category: categories.find((c) => c.id === id),
      amount,
    }));

  const byMode: Record<string, number> = {};
  monthIncome.forEach((t) => {
    const mode = t.paymentMode || 'Other';
    byMode[mode] = (byMode[mode] || 0) + t.amount;
  });
  const modeRows = Object.entries(byMode).sort((a, b) => b[1] - a[1]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2);
    const value = transactions
      .filter((t) => t.date === key && t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return { key, label, value };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.value));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={[styles.heading, { color: theme.textPrimary }]}>Insights</Text>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Last 7 days</Text>
          <View style={styles.chart}>
            {days.map((d, i) => (
              <View key={d.key} style={styles.barWrap}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max((d.value / maxDay) * 100, d.value > 0 ? 4 : 1),
                      backgroundColor: i === 6 ? theme.accent : theme.warning,
                    },
                  ]}
                />
                <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{d.label}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.footnote, { color: theme.textSecondary }]}>
            ₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })} this week
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>By category</Text>
          {categoryRows.length === 0 ? (
            <Text style={{ color: theme.textTertiary, paddingVertical: 8 }}>No expenses this month.</Text>
          ) : (
            categoryRows.map(({ category, amount }) => (
              <View key={category?.id} style={styles.breakdownRow}>
                <View style={styles.breakdownLabel}>
                  <Text style={{ color: theme.textPrimary, fontSize: 14 }}>
                    {category?.emoji} {category?.name}
                  </Text>
                </View>
                <View style={styles.breakdownValue}>
                  <Text style={{ color: theme.textPrimary, fontWeight: '600', fontSize: 14 }}>
                    ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                  <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                    {totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0}%
                  </Text>
                </View>
                <View style={[styles.track, { backgroundColor: theme.track }]}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${totalSpent > 0 ? (amount / totalSpent) * 100 : 0}%`,
                        backgroundColor: category?.color || theme.accent,
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Income by mode</Text>
          {modeRows.length === 0 ? (
            <Text style={{ color: theme.textTertiary, paddingVertical: 8 }}>No income this month.</Text>
          ) : (
            modeRows.map(([mode, amount]) => (
              <View key={mode} style={styles.breakdownRow}>
                <Text style={{ color: theme.textPrimary, fontSize: 14 }}>{mode}</Text>
                <View style={styles.breakdownValue}>
                  <Text style={{ color: theme.textPrimary, fontWeight: '600', fontSize: 14 }}>
                    ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                  <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                    {totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0}%
                  </Text>
                </View>
                <View style={[styles.track, { backgroundColor: theme.track }]}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${totalIncome > 0 ? (amount / totalIncome) * 100 : 0}%`,
                        backgroundColor: theme.accent,
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
  },
  barWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '70%',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  footnote: {
    fontSize: 13,
    marginTop: 8,
  },
  breakdownRow: {
    marginBottom: 12,
  },
  breakdownLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
