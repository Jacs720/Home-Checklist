# Home checklist

Home Checklist is a visual tool for planning and tracking a Pokémon HOME collection.

It allows you to organize Pokémon by origin marks, boxes, variants, source, and special collections. It also displays the exact order of each box and saves your collection progress in the browser.

## Build the collection you actually want

Choose a ready-made collection profile or shape the checklist around your own goals. Home Checklist supports Living Dexes, every storable form, regional forms, gender differences, shiny collections, origin marks, event Pokémon, in-game trades, Pokémon GO, Pokéwalker encounters, HOME Challenges, and special collections.

## Find, inspect, and plan

- Browse the complete collection as HOME-style boxes or as a searchable Global view.
- Filter missing Pokémon, favorites, availability, Pokéwalker encounters, and HOME Challenges.
- Sort and group Global results by HOME order, Pokédex number, generation, origin mark, or collection.
- Open any result directly in its exact box and slot, then return to the same result list.
- Review how each entry is obtained, whether Pokémon Bank is required, and why it belongs in the checklist.
- Rename planned boxes, create custom boxes, choose box artwork, and keep personal goals and notes.
- Share links to a search, a filtered Global view, or a specific box and slot without sharing collection progress.
- Import collection records and Austin John’s normal HOME Organizer, or create a portable backup whenever you want.

## One interface, three releases

The Vite/React application is shared by the web, Windows, and Android releases. Tauri 2 supplies the native window and a small adapter for persistent storage, save dialogs, and file writes; catalog rules, translations, views, responsive behavior, and the HOME-style 6-column × 5-row grids stay in one codebase.

- `npm run release:web` validates and builds the static `dist/` release.
- `npm run release:windows` creates the Windows NSIS installer under `src-tauri/target/release/bundle/nsis/`.
- `npm run release:android` creates an ARM64 Android package. Use `npm run release:android:universal` only when emulator/legacy CPU variants are also required.
- `npm run native:dev` opens the shared UI in the desktop Tauri shell for development.

Windows installers must be code-signed before public distribution to avoid SmartScreen warnings. Android production releases require a private signing keystore; a debug/test-signed APK is suitable only for direct testing. Android builds started from Windows also require permission to create symbolic links (normally Windows Developer Mode).

The platform boundary, build requirements, animation strategy, and performance notes are documented in [`docs/release-architecture.md`](docs/release-architecture.md).

## Preview

![A complete Pokémon HOME box organized in Home Checklist](public/assets/home-checklist-social-preview.png)

##

GO reserves numbers 1–1025 even when transfer is currently unavailable.

## IMPORTANT NOTICE

It is highly recommended to use the backup option at the bottom left, as the application does not use a server or accounts. The web release stores progress in `localStorage`; native releases use Tauri's application store. The **Export** and **Import** tools create and restore portable JSON backups.
