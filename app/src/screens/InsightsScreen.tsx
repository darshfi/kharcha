import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
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
          <Text style={[styles.label, { color: theme.textSecondary }]}>Spending by category</Text>
          {categoryRows.length === 0 ? (
            <Text style={{ color: theme.textTertiary, paddingVertical: 8 }}>No expenses this month.</Text>
          ) : (
            <View style={styles.pieContainer}>
              <Svg width={160} height={160} viewBox="0 0 42 42">
                {(() => {
                  let cumulativePercent = 0;
                  return categoryRows.map(({ category, amount }) => {
                    const percent = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
                    const startAngle = (cumulativePercent / 100) * 360;
                    cumulativePercent += percent;
                    const endAngle = (cumulativePercent / 100) * 360;
                    const largeArc = percent > 50 ? 1 : 0;
                    const startRad = ((startAngle - 90) * Math.PI) / 180;
                    const endRad = ((endAngle - 90) * Math.PI) / 180;
                    const x1 = 21 + 15 * Math.cos(startRad);
                    const y1 = 21 + 15 * Math.sin(startRad);
                    const x2 = 21 + 15 * Math.cos(endRad);
                    const y2 = 21 + 15 * Math.sin(endRad);
                    const d = `M 21 21 L ${x1} ${y1} A 15 15 0 ${largeArc} 1 ${x2} ${y2} Z`;
                    return (
                      <Path
                        key={category?.id}
                        d={d}
                        fill={category?.color || theme.accent}
                        stroke={theme.surface}
                        strokeWidth={0.5}
                      />
                    );
                  });
                })()}
              </Svg>
              <View style={styles.pieLegend}>
                {categoryRows.map(({ category, amount }) => (
                  <View key={`${category?.id}-${amount}`} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: category?.color || theme.accent }]} />
                    <Text style={{ color: theme.textPrimary, fontSize: 12, flex: 1 }}>
                      {category?.name}
                    </Text>
                    <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                      {totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Expense vs Income Line Chart */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Expense vs Income (7 days)</Text>
          {(() => {
            const chartDays = Array.from({ length: 7 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const key = d.toISOString().split('T')[0];
              const label = d.toLocaleDateString('en-IN', { weekday: 'short' }).slice(0, 2);
              const expenseValue = transactions
                .filter((t) => t.date === key && t.type === 'expense')
                .reduce((s, t) => s + t.amount, 0);
              const incomeValue = transactions
                .filter((t) => t.date === key && t.type === 'income')
                .reduce((s, t) => s + t.amount, 0);
              return { key, label, expense: expenseValue, income: incomeValue };
            });
            const maxValue = Math.max(1, ...chartDays.map((d) => Math.max(d.expense, d.income)));
            const width = 320;
            const height = 120;
            const padding = 20;
            const chartWidth = width - 2 * padding;
            const chartHeight = height - 2 * padding;

            return (
              <View style={styles.lineChartContainer}>
                <Svg width={width} height={height}>
                  {/* Grid lines */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Line
                      key={`grid-${i}`}
                      x1={padding}
                      y1={padding + (chartHeight / 4) * i}
                      x2={width - padding}
                      y2={padding + (chartHeight / 4) * i}
                      stroke={theme.border}
                      strokeWidth={0.5}
                      strokeDasharray="4 4"
                    />
                  ))}
                  {/* Y-axis labels */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Text
                      key={`yl-${i}`}
                      x={padding - 5}
                      y={padding + (chartHeight / 4) * i}
                      textAnchor="end"
                      fontSize={8}
                      fill={theme.textTertiary}
                      dominantBaseline="middle"
                    >
                      {i === 0 ? Math.round(maxValue).toLocaleString() : i === 4 ? '0' : Math.round(maxValue * (1 - i / 4)).toLocaleString()}
                    </Text>
                  ))}
                  {/* Expense line */}
                  <Polyline
                    points={chartDays
                      .map((d, i) => {
                        const x = padding + (i / 6) * chartWidth;
                        const y = padding + chartHeight - (d.expense / maxValue) * chartHeight;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke={theme.negative}
                    strokeWidth={2}
                  />
                  {/* Income line */}
                  <Polyline
                    points={chartDays
                      .map((d, i) => {
                        const x = padding + (i / 6) * chartWidth;
                        const y = padding + chartHeight - (d.income / maxValue) * chartHeight;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke={theme.positive}
                    strokeWidth={2}
                  />
                  {/* Points */}
                  {chartDays.map((d, i) => (
                    <View key={d.key}>
                      <Circle
                        cx={20 + (i / 6) * chartWidth}
                        cy={20 + chartHeight - (d.expense / maxValue) * chartHeight}
                        r={3}
                        fill={theme.negative}
                      />
                      <Circle
                        cx={20 + (i / 6) * chartWidth}
                        cy={20 + chartHeight - (d.income / maxValue) * chartHeight}
                        r={3}
                        fill={theme.positive}
                      />
                    </View>
                  ))}
                </Svg>
                <View style={styles.lineLegend}>
                  <View style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: theme.negative }]} />
                    <Text style={{ color: theme.textPrimary, fontSize: 12 }}>Expense</Text>
                    <View style={[styles.legendDot, { backgroundColor: theme.positive }]} />
                    <Text style={{ color: theme.textPrimary, fontSize: 12 }}>Income</Text>
                  </View>
                </View>
              );
          })()}
        </View>
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
  pieContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  pieLegend: {
    flex: 1,
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
