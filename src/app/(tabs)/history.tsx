import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useApp, ScanHistoryItem } from '../../context/AppContext';
import { COLORS } from '../../constants/theme';
import { History, ArrowRight, Zap, FolderPlus, HelpCircle, Check, Trash2 } from 'lucide-react-native';
import { ValuationSheet } from '../../components/ValuationSheet';
import { ListingSheet } from '../../components/ListingSheet';
import { getShippingCost, getEbayFeeRate } from '../../services/shippingService';

export default function ScanHistoryScreen() {
  const { history, performScan, activeScan, setActiveScan, logToInventory, inventory, isLiveMode, updateHistoryItem, deleteHistoryItem } = useApp();
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<ScanHistoryItem | null>(null);
  
  const filteredHistory = isLiveMode ? history.filter(item => !item.isMock) : history;

  // Sheet States
  const [valuationVisible, setValuationVisible] = useState(false);
  const [listingVisible, setListingVisible] = useState(false);

  const handleCardPress = (item: ScanHistoryItem) => {
    setSelectedHistoryItem(item);
    setActiveScan(item.scannableItem);
    setValuationVisible(true);
  };

  const calculateProfit = (item: ScanHistoryItem) => {
    const scannable = item.scannableItem;
    const comps = scannable.comps || [];
    const compsCount = comps.length;
    if (compsCount === 0) return 0;
    
    const avgPrice = comps.reduce((sum, comp) => sum + comp.price, 0) / compsCount;
    const shipping = getShippingCost(scannable.weightClass);
    const ebayFeeRate = getEbayFeeRate(scannable.category);
    const platformFees = (avgPrice * ebayFeeRate) + 0.30;
    
    return avgPrice - scannable.cogs - shipping - platformFees;
  };

  const handleLogQuick = (item: ScanHistoryItem) => {
    // Keep isMock status same when logging to inventory
    logToInventory(item.scannableItem, item.isMock);
    Alert.alert('Success', `${item.scannableItem.title} added to your Inventory!`);
  };

  const handleDeletePress = (id: string) => {
    Alert.alert(
      'Delete Scan',
      'Are you sure you want to permanently delete this item from your scan history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => deleteHistoryItem(id) 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Scan History</Text>
          <Text style={styles.subtitle}>DEFERRED SOURCING LOG</Text>
        </View>
      </View>

      {filteredHistory.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <History color={COLORS.accentCyan} size={32} />
          </View>
          <Text style={styles.emptyTitle}>No Scans Yet</Text>
          <Text style={styles.emptySubtitle}>
            When you scan items at a thrift store or estate sale, they will be saved here automatically so you can log them later.
          </Text>
        </View>
      ) : (
        /* History List */
        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>

          {filteredHistory.map((item) => {
            const profit = calculateProfit(item);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.historyCard}
                onPress={() => handleCardPress(item)}
              >
                <Image source={{ uri: item.scannableItem.imageUrl }} style={styles.cardImage} />
                
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.scannableItem.title}
                  </Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    COGS: ${item.scannableItem.cogs.toFixed(2)} • {item.scannableItem.weightClass} weight
                  </Text>
                  <Text style={styles.cardDate}>
                    Scanned: {new Date(item.scannedAt).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.cardStats}>
                  <Text style={styles.profitLabel}>EST. PROFIT</Text>
                  <Text style={styles.profitVal}>
                    ${profit > 0 ? profit.toFixed(2) : '0.00'}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                    <TouchableOpacity
                      style={styles.deleteCardBtn}
                      onPress={() => handleDeletePress(item.id)}
                    >
                      <Trash2 color={COLORS.accentRose} size={14} />
                    </TouchableOpacity>

                    {inventory.some(invItem => invItem.title.toLowerCase() === item.scannableItem.title.toLowerCase()) ? (
                      <View style={[styles.quickLogBtn, styles.quickLogBtnDisabled, { marginTop: 0 }]}>
                        <Check color={COLORS.accentEmerald} size={14} />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.quickLogBtn, { marginTop: 0 }]}
                        onPress={() => handleLogQuick(item)}
                      >
                        <FolderPlus color={COLORS.accentCyan} size={14} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Sheet Modals */}
      {selectedHistoryItem && activeScan && (
        <>
          <ValuationSheet
            visible={valuationVisible}
            onClose={() => {
              setValuationVisible(false);
              setSelectedHistoryItem(null);
              setActiveScan(null);
            }}
            item={activeScan}
            onSave={(updated) => {
              updateHistoryItem(selectedHistoryItem.id, updated);
              setActiveScan(updated);
            }}
            onList={() => {
              setValuationVisible(false);
              setListingVisible(true);
            }}
          />
          <ListingSheet
            visible={listingVisible}
            onClose={() => {
              setListingVisible(false);
              setSelectedHistoryItem(null);
              setActiveScan(null);
            }}
            item={activeScan}
            onSuccess={() => {
              setListingVisible(false);
              setSelectedHistoryItem(null);
              setActiveScan(null);
              Alert.alert(
                'Listing Draft Saved!',
                'Item has been listed and added to your Inventory.',
                [{ text: 'OK' }]
              );
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  capBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  capBadgeText: {
    color: COLORS.accentAmber,
    fontSize: 8,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  scrollArea: {
    flex: 1,
    padding: 16,
  },
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.12)',
    padding: 10,
    borderRadius: 10,
    gap: 8,
    alignItems: 'center',
    marginBottom: 14,
  },
  alertBannerText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  cardImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: COLORS.bgDark,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  cardMeta: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  cardDate: {
    color: COLORS.textDark,
    fontSize: 10,
    marginTop: 4,
  },
  cardStats: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  profitLabel: {
    color: COLORS.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  profitVal: {
    color: COLORS.accentEmerald,
    fontSize: 18,
    fontWeight: '800',
  },
  quickLogBtn: {
    marginTop: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.15)',
    borderRadius: 6,
    padding: 4,
  },
  quickLogBtnDisabled: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  deleteCardBtn: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.15)',
    borderRadius: 6,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
