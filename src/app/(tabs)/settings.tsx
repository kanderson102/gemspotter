import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS } from '../../constants/theme';
import {
  Trash2,
  ShieldAlert,
  Terminal,
  Smartphone,
  Cpu,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const { resetAllData } = useApp();

  const handleResetData = () => {
    Alert.alert(
      'Reset Local Data',
      'This will erase your inventory ledger and scan history. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Ledger & History',
          style: 'destructive',
          onPress: () => {
            resetAllData();
            Alert.alert('Reset Complete', 'App state has been reset to defaults.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>CONFIGURATION & PACKAGING</Text>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Info Box */}
        <View style={styles.infoCard}>
          <Cpu color={COLORS.accentCyan} size={20} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Open-Source & Free Utility</Text>
            <Text style={styles.infoDesc}>
              This is your personal, forever-free sourcing companion. No subscriptions, logins, or credits are required.
            </Text>
          </View>
        </View>

        {/* Packaging Guide */}
        <Text style={styles.sectionHeader}>How to Package & Install (EAS Build)</Text>
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>1. Install EAS CLI</Text>
          <Text style={styles.guideDesc}>
            Install the Expo Application Services command-line tool globally:
          </Text>
          <View style={styles.codeBox}>
            <Terminal color={COLORS.accentCyan} size={14} />
            <Text style={styles.codeText}>npm install -g eas-cli</Text>
          </View>

          <Text style={styles.guideTitle}>2. Login to Expo Account</Text>
          <Text style={styles.guideDesc}>
            Create a free account on expo.dev and log in locally:
          </Text>
          <View style={styles.codeBox}>
            <Terminal color={COLORS.accentCyan} size={14} />
            <Text style={styles.codeText}>eas login</Text>
          </View>

          <Text style={styles.guideTitle}>3. Configure Project</Text>
          <Text style={styles.guideDesc}>
            Initialize the project EAS configuration:
          </Text>
          <View style={styles.codeBox}>
            <Terminal color={COLORS.accentCyan} size={14} />
            <Text style={styles.codeText}>eas build:configure</Text>
          </View>

          <Text style={styles.guideTitle}>4. Compile Standalone Builds</Text>
          <Text style={styles.guideDesc}>
            Trigger Expo to build APK or iOS binaries:
          </Text>
          <View style={[styles.codeBox, { flexDirection: 'column', alignItems: 'flex-start', gap: 6 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Smartphone color={COLORS.accentCyan} size={14} />
              <Text style={styles.codeText}># Build Android APK (Preview)</Text>
            </View>
            <Text style={[styles.codeText, { paddingLeft: 22, color: 'white' }]}>
              eas build --platform android --profile preview
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <Smartphone color={COLORS.accentCyan} size={14} />
              <Text style={styles.codeText}># Build iOS Simulator / AdHoc</Text>
            </View>
            <Text style={[styles.codeText, { paddingLeft: 22, color: 'white' }]}>
              eas build --platform ios --profile preview
            </Text>
          </View>
        </View>

        {/* Debug Controls */}
        <Text style={styles.sectionHeader}>Developer Controls</Text>
        <View style={styles.debugCard}>
          <View style={styles.debugHeader}>
            <ShieldAlert color={COLORS.accentRose} size={16} />
            <Text style={styles.debugTitle}>Local Storage Diagnostics</Text>
          </View>
          <Text style={styles.debugDesc}>
            Clear all saved state from AsyncStorage. This restores the database to initial seed data.
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleResetData}>
            <Trash2 color="white" size={14} />
            <Text style={styles.resetBtnText}>Clear AsyncStorage Data</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
  },
  title: {
    color: COLORS.textPrimary,
    fontFamily: 'Outfit',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.accentCyan,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 240, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    color: COLORS.accentCyan,
    fontSize: 14,
    fontWeight: '700',
  },
  infoDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  sectionHeader: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  guideCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  guideTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  guideDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 7, 12, 0.6)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginBottom: 10,
  },
  codeText: {
    color: COLORS.textSecondary,
    fontFamily: 'Courier',
    fontSize: 11,
    fontWeight: '600',
  },
  debugCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  debugTitle: {
    color: COLORS.accentRose,
    fontSize: 13,
    fontWeight: '700',
  },
  debugDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 14,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentRose,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  resetBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
});
