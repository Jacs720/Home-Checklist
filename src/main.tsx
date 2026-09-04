if ("__TAURI_INTERNALS__" in globalThis) {
  void import("./entries/tauri");
} else {
  void import("./entries/web");
}
