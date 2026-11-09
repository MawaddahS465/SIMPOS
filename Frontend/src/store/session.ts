import type { AuthUser, Role } from "../lib/api";

/* ==========================================================================
   SESSION VIEW — bentuk data sesi untuk komponen tampilan.
   Sumber kebenaran autentikasi ada di Backend (AuthContext + /api/me).
   File ini tidak lagi membaca/menulis localStorage.
   ========================================================================== */

export type { Role };

export type Session = {
  id: number;
  role: Role;
  name: string;
  username: string;
  initials: string;
  /** Label cabang untuk tampilan. */
  branch: string;
  /** ID cabang dari Backend — sumber kebenaran autentikasi. */
  backendBranchId: number | null;
};

export const ROLE_LABEL: Record<Role, string> = {
  kasir: "Kasir",
  admin: "Admin Cabang",
  pemilik: "Pemilik",
};

export const ROLE_HOME: Record<Role, string> = {
  kasir: "/dashboard",
  admin: "/admin/dashboard",
  pemilik: "/owner/dashboard",
};

/** Kunci sesi demo lama — dibersihkan agar tidak ada role lokal yang tersisa. */
export const LEGACY_SESSION_KEYS = ["simpos.session", "simpos.admin.session"] as const;

export function isRole(value: unknown): value is Role {
  return value === "kasir" || value === "admin" || value === "pemilik";
}

export function initialsFromName(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

export function sessionFromUser(user: AuthUser): Session {
  const isOwner = user.role === "pemilik";

  return {
    id: user.id,
    role: user.role,
    name: user.name,
    username: user.username,
    initials: initialsFromName(user.name),
    // Nama cabang belum tersedia di respons autentikasi Backend.
    // Tampilkan ID cabang agar tidak mengarang nama.
    branch: isOwner ? "Seluruh Cabang" : `Cabang #${user.branchId ?? "-"}`,
    backendBranchId: user.branchId,
  };
}
