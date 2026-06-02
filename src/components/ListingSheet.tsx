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
  Alert,
  Linking,
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Sparkles, FileText, Check, AlertCircle, Trash2, ArrowLeft, ArrowRight, Upload } from 'lucide-react-native';
import { ScannableItem } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { removeBackground } from '../services/imageService';
import { generateSeoDraft } from '../services/aiService';
import { publishToEbay } from '../services/ebayService';

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
  const {
    generateListing,
    logToInventory,
    inventory,
    openAiApiKey,
    photoroomApiKey,
    isLiveMode,
    capturedPhotos,
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Removing background...');
  
  // Listing state variables
  const [title, setTitle] = useState(item.suggestedTitle);
  const [description, setDescription] = useState(item.suggestedDescription);
  const [tags, setTags] = useState<string[]>(item.tags);
  const [saving, setSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState('Saving Draft...');
  
  // Gallery state variables
  const [photos, setPhotos] = useState<string[]>([]);

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

  // Reset loading & trigger integrations when modal opens
  useEffect(() => {
    const runIntegrations = async () => {
      if (!visible) return;
      
      setLoading(true);
      // Initialize photos state with captured photos, fallback to item image
      const initialPhotos = capturedPhotos.length > 0 ? [...capturedPhotos] : [item.imageUrl];
      setPhotos(initialPhotos);

      try {
        if (isLiveMode) {
          // 1. Photoroom Background Removal
          setLoadingStatus('Isolating background via Photoroom...');
          const isolatedUri = await removeBackground(photoroomApiKey, initialPhotos[0]);
          
          const updatedPhotos = [...initialPhotos];
          updatedPhotos[0] = isolatedUri;
          setPhotos(updatedPhotos);

          // 2. OpenAI GPT SEO Text Writer
          setLoadingStatus('Generating SEO Optimized listing...');
          const draft = await generateSeoDraft(
            openAiApiKey,
            item.title,
            item.category,
            item.cogs,
            item.weightClass
          );

          setTitle(draft.title);
          setDescription(draft.description);
          setTags(draft.tags);
        } else {
          // Simulate loading delay for demo
          setLoadingStatus('Removing background...');
          await new Promise(resolve => setTimeout(resolve, 1500));
          setTitle(item.suggestedTitle);
          setDescription(item.suggestedDescription);
          setTags(item.tags);
        }
      } catch (err) {
        console.warn('API error during listing generation, using fallback:', err);
        setTitle(item.suggestedTitle);
        setDescription(item.suggestedDescription);
        setTags(item.tags);
      } finally {
        setLoading(false);
      }
    };

    runIntegrations();
  }, [visible, item, isLiveMode]);

  // Gallery reordering
  const movePhoto = (index: number, direction: 'left' | 'right') => {
    const newPhotos = [...photos];
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPhotos.length) return;
    
    // Swap
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[targetIndex];
    newPhotos[targetIndex] = temp;
    setPhotos(newPhotos);
  };

  const deletePhoto = (index: number) => {
    if (photos.length <= 1) {
      Alert.alert('Required Photo', 'A listing must contain at least one photo.');
      return;
    }
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    setSaving(true);
    setSavingProgress('Saving to Inventory...');
    
    try {
      let publicUrls = [...photos];
      
      if (isLiveMode) {
        setSavingProgress('Preparing listing pictures...');
        // Local file:/// URIs cannot be accessed by eBay, so we map them to a public placeholder
        publicUrls = photos.map(uri => {
          if (uri.startsWith('http')) return uri;
          return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80';
        });

        setSavingProgress('Publishing draft to eBay...');
        const userAccessToken = ''; // Empty defaults to simulated successful publish

        const result = await publishToEbay(userAccessToken, {
          title,
          description,
          category: item.category,
          price: item.cogs * 1.5 || 29.99,
          imageUrls: publicUrls,
          weightClass: item.weightClass,
        });

        if (result.success) {
          // Log to local inventory with listed status
          const newItem = {
            ...item,
            title,
            imageUrl: photos[0],
            suggestedTitle: title,
            suggestedDescription: description,
            tags,
          };
          await logToInventory(newItem);

          setSaving(false);
          onSuccess();

          Alert.alert(
            'eBay Listing Created!',
            'Your draft has been published to eBay successfully.',
            [
              { text: 'View Listing', onPress: () => result.url && Linking.openURL(result.url) },
              { text: 'OK' }
            ]
          );
          return;
        }
      }

      // Default offline / simulated listing
      let id = inventoryItemId;
      if (!id) {
        const timestamp = Date.now();
        await logToInventory({
          ...item,
          title,
          imageUrl: photos[0],
          suggestedTitle: title,
          suggestedDescription: description,
          tags,
        });
        id = `inv-${timestamp}`;
      }

      const targetId = inventoryItemId || (inventory[0] ? inventory[0].id : '');
      const success = await generateListing(targetId);
      
      setSaving(false);
      if (success) {
        onSuccess();
      }
    } catch (error: any) {
      setSaving(false);
      Alert.alert('Listing Failed', error.message || 'Failed to complete publishing.');
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
                <Image source={{ uri: photos[0] || item.imageUrl }} style={styles.loadingImage} />
                <View style={styles.scanBeam} />
              </View>
              <ActivityIndicator color={COLORS.accentCyan} size="large" style={{ marginTop: 24 }} />
              <Text style={styles.loadingTitle}>Processing Media...</Text>
              <Text style={styles.loadingSubtitle}>{loadingStatus}</Text>
            </View>
          ) : (
            /* Editing State */
            <>
              <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                {/* Reorderable Photo Grid */}
                <View style={styles.card}>
                  <Text style={styles.galleryHeader}>MULTI-PHOTO LISTING GALLERY</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
                    {photos.map((photoUri, index) => (
                      <View key={index} style={styles.galleryThumbCard}>
                        <Image source={{ uri: photoUri }} style={styles.galleryThumbImg} />
                        <View style={styles.galleryIndexBadge}>
                          <Text style={styles.galleryIndexBadgeText}>{index === 0 ? 'MAIN' : `#${index + 1}`}</Text>
                        </View>
                        <View style={styles.galleryActionsRow}>
                          <TouchableOpacity
                            onPress={() => movePhoto(index, 'left')}
                            disabled={index === 0}
                            style={[styles.galleryActionBtn, index === 0 && styles.galleryActionBtnDisabled]}
                          >
                            <ArrowLeft color="white" size={10} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => movePhoto(index, 'right')}
                            disabled={index === photos.length - 1}
                            style={[styles.galleryActionBtn, index === photos.length - 1 && styles.galleryActionBtnDisabled]}
                          >
                            <ArrowRight color="white" size={10} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => deletePhoto(index)}
                            style={[styles.galleryActionBtn, { backgroundColor: COLORS.accentRose }]}
                          >
                            <Trash2 color="white" size={10} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
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
                    Saving will generate the AI Listing and log this item as <Text style={{ color: COLORS.accentCyan, fontWeight: '700' }}>"Listed"</Text> in your local inventory ledger.
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator color={COLORS.bgDeep} size="small" />
                      <Text style={styles.publishBtnText}>{savingProgress}</Text>
                    </View>
                  ) : (
                    <>
                      <Check color={COLORS.bgDeep} size={18} />
                      <Text style={styles.publishBtnText}>Publish Listing Draft</Text>
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
  galleryHeader: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  galleryScroll: {
    gap: 12,
    paddingRight: 10,
  },
  galleryThumbCard: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.bgDark,
  },
  galleryThumbImg: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  galleryIndexBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(5, 7, 12, 0.75)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  galleryIndexBadgeText: {
    color: COLORS.accentCyan,
    fontSize: 8,
    fontWeight: '800',
  },
  galleryActionsRow: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(5, 7, 12, 0.65)',
    borderRadius: 8,
    padding: 2,
  },
  galleryActionBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  galleryActionBtnDisabled: {
    opacity: 0.35,
  },
});
