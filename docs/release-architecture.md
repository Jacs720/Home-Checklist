# Release architecture

Home Checklist keeps one React application and changes only the platform adapter used at startup. The catalog rules, translations, views, hooks, and responsive HOME grids remain shared across every release.

```text
src/
├─ entries/
│  └─ web.tsx             Browser/GitHub Pages entry point
├─ platform/
│  ├─ contracts.ts        Stable boundary used by the application
│  ├─ runtime.ts          Selects the adapter at startup
│  ├─ web.ts              localStorage and browser downloads
│  └─ tauri.ts            Tauri bridge contract for desktop/Android
├─ bootstrap.tsx          Shared React mount
├─ hooks/                 Application state and persistence orchestration
├─ views/                 Product UI
└─ styles/mobile.css      Phone-only layout; preserves both 6 × 5 grids
```

## Release targets

| Release | Frontend | Platform adapter | Artifact |
| --- | --- | --- | --- |
| Web | Existing Vite build | `createWebPlatform("web")` | Static `dist/` deployed by GitHub Pages |
| Windows | Same Vite build inside Tauri 2 | `createTauriPlatform("desktop", bridge)` | NSIS `.exe` (and optionally MSI) |
| Android | Same Vite build inside Tauri 2 | `createTauriPlatform("android", bridge)` | `.apk` for direct installation and optionally `.aab` for Play |

The web release remains the source of truth. Native releases must not copy views or domain modules into platform-specific folders.

## Tauri 2 integration point

When native releases are scheduled:

1. Initialize Tauri at the repository root so `src-tauri/tauri.conf.json` points `frontendDist` to `../dist`, uses `http://localhost:5173` for `devUrl`, and runs the existing Vite scripts before development and builds.
2. Add a native entry point next to `entries/web.tsx`. It should construct the bridge for `createTauriPlatform` and then call `mountHomeChecklist`.
3. Implement persistence with the Tauri store plugin and text export with the dialog and filesystem plugins. The UI and hooks already consume these capabilities through `platform/contracts.ts`.
4. Keep permissions narrow in Tauri capabilities: application data storage and user-selected export paths are sufficient for the current product.
5. Add separate CI jobs for Windows and Android only after signing credentials and release channels have been decided.

The Vite server already uses a fixed port, accepts `TAURI_DEV_HOST`, exposes Tauri build environment variables, and ignores the future Rust directory while watching files.

## Non-platform browser APIs

DOM rendering, keyboard handling, responsive measurements, canvas image preparation, and URL hash navigation remain in the shared frontend because Tauri renders the same application in a webview. Storage and file export are isolated because their native behavior and permissions differ materially from a browser.
