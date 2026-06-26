# Project: LocalPulse Mobile Map and Photo Upload Fixes

## Architecture
- React Native Expo application.
- **Mobile Map Component (`app/(citizen)/map.tsx`)**: Renders SVG interactive map. Needs `react-native-webview` on Android/iOS platforms, and standard rendering on Web.
- **Photo Selection Component (`app/(citizen)/create.tsx`)**: Native Camera (using `expo-camera`) and native gallery picker (using `expo-image-picker`) with dynamic RN permission handling.
- **App Bundler**: Bundled using `npx expo export --platform android`.

## Code Layout
- Frontend screens:
  - `app/(citizen)/map.tsx` - interactive map view.
  - `app/(citizen)/create.tsx` - report issue form screen.
- Config files:
  - `package.json` - dependencies and devDependencies.
  - `app.json` - expo config.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Env Prep | Inspect map.tsx, create.tsx, and package.json. Determine current state and install necessary dependencies. | None | DONE |
| 2 | Mobile Map Implementation | Use `react-native-webview` to render the SVG interactive map on mobile. Implement bridge communication for marker clicks and radius update. | M1 | IN_PROGRESS |
| 3 | Native Photo & Camera Picker | Integrate `expo-image-picker` and `expo-camera` into report creation screen. Request permissions dynamically. | M1 | PLANNED |
| 4 | Bundler Integrity Check | Verify bundler compilation using `npx expo export --platform android` to ensure no dependency errors. | M2, M3 | PLANNED |

## Interface Contracts
### WebView ↔ React Native (Mobile Map)
- On marker click inside SVG Map WebView:
  - `window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MARKER_CLICK', issueId: id }))`
- On WebView load/update:
  - Coordinate radius proximity display updates based on radius props.
