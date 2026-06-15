import { AlertTriangle, Wrench } from 'lucide-react';

/**
 * Maintenance Page
 * 
 * Halaman yang ditampilkan ketika sistem dalam mode pemeliharaan.
 * Dibuka oleh middleware ketika mode_pemeliharaan = true.
 */
export default function MaintenancePage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-md text-center">
                {/* Icon */}
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-warning/10">
                    <Wrench className="h-10 w-10 text-warning" />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-foreground">Mode Pemeliharaan</h1>

                {/* Description */}
                <p className="mt-4 text-muted-foreground">
                    Saat ini sistem sedang dalam proses pemeliharaan. Kami akan segera kembali.
                </p>

                {/* Info Box */}
                <div className="mt-8 rounded-lg border border-warning/20 bg-warning/5 p-4">
                    <div className="flex items-start gap-3 text-left">
                        <AlertTriangle className="h-5 w-5 text-warning" />
                        <div>
                            <p className="font-medium text-foreground">Informasi</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Jika Anda adalah administrator, Anda tetap dapat mengakses sistem melalui dashboard utama.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contact */}
                <p className="mt-8 text-sm text-muted-foreground">
                    Hubungi administrator jika Anda membutuhkan bantuan.
                </p>
            </div>
        </div>
    );
}