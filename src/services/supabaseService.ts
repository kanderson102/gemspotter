/**
 * Supabase service utilizing native fetch calls to avoid package bloat
 * and ensure max compatibility across React Native/Expo versions.
 */

interface SyncResult {
  success: boolean;
  message: string;
}

/**
 * Uploads a local photo URI to Supabase Storage Bucket 'gemspotter-images'
 * returns the public URL of the uploaded image.
 */
export const uploadImageToSupabase = async (
  supabaseUrl: string,
  supabaseKey: string,
  fileUri: string
): Promise<string> => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Key is missing.');
  }

  // Format url
  const cleanUrl = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
  const fileName = `item-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
  const uploadUrl = `${cleanUrl}/storage/v1/object/gemspotter-images/${fileName}`;

  try {
    // React Native FormData file append
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName,
      type: 'image/jpeg',
    } as any);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Supabase upload error details:', errText);
      throw new Error(`Supabase storage upload failed: ${response.statusText}`);
    }

    // Return public URL (assuming the bucket 'gemspotter-images' is public)
    return `${cleanUrl}/storage/v1/object/public/gemspotter-images/${fileName}`;
  } catch (error) {
    console.error('Supabase Image Upload Error:', error);
    throw error;
  }
};

/**
 * Synchronizes inventory items and scan history to Supabase database.
 * Upserts rows using the 'id' field as the unique identifier.
 */
export const syncLedgerToSupabase = async (
  supabaseUrl: string,
  supabaseKey: string,
  inventory: any[],
  history: any[]
): Promise<SyncResult> => {
  if (!supabaseUrl || !supabaseKey) {
    return { success: false, message: 'Supabase credentials not configured' };
  }

  const cleanUrl = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;

  try {
    // 1. Sync Inventory Items
    if (inventory.length > 0) {
      const inventoryUrl = `${cleanUrl}/rest/v1/inventory?on_conflict=id`;
      
      // Map data to match database naming convention if needed (or keep camelCase)
      const mappedInventory = inventory.map(item => ({
        id: item.id,
        title: item.title,
        category: item.category,
        cogs: item.cogs,
        weight_class: item.weightClass,
        description: item.description,
        suggested_title: item.suggestedTitle || null,
        suggested_description: item.suggestedDescription || null,
        tags: item.tags ? JSON.stringify(item.tags) : null,
        image_url: item.imageUrl || null,
        status: item.status,
        created_at: item.createdAt,
        sold_price: item.soldPrice !== undefined ? item.soldPrice : null,
        shipping_cost: item.shippingCost !== undefined ? item.shippingCost : null,
      }));

      const invResponse = await fetch(inventoryUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(mappedInventory),
      });

      if (!invResponse.ok) {
        const errorText = await invResponse.text();
        throw new Error(`Inventory sync failed: ${invResponse.statusText} - ${errorText}`);
      }
    }

    // 2. Sync Scan History
    if (history.length > 0) {
      const historyUrl = `${cleanUrl}/rest/v1/history?on_conflict=id`;
      
      const mappedHistory = history.map(item => ({
        id: item.id,
        scanned_at: item.scannedAt,
        item_title: item.scannableItem.title,
        item_category: item.scannableItem.category,
        item_image_url: item.scannableItem.imageUrl,
        item_raw_data: JSON.stringify(item.scannableItem),
      }));

      const histResponse = await fetch(historyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(mappedHistory),
      });

      if (!histResponse.ok) {
        const errorText = await histResponse.text();
        throw new Error(`History sync failed: ${histResponse.statusText} - ${errorText}`);
      }
    }

    return { success: true, message: 'Sync complete. Ledger successfully uploaded to Supabase.' };
  } catch (error: any) {
    console.error('Supabase Sync Error:', error);
    return { success: false, message: error.message || 'Unknown network error syncing data' };
  }
};

/**
 * Tests connection to Supabase REST and storage endpoints
 */
export const testSupabaseConnection = async (
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ success: boolean; message: string }> => {
  if (!supabaseUrl || !supabaseKey) {
    return { success: false, message: 'Missing credentials.' };
  }
  const cleanUrl = supabaseUrl.endsWith('/') ? supabaseUrl.slice(0, -1) : supabaseUrl;
  
  try {
    // Try to fetch from inventory table directly to verify schema existence
    const response = await fetch(`${cleanUrl}/rest/v1/inventory?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
      }
    });
    
    if (response.status === 200) {
      return { success: true, message: 'Connected! Database tables verified and ready.' };
    }
    
    if (response.status === 404) {
      // Table does not exist
      return { 
        success: true, 
        message: 'Connected to Supabase, but tables (inventory/history) do not exist yet. Please click "Copy SQL Setup Code" and paste it in your Supabase SQL Editor.' 
      };
    }
    
    // Check root API access as fallback
    const rootResponse = await fetch(`${cleanUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
      }
    });

    if (rootResponse.status === 200 || rootResponse.status === 404) {
      return { 
        success: true, 
        message: 'Connected to Supabase, but tables (inventory/history) need setup. Please run SQL setup.' 
      };
    }

    return { success: false, message: `Failed connection: Status ${response.status}` };
  } catch (e: any) {
    return { success: false, message: `Network error: ${e.message || e}` };
  }
};
