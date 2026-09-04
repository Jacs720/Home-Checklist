import { mountHomeChecklist } from "../bootstrap";
import { configurePlatform } from "../platform/runtime";
import { createTauriPlatform } from "../platform/tauri";
import { createTauriBridge } from "../platform/tauri-bridge";

const target = /Android/i.test(navigator.userAgent) ? "android" : "desktop";
configurePlatform(createTauriPlatform(target, createTauriBridge()));

const root = document.getElementById("root");
if (!root) throw new Error("Home Checklist root element was not found.");

mountHomeChecklist(root);
