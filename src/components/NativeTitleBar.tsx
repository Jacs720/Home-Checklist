import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function NativeTitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    let unlisten: (() => void) | undefined;

    const syncMaximized = () => {
      void appWindow.isMaximized().then(setMaximized).catch(() => undefined);
    };

    syncMaximized();
    void appWindow.onResized(syncMaximized).then((stopListening) => {
      unlisten = stopListening;
    }).catch(() => undefined);

    return () => unlisten?.();
  }, []);

  const minimize = () => void getCurrentWindow().minimize();
  const toggleMaximize = () => void getCurrentWindow().toggleMaximize();
  const close = () => void getCurrentWindow().close();

  return (
    <div className="native-titlebar" data-tauri-drag-region>
      <div className="native-titlebar-drag" data-tauri-drag-region aria-hidden="true" />
      <div className="native-window-controls" aria-label="Window controls">
        <button type="button" className="native-window-button native-window-minimize" aria-label="Minimize" onClick={minimize}>
          <span aria-hidden="true" />
        </button>
        <button type="button" className={`native-window-button native-window-maximize ${maximized ? "is-maximized" : ""}`} aria-label={maximized ? "Restore" : "Maximize"} onClick={toggleMaximize}>
          <span aria-hidden="true" />
        </button>
        <button type="button" className="native-window-button native-window-close" aria-label="Close" onClick={close}>
          <span aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
