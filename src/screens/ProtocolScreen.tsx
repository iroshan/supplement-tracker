import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, TIME_GROUP_COLORS } from '../theme/colors';
import { TIME_GROUPS, TIME_GROUP_SUBTITLES, Supplement } from '../database/schema';
import {
  getAllSupplements,
  deleteSupplement,
} from '../database/operations';
import AddEditModal from '../components/AddEditModal';

type Section = {
  title: string;
  color: string;
  data: Supplement[];
};

export default function ProtocolScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSupplement, setEditingSupplement] = useState<Supplement | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadSupplements();
    }, [])
  );

  const loadSupplements = async () => {
    try {
      const supplements = await getAllSupplements();
      const grouped: Record<string, Supplement[]> = {};
      for (const group of TIME_GROUPS) {
        grouped[group] = [];
      }
      for (const item of supplements) {
        if (item.time_group in grouped) {
          grouped[item.time_group].push(item);
        }
      }
      const sectionData: Section[] = TIME_GROUPS
        .filter((g) => grouped[g].length > 0)
        .map((g) => ({
          title: g,
          color: TIME_GROUP_COLORS[g] ?? Colors.accent,
          data: grouped[g],
        }));
      setSections(sectionData);
    } catch (err) {
      console.error('Failed to load supplements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplement: Supplement) => {
    setEditingSupplement(supplement);
    setModalVisible(true);
  };

  const handleDelete = (supplement: Supplement) => {
    Alert.alert(
      'Delete Supplement',
      `Remove "${supplement.name}" from your protocol?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSupplement(supplement.id);
            loadSupplements();
          },
        },
      ]
    );
  };

  const handleAdd = () => {
    setEditingSupplement(null);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingSupplement(null);
    loadSupplements();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.accent} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Protocol</Text>
          <Text style={styles.headerSubtitle}>Manage your supplement schedule</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
            <Text style={[styles.sectionTitle, { color: section.color }]}>
              {section.title}
            </Text>
            <Text style={styles.sectionCount}>{section.data.length} items</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <ProtocolRow
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        stickySectionHeadersEnabled={false}
      />

      <AddEditModal
        visible={modalVisible}
        supplement={editingSupplement}
        onClose={handleModalClose}
      />
    </SafeAreaView>
  );
}

function ProtocolRow({
  item,
  onEdit,
  onDelete,
}: {
  item: Supplement;
  onEdit: (s: Supplement) => void;
  onDelete: (s: Supplement) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowDosage}>{item.dosage}</Text>
        {item.day_restriction && (
          <View style={styles.dayRestrictionBadge}>
            <Ionicons name="calendar-outline" size={10} color={Colors.warning} />
            <Text style={styles.dayRestrictionText}>Mon / Wed / Fri</Text>
          </View>
        )}
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onEdit(item)}
        >
          <Ionicons name="pencil-outline" size={18} color={Colors.accent} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => onDelete(item)}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>
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
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  listContent: { paddingBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 6,
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  row: {
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
  rowInfo: { flex: 1 },
  rowName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  rowDosage: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dayRestrictionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dayRestrictionText: {
    fontSize: 10,
    color: Colors.warning,
    fontWeight: '600',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: Colors.dangerDim,
  },
});
