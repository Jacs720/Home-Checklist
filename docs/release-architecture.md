# Release architecture

Home Checklist keeps one React application and changes only the platform adapter used at startup. The catalog rules, translations, views, hooks, and responsive HOME grids remain shared across every release.

```text
src/
├─ entries/
│  ├─ web.tsx             Browser/GitHub Pages entry point
│  └─ tauri.tsx           Shared Windows/Android native entry point
├─ platform/
│  ├─ contracts.ts        Stable boundary used by the application
│  ├─ runtime.ts          Selects the adapter at startup
│  ├─ web.ts              localStorage and browser downloads
│  ├─ tauri.ts            Tauri platform adapter
│  └─ tauri-bridge.ts     Store, dialog, and filesystem plugins
├─ bootstrap.tsx          Shared React mount
├─ hooks/                 Application state and persistence orchestration
├─ views/                 Product UI
└─ styles/mobile.css      Phone-only layout; preserves both 6 × 5 grids

src-tauri/
├─ capabilities/          Minimum native permissions
├─ gen/android/           Tauri Android/Gradle project
├─ icons/                 Windows and Android icon variants
├─ src/                   Small Rust shell
└─ tauri.conf.json        Shared native build configuration
```

## Release targets

| Release | Frontend | Platform adapter | Artifact |
| --- | --- | --- | --- |
| Web | Existing Vite build | `createWebPlatform("web")` | Static `dist/` deployed by GitHub Pages |
| Windows | Same Vite build inside Tauri 2 | `createTauriPlatform("desktop", bridge)` | NSIS `.exe` |
| Android | Same Vite build inside Tauri 2 | `createTauriPlatform("android", bridge)` | ARM64 `.apk`; universal APK/AAB when needed |

The web release remains the source of truth. Native releases must not copy views or domain modules into platform-specific folders.

## How Tauri 2 is integrated

`src/main.tsx` detects Tauri at runtime and loads the native entry only inside a Tauri webview. The web entry continues to use `localStorage` and browser downloads. The native entry constructs a bridge backed by Tauri Store, Dialog, and Filesystem plugins, then mounts the same React application.

The Rust side deliberately stays small. It creates the window/webview and registers only the plugins the current UI needs. `capabilities/default.json` grants only store load/read/write/save, a save dialog, error messages, and text-file writes. This keeps platform code separate without cloning product UI or domain logic.

Tauri uses the operating system web renderer (WebView2 on Windows and Android System WebView on Android). React still owns rendering, so a native package does not automatically make an expensive component fast; it improves packaging, local startup/assets, native persistence, and native file handling while preserving the existing app.

## Build requirements and artifacts

| Command | Local requirement | Output |
| --- | --- | --- |
| `npm run release:web` | Node.js | `dist/` |
| `npm run release:windows` | Rust, MSVC C++ tools, WebView2 | `src-tauri/target/release/bundle/nsis/*-setup.exe` |
| `npm run release:android` | Rust Android target, JDK 17+, Android SDK/NDK | ARM64 APK under `src-tauri/gen/android/app/build/outputs/apk/` |
| `npm run release:android:universal` | All four Rust Android targets | Universal Android package |

The Windows installer produced locally is unsigned until a code-signing certificate is configured. Android production builds need a private keystore and should normally publish an AAB; test signing is intentionally kept outside Git. On Windows, the standard Tauri Android command creates a JNI symbolic link and therefore needs Windows Developer Mode or an equivalent symlink privilege.

Generated installers and APKs belong in the ignored `artifacts/` directory when they need a stable local handoff path. Build caches, native libraries, local Android properties, and signing files are ignored.

## Animations without separate apps

Animations can be added once in shared React/CSS and will run in all three releases. Prefer `transform` and `opacity`, honor `prefers-reduced-motion`, and avoid animating layout-heavy properties across all 30 visible slots. A genuinely platform-specific interaction can branch on `getPlatform().target`, but platform-specific copies of a view should remain a last resort.

The highest-value performance work remains shared: split the current large bootstrap chunk, memoize expensive derived collection data, decode/lazy-load sprites near the viewport, and use CSS containment where it does not affect interaction. Windowing may hide off-screen boxes, but it must never change the logical 6 × 5 box or Pokémon grids.

## Release policy

Web remains the easiest release to publish. Native release automation should be added after Windows certificate storage, Android keystore storage, and version/tag conventions are decided. Secrets must live in the release environment, never in this repository.

## Non-platform browser APIs

DOM rendering, keyboard handling, responsive measurements, canvas image preparation, and URL hash navigation remain in the shared frontend because Tauri renders the same application in a webview. Storage and file export are isolated because their native behavior and permissions differ materially from a browser.
