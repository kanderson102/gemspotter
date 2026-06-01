import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  PanResponder,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Sparkles, FileText, Check, AlertCircle } from 'lucide-react-native';
import { ScannableItem, MOCK_SCANNABLE_ITEMS } from '../data/mockData';
import { useApp, InventoryItem } from '../context/AppContext';

interface ListingSheetProps {
  visible: boolean;
  onClose: () => void;
  item: ScannableItem;
  inventoryItemId?: string;
  onSuccess: () => void;
}

export const ListingSheet: React.FC<ListingSheetProps> = ({
  visible,
  onClose,
  item,
  inventoryItemId,
  onSuccess,
}) => {
  const { generateListing, logToInventory, inventory } = useApp();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(item.suggestedTitle);
  const [description, setDescription] = useState(item.suggestedDescription);
  const [tags, setTags] = useState<string[]>(item.tags);
  const [saving, setSaving] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;

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
        return gestureState.dy > 5 && !loading;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0 && !loading) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!loading && (gestureState.dy > 120 || gestureState.vy > 0.5)) {
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

  // Reset loading when modal becomes visible
  useEffect(() => {
    if (visible) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000); // 2 seconds background removal simulation
      return () => clearTimeout(timer);
    }
  }, [visible, item]);

  // Sync data when item changes
  useEffect(() => {
    setTitle(item.suggestedTitle);
    setDescription(item.suggestedDescription);
    setTags(item.tags);
  }, [item]);

  const handlePublish = async () => {
    setSaving(true);
    
    // Find or create inventory item first
    let id = inventoryItemId;
    if (!id) {
      // If it doesn't exist in inventory, add it first (costs 0 Gems)
      // and get the newly created inventory ID
      const timestamp = Date.now();
      await logToInventory(item);
      // Wait for state update to finish
      // For simulation, we can locate it by checking if it matches the title
      id = `inv-${timestamp}`; // Approximate
    }

    // Generate listing (deducts 5 Gems)
    // We pass the actual active item's ID in inventory if known
    // For simplicity of prototype, if we don't have it, we just update the latest item in inventory
    const targetId = inventoryItemId || (inventory[0] ? inventory[0].id : '');
    
    const success = await generateListing(targetId);
    
    setSaving(false);
    if (success) {
      onSuccess();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <Animated.View style={[styles.sheetContent, { transform: [{ translateY }] }]}>
          {/* Drag handle wrapper */}
          <View {...(loading ? {} : panResponder.panHandlers)} style={styles.dragHandler}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Sparkles color={COLORS.accentPurple} size={18} />
              <Text style={styles.title}>AI Listing Assistant</Text>
            </View>
            {!loading && (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={saving}>
                <Text style={styles.closeBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            /* Loading State: Background Removal Simulation */
            <View style={styles.loadingContainer}>
              <View style={styles.loadingBox}>
                <Image source={{ uri: item.imageUrl }} style={styles.loadingImage} />
                <View style={styles.scanBeam} />
              </View>
              <ActivityIndicator color={COLORS.accentCyan} size="large" style={{ marginTop: 24 }} />
              <Text style={styles.loadingTitle}>Removing Background...</Text>
              <Text style={styles.loadingSubtitle}>
                Gemspotter AI is isolating the object and writing your SEO optimized listing draft.
              </Text>
            </View>
          ) : (
            /* Editing State */
            <>
              <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {/* Image and AI info banner */}
                <View style={styles.bannerRow}>
                  <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} />
                  <View style={styles.bannerInfo}>
                    <Text style={styles.bannerHeading}>Background Isolated</Text>
                    <Text style={styles.bannerText}>
                      We have generated an optimized title, description, and keywords.
                    </Text>
                  </View>
                </View>

                {/* Draft fields */}
                <View style={styles.card}>
                  <Text style={styles.inputLabel}>SEO OPTIMIZED TITLE</Text>
                  <TextInput
                    style={styles.textInput}
                    value={title}
                    onChangeText={setTitle}
                    multiline
                    placeholder="Enter Listing Title"
                    placeholderTextColor={COLORS.textSecondary}
                  />

                  <Text style={styles.inputLabel}>SEO DESCRIPTION</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={6}
                    placeholder="Enter Listing Description"
                    placeholderTextColor={COLORS.textSecondary}
                  />

                  <Text style={styles.inputLabel}>SUGGESTED TAGS</Text>
                  <View style={styles.tagsContainer}>
                    {tags.map((tag, idx) => (
                      <View key={idx} style={styles.tagBadge}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.alertCard}>
                  <AlertCircle color={COLORS.accentAmber} size={16} />
                  <Text style={styles.alertText}>
                    Clicking "Save & List" will charge <Text style={{ fontWeight: '700', color: 'white' }}>5 Gems</Text> and log this item as <Text style={{ color: COLORS.accentCyan, fontWeight: '700' }}>"Listed"</Text> in your local inventory.
                  </Text>
                </View>
                <View style={{ height: 40 }} />
              </ScrollView>

              {/* Action Buttons */}
              <SafeAreaView style={styles.actionCenter}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.publishBtn]}
                  onPress={handlePublish}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={COLORS.bgDeep} size="small" />
                  ) : (
                    <>
                      <Check color={COLORS.bgDeep} size={18} />
                      <Text style={styles.publishBtnText}>Save & List Draft</Text>
                    </>
                  )}
                </TouchableOpacity>
              </SafeAreaView>
            </>
          )}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  closeBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingBox: {
    width: 160,
    height: 160,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.bgCard,
  },
  loadingImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  scanBeam: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.accentCyan,
    boxShadow: '0 0 10px #00f0ff',
    top: '30%', // Simulated position
  },
  loadingTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 18,
  },
  loadingSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  bannerRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 240, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.1)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  bannerImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bannerInfo: {
    flex: 1,
  },
  bannerHeading: {
    color: COLORS.accentCyan,
    fontSize: 13,
    fontWeight: '700',
  },
  bannerText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tagBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tagText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    alignItems: 'center',
  },
  alertText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  actionCenter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    padding: 16,
    backgroundColor: COLORS.bgDark,
  },
  actionBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  publishBtn: {
    backgroundColor: COLORS.accentPurple,
  },
  publishBtnText: {
    color: COLORS.bgDeep,
    fontWeight: '700',
    fontSize: 13,
  },
  dragHandler: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
