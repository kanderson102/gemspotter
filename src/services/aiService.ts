/**
 * AI service for item identification and SEO content drafting.
 * Supports OpenAI GPT models and Anthropic Claude models.
 * Includes robust mock generators for offline/free testing.
 */

import { ScannableItem } from '../data/mockData';
import { File } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Compresses and resizes a local image URI to max 1024px, then returns its base64 representation.
 * For web URLs, fetches them first and converts to base64.
 */
const compressAndGetBase64 = async (imageUri: string): Promise<string> => {
  if (imageUri.startsWith('http')) {
    const response = await fetch(imageUri);
    const blob = await response.blob();
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
  }

  // Local file processing using Expo native APIs to avoid HTTP fetch/CORS blocks and memory overflows
  try {
    const manipulated = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1024 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );

    const file = new File(manipulated.uri);
    return await file.base64();
  } catch (error) {
    console.warn('Failed to compress image natively, using File fallback:', error);
    try {
      const file = new File(imageUri);
      return await file.base64();
    } catch (e) {
      // Ultimate fallback
      const response = await fetch(imageUri);
      const blob = await response.blob();
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
    }
  }
};

// Robust JSON parser to strip markdown blocks if they happen to wrap response
const parseJsonFromResponse = (text: string): any => {
  try {
    return JSON.parse(text);
  } catch (e) {
    // Try stripping markdown blocks (e.g. ```json ... ``` or ``` ... ```)
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1].trim());
      } catch (err) {
        // Fallback
      }
    }
    // Also try finding first '{' and last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.slice(firstBrace, lastBrace + 1));
      } catch (err) {}
    }
    throw new Error('Failed to parse JSON response from AI model.');
  }
};

/**
 * Recognizes a thrift item from an image (either online URL or local file URI).
 * Calls OpenAI GPT-4o-mini Vision, Claude 3 Haiku/3.5 Sonnet Vision, or falls back to standard mock database item.
 */
