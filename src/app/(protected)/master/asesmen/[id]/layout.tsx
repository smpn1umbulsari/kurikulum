import React from 'react';

export function generateStaticParams() {
    // Return a dummy id parameter to satisfy Next.js static export compilation.
    // This allows pages under /master/asesmen/[id]/ (dokumen, jadwal, matrix, pengawas, ruang)
    // to be statically pre-rendered at build time.
    return [{ id: '1' }];
}

export default function AsesmenIdLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
