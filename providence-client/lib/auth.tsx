'use client';

import {
  useCallback,
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase/client';
import { fetchPaged } from '@/lib/supabase/fetch-paged';

export type UserRole = 'superuser' | 'admin' | 'user';
export type UserType = 'student' | 'staff';

export interface User {
  id: string;
  email?: string | null;
  name: string;
  level: string;
  role: UserRole;
  userType?: UserType;
  matricule?: string;
  profileComplete?: number;
  /** Mode d'accueil : null = pas encore choisi (écran de choix). */
  homeMode?: HomeMode | null;
  /** Date de désactivation (migration 0005) ; null = compte actif. */
  deactivatedAt?: string | null;
  /** Organisation de rattachement (migration 0005) ; null = aucune. */
  organisationId?: string | null;
  createdAt: string;
}

/** Résultat d'une tentative de connexion, avec la raison d'un échec. */
export type LoginResult = { ok: true } | { ok: false; reason: 'disabled' | 'invalid' };

export type HomeMode = 'parcours' | 'libre';

export interface StoredUser extends User {
  password?: string;
}

// TOKEN_KEY n'est plus la source de vérité (Supabase gère sa propre session) ;
// conservé pour compat avec le code qui nettoie encore ces clés au logout.
export const TOKEN_KEY = 'providence_token';
export const USER_KEY = 'providence_user';

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: UserRole;
  user_type: UserType;
  level: string;
  matricule: string | null;
  profile_complete: number;
  /** Absente tant que la migration 0004 n'est pas appliquée. */
  home_mode?: HomeMode | null;
  deactivated_at?: string | null;
  organisation_id?: string | null;
  created_at: string;
};

function mapProfileToUser(p: ProfileRow): User {
  return {
    id: p.id,
    email: p.email,
    name: p.display_name ?? p.matricule ?? p.email ?? 'Utilisateur',
    level: p.level,
    role: p.role,
    userType: p.user_type,
    matricule: p.matricule ?? undefined,
    profileComplete: p.profile_complete,
    homeMode: p.home_mode ?? null,
    deactivatedAt: p.deactivated_at ?? null,
    organisationId: p.organisation_id ?? null,
    createdAt: p.created_at,
  };
}

async function fetchProfile(id: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data as ProfileRow;
}

function persistUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function readError(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { message?: string };
    if (j.message) return j.message;
  } catch {
    /* ignore */
  }
  return text || `HTTP ${res.status}`;
}

/** Requête vers les routes /api avec le jeton de session de l'utilisateur. */
export async function authFetch(path: string, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  return fetch(path, { ...init, headers });
}

