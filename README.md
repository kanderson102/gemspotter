# Gemspotter 💎

Gemspotter is an AI-powered reseller, sourcing, and business analytics native mobile application. It integrates item photo sourcing, eBay market comps valuation, automated SEO listing draft generation, and reseller profit ledger tracking in a single cross-platform workflow, wrapped around a credit-based "Gem Economy."

---

## 🚀 Key Features

- **AI Sourcing Camera**: Launch the device camera, capture item images, and simulate a smart image scan targeting your thrift finds.
- **Valuation Dashboard (Bottom Sheet)**: Instantly analyze potential net profits, estimated eBay sold comps, platform fees, and ROI percentage. Includes custom COGS adjustments and shipping weight selectors.
- **Draggable Swipe Dismissal**: Modern bottom sheets ([ValuationSheet](src/components/ValuationSheet.tsx) & [ListingSheet](src/components/ListingSheet.tsx)) support native `PanResponder` vertical swipe-down dragging for seamless page navigation.
- **AI Listing Assistant**: Generates background-removed previews and SEO-optimized titles, descriptions, and tag descriptors in exchange for 5 Gems.
- **Scan History Sourcing Log**: Keep track of deferred sourcing scans. Integrates instant quick-logging with duplicates checking to prevent double entries in the ledger.
- **Business Health Dashboard**: Live financial tracking of total net profits, sell-through percentage, average ROI, and active stock counts.
- **Simulated Auth & Payment Flows**: Connect mock Google/Apple profiles to sync credentials, and simulate Apple/Google Pay drawer credit checkout processes.

---

## 🛠️ Technology Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/) (SDK 54)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based tab routing layout)
- **Styling**: Native StyleSheet API (curated premium neon/glassmorphism dark palette)
- **Icons**: [Lucide React Native](https://lucide.dev/)
- **Local Database**: [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) for offline persistence

---

## 📦 Installation & Getting Started

Follow these steps to run the application locally on your computer and test it on your physical Android or iOS device:

### 1. Clone the Repository
```bash
git clone https://github.com/kanderson102/gemspotter.git
cd gemspotter
```

### 2. Install Dependencies
Make sure you have Node.js installed, then run:
```bash
npm install
```

### 3. Start the Development Server
```bash
npx expo start
```

### 4. Open the App
- Scan the Metro server QR code using your physical device's **Expo Go** application (Android) or system Camera (iOS).
- Press **`a`** to open in the Android Emulator.
- Press **`i`** to open in the iOS Simulator.
- Press **`w`** to view in a web browser.

---

## 📝 Developer Controls

On the **Settings** screen, scroll down to **Developer Controls** to clear local storage diagnostics. Tapping **Clear AsyncStorage Data** wipes the local cache and resets your balance back to the default 10 Gems.
