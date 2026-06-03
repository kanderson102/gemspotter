import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScannableItem, MOCK_SCANNABLE_ITEMS } from '../data/mockData';
import {
  initSQLiteDB,
  loadAllInventory,
  saveSQLiteInventoryItem,
  deleteSQLiteInventoryItem,
  loadAllHistory,
  saveSQLiteHistoryItem,
  wipeAllSQLiteData
} from '../services/sqliteService';

export interface InventoryItem {
  id: string;
  title: string;
  category: string;
  cogs: number;
  weightClass: 'Small' | 'Medium' | 'Large';
  description: string;
  suggestedTitle?: string;
  suggestedDescription?: string;
  tags?: string[];
  imageUrl?: string;
  status: 'sourced' | 'listed' | 'sold';
  createdAt: string;
  soldPrice?: number;
  shippingCost?: number;
  isMock?: boolean;
}

export interface ScanHistoryItem {
  id: string;
  scannableItem: ScannableItem;
  scannedAt: string;
  isMock?: boolean;
}

export interface AppContextType {
  history: ScanHistoryItem[];
  inventory: InventoryItem[];
  activeScan: ScannableItem | null;
  setActiveScan: (item: ScannableItem | null) => void;
  performScan: (item: ScannableItem) => Promise<boolean>;
  logToInventory: (item: ScannableItem, isMock?: boolean) => void;
  addManualInventory: (title: string, category: string, cogs: number, weightClass: 'Small' | 'Medium' | 'Large', description: string, imageUrl?: string) => void;
  generateListing: (itemId: string) => Promise<boolean>;
  markAsSold: (itemId: string, soldPrice: number, shippingCost: number) => void;
  deleteInventoryItem: (itemId: string) => void;
  resetAllData: () => void;
  
  // API Credentials & Configuration
  openAiApiKey: string;
  setOpenAiApiKey: (val: string) => Promise<void>;
  ebayClientId: string;
  setEbayClientId: (val: string) => Promise<void>;
  ebayClientSecret: string;
  setEbayClientSecret: (val: string) => Promise<void>;
  photoroomApiKey: string;
  setPhotoroomApiKey: (val: string) => Promise<void>;
  isLiveMode: boolean;
  setIsLiveMode: (val: boolean) => Promise<void>;
  ebayRuName: string;
  setEbayRuName: (val: string) => Promise<void>;
  ebayUserToken: string;
  setEbayUserToken: (val: string) => Promise<void>;
  ebayRefreshToken: string;
  setEbayRefreshToken: (val: string) => Promise<void>;
  ebayTokenExpiresAt: string;
  setEbayTokenExpiresAt: (val: string) => Promise<void>;
  
