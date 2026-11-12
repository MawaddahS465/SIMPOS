import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { authApi, ApiError, type AuthUser, type Role } from "../lib/api";
import {
  LEGACY_SESSION_KEYS,
  isRole,
  sessionFromUser,
  type Session,
} from "./session";

/* ==========================================================================
   AUTH CONTEXT — autentikasi bersumber dari session Backend.
   - Saat aplikasi dibuka/refresh: GET /api/me.
   - Login/logout selalu melalui API.
   - Tidak menyimpan sesi atau password di localStorage.
   ========================================================================== */

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  session: Session | null;
  signIn: (username: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refresh: () => Promise<AuthUser | null>;
};

const AuthCtx = createContext<AuthContextValue | null>(null);

function clearLegacySessions(): void {
  try {
    for (const key of LEGACY_SESSION_KEYS) localStorage.removeItem(key);
  } catch {
    // localStorage bisa diblokir; tidak memengaruhi autentikasi Backend.
  }
}

function validUser(response: { user?: AuthUser }): AuthUser | null {
  return response.user && isRole(response.user.role) ? response.user : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");
  const bootstrapped = useRef(false);

  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const response = await authApi.me();
      const nextUser = validUser(response);

      if (!nextUser) {
        setUser(null);
        setStatus("unauthenticated");
        return null;
      }

      setUser(nextUser);
      setStatus("authenticated");
      return nextUser;
    } catch (error) {
      // 401 berarti belum/tidak lagi login. Error koneksi juga membuat UI
      // berada di halaman login, bukan berputar tanpa akhir.
      if (!(error instanceof ApiError) || error.status !== 401) {
        console.error("Pemeriksaan sesi gagal:", error);
      }
      setUser(null);
      setStatus("unauthenticated");
      return null;
    }
  }, []);

  useEffect(() => {
    // Ref mencegah GET /api/me ganda dari double-effect StrictMode di dev.
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    clearLegacySessions();
    void refresh();
  }, [refresh]);

  // Bila halaman dipulihkan dari back-forward cache, validasi ulang sesi
  // agar halaman terlindungi tidak tampil setelah logout.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) void refresh();
    };

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [refresh]);

  const signIn = useCallback(
    async (username: string, password: string): Promise<AuthUser> => {
      const response = await authApi.login(username, password);
      const nextUser = validUser(response);

      if (!nextUser) {
        throw new ApiError("Respons login tidak valid.", 500, response);
      }

      setUser(nextUser);
      setStatus("authenticated");
      return nextUser;
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout API gagal:", error);
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const session = useMemo(() => (user ? sessionFromUser(user) : null), [user]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, session, signIn, signOut, refresh }),
    [status, user, session, signIn, signOut, refresh],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthCtx);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
