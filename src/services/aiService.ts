/**
 * AI service for item identification and SEO content drafting.
 * Supports OpenAI GPT-4o models and includes robust mock generators for offline/free testing.
 */

import { ScannableItem } from '../data/mockData';

// Helper to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Recognizes a thrift item from an image (either online URL or local file URI).
 * Calls OpenAI GPT-4o-mini Vision or falls back to standard mock database item.
 */
export const recognizeItem = async (
  apiKey: string,
  imageUris: string[]
): Promise<Partial<ScannableItem>> => {
  if (!apiKey) {
    // If no key is set, wait 1.5s to simulate network latency, then return a random mock item
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      title: 'Identified Vintage Item (Simulated)',
      category: 'Clothing & Accessories > Vintage',
      cogs: 5.00,
      weightClass: 'Medium',
      description: 'A beautiful simulated vintage item detected from photo.',
      suggestedTitle: 'Vintage Retro Collectible Item Rare Find',
      suggestedDescription: 'Excellent vintage item in great condition. Shows minor cosmetic wear from age, adding to its retro charm. Tested and verified.',
      tags: ['vintage', 'retro', 'collectible', 'thrift-find'],
    };
  }

  try {
    const contentPayload: any[] = [
      {
        type: 'text',
        text: `Identify the object in these images and return a JSON object ONLY. Do not write markdown tags around the JSON.
        The JSON object must match this schema:
        {
          "title": "Clean concise name of the identified item (brand, model, size if visible)",
          "category": "eBay category path (e.g. Clothing & Accessories > Men's Clothing > Coats, Jackets & Vests)",
          "cogs": 0.00,
          "weightClass": "Small | Medium | Large (Small: under 1lb, Medium: 1-5lbs, Large: over 5lbs)",
          "description": "Short description of the item.",
          "suggestedTitle": "SEO keyword-rich eBay title under 80 characters limit. Use title case.",
          "suggestedDescription": "A professional, structured, bulleted reseller draft listing description outlining features, brand name, condition, size, and shipping care.",
          "tags": ["array", "of", "5", "keywords", "tags"]
        }`,
      }
    ];

    for (const imageUri of imageUris) {
      let imageUrlPayload = '';
      if (imageUri.startsWith('http')) {
        imageUrlPayload = imageUri;
      } else {
        // Fetch local URI and convert to base64
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        imageUrlPayload = `data:image/jpeg;base64,${base64}`;
      }

      contentPayload.push({
        type: 'image_url',
        image_url: {
          url: imageUrlPayload,
        },
      });
    }

    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are Gemspotter AI, an expert reseller assistant. Your job is to identify items from photos and output structured metadata for eBay.',
        },
        {
          role: 'user',
          content: contentPayload,
        },
      ],
      response_format: { type: 'json_object' },
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = response.statusText || 'Unknown Error';
      try {
        const parsedErr = JSON.parse(errText);
        if (parsedErr.error?.message) {
          errMsg = parsedErr.error.message;
        }
      } catch (e) {
        // Not JSON response
      }
      console.warn('OpenAI Vision error details:', errText);
      throw new Error(`OpenAI Vision failed: ${errMsg}`);
    }

    const data = await response.json();
    const parsedText = data.choices[0].message.content;
    const itemData = JSON.parse(parsedText);
    
    return {
      title: itemData.title || 'Identified Item',
      category: itemData.category || 'Collectibles > Other',
      cogs: itemData.cogs || 0.00,
      weightClass: (itemData.weightClass === 'Small' || itemData.weightClass === 'Medium' || itemData.weightClass === 'Large') ? itemData.weightClass : 'Medium',
      description: itemData.description || '',
      suggestedTitle: itemData.suggestedTitle || itemData.title,
      suggestedDescription: itemData.suggestedDescription || '',
      tags: itemData.tags || [],
    };
  } catch (error: any) {
    console.warn('OpenAI Vision API error:', error.message || error);
    throw error;
  }
};

/**
 * Generates an SEO optimized listing draft description & title based on item tags & category.
 */
export const generateSeoDraft = async (
  apiKey: string,
  itemTitle: string,
  category: string,
  cogs: number,
  weightClass: string,
  userNotes?: string
): Promise<{ title: string; description: string; tags: string[] }> => {
  if (!apiKey) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      title: `${itemTitle.toUpperCase()} - Excellent Condition Vintage Reseller Deal`,
      description: `**Item**: ${itemTitle}\n**Category**: ${category}\n\n**Description**:\n- Beautiful pre-owned item in great shape\n- Perfect addition to any collection\n- Cleaned and packaged carefully for safe shipping\n\n**Cost of Goods**: $${cogs.toFixed(2)}\n**Size/Weight**: ${weightClass}`,
      tags: [category.split('>')[0].trim().toLowerCase(), 'reseller', 'vintage', 'sale'],
    };
  }

  try {
    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional SEO optimizer for eBay listings. You write titles under 80 characters using keywords buyers search for. You write descriptions that sell.',
        },
        {
          role: 'user',
          content: `Write an SEO optimized eBay listing draft based on this product info:
          Title: ${itemTitle}
          Category: ${category}
          Weight Class: ${weightClass}
          Additional Notes: ${userNotes || 'None'}
          
          Return JSON object with fields:
          - title: optimized eBay title (Strict limit of 80 characters)
          - description: detailed description template in markdown
          - tags: list of 5 tags/keywords`,
        },
      ],
      response_format: { type: 'json_object' },
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`OpenAI Draft API failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);
    return {
      title: content.title || itemTitle,
      description: content.description || '',
      tags: content.tags || [],
    };
  } catch (error) {
    console.error('OpenAI SEO Writer Error:', error);
    throw error;
  }
};
