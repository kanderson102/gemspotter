# Gemspotter 💎

Gemspotter is an AI-powered Android app helping thrift store resellers with eBay sourcing, market research, and business analytics. It integrates item camera and photo sourcing, eBay market comps valuation, automated SEO listing draft generation, and reseller profit ledger tracking in a single workflow.

---

## 🚀 Key Features

- **AI Sourcing Camera**: Launch the device camera, capture item images, and simulate a smart image scan targeting your thrift finds.
- **Valuation Dashboard (Bottom Sheet)**: Instantly analyze potential net profits, estimated eBay sold comps, platform fees, and ROI percentage. Includes custom COGS adjustments and shipping weight selectors.
- **AI Listing Assistant**: Generates studio-quality background-removed previews and SEO-optimized titles, descriptions, and tag descriptors.
- **Scan History Sourcing Log**: Keep track of deferred sourcing scans. Integrates instant quick-logging with duplicates checking to prevent double entries in the ledger.
- **Business Health Dashboard**: Live financial tracking of total net profits, sell-through percentage, average ROI, and active stock counts.

---

## 🛠️ Technology Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 54)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based tab routing layout)
- **Styling**: Native StyleSheet API (curated premium neon/glassmorphism dark palette)
- **Icons**: [Lucide React Native](https://lucide.dev/)
- **Local Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) for persistent transaction ledger & scan history
- **Configuration Storage**: [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) for local credential storage and app state settings

---

## 📦 Installation & Getting Started

### Option A: Local Testing & Development (Requires Expo)
To run the app locally on your computer and test it on a physical device or emulator:
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/kanderson102/gemspotter.git
   cd gemspotter
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Start Metro Server:**
   ```bash
   npx expo start
   ```
4. **Open the App:**
   - Scan the QR code in the terminal using your phone's **Expo Go** application (Android).
   - Press **`a`** to open the app in the Android Emulator.

---

### Option B: Standalone Installation (No Expo/Code Required on Device)
If you want to compile and distribute the app so you can install and use it directly on your Android device without running a development terminal on your computer:

#### 1. Compile with EAS (Expo Application Services)
Run the compilation profile using Expo's cloud compiler (EAS):
- **Android APK Build:**
  ```bash
  eas build --platform android --profile preview
  ```

#### 2. Sideloading Standalone Apps
When EAS completes, it outputs a download link and QR code hosted on your **expo.dev** account. Open the link on your Android device, download the compiled `.apk` file, and install it.

---

## 🔑 eBay Seller Account Integration (OAuth 2.0)

Gemspotter utilizes two distinct eBay API authentication flows:
1. **Application-Only Flow (Client Credentials)**: Authenticates the application to search recently sold items and compute pricing metrics using the eBay Browse API.
2. **User Authorization Flow (OAuth 2.0)**: Securely links your personal eBay seller account. This allows you to publish generated drafts (with background-removed images, SEO titles, descriptions, and categories) directly to your eBay storefront via the modern eBay Inventory API.

### RuName & Login Configuration Steps:
1. Register for an account on the [eBay Developer Portal](https://developer.ebay.com/).
2. Generate your application **Client ID (App ID)** and **Client Secret (Cert ID)**.
3. Configure your **RuName (Redirect URI Name)** in your eBay developer account settings under the Redirect Registry (ensuring you select **OAuth** instead of the legacy **Auth\'n\'Auth**), and set the Redirect URL (both accepted and declined) to: `https://kanderson102.github.io/gemspotter/`
4. Input your Client ID, Client Secret, and RuName on the **Settings** screen in Gemspotter.
5. Tap **Link eBay Seller Account** to open a secure browser session, log in to your eBay account, and grant access. 
6. Tokens are stored locally. The app automatically handles token expiration checks and refreshes your session on-demand before publishing listing drafts.

---

## 🔒 Security & Key Management

- **No Hardcoded Keys (`.env`):** Rather than baking keys into the source code `.env` files (which would allow anyone who reverse-engineers the app package to steal them), Gemspotter allows you to input keys at runtime.
- **Device-Local Storage:** All API keys (OpenAI, eBay, Photoroom) are saved locally in the phone's persistent storage (`AsyncStorage`) via the **Onboarding Wizard** or **Settings Dashboard**.
- **Direct Transit:** Key payloads are only sent directly to official API endpoints (OpenAI API, eBay Developers, Photoroom API) and never pass through any secondary server.

---

## 📝 Developer Controls

On the **Settings** screen, scroll down to **Developer Controls** to clear local storage diagnostics. Tapping **Clear AsyncStorage Data** wipes the local cache and resets the app state back to defaults.
