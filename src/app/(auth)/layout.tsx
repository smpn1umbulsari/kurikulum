/**
 * Auth Layout
 * 
 * Layout untuk route-group (auth).
 * Tidak menggunakan sidebar, hanya halaman login.
 */
export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen">
            {children}
        </div>
    );
}