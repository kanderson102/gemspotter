import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  ActivityIndicator,
  Clipboard,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS } from '../../constants/theme';
import {
  Trash2,
  ShieldAlert,
  Terminal,
  Smartphone,
  Cpu,
  Key,
  Database,
  Sparkles,
  ShoppingBag,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react-native';
import { testSupabaseConnection } from '../../services/supabaseService';

export default function SettingsScreen() {
  const {
    resetAllData,
    openAiApiKey,
    setOpenAiApiKey,
    ebayClientId,
    setEbayClientId,
    ebayClientSecret,
    setEbayClientSecret,
    photoroomApiKey,
    setPhotoroomApiKey,
    supabaseUrl,
    setSupabaseUrl,
    supabaseAnonKey,
    setSupabaseAnonKey,
    isLiveMode,
    setIsLiveMode,
    syncLedger,
  } = useApp();

  // Password visibility flags
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showEbaySec, setShowEbaySec] = useState(false);
  const [showPhotoroom, setShowPhotoroom] = useState(false);
  const [showSupaKey, setShowSupaKey] = useState(false);

  // Connection testing state
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);

  const SQL_SCHEMA = `-- 1. Create Inventory Table
create table inventory (
  id text primary key,
  title text not null,
  category text,
  cogs numeric,
  weight_class text,
  description text,
  suggested_title text,
  suggested_description text,
  tags text,
  image_url text,
  status text,
  created_at timestamp with time zone,
  sold_price numeric,
  shipping_cost numeric
);

-- 2. Create Scan History Table
create table history (
  id text primary key,
  scanned_at timestamp with time zone,
  item_title text,
  item_category text,
  item_image_url text,
  item_raw_data text
);`;

  const handleCopySql = () => {
    Clipboard.setString(SQL_SCHEMA);
    Alert.alert('SQL Copied!', 'The Supabase database setup script has been copied to your clipboard. Paste it in your Supabase SQL Editor and run it.');
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const result = await testSupabaseConnection(supabaseUrl, supabaseAnonKey);
      setConnectionStatus(result);
    } catch (e: any) {
      setConnectionStatus({ success: false, message: e.message || 'Unknown network error' });
    } finally {
      setTestingConnection(false);
    }
  };

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

        {/* API Credentials Card */}
        <Text style={styles.sectionHeader}>API & Integration Keys</Text>
        <View style={styles.configCard}>
          {/* Live mode toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>Live Production Mode</Text>
              <Text style={styles.toggleDesc}>
                {isLiveMode ? 'Using real APIs. Rates & credits will apply.' : 'Simulated / Offline mode. Free & simulated data.'}
              </Text>
            </View>
            <Switch
              value={isLiveMode}
              onValueChange={setIsLiveMode}
              trackColor={{ false: '#1e293b', true: COLORS.accentCyan }}
              thumbColor={isLiveMode ? COLORS.bgDeep : '#64748b'}
            />
          </View>

          {isLiveMode && (
            <View style={styles.formContainer}>
              {/* OpenAI Section */}
              <View style={styles.fieldSection}>
                <View style={styles.fieldHeader}>
                  <Sparkles color={COLORS.accentPurple} size={14} />
                  <Text style={styles.fieldSectionTitle}>OpenAI API (Vision & SEO)</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.fieldInput}
                    value={openAiApiKey}
                    onChangeText={setOpenAiApiKey}
                    placeholder="sk-proj-..."
                    placeholderTextColor={COLORS.textDark}
                    secureTextEntry={!showOpenAi}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowOpenAi(!showOpenAi)} style={styles.eyeBtn}>
                    {showOpenAi ? <EyeOff color={COLORS.textSecondary} size={16} /> : <Eye color={COLORS.textSecondary} size={16} />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* eBay Section */}
              <View style={styles.fieldSection}>
                <View style={styles.fieldHeader}>
                  <ShoppingBag color={COLORS.accentCyan} size={14} />
                  <Text style={styles.fieldSectionTitle}>eBay App credentials (Browse Comps)</Text>
                </View>
                <TextInput
                  style={styles.fieldInput}
                  value={ebayClientId}
                  onChangeText={setEbayClientId}
                  placeholder="eBay App ID (Client ID)"
                  placeholderTextColor={COLORS.textDark}
                  autoCapitalize="none"
                />
                <View style={[styles.inputWrapper, { marginTop: 6 }]}>
                  <TextInput
                    style={styles.fieldInput}
                    value={ebayClientSecret}
                    onChangeText={setEbayClientSecret}
                    placeholder="eBay Cert ID (Client Secret)"
                    placeholderTextColor={COLORS.textDark}
                    secureTextEntry={!showEbaySec}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowEbaySec(!showEbaySec)} style={styles.eyeBtn}>
                    {showEbaySec ? <EyeOff color={COLORS.textSecondary} size={16} /> : <Eye color={COLORS.textSecondary} size={16} />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Photoroom Section */}
              <View style={styles.fieldSection}>
                <View style={styles.fieldHeader}>
                  <Key color={COLORS.accentPurple} size={14} />
                  <Text style={styles.fieldSectionTitle}>Photoroom API (Background Removal)</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.fieldInput}
                    value={photoroomApiKey}
                    onChangeText={setPhotoroomApiKey}
                    placeholder="Photoroom API Key"
                    placeholderTextColor={COLORS.textDark}
                    secureTextEntry={!showPhotoroom}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPhotoroom(!showPhotoroom)} style={styles.eyeBtn}>
                    {showPhotoroom ? <EyeOff color={COLORS.textSecondary} size={16} /> : <Eye color={COLORS.textSecondary} size={16} />}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Supabase Section */}
              <View style={styles.fieldSection}>
                <View style={styles.fieldHeader}>
                  <Database color={COLORS.accentEmerald} size={14} />
                  <Text style={styles.fieldSectionTitle}>Supabase Cloud DB & Sync</Text>
                </View>
                <TextInput
                  style={styles.fieldInput}
                  value={supabaseUrl}
                  onChangeText={setSupabaseUrl}
                  placeholder="https://your-project.supabase.co"
                  placeholderTextColor={COLORS.textDark}
                  autoCapitalize="none"
                />
                <View style={[styles.inputWrapper, { marginTop: 6 }]}>
                  <TextInput
                    style={styles.fieldInput}
                    value={supabaseAnonKey}
                    onChangeText={setSupabaseAnonKey}
                    placeholder="Supabase Anon Key"
                    placeholderTextColor={COLORS.textDark}
                    secureTextEntry={!showSupaKey}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowSupaKey(!showSupaKey)} style={styles.eyeBtn}>
                    {showSupaKey ? <EyeOff color={COLORS.textSecondary} size={16} /> : <Eye color={COLORS.textSecondary} size={16} />}
                  </TouchableOpacity>
                </View>

                {/* Connection check */}
                <TouchableOpacity
                  style={[styles.testBtn, (testingConnection || !supabaseUrl) && styles.testBtnDisabled]}
                  onPress={handleTestConnection}
                  disabled={testingConnection || !supabaseUrl}
                >
                  {testingConnection ? (
                    <ActivityIndicator color={COLORS.bgDeep} size="small" />
                  ) : (
                    <Text style={styles.testBtnText}>Test Supabase Connection</Text>
                  )}
                </TouchableOpacity>

                {/* SQL setup copy helper */}
                <TouchableOpacity
                  style={[styles.testBtn, { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: COLORS.borderCard }]}
                  onPress={handleCopySql}
                >
                  <Text style={[styles.testBtnText, { color: 'white' }]}>Copy Supabase SQL Setup</Text>
                </TouchableOpacity>

                {connectionStatus && (
                  <View style={[styles.statusBox, connectionStatus.success ? styles.statusSuccess : styles.statusFailed]}>
                    <AlertCircle color={connectionStatus.success ? COLORS.accentEmerald : COLORS.accentRose} size={14} />
                    <Text style={[styles.statusText, connectionStatus.success ? { color: COLORS.accentEmerald } : { color: COLORS.accentRose }]}>
                      {connectionStatus.message}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
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

          <Text style={styles.guideTitle}>4. Compile Standalone Build</Text>
          <Text style={styles.guideDesc}>
            Trigger Expo cloud compilers to build an installable Android APK:
          </Text>
          <View style={[styles.codeBox, { flexDirection: 'column', alignItems: 'flex-start', gap: 6 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Smartphone color={COLORS.accentCyan} size={14} />
              <Text style={styles.codeText}># Build Android APK (Preview)</Text>
            </View>
            <Text style={[styles.codeText, { paddingLeft: 22, color: 'white' }]}>
              eas build --platform android --profile preview
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
  configCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 10,
  },
  toggleLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleDesc: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  formContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    paddingTop: 16,
    gap: 16,
  },
  fieldSection: {
    gap: 6,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldSectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: 'rgba(5, 7, 12, 0.5)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: 'white',
    fontSize: 13,
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
  },
  testBtn: {
    backgroundColor: COLORS.accentCyan,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  testBtnDisabled: {
    opacity: 0.5,
  },
  testBtnText: {
    color: COLORS.bgDeep,
    fontWeight: '700',
    fontSize: 12,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 0.5,
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusFailed: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.2)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
});
