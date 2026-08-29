import { mountHomeChecklist } from "../bootstrap";
import { configurePlatform } from "../platform/runtime";
import { createWebPlatform } from "../platform/web";

configurePlatform(createWebPlatform("web"));

const root = document.getElementById("root");
if (!root) throw new Error("Home Checklist root element was not found.");

mountHomeChecklist(root);
