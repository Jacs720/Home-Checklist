export type ReleaseTarget = "web" | "desktop" | "android";

export type StoredValue = string | null;

export interface PlatformStorage {
  get(key: string): Promise<StoredValue>;
  set(key: string, value: string): Promise<void>;
}

export interface PlatformFiles {
  saveText(filename: string, text: string, mimeType: string): Promise<void>;
}

export interface HomeChecklistPlatform {
  target: ReleaseTarget;
  storage: PlatformStorage;
  files: PlatformFiles;
  setDocumentLanguage(language: string): void;
  showAlert(message: string): void;
}
