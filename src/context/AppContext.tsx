import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScannableItem, MOCK_SCANNABLE_ITEMS } from '../data/mockData';

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
}

export interface ScanHistoryItem {
  id: string;
  scannableItem: ScannableItem;
  scannedAt: string;
}

interface AppContextType {
  gems: number;
  tier: 'free' | 'pro' | 'scale';
  history: ScanHistoryItem[];
  inventory: InventoryItem[];
  activeScan: ScannableItem | null;
  setActiveScan: (item: ScannableItem | null) => void;
  performScan: (item: ScannableItem) => Promise<boolean>;
  logToInventory: (item: ScannableItem) => void;
  addManualInventory: (title: string, category: string, cogs: number, weightClass: 'Small' | 'Medium' | 'Large', description: string) => void;
  generateListing: (itemId: string) => Promise<boolean>;
  markAsSold: (itemId: string, soldPrice: number, shippingCost: number) => void;
  deleteInventoryItem: (itemId: string) => void;
  purchaseGems: (amount: number) => void;
  upgradeSubscription: (newTier: 'free' | 'pro' | 'scale') => void;
  resetAllData: () => void;
  isLoggedIn: boolean;
  user: { name: string; email: string } | null;
  loginSimulate: (name: string, email: string) => Promise<void>;
  logoutSimulate: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gems, setGems] = useState<number>(10);
  const [tier, setTier] = useState<'free' | 'pro' | 'scale'>('free');
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeScan, setActiveScan] = useState<ScannableItem | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // Load state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const storedGems = await AsyncStorage.getItem('@gemspotter_gems');
        const storedTier = await AsyncStorage.getItem('@gemspotter_tier');
        const storedHistory = await AsyncStorage.getItem('@gemspotter_history');
        const storedInventory = await AsyncStorage.getItem('@gemspotter_inventory');
        const storedLoggedIn = await AsyncStorage.getItem('@gemspotter_is_logged_in');
        const storedUser = await AsyncStorage.getItem('@gemspotter_user');

        if (storedGems !== null) setGems(parseInt(storedGems, 10));
        if (storedTier !== null) setTier(storedTier as 'free' | 'pro' | 'scale');
        if (storedHistory !== null) setHistory(JSON.parse(storedHistory));
        if (storedInventory !== null) setInventory(JSON.parse(storedInventory));
        if (storedLoggedIn !== null) setIsLoggedIn(storedLoggedIn === 'true');
        if (storedUser !== null) setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to load state', e);
      }
    };
    loadState();
  }, []);

  // Save helpers
  const saveGems = async (val: number) => {
    setGems(val);
    await AsyncStorage.setItem('@gemspotter_gems', val.toString());
  };

  const saveTier = async (val: 'free' | 'pro' | 'scale') => {
    setTier(val);
    await AsyncStorage.setItem('@gemspotter_tier', val);
  };

  const saveHistory = async (val: ScanHistoryItem[]) => {
    setHistory(val);
    await AsyncStorage.setItem('@gemspotter_history', JSON.stringify(val));
  };

  const saveInventory = async (val: InventoryItem[]) => {
    setInventory(val);
    await AsyncStorage.setItem('@gemspotter_inventory', JSON.stringify(val));
  };

  const performScan = async (item: ScannableItem): Promise<boolean> => {
    if (gems < 1) return false;

    // Deduct 1 gem
    await saveGems(gems - 1);

    // Create history item
    const newHistoryItem: ScanHistoryItem = {
      id: `history-${Date.now()}`,
      scannableItem: item,
      scannedAt: new Date().toISOString(),
    };

    let updatedHistory = [newHistoryItem, ...history];
    // Free tier caps scan history at 5
    if (tier === 'free' && updatedHistory.length > 5) {
      updatedHistory = updatedHistory.slice(0, 5);
    }
    await saveHistory(updatedHistory);
    setActiveScan(item);
    return true;
  };

  const logToInventory = async (item: ScannableItem) => {
    // Check inventory capacity caps
    if (tier === 'free' && inventory.length >= 10) {
      alert('Free Plan Cap: You cannot log more than 10 items to your inventory. Please upgrade to Pro.');
      return;
    }
    if (tier === 'pro' && inventory.length >= 100) {
      alert('Pro Plan Cap: You cannot log more than 100 items. Please upgrade to Scale.');
      return;
    }

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
    };

    await saveInventory([newItem, ...inventory]);
  };

  const addManualInventory = async (
    title: string,
    category: string,
    cogs: number,
    weightClass: 'Small' | 'Medium' | 'Large',
    description: string
  ) => {
    if (tier === 'free' && inventory.length >= 10) {
      alert('Free Plan Cap: You cannot log more than 10 items to your inventory. Please upgrade to Pro.');
      return;
    }
    if (tier === 'pro' && inventory.length >= 100) {
      alert('Pro Plan Cap: You cannot log more than 100 items. Please upgrade to Scale.');
      return;
    }

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      title,
      category,
      cogs,
      weightClass,
      description,
      imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=500&auto=format&fit=crop&q=80',
      status: 'sourced',
      createdAt: new Date().toISOString(),
    };

    await saveInventory([newItem, ...inventory]);
  };

  const generateListing = async (itemId: string): Promise<boolean> => {
    if (gems < 5) {
      alert('Insufficient Gems: Generating an AI Listing requires 5 Gems.');
      return false;
    }

    // Deduct 5 gems
    await saveGems(gems - 5);

    // Find item and update it with AI generated metadata
    const updatedInventory = inventory.map(item => {
      if (item.id === itemId) {
        // Match with scannable mock data if matches, otherwise generate mock AI text
        const matchedMock = MOCK_SCANNABLE_ITEMS.find(m => m.title.toLowerCase().includes(item.title.toLowerCase()) || item.title.toLowerCase().includes(m.title.toLowerCase()));

        return {
          ...item,
          suggestedTitle: matchedMock?.suggestedTitle || `AI GENERATED: Professional ${item.title} Listing`,
          suggestedDescription: matchedMock?.suggestedDescription || `This is a high-quality ${item.title}. In excellent cosmetic and working condition. Pre-owned and checked by Gemspotter AI. Ready to ship out quickly!`,
          tags: matchedMock?.tags || [item.category.split('>')[0].trim().toLowerCase(), 'reseller', 'deal', 'quality'],
          status: 'listed' as const,
        };
      }
      return item;
    });

    await saveInventory(updatedInventory);
    return true;
  };

  const markAsSold = async (itemId: string, soldPrice: number, shippingCost: number) => {
    const updatedInventory = inventory.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          soldPrice,
          shippingCost,
          status: 'sold' as const,
        };
      }
      return item;
    });
    await saveInventory(updatedInventory);
  };

  const deleteInventoryItem = async (itemId: string) => {
    const updatedInventory = inventory.filter(item => item.id !== itemId);
    await saveInventory(updatedInventory);
  };

  const purchaseGems = async (amount: number) => {
    await saveGems(gems + amount);
  };

  const upgradeSubscription = async (newTier: 'free' | 'pro' | 'scale') => {
    let extraGems = 0;
    if (newTier === 'pro') extraGems = 250;
    if (newTier === 'scale') extraGems = 1000;

    await saveTier(newTier);
    await saveGems(gems + extraGems);
  };

  const loginSimulate = async (name: string, email: string) => {
    setIsLoggedIn(true);
    const u = { name, email };
    setUser(u);
    await AsyncStorage.setItem('@gemspotter_is_logged_in', 'true');
    await AsyncStorage.setItem('@gemspotter_user', JSON.stringify(u));
  };

  const logoutSimulate = async () => {
    setIsLoggedIn(false);
    setUser(null);
    await AsyncStorage.setItem('@gemspotter_is_logged_in', 'false');
    await AsyncStorage.removeItem('@gemspotter_user');
  };

  const resetAllData = async () => {
    await AsyncStorage.clear();
    setGems(10);
    setTier('free');
    setHistory([]);
    setInventory([]);
    setActiveScan(null);
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        gems,
        tier,
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
        purchaseGems,
        upgradeSubscription,
        resetAllData,
        isLoggedIn,
        user,
        loginSimulate,
        logoutSimulate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