  // Captured Images for Multi-Photo Listings
  capturedPhotos: string[];
  addCapturedPhoto: (uri: string) => void;
  removeCapturedPhoto: (uri: string) => void;
  clearCapturedPhotos: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeScan, setActiveScan] = useState<ScannableItem | null>(null);

  // API State
  const [openAiApiKey, setOpenAiApiKeyLocal] = useState('');
  const [ebayClientId, setEbayClientIdLocal] = useState('');
  const [ebayClientSecret, setEbayClientSecretLocal] = useState('');
  const [photoroomApiKey, setPhotoroomApiKeyLocal] = useState('');
  const [isLiveMode, setIsLiveModeLocal] = useState(false);
  const [ebayRuName, setEbayRuNameLocal] = useState('');
  const [ebayUserToken, setEbayUserTokenLocal] = useState('');
  const [ebayRefreshToken, setEbayRefreshTokenLocal] = useState('');
  const [ebayTokenExpiresAt, setEbayTokenExpiresAtLocal] = useState('');

  // Captured Images
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);

  // Load and migrate state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        // Initialize SQLite DB first
        await initSQLiteDB();

        // 1. Check for legacy AsyncStorage data to migrate
        const storedHistory = await AsyncStorage.getItem('@gemspotter_history');
        const storedInventory = await AsyncStorage.getItem('@gemspotter_inventory');
        
        let initialInventory: InventoryItem[] = [];
        let initialHistory: ScanHistoryItem[] = [];

        // Migrate inventory
        if (storedInventory !== null) {
          try {
            const parsed = JSON.parse(storedInventory) as InventoryItem[];
            for (const item of parsed) {
              await saveSQLiteInventoryItem(item);
            }
            initialInventory = parsed;
          } catch (e) {
            console.error('Failed to migrate inventory from AsyncStorage', e);
          }
          await AsyncStorage.removeItem('@gemspotter_inventory');
        } else {
          initialInventory = await loadAllInventory();
        }

        // Migrate history
        if (storedHistory !== null) {
          try {
            const parsed = JSON.parse(storedHistory) as ScanHistoryItem[];
            for (const item of parsed) {
              await saveSQLiteHistoryItem(item);
            }
            initialHistory = parsed;
          } catch (e) {
            console.error('Failed to migrate history from AsyncStorage', e);
          }
          await AsyncStorage.removeItem('@gemspotter_history');
        } else {
          initialHistory = await loadAllHistory();
        }

        setInventory(initialInventory);
        setHistory(initialHistory);

        // 2. Load API credentials
        const storedOpenAi = await AsyncStorage.getItem('@gemspotter_openai_key');
        const storedEbayId = await AsyncStorage.getItem('@gemspotter_ebay_client_id');
        const storedEbaySec = await AsyncStorage.getItem('@gemspotter_ebay_client_secret');
        const storedPhotoroom = await AsyncStorage.getItem('@gemspotter_photoroom_key');
        const storedLive = await AsyncStorage.getItem('@gemspotter_is_live_mode');
        const storedRuName = await AsyncStorage.getItem('@gemspotter_ebay_runame');
        const storedUserToken = await AsyncStorage.getItem('@gemspotter_ebay_user_token');
        const storedRefreshToken = await AsyncStorage.getItem('@gemspotter_ebay_refresh_token');
        const storedTokenExpires = await AsyncStorage.getItem('@gemspotter_ebay_token_expires_at');

        if (storedOpenAi !== null) setOpenAiApiKeyLocal(storedOpenAi);
        if (storedEbayId !== null) setEbayClientIdLocal(storedEbayId);
        if (storedEbaySec !== null) setEbayClientSecretLocal(storedEbaySec);
        if (storedPhotoroom !== null) setPhotoroomApiKeyLocal(storedPhotoroom);
        if (storedLive !== null) setIsLiveModeLocal(storedLive === 'true');
        if (storedRuName !== null) setEbayRuNameLocal(storedRuName);
        if (storedUserToken !== null) setEbayUserTokenLocal(storedUserToken);
        if (storedRefreshToken !== null) setEbayRefreshTokenLocal(storedRefreshToken);
        if (storedTokenExpires !== null) setEbayTokenExpiresAtLocal(storedTokenExpires);
      } catch (e) {
        console.error('Failed to load state', e);
      }
    };
    loadState();
  }, []);

  // Setters with persistent storage
  const setOpenAiApiKey = async (val: string) => {
    setOpenAiApiKeyLocal(val);
    await AsyncStorage.setItem('@gemspotter_openai_key', val);
  };
  const setEbayClientId = async (val: string) => {
    setEbayClientIdLocal(val);
    await AsyncStorage.setItem('@gemspotter_ebay_client_id', val);
  };
  const setEbayClientSecret = async (val: string) => {
    setEbayClientSecretLocal(val);
    await AsyncStorage.setItem('@gemspotter_ebay_client_secret', val);
  };
  const setPhotoroomApiKey = async (val: string) => {
    setPhotoroomApiKeyLocal(val);
    await AsyncStorage.setItem('@gemspotter_photoroom_key', val);
  };
  const setIsLiveMode = async (val: boolean) => {
    setIsLiveModeLocal(val);
    await AsyncStorage.setItem('@gemspotter_is_live_mode', val ? 'true' : 'false');
  };
  const setEbayRuName = async (val: string) => {
    setEbayRuNameLocal(val);
    await AsyncStorage.setItem('@gemspotter_ebay_runame', val);
  };
  const setEbayUserToken = async (val: string) => {
    setEbayUserTokenLocal(val);
    await AsyncStorage.setItem('@gemspotter_ebay_user_token', val);
  };
  const setEbayRefreshToken = async (val: string) => {
    setEbayRefreshTokenLocal(val);
    await AsyncStorage.setItem('@gemspotter_ebay_refresh_token', val);
  };
  const setEbayTokenExpiresAt = async (val: string) => {
    setEbayTokenExpiresAtLocal(val);
    await AsyncStorage.setItem('@gemspotter_ebay_token_expires_at', val);
  };

  // Photo handlers
  const addCapturedPhoto = (uri: string) => {
    setCapturedPhotos(prev => {
      if (prev.length >= 12) return prev;
      return [...prev, uri];
    });
  };

  const removeCapturedPhoto = (uri: string) => {
    setCapturedPhotos(prev => prev.filter(p => p !== uri));
  };

  const clearCapturedPhotos = () => {
    setCapturedPhotos([]);
  };

  const performScan = async (item: ScannableItem): Promise<boolean> => {
    const newHistoryItem: ScanHistoryItem = {
      id: `history-${Date.now()}`,
      scannableItem: item,
      scannedAt: new Date().toISOString(),
      isMock: !isLiveMode,
    };

    const updatedHistory = [newHistoryItem, ...history];
    setHistory(updatedHistory);
    
    // Save to local SQLite
    await saveSQLiteHistoryItem(newHistoryItem);
    
    setActiveScan(item);
    return true;
  };

  const logToInventory = async (item: ScannableItem, isMock?: boolean) => {
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      title: item.title,
      category: item.category,
      cogs: item.cogs,
      weightClass: item.weightClass,
      description: item.description,
      imageUrl: item.imageUrl,
      status: 'sourced',
      createdAt: new Date().toISOString(),
      isMock: isMock !== undefined ? isMock : !isLiveMode,
    };

    const updatedInventory = [newItem, ...inventory];
    setInventory(updatedInventory);
    
    // Save to SQLite
    await saveSQLiteInventoryItem(newItem);
  };

  const addManualInventory = async (
    title: string,
    category: string,
    cogs: number,
    weightClass: 'Small' | 'Medium' | 'Large',
    description: string,
    imageUrl?: string
  ) => {
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      title,
      category,
      cogs,
      weightClass,
      description,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=500&auto=format&fit=crop&q=80',
      status: 'sourced',
      createdAt: new Date().toISOString(),
      isMock: false,
    };

    const updatedInventory = [newItem, ...inventory];
    setInventory(updatedInventory);
    
    // Save to SQLite
    await saveSQLiteInventoryItem(newItem);
  };

  const generateListing = async (itemId: string): Promise<boolean> => {
    let updatedItem: InventoryItem | null = null;
    
    const updatedInventory = inventory.map(item => {
      if (item.id === itemId) {
        const matchedMock = MOCK_SCANNABLE_ITEMS.find(m => 
          m.title.toLowerCase().includes(item.title.toLowerCase()) || 
          item.title.toLowerCase().includes(m.title.toLowerCase())
        );

        updatedItem = {
          ...item,
          suggestedTitle: matchedMock?.suggestedTitle || `AI GENERATED: Professional ${item.title} Listing`,
          suggestedDescription: matchedMock?.suggestedDescription || `This is a high-quality ${item.title}. In excellent cosmetic and working condition. Pre-owned and checked by Gemspotter AI. Ready to ship out quickly!`,
          tags: matchedMock?.tags || [item.category.split('>')[0].trim().toLowerCase(), 'reseller', 'deal', 'quality'],
          status: 'listed' as const,
        };
        return updatedItem;
      }
      return item;
    });

    setInventory(updatedInventory);
    
    if (updatedItem) {
      await saveSQLiteInventoryItem(updatedItem);
    }
    
    return true;
  };

  const markAsSold = async (itemId: string, soldPrice: number, shippingCost: number) => {
    let updatedItem: InventoryItem | null = null;

    const updatedInventory = inventory.map(item => {
      if (item.id === itemId) {
        updatedItem = {
          ...item,
          soldPrice,
          shippingCost,
          status: 'sold' as const,
        };
        return updatedItem;
      }
      return item;
    });
    
    setInventory(updatedInventory);
    
    if (updatedItem) {
      await saveSQLiteInventoryItem(updatedItem);
    }
  };

  const deleteInventoryItem = async (itemId: string) => {
    const updatedInventory = inventory.filter(item => item.id !== itemId);
    setInventory(updatedInventory);
    
    // Delete from SQLite
    await deleteSQLiteInventoryItem(itemId);
  };

  const resetAllData = async () => {
    await AsyncStorage.clear();
    await wipeAllSQLiteData();
    setHistory([]);
    setInventory([]);
    setActiveScan(null);
    setOpenAiApiKeyLocal('');
    setEbayClientIdLocal('');
    setEbayClientSecretLocal('');
    setPhotoroomApiKeyLocal('');
    setIsLiveModeLocal(false);
    setCapturedPhotos([]);
    setEbayRuNameLocal('');
    setEbayUserTokenLocal('');
    setEbayRefreshTokenLocal('');
    setEbayTokenExpiresAtLocal('');
  };

  return (
    <AppContext.Provider
      value={{
        history,
        inventory,
        activeScan,
        setActiveScan,
        performScan,
        logToInventory,
        addManualInventory,
        generateListing,
        markAsSold,
        deleteInventoryItem,
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
        ebayRefreshToken,
        setEbayRefreshToken,
        ebayTokenExpiresAt,
        setEbayTokenExpiresAt,
        capturedPhotos,
        addCapturedPhoto,
        removeCapturedPhoto,
        clearCapturedPhotos,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
