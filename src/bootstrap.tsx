import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

export function mountHomeChecklist(element: HTMLElement) {
  return createRoot(element).render(<App />);
}
