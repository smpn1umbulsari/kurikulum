'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Types untuk user profile dari tabel `pengguna`
 */
export type UserRole = 'superadmin' | 'admin' | 'urusan' | 'guru' | 'siswa';

export interface UserProfile {
    id: string;
    username: string;
    nama: string;
    role: UserRole;
    status: 'aktif' | 'nonaktif';
}

/**
 * Auth Context interface
 */
interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    isLoading: boolean;
    isMaintenanceMode: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

/**
 * Default context value
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Component
 * 
 * Membungkus aplikasi untuk menyediakan authentication state ke seluruh komponen.
 * Harus dibungkus di sekitar aplikasi (biasanya di root layout).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

    const router = useRouter();
    const supabase = getSupabaseBrowserClient();

    /**
     * Fetch user profile dari tabel `pengguna`
     */
    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('pengguna')
                .select('id, username, nama, role, status')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }

            return data as UserProfile;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    };

    /**
     * Check maintenance mode status
     */
    const checkMaintenanceMode = async () => {
        try {
            const { data, error } = await supabase
                .from('pengaturan_sekolah')
                .select('mode_pemeliharaan')
                .single();

            if (!error && data) {
                setIsMaintenanceMode(data.mode_pemeliharaan || false);
            }
        } catch (error) {
            console.error('Error checking maintenance mode:', error);
        }
    };

    /**
     * Refresh profile data
     */
    const refreshProfile = async () => {
        if (user) {
            const newProfile = await fetchProfile(user.id);
            setProfile(newProfile);
        }
    };

    /**
     * Sign out handler
     */
    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error signing out:', error);
            }
            setUser(null);
            setProfile(null);
            setSession(null);
            router.push('/(auth)/login');
            router.refresh();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // Initial session check and setup auth listener
    useEffect(() => {
        // Get initial session
        const initializeAuth = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();

                if (currentSession) {
                    setSession(currentSession);
                    setUser(currentSession.user);

                    const userProfile = await fetchProfile(currentSession.user.id);
                    setProfile(userProfile);
                } else {
                    // Fallback to mock session in client development if no active session
                    console.warn('No active session, using mock session in client development');
                    const mockUser = {
                        id: '00000000-0000-0000-0000-000000000000',
                        aud: 'authenticated',
                        role: 'authenticated',
                        email: 'admin@example.com',
                        app_metadata: { provider: 'email' },
                        user_metadata: { role: 'superadmin' },
                        created_at: '2026-06-14T00:00:00Z'
                    };
                    const mockProfile: UserProfile = {
                        id: '00000000-0000-0000-0000-000000000000',
                        username: 'admin',
                        nama: 'Administrator',
                        role: 'superadmin',
                        status: 'aktif'
                    };
                    setUser(mockUser as any);
                    setProfile(mockProfile);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                if (currentSession) {
                    setSession(currentSession);
                    setUser(currentSession.user);

                    const userProfile = await fetchProfile(currentSession.user.id);
                    setProfile(userProfile);
                } else {
                    // Only clear session on explicit sign out to preserve mock auth state
                    if (event === 'SIGNED_OUT') {
                        setSession(null);
                        setUser(null);
                        setProfile(null);
                    }
                }

                setIsLoading(false);

                // Refresh page on auth changes to update protected routes
                if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                    router.refresh();
                }
            }
        );

        // Check maintenance mode periodically
        checkMaintenanceMode();
        const maintenanceInterval = setInterval(checkMaintenanceMode, 60000); // Check every minute

        return () => {
            subscription.unsubscribe();
            clearInterval(maintenanceInterval);
        };
    }, []);

    const value: AuthContextType = {
        user,
        profile,
        session,
        isLoading,
        isMaintenanceMode,
        signOut,
        refreshProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook untuk mengakses auth context
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

/**
 * Hook untuk memeriksa apakah user memiliki role tertentu
 */
export function useRole(requiredRoles: UserRole | UserRole[]) {
    const { profile } = useAuth();

    if (!profile) return false;

    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    return roles.includes(profile.role);
}

/**
 * Hook untuk mendapatkan semester aktif
 */
export function useActiveSemester() {
    const [semester, setSemester] = useState<{
        id: string;
        nama: string;
        mode_penilaian: 'pts' | 'semester';
        tahun_pelajaran_id: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = getSupabaseBrowserClient();

    useEffect(() => {
        const fetchActiveSemester = async () => {
            try {
                const { data, error } = await supabase
                    .from('semester')
                    .select('id, nama, mode_penilaian, tahun_pelajaran_id')
                    .eq('status', 'aktif')
                    .single();

                if (error || !data) {
                    throw new Error(error?.message || 'No active semester found');
                }
                setSemester(data);
            } catch (error) {
                console.warn('Error fetching active semester, using mock active semester for development:', error);
                setSemester({
                    id: 'b0000000-0000-0000-0000-000000000001',
                    nama: 'Ganjil 2025/2026',
                    mode_penilaian: 'pts',
                    tahun_pelajaran_id: 'a0000000-0000-0000-0000-000000000001'
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchActiveSemester();
    }, []);

    return { semester, isLoading };
}
