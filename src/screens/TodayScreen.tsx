import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, TIME_GROUP_COLORS } from '../theme/colors';
import { TIME_GROUPS, TIME_GROUP_SUBTITLES, Supplement } from '../database/schema';
import {
  getLogsForDate,
  toggleLog,
  ensureDailyLogs,
  todayDateString,
} from '../database/operations';

type LoggedSupplement = Supplement & { taken: number; log_id: number };

type Section = {
  title: string;
  subtitle: string;
  color: string;
  data: LoggedSupplement[];
};

export default function TodayScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentDate, setCurrentDate] = useState(todayDateString());
  const [totalTaken, setTotalTaken] = useState(0);
  const [totalFiltered, setTotalFiltered] = useState(0);

  // Midnight reset timer
  useEffect(() => {
    const checkMidnight = () => {
      const newDate = todayDateString();
      if (newDate !== currentDate) {
        setCurrentDate(newDate);
        loadData(newDate);
      }
    };
    const interval = setInterval(checkMidnight, 60000); // check every minute
    return () => clearInterval(interval);
  }, [currentDate]);

  useFocusEffect(
    useCallback(() => {
      const date = todayDateString();
      setCurrentDate(date);
      loadData(date);
    }, [])
  );

  const getDayOfWeek = (date: string): number => {
    // Returns 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    const d = new Date(date + 'T00:00:00');
    return d.getDay();
  };

  const isSupplementActiveToday = (supplement: LoggedSupplement, date: string): boolean => {
    if (!supplement.day_restriction) return true;
    const dayOfWeek = getDayOfWeek(date);
    const allowedDays = supplement.day_restriction.split(',').map(Number);
    return allowedDays.includes(dayOfWeek);
  };

  const loadData = async (date: string) => {
    try {
      await ensureDailyLogs(date);
      const logs = await getLogsForDate(date);

      // Filter by day restriction
      const filtered = logs.filter((s) => isSupplementActiveToday(s, date));

      // Group into sections
      const grouped: Record<string, LoggedSupplement[]> = {};
      for (const group of TIME_GROUPS) {
        grouped[group] = [];
      }
      for (const item of filtered) {
        if (item.time_group in grouped) {
          grouped[item.time_group].push(item);
        }
      }

      const sectionData: Section[] = TIME_GROUPS
        .filter((group) => grouped[group].length > 0)
        .map((group) => ({
          title: group,
          subtitle: TIME_GROUP_SUBTITLES[group] ?? '',
          color: TIME_GROUP_COLORS[group] ?? Colors.accent,
          data: grouped[group],
        }));

      setSections(sectionData);
      const taken = filtered.filter((s) => s.taken === 1).length;
      setTotalTaken(taken);
      setTotalFiltered(filtered.length);
    } catch (err) {
      console.error('Failed to load today data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleToggle = async (item: LoggedSupplement) => {
    await toggleLog(item.id, currentDate, item.taken);
    loadData(currentDate);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData(currentDate);
  };

  const progressPercent = totalFiltered > 0 ? (totalTaken / totalFiltered) * 100 : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Today</Text>
          <Text style={styles.headerDate}>{formatDate(currentDate)}</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{totalTaken}/{totalFiltered}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          {progressPercent === 100
            ? '✓ All done!'
            : `${Math.round(progressPercent)}% complete`}
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.id}-${currentDate}`}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <SectionHeader section={section} totalTaken={section.data.filter(d => d.taken).length} />
        )}
        renderItem={({ item }) => (
          <SupplementRow item={item} onToggle={handleToggle} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
          />
        }
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

function SectionHeader({
  section,
  totalTaken,
}: {
  section: Section;
  totalTaken: number;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionAccentBar, { backgroundColor: section.color }]} />
      <View style={styles.sectionHeaderText}>
        <Text style={[styles.sectionTitle, { color: section.color }]}>
          {section.title}
        </Text>
        <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
      </View>
      <Text style={[styles.sectionCount, { color: section.color }]}>
        {totalTaken}/{section.data.length}
      </Text>
    </View>
  );
}

function SupplementRow({
  item,
  onToggle,
}: {
  item: LoggedSupplement;
  onToggle: (item: LoggedSupplement) => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const taken = item.taken === 1;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start(() => onToggle(item));
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.supplementRow, taken && styles.supplementRowTaken]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <View style={[styles.checkbox, taken && styles.checkboxChecked]}>
          {taken && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <View style={styles.supplementInfo}>
          <Text style={[styles.supplementName, taken && styles.supplementNameTaken]}>
            {item.name}
          </Text>
          <Text style={styles.supplementDosage}>{item.dosage}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  progressBadge: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressText: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.card,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  listContent: { paddingBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 6,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionAccentBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
    marginRight: 10,
  },
  sectionHeaderText: { flex: 1 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '400',
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  supplementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 3,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  supplementRowTaken: {
    backgroundColor: Colors.successDim,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    opacity: 0.75,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  supplementInfo: { flex: 1 },
  supplementName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  supplementNameTaken: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  supplementDosage: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
