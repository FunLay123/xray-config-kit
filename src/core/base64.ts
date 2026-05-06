const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function base64EncodeUtf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const triple = (first << 16) | (second << 8) | third;
    output += chars[(triple >> 18) & 63];
    output += chars[(triple >> 12) & 63];
    output += index + 1 < bytes.length ? chars[(triple >> 6) & 63] : "=";
    output += index + 2 < bytes.length ? chars[triple & 63] : "=";
  }
  return output;
}

export function base64UrlByteLength(input: string): number | undefined {
  if (!/^[A-Za-z0-9_-]*$/.test(input)) return undefined;
  const mod = input.length % 4;
  if (mod === 1) return undefined;
  const paddedLength = input.length + (mod === 0 ? 0 : 4 - mod);
  let padding = 0;
  if (mod === 2) padding = 2;
  if (mod === 3) padding = 1;
  return (paddedLength / 4) * 3 - padding;
}
