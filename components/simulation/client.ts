export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const result = await fetch(url, {
    ...init,
    cache: 'no-store',
    credentials: 'same-origin',
  });
  let body;
  try {
    body = await result.json();
  } catch {
    throw new ApiError(
      'O servidor não respondeu a tempo. Confira o histórico antes de tentar novamente.',
      result.status,
    );
  }
  if (!result.ok)
    throw new ApiError(
      body.error || 'Não foi possível concluir a operação.',
      result.status,
    );
  return body as T;
}
export const jsonRequest = (data: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

// A separate request per photo stays below Vercel's function payload limit.
export async function preparePhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Este navegador não conseguiu preparar a foto.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b
            ? resolve(b)
            : reject(new Error('Não foi possível preparar a fotografia.')),
        'image/jpeg',
        0.9,
      ),
    );
    if (blob.size > 2.5 * 1024 * 1024)
      throw new Error(
        'Esta foto continua muito grande. Exporte-a em JPG com até 1600 pixels.',
      );
    return blob;
  } finally {
    bitmap.close();
  }
}
