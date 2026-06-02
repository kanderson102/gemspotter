# Gemspotter 💎

Gemspotter is an AI-powered reseller, sourcing, and business analytics native mobile application built exclusively for Android. It integrates item photo sourcing, eBay market comps valuation, automated SEO listing draft generation, and reseller profit ledger tracking in a single Android workflow.

---

## 🚀 Key Features

- **AI Sourcing Camera**: Launch the device camera, capture item images, and simulate a smart image scan targeting your thrift finds.
- **Valuation Dashboard (Bottom Sheet)**: Instantly analyze potential net profits, estimated eBay sold comps, platform fees, and ROI percentage. Includes custom COGS adjustments and shipping weight selectors.
- **Draggable Swipe Dismissal**: Modern bottom sheets ([ValuationSheet](src/components/ValuationSheet.tsx) & [ListingSheet](src/components/ListingSheet.tsx)) support native `PanResponder` vertical swipe-down dragging for seamless page navigation.
- **AI Listing Assistant**: Generates studio-quality background-removed previews and SEO-optimized titles, descriptions, and tag descriptors.
- **Scan History Sourcing Log**: Keep track of deferred sourcing scans. Integrates instant quick-logging with duplicates checking to prevent double entries in the ledger.
- **Business Health Dashboard**: Live financial tracking of total net profits, sell-through percentage, average ROI, and active stock counts.

---

## 🛠️ Technology Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 54)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based tab routing layout)
- **Styling**: Native StyleSheet API (curated premium neon/glassmorphism dark palette)
- **Icons**: [Lucide React Native](https://lucide.dev/)
- **Local Database**: [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) for offline persistence

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

## 🗄️ Supabase Database Schema Initialization

Due to security designs on the web, Supabase REST endpoints (PostgREST) do not allow executing raw database DDL commands (such as `CREATE TABLE`) using client-side API keys (Anon or Service Role keys). This prevents malicious users or reverse-engineered apps from executing destructive queries on your database structure.

Because of this security restriction, Gemspotter cannot automatically create the tables on its own on the very first load. Instead, the database tables must be initialized once by the database owner via the Supabase Dashboard:

1. Go to the **Settings** screen in the Gemspotter app.
2. Under **Supabase Cloud DB & Sync**, click the **Copy Supabase SQL Setup** button. This copies the table setup code to your clipboard.
3. Open your project on the [Supabase Dashboard](https://supabase.com/dashboard).
4. Navigate to the **SQL Editor** tab on the left menu.
5. Create a new query, paste the copied SQL script, and click **Run**.
6. Back in the Gemspotter app, click **Test Supabase Connection** to verify that the tables are detected and sync is ready!

---

## 🔒 Security & Key Management

- **No Hardcoded Keys (`.env`):** Rather than baking keys into the source code `.env` files (which would allow anyone who reverse-engineers the app package to steal them), Gemspotter inputs keys at runtime.
- **Device-Local Storage:** All API keys (OpenAI, eBay, Photoroom, Supabase) are saved locally in the phone's persistent storage (`AsyncStorage`) via the **Onboarding Wizard** or **Settings Dashboard**.
- **Direct Transit:** Key payloads are only sent directly to official API endpoints (OpenAI API, eBay Developers, Photoroom API, Supabase URLs) and never pass through any secondary server.

---

## 📝 Developer Controls

On the **Settings** screen, scroll down to **Developer Controls** to clear local storage diagnostics. Tapping **Clear AsyncStorage Data** wipes the local cache and resets the app state back to defaults.
