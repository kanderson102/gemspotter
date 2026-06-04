import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Database, HelpCircle, RefreshCw, Zap } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import { ListingSheet } from '../../components/ListingSheet';
import { OnboardingModal } from '../../components/OnboardingModal';
import { ValuationSheet } from '../../components/ValuationSheet';
import { COLORS } from '../../constants/theme';
import { useApp } from '../../context/AppContext';
import { MOCK_SCANNABLE_ITEMS, ScannableItem } from '../../data/mockData';
import { recognizeItem } from '../../services/aiService';

export default function SourcingCameraScreen() {
  const {
    performScan,
    activeScan,
    setActiveScan,
    openAiApiKey,
    isLiveMode,
    capturedPhotos,
    addCapturedPhoto,
    removeCapturedPhoto,
    clearCapturedPhotos,
    setOpenAiApiKey,
    setEbayClientId,
    setEbayClientSecret,
    setPhotoroomApiKey,
    setIsLiveMode,
    aiProvider,
    aiModel,
    anthropicApiKey,
  } = useApp();

  const [selectedMock, setSelectedMock] = useState<ScannableItem>(MOCK_SCANNABLE_ITEMS[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('Standby');
  const [flashActive, setFlashActive] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [zoom, setZoom] = useState(0);

  const baseZoom = useRef(0);

  const onPinchGestureEvent = (event: any) => {
    const scale = event.nativeEvent.scale;
    let nextZoom = baseZoom.current + (scale - 1) * 0.8;
    nextZoom = Math.max(0, Math.min(1, nextZoom));
    setZoom(nextZoom);
  };

  const onPinchHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      baseZoom.current = zoom;
    }
  };

  const cycleZoom = () => {
    let nextZoom = 0;
    if (zoom < 0.1) nextZoom = 0.2; // 2x
    else if (zoom < 0.3) nextZoom = 0.4; // 3x
    else if (zoom < 0.6) nextZoom = 0.8; // 5x
    else nextZoom = 0.0; // 1x

    setZoom(nextZoom);
    baseZoom.current = nextZoom;
  };

  const getZoomLabel = () => {
    const multiplier = 1 + zoom * 5;
    if (multiplier <= 1.01) return '1x';
    return `${multiplier.toFixed(1)}x`;
  };

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);

  // Onboarding Visibility
  const [onboardingVisible, setOnboardingVisible] = useState(false);

  // Sheets Visibility
  const [valuationVisible, setValuationVisible] = useState(false);
  const [listingVisible, setListingVisible] = useState(false);

  // Focus visual indicator coordinate state
  const [focusCoords, setFocusCoords] = useState<{ x: number; y: number } | null>(null);

  // Mock Objects Selector Visibility
  const [showMockList, setShowMockList] = useState(false);

  // Animated values
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacityAnim = useRef(new Animated.Value(0.15)).current;
  const focusScaleAnim = useRef(new Animated.Value(1)).current;

  // Set default showMockList based on camera permissions
  useEffect(() => {
    if (permission) {
      setShowMockList(!permission.granted);
    }
  }, [permission]);

  // Check onboarding status
  useEffect(() => {
    const checkOnboarding = async () => {
      const onboarded = await AsyncStorage.getItem('@gemspotter_onboarded');
      if (onboarded !== 'true') {
        setOnboardingVisible(true);
      }
    };
    checkOnboarding();
  }, []);

  const handleOnboardingComplete = async (config: any) => {
    try {
      await setOpenAiApiKey(config.openAiApiKey);
      await setEbayClientId(config.ebayClientId);
      await setEbayClientSecret(config.ebayClientSecret);
      await setPhotoroomApiKey(config.photoroomApiKey);
      await setIsLiveMode(config.isLiveMode);

      await AsyncStorage.setItem('@gemspotter_onboarded', 'true');
      setOnboardingVisible(false);
      Alert.alert('Onboarding Complete', 'Your credentials have been securely saved.');
    } catch (e) {
      console.error('Failed to save onboarding credentials', e);
    }
  };

  // Scanner animation loop
  useEffect(() => {
    if (isScanning) {
      // Loop scan line up and down
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 260,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulse the grid overlay
      Animated.loop(
        Animated.sequence([
          Animated.timing(overlayOpacityAnim, {
            toValue: 0.4,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(overlayOpacityAnim, {
            toValue: 0.15,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanLineAnim.setValue(0);
      overlayOpacityAnim.setValue(0.15);
      scanLineAnim.stopAnimation();
      overlayOpacityAnim.stopAnimation();
    }
  }, [isScanning]);

  const handleTapToFocus = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setFocusCoords({ x: locationX, y: locationY });
    focusScaleAnim.setValue(1.5);
    Animated.spring(focusScaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // Fade out focus box after 1 second
    setTimeout(() => {
      setFocusCoords(null);
    }, 1000);
  };

  const handleCapturePhoto = async () => {
    if (!permission || !permission.granted) {
      const askResult = await requestPermission();
      if (!askResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to capture items.');
        return;
      }
    }

    if (capturedPhotos.length >= 12) {
      Alert.alert('Limit Reached', 'You can capture up to 12 photos of an item.');
      return;
    }

    if (cameraRef.current) {
      try {
        setFlashActive(true);
        setTimeout(() => setFlashActive(false), 150);

        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });

        if (photo && photo.uri) {
          addCapturedPhoto(photo.uri);
        }
      } catch (error) {
        console.error('Failed to capture photo:', error);
        Alert.alert('Error', 'Failed to capture photo from camera.');
      }
    } else {
      // Shutter clicked before camera is loaded - trigger ImagePicker fallback
      handleSelectImageFallback();
    }
  };

  const handleSelectImageFallback = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        addCapturedPhoto(result.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const runScanningSequence = async (photoUris: string[], isMock: boolean, mockItem?: ScannableItem) => {
    const primaryPhotoUri = photoUris[0];
    setIsScanning(true);
    setScanProgress(isLiveMode ? 'Contacting Vision AI...' : 'Initializing Scanner...');

    // Phase 1: Initialize
    setTimeout(() => {
      setScanProgress(isLiveMode ? 'Analyzing Photo Pixels...' : 'Analyzing Object Contours...');
    }, 800);

    // Phase 2: AI Check
    setTimeout(() => {
      setScanProgress(isLiveMode ? 'Fetching Real-time Sold Comps...' : 'Matching eBay Market Comps...');
    }, 1600);

    // Phase 3: Finalize scan
    setTimeout(async () => {
      try {
        let scannedItem: ScannableItem;

        if (isMock && !isLiveMode) {
          // If we chose a mock, use mock comps directly
          const targetMock = mockItem || selectedMock;
          scannedItem = {
            ...targetMock,
            imageUrl: primaryPhotoUri,
          };
        } else {
          // Call active AI Vision service with all photos
          const activeKey = aiProvider === 'openai' ? openAiApiKey : anthropicApiKey;
          const recognized = await recognizeItem(
            isLiveMode ? activeKey : '',
            photoUris,
            aiProvider,
            aiModel
          );

          scannedItem = {
            id: `scan-${Date.now()}`,
            title: recognized.title || 'Identified Item',
            category: recognized.category || 'Collectibles',
            cogs: recognized.cogs || 0.00,
            weightClass: recognized.weightClass || 'Medium',
            description: recognized.description || '',
            suggestedTitle: recognized.suggestedTitle || recognized.title || '',
            suggestedDescription: recognized.suggestedDescription || '',
            tags: recognized.tags || [],
            imageUrl: primaryPhotoUri,
            comps: [], // Will be populated in ValuationSheet live
          };
        }

        const success = await performScan(scannedItem);
        setIsScanning(false);
        setScanProgress('Standby');

        if (success) {
          setValuationVisible(true);
        }
      } catch (err: any) {
        setIsScanning(false);
        setScanProgress('Standby');
        Alert.alert('Scan Failed', err.message || 'Error occurred while identifying this item.');
      }
    }, 2400);
  };

  const handleStartScan = async () => {
    if (capturedPhotos.length === 0) {
      Alert.alert('No Photos', 'Please capture or select at least one photo first.');
      return;
    }
    // Scan all photos
    runScanningSequence(capturedPhotos, false);
  };

  const selectMockObject = (item: ScannableItem) => {
    setSelectedMock(item);
    clearCapturedPhotos();
    addCapturedPhoto(item.imageUrl);
    runScanningSequence([item.imageUrl], true, item);
  };

  const toggleFlash = () => {
    setFlashMode(prev => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  };

  return (
    <View style={styles.container}>
      {/* Header Panel */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>GEMSPOTTER</Text>
          <Text style={styles.planBadge}>{isLiveMode ? 'LIVE PRODUCTION MODE' : 'SIMULATED MODE'}</Text>
        </View>
        <View style={styles.gemsCounter}>
          <Text style={styles.gemsText}>
            {isLiveMode ? 'API Live' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Camera Viewport */}
      <View style={styles.cameraBox}>
        {permission && permission.granted ? (
          <PinchGestureHandler
            onGestureEvent={onPinchGestureEvent}
            onHandlerStateChange={onPinchHandlerStateChange}
          >
            <View style={StyleSheet.absoluteFill}>
              <CameraView
                ref={cameraRef}
                style={styles.cameraImage}
                facing="back"
                flash={flashMode}
                zoom={zoom}
              >
                {/* Tap touch trigger overlay */}
                <TouchableOpacity
                  activeOpacity={1}
                  style={StyleSheet.absoluteFill}
                  onPress={handleTapToFocus}
                />
              </CameraView>
            </View>
          </PinchGestureHandler>
        ) : (
          <View style={styles.permissionPrompt}>
            <Image source={{ uri: selectedMock.imageUrl }} style={[styles.cameraImage, { opacity: 0.4 }]} />
            <View style={styles.promptContent}>
              <Text style={styles.promptText}>Camera access required for live scans.</Text>
              <TouchableOpacity
                style={styles.permissionBtn}
                onPress={requestPermission}
              >
                <Text style={styles.permissionBtnText}>Grant Camera Access</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tap to focus yellow square overlay */}
        {focusCoords && (
          <Animated.View
            style={[
              styles.focusBox,
              {
                left: focusCoords.x - 20,
                top: focusCoords.y - 20,
                transform: [{ scale: focusScaleAnim }],
              },
            ]}
          />
        )}

        {/* HUD grid overlays */}
        <Animated.View style={[styles.cameraOverlay, { opacity: overlayOpacityAnim }]} pointerEvents="none">
          <View style={styles.gridLineHorizontal} />
          <View style={styles.gridLineVertical} />
        </Animated.View>

        {/* Viewfinder brackets */}
        <View style={[styles.cornerBracket, styles.bracketTopLeft]} pointerEvents="none" />
        <View style={[styles.cornerBracket, styles.bracketTopRight]} pointerEvents="none" />
        <View style={[styles.cornerBracket, styles.bracketBottomLeft]} pointerEvents="none" />
        <View style={[styles.cornerBracket, styles.bracketBottomRight]} pointerEvents="none" />

        {/* Zoom & Flash Buttons Overlay */}
        {permission?.granted && (
          <View style={styles.cameraQuickControls}>
            <TouchableOpacity onPress={toggleFlash} style={styles.camBtn}>
              <Zap color={flashMode === 'off' ? '#9ca3af' : COLORS.accentCyan} size={18} />
              <Text style={styles.camBtnText}>{flashMode.toUpperCase()}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={cycleZoom}
              style={styles.camBtn}
            >
              <Text style={[styles.camBtnText, { fontWeight: '800', color: COLORS.accentCyan }]}>
                {getZoomLabel()}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Scanner Laser Beam */}
        {isScanning && (
          <Animated.View
            style={[
              styles.laserBeam,
              {
                transform: [{ translateY: scanLineAnim }],
              },
            ]}
          />
        )}

        {/* Flash animation */}
        <View style={[styles.cameraFlash, flashActive && styles.cameraFlashActive]} pointerEvents="none" />

        {/* Scanner Status Overlay */}
        {isScanning && (
          <View style={styles.scannerStatusCard}>
            <RefreshCw color={COLORS.accentCyan} size={16} />
            <Text style={styles.scannerStatusText}>{scanProgress}</Text>
          </View>
        )}
      </View>

      {/* Control Area */}
      <View style={styles.controls}>
        {/* Multi-photo thumbnail bar */}
        {capturedPhotos.length > 0 && (
          <View style={styles.thumbnailContainer}>
            <Text style={styles.thumbnailHeader}>
              CAPTURED PHOTOS ({capturedPhotos.length}/12)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailScroll}>
              {capturedPhotos.map((photoUri, index) => (
                <View key={index} style={styles.thumbWrapper}>
                  <Image source={{ uri: photoUri }} style={styles.thumbImg} />
                  <TouchableOpacity
                    style={styles.deleteThumb}
                    onPress={() => removeCapturedPhoto(photoUri)}
                  >
                    <Text style={styles.deleteThumbText}>×</Text>
                  </TouchableOpacity>
                  {index === 0 && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>MAIN</Text>
                    </View>
                  )}
                </View>
              ))}
              {capturedPhotos.length < 12 && (
                <TouchableOpacity style={styles.addThumbBtn} onPress={handleSelectImageFallback}>
                  <Text style={styles.addThumbText}>+</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {!isLiveMode && showMockList && capturedPhotos.length === 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.selectorLabel}>CHOOSE MOCK OBJECT TO SCAN</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectorScroll}
            >
              {MOCK_SCANNABLE_ITEMS.map((item) => {
                const isSelected = selectedMock.id === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.selectorCard,
                      isSelected && styles.selectorCardActive,
                    ]}
                    onPress={() => !isScanning && selectMockObject(item)}
                    disabled={isScanning}
                  >
                    <Image source={{ uri: item.imageUrl }} style={styles.selectorImage} />
                    <Text
                      style={[
                        styles.selectorTitle,
                        isSelected && styles.selectorTitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Shutter & Scanning Center buttons */}
        <View style={styles.triggerWrapper}>
          {capturedPhotos.length > 0 && !isScanning ? (
            <TouchableOpacity style={styles.clearBtn} onPress={clearCapturedPhotos}>
              <Text style={styles.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
          ) : !isLiveMode && permission?.granted && capturedPhotos.length === 0 ? (
            <TouchableOpacity
              style={[styles.mockToggleBtn, showMockList && styles.mockToggleBtnActive]}
              onPress={() => setShowMockList(!showMockList)}
            >
              <Database color={showMockList ? COLORS.accentCyan : '#9ca3af'} size={14} />
              <Text style={[styles.mockToggleBtnText, showMockList && { color: COLORS.accentCyan }]}>MOCKS</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 90 }} />
          )}

          <TouchableOpacity
            style={[styles.triggerBtn, isScanning && styles.triggerBtnDisabled]}
            onPress={handleCapturePhoto}
            disabled={isScanning}
          >
            <View style={styles.triggerInnerBtn}>
              <Text style={styles.triggerText}>
                SNAP
              </Text>
            </View>
          </TouchableOpacity>

          {capturedPhotos.length > 0 ? (
            <TouchableOpacity
              style={[styles.scanBtn, isScanning && styles.triggerBtnDisabled]}
              onPress={handleStartScan}
              disabled={isScanning}
            >
              <Text style={styles.scanBtnText}>ANALYZE ({capturedPhotos.length})</Text>
            </TouchableOpacity>
          ) : isLiveMode ? (
            <View style={{ width: 105 }} />
          ) : (
            <TouchableOpacity
              style={[styles.scanBtn, isScanning && styles.triggerBtnDisabled]}
              onPress={() => runScanningSequence([selectedMock.imageUrl], true)}
              disabled={isScanning}
            >
              <Text style={styles.scanBtnText}>SIMULATE</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.infoHint}>
          <HelpCircle color={COLORS.textSecondary} size={12} />
          <Text style={styles.infoHintText}>
            {isLiveMode
              ? `Live Vision AI queries ${
                  aiProvider === 'openai'
                    ? 'OpenAI GPT-4o-mini'
                    : aiModel.toLowerCase().includes('haiku')
                    ? 'Claude Haiku'
                    : 'Claude Sonnet'
                }.`
              : 'Simulated mode processes offline.'}
          </Text>
        </View>
      </View>

      {/* Sheets modals */}
      {activeScan && (
        <>
          <ValuationSheet
            visible={valuationVisible}
            onClose={() => {
              setValuationVisible(false);
              setActiveScan(null);
            }}
            item={activeScan}
            onList={() => {
              setValuationVisible(false);
              setListingVisible(true);
            }}
          />
          <ListingSheet
            visible={listingVisible}
            onClose={() => {
              setListingVisible(false);
              setActiveScan(null);
            }}
            item={activeScan}
            onSuccess={() => {
              setListingVisible(false);
              setActiveScan(null);
              Alert.alert(
                'Listing Created!',
                'Item is now marked as "Listed" and added to your Inventory.',
                [{ text: 'View Inventory' }]
              );
            }}
          />
        </>
      )}
      {/* Onboarding Wizard */}
      <OnboardingModal
        visible={onboardingVisible}
        onComplete={handleOnboardingComplete}
      />
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
  logo: {
    color: COLORS.textPrimary,
    fontFamily: 'Outfit',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planBadge: {
    color: COLORS.accentPurple,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  gemsCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  gemsText: {
    color: COLORS.accentCyan,
    fontFamily: 'Outfit',
    fontWeight: '700',
    fontSize: 12,
  },
  cameraBox: {
    flex: 1,
    backgroundColor: 'black',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  cameraOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLineHorizontal: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    position: 'absolute',
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    position: 'absolute',
  },
  cornerBracket: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: COLORS.accentCyan,
  },
  bracketTopLeft: {
    top: 24,
    left: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  bracketTopRight: {
    top: 24,
    right: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bracketBottomLeft: {
    bottom: 24,
    left: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bracketBottomRight: {
    bottom: 24,
    right: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  laserBeam: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 3,
    backgroundColor: COLORS.accentCyan,
    shadowColor: COLORS.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    top: '15%',
  },
  cameraFlash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'white',
    opacity: 0,
  },
  cameraFlashActive: {
    opacity: 1,
  },
  scannerStatusCard: {
    position: 'absolute',
    backgroundColor: 'rgba(5, 7, 12, 0.85)',
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spinIcon: {
    // We can't easily spin it using React Native stylesheets without transform loops,
    // but the spinner text is clear.
  },
  scannerStatusText: {
    color: COLORS.accentCyan,
    fontSize: 12,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingBottom: 16,
  },
  selectorLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  selectorScroll: {
    paddingHorizontal: 16,
    gap: 10,
    height: 90,
  },
  selectorCard: {
    width: 100,
    height: 80,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  selectorCardActive: {
    borderColor: COLORS.accentCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  selectorImage: {
    width: '100%',
    height: 48,
    borderRadius: 6,
    backgroundColor: COLORS.bgDark,
  },
  selectorTitle: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  selectorTitleActive: {
    color: COLORS.accentCyan,
  },
  triggerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 16,
    width: '100%',
    paddingHorizontal: 20,
  },
  triggerBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 2,
    borderColor: COLORS.accentCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerInnerBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.accentCyan,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accentCyan,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  triggerBtnDisabled: {
    opacity: 0.5,
  },
  triggerText: {
    color: COLORS.bgDeep,
    fontFamily: 'Outfit',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  clearBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
    minWidth: 95,
    alignItems: 'center',
  },
  clearBtnText: {
    color: COLORS.accentRose,
    fontSize: 11,
    fontWeight: '700',
  },
  scanBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
    minWidth: 105,
    alignItems: 'center',
  },
  scanBtnText: {
    color: COLORS.accentCyan,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  mockToggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    width: 90,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  mockToggleBtnActive: {
    borderColor: COLORS.accentCyan,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
  },
  mockToggleBtnText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '800',
  },
  infoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  infoHintText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  cameraQuickControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 12,
    zIndex: 10,
  },
  camBtn: {
    backgroundColor: 'rgba(5, 7, 12, 0.75)',
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  camBtnText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '700',
  },
  permissionPrompt: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  promptContent: {
    position: 'absolute',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  promptText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionBtn: {
    backgroundColor: COLORS.accentCyan,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: COLORS.bgDeep,
    fontWeight: '800',
    fontSize: 12,
  },
  focusBox: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderRadius: 4,
    zIndex: 10,
  },
  thumbnailContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  thumbnailHeader: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  thumbnailScroll: {
    gap: 10,
    paddingRight: 10,
  },
  thumbWrapper: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  deleteThumb: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(5, 7, 12, 0.75)',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  deleteThumbText: {
    color: COLORS.accentRose,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 240, 255, 0.85)',
    paddingVertical: 1,
    alignItems: 'center',
  },
  primaryBadgeText: {
    color: COLORS.bgDeep,
    fontSize: 7,
    fontWeight: '900',
  },
  addThumbBtn: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accentCyan,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 240, 255, 0.03)',
  },
  addThumbText: {
    color: COLORS.accentCyan,
    fontSize: 20,
    fontWeight: '600',
  },
});

