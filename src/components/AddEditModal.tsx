import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { TIME_GROUPS, TIME_GROUP_SUBTITLES, Supplement } from '../database/schema';
import { addSupplement, updateSupplement } from '../database/operations';

interface Props {
  visible: boolean;
  supplement: Supplement | null;
  onClose: () => void;
}

export default function AddEditModal({ visible, supplement, onClose }: Props) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [timeGroup, setTimeGroup] = useState<string>(TIME_GROUPS[0]);
  const [dayRestriction, setDayRestriction] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (supplement) {
      setName(supplement.name);
      setDosage(supplement.dosage);
      setTimeGroup(supplement.time_group);
      setDayRestriction(supplement.day_restriction);
    } else {
      setName('');
      setDosage('');
      setTimeGroup(TIME_GROUPS[0]);
      setDayRestriction(null);
    }
  }, [supplement, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter a supplement name.');
      return;
    }
    try {
      setSaving(true);
      if (supplement) {
        await updateSupplement(supplement.id, name.trim(), dosage.trim(), timeGroup, dayRestriction);
      } else {
        await addSupplement(name.trim(), dosage.trim(), timeGroup, dayRestriction);
      }
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to save supplement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {supplement ? 'Edit Supplement' : 'Add Supplement'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            disabled={saving}
          >
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Name */}
          <Text style={styles.fieldLabel}>NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Vitamin D3"
            placeholderTextColor={Colors.textMuted}
            autoFocus
          />

          {/* Dosage */}
          <Text style={styles.fieldLabel}>DOSAGE</Text>
          <TextInput
            style={styles.input}
            value={dosage}
            onChangeText={setDosage}
            placeholder="e.g. 1000mg (1 tablet)"
            placeholderTextColor={Colors.textMuted}
          />

          {/* Time Group */}
          <Text style={styles.fieldLabel}>TIME OF DAY</Text>
          <View style={styles.pickerContainer}>
            {TIME_GROUPS.map((group) => (
              <TouchableOpacity
                key={group}
                style={[
                  styles.timeGroupOption,
                  timeGroup === group && styles.timeGroupOptionSelected,
                ]}
                onPress={() => setTimeGroup(group)}
              >
                <Text
                  style={[
                    styles.timeGroupOptionText,
                    timeGroup === group && styles.timeGroupOptionTextSelected,
                  ]}
                >
                  {group}
                </Text>
                <Text style={styles.timeGroupSubtext}>
                  {TIME_GROUP_SUBTITLES[group]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Day restriction */}
          <Text style={styles.fieldLabel}>SCHEDULE</Text>
          <View style={styles.scheduleRow}>
            <TouchableOpacity
              style={[styles.scheduleOption, !dayRestriction && styles.scheduleOptionSelected]}
              onPress={() => setDayRestriction(null)}
            >
              <Ionicons
                name={!dayRestriction ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={!dayRestriction ? Colors.accent : Colors.textMuted}
              />
              <Text style={styles.scheduleOptionText}>Every day</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scheduleOption, dayRestriction === '1,3,5' && styles.scheduleOptionSelected]}
              onPress={() => setDayRestriction('1,3,5')}
            >
              <Ionicons
                name={dayRestriction === '1,3,5' ? 'radio-button-on' : 'radio-button-off'}
                size={18}
                color={dayRestriction === '1,3,5' ? Colors.accent : Colors.textMuted}
              />
              <Text style={styles.scheduleOptionText}>Mon / Wed / Fri only</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cancelBtn: { padding: 4 },
  cancelText: { color: Colors.textSecondary, fontSize: 16 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 60 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerContainer: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  timeGroupOption: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  timeGroupOptionSelected: {
    backgroundColor: Colors.accentGlow,
  },
  timeGroupOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  timeGroupOptionTextSelected: {
    color: Colors.accent,
  },
  timeGroupSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  scheduleRow: { gap: 8 },
  scheduleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scheduleOptionSelected: {
    borderColor: Colors.accentDim,
    backgroundColor: Colors.accentGlow,
  },
  scheduleOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
});
