import * as SQLite from 'expo-sqlite';
import { InventoryItem, ScanHistoryItem } from '../context/AppContext';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Gets or opens the local SQLite database instance.
 */
export const getSQLiteDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('gemspotter_local.db');
  }
  return dbInstance;
};

/**
 * Initializes the SQLite database tables automatically.
 * Runs on app startup.
 */
export const initSQLiteDB = async (): Promise<void> => {
  try {
    const db = await getSQLiteDB();
    
    // Create inventory table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        category TEXT,
        cogs REAL,
        weightClass TEXT,
        description TEXT,
        suggestedTitle TEXT,
        suggestedDescription TEXT,
        tags TEXT,
        imageUrl TEXT,
        status TEXT,
        createdAt TEXT,
        soldPrice REAL,
        shippingCost REAL
      );
    `);

    // Create history table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS history (
        id TEXT PRIMARY KEY NOT NULL,
        scannedAt TEXT,
        itemTitle TEXT,
        itemCategory TEXT,
        itemImageUrl TEXT,
        itemRawData TEXT
      );
    `);

    console.log('Local SQLite Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize local SQLite database:', error);
    throw error;
  }
};

/**
 * Loads all inventory items from the SQLite database.
 */
export const loadAllInventory = async (): Promise<InventoryItem[]> => {
  try {
    const db = await getSQLiteDB();
    const rows = await db.getAllAsync<any>('SELECT * FROM inventory ORDER BY createdAt DESC');
    
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      category: row.category || '',
      cogs: row.cogs || 0,
      weightClass: (row.weightClass as any) || 'Medium',
      description: row.description || '',
      suggestedTitle: row.suggestedTitle || undefined,
      suggestedDescription: row.suggestedDescription || undefined,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      imageUrl: row.imageUrl || undefined,
      status: (row.status as any) || 'sourced',
      createdAt: row.createdAt,
      soldPrice: row.soldPrice !== null ? row.soldPrice : undefined,
      shippingCost: row.shippingCost !== null ? row.shippingCost : undefined,
    }));
  } catch (error) {
    console.error('SQLite loadAllInventory Error:', error);
    return [];
  }
};

/**
 * Saves (inserts or replaces) an inventory item in SQLite.
 */
export const saveSQLiteInventoryItem = async (item: InventoryItem): Promise<void> => {
  try {
    const db = await getSQLiteDB();
    await db.runAsync(
      `INSERT OR REPLACE INTO inventory (
        id, title, category, cogs, weightClass, description, 
        suggestedTitle, suggestedDescription, tags, imageUrl, 
        status, createdAt, soldPrice, shippingCost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.title,
        item.category,
        item.cogs,
        item.weightClass,
        item.description,
        item.suggestedTitle || null,
        item.suggestedDescription || null,
        item.tags ? JSON.stringify(item.tags) : null,
        item.imageUrl || null,
        item.status,
        item.createdAt,
        item.soldPrice !== undefined ? item.soldPrice : null,
        item.shippingCost !== undefined ? item.shippingCost : null,
      ]
    );
  } catch (error) {
    console.error('SQLite saveSQLiteInventoryItem Error:', error);
    throw error;
  }
};

/**
 * Deletes an inventory item from SQLite.
 */
export const deleteSQLiteInventoryItem = async (id: string): Promise<void> => {
  try {
    const db = await getSQLiteDB();
    await db.runAsync('DELETE FROM inventory WHERE id = ?', [id]);
  } catch (error) {
    console.error('SQLite deleteSQLiteInventoryItem Error:', error);
    throw error;
  }
};

/**
 * Loads all scan history items from SQLite.
 */
export const loadAllHistory = async (): Promise<ScanHistoryItem[]> => {
  try {
    const db = await getSQLiteDB();
    const rows = await db.getAllAsync<any>('SELECT * FROM history ORDER BY scannedAt DESC');
    
    return rows.map(row => ({
      id: row.id,
      scannedAt: row.scannedAt,
      scannableItem: row.itemRawData ? JSON.parse(row.itemRawData) : {
        id: row.id,
        title: row.itemTitle || 'Unknown Item',
        category: row.itemCategory || 'Collectibles',
        cogs: 0,
        weightClass: 'Medium',
        description: '',
        imageUrl: row.itemImageUrl || 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=500&auto=format&fit=crop&q=80',
        comps: []
      }
    }));
  } catch (error) {
    console.error('SQLite loadAllHistory Error:', error);
    return [];
  }
};

/**
 * Saves (inserts or replaces) a scan history item in SQLite.
 */
export const saveSQLiteHistoryItem = async (item: ScanHistoryItem): Promise<void> => {
  try {
    const db = await getSQLiteDB();
    await db.runAsync(
      `INSERT OR REPLACE INTO history (
        id, scannedAt, itemTitle, itemCategory, itemImageUrl, itemRawData
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.scannedAt,
        item.scannableItem.title,
        item.scannableItem.category,
        item.scannableItem.imageUrl,
        JSON.stringify(item.scannableItem),
      ]
    );
  } catch (error) {
    console.error('SQLite saveSQLiteHistoryItem Error:', error);
    throw error;
  }
};

/**
 * Wipes all tables from the local database (diagnostics).
 */
export const wipeAllSQLiteData = async (): Promise<void> => {
  try {
    const db = await getSQLiteDB();
    await db.execAsync('DELETE FROM inventory;');
    await db.execAsync('DELETE FROM history;');
    console.log('SQLite local database wiped successfully.');
  } catch (error) {
    console.error('SQLite wipeAllSQLiteData Error:', error);
    throw error;
  }
};
