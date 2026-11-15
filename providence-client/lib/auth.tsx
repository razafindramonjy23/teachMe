'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase/client';

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
  location?: string;
  courseLevel?: string;
  profileComplete?: number;
  /** Mode d'accueil : null = pas encore choisi (écran de choix). */
  homeMode?: HomeMode | null;
  createdAt: string;
}

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
  location: string | null;
  course_level: string | null;
  profile_complete: number;
  /** Absente tant que la migration 0004 n'est pas appliquée. */
  home_mode?: HomeMode | null;
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
    location: p.location ?? undefined,
    courseLevel: p.course_level ?? undefined,
    profileComplete: p.profile_complete,
    homeMode: p.home_mode ?? null,
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

async function authFetch(path: string, init: RequestInit = {}) {
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
  ) => Promise<boolean>;
  loginWithMatricule: (matricule: string, password: string) => Promise<boolean>;
  completeStudentProfile: (
    userId: string,
    location: string,
    courseLevel: string,
  ) => Promise<boolean>;
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
  ) => Promise<{ ok: boolean; error?: string }>;
  createStudent: (
    name: string,
    password: string,
    location: string,
    courseLevel: string,
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
        if (active && profile) {
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
  ): Promise<boolean> => {
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
        throw new Error(signInError?.message ?? 'Identifiants incorrects');
      }

      const profile = await fetchProfile(signInData.user.id);
      if (!profile) throw new Error('Profil introuvable');

      const appUser = mapProfileToUser(profile);
      setUser(appUser);
      persistUser(appUser);
      return true;
    } catch (e) {
      console.error('Login error:', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithMatricule = async (
    matricule: string,
    password: string,
  ): Promise<boolean> => {
    return login(undefined, password, matricule);
  };

  // Inscription publique supprimée : les comptes sont créés exclusivement par
  // un administrateur via /dashboard/admin → POST /api/users/manage (clé
  // service_role). Le verrou qui fait foi est côté Supabase :
  // Authentication → Sign In / Providers → Email → « Allow new users to sign up » OFF.
  // Sans ce réglage, n'importe qui peut appeler supabase.auth.signUp() avec la
  // clé anon, qui est publique par conception.

  const completeStudentProfile = async (
    userId: string,
    location: string,
    courseLevel: string,
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          location,
          course_level: courseLevel,
          profile_complete: 100,
        })
        .eq('id', userId)
        .select()
        .single();
      if (error || !data) throw new Error(error?.message ?? 'Erreur');

      const appUser = mapProfileToUser(data as ProfileRow);
      setUser(appUser);
      persistUser(appUser);
      return true;
    } catch (e) {
      console.error('Complete profile error:', e);
      return false;
    }
  };

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

  const getAllUsers = async (): Promise<StoredUser[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) throw new Error(error?.message ?? 'Erreur');
      return (data as ProfileRow[]).map((p) => mapProfileToUser(p) as StoredUser);
    } catch (e) {
      console.error('Get users error:', e);
      return [];
    }
  };

  const createUser = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    level: string,
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
    location: string,
    courseLevel: string,
  ): Promise<{ ok: boolean; matricule?: string; error?: string }> => {
    try {
      const res = await authFetch('/api/users/manage', {
        method: 'POST',
        body: JSON.stringify({
          displayName: name,
          password,
          userType: 'student',
          role: 'user',
          level: 'Beginner',
          location,
          courseLevel,
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
      if (updates.location !== undefined) body.location = updates.location;
      if (updates.courseLevel !== undefined) {
        body.courseLevel = updates.courseLevel;
      }
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
        completeStudentProfile,
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