interface AuthContextType {
  user: User | null;
  login: (
    email: string | undefined,
    password: string,
    matricule?: string,
  ) => Promise<LoginResult>;
  loginWithMatricule: (matricule: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  /** Enregistre le mode d'accueil dans le profil. */
  setHomeMode: (mode: HomeMode) => Promise<void>;
  isLoading: boolean;
  getAllUsers: () => Promise<StoredUser[]>;
  createUser: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    level: string,
    /** Organisation de rattachement (facultative ; imposée par l'API pour un admin rattaché). */
    organisationId?: string | null,
  ) => Promise<{ ok: boolean; error?: string }>;
  createStudent: (
    name: string,
    password: string,
    organisationId: string | null,
    level?: string,
  ) => Promise<{ ok: boolean; matricule?: string; error?: string }>;
  updateUser: (
    id: string,
    updates: Partial<Omit<StoredUser, 'id' | 'createdAt'>>,
  ) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (active && profile?.deactivated_at) {
          // Compte désactivé pendant la session : on coupe tout de suite.
          await supabase.auth.signOut();
          localStorage.removeItem(USER_KEY);
        } else if (active && profile) {
          const appUser = mapProfileToUser(profile);
          setUser(appUser);
          persistUser(appUser);
        }
      } else {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
      if (active) setIsLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (
    email: string | undefined,
    password: string,
    matricule?: string,
  ): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      let resolvedEmail = email?.trim();
      if (!resolvedEmail && matricule?.trim()) {
        const { data, error } = await supabase.rpc('email_for_matricule', {
          p_matricule: matricule.trim(),
        });
        if (error || !data) throw new Error('Matricule introuvable');
        resolvedEmail = data as string;
      }
      if (!resolvedEmail) throw new Error('Email ou matricule requis');

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: resolvedEmail,
          password,
        });
      if (signInError || !signInData.user) {
        // Compte banni par un admin (désactivation) : Supabase le signale.
        if (signInError?.code === 'user_banned' || /banned/i.test(signInError?.message ?? '')) {
          return { ok: false, reason: 'disabled' };
        }
        throw new Error(signInError?.message ?? 'Identifiants incorrects');
      }

      const profile = await fetchProfile(signInData.user.id);
      if (!profile) throw new Error('Profil introuvable');
      if (profile.deactivated_at) {
        // Double sécurité si le bannissement n'a pas été posé côté Auth
        await supabase.auth.signOut();
        return { ok: false, reason: 'disabled' };
      }

      const appUser = mapProfileToUser(profile);
      setUser(appUser);
      persistUser(appUser);
      return { ok: true };
    } catch (e) {
      console.error('Login error:', e);
      return { ok: false, reason: 'invalid' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithMatricule = async (
    matricule: string,
    password: string,
  ): Promise<LoginResult> => {
    return login(undefined, password, matricule);
  };

  // Inscription publique supprimée : les comptes sont créés exclusivement par
  // un administrateur via /dashboard/admin → POST /api/users/manage (clé
  // service_role). Le verrou qui fait foi est côté Supabase :
  // Authentication → Sign In / Providers → Email → « Allow new users to sign up » OFF.
  // Sans ce réglage, n'importe qui peut appeler supabase.auth.signUp() avec la
  // clé anon, qui est publique par conception.

  const setHomeMode = async (mode: HomeMode): Promise<void> => {
    if (!user) return;
    // Optimiste : l'accueil change tout de suite.
    const next = { ...user, homeMode: mode };
    setUser(next);
    persistUser(next);
    const { error } = await supabase.from('profiles').update({ home_mode: mode }).eq('id', user.id);
    if (error) {
      // Migration 0004 pas encore appliquée, ou réseau : le choix reste valable
      // pour cette session, mais il n'est pas enregistré dans le compte.
      console.warn('[parcours] mode non enregistré dans le profil :', error.message);
    }
  };

  const logout = () => {
    void supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  // Stable entre les rendus : les pages peuvent la déclarer en dépendance d'un
  // effet sans déclencher de rechargement à chaque rendu du contexte.
  const getAllUsers = useCallback(async (): Promise<StoredUser[]> => {
    try {
      // Paginé : Supabase plafonne chaque réponse (1 000 lignes par défaut) et
      // tronquerait la liste sans prévenir. Tri sur une clé unique (id) en
      // second, pour des pages stables.
      const rows = await fetchPaged<ProfileRow>((from, to) =>
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .order('id')
          .range(from, to),
      );
      return rows.map((p) => mapProfileToUser(p) as StoredUser);
    } catch (e) {
      console.error('Get users error:', e);
      return [];
    }
  }, []);

  const createUser = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    level: string,
    organisationId?: string | null,
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await authFetch('/api/users/manage', {
        method: 'POST',
        body: JSON.stringify({
          email,
          displayName: name,
          password,
          role,
          userType: 'staff',
          level,
          organisationId: organisationId || null,
        }),
      });
      if (!res.ok) throw new Error(await readError(res));
      return { ok: true };
    } catch (e: unknown) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Erreur',
      };
    }
  };

  const createStudent = async (
    name: string,
    password: string,
    organisationId: string | null,
    level = 'Beginner',
  ): Promise<{ ok: boolean; matricule?: string; error?: string }> => {
    try {
      const res = await authFetch('/api/users/manage', {
        method: 'POST',
        body: JSON.stringify({
          displayName: name,
          password,
          userType: 'student',
          role: 'user',
          level,
          organisationId,
        }),
      });
      if (!res.ok) throw new Error(await readError(res));
      const row = (await res.json()) as ProfileRow;
      return { ok: true, matricule: row.matricule ?? undefined };
    } catch (e: unknown) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : 'Erreur',
      };
    }
  };

  const updateUser = async (
    id: string,
    updates: Partial<Omit<StoredUser, 'id' | 'createdAt'>>,
  ): Promise<boolean> => {
    try {
      const body: Record<string, unknown> = {};
      if (updates.name != null) body.displayName = updates.name;
      if (updates.email !== undefined) body.email = updates.email;
      if (updates.role != null) body.role = updates.role;
      if (updates.level != null) body.level = updates.level;
      if (updates.userType != null) body.userType = updates.userType;
      if (updates.organisationId !== undefined) body.organisationId = updates.organisationId;
      if (updates.matricule !== undefined) body.matricule = updates.matricule;
      if (updates.profileComplete !== undefined) {
        body.profileComplete = updates.profileComplete;
      }
      if (updates.password?.trim()) body.password = updates.password;

      const res = await authFetch(`/api/users/manage/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await readError(res));
      const updated = (await res.json()) as ProfileRow;

      if (user?.id === id) {
        const appUser = mapProfileToUser(updated);
        setUser(appUser);
        persistUser(appUser);
      }
      return true;
    } catch (e) {
      console.error('Update user error:', e);
      return false;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      const res = await authFetch(`/api/users/manage/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(await readError(res));
      return true;
    } catch (e) {
      console.error('Delete user error:', e);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithMatricule,
        logout,
        setHomeMode,
        isLoading,
        getAllUsers,
        createUser,
        updateUser,
        deleteUser,
        createStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
