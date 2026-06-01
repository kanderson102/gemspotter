import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { COLORS } from '../../constants/theme';
import { MOCK_SCANNABLE_ITEMS, ScannableItem } from '../../data/mockData';
import { ValuationSheet } from '../../components/ValuationSheet';
import { ListingSheet } from '../../components/ListingSheet';
import { Zap, HelpCircle, RefreshCw } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function SourcingCameraScreen() {
  const { gems, tier, performScan, activeScan, setActiveScan } = useApp();
  const [selectedMock, setSelectedMock] = useState<ScannableItem>(MOCK_SCANNABLE_ITEMS[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('Standby');
  const [flashActive, setFlashActive] = useState(false);
  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();

  // Sheets Visibility
  const [valuationVisible, setValuationVisible] = useState(false);
  const [listingVisible, setListingVisible] = useState(false);

  // Animated values
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacityAnim = useRef(new Animated.Value(0.15)).current;

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

  const runScanningSequence = async (itemToScan: ScannableItem) => {
    setIsScanning(true);
    setScanProgress('Initializing Scanner...');

    // Phase 1: Initialize
    setTimeout(() => {
      setScanProgress('Analyzing Object Contours...');
    }, 800);

    // Phase 2: AI Check
    setTimeout(() => {
      setScanProgress('Matching eBay Market Comps...');
    }, 1600);

    // Phase 3: Finalize scan
    setTimeout(async () => {
      setFlashActive(true);
      setTimeout(() => setFlashActive(false), 200);

      const success = await performScan(itemToScan);
      setIsScanning(false);
      setScanProgress('Standby');

      if (success) {
        setValuationVisible(true);
      }
    }, 2400);
  };

  const handleStartScan = async () => {
    if (gems < 1) {
      Alert.alert(
        'Out of Gems',
        'You need at least 1 Gem to run a sourcing scan. Please purchase gems in Settings.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Sourcing Scanner',
      'Select your scanning method. You can take a real photo, or run a simulated scan of the mock object.',
      [
        {
          text: 'Camera: Take Photo',
          onPress: handleRealCameraScan,
        },
        {
          text: 'Simulated Scan',
          onPress: () => runScanningSequence(selectedMock),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleRealCameraScan = async () => {
    if (!cameraPermission || !cameraPermission.granted) {
      const askResult = await requestCameraPermission();
      if (!askResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos of items to scan.');
        return;
      }
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;
        
        const scannedItemWithPhoto: ScannableItem = {
          ...selectedMock,
          imageUrl: photoUri,
        };
        
        runScanningSequence(scannedItemWithPhoto);
      }
    } catch (error) {
      console.error('Failed to open camera', error);
      Alert.alert('Error', 'Failed to launch camera.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Panel */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>GEMSPOTTER</Text>
          <Text style={styles.planBadge}>{tier.toUpperCase()} MEMBER</Text>
        </View>
        <View style={styles.gemsCounter}>
          <Zap color={COLORS.accentCyan} size={15} fill={COLORS.accentCyan} />
          <Text style={styles.gemsText}>{gems} GEMS</Text>
        </View>
      </View>

      {/* Camera Viewport */}
      <View style={styles.cameraBox}>
        {/* Mock background object image */}
        <Image source={{ uri: selectedMock.imageUrl }} style={styles.cameraImage} />

        {/* HUD grid overlays */}
        <Animated.View style={[styles.cameraOverlay, { opacity: overlayOpacityAnim }]}>
          <View style={styles.gridLineHorizontal} />
          <View style={styles.gridLineVertical} />
        </Animated.View>

        {/* Viewfinder brackets */}
        <View style={[styles.cornerBracket, styles.bracketTopLeft]} />
        <View style={[styles.cornerBracket, styles.bracketTopRight]} />
        <View style={[styles.cornerBracket, styles.bracketBottomLeft]} />
        <View style={[styles.cornerBracket, styles.bracketBottomRight]} />

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
        <View style={[styles.cameraFlash, flashActive && styles.cameraFlashActive]} />

        {/* Scanner Status Overlay */}
        {isScanning && (
          <View style={styles.scannerStatusCard}>
            <RefreshCw color={COLORS.accentCyan} size={16} style={styles.spinIcon} />
            <Text style={styles.scannerStatusText}>{scanProgress}</Text>
          </View>
        )}
      </View>

      {/* Control Area */}
      <View style={styles.controls}>
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
                onPress={() => !isScanning && setSelectedMock(item)}
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

        {/* Big circular trigger button */}
        <View style={styles.triggerWrapper}>
          <TouchableOpacity
            style={[styles.triggerBtn, isScanning && styles.triggerBtnDisabled]}
            onPress={handleStartScan}
            disabled={isScanning}
          >
            <View style={styles.triggerInnerBtn}>
              <Text style={styles.triggerText}>
                {isScanning ? 'SCANNING' : 'SCAN'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.infoHint}>
          <HelpCircle color={COLORS.textSecondary} size={12} />
          <Text style={styles.infoHintText}>
            Simulated camera. Standard scans charge 1 Gem.
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
    flex: 1.1,
    margin: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: 'black',
    overflow: 'hidden',
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
    flex: 1,
    paddingBottom: 24,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  triggerBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 240, 255, 0.15)',
    borderWidth: 2,
    borderColor: COLORS.accentCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerInnerBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
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
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
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
});
