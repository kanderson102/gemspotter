/**
 * Service to handle background isolation using Photoroom or remove.bg API.
 * Converts binary response to base64 data URLs for immediate rendering.
 */

export const removeBackground = async (
  apiKey: string,
  imageUri: string
): Promise<string> => {
  if (!apiKey) {
    // If no api key, simulate background removal delay and return original uri
    await new Promise(resolve => setTimeout(resolve, 2000));
    return imageUri;
  }

  try {
    const formData = new FormData();
    formData.append('image_file', {
      uri: imageUri,
      name: 'input_image.jpg',
      type: 'image/jpeg',
    } as any);

    // Call Photoroom Segment API
    const response = await fetch('https://sdk.photoroom.com/v1/segment', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('Photoroom background removal failed:', errText);
      throw new Error(`Background removal failed: ${response.statusText}`);
    }

    // Read the binary stream as base64
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read image response blob as base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Background Isolation Error:', error);
    // Return original image as fallback
    return imageUri;
  }
};
