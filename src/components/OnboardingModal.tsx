import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Linking,
  SafeAreaView,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Sparkles, ShoppingBag, Database, Key, ChevronRight, ChevronLeft, Check, Shield } from 'lucide-react-native';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: (config: {
    openAiApiKey: string;
    ebayClientId: string;
    ebayClientSecret: string;
    photoroomApiKey: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    isLiveMode: boolean;
  }) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ visible, onComplete }) => {
  const [step, setStep] = useState(1);

  // Key configurations state
  const [openAiKey, setOpenAiKey] = useState('');
  const [ebayId, setEbayId] = useState('');
  const [ebaySecret, setEbaySecret] = useState('');
  const [photoroomKey, setPhotoroomKey] = useState('');
  const [supaUrl, setSupaUrl] = useState('');
  const [supaKey, setSupaKey] = useState('');
  const [liveMode, setLiveMode] = useState(false);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      onComplete({
        openAiApiKey: openAiKey,
        ebayClientId: ebayId,
        ebayClientSecret: ebaySecret,
        photoroomApiKey: photoroomKey,
        supabaseUrl: supaUrl,
        supabaseAnonKey: supaKey,
        isLiveMode: liveMode,
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* Progress Bar */}
        <View style={styles.progressBarRow}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                s <= step ? styles.progressDotActive : styles.progressDotInactive,
              ]}
            />
          ))}
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {step === 1 && (
            <View style={styles.slide}>
              <Text style={styles.title}>GEMSPOTTER</Text>
              <Text style={styles.subtitle}>YOUR PRIVATE SOURCING COMPANION</Text>
              
              <View style={styles.card}>
                <Shield color={COLORS.accentCyan} size={32} style={styles.slideIcon} />
                <Text style={styles.cardHeading}>100% Private & Decentralized</Text>
                <Text style={styles.cardDesc}>
                  Gemspotter stores your data and keys locally on your device. Your sourcing history is yours alone. No subscriptions, logins, or trackers are required.
                </Text>
              </View>

              <View style={styles.featureRow}>
                <Sparkles color={COLORS.accentPurple} size={20} />
                <View>
                  <Text style={styles.featureTitle}>AI Image Sourcing</Text>
                  <Text style={styles.featureDesc}>Snap thrift items to identify them instantly using Vision models.</Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <ShoppingBag color={COLORS.accentCyan} size={20} />
                <View>
                  <Text style={styles.featureTitle}>Smart Comps Ledger</Text>
                  <Text style={styles.featureDesc}>Analyze eBay sold listings, calculate category fees, and log profits.</Text>
                </View>
              </View>

              <View style={styles.guideCard}>
                <Text style={styles.guideText}>
                  To enable live real-time comps and AI features, you will need to input your own API credentials. Otherwise, the app operates in Simulated Mode.
                </Text>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.slide}>
              <Text style={styles.sectionHeader}>AI & Media Isolation</Text>
              <Text style={styles.sectionDesc}>Set up OpenAI and Photoroom to enable image analysis and studio background removals.</Text>

              {/* OpenAI Key */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>OPENAI API KEY</Text>
                  <TouchableOpacity onPress={() => Linking.openURL('https://platform.openai.com/api-keys')}>
                    <Text style={styles.linkLabel}>Get Key ↗</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={openAiKey}
                  onChangeText={setOpenAiKey}
                  placeholder="sk-proj-..."
                  placeholderTextColor={COLORS.textDark}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Text style={styles.fieldHelp}>Used for GPT-4o Vision image scans and SEO listing draft generation.</Text>
              </View>

              {/* Photoroom Key */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>PHOTOROOM API KEY</Text>
                  <TouchableOpacity onPress={() => Linking.openURL('https://www.photoroom.com/api/')}>
                    <Text style={styles.linkLabel}>Get Key ↗</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={photoroomKey}
                  onChangeText={setPhotoroomKey}
                  placeholder="Photoroom API Key"
                  placeholderTextColor={COLORS.textDark}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Text style={styles.fieldHelp}>Isolates backgrounds of captured photos for clean marketplace drafts.</Text>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.slide}>
              <Text style={styles.sectionHeader}>Market Comps & Sync</Text>
              <Text style={styles.sectionDesc}>Set up eBay search APIs and cloud databases to backup your sourcing ledger.</Text>

              {/* eBay Credentials */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>EBAY APP ID (CLIENT ID)</Text>
                  <TouchableOpacity onPress={() => Linking.openURL('https://developer.ebay.com/')}>
                    <Text style={styles.linkLabel}>Developer Portal ↗</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={ebayId}
                  onChangeText={setEbayId}
                  placeholder="eBay App ID"
                  placeholderTextColor={COLORS.textDark}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EBAY CERT ID (CLIENT SECRET)</Text>
                <TextInput
                  style={styles.textInput}
                  value={ebaySecret}
                  onChangeText={setEbaySecret}
                  placeholder="eBay Cert ID"
                  placeholderTextColor={COLORS.textDark}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Text style={styles.fieldHelp}>Queries the Browse API search for real sold comps.</Text>
              </View>

              {/* Supabase credentials */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>SUPABASE URL</Text>
                  <TouchableOpacity onPress={() => Linking.openURL('https://supabase.com/')}>
                    <Text style={styles.linkLabel}>Get DB ↗</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.textInput}
                  value={supaUrl}
                  onChangeText={setSupaUrl}
                  placeholder="https://your-project.supabase.co"
                  placeholderTextColor={COLORS.textDark}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>SUPABASE ANON KEY</Text>
                <TextInput
                  style={styles.textInput}
                  value={supaKey}
                  onChangeText={setSupaKey}
                  placeholder="Supabase Anon Key"
                  placeholderTextColor={COLORS.textDark}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Text style={styles.fieldHelp}>Syncs local async history/inventory records to remote cloud servers.</Text>
              </View>
            </View>
          )}

          {step === 4 && (
            <View style={styles.slide}>
              <Text style={styles.title}>All Set!</Text>
              <Text style={styles.subtitle}>READY TO SPOT GEMS</Text>

              <View style={styles.configCard}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextCol}>
                    <Text style={styles.toggleLabel}>Live Production Mode</Text>
                    <Text style={styles.toggleDesc}>
                      Enable to call your configured API endpoints. Disable to remain in simulated offline mode.
                    </Text>
                  </View>
                  <Switch
                    value={liveMode}
                    onValueChange={setLiveMode}
                    trackColor={{ false: '#1e293b', true: COLORS.accentCyan }}
                    thumbColor={liveMode ? COLORS.bgDeep : '#64748b'}
                  />
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardHeading}>Security Notice</Text>
                <Text style={styles.cardDesc}>
                  Your API credentials are saved directly to your phone's secure storage. They are never transmitted to any third party besides the direct API endpoints (OpenAI, eBay, Photoroom, Supabase).
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          {step > 1 ? (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <ChevronLeft color="white" size={18} />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 80 }} />
          )}

          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {step === 4 ? 'Get Started' : 'Next'}
            </Text>
            {step < 4 ? <ChevronRight color={COLORS.bgDeep} size={18} /> : <Check color={COLORS.bgDeep} size={18} />}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  progressBarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
    paddingHorizontal: 24,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressDotActive: {
    backgroundColor: COLORS.accentCyan,
  },
  progressDotInactive: {
    backgroundColor: COLORS.borderCard,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  slide: {
    gap: 20,
  },
  title: {
    color: COLORS.textPrimary,
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: 1,
  },
  subtitle: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: -10,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  slideIcon: {
    marginBottom: 4,
  },
  cardHeading: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  featureTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  featureDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
    paddingRight: 20,
  },
  guideCard: {
    backgroundColor: 'rgba(0, 240, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  guideText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  sectionHeader: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
  },
  sectionDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -10,
    marginBottom: 10,
  },
  inputGroup: {
    gap: 8,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  linkLabel: {
    color: COLORS.accentCyan,
    fontSize: 11,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: 'rgba(5, 7, 12, 0.5)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 10,
    padding: 12,
    color: 'white',
    fontSize: 14,
  },
  fieldHelp: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    marginTop: -2,
  },
  configCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  toggleLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  toggleDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.accentCyan,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  nextBtnText: {
    color: COLORS.bgDeep,
    fontSize: 14,
    fontWeight: '800',
  },
});
