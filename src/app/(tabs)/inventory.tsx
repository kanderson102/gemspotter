import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useApp, InventoryItem } from '../../context/AppContext';
import { COLORS } from '../../constants/theme';
import {
  Plus,
  TrendingUp,
  DollarSign,
  Package,
  Layers,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Tag,
  Camera,
  Upload,
} from 'lucide-react-native';
import { ListingSheet } from '../../components/ListingSheet';
import { MOCK_SCANNABLE_ITEMS } from '../../data/mockData';
import * as ImagePicker from 'expo-image-picker';

const SHIPPING_COSTS = {
  Small: 6.00,
  Medium: 12.00,
  Large: 25.00,
};

export default function InventoryScreen() {
  const {
    inventory,
    addManualInventory,
    markAsSold,
    deleteInventoryItem,
    isLiveMode,
  } = useApp();

  const [filter, setFilter] = useState<'All' | 'sourced' | 'listed' | 'sold'>('All');
  
  // Modals visibility
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [soldModalVisible, setSoldModalVisible] = useState(false);
  const [listingSheetVisible, setListingSheetVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Manual Add Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [cogs, setCogs] = useState('');
  const [weightClass, setWeightClass] = useState<'Small' | 'Medium' | 'Large'>('Medium');
  const [description, setDescription] = useState('');
  const [manualImage, setManualImage] = useState<string | null>(null);

  const handleSelectManualPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setManualImage(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Failed to launch image library:', e);
      Alert.alert('Error', 'Failed to open photo library.');
    }
  };

  const handleTakeManualPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setManualImage(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Failed to launch camera:', e);
      Alert.alert('Error', 'Failed to open camera.');
    }
  };

  // Sold Form State
  const [soldPrice, setSoldPrice] = useState('');
  const [shippingCost, setShippingCost] = useState('');

  const activeInventory = isLiveMode ? inventory.filter((item) => !item.isMock) : inventory;

  // Calculate Business Analytics
  const totalItems = activeInventory.length;
  const soldItems = activeInventory.filter((item) => item.status === 'sold');
  const soldCount = soldItems.length;

  const totalCogs = activeInventory.reduce((sum, item) => sum + item.cogs, 0);

  // Calculate Net Profits
  const totalNetProfit = soldItems.reduce((sum, item) => {
    const salePrice = item.soldPrice || 0;
    const itemCogs = item.cogs;
    const shipCost = item.shippingCost || 0;
    const fees = salePrice * 0.1325;
    return sum + (salePrice - itemCogs - shipCost - fees);
  }, 0);

  // Sell-through rate
  const sellThroughRate = totalItems > 0 ? (soldCount / totalItems) * 100 : 0;

  // Average ROI
  const totalSoldCogs = soldItems.reduce((sum, item) => sum + item.cogs, 0);
  const averageRoi = totalSoldCogs > 0 ? (totalNetProfit / totalSoldCogs) * 100 : 0;

  const filteredItems = activeInventory.filter((item) => {
    if (filter === 'All') return true;
    return item.status === filter;
  });

  const handleManualAdd = () => {
    if (!title || !category || !cogs) {
      Alert.alert('Missing Info', 'Please fill in Title, Category, and Cost.');
      return;
    }
    const costNum = parseFloat(cogs);
    if (isNaN(costNum)) {
      Alert.alert('Invalid Cost', 'Cost of goods sold must be a valid number.');
      return;
    }

    addManualInventory(title, category, costNum, weightClass, description, manualImage || undefined);
    
    // Clear form & close
    setTitle('');
    setCategory('');
    setCogs('');
    setWeightClass('Medium');
    setDescription('');
    setManualImage(null);
    setAddModalVisible(false);
  };

  const handleMarkAsSoldPress = (item: InventoryItem) => {
    setSelectedItem(item);
    // Autofill shipping defaults
    setShippingCost(SHIPPING_COSTS[item.weightClass].toString());
    setSoldPrice('');
    setSoldModalVisible(true);
  };

  const handleSaveSold = () => {
    if (!selectedItem) return;
    if (!soldPrice.trim()) {
      Alert.alert('Missing Price', 'Please enter a sold price.');
      return;
    }
    const priceNum = parseFloat(soldPrice);
    const shipNum = parseFloat(shippingCost) || 0;

    if (isNaN(priceNum)) {
      Alert.alert('Invalid Price', 'Please enter a valid sold price.');
      return;
    }

    markAsSold(selectedItem.id, priceNum, shipNum);
    setSoldPrice('');
    setShippingCost('');
    setSoldModalVisible(false);
    setSelectedItem(null);
  };

  const handleListingSheetOpen = (item: InventoryItem) => {
    setSelectedItem(item);
    setListingSheetVisible(true);
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to remove this item from your inventory?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteInventoryItem(id) },
      ]
    );
  };

  // Find scannable item reference for listing generator
  const getScannableRef = (item: InventoryItem) => {
    const matched = MOCK_SCANNABLE_ITEMS.find((m) => m.title.toLowerCase().includes(item.title.toLowerCase()) || item.title.toLowerCase().includes(m.title.toLowerCase()));
    return matched || MOCK_SCANNABLE_ITEMS[0];
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Inventory Log</Text>
          <Text style={styles.subtitle}>BUSINESS LEDGER</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddModalVisible(true)}
        >
          <Plus color={COLORS.bgDeep} size={16} />
          <Text style={styles.addBtnText}>Add Manual</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Analytics Section */}
        <View style={styles.analyticsSection}>
          <Text style={styles.sectionHeader}>Business Health</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.analyticsScroll}
          >
            {/* Stat 1 */}
            <View style={styles.statCard}>
              <View style={styles.statIconCircle}>
                <DollarSign color={COLORS.accentEmerald} size={18} />
              </View>
              <Text style={styles.statLabel}>Net Profit</Text>
              <Text style={styles.statValue}>${totalNetProfit.toFixed(2)}</Text>
            </View>

            {/* Stat 2 */}
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(0, 240, 255, 0.08)' }]}>
                <TrendingUp color={COLORS.accentCyan} size={18} />
              </View>
              <Text style={styles.statLabel}>Sell-Through</Text>
              <Text style={styles.statValue}>{sellThroughRate.toFixed(0)}%</Text>
            </View>

            {/* Stat 3 */}
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(192, 132, 252, 0.08)' }]}>
                <Layers color={COLORS.accentPurple} size={18} />
              </View>
              <Text style={styles.statLabel}>Avg ROI</Text>
              <Text style={styles.statValue}>{averageRoi.toFixed(0)}%</Text>
            </View>

            {/* Stat 4 */}
            <View style={styles.statCard}>
              <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.08)' }]}>
                <Package color={COLORS.accentAmber} size={18} />
              </View>
              <Text style={styles.statLabel}>Active Stock</Text>
              <Text style={styles.statValue}>{totalItems - soldCount}</Text>
            </View>
          </ScrollView>
        </View>

        {/* Filters bar */}
        <View style={styles.filtersBar}>
          {(['All', 'sourced', 'listed', 'sold'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterTab,
                filter === status && styles.filterTabActive,
              ]}
              onPress={() => setFilter(status)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filter === status && styles.filterTabTextActive,
                ]}
              >
                {status === 'All' ? 'All' : status.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List items */}
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items found matching filter</Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemMeta}>
                  COGS: ${item.cogs.toFixed(2)} • {item.weightClass} weight
                </Text>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'sourced' && styles.badgeSourced,
                      item.status === 'listed' && styles.badgeListed,
                      item.status === 'sold' && styles.badgeSold,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        item.status === 'sourced' && { color: COLORS.accentAmber },
                        item.status === 'listed' && { color: COLORS.accentCyan },
                        item.status === 'sold' && { color: COLORS.accentEmerald },
                      ]}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action columns */}
              <View style={styles.itemActions}>
                {item.status === 'sourced' && (
                  <TouchableOpacity
                    style={styles.actionBtnIcon}
                    onPress={() => handleListingSheetOpen(item)}
                  >
                    <ExternalLink color={COLORS.accentPurple} size={16} />
                    <Text style={styles.actionBtnLabel}>AI List</Text>
                  </TouchableOpacity>
                )}

                {(item.status === 'sourced' || item.status === 'listed') && (
                  <TouchableOpacity
                    style={styles.actionBtnIcon}
                    onPress={() => handleMarkAsSoldPress(item)}
                  >
                    <CheckCircle2 color={COLORS.accentEmerald} size={16} />
                    <Text style={styles.actionBtnLabel}>Sell</Text>
                  </TouchableOpacity>
                )}

                {item.status === 'sold' && (
                  <View style={styles.soldValueCol}>
                    <Text style={styles.soldValueLabel}>Price Sold</Text>
                    <Text style={styles.soldValueAmt}>
                      ${item.soldPrice?.toFixed(2)}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteItem(item.id)}
                >
                  <Trash2 color={COLORS.accentRose} size={15} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL: Manual Add */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%' }]}>
            <Text style={styles.modalTitle}>Manual Add to Inventory</Text>
            
            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>ITEM TITLE</Text>
              <TextInput
                style={styles.formInput}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Nike Shoes"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.formLabel}>CATEGORY</Text>
              <TextInput
                style={styles.formInput}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g., Clothing > Shoes"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.formLabel}>COGS (COST OF GOODS SOLD)</Text>
              <TextInput
                style={styles.formInput}
                value={cogs}
                onChangeText={setCogs}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.formLabel}>SHIPPING SIZE</Text>
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

              <Text style={styles.formLabel}>ITEM PHOTO (OPTIONAL)</Text>
              {manualImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: manualImage }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setManualImage(null)}
                  >
                    <Text style={styles.removeImageBtnText}>Remove Photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imageUploadGrid}>
                  <TouchableOpacity
                    style={styles.imageUploadBtn}
                    onPress={handleTakeManualPhoto}
                  >
                    <Camera size={16} color={COLORS.accentCyan} />
                    <Text style={styles.imageUploadBtnText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.imageUploadBtn}
                    onPress={handleSelectManualPhoto}
                  >
                    <Upload size={16} color={COLORS.accentCyan} />
                    <Text style={styles.imageUploadBtnText}>Upload Photo</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.formLabel}>DESCRIPTION (OPTIONAL)</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholder="Add notes..."
                placeholderTextColor={COLORS.textSecondary}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleManualAdd}
              >
                <Text style={styles.saveBtnText}>Save Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: Mark as Sold */}
      <Modal visible={soldModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mark Item as Sold</Text>
            
            <View style={styles.soldForm}>
              <Text style={styles.formLabel}>SOLD PRICE</Text>
              <TextInput
                style={styles.formInput}
                value={soldPrice}
                onChangeText={setSoldPrice}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.formLabel}>ACTUAL SHIPPING COST</Text>
              <TextInput
                style={styles.formInput}
                value={shippingCost}
                onChangeText={setShippingCost}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setSoldModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn, { backgroundColor: COLORS.accentEmerald }]}
                onPress={handleSaveSold}
              >
                <Text style={styles.saveBtnText}>Record Sale</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* LISTING SHEET MODAL */}
      {selectedItem && listingSheetVisible && (
        <ListingSheet
          visible={listingSheetVisible}
          onClose={() => {
            setListingSheetVisible(false);
            setSelectedItem(null);
          }}
          item={getScannableRef(selectedItem)}
          inventoryItemId={selectedItem.id}
          onSuccess={() => {
            setListingSheetVisible(false);
            setSelectedItem(null);
            Alert.alert('Success', 'AI Listing Draft saved successfully!');
          }}
        />
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentCyan,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: COLORS.bgDeep,
    fontSize: 11,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
    padding: 16,
  },
  analyticsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  analyticsScroll: {
    gap: 10,
    paddingRight: 20,
  },
  statCard: {
    width: 110,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 14,
    padding: 12,
    alignItems: 'flex-start',
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  filtersBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  filterTabText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
  filterTabTextActive: {
    color: COLORS.textPrimary,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.bgDark,
  },
  itemInfo: {
    flex: 1.2,
    marginLeft: 12,
  },
  itemTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  itemMeta: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  statusBadge: {
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 0.5,
  },
  badgeSourced: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  badgeListed: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderColor: 'rgba(0, 240, 255, 0.2)',
  },
  badgeSold: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: '700',
  },
  itemActions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionBtnIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionBtnLabel: {
    color: COLORS.textSecondary,
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
  soldValueCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 4,
  },
  soldValueLabel: {
    color: COLORS.textSecondary,
    fontSize: 8,
  },
  soldValueAmt: {
    color: COLORS.accentEmerald,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxHeight: '70%',
    display: 'flex',
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontFamily: 'Outfit',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalForm: {
    flex: 1,
  },
  soldForm: {
    marginBottom: 8,
  },
  formLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  formInput: {
    backgroundColor: 'rgba(5, 7, 12, 0.5)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 10,
    padding: 10,
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  weightToggleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
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
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: COLORS.accentCyan,
  },
  saveBtnText: {
    color: COLORS.bgDeep,
    fontWeight: '700',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.bgDark,
  },
  removeImageBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  removeImageBtnText: {
    color: COLORS.accentRose,
    fontSize: 11,
    fontWeight: '700',
  },
  imageUploadGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  imageUploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 10,
    paddingVertical: 10,
  },
  imageUploadBtnText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  shippingExplanation: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 4,
    marginBottom: 12,
    fontStyle: 'italic',
    lineHeight: 14,
  },
});
