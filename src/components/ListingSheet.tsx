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
import { Sparkles, FileText, Check, AlertCircle, Trash2, ArrowLeft, ArrowRight, Upload, Cpu, Camera, Plus } from 'lucide-react-native';
import { ScannableItem } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { removeBackground } from '../services/imageService';
import { generateSeoDraft } from '../services/aiService';
import { publishToEbay, refreshEbayUserToken } from '../services/ebayService';

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
    inventory,
    logToInventory,
    generateListing,
    capturedPhotos,
    isLiveMode,
    photoroomApiKey,
    openAiApiKey,
    ebayClientId,
    ebayClientSecret,
    ebayUserToken,
    setEbayUserToken,
    ebayRefreshToken,
    ebayTokenExpiresAt,
    setEbayTokenExpiresAt,
    aiProvider,
    aiModel,
    anthropicApiKey,
    ebayFulfillmentPolicyId,
    ebayPaymentPolicyId,
    ebayReturnPolicyId,
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Removing background...');
  
  // Listing state variables
  const [title, setTitle] = useState(item.suggestedTitle);
  const [description, setDescription] = useState(item.suggestedDescription);
  const [tags, setTags] = useState<string[]>(item.tags);
  const [saving, setSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState('Saving Draft...');
  const [category, setCategory] = useState(item.category);
  const [price, setPrice] = useState('');
  const [weightClass, setWeightClass] = useState<'Small' | 'Medium' | 'Large'>(item.weightClass);
  const [newTagText, setNewTagText] = useState('');

  const handleAddTag = () => {
    const trimmed = newTagText.trim().toLowerCase();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setNewTagText('');
      return;
    }
    setTags([...tags, trimmed]);
    setNewTagText('');
  };
  
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

  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);

  const handleRemoveBackground = async () => {
    if (!photoroomApiKey || photoroomApiKey.trim() === '') {
      Alert.alert(
        'Photoroom Key Required',
        'Please configure your Photoroom API Key in the Settings page first.'
      );
      return;
    }
    
    setIsRemovingBackground(true);
    try {
      const isolatedUri = await removeBackground(photoroomApiKey, photos[0]);
      const updatedPhotos = [...photos];
      updatedPhotos[0] = isolatedUri;
      setPhotos(updatedPhotos);
      Alert.alert('Success', 'Background isolated successfully!');
    } catch (err: any) {
      console.error(err);
      Alert.alert('API Error', err.message || 'Photoroom background removal failed.');
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const handleGenerateSeo = async () => {
    const activeKey = aiProvider === 'openai' ? openAiApiKey : anthropicApiKey;
    if (!activeKey || activeKey.trim() === '') {
      Alert.alert(
        'API Key Required',
        `Please configure your ${aiProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API Key in the Settings page first.`
      );
      return;
    }

    setIsGeneratingSeo(true);
    try {
      const draft = await generateSeoDraft(
        activeKey,
        item.title,
        category,
        item.cogs,
        weightClass,
        undefined,
        aiProvider,
        aiModel
      );
      setTitle(draft.title || title);
      setDescription(draft.description || description);
      setTags(draft.tags || tags);
      Alert.alert('Success', 'SEO optimized details generated!');
    } catch (err: any) {
      console.error(err);
      Alert.alert('API Error', err.message || 'AI SEO text generation failed.');
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  // Reset loading & load suggestions when modal opens
  useEffect(() => {
    if (visible) {
      setLoading(true);
      const initialPhotos = capturedPhotos.length > 0 ? [...capturedPhotos] : [item.imageUrl];
      setPhotos(initialPhotos);
      setTitle(item.suggestedTitle || item.title);
      setDescription(item.suggestedDescription || '');
      setTags(item.tags || []);
      setCategory(item.category);
      setWeightClass(item.weightClass);
      
      const compsCount = item.comps ? item.comps.length : 0;
      const avgPrice = compsCount > 0 ? item.comps.reduce((sum, comp) => sum + comp.price, 0) / compsCount : 0;
      const suggestedPrice = avgPrice > 0 ? avgPrice : (item.cogs > 0 ? item.cogs * 1.5 : 29.99);
      setPrice(suggestedPrice.toFixed(2));
      
      setLoading(false);
    }
  }, [visible]);

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
    if (isLiveMode && !ebayUserToken) {
      Alert.alert(
        'Account Not Linked',
        'Please link your eBay seller account in Settings first to publish live drafts.'
      );
      return;
    }

    setSaving(true);
    setSavingProgress('Saving to Inventory...');
    
    try {
      let publicUrls = [...photos];
      
      if (isLiveMode) {
        let activeToken = ebayUserToken;
        const expiresAtNum = parseFloat(ebayTokenExpiresAt) || 0;
        
        // Refresh token if expired or close to expiring (within 2 minutes)
        if (Date.now() > expiresAtNum - 120000) {
          setSavingProgress('Refreshing eBay seller session...');
          try {
            const refreshed = await refreshEbayUserToken(
              ebayClientId,
              ebayClientSecret,
              ebayRefreshToken
            );
            await setEbayUserToken(refreshed.accessToken);
            await setEbayTokenExpiresAt(refreshed.expiresAt.toString());
            activeToken = refreshed.accessToken;
          } catch (e: any) {
            console.error('Failed to refresh eBay token:', e);
            Alert.alert('eBay Session Expired', 'Please link your eBay seller account in Settings again.');
            setSaving(false);
            return;
          }
        }

        setSavingProgress('Preparing listing pictures...');
        // Local file:/// URIs cannot be accessed by eBay, so we map them to a public placeholder
        publicUrls = photos.map(uri => {
          if (uri.startsWith('http')) return uri;
          return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80';
        });

        setSavingProgress('Publishing draft to eBay...');
        const result = await publishToEbay(ebayClientId, activeToken, {
          title,
          description,
          category: category,
          price: parseFloat(price) || item.cogs * 1.5 || 29.99,
          imageUrls: publicUrls,
          weightClass: weightClass,
          fulfillmentPolicyId: ebayFulfillmentPolicyId || undefined,
          paymentPolicyId: ebayPaymentPolicyId || undefined,
          returnPolicyId: ebayReturnPolicyId || undefined,
        });

        if (result.success) {
          if (inventoryItemId) {
            // Update the existing item to listed
            await generateListing(inventoryItemId, title, description, tags, photos[0], 'listed', category, weightClass);
          } else {
            // Log to local inventory with listed status
            const newItemId = await logToInventory({
              ...item,
              title,
              imageUrl: photos[0],
              suggestedTitle: title,
              suggestedDescription: description,
              tags,
              category,
              weightClass,
            });
            await generateListing(newItemId, title, description, tags, photos[0], 'listed', category, weightClass);
          }

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
        id = await logToInventory({
          ...item,
          title,
          imageUrl: photos[0],
          suggestedTitle: title,
          suggestedDescription: description,
          tags,
          category,
          weightClass,
        });
      }

      const success = await generateListing(id, title, description, tags, photos[0], 'listed', category, weightClass);
      
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

                {/* AI Magic Actions Row */}
                <View style={styles.aiMagicRow}>
                  <TouchableOpacity
                    style={[styles.aiMagicBtn, isRemovingBackground && styles.aiMagicBtnDisabled]}
                    onPress={handleRemoveBackground}
                    disabled={isRemovingBackground}
                  >
                    {isRemovingBackground ? (
                      <ActivityIndicator color={COLORS.accentCyan} size="small" />
                    ) : (
                      <Camera color={COLORS.accentCyan} size={14} />
                    )}
                    <Text style={styles.aiMagicBtnText}>
                      {isRemovingBackground ? 'Isolating...' : 'Remove Background'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.aiMagicBtn, isGeneratingSeo && styles.aiMagicBtnDisabled]}
                    onPress={handleGenerateSeo}
                    disabled={isGeneratingSeo}
                  >
                    {isGeneratingSeo ? (
                      <ActivityIndicator color={COLORS.accentPurple} size="small" />
                    ) : (
                      <Cpu color={COLORS.accentPurple} size={14} />
                    )}
                    <Text style={styles.aiMagicBtnText}>
                      {isGeneratingSeo ? 'Generating...' : 'AI SEO Text'}
                    </Text>
                  </TouchableOpacity>
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

                  <Text style={styles.inputLabel}>SUGGESTED TAGS (TAP TO REMOVE)</Text>
                  <View style={styles.tagsContainer}>
                    {tags.map((tag, idx) => (
                      <TouchableOpacity 
                        key={idx} 
                        style={styles.tagBadge}
                        onPress={() => setTags(tags.filter((_, i) => i !== idx))}
                      >
                        <Text style={styles.tagText}>#{tag} ✕</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.addTagRow}>
                    <TextInput
                      style={styles.addTagInput}
                      value={newTagText}
                      onChangeText={setNewTagText}
                      placeholder="Add tag..."
                      placeholderTextColor={COLORS.textSecondary}
                      onSubmitEditing={handleAddTag}
                    />
                    <TouchableOpacity style={styles.addTagBtn} onPress={handleAddTag}>
                      <Plus color={COLORS.accentCyan} size={14} />
                      <Text style={styles.addTagBtnText}>Add</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>LISTING CATEGORY</Text>
                  <TextInput
                    style={styles.textInput}
                    value={category}
                    onChangeText={setCategory}
                    placeholder="e.g. 11450 or Clothing > Jackets"
                    placeholderTextColor={COLORS.textSecondary}
                  />

                  <Text style={styles.inputLabel}>LISTING PRICE (USD)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                  <Text style={styles.priceSuggestionText}>
                    {item.comps && item.comps.length > 0
                      ? `Suggested: $${(item.comps.reduce((sum, comp) => sum + comp.price, 0) / item.comps.length).toFixed(2)} (based on eBay sold comps)`
                      : `Suggested: $${(item.cogs * 1.5 || 29.99).toFixed(2)} (markup estimate)`}
                  </Text>

                  <Text style={styles.inputLabel}>SHIPPING SIZE (WEIGHT CLASS)</Text>
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
                          {size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={[styles.alertCard, { backgroundColor: 'rgba(0, 240, 255, 0.04)', borderColor: 'rgba(0, 240, 255, 0.15)' }]}>
                  <AlertCircle color={COLORS.accentCyan} size={16} />
                  <Text style={styles.alertText}>
                    <Text style={{ fontWeight: '700', color: COLORS.accentCyan }}>eBay Listing Guide:</Text>{'\n'}
                    • <Text style={{ fontWeight: '600', color: COLORS.textPrimary }}>Shipping Policies:</Text> Configured on your eBay account profile. The Shipping Size selected determines estimated net profits locally.{'\n'}
                    • <Text style={{ fontWeight: '600', color: COLORS.textPrimary }}>Sandbox Environment:</Text> In Sandbox/Simulated mode, publishing generates mock public picture URLs and maps standard placeholder policies. Arbitrary search queries return 0 sold comps because the Sandbox catalog is limited.
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
  aiMagicRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  aiMagicBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 12,
    paddingVertical: 10,
  },
  aiMagicBtnDisabled: {
    opacity: 0.5,
  },
  aiMagicBtnText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  addTagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 12,
  },
  addTagInput: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.5)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    color: 'white',
    fontSize: 12,
  },
  addTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  addTagBtnText: {
    color: COLORS.accentCyan,
    fontSize: 11,
    fontWeight: '700',
  },
  priceSuggestionText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    marginTop: 4,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  weightToggleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
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
});
