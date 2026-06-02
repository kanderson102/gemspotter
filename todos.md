# Gemspotter - Production Implementation Roadmap 📋

This document outlines the engineering tasks and integrations required to transition **Gemspotter** from a local simulated prototype into a production-ready mobile application. It provides full context for the next builder or agent.

---

## 🔍 Core Sourcing & AI Computer Vision

### 1. In-App Camera preview
- **Objective**: Replace `expo-image-picker` fallback with an integrated, custom camera viewport.
- **Tech Stack**: `expo-camera` or `react-native-vision-camera`.
- **Tasks**:
  - [ ] Implement an in-app overlay showing cropping guides or box indicators.
  - [ ] Support tap-to-focus, zoom, and hardware flash control.
  - [ ] Implement **multi-photo capture** so users can take up to 12 pictures of an item at once.

### 2. AI Image Recognition API
- **Objective**: Automatically recognize thrift items from taken photos.
- **Tech Stack**: Google Cloud Vision API (Product Search / Web Detection) or OpenAI GPT-4o API (Vision).
- **Tasks**:
  - [ ] Send captured base64/binary image payloads to the vision model.
  - [ ] Prompt the model to return a structured JSON response containing:
    - `identifiedTitle`: Structured keyword-rich name.
    - `suggestedCategory`: Best matching marketplace category.
    - `visualDescriptors`: Brand, color, style, materials, condition guesses.

---

## 📊 Market Comps & Profit Analytics

### 3. Real-Time eBay API Integration
- **Objective**: Replace simulated catalog entries in [mockData.ts](src/data/mockData.ts) with real-time market data.
- **Tech Stack**: eBay Developer Program (Browse API / Finding API).
- **Tasks**:
  - [ ] Set up secure backend endpoints to handle eBay OAuth client credentials.
  - [ ] Query the `search` endpoint of the Browse API filtering for `conditions` and `sold` items (`itemFilters: [{ name: 'SoldItemsOnly', value: ['true'] }]`).
  - [ ] Fetch the last 10–30 sold listings and dynamically compute:
    - Average sold price.
    - Average shipping cost.
    - Low/High price outliers.
  - [ ] Render the actual sold comp images, titles, and sold dates in the [ValuationSheet](src/components/ValuationSheet.tsx) horizontal list.

### 4. Shipping & Fees Estimators
- **Objective**: Compute exact shipping costs and listing fees.
- **Tasks**:
  - [ ] Integrate a shipping calculator API (e.g., Shippo or ShipStation) to fetch exact commercial rates based on item weight/dimensions.
  - [ ] Dynamic eBay Category Fee calculations (replacing the hardcoded 13.25% flat fee with category-specific rates ranging from 8% to 15%).

---

## ✍️ AI listing Assistant & Publisher

### 5. Multi-Photo Listings & Background Isolation
- **Objective**: Provide clean listing draft previews.
- **Tech Stack**: Photoroom API or remove.bg API.
- **Tasks**:
  - [ ] Implement background removal on the primary photo using visual isolation endpoints.
  - [ ] Build a **multiple-photo gallery card** in [ListingSheet](src/components/ListingSheet.tsx) that shows all taken photos in a draggable grid, allowing reordering and deletion.

### 6. OpenAI/Anthropic SEO Draft Generator
- **Objective**: Generate professional, SEO-optimized title drafts and descriptions.
- **Tasks**:
  - [ ] Hook up OpenAI GPT-4 API to generate high-ranking titles (under the 80-character eBay limit) and structured bullet-pointed descriptions based on condition, category, and visual tags.

### 7. Direct eBay Listing Publisher
- **Objective**: Publish the completed draft directly to eBay.
- **Tech Stack**: eBay Trading API / Inventory API.
- **Tasks**:
  - [ ] Implement User OAuth sign-in with eBay to authorize the app.
  - [ ] Build a publisher service to map local listing fields, price, shipping, and multiple image URLs into an active listing or draft on the user's seller dashboard.

---

## 💾 Infrastructure & Auth (Optional Scaling)

### 8. Backend Database & Cloud Storage
- **Objective**: Safeguard user ledger data from local cache resets.
- **Tech Stack**: Supabase or Firebase (Firestore & Cloud Storage).
- **Tasks**:
  - [ ] Sync local AsyncStorage ledger tables to remote databases on network connection.
  - [ ] Host listing images on cloud storage buckets (S3 / Supabase Storage) to serve as public URLs for eBay API uploads.

---

## 📦 Production Builds & Store Bundling

### 9. EAS Credentials Setup
- **Objective**: Package the app for production distribution.
- **Tasks**:
  - [ ] Configure Apple Developer provisioning profiles and push notifications certificates.
  - [ ] Configure Android Keystore credentials and release profiles.
  - [ ] Run `eas build --platform all --profile production` to submit standalone builds to App Store Connect and Google Play Console.
