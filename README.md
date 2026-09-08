# Home checklist

Home Checklist is a visual tool for planning and tracking a Pokémon HOME collection.

It allows you to organize Pokémon by origin marks, boxes, variants, source, and special collections. It also displays the exact order of each box and saves your collection progress in the browser.

## Build the collection you actually want

Start with a ready-made profile or customize the checklist around your own goals. You can build a basic Living Dex, collect only final evolutions, add regional or every storable form, create the shiny versions of those collections, organize Pokémon by origin mark or original generation, build a male-and-female "Noah's Ark," or go all the way with the Completionist profile.

You can also include gender differences, Alpha Pokémon, Gigantamax Factor, event Pokémon, in-game trades, Pokémon GO, Pokéwalker encounters, HOME Challenges, and special collections such as N's Pokémon, Shadow Pokémon, Dream World, Dream Radar, Mightiest Mark raids, Titan Pokémon, and Battle Bond Greninja.

## Find, inspect, and plan

- Browse your collection as HOME-style boxes, search everything in Global view, or open Summary for a clear progress overview.
- See what you have and what you are missing by generation, origin, availability, and Pokémon HOME Challenge progress.
- Use the Game Planner to see which games can help with your current missing Pokémon and open a focused list for that game.
- Filter by missing Pokémon, targets, availability, origin, special collections, Pokéwalker encounters, HOME Challenges, forms, Alpha Pokémon, and Gigantamax Factor.
- Search, sort, and group Global results, then jump straight to the exact box and slot for any Pokémon.
- Open a Pokémon to see what exact specimen you need, how to obtain it, how to transfer it to HOME, and whether Pokémon Bank is required.
- Save box space automatically or combine compatible planned boxes yourself. You can also rename boxes, create custom boxes, choose box artwork, and keep personal goals and notes.
- Share a search, filtered Global view, or specific box and slot without sharing your collection progress.
- Import collection records or Austin John’s normal HOME Organizer, export your progress, and create portable backups whenever you want.

## One interface, three releases

The Vite/React application is shared by the web, Windows, and Android releases. Tauri 2 supplies the native window and a small adapter for persistent storage, save dialogs, and file writes; catalog rules, translations, views, responsive behavior, and the HOME-style 6-column × 5-row grids stay in one codebase.

- `npm run release:web` validates and builds the static `dist/` release.
- `npm run release:windows` creates the Windows NSIS installer under `src-tauri/target/release/bundle/nsis/`.
- `npm run release:android` creates a debug-signed ARM64 APK that can be installed directly on a phone. Use `npm run release:android:universal` only when emulator/legacy CPU variants are also required.
- `npm run package:android:unsigned` preserves the optimized unsigned release package for a later production-signing step.
- `npm run native:dev` opens the shared UI in the desktop Tauri shell for development.

Windows installers must be code-signed before public distribution to avoid SmartScreen warnings. The default Android command is intentionally debug-signed for local sideloading; production releases require a private signing keystore and should use the unsigned packaging command before the signing/publishing step. Android builds started from Windows also require permission to create symbolic links (normally Windows Developer Mode).

The platform boundary, build requirements, animation strategy, and performance notes are documented in [`docs/release-architecture.md`](docs/release-architecture.md).

## Preview

![A complete Pokémon HOME box organized in Home Checklist](public/assets/home-checklist-social-preview.png)

##

GO reserves numbers 1–1025 even when transfer is currently unavailable.

## IMPORTANT NOTICE

It is highly recommended to use the backup option at the bottom left, as the application does not use a server or accounts. The web release stores progress in `localStorage`; native releases use Tauri's application store. The **Export** and **Import** tools create and restore portable JSON backups.