export const recognizeItem = async (
  apiKey: string,
  imageUris: string[],
  aiProvider: 'openai' | 'anthropic' = 'openai',
  aiModel: string = 'gpt-4o-mini'
): Promise<Partial<ScannableItem>> => {
  const trimmedKey = apiKey ? apiKey.trim() : '';
  if (!trimmedKey) {
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
    const contentPayload: any[] = [];

    if (aiProvider === 'openai') {
      contentPayload.push({
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
      });

      for (const imageUri of imageUris) {
        let imageUrlPayload = '';
        if (imageUri.startsWith('http')) {
          imageUrlPayload = imageUri;
        } else {
          // Compress and native read local URI
          const base64 = await compressAndGetBase64(imageUri);
          imageUrlPayload = `data:image/jpeg;base64,${base64}`;
        }

        contentPayload.push({
          type: 'image_url',
          image_url: {
            url: imageUrlPayload,
          },
        });
      }
    } else {
      // Anthropic Vision only supports Base64 input formats (does not accept public HTTP urls directly)
      contentPayload.push({
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
      });

      for (const imageUri of imageUris) {
        const base64 = await compressAndGetBase64(imageUri);
        let mediaType = 'image/jpeg';
        if (imageUri.startsWith('http')) {
          if (imageUri.endsWith('.png')) mediaType = 'image/png';
          else if (imageUri.endsWith('.gif')) mediaType = 'image/gif';
          else if (imageUri.endsWith('.webp')) mediaType = 'image/webp';
        }

        contentPayload.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64,
          },
        });
      }
    }

    let parsedText = '';

    if (aiProvider === 'openai') {
      const requestBody = {
        model: aiModel,
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
          'Authorization': `Bearer ${trimmedKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`OpenAI Vision HTTP ${response.status} Error:`, errText);
        let errMsg = response.statusText || 'Unknown Error';
        try {
          const parsedErr = JSON.parse(errText);
          if (parsedErr.error?.message) {
            errMsg = parsedErr.error.message;
          }
        } catch (e) {
          errMsg = errText || errMsg;
        }
        throw new Error(`OpenAI Vision failed (HTTP ${response.status}): ${errMsg}`);
      }

      const data = await response.json();
      parsedText = data.choices[0].message.content;
    } else {
      // Anthropic Claude
      const requestBody = {
        model: aiModel,
        max_tokens: 1500,
        system: 'You are Gemspotter AI, an expert reseller assistant. Your job is to identify items from photos and output structured metadata for eBay.',
        messages: [
          {
            role: 'user',
            content: contentPayload,
          },
        ],
      };

      let response: Response | null = null;
      const maxRetries = 3;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': trimmedKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(requestBody),
          });
          
          if (response.ok) {
            break;
          }
          
          // Retry on server-side 5xx errors (like 502 Bad Gateway)
          if (response.status >= 500 && attempt < maxRetries - 1) {
            console.warn(`Anthropic returned HTTP ${response.status}, retrying (attempt ${attempt + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1500));
            continue;
          }
          break;
        } catch (fetchErr) {
          if (attempt < maxRetries - 1) {
            console.warn(`Fetch error, retrying (attempt ${attempt + 1}/${maxRetries})...`, fetchErr);
            await new Promise(resolve => setTimeout(resolve, 1500));
            continue;
          }
          throw fetchErr;
        }
      }

      if (!response || !response.ok) {
        const status = response ? response.status : 0;
        const errText = response ? await response.text() : 'No Response';
        console.warn(`Anthropic Vision HTTP ${status} Error:`, errText);
        let errMsg = (response && response.statusText) || 'Unknown Error';
        try {
          const parsedErr = JSON.parse(errText);
          if (parsedErr.error?.message) {
            errMsg = parsedErr.error.message;
          } else if (parsedErr.error?.type) {
            errMsg = parsedErr.error.type + (parsedErr.error.message ? `: ${parsedErr.error.message}` : '');
          }
        } catch (e) {
          errMsg = errText || errMsg;
        }
        throw new Error(`Anthropic Vision failed (HTTP ${status}): ${errMsg}`);
      }

      const data = await response.json();
      parsedText = data.content[0].text;
    }

    const itemData = parseJsonFromResponse(parsedText);
    
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
    console.warn('AI Vision API error:', error.message || error);
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
  userNotes?: string,
  aiProvider: 'openai' | 'anthropic' = 'openai',
  aiModel: string = 'gpt-4o-mini'
): Promise<{ title: string; description: string; tags: string[] }> => {
  const trimmedKey = apiKey ? apiKey.trim() : '';
  if (!trimmedKey) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      title: `${itemTitle.toUpperCase()} - Excellent Condition Vintage Reseller Deal`,
      description: `**Item**: ${itemTitle}\n**Category**: ${category}\n\n**Description**:\n- Beautiful pre-owned item in great shape\n- Perfect addition to any collection\n- Cleaned and packaged carefully for safe shipping\n\n**Cost of Goods**: $${cogs.toFixed(2)}\n**Size/Weight**: ${weightClass}`,
      tags: [category.split('>')[0].trim().toLowerCase(), 'reseller', 'vintage', 'sale'],
    };
  }

  try {
    let parsedText = '';

    if (aiProvider === 'openai') {
      const requestBody = {
        model: aiModel,
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
          'Authorization': `Bearer ${trimmedKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`OpenAI Draft HTTP ${response.status} Error:`, errText);
        let errMsg = response.statusText || 'Unknown Error';
        try {
          const parsedErr = JSON.parse(errText);
          if (parsedErr.error?.message) {
            errMsg = parsedErr.error.message;
          }
        } catch (e) {
          errMsg = errText || errMsg;
        }
        throw new Error(`OpenAI Draft API failed (HTTP ${response.status}): ${errMsg}`);
      }

      const data = await response.json();
      parsedText = data.choices[0].message.content;
    } else {
      // Anthropic Claude
      const requestBody = {
        model: aiModel,
        max_tokens: 1500,
        system: 'You are a professional SEO optimizer for eBay listings. You write titles under 80 characters using keywords buyers search for. You write descriptions that sell.',
        messages: [
          {
            role: 'user',
            content: `Write an SEO optimized eBay listing draft based on this product info:
            Title: ${itemTitle}
            Category: ${category}
            Weight Class: ${weightClass}
            Additional Notes: ${userNotes || 'None'}
            
            Return JSON object ONLY. Do not write markdown tags around the JSON.
            The JSON object must match this schema:
            {
              "title": "optimized eBay title (Strict limit of 80 characters)",
              "description": "detailed description template in markdown",
              "tags": ["array", "of", "5", "tags", "keywords"]
            }`,
          },
        ],
      };

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': trimmedKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Anthropic Draft HTTP ${response.status} Error:`, errText);
        let errMsg = response.statusText || 'Unknown Error';
        try {
          const parsedErr = JSON.parse(errText);
          if (parsedErr.error?.message) {
            errMsg = parsedErr.error.message;
          } else if (parsedErr.error?.type) {
            errMsg = parsedErr.error.type + (parsedErr.error.message ? `: ${parsedErr.error.message}` : '');
          }
        } catch (e) {
          errMsg = errText || errMsg;
        }
        throw new Error(`Anthropic Draft API failed (HTTP ${response.status}): ${errMsg}`);
      }

      const data = await response.json();
      parsedText = data.content[0].text;
    }

    const content = parseJsonFromResponse(parsedText);
    return {
      title: content.title || itemTitle,
      description: content.description || '',
      tags: content.tags || [],
    };
  } catch (error: any) {
    console.warn('AI SEO Writer Error:', error.message || error);
    throw error;
  }
};
