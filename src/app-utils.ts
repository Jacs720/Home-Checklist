export const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const chunk = <T,>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));

export function downloadText(filename: string, text: string, type: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type }));
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1_000);
}

export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export async function prepareThemeImage(file: File) {
  if (!/^image\/(?:png|jpeg|webp)$/i.test(file.type) || file.size > 12_000_000) throw new Error("invalid-image");
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("invalid-image"));
    reader.onerror = () => reject(new Error("invalid-image"));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("invalid-image"));
    element.src = source;
  });
  const scale = Math.min(1, 1600 / image.naturalWidth, 900 / image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("invalid-image");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  let prepared = canvas.toDataURL("image/webp", .78);
  if (prepared.length > 3_000_000) prepared = canvas.toDataURL("image/webp", .58);
  if (prepared.length > 3_500_000) throw new Error("invalid-image");
  return prepared;
}
