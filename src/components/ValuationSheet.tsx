import { Calculator, Check, Plus, Tag } from 'lucide-react-native';
import React, { useEffect, useState, useRef } from 'react';
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  PanResponder
} from 'react-native';
import { COLORS } from '../constants/theme';
import { useApp } from '../context/AppContext';
import { ScannableItem } from '../data/mockData';

interface ValuationSheetProps {
  visible: boolean;
  onClose: () => void;
  item: ScannableItem;
  onList: () => void;
}

const SHIPPING_COSTS = {
  Small: 6.00,
  Medium: 12.00,
  Large: 25.00,
};

export const ValuationSheet: React.FC<ValuationSheetProps> = ({
  visible,
  onClose,
  item,
  onList,
}) => {
  const { logToInventory } = useApp();
  const [title, setTitle] = useState(item.suggestedTitle);
  const [cogs, setCogs] = useState('0');
  const [weightClass, setWeightClass] = useState<'Small' | 'Medium' | 'Large'>(item.weightClass);
  const [added, setAdded] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;

  // Sync title when item changes
  useEffect(() => {
    setTitle(item.suggestedTitle);
    setCogs('0');
    setWeightClass(item.weightClass);
    setAdded(false);
  }, [item]);

  // Reset translateY when sheet opens
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: 800,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Calculate pricing metrics
  const compsCount = item.comps.length;
  const avgPrice = item.comps.reduce((sum, comp) => sum + comp.price, 0) / compsCount;
  const currentCogs = parseFloat(cogs) || 0;
  const currentShipping = SHIPPING_COSTS[weightClass];
  const ebayFeeRate = 0.1325;
  const platformFees = avgPrice * ebayFeeRate;

  const netProfit = avgPrice - currentCogs - currentShipping - platformFees;
  const roi = currentCogs > 0 ? (netProfit / currentCogs) * 100 : 0;

  const handleAddToInventory = () => {
    logToInventory({
      ...item,
      title,
      cogs: currentCogs,
      weightClass,
    });
    setAdded(true);
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.sheetContent, { transform: [{ translateY }] }]}>
          {/* Drag handle wrapper */}
          <View {...panResponder.panHandlers} style={styles.dragHandler}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.subtitle}>EST. VALUATION</Text>
              <Text style={styles.title}>Valuation Dashboard</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Profit Card */}
            <View style={[styles.card, styles.profitCard]}>
              <View style={styles.profitHeader}>
                <Text style={styles.profitTitle}>POTENTIAL NET PROFIT</Text>
                <Calculator color={COLORS.accentCyan} size={18} />
              </View>
              <Text style={styles.profitAmount}>
                ${netProfit > 0 ? netProfit.toFixed(2) : '0.00'}
              </Text>
              <View style={styles.profitGrid}>
                <View>
                  <Text style={styles.gridLabel}>Est. Sale Value</Text>
                  <Text style={styles.gridValue}>${avgPrice.toFixed(2)}</Text>
                </View>
                <View>
                  <Text style={styles.gridLabel}>Est. Fees (13.25%)</Text>
                  <Text style={styles.gridValue}>-${platformFees.toFixed(2)}</Text>
                </View>
                <View>
                  <Text style={styles.gridLabel}>Est. ROI</Text>
                  <Text style={[styles.gridValue, { color: COLORS.accentEmerald }]}>
                    {roi > 0 ? `${roi.toFixed(0)}%` : '0%'}
                  </Text>
                </View>
              </View>
            </View>

            {/* AI Identification Inputs */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>AI Identification</Text>

              <Text style={styles.inputLabel}>IDENTIFIED OBJECT TITLE (EDITABLE)</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Item Title"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>CATEGORY</Text>
              <View style={styles.categoryBadge}>
                <Tag color={COLORS.accentPurple} size={14} />
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            </View>

            {/* Profit Calculator Adjusters */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Scan-to-Profit Calculator</Text>

              <Text style={styles.inputLabel}>COGS (COST OF GOODS SOLD)</Text>
              <TextInput
                style={styles.textInput}
                value={cogs}
                onChangeText={setCogs}
                keyboardType="numeric"
                placeholder="Enter item cost"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>SHIPPING WEIGHT CLASS</Text>
              <View style={styles.weightToggleGrid}>
                {(['Small', 'Medium', 'Large'] as const).map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.weightToggleBtn,
                      weightClass === size && styles.weightToggleBtnActive,
                    ]}
                    onPress={() => setWeightClass(size)}
                  >
                    <Text
                      style={[
                        styles.weightToggleText,
                        weightClass === size && styles.weightToggleTextActive,
                      ]}
                    >
                      {size} (${SHIPPING_COSTS[size]})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.shippingExplanation}>
                {weightClass === 'Small' && 'Small ($6): Under 1 lb (e.g., controllers, games, jewelry)'}
                {weightClass === 'Medium' && 'Medium ($12): 1–5 lbs (e.g., jackets, shoes, books)'}
                {weightClass === 'Large' && 'Large ($25): Over 5 lbs or bulky (e.g., Dutch ovens, consoles)'}
              </Text>
            </View>

            {/* eBay comps */}
            <View style={styles.compsSection}>
              <Text style={styles.sectionHeader}>Smart Comps (eBay Sold)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.compsScroll}
              >
                {item.comps.map((comp) => (
                  <View key={comp.id} style={styles.compCard}>
                    <Image source={{ uri: comp.imageUrl }} style={styles.compImage} />
                    <View style={styles.compDetails}>
                      <Text style={styles.compTitle} numberOfLines={2}>
                        {comp.title}
                      </Text>
                      <Text style={styles.compPrice}>${comp.price.toFixed(2)}</Text>
                      <Text style={styles.compDate}>Sold: {comp.dateSold}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          {/* Action Center */}
          <SafeAreaView style={styles.actionCenter}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.inventoryBtn]}
              onPress={handleAddToInventory}
              disabled={added}
            >
              {added ? (
                <>
                  <Check color={COLORS.bgDeep} size={18} />
                  <Text style={styles.inventoryBtnText}>Added to Inventory</Text>
                </>
              ) : (
                <>
                  <Plus color={COLORS.bgDeep} size={18} />
                  <Text style={styles.inventoryBtnText}>Add to Inventory</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.listBtn]}
              onPress={onList}
            >
              <Text style={styles.listBtnText}>Create AI Listing</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.85)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: COLORS.bgDark,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    height: '90%',
    display: 'flex',
  },
  handleBar: {
    width: 48,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 999,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
  },
  subtitle: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  closeBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  profitCard: {
    borderColor: COLORS.borderGlow,
    backgroundColor: 'rgba(0, 240, 255, 0.04)',
  },
  profitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  profitTitle: {
    color: COLORS.accentCyan,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  profitAmount: {
    color: COLORS.textPrimary,
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 14,
  },
  profitGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    paddingTop: 12,
  },
  gridLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
  gridValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: 'rgba(5, 7, 12, 0.5)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 10,
    padding: 10,
    color: 'white',
    fontSize: 14,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(192, 132, 252, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.15)',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  categoryText: {
    color: COLORS.accentPurple,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  weightToggleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  weightToggleBtn: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.5)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  weightToggleBtnActive: {
    borderColor: COLORS.accentCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  weightToggleText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  weightToggleTextActive: {
    color: COLORS.accentCyan,
  },
  compsSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  compsScroll: {
    gap: 12,
    paddingRight: 20,
  },
  compCard: {
    width: 220,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 14,
    overflow: 'hidden',
  },
  compImage: {
    width: '100%',
    height: 110,
    backgroundColor: COLORS.bgDark,
  },
  compDetails: {
    padding: 10,
  },
  compTitle: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '500',
    height: 32,
    lineHeight: 16,
    marginBottom: 6,
  },
  compPrice: {
    color: COLORS.accentCyan,
    fontSize: 15,
    fontWeight: '700',
  },
  compDate: {
    color: COLORS.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },
  actionCenter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    padding: 16,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.bgDark,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  inventoryBtn: {
    backgroundColor: COLORS.accentCyan,
  },
  inventoryBtnText: {
    color: COLORS.bgDeep,
    fontWeight: '700',
    fontSize: 13,
  },
  listBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  listBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  shippingExplanation: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 14,
  },
  dragHandler: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
