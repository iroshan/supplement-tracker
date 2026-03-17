import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getAdherenceStats, getMonthlySummary, DaySummary } from '../database/operations';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40 - 24) / 7; // gap adjustment

export default function HistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ currentStreak: 0, bestStreak: 0, thirtyDayAdherence: 0 });
  const [monthlyData, setMonthlyData] = useState<DaySummary[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const s = await getAdherenceStats();
      setStats(s);

      const year = currentMonth.getFullYear();
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
      const data = await getMonthlySummary(`${year}-${month}`);
      setMonthlyData(data);
    } catch (err) {
      console.error('Failed to load history data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const changeMonth = (offset: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
    const daysInMonth = monthlyData.length;

    const days = [];
    // Padding for start of month
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<View key={`pad-${i}`} style={styles.calendarDayEmpty} />);
    }

    // Actual days
    monthlyData.forEach((day, index) => {
        const isFuture = new Date(day.date).getTime() > new Date().getTime();
        const completion = day.expectedCount > 0 ? day.takenCount / day.expectedCount : 0;
        
        let bgColor = Colors.card;
        let borderColor = Colors.border;
        
        if (!isFuture && day.expectedCount > 0) {
            if (completion === 1) {
                bgColor = Colors.accent;
                borderColor = Colors.accent;
            } else if (completion > 0) {
                bgColor = Colors.accentGlow;
                borderColor = Colors.accentDim;
            }
        }

        days.push(
            <View key={day.date} style={[styles.calendarDay, { backgroundColor: bgColor, borderColor }]}>
                <Text style={[
                    styles.dayNumber, 
                    completion === 1 && { color: '#fff' },
                    completion > 0 && completion < 1 && { color: Colors.accent }
                ]}>
                    {index + 1}
                </Text>
            </View>
        );
    });

    return <View style={styles.calendarGrid}>{days}</View>;
  };

  if (loading && monthlyData.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Usage patterns &amp; streaks</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard 
            label="Streak" 
            value={`${stats.currentStreak}d`} 
            icon="flame" 
            iconColor="#FF9F0A" 
          />
          <StatCard 
            label="Best" 
            value={`${stats.bestStreak}d`} 
            icon="trophy" 
            iconColor="#FFD60A" 
          />
          <StatCard 
            label="Adherence" 
            value={`${stats.thirtyDayAdherence}%`} 
            icon="pie-chart" 
            iconColor={Colors.accent} 
          />
        </View>

        {/* Calendar Card */}
        <View style={styles.card}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{monthName}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekLabels}>
            {['S','M','T','W','T','F','S'].map((d, i) => (
                <Text key={i} style={styles.weekLabel}>{d}</Text>
            ))}
          </View>

          {renderCalendar()}

          <View style={styles.legend}>
            <LegendItem color={Colors.accent} label="Full" />
            <LegendItem color={Colors.accentGlow} label="Partial" />
            <LegendItem color={Colors.card} label="None" />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.infoText}>
                Consistency is key. A "Full" day means 100% of your scheduled supplements were taken.
            </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, iconColor }: { label: string, value: string, icon: any, iconColor: string }) {
  return (
    <View style={styles.statCard}>
        <Ionicons name={icon} size={20} color={iconColor} style={{ marginBottom: 4 }} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  weekLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  weekLabel: {
    width: COLUMN_WIDTH,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'flex-start',
  },
  calendarDay: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  calendarDayEmpty: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legendLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
