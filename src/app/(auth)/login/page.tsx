'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, GraduationCap } from 'lucide-react';
import type { AuthError } from '@supabase/supabase-js';

/**
 * Login Page
 * 
 * Halaman autentikasi untuk login pengguna.
 * Menggunakan Supabase Auth dengan email/password.
 */
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const supabase = getSupabaseBrowserClient();

    /**
     * Handle form submission
     */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Validasi input
            if (!email || !password) {
                setError('Email dan password harus diisi.');
                setIsLoading(false);
                return;
            }

            // Attempt login dengan Supabase Auth
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                // Tangani error authentication
                const errorMessage = handleAuthError(authError as AuthError);
                setError(errorMessage);
                setIsLoading(false);
                return;
            }

            // Login berhasil - middleware akan redirect ke dashboard
            // atau halaman yang diminta sebelumnya
            router.push('/(protected)/dashboard');
            router.refresh();

        } catch (err) {
            console.error('Login error:', err);
            setError('Terjadi kesalahan saat login. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle authentication errors
     */
    const handleAuthError = (error: AuthError): string => {
        switch (error.message) {
            case 'Invalid login credentials':
                return 'Email atau password yang Anda masukkan salah.';
            case 'Email not confirmed':
                return 'Email belum diverifikasi. Silakan cek email Anda.';
            case 'User not found':
                return 'Pengguna tidak ditemukan.';
            case 'Invalid email':
                return 'Format email tidak valid.';
            default:
                return error.message || 'Terjadi kesalahan saat login.';
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo & Title */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <GraduationCap className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Guru Spenturi v2</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Sistem Administrasi Kurikulum Sekolah
                    </p>
                </div>

                {/* Login Card */}
                <Card className="shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl">Masuk</CardTitle>
                        <CardDescription>
                            Masukkan email dan password Anda untuk mengakses sistem
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleLogin}>
                        <CardContent className="space-y-4">
                            {/* Error Alert */}
                            {error && (
                                <Alert variant="destructive" className="animate-fade-in">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Email Input */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@sekolah.sch.id"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col space-y-4">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Masuk...
                                    </>
                                ) : (
                                    'Masuk'
                                )}
                            </Button>

                            <p className="text-center text-xs text-muted-foreground">
                                Gunakan akun yang telah diberikan oleh administrator.
                            </p>
                        </CardFooter>
                    </form>
                </Card>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-muted-foreground">
                    © {new Date().getFullYear()} SMP Negeri 1 Spenturi. Hak cipta dilindungi.
                </p>
            </div>
        </div>
    );
}