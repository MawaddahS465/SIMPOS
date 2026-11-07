export type Category = "Frame" | "Lensa" | "Aksesoris";

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  tag?: string;
};

/** Katalog DEMO — data sampel untuk simulasi frontend. */
export const PRODUCTS: Product[] = [
  { id: "P-001", name: "Titanium Classic", brand: "Ray-Ban", category: "Frame", price: 1_850_000 },
  { id: "P-002", name: "Urban Square", brand: "Oakley", category: "Frame", price: 1_620_000 },
  { id: "P-003", name: "Bella Round", brand: "Vogue", category: "Frame", price: 1_480_000 },
  { id: "P-004", name: "Metro Classic", brand: "Levi's", category: "Frame", price: 1_250_000 },
  { id: "P-005", name: "AirFlex", brand: "Excellence", category: "Frame", price: 1_720_000 },
  { id: "P-006", name: "Heritage", brand: "Moscot", category: "Frame", price: 2_100_000 },
  { id: "P-007", name: "Lensa Single Vision", brand: "Essilor", category: "Lensa", price: 750_000, tag: "Visi tunggal" },
  { id: "P-008", name: "Lensa Blue Control", brand: "Hoya", category: "Lensa", price: 1_250_000, tag: "Anti biru" },
  { id: "P-009", name: "Lensa Progressive", brand: "Zeiss", category: "Lensa", price: 1_950_000, tag: "Progressif" },
  { id: "P-010", name: "Paket Case & Lap", brand: "Optik Mekar Jaya", category: "Aksesoris", price: 150_000 },
  { id: "P-011", name: "Cleaning Kit", brand: "Makar Eyewear", category: "Aksesoris", price: 90_000 },
];

export const CATEGORIES: Array<"Semua" | Category> = ["Semua", "Frame", "Lensa", "Aksesoris"];

export const formatIDR = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);