import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { useStore } from '../store/useStore';
import { getInsights } from '../lib/insights';

function InsightsScreen() {
  const { theme } = useTheme();
  const { transactions, categories } = useStore();

  const {
    totalSpent, totalIncome, allTimeCategoryRows, allTimeSpent, spentThroughToday, dailyAverageDays, modeRows, days, chartDays, monthDays,
    weekSpent, maxDay, maxMonthDay, maxValue, avgExpensePerDay, avgExpensePerCategory,
  } = getInsights(transactions, categories);

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
            ₹{weekSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })} this week
          </Text>
        </View>

        {/* Monthly expenses chart */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>This month (daily)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={[styles.chart, { width: monthDays.length * 24 }]}>
              {monthDays.map((d) => (
                <View key={d.key} style={styles.barWrap}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max((d.value / maxMonthDay) * 100, d.value > 0 ? 4 : 1),
                        backgroundColor: d.value > 0 ? theme.accent : theme.track,
                      },
                    ]}
                  />
                  <Text style={[styles.barLabel, { color: theme.textSecondary }]}>{d.label}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <Text style={[styles.footnote, { color: theme.textSecondary }]}>
            ₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })} this month
          </Text>
        </View>

        {/* Averages */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>This month: averages</Text>
          <View style={styles.averagesRow}>
            <View style={styles.avgItem}>
              <Text style={[styles.avgLabel, { color: theme.textSecondary }]}>Avg / day</Text>
              <Text style={[styles.avgValue, { color: theme.textPrimary }]}>
                ₹{avgExpensePerDay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.avgItem}>
              <Text style={[styles.avgLabel, { color: theme.textSecondary }]}>Avg / category</Text>
              <Text style={[styles.avgValue, { color: theme.textPrimary }]}>
                ₹{Math.round(avgExpensePerCategory).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
          <Text style={[styles.footnote, { color: theme.textSecondary }]}>
            Daily average: ₹{spentThroughToday.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ÷ {dailyAverageDays} calendar day{dailyAverageDays === 1 ? '' : 's'} elapsed this month. Includes days with no spending.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Spending by category · All time</Text>
          {allTimeCategoryRows.length === 0 ? (
            <Text style={{ color: theme.textTertiary, paddingVertical: 8 }}>No recorded expenses yet.</Text>
          ) : (
            <View style={styles.pieContainer}>
              <Svg width={160} height={160} viewBox="0 0 42 42">
                {(() => {
                  let cumulativePercent = 0;
                  return allTimeCategoryRows.map(({ id, category, amount }) => {
                    const percent = allTimeSpent > 0 ? (amount / allTimeSpent) * 100 : 0;
                    if (percent >= 99.999) {
                      cumulativePercent += percent;
                      return <Circle key={id} cx={21} cy={21} r={15} fill={category?.color || theme.accent} />;
                    }
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
                        key={id}
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
                {allTimeCategoryRows.map(({ id, category, amount }) => (
                  <View key={id} style={styles.legendRow}>
                    <View style={[styles.legendDot, { backgroundColor: category?.color || theme.accent }]} />
                    <Text style={{ color: theme.textPrimary, fontSize: 12, flex: 1 }}>
                      {category?.name ?? 'Uncategorised'}
                    </Text>
                    <Text style={{ color: theme.textTertiary, fontSize: 12 }}>
                      {allTimeSpent > 0 ? Math.round((amount / allTimeSpent) * 100) : 0}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          {allTimeSpent > 0 && <Text style={[styles.footnote, { color: theme.textSecondary }]}>
            ₹{allTimeSpent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} across all recorded expenses
          </Text>}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Expense vs Income (7 days)</Text>
          {(() => {
            return (
              <View style={styles.lineChartContainer}>
                <Svg width="100%" height={120} viewBox="0 0 320 120">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Line
                      key={`grid-${i}`}
                      x1={20}
                      y1={20 + (80 / 4) * i}
                      x2={300}
                      y2={20 + (80 / 4) * i}
                      stroke={theme.border}
                      strokeWidth={0.5}
                      strokeDasharray="4 4"
                    />
                  ))}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <SvgText
                      key={`yl-${i}`}
                      x={15}
                      y={20 + (80 / 4) * i}
                      textAnchor="end"
                      fontSize={8}
                      fill={theme.textTertiary}
                      alignmentBaseline="middle"
                    >
                      {i === 0 ? Math.round(maxValue).toLocaleString() : i === 4 ? '0' : Math.round(maxValue * (1 - i / 4)).toLocaleString()}
                    </SvgText>
                  ))}
                  <Polyline
                    key="expense-line"
                    points={chartDays.map((d, i) => {
                      const x = 20 + (i / 6) * 280;
                      const y = 20 + 80 - (d.expense / maxValue) * 80;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke={theme.negative}
                    strokeWidth={2}
                  />
                  <Polyline
                    key="income-line"
                    points={chartDays.map((d, i) => {
                      const x = 20 + (i / 6) * 280;
                      const y = 20 + 80 - (d.income / maxValue) * 80;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke={theme.positive}
                    strokeWidth={2}
                  />
                  {chartDays.map((d, i) => (
                    <React.Fragment key={d.key}>
                      <Circle
                        key={`expense-dot-${d.key}`}
                        cx={20 + (i / 6) * 280}
                        cy={20 + 80 - (d.expense / maxValue) * 80}
                        r={3}
                        fill={theme.negative}
                      />
                      <Circle
                        key={`income-dot-${d.key}`}
                        cx={20 + (i / 6) * 280}
                        cy={20 + 80 - (d.income / maxValue) * 80}
                        r={3}
                        fill={theme.positive}
                      />
                    </React.Fragment>
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
              </View>
            );
          })()}
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
  lineChartContainer: {
    marginTop: 8,
  },
  lineLegend: {
    marginTop: 8,
    alignItems: 'center',
  },
  averagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  avgItem: {
    alignItems: 'center',
  },
  avgLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  avgValue: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});

export default InsightsScreen;