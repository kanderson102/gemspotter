import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS } from '../../constants/theme';
import {
  Zap,
  CreditCard,
  Trash2,
  Check,
  ShieldAlert,
  User,
  X,
  Lock,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const {
    gems,
    tier,
    purchaseGems,
    upgradeSubscription,
    resetAllData,
    isLoggedIn,
    user,
    loginSimulate,
    logoutSimulate,
  } = useApp();

  // State controls
  const [authVisible, setAuthVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState<{
    name: string;
    price: string;
    action: () => void;
  } | null>(null);
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Auth form inputs
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const handleBuyPacks = (amount: number, price: string, packName: string) => {
    setCheckoutProduct({
      name: `${packName} (+${amount} Gems)`,
      price,
      action: () => {
        purchaseGems(amount);
      },
    });
    setCheckoutSuccess(false);
    setCheckoutProcessing(false);
    setCheckoutVisible(true);
  };

  const handleUpgradeSubscription = (targetTier: 'pro' | 'scale', price: string) => {
    if (tier === targetTier) {
      Alert.alert('Active Plan', `You are already subscribed to the ${targetTier.toUpperCase()} plan.`);
      return;
    }

    setCheckoutProduct({
      name: `${targetTier.toUpperCase()} Membership`,
      price: `${price}/mo`,
      action: () => {
        upgradeSubscription(targetTier);
      },
    });
    setCheckoutSuccess(false);
    setCheckoutProcessing(false);
    setCheckoutVisible(true);
  };

  const handleSimulatePay = (action: () => void) => {
    setCheckoutProcessing(true);
    setTimeout(() => {
      setCheckoutProcessing(false);
      setCheckoutSuccess(true);
      action();
    }, 1800); // Simulated authorization timer
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will erase your inventory logs, scan history, plan status, and reset gems to 10. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
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
        <Text style={styles.title}>Account & Shop</Text>
        <Text style={styles.subtitle}>THE GEM ECONOMY</Text>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => setAuthVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.avatarCircle}>
            <User color={COLORS.bgDeep} size={24} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {isLoggedIn && user ? user.name : 'Guest User (Click to Login)'}
            </Text>
            <View style={styles.profileTierRow}>
              <View style={styles.tierTag}>
                <Text style={styles.tierTagText}>
                  {tier.toUpperCase()} {isLoggedIn ? 'MEMBER' : 'GUEST'}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.balanceCol}>
            <Zap color={COLORS.accentCyan} size={14} fill={COLORS.accentCyan} />
            <Text style={styles.balanceVal}>{gems}</Text>
            <Text style={styles.balanceLabel}>GEMS</Text>
          </View>
        </TouchableOpacity>

        {/* Subscription Plans */}
        <Text style={styles.sectionHeader}>Subscription Plans</Text>
        
        {/* PRO PLAN */}
        <View style={[styles.planCard, tier === 'pro' && styles.planCardActive]}>
          {tier === 'pro' && (
            <View style={styles.activePlanBadge}>
              <Check color={COLORS.bgDeep} size={10} />
              <Text style={styles.activePlanBadgeText}>ACTIVE</Text>
            </View>
          )}
          <Text style={styles.planName}>Pro Membership</Text>
          <Text style={styles.planPrice}>$29<Text style={styles.priceLabel}>/mo</Text></Text>
          
          <View style={styles.benefitList}>
            <Text style={styles.benefitItem}>• <Text style={{fontWeight: '700', color: 'white'}}>250 Gems</Text> credited every month</Text>
            <Text style={styles.benefitItem}>• Inventory storage expanded to <Text style={{fontWeight: '700', color: 'white'}}>100 items</Text></Text>
            <Text style={styles.benefitItem}>• Full access to All-Market Comps on AI scans</Text>
          </View>

          <TouchableOpacity
            style={[styles.planBtn, tier === 'pro' && styles.planBtnActive]}
            onPress={() => handleUpgradeSubscription('pro', '$29')}
            disabled={tier === 'pro'}
          >
            <Text style={[styles.planBtnText, tier === 'pro' && { color: COLORS.accentCyan }]}>
              {tier === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SCALE PLAN */}
        <View style={[styles.planCard, tier === 'scale' && styles.planCardActive, { borderColor: COLORS.accentPurple }]}>
          {tier === 'scale' && (
            <View style={[styles.activePlanBadge, { backgroundColor: COLORS.accentPurple }]}>
              <Check color={COLORS.bgDeep} size={10} />
              <Text style={styles.activePlanBadgeText}>ACTIVE</Text>
            </View>
          )}
          <Text style={[styles.planName, { color: COLORS.accentPurple }]}>Scale Membership</Text>
          <Text style={styles.planPrice}>$79<Text style={styles.priceLabel}>/mo</Text></Text>
          
          <View style={styles.benefitList}>
            <Text style={styles.benefitItem}>• <Text style={{fontWeight: '700', color: 'white'}}>1000 Gems</Text> credited every month</Text>
            <Text style={styles.benefitItem}>• <Text style={{fontWeight: '700', color: 'white'}}>Unlimited</Text> Inventory Ledger storage</Text>
            <Text style={styles.benefitItem}>• Advanced reseller statistics dashboard</Text>
          </View>

          <TouchableOpacity
            style={[styles.planBtn, styles.scalePlanBtn, tier === 'scale' && styles.planBtnActive]}
            onPress={() => handleUpgradeSubscription('scale', '$79')}
            disabled={tier === 'scale'}
          >
            <Text style={[styles.planBtnText, tier === 'scale' && { color: COLORS.accentPurple }]}>
              {tier === 'scale' ? 'Current Plan' : 'Upgrade to Scale'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Buy Gem Packs */}
        <Text style={styles.sectionHeader}>Purchase Gem Packs</Text>
        <View style={styles.packsGrid}>
          {/* Pack 1 */}
          <TouchableOpacity
            style={styles.packCard}
            onPress={() => handleBuyPacks(20, '$5.99', 'Starter Pack')}
          >
            <Text style={styles.packName}>Starter Pack</Text>
            <View style={styles.packBadgeRow}>
              <Zap color={COLORS.accentCyan} size={12} fill={COLORS.accentCyan} />
              <Text style={styles.packGemsText}>+20 Gems</Text>
            </View>
            <Text style={styles.packPrice}>$5.99</Text>
          </TouchableOpacity>

          {/* Pack 2 */}
          <TouchableOpacity
            style={styles.packCard}
            onPress={() => handleBuyPacks(60, '$11.99', 'Booster Pack')}
          >
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsBadgeText}>SAVE 33%</Text>
            </View>
            <Text style={styles.packName}>Booster Pack</Text>
            <View style={styles.packBadgeRow}>
              <Zap color={COLORS.accentCyan} size={12} fill={COLORS.accentCyan} />
              <Text style={styles.packGemsText}>+60 Gems</Text>
            </View>
            <Text style={styles.packPrice}>$11.99</Text>
          </TouchableOpacity>

          {/* Pack 3 */}
          <TouchableOpacity
            style={styles.packCard}
            onPress={() => handleBuyPacks(160, '$23.99', 'Turbo Pack')}
          >
            <View style={[styles.savingsBadge, { backgroundColor: COLORS.accentPurple }]}>
              <Text style={styles.savingsBadgeText}>SAVE 50%</Text>
            </View>
            <Text style={styles.packName}>Turbo Pack</Text>
            <View style={styles.packBadgeRow}>
              <Zap color={COLORS.accentCyan} size={12} fill={COLORS.accentCyan} />
              <Text style={styles.packGemsText}>+160 Gems</Text>
            </View>
            <Text style={styles.packPrice}>$23.99</Text>
          </TouchableOpacity>
        </View>

        {/* Debug Controls */}
        <Text style={styles.sectionHeader}>Developer Controls</Text>
        <View style={styles.debugCard}>
          <View style={styles.debugHeader}>
            <ShieldAlert color={COLORS.accentRose} size={16} />
            <Text style={styles.debugTitle}>Local Storage Diagnostics</Text>
          </View>
          <Text style={styles.debugDesc}>
            Clear all saved state from AsyncStorage. This restores the database to initial seed data, including 10 free Gems.
          </Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleResetData}>
            <Trash2 color="white" size={14} />
            <Text style={styles.resetBtnText}>Clear AsyncStorage Data</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* MODAL: Simulated Authentication Sheet */}
      <Modal visible={authVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.authModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isLoggedIn ? 'Account Profile' : 'Sign In to Gemspotter'}
              </Text>
              <TouchableOpacity onPress={() => setAuthVisible(false)} style={styles.modalCloseBtn}>
                <X color={COLORS.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            {isLoggedIn && user ? (
              <View style={styles.authBody}>
                <View style={styles.profileCardInModal}>
                  <View style={styles.avatarCircleLarge}>
                    <User color={COLORS.bgDeep} size={36} />
                  </View>
                  <Text style={styles.modalName}>{user.name}</Text>
                  <Text style={styles.modalEmail}>{user.email}</Text>
                  <View style={styles.tierTagLarge}>
                    <Text style={styles.tierTagTextLarge}>{tier.toUpperCase()} MEMBERSHIP</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={async () => {
                    await logoutSimulate();
                    setAuthVisible(false);
                    Alert.alert('Logged Out', 'You have been logged out of your simulated account.');
                  }}
                >
                  <Text style={styles.logoutBtnText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.authBody}>
                <Text style={styles.authIntro}>
                  Log in to sync your inventory ledger, back up scan history, and purchase credit packs.
                </Text>

                <Text style={styles.formLabel}>DISPLAY NAME</Text>
                <TextInput
                  style={styles.formInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="e.g. Kyle the Collector"
                  placeholderTextColor={COLORS.textDark}
                />

                <Text style={styles.formLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.formInput}
                  value={emailInput}
                  onChangeText={setEmailInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="name@example.com"
                  placeholderTextColor={COLORS.textDark}
                />

                <TouchableOpacity
                  style={styles.primaryAuthBtn}
                  onPress={async () => {
                    if (!nameInput.trim() || !emailInput.trim()) {
                      Alert.alert('Missing Fields', 'Please enter both your name and email.');
                      return;
                    }
                    await loginSimulate(nameInput, emailInput);
                    setNameInput('');
                    setEmailInput('');
                    setAuthVisible(false);
                    Alert.alert('Signed In', `Welcome back, ${nameInput}!`);
                  }}
                >
                  <Text style={styles.primaryAuthBtnText}>Create / Connect Account</Text>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR QUICK CONNECT</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={[styles.socialAuthBtn, { borderColor: 'rgba(255,255,255,0.1)' }]}
                  onPress={async () => {
                    await loginSimulate('Sam the Side-Hustler', 'sam@gemspotter.ai');
                    setAuthVisible(false);
                    Alert.alert('Google Sign-In', 'Connected with Google Account!');
                  }}
                >
                  <Text style={styles.socialAuthBtnText}>Continue with Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.socialAuthBtn, { borderColor: 'rgba(255,255,255,0.1)', marginTop: 8 }]}
                  onPress={async () => {
                    await loginSimulate('Alex the Antique Finder', 'alex@gemspotter.ai');
                    setAuthVisible(false);
                    Alert.alert('Apple Sign-In', 'Connected with Apple ID!');
                  }}
                >
                  <Text style={styles.socialAuthBtnText}>Continue with Apple</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL: Simulated Checkout Page */}
      <Modal visible={checkoutVisible} animationType="slide" transparent>
        <View style={styles.checkoutOverlay}>
          <View style={styles.checkoutContent}>
            {checkoutProduct && (
              <>
                {/* Header */}
                <View style={styles.checkoutHeader}>
                  <View style={styles.payIconRow}>
                    <Lock color={COLORS.accentCyan} size={16} />
                    <Text style={styles.checkoutTitle}>Secure Checkout</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      if (!checkoutProcessing) setCheckoutVisible(false);
                    }}
                    style={styles.checkoutClose}
                    disabled={checkoutProcessing}
                  >
                    <X color={COLORS.textSecondary} size={20} />
                  </TouchableOpacity>
                </View>

                {checkoutProcessing ? (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color={COLORS.accentCyan} />
                    <Text style={styles.processingTitle}>Processing Payment...</Text>
                    <Text style={styles.processingSubtitle}>
                      Authorizing with secure vault...
                    </Text>
                  </View>
                ) : checkoutSuccess ? (
                  <View style={styles.processingContainer}>
                    <View style={styles.successCircle}>
                      <Check color={COLORS.bgDeep} size={28} />
                    </View>
                    <Text style={styles.processingTitle}>Payment Complete!</Text>
                    <Text style={styles.processingSubtitle}>
                      {checkoutProduct.name} successfully activated.
                    </Text>
                    <TouchableOpacity
                      style={styles.checkoutDoneBtn}
                      onPress={() => {
                        setCheckoutSuccess(false);
                        setCheckoutVisible(false);
                      }}
                    >
                      <Text style={styles.checkoutDoneText}>Get Started</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.checkoutForm}>
                    <View style={styles.productSummaryCard}>
                      <Text style={styles.summaryLabel}>PRODUCT</Text>
                      <Text style={styles.summaryName}>{checkoutProduct.name}</Text>
                      <View style={styles.summaryDivider} />
                      <Text style={styles.summaryLabel}>TOTAL AMOUNT</Text>
                      <Text style={styles.summaryPrice}>{checkoutProduct.price}</Text>
                    </View>

                    {/* Simulated Payment Cards */}
                    <Text style={styles.checkoutFormLabel}>CHOOSE SIMULATED METHOD</Text>
                    
                    <TouchableOpacity
                      style={styles.payMethodBtn}
                      onPress={() => handleSimulatePay(checkoutProduct.action)}
                    >
                      <Text style={styles.payMethodText}> Pay (Simulate Apple Pay)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.payMethodBtn, { marginTop: 8 }]}
                      onPress={() => handleSimulatePay(checkoutProduct.action)}
                    >
                      <Text style={styles.payMethodText}>G Pay (Simulate Google Pay)</Text>
                    </TouchableOpacity>

                    <View style={styles.checkoutDividerRow}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>OR CREDIT CARD</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <TouchableOpacity
                      style={styles.cardInputRow}
                      onPress={() => handleSimulatePay(checkoutProduct.action)}
                    >
                      <CreditCard color={COLORS.textSecondary} size={16} />
                      <Text style={styles.fakeCardText}>••••  ••••  ••••  4242 (Tap to Pay)</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
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
  profileCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  profileTierRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  tierTag: {
    backgroundColor: 'rgba(192, 132, 252, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(192, 132, 252, 0.25)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  tierTagText: {
    color: COLORS.accentPurple,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  balanceCol: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  balanceVal: {
    color: COLORS.accentCyan,
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  balanceLabel: {
    color: COLORS.textSecondary,
    fontSize: 7,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  planCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
  },
  planCardActive: {
    borderColor: COLORS.accentCyan,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 240, 255, 0.02)',
  },
  activePlanBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: COLORS.accentCyan,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    gap: 2,
  },
  activePlanBadgeText: {
    color: COLORS.bgDeep,
    fontSize: 8,
    fontWeight: '800',
  },
  planName: {
    color: COLORS.accentCyan,
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '800',
  },
  planPrice: {
    color: COLORS.textPrimary,
    fontFamily: 'Outfit',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  priceLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  benefitList: {
    marginTop: 14,
    gap: 6,
  },
  benefitItem: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  planBtn: {
    marginTop: 20,
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'transparent',
  },
  scalePlanBtn: {
    backgroundColor: 'rgba(192, 132, 252, 0.08)',
    borderColor: 'rgba(192, 132, 252, 0.2)',
  },
  planBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  packsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  packCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
    paddingTop: 18,
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: COLORS.accentCyan,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  savingsBadgeText: {
    color: COLORS.bgDeep,
    fontSize: 7,
    fontWeight: '800',
  },
  packName: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  packBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  packGemsText: {
    color: COLORS.accentCyan,
    fontFamily: 'Outfit',
    fontWeight: '800',
    fontSize: 11,
  },
  packPrice: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
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

  // Modal Overlay Shared Style
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.85)',
    justifyContent: 'flex-end',
  },
  authModalContent: {
    backgroundColor: COLORS.bgDark,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    padding: 24,
    height: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
    paddingBottom: 12,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontFamily: 'Outfit',
    fontSize: 20,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  authBody: {
    flex: 1,
  },
  authIntro: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 18,
  },
  formLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 10,
  },
  formInput: {
    backgroundColor: 'rgba(5, 7, 12, 0.5)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 10,
    padding: 12,
    color: 'white',
    fontSize: 14,
    marginBottom: 12,
  },
  primaryAuthBtn: {
    backgroundColor: COLORS.accentCyan,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  primaryAuthBtnText: {
    color: COLORS.bgDeep,
    fontWeight: '800',
    fontSize: 13,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderCard,
  },
  dividerText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    marginHorizontal: 12,
    letterSpacing: 1.5,
  },
  socialAuthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  socialAuthBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 13,
  },

  // Modal Auth View State
  profileCardInModal: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    marginVertical: 20,
  },
  avatarCircleLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalEmail: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  tierTagLarge: {
    backgroundColor: 'rgba(192, 132, 252, 0.08)',
    borderWidth: 0.5,
    borderColor: 'rgba(192, 132, 252, 0.25)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  tierTagTextLarge: {
    color: COLORS.accentPurple,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  logoutBtn: {
    backgroundColor: COLORS.accentRose,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  logoutBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },

  // Checkout Modal Styles
  checkoutOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.85)',
    justifyContent: 'flex-end',
  },
  checkoutContent: {
    backgroundColor: COLORS.bgDark,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    padding: 24,
    minHeight: '60%',
  },
  checkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
    paddingBottom: 12,
  },
  payIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  checkoutClose: {
    padding: 4,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  processingTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  processingSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  successCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accentEmerald,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutDoneBtn: {
    backgroundColor: COLORS.accentEmerald,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 24,
  },
  checkoutDoneText: {
    color: COLORS.bgDeep,
    fontWeight: '700',
    fontSize: 13,
  },
  checkoutForm: {
    flex: 1,
  },
  productSummaryCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  summaryName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 12,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.borderCard,
    marginBottom: 12,
  },
  summaryPrice: {
    color: COLORS.accentCyan,
    fontFamily: 'Outfit',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  checkoutFormLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  payMethodBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payMethodText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  checkoutDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  cardInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 7, 12, 0.5)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },
  fakeCardText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  confirmPayBtn: {
    backgroundColor: COLORS.accentCyan,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmPayText: {
    color: COLORS.bgDeep,
    fontWeight: '800',
    fontSize: 13,
  },
});
