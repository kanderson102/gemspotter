import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScannableItem, MOCK_SCANNABLE_ITEMS, eBayComp } from '../data/mockData';
import {
  initSQLiteDB,
  loadAllInventory,
  saveSQLiteInventoryItem,
  deleteSQLiteInventoryItem,
  loadAllHistory,
  saveSQLiteHistoryItem,
  deleteSQLiteHistoryItem,
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
  customSearchQuery?: string;
  comps?: eBayComp[];
  price?: number;
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
  logToInventory: (item: ScannableItem, isMock?: boolean) => Promise<string>;
  addManualInventory: (title: string, category: string, cogs: number, weightClass: 'Small' | 'Medium' | 'Large', description: string, imageUrl?: string) => void;
  generateListing: (
    itemId: string,
    suggestedTitle?: string,
    suggestedDescription?: string,
    tags?: string[],
    imageUrl?: string,
    status?: 'sourced' | 'listed' | 'sold',
    category?: string,
    weightClass?: 'Small' | 'Medium' | 'Large',
    price?: number
  ) => Promise<boolean>;
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
  ebaySandboxClientId: string;
  ebayProdClientId: string;
  ebaySandboxUserToken: string;
  ebayProdUserToken: string;
  ebaySandboxRefreshToken: string;
  ebayProdRefreshToken: string;
  aiProvider: 'openai' | 'anthropic';
  setAiProvider: (val: 'openai' | 'anthropic') => Promise<void>;
  aiModel: string;
  setAiModel: (val: string) => Promise<void>;
  anthropicApiKey: string;
  setAnthropicApiKey: (val: string) => Promise<void>;
  ebayFulfillmentPolicyId: string;
  setEbayFulfillmentPolicyId: (val: string) => Promise<void>;
  ebayPaymentPolicyId: string;
  setEbayPaymentPolicyId: (val: string) => Promise<void>;
  ebayReturnPolicyId: string;
  setEbayReturnPolicyId: (val: string) => Promise<void>;
  ebaySandboxMode: boolean;
  setEbaySandboxMode: (val: boolean) => Promise<void>;
  updateHistoryItem: (historyId: string, scannableItem: ScannableItem) => Promise<void>;
  deleteHistoryItem: (historyId: string) => Promise<void>;
  
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
  const [photoroomApiKey, setPhotoroomApiKeyLocal] = useState('');
  const [isLiveMode, setIsLiveModeLocal] = useState(false);
  const [aiProvider, setAiProviderLocal] = useState<'openai' | 'anthropic'>('openai');
  const [aiModel, setAiModelLocal] = useState('gpt-4o-mini');
  const [anthropicApiKey, setAnthropicApiKeyLocal] = useState('');
  const [ebayFulfillmentPolicyId, setEbayFulfillmentPolicyIdLocal] = useState('');
  const [ebayPaymentPolicyId, setEbayPaymentPolicyIdLocal] = useState('');
  const [ebayReturnPolicyId, setEbayReturnPolicyIdLocal] = useState('');
  const [ebaySandboxMode, setEbaySandboxModeLocal] = useState(true);

  // Separated Sandbox eBay credentials
  const [ebaySandboxClientId, setEbaySandboxClientId] = useState('');
  const [ebaySandboxClientSecret, setEbaySandboxClientSecret] = useState('');
  const [ebaySandboxRuName, setEbaySandboxRuName] = useState('');
  const [ebaySandboxUserToken, setEbaySandboxUserToken] = useState('');
  const [ebaySandboxRefreshToken, setEbaySandboxRefreshToken] = useState('');
  const [ebaySandboxTokenExpiresAt, setEbaySandboxTokenExpiresAt] = useState('');

  // Separated Production eBay credentials
  const [ebayProdClientId, setEbayProdClientId] = useState('');
  const [ebayProdClientSecret, setEbayProdClientSecret] = useState('');
  const [ebayProdRuName, setEbayProdRuName] = useState('');
  const [ebayProdUserToken, setEbayProdUserToken] = useState('');
  const [ebayProdRefreshToken, setEbayProdRefreshToken] = useState('');
  const [ebayProdTokenExpiresAt, setEbayProdTokenExpiresAt] = useState('');

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
        const storedPhotoroom = await AsyncStorage.getItem('@gemspotter_photoroom_key');
        const storedLive = await AsyncStorage.getItem('@gemspotter_is_live_mode');
        const storedAiProvider = await AsyncStorage.getItem('@gemspotter_ai_provider');
        const storedAiModel = await AsyncStorage.getItem('@gemspotter_ai_model');
        const storedAnthropicKey = await AsyncStorage.getItem('@gemspotter_anthropic_key');

        if (storedOpenAi !== null) setOpenAiApiKeyLocal(storedOpenAi);
        if (storedPhotoroom !== null) setPhotoroomApiKeyLocal(storedPhotoroom);
        if (storedLive !== null) setIsLiveModeLocal(storedLive === 'true');
        if (storedAiProvider !== null) setAiProviderLocal(storedAiProvider as 'openai' | 'anthropic');
        if (storedAiModel !== null) setAiModelLocal(storedAiModel);
        if (storedAnthropicKey !== null) setAnthropicApiKeyLocal(storedAnthropicKey);

        const storedSandbox = await AsyncStorage.getItem('@gemspotter_ebay_sandbox_mode');
        const isSandboxActive = storedSandbox !== null ? storedSandbox === 'true' : true;
        setEbaySandboxModeLocal(isSandboxActive);

        // Load separate keys
        const storedSandboxId = await AsyncStorage.getItem('@gemspotter_ebay_sandbox_client_id');
        const storedSandboxSec = await AsyncStorage.getItem('@gemspotter_ebay_sandbox_client_secret');
        const storedSandboxRu = await AsyncStorage.getItem('@gemspotter_ebay_sandbox_runame');
        const storedSandboxUser = await AsyncStorage.getItem('@gemspotter_ebay_sandbox_user_token');
        const storedSandboxRefresh = await AsyncStorage.getItem('@gemspotter_ebay_sandbox_refresh_token');
        const storedSandboxExpires = await AsyncStorage.getItem('@gemspotter_ebay_sandbox_token_expires_at');

        const storedProdId = await AsyncStorage.getItem('@gemspotter_ebay_prod_client_id');
        const storedProdSec = await AsyncStorage.getItem('@gemspotter_ebay_prod_client_secret');
        const storedProdRu = await AsyncStorage.getItem('@gemspotter_ebay_prod_runame');
        const storedProdUser = await AsyncStorage.getItem('@gemspotter_ebay_prod_user_token');
        const storedProdRefresh = await AsyncStorage.getItem('@gemspotter_ebay_prod_refresh_token');
        const storedProdExpires = await AsyncStorage.getItem('@gemspotter_ebay_prod_token_expires_at');

        // Migration logic for legacy single eBay keys
        const storedEbayId = await AsyncStorage.getItem('@gemspotter_ebay_client_id');
        const storedEbaySec = await AsyncStorage.getItem('@gemspotter_ebay_client_secret');
        const storedRuName = await AsyncStorage.getItem('@gemspotter_ebay_runame');
        const storedUserToken = await AsyncStorage.getItem('@gemspotter_ebay_user_token');
        const storedRefreshToken = await AsyncStorage.getItem('@gemspotter_ebay_refresh_token');
        const storedTokenExpires = await AsyncStorage.getItem('@gemspotter_ebay_token_expires_at');

        let activeSandboxId = storedSandboxId || '';
        let activeSandboxSec = storedSandboxSec || '';
        let activeSandboxRu = storedSandboxRu || '';
        let activeSandboxUser = storedSandboxUser || '';
        let activeSandboxRefresh = storedSandboxRefresh || '';
        let activeSandboxExpires = storedSandboxExpires || '';

        let activeProdId = storedProdId || '';
        let activeProdSec = storedProdSec || '';
        let activeProdRu = storedProdRu || '';
        let activeProdUser = storedProdUser || '';
        let activeProdRefresh = storedProdRefresh || '';
        let activeProdExpires = storedProdExpires || '';

        if (storedEbayId && !storedSandboxId && !storedProdId) {
          // Perform one-time migration based on sandbox flag
          if (isSandboxActive) {
            activeSandboxId = storedEbayId;
            activeSandboxSec = storedEbaySec || '';
            activeSandboxRu = storedRuName || '';
            activeSandboxUser = storedUserToken || '';
            activeSandboxRefresh = storedRefreshToken || '';
            activeSandboxExpires = storedTokenExpires || '';

            await AsyncStorage.setItem('@gemspotter_ebay_sandbox_client_id', activeSandboxId);
            await AsyncStorage.setItem('@gemspotter_ebay_sandbox_client_secret', activeSandboxSec);
            await AsyncStorage.setItem('@gemspotter_ebay_sandbox_runame', activeSandboxRu);
            await AsyncStorage.setItem('@gemspotter_ebay_sandbox_user_token', activeSandboxUser);
            await AsyncStorage.setItem('@gemspotter_ebay_sandbox_refresh_token', activeSandboxRefresh);
            await AsyncStorage.setItem('@gemspotter_ebay_sandbox_token_expires_at', activeSandboxExpires);
          } else {
            activeProdId = storedEbayId;
            activeProdSec = storedEbaySec || '';
            activeProdRu = storedRuName || '';
            activeProdUser = storedUserToken || '';
            activeProdRefresh = storedRefreshToken || '';
            activeProdExpires = storedTokenExpires || '';

            await AsyncStorage.setItem('@gemspotter_ebay_prod_client_id', activeProdId);
            await AsyncStorage.setItem('@gemspotter_ebay_prod_client_secret', activeProdSec);
            await AsyncStorage.setItem('@gemspotter_ebay_prod_runame', activeProdRu);
            await AsyncStorage.setItem('@gemspotter_ebay_prod_user_token', activeProdUser);
            await AsyncStorage.setItem('@gemspotter_ebay_prod_refresh_token', activeProdRefresh);
            await AsyncStorage.setItem('@gemspotter_ebay_prod_token_expires_at', activeProdExpires);
          }

          // Cleanup legacy keys
          await AsyncStorage.removeItem('@gemspotter_ebay_client_id');
          await AsyncStorage.removeItem('@gemspotter_ebay_client_secret');
          await AsyncStorage.removeItem('@gemspotter_ebay_runame');
          await AsyncStorage.removeItem('@gemspotter_ebay_user_token');
          await AsyncStorage.removeItem('@gemspotter_ebay_refresh_token');
          await AsyncStorage.removeItem('@gemspotter_ebay_token_expires_at');
        }

        setEbaySandboxClientId(activeSandboxId);
        setEbaySandboxClientSecret(activeSandboxSec);
        setEbaySandboxRuName(activeSandboxRu);
        setEbaySandboxUserToken(activeSandboxUser);
        setEbaySandboxRefreshToken(activeSandboxRefresh);
        setEbaySandboxTokenExpiresAt(activeSandboxExpires);

        setEbayProdClientId(activeProdId);
        setEbayProdClientSecret(activeProdSec);
        setEbayProdRuName(activeProdRu);
        setEbayProdUserToken(activeProdUser);
        setEbayProdRefreshToken(activeProdRefresh);
        setEbayProdTokenExpiresAt(activeProdExpires);
        
        const storedFulfillment = await AsyncStorage.getItem('@gemspotter_ebay_fulfillment_policy_id');
        const storedPayment = await AsyncStorage.getItem('@gemspotter_ebay_payment_policy_id');
        const storedReturn = await AsyncStorage.getItem('@gemspotter_ebay_return_policy_id');
        
        if (storedFulfillment !== null) setEbayFulfillmentPolicyIdLocal(storedFulfillment);
        if (storedPayment !== null) setEbayPaymentPolicyIdLocal(storedPayment);
        if (storedReturn !== null) setEbayReturnPolicyIdLocal(storedReturn);
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
  // Dynamic getters based on environment mode
  const ebayClientId = ebaySandboxMode ? ebaySandboxClientId : ebayProdClientId;
  const ebayClientSecret = ebaySandboxMode ? ebaySandboxClientSecret : ebayProdClientSecret;
  const ebayRuName = ebaySandboxMode ? ebaySandboxRuName : ebayProdRuName;
  const ebayUserToken = ebaySandboxMode ? ebaySandboxUserToken : ebayProdUserToken;
  const ebayRefreshToken = ebaySandboxMode ? ebaySandboxRefreshToken : ebayProdRefreshToken;
  const ebayTokenExpiresAt = ebaySandboxMode ? ebaySandboxTokenExpiresAt : ebayProdTokenExpiresAt;

  // Setters routing to the active environment's keys
  const setEbayClientId = async (val: string) => {
    if (ebaySandboxMode) {
      setEbaySandboxClientId(val);
      await AsyncStorage.setItem('@gemspotter_ebay_sandbox_client_id', val);
    } else {
      setEbayProdClientId(val);
      await AsyncStorage.setItem('@gemspotter_ebay_prod_client_id', val);
    }
  };

  const setEbayClientSecret = async (val: string) => {
    if (ebaySandboxMode) {
      setEbaySandboxClientSecret(val);
      await AsyncStorage.setItem('@gemspotter_ebay_sandbox_client_secret', val);
    } else {
      setEbayProdClientSecret(val);
      await AsyncStorage.setItem('@gemspotter_ebay_prod_client_secret', val);
    }
  };

  const setEbayRuName = async (val: string) => {
    if (ebaySandboxMode) {
      setEbaySandboxRuName(val);
      await AsyncStorage.setItem('@gemspotter_ebay_sandbox_runame', val);
    } else {
      setEbayProdRuName(val);
      await AsyncStorage.setItem('@gemspotter_ebay_prod_runame', val);
    }
  };

  const setEbayUserToken = async (val: string) => {
    if (ebaySandboxMode) {
      setEbaySandboxUserToken(val);
      await AsyncStorage.setItem('@gemspotter_ebay_sandbox_user_token', val);
    } else {
      setEbayProdUserToken(val);
      await AsyncStorage.setItem('@gemspotter_ebay_prod_user_token', val);
    }
  };

  const setEbayRefreshToken = async (val: string) => {
    if (ebaySandboxMode) {
      setEbaySandboxRefreshToken(val);
      await AsyncStorage.setItem('@gemspotter_ebay_sandbox_refresh_token', val);
    } else {
      setEbayProdRefreshToken(val);
      await AsyncStorage.setItem('@gemspotter_ebay_prod_refresh_token', val);
    }
  };

  const setEbayTokenExpiresAt = async (val: string) => {
    if (ebaySandboxMode) {
      setEbaySandboxTokenExpiresAt(val);
      await AsyncStorage.setItem('@gemspotter_ebay_sandbox_token_expires_at', val);
    } else {
      setEbayProdTokenExpiresAt(val);
      await AsyncStorage.setItem('@gemspotter_ebay_prod_token_expires_at', val);
    }
  };
  const setPhotoroomApiKey = async (val: string) => {
    setPhotoroomApiKeyLocal(val);
    await AsyncStorage.setItem('@gemspotter_photoroom_key', val);
  };
  const setIsLiveMode = async (val: boolean) => {
    setIsLiveModeLocal(val);
    await AsyncStorage.setItem('@gemspotter_is_live_mode', val ? 'true' : 'false');
  };
  const setAiProvider = async (val: 'openai' | 'anthropic') => {
    setAiProviderLocal(val);
    await AsyncStorage.setItem('@gemspotter_ai_provider', val);
  };
  const setAiModel = async (val: string) => {
    setAiModelLocal(val);
    await AsyncStorage.setItem('@gemspotter_ai_model', val);
  };
  const setAnthropicApiKey = async (val: string) => {
    setAnthropicApiKeyLocal(val);
    await AsyncStorage.setItem('@gemspotter_anthropic_key', val);
  };
  const setEbayFulfillmentPolicyId = async (val: string) => {
    setEbayFulfillmentPolicyIdLocal(val);
    await AsyncStorage.setItem('@gemspotter_ebay_fulfillment_policy_id', val);
  };
  const setEbayPaymentPolicyId = async (val: string) => {
    setEbayPaymentPolicyIdLocal(val);
    await AsyncStorage.setItem('@gemspotter_ebay_payment_policy_id', val);
  };
  const setEbayReturnPolicyId = async (val: string) => {
    setEbayReturnPolicyIdLocal(val);
    await AsyncStorage.setItem('@gemspotter_ebay_return_policy_id', val);
  };
  const setEbaySandboxMode = async (val: boolean) => {
    setEbaySandboxModeLocal(val);
    await AsyncStorage.setItem('@gemspotter_ebay_sandbox_mode', val ? 'true' : 'false');
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

  const logToInventory = async (item: ScannableItem, isMock?: boolean): Promise<string> => {
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      title: item.title,
      category: item.category,
      cogs: item.cogs,
      weightClass: item.weightClass,
      description: item.description,
      suggestedTitle: item.suggestedTitle || item.title,
      suggestedDescription: item.suggestedDescription || '',
      tags: item.tags || [],
      imageUrl: item.imageUrl,
      status: 'sourced',
      createdAt: new Date().toISOString(),
      isMock: isMock !== undefined ? isMock : !isLiveMode,
      customSearchQuery: item.customSearchQuery,
      comps: item.comps || [],
      price: item.price,
    };

    const updatedInventory = [newItem, ...inventory];
    setInventory(updatedInventory);
    
    // Save to SQLite
    await saveSQLiteInventoryItem(newItem);
    return newItem.id;
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

  const generateListing = async (
    itemId: string,
    suggestedTitle?: string,
    suggestedDescription?: string,
    tags?: string[],
    imageUrl?: string,
    status: 'sourced' | 'listed' | 'sold' = 'listed',
    category?: string,
    weightClass?: 'Small' | 'Medium' | 'Large',
    price?: number
  ): Promise<boolean> => {
    let updatedItem: InventoryItem | null = null;
    
    const updatedInventory = inventory.map(item => {
      if (item.id === itemId) {
        const matchedMock = MOCK_SCANNABLE_ITEMS.find(m => 
          m.title.toLowerCase().includes(item.title.toLowerCase()) || 
          item.title.toLowerCase().includes(m.title.toLowerCase())
        );

        updatedItem = {
          ...item,
          suggestedTitle: suggestedTitle !== undefined ? suggestedTitle : (item.suggestedTitle || matchedMock?.suggestedTitle || `AI GENERATED: Professional ${item.title} Listing`),
          suggestedDescription: suggestedDescription !== undefined ? suggestedDescription : (item.suggestedDescription || matchedMock?.suggestedDescription || `This is a high-quality ${item.title}. In excellent cosmetic and working condition. Pre-owned and checked by Gemspotter AI. Ready to ship out quickly!`),
          tags: tags !== undefined ? tags : (item.tags || matchedMock?.tags || [item.category.split('>')[0].trim().toLowerCase(), 'reseller', 'deal', 'quality']),
          imageUrl: imageUrl !== undefined ? imageUrl : item.imageUrl,
          status: status,
          category: category !== undefined ? category : item.category,
          weightClass: weightClass !== undefined ? weightClass : item.weightClass,
          price: price !== undefined ? price : item.price,
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

  const updateHistoryItem = async (historyId: string, scannableItem: ScannableItem) => {
    let updatedHistoryItem: ScanHistoryItem | null = null;
    const updatedHistory = history.map(item => {
      if (item.id === historyId) {
        updatedHistoryItem = {
          ...item,
          scannableItem,
        };
        return updatedHistoryItem;
      }
      return item;
    });

    setHistory(updatedHistory);

    if (activeScan && activeScan.id === scannableItem.id) {
      setActiveScan(scannableItem);
    }

    if (updatedHistoryItem) {
      await saveSQLiteHistoryItem(updatedHistoryItem);
    }

    // Automatically sync updated COGS and Weight to inventory if it was logged
    const inventoryItem = inventory.find(inv => 
      inv.title.toLowerCase() === scannableItem.title.toLowerCase() ||
      inv.suggestedTitle?.toLowerCase() === scannableItem.title.toLowerCase()
    );
    if (inventoryItem) {
      const updatedItem = {
        ...inventoryItem,
        title: scannableItem.title,
        cogs: scannableItem.cogs,
        weightClass: scannableItem.weightClass,
      };
      const updatedInventory = inventory.map(inv => inv.id === inventoryItem.id ? updatedItem : inv);
      setInventory(updatedInventory);
      await saveSQLiteInventoryItem(updatedItem);
    }
  };

  const deleteHistoryItem = async (historyId: string) => {
    const updatedHistory = history.filter(item => item.id !== historyId);
    setHistory(updatedHistory);
    await deleteSQLiteHistoryItem(historyId);
  };

  const resetAllData = async () => {
    await AsyncStorage.clear();
    await wipeAllSQLiteData();
    setHistory([]);
    setInventory([]);
    setActiveScan(null);
    setOpenAiApiKeyLocal('');
    setPhotoroomApiKeyLocal('');
    setIsLiveModeLocal(false);
    setCapturedPhotos([]);
    
    // Clear separate keys
    setEbaySandboxClientId('');
    setEbaySandboxClientSecret('');
    setEbaySandboxRuName('');
    setEbaySandboxUserToken('');
    setEbaySandboxRefreshToken('');
    setEbaySandboxTokenExpiresAt('');

    setEbayProdClientId('');
    setEbayProdClientSecret('');
    setEbayProdRuName('');
    setEbayProdUserToken('');
    setEbayProdRefreshToken('');
    setEbayProdTokenExpiresAt('');

    setAiProviderLocal('openai');
    setAiModelLocal('gpt-4o-mini');
    setAnthropicApiKeyLocal('');
    setEbayFulfillmentPolicyIdLocal('');
    setEbayPaymentPolicyIdLocal('');
    setEbayReturnPolicyIdLocal('');
    setEbaySandboxModeLocal(true);
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
        ebaySandboxClientId,
        ebayProdClientId,
        ebaySandboxUserToken,
        ebayProdUserToken,
        ebaySandboxRefreshToken,
        ebayProdRefreshToken,
        capturedPhotos,
        addCapturedPhoto,
        removeCapturedPhoto,
        clearCapturedPhotos,
        aiProvider,
        setAiProvider,
        aiModel,
        setAiModel,
        anthropicApiKey,
        setAnthropicApiKey,
        ebayFulfillmentPolicyId,
        setEbayFulfillmentPolicyId,
        ebayPaymentPolicyId,
        setEbayPaymentPolicyId,
        ebayReturnPolicyId,
        setEbayReturnPolicyId,
        ebaySandboxMode,
        setEbaySandboxMode,
        updateHistoryItem,
        deleteHistoryItem,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
