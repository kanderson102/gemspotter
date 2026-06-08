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
  Linking,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS } from '../../constants/theme';
import {
  Trash2,
  ShieldAlert,
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
import * as WebBrowser from 'expo-web-browser';
import { exchangeEbayCodeForToken } from '../../services/ebayService';

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
    isLiveMode,
    setIsLiveMode,
    ebayRuName,
    setEbayRuName,
    ebayUserToken,
    setEbayUserToken,
    setEbayRefreshToken,
    setEbayTokenExpiresAt,
    aiProvider,
    setAiProvider,
    aiModel,
    setAiModel,
    anthropicApiKey,
    setAnthropicApiKey,
    ebayFulfillmentPolicyId,
    setEbayFulfillmentPolicyId,
    ebayPaymentPolicyId,
    setEbayPaymentPolicyId,
    ebayReturnPolicyId,
    setEbayReturnPolicyId,
    ebaySandboxMode,
    setEbaySandboxMode,
    ebaySandboxClientId,
    ebayProdClientId,
    ebaySandboxUserToken,
    ebayProdUserToken,
    ebaySandboxRefreshToken,
    ebayProdRefreshToken,
    ebayRefreshToken,
  } = useApp();

  // Password visibility flags
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showEbayId, setShowEbayId] = useState(false);
  const [showEbaySec, setShowEbaySec] = useState(false);
  const [showPhotoroom, setShowPhotoroom] = useState(false);
  const [showEbayHelp, setShowEbayHelp] = useState(false);
  const [manualAuthCode, setManualAuthCode] = useState('');
  const [showManualToken, setShowManualToken] = useState(false);
  const [showPolicyHelp, setShowPolicyHelp] = useState(false);

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

  const startBrowserAuthFlow = async () => {
    if (!ebayClientId || !ebayClientSecret || !ebayRuName) {
      Alert.alert('Credentials Required', 'Please configure your Client ID, Client Secret, and RuName first.');
      return;
    }

    const authDomain = ebaySandboxMode ? 'auth.sandbox.ebay.com' : 'auth.ebay.com';
    const authUrl = `https://${authDomain}/oauth2/authorize?client_id=${ebayClientId}&redirect_uri=${ebayRuName}&response_type=code&scope=https://api.ebay.com/oauth/api_scope/sell.inventory%20https://api.ebay.com/oauth/api_scope/sell.account.readonly`;

    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, 'https://kanderson102.github.io/gemspotter/');
      
      if (result.type === 'success' && result.url) {
        const match = result.url.match(/[?&]code=([^&]+)/);
        const code = match ? decodeURIComponent(match[1]) : null;
        
        if (code) {
          const tokens = await exchangeEbayCodeForToken(
            ebayClientId,
            ebayClientSecret,
            code,
            ebayRuName,
            ebaySandboxMode
          );
          
          await setEbayUserToken(tokens.accessToken);
          await setEbayRefreshToken(tokens.refreshToken);
          await setEbayTokenExpiresAt(tokens.expiresAt.toString());
          
          Alert.alert('Success', 'Your eBay seller account has been linked successfully!');
        } else {
          Alert.alert('Auth Failed', 'Authorization code not found in redirect URL.');
        }
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to complete eBay authentication.');
    }
  };

  const handleLinkEbay = async () => {
    // If fully linked with refresh token (Proper Integration)
    if (ebayUserToken && ebayRefreshToken) {
      Alert.alert(
        'Unlink eBay Account',
        'Do you want to unlink your eBay seller account from Gemspotter?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unlink Account',
            style: 'destructive',
            onPress: async () => {
              await setEbayUserToken('');
              await setEbayRefreshToken('');
              await setEbayTokenExpiresAt('');
              Alert.alert('Account Unlinked', 'Your eBay seller account has been unlinked.');
            },
          },
        ]
      );
      return;
    }

    // If manual token (no refresh token) is currently configured
    if (ebayUserToken && !ebayRefreshToken) {
      Alert.alert(
        'eBay Account Integration',
        'You have a manual token saved. Would you like to link your account properly via browser (enables auto-refresh), or clear this manual token?',
        [
          {
            text: 'Link Properly (Browser)',
            onPress: () => startBrowserAuthFlow(),
          },
          {
            text: 'Clear Manual Token',
            style: 'destructive',
            onPress: async () => {
              await setEbayUserToken('');
              await setEbayRefreshToken('');
              await setEbayTokenExpiresAt('');
              Alert.alert('Cleared', 'Manual token has been removed.');
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    // Otherwise, start browser auth directly
    await startBrowserAuthFlow();
  };

  const handleCopyAuthUrl = () => {
    if (!ebayClientId || !ebayClientSecret || !ebayRuName) {
      Alert.alert('Credentials Required', 'Please configure your Client ID, Client Secret, and RuName first.');
      return;
    }
    const authDomain = ebaySandboxMode ? 'auth.sandbox.ebay.com' : 'auth.ebay.com';
    const authUrl = `https://${authDomain}/oauth2/authorize?client_id=${ebayClientId}&redirect_uri=${ebayRuName}&response_type=code&scope=https://api.ebay.com/oauth/api_scope/sell.inventory%20https://api.ebay.com/oauth/api_scope/sell.account.readonly`;

    Clipboard.setString(authUrl);
    Alert.alert('Copied', 'eBay Authorization URL copied to clipboard!');
  };

  const handleManualAuthCode = async () => {
    if (!manualAuthCode.trim()) {
      Alert.alert('Error', 'Please paste the authorization code first.');
      return;
    }
    if (!ebayClientId || !ebayClientSecret || !ebayRuName) {
      Alert.alert('Credentials Required', 'Please configure your Client ID, Client Secret, and RuName first.');
      return;
    }

    try {
      const tokens = await exchangeEbayCodeForToken(
        ebayClientId,
        ebayClientSecret,
        manualAuthCode.trim(),
        ebayRuName,
        ebaySandboxMode
      );
      
      await setEbayUserToken(tokens.accessToken);
      await setEbayRefreshToken(tokens.refreshToken);
      await setEbayTokenExpiresAt(tokens.expiresAt.toString());
      setManualAuthCode('');
      
      Alert.alert('Success', 'Your eBay seller account has been linked successfully!');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to complete eBay authentication. Please check your credentials and make sure the code is correct.');
    }
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

        {/* SQLite Local Database Status */}
        <Text style={styles.sectionHeader}>Local Database Status</Text>
        <View style={[styles.infoCard, { borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.04)', marginBottom: 16 }]}>
          <Database color={COLORS.accentEmerald} size={20} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: COLORS.accentEmerald }]}>Local SQLite Database: Active</Text>
            <Text style={styles.infoDesc}>
              Ledger data and scan history are saved locally and securely in a robust SQLite database. No external database setup is required.
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
                {isLiveMode ? 'Using real APIs. Rates & API costs will apply.' : 'Simulated / Offline mode. Free & simulated data.'}
              </Text>
            </View>
            <Switch
              value={isLiveMode}
              onValueChange={setIsLiveMode}
              trackColor={{ false: '#1e293b', true: COLORS.accentCyan }}
              thumbColor={isLiveMode ? COLORS.bgDeep : '#64748b'}
            />
          </View>

          <View style={styles.formContainer}>
            {/* AI Provider Section */}
            <View style={styles.fieldSection}>
              <View style={styles.fieldHeader}>
                <Sparkles color={COLORS.accentPurple} size={14} />
                <Text style={styles.fieldSectionTitle}>Active AI Provider & Model</Text>
              </View>
               <View style={styles.providerGrid}>
                {[
                  { label: 'GPT-4o-mini', provider: 'openai', model: 'gpt-4o-mini' },
                  { label: 'Claude Haiku', provider: 'anthropic', model: 'claude-haiku-4-5' },
                  { label: 'Claude Sonnet', provider: 'anthropic', model: 'claude-sonnet-4-6' },
                ].map((item) => {
                  const isActive = aiProvider === item.provider && aiModel === item.model;
                  return (
                    <TouchableOpacity
                      key={item.label}
                      style={[
                        styles.providerToggleBtn,
                        isActive && styles.providerToggleBtnActive,
                      ]}
                      onPress={async () => {
                        await setAiProvider(item.provider as 'openai' | 'anthropic');
                        await setAiModel(item.model);
                      }}
                    >
                      <Text
                        style={[
                          styles.providerToggleText,
                          isActive && styles.providerToggleTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* OpenAI API Key Section (Only if openai selected) */}
            {aiProvider === 'openai' && (
              <View style={styles.fieldSection}>
                <View style={styles.fieldHeader}>
                  <Key color={COLORS.accentPurple} size={14} />
                  <Text style={styles.fieldSectionTitle}>OpenAI API Key (Vision & SEO)</Text>
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
                <TouchableOpacity onPress={() => Linking.openURL('https://platform.openai.com/api-keys')}>
                  <Text style={styles.setupLinkText}>Get OpenAI Key from Platform Dashboard ↗</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Anthropic API Key Section (Only if anthropic selected) */}
            {aiProvider === 'anthropic' && (
              <View style={styles.fieldSection}>
                <View style={styles.fieldHeader}>
                  <Key color={COLORS.accentPurple} size={14} />
                  <Text style={styles.fieldSectionTitle}>Anthropic API Key (Vision & SEO)</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.fieldInput}
                    value={anthropicApiKey}
                    onChangeText={setAnthropicApiKey}
                    placeholder="sk-ant-api03-..."
                    placeholderTextColor={COLORS.textDark}
                    secureTextEntry={!showAnthropic}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowAnthropic(!showAnthropic)} style={styles.eyeBtn}>
                    {showAnthropic ? <EyeOff color={COLORS.textSecondary} size={16} /> : <Eye color={COLORS.textSecondary} size={16} />}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => Linking.openURL('https://console.anthropic.com/settings/keys')}>
                  <Text style={styles.setupLinkText}>Get Anthropic Key from Console ↗</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* eBay Section */}
            <View style={styles.fieldSection}>
              <View style={styles.fieldHeader}>
                <ShoppingBag color={COLORS.accentCyan} size={14} />
                <Text style={styles.fieldSectionTitle}>eBay {ebaySandboxMode ? 'Sandbox' : 'Production'} Credentials</Text>
              </View>

              {/* Environment Status Summary */}
              <View style={styles.envSummaryContainer}>
                <View style={[styles.envSummaryRow, ebaySandboxMode && styles.envSummaryActiveRow]}>
                  <View style={[styles.statusDot, { backgroundColor: (ebaySandboxUserToken && ebaySandboxClientId) ? (ebaySandboxRefreshToken ? COLORS.accentEmerald : COLORS.accentAmber) : '#475569' }]} />
                  <Text style={styles.envSummaryText}>
                    <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>Sandbox Environment:</Text>{' '}
                    {!ebaySandboxClientId 
                      ? 'Not Configured' 
                      : !ebaySandboxUserToken 
                      ? 'Credentials Saved (Not Linked)' 
                      : ebaySandboxRefreshToken 
                      ? 'Linked (Auto-Refresh)' 
                      : 'Manual Token (No Auto-Refresh) ⚠️'}
                  </Text>
                  {ebaySandboxMode && <Text style={styles.activeLabel}>ACTIVE</Text>}
                </View>
                <View style={[styles.envSummaryRow, !ebaySandboxMode && styles.envSummaryActiveRow]}>
                  <View style={[styles.statusDot, { backgroundColor: (ebayProdUserToken && ebayProdClientId) ? (ebayProdRefreshToken ? COLORS.accentEmerald : COLORS.accentAmber) : '#475569' }]} />
                  <Text style={styles.envSummaryText}>
                    <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>Production Environment:</Text>{' '}
                    {!ebayProdClientId 
                      ? 'Not Configured' 
                      : !ebayProdUserToken 
                      ? 'Credentials Saved (Not Linked)' 
                      : ebayProdRefreshToken 
                      ? 'Linked (Auto-Refresh)' 
                      : 'Manual Token (No Auto-Refresh) ⚠️'}
                  </Text>
                  {!ebaySandboxMode && <Text style={styles.activeLabel}>ACTIVE</Text>}
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.fieldInput}
                  value={ebayClientId}
                  onChangeText={setEbayClientId}
                  placeholder={`eBay ${ebaySandboxMode ? 'Sandbox' : 'Production'} App ID (Client ID)`}
                  placeholderTextColor={COLORS.textDark}
                  secureTextEntry={!showEbayId}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowEbayId(!showEbayId)} style={styles.eyeBtn}>
                  {showEbayId ? <EyeOff color={COLORS.textSecondary} size={16} /> : <Eye color={COLORS.textSecondary} size={16} />}
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrapper, { marginTop: 6 }]}>
                <TextInput
                  style={styles.fieldInput}
                  value={ebayClientSecret}
                  onChangeText={setEbayClientSecret}
                  placeholder={`eBay ${ebaySandboxMode ? 'Sandbox' : 'Production'} Cert ID (Client Secret)`}
                  placeholderTextColor={COLORS.textDark}
                  secureTextEntry={!showEbaySec}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowEbaySec(!showEbaySec)} style={styles.eyeBtn}>
                  {showEbaySec ? <EyeOff color={COLORS.textSecondary} size={16} /> : <Eye color={COLORS.textSecondary} size={16} />}
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => Linking.openURL('https://developer.ebay.com/')}>
                <Text style={styles.setupLinkText}>Get Client ID & Secret from eBay Developer Portal ↗</Text>
              </TouchableOpacity>

              {/* Sandbox Toggle */}
              <View style={[styles.toggleRow, { marginTop: 12, borderTopWidth: 0.5, borderTopColor: COLORS.borderCard, paddingTop: 12 }]}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.toggleLabel}>eBay Sandbox Environment</Text>
                  <Text style={styles.toggleDesc}>
                    Connect to eBay's Sandbox developer environment for mock listing tests. Turn off for live seller account publishing.
                  </Text>
                </View>
                <Switch
                  value={ebaySandboxMode}
                  onValueChange={setEbaySandboxMode}
                  trackColor={{ false: '#334155', true: COLORS.accentCyan }}
                  thumbColor={ebaySandboxMode ? COLORS.bgDeep : '#64748b'}
                  ios_backgroundColor="#334155"
                />
              </View>

              {/* RuName Input */}
              <View style={[styles.fieldHeader, { marginTop: 12 }]}>
                <Key color={COLORS.accentCyan} size={12} />
                <Text style={styles.fieldSectionTitle}>eBay {ebaySandboxMode ? 'Sandbox' : 'Production'} RuName (Redirect URI Name)</Text>
              </View>
              <TextInput
                style={styles.fieldInput}
                value={ebayRuName}
                onChangeText={setEbayRuName}
                placeholder="e.g. YourAppName-RedirectURI-xyz"
                placeholderTextColor={COLORS.textDark}
                autoCapitalize="none"
              />
              
              <View style={{ marginTop: 6, marginBottom: 4 }}>
                <Text style={styles.manualCodeLabel}>Required Redirect URL (Accepted & Declined):</Text>
                <TouchableOpacity
                  style={[
                    styles.helpCodeBlock,
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      marginTop: 4
                    }
                  ]}
                  onPress={() => {
                    Clipboard.setString('https://kanderson102.github.io/gemspotter/');
                    Alert.alert('Copied', 'Redirect URL copied to clipboard!');
                  }}
                >
                  <Text style={styles.helpCodeText}>https://kanderson102.github.io/gemspotter/</Text>
                  <Text style={{ color: COLORS.accentCyan, fontSize: 9, fontWeight: '700' }}>TAP TO COPY</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => setShowEbayHelp(!showEbayHelp)}>
                <Text style={styles.setupLinkText}>
                  {showEbayHelp ? 'Hide Setup Instructions' : 'How to find your RuName & configure Redirect URL? ↗'}
                </Text>
              </TouchableOpacity>

              {showEbayHelp && (
                <View style={styles.helpContainer}>
                  <Text style={styles.helpTitle}>eBay RuName & Redirect Setup Guide:</Text>
                  <Text style={styles.helpText}>
                    1. Log in to the <Text style={styles.helpBold} onPress={() => Linking.openURL('https://developer.ebay.com/')}>eBay Developer Portal</Text>.
                  </Text>
                  <Text style={styles.helpText}>
                    2. Go to <Text style={styles.helpBold}>Application Settings</Text> (Sandbox or Production).
                  </Text>
                  <Text style={styles.helpText}>
                    3. Under <Text style={styles.helpBold}>User Tokens</Text>, select <Text style={styles.helpBold}>OAuth</Text> (do NOT select legacy Auth'n'Auth) and edit your <Text style={styles.helpBold}>RuName / Redirect Registry</Text>.
                  </Text>
                  <Text style={styles.helpText}>
                    4. Your generated RuName (Redirect URI Name) is shown there (looks like: <Text style={styles.helpItalic}>Your_Name-YourAppN-gemspo-xxxx</Text>). Copy and paste it above.
                  </Text>
                  <Text style={styles.helpText}>
                    5. <Text style={styles.helpImportant}>CRITICAL</Text>: Since the eBay developer portal registry requires a secure HTTPS callback URL, you must register the Redirect URL (both accepted and declined URLs) as:
                  </Text>
                  <TouchableOpacity
                    style={[styles.helpCodeBlock, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                    onPress={() => {
                      Clipboard.setString('https://kanderson102.github.io/gemspotter/');
                      Alert.alert('Copied', 'Redirect URL copied to clipboard!');
                    }}
                  >
                    <Text style={styles.helpCodeText}>https://kanderson102.github.io/gemspotter/</Text>
                    <Text style={{ color: COLORS.accentCyan, fontSize: 8, fontWeight: '700' }}>TAP TO COPY</Text>
                  </TouchableOpacity>
                  <Text style={styles.helpText}>
                    After you authorize on eBay, you'll be redirected to your secure landing page. Tap "Copy" or "Launch App" to return to Gemspotter and link your account automatically or manually!
                  </Text>
                  <Text style={[styles.helpText, { marginTop: 6, fontStyle: 'italic', color: COLORS.accentPurple }]}>
                    ⚠️ Sandbox and Production are completely separate environments on eBay. You must configure this Redirect URL in the registry of BOTH your Sandbox keyset AND your Production keyset on the Developer Portal!
                  </Text>
                </View>
              )}

              {/* Link Account status & button */}
              <Text style={[styles.toggleDesc, { marginTop: 8, color: COLORS.textSecondary }]}>
                {!ebayUserToken 
                  ? 'No seller account linked. Link your seller account to authorize the app to publish listings on your behalf.' 
                  : ebayRefreshToken 
                  ? 'eBay Seller Account is fully linked with auto-refresh enabled! The app will automatically manage your session.' 
                  : '⚠️ Manual access token is pasted directly. Auto-refresh is disabled. Manually pasted tokens expire in 2 hours. Use "Link eBay Account" below for permanent access.'}
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                <TouchableOpacity
                  style={[
                    styles.testBtn,
                    { flex: 1, marginTop: 0 },
                    (ebayUserToken && ebayRefreshToken) 
                      ? { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: COLORS.accentEmerald, borderWidth: 1 } 
                      : {}
                  ]}
                  onPress={handleLinkEbay}
                >
                  <Text 
                    style={[
                      styles.testBtnText, 
                      (ebayUserToken && ebayRefreshToken) 
                        ? { color: COLORS.accentEmerald } 
                        : { color: COLORS.bgDeep }
                    ]}
                  >
                    {(ebayUserToken && ebayRefreshToken) ? 'Linked ✅' : 'Link eBay Account'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.testBtn,
                    { flex: 1, marginTop: 0, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: COLORS.borderCard, borderWidth: 1 }
                  ]}
                  onPress={handleCopyAuthUrl}
                >
                  <Text style={[styles.testBtnText, { color: COLORS.textPrimary }]}>
                    Copy Auth Link 🔗
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Manual Auth Code Exchange Field */}
              <View style={{ marginTop: 12, borderTopWidth: 0.5, borderTopColor: COLORS.borderCard, paddingTop: 12 }}>
                <Text style={styles.manualCodeLabel}>Or paste Authorization Code to Link:</Text>
                <View style={{ flexDirection: 'row', marginTop: 4 }}>
                  <TextInput
                    style={[styles.fieldInput, { borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                    value={manualAuthCode}
                    onChangeText={setManualAuthCode}
                    placeholder="Pasted auth code (starts with 'code=')"
                    placeholderTextColor={COLORS.textDark}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    style={styles.submitCodeBtn}
                    onPress={handleManualAuthCode}
                  >
                    <Text style={styles.submitCodeBtnText}>Link Account</Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.toggleDesc, { color: COLORS.textSecondary, marginTop: 4 }]}>
                  If you used "Copy Auth Link" and obtained the code on the web landing page, paste it here to exchange it for a permanent session.
                </Text>
              </View>

              {/* Manual Token Paste Field */}
              <View style={{ marginTop: 12, borderTopWidth: 0.5, borderTopColor: COLORS.borderCard, paddingTop: 12 }}>
                <Text style={styles.manualCodeLabel}>Or paste User Access Token directly:</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.fieldInput}
                    value={ebayUserToken}
                    onChangeText={setEbayUserToken}
                    placeholder="v^1.1#i^1#f^0#p^3..."
                    placeholderTextColor={COLORS.textDark}
                    secureTextEntry={!showManualToken}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowManualToken(!showManualToken)} style={styles.eyeBtn}>
                    {showManualToken ? <EyeOff color={COLORS.textSecondary} size={16} /> : <Eye color={COLORS.textSecondary} size={16} />}
                  </TouchableOpacity>
                </View>
                <Text style={[styles.toggleDesc, { color: COLORS.textSecondary, marginTop: 4 }]}>
                  If you generated a User Access Token directly from the eBay Developer Portal, you can paste it here.
                </Text>
              </View>

              {/* Optional Policy IDs fields */}
              <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: COLORS.borderCard, paddingTop: 16 }}>
                <Text style={[styles.fieldSectionTitle, { color: COLORS.accentCyan, fontSize: 11, marginBottom: 4 }]}>
                  Custom eBay Listing Policy IDs
                </Text>
                <Text style={[styles.toggleDesc, { color: COLORS.textSecondary, marginBottom: 4 }]}>
                  Enter the numeric policy IDs configured on your eBay sandbox/live seller profile. These are required by eBay to publish listings on your behalf.
                </Text>

                <TouchableOpacity onPress={() => setShowPolicyHelp(!showPolicyHelp)}>
                  <Text style={[styles.setupLinkText, { marginBottom: 12 }]}>
                    {showPolicyHelp ? 'Hide Instructions' : 'How to find your Business Policy IDs? ↗'}
                  </Text>
                </TouchableOpacity>

                {showPolicyHelp && (
                  <View style={[styles.helpContainer, { marginBottom: 12, gap: 6 }]}>
                    <Text style={styles.helpTitle}>How to find eBay Business Policy IDs:</Text>
                    
                    <Text style={styles.helpText}>
                      1. Log in to your eBay account on the web and visit:
                    </Text>
                    <TouchableOpacity onPress={() => Linking.openURL(ebaySandboxMode ? 'https://www.bizpolicy.sandbox.ebay.com/businesspolicy/manage' : 'https://www.bizpolicy.ebay.com/businesspolicy/manage')}>
                      <Text style={[styles.helpText, { color: COLORS.accentCyan, textDecorationLine: 'underline', paddingLeft: 10 }]}>
                        {ebaySandboxMode ? 'Open eBay Sandbox Business Policies ↗' : 'Open eBay Live Business Policies ↗'}
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.helpText}>
                      2. If the link above fails or you haven't enabled Business Policies yet, use the direct opt-in link:
                    </Text>
                    <TouchableOpacity onPress={() => Linking.openURL(ebaySandboxMode ? 'https://www.bizpolicy.sandbox.ebay.com/businesspolicy/policyoptin' : 'https://www.bizpolicy.ebay.com/businesspolicy/policyoptin')}>
                      <Text style={[styles.helpText, { color: COLORS.accentCyan, textDecorationLine: 'underline', paddingLeft: 10 }]}>
                        {ebaySandboxMode ? 'Direct Sandbox Opt-in Page ↗' : 'Direct Live Opt-in Page ↗'}
                      </Text>
                    </TouchableOpacity>

                    <Text style={[styles.helpText, { color: COLORS.accentAmber, marginTop: 4, fontWeight: '700' }]}>
                      ⚠️ Browser Troubleshooting (Brave / Adblockers):
                    </Text>
                    <Text style={[styles.helpText, { paddingLeft: 10, fontSize: 11 }]}>
                      • <Text style={{ fontWeight: '700' }}>Brave Shields / Adblockers:</Text> If using Brave Browser, you MUST turn off "Brave Shields" for eBay. Brave blocks the session/cookie scripts eBay requires to load this dashboard, causing eBay to crash with "Something went wrong on our end".
                    </Text>
                    <Text style={[styles.helpText, { paddingLeft: 10, fontSize: 11 }]}>
                      • <Text style={{ fontWeight: '700' }}>Private Tabs:</Text> If the page still doesn't load, try opening it in an Incognito/Private window, or clear your browser cookies and cache.
                    </Text>
                    <Text style={[styles.helpText, { paddingLeft: 10, fontSize: 11 }]}>
                      • <Text style={{ fontWeight: '700' }}>Wrong Account:</Text> Ensure you are logged into your correct active seller account in the browser before visiting the links.
                    </Text>

                    <Text style={[styles.helpText, { marginTop: 6 }]}>
                      3. **Click on the title** of any active policy (Shipping, Payment, or Return) to view its details.
                    </Text>
                    <Text style={styles.helpText}>
                      4. Look at the browser's address bar. The URL will contain a parameter like <Text style={styles.helpBold}>profileId=XXXXXXXXXXXX</Text> (a 10-12 digit number).
                    </Text>
                    <Text style={styles.helpText}>
                      5. Copy that numeric ID and paste it into the corresponding field below.
                    </Text>
                  </View>
                )}

                <Text style={styles.manualCodeLabel}>Fulfillment Policy ID (Shipping):</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={ebayFulfillmentPolicyId}
                  onChangeText={setEbayFulfillmentPolicyId}
                  placeholder="e.g. 195724510015"
                  placeholderTextColor={COLORS.textDark}
                  autoCapitalize="none"
                  keyboardType="numeric"
                />

                <Text style={[styles.manualCodeLabel, { marginTop: 6 }]}>Payment Policy ID:</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={ebayPaymentPolicyId}
                  onChangeText={setEbayPaymentPolicyId}
                  placeholder="e.g. 195724510016"
                  placeholderTextColor={COLORS.textDark}
                  autoCapitalize="none"
                  keyboardType="numeric"
                />

                <Text style={[styles.manualCodeLabel, { marginTop: 6 }]}>Return Policy ID:</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={ebayReturnPolicyId}
                  onChangeText={setEbayReturnPolicyId}
                  placeholder="e.g. 195724510017"
                  placeholderTextColor={COLORS.textDark}
                  autoCapitalize="none"
                  keyboardType="numeric"
                />
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
              <TouchableOpacity onPress={() => Linking.openURL('https://www.photoroom.com/api/')}>
                <Text style={styles.setupLinkText}>Get Photoroom API Key from Console ↗</Text>
              </TouchableOpacity>
            </View>
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
            Clear all saved state from AsyncStorage and wipe the local SQLite database. This restores the app to a fresh installation state.
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleResetData}>
            <Trash2 color="white" size={14} />
            <Text style={styles.resetBtnText}>Clear All Local Data (Database & Credentials)</Text>
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
  setupLinkText: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  helpContainer: {
    backgroundColor: 'rgba(5, 7, 12, 0.4)',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    gap: 4,
  },
  helpTitle: {
    color: COLORS.accentCyan,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  helpText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
  helpBold: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  helpItalic: {
    fontStyle: 'italic',
  },
  helpImportant: {
    color: COLORS.accentRose,
    fontWeight: '700',
  },
  helpCodeBlock: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderColor: 'rgba(0, 240, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  helpCodeText: {
    color: COLORS.accentCyan,
    fontFamily: 'Courier',
    fontSize: 10,
    fontWeight: '700',
  },
  manualCodeContainer: {
    marginTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.borderCard,
    paddingTop: 12,
    gap: 6,
  },
  manualCodeLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  submitCodeBtn: {
    backgroundColor: COLORS.accentCyan,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  submitCodeBtnText: {
    color: COLORS.bgDeep,
    fontWeight: '700',
    fontSize: 11,
  },
  providerGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  providerToggleBtn: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.4)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  providerToggleBtnActive: {
    borderColor: COLORS.accentPurple,
    backgroundColor: 'rgba(217, 70, 239, 0.08)',
  },
  providerToggleText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  providerToggleTextActive: {
    color: COLORS.accentPurple,
    fontWeight: '700',
  },
  envSummaryContainer: {
    backgroundColor: 'rgba(5, 7, 12, 0.4)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    marginBottom: 6,
    gap: 6,
  },
  envSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  envSummaryActiveRow: {
    backgroundColor: 'rgba(0, 240, 255, 0.04)',
    borderColor: 'rgba(0, 240, 255, 0.12)',
    borderWidth: 0.5,
  },
  envSummaryText: {
    color: COLORS.textSecondary,
    fontSize: 10.5,
    flex: 1,
  },
  activeLabel: {
    color: COLORS.accentCyan,
    fontSize: 8.5,
    fontWeight: '800',
    backgroundColor: 'rgba(0, 240, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
