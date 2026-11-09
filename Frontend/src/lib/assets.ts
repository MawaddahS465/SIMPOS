/**
 * URL aset dari folder public yang tetap benar saat aplikasi dipasang di
 * sub-path (mis. /app/ di backend). Jangan menulis "/assets/..." langsung,
 * karena akar URL akan mengarah ke luar aplikasi.
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/")
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;

  return `${base}${path.replace(/^\/+/, "")}`;
}
