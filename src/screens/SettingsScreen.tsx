import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { exportAllData, importAllData } from '../database/operations';

export default function SettingsScreen() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const json = await exportAllData();
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `supplement-protocol-${timestamp}.json`;

      // Use expo-file-system v18 OOP API
      const file = new File(Paths.document, fileName);
      file.write(json);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Supplement Protocol',
        });
      } else {
        Alert.alert('Exported', `Saved to: ${file.uri}`);
      }
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message ?? 'Unknown error');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const pickedUri = result.assets[0].uri;
      const file = new File(pickedUri);
      const json = await file.text();

      Alert.alert(
        'Import Data',
        'This will replace ALL current supplements and history. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              try {
                setImporting(true);
                await importAllData(json);
                Alert.alert('Success', 'Protocol imported successfully!');
              } catch (err: any) {
                Alert.alert('Import Failed', err?.message ?? 'Invalid file format');
              } finally {
                setImporting(false);
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Import Failed', err?.message ?? 'Could not read file');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Data management &amp; app info</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Data Section */}
        <Text style={styles.sectionLabel}>DATA</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="download-outline"
            iconColor={Colors.cyan}
            title="Export Protocol"
            description="Save supplements &amp; history as JSON"
            onPress={handleExport}
            loading={exporting}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="cloud-upload-outline"
            iconColor={Colors.violet}
            title="Import Protocol"
            description="Restore from a JSON backup file"
            onPress={handleImport}
            loading={importing}
            destructive
          />
        </View>

        {/* Info Section */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>ABOUT</Text>
        <View style={styles.card}>
          <InfoRow label="Version" value="1.0.0" />
          <View style={styles.divider} />
          <InfoRow label="Storage" value="100% offline · SQLite" />
          <View style={styles.divider} />
          <InfoRow label="Supplements" value="27 protocols" />
        </View>

        {/* Note */}
        <View style={styles.noteCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color={Colors.success} />
          <Text style={styles.noteText}>
            All data is stored locally on this device. No internet connection required.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({
  icon,
  iconColor,
  title,
  description,
  onPress,
  loading,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  description: string;
  onPress: () => void;
  loading?: boolean;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.settingsRow}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.settingsRowText}>
        <Text style={[styles.settingsRowTitle, destructive && styles.destructiveText]}>
          {title}
        </Text>
        <Text style={styles.settingsRowDesc}>{description}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.accent} />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 56,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsRowText: { flex: 1 },
  settingsRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  settingsRowDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  destructiveText: { color: Colors.danger },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.successDim,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
