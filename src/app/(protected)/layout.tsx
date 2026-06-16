'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/session-provider';
import { cn } from '@/lib/utils';
import {
    GraduationCap,
    LayoutDashboard,
    Users,
    BookOpen,
    ClipboardList,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    ChevronDown,
    Shield,
    Calendar,
    BarChart3,
    UserCheck,
    CheckSquare,
    AlertTriangle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

/**
 * Navigation items berdasarkan role
 */
const navigationItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        roles: ['superadmin', 'admin', 'urusan', 'guru', 'siswa'],
    },
    {
        title: 'Data Master',
        icon: Users,
        roles: ['superadmin', 'admin', 'urusan'],
        children: [
            { title: 'Tahun Pelajaran', href: '/master/tahun-pelajaran', roles: ['superadmin', 'admin'] },
            { title: 'Semester', href: '/master/semester', roles: ['superadmin', 'admin'] },
            { title: 'Guru', href: '/master/guru', roles: ['superadmin', 'admin'] },
            { title: 'Siswa', href: '/master/siswa', roles: ['superadmin', 'admin', 'urusan'] },
            { title: 'Mata Pelajaran', href: '/master/mata-pelajaran', roles: ['superadmin', 'admin'] },
            { title: 'Kelas Dapodik', href: '/master/kelas-dapo', roles: ['superadmin', 'admin', 'urusan'] },
            { title: 'Kelas Real', href: '/master/kelas-real', roles: ['superadmin', 'admin', 'urusan'] },
            { title: 'Pembagian Kelas', href: '/master/pembagian-kelas', roles: ['superadmin', 'admin', 'urusan'] },
            { title: 'Kepala Sekolah', href: '/master/kepala-sekolah', roles: ['superadmin', 'admin'] },
        ],
    },
    {
        title: 'Pembagian Mengajar',
        icon: UserCheck,
        roles: ['superadmin', 'admin', 'urusan'],
        children: [
            { title: 'Dapodik', href: '/master/pembagian-mengajar-dapo', roles: ['superadmin', 'admin', 'urusan'] },
            { title: 'Real', href: '/master/pembagian-mengajar-real', roles: ['superadmin', 'admin', 'urusan'] },
            { title: 'Sinkronisasi', href: '/master/sinkronisasi-mengajar', roles: ['superadmin', 'admin'] },
        ],
    },
    {
        title: 'Tugas Tambahan',
        icon: CheckSquare,
        roles: ['superadmin', 'admin', 'urusan'],
        children: [
            { title: 'Tugas Tambahan', href: '/master/tugas-tambahan', roles: ['superadmin', 'admin', 'urusan'] },
        ],
    },
    {
        title: 'Penilaian',
        icon: ClipboardList,
        roles: ['superadmin', 'admin', 'urusan', 'guru'],
        children: [
            { title: 'Input Nilai', href: '/nilai', roles: ['admin', 'urusan', 'guru'] },
            { title: 'Upload Excel', href: '/nilai/upload', roles: ['admin', 'urusan', 'guru'] },
            { title: 'Rekap Nilai', href: '/nilai/rekap', roles: ['superadmin', 'admin', 'urusan'] },
        ],
    },
    {
        title: 'Rapor',
        icon: FileText,
        roles: ['admin', 'urus'],
        children: [
            { title: 'Ekspor Rapor PDF', href: '/rapor/ekspor', roles: ['admin', 'urus'] },
            { title: 'Validasi Data', href: '/master/validasi-data', roles: ['superadmin', 'admin', 'urus'] },
        ],
    },
    {
        title: 'Asesmen',
        icon: Calendar,
        roles: ['superadmin', 'admin', 'urus'],
        children: [
            { title: 'Setup Asesmen', href: '/master/asesmen', roles: ['superadmin', 'admin', 'urus'] },
        ],
    },
    {
        title: 'Backup & Restore',
        href: '/master/backup',
        icon: BarChart3,
        roles: ['superadmin', 'admin'],
    },
    {
        title: 'Audit Log',
        href: '/master/audit-log',
        icon: Shield,
        roles: ['superadmin'],
    },
    {
        title: 'Pengaturan',
        icon: Settings,
        roles: ['superadmin', 'admin'],
        children: [
            { title: 'Template Rapor', href: '/settings/template-rapor', roles: ['superadmin', 'admin'] },
        ],
    },
];

/**
 * Protected Layout
 * 
 * Layout utama untuk route-group (protected).
 * Menyediakan sidebar navigation dan topbar.
 */
export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile, isLoading, signOut, isMaintenanceMode } = useAuth();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

    // Toggle expanded menu
    const toggleMenu = (title: string) => {
        setExpandedMenus((prev) =>
            prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
        );
    };

    // Check if pathname is active
    const isActive = (href: string) => pathname === href;

    // Filter navigation by role
    const filteredNav = navigationItems.filter(
        (item) => !item.roles || (profile && item.roles.includes(profile.role))
    );

    // Loading state
    if (isLoading) {
        return (
            <div className="flex h-screen">
                {/* Sidebar skeleton */}
                <aside className="hidden w-64 border-r bg-card p-4 lg:block">
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-6 w-2/3" />
                    </div>
                </aside>
                {/* Main content skeleton */}
                <main className="flex-1 p-6">
                    <Skeleton className="h-12 w-full max-w-md" />
                    <Skeleton className="mt-4 h-64 w-full" />
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen">
            {/* Sidebar - Desktop */}
            <aside className="hidden w-64 flex-col border-r bg-card lg:flex">
                <SidebarContent
                    navItems={filteredNav}
                    profile={profile}
                    expandedMenus={expandedMenus}
                    toggleMenu={toggleMenu}
                    isActive={isActive}
                    onSignOut={signOut}
                />
            </aside>

            {/* Sidebar - Mobile */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild className="lg:hidden">
                    <Button variant="ghost" size="icon" className="fixed left-4 top-4 z-40">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                    <SidebarContent
                        navItems={filteredNav}
                        profile={profile}
                        expandedMenus={expandedMenus}
                        toggleMenu={toggleMenu}
                        isActive={isActive}
                        onSignOut={signOut}
                        onCloseMobile={() => setSidebarOpen(false)}
                    />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Topbar */}
                <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
                    {/* Mobile menu button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    {/* Page title area */}
                    <div className="ml-10 lg:ml-0">
                        {/* Can add breadcrumb here */}
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-4">
                        {/* Notifications */}
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {/* Badge for notifications */}
                            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                                0
                            </span>
                        </Button>

                        {/* User menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                        {profile?.nama?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <span className="hidden text-sm font-medium lg:inline-block">
                                        {profile?.nama || 'User'}
                                    </span>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{profile?.nama}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {profile?.role} • {profile?.username}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/settings/profile">
                                        <Shield className="mr-2 h-4 w-4" />
                                        Profil Saya
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={signOut} className="text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Keluar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Maintenance Mode Banner */}
                {isMaintenanceMode && profile?.role !== 'superadmin' && profile?.role !== 'admin' && (
                    <div className="flex items-center justify-center bg-warning/10 px-4 py-2 text-sm text-warning">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Sistem sedang dalam mode pemeliharaan. Beberapa fitur mungkin tidak tersedia.
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

/**
 * Sidebar Content Component
 */
function SidebarContent({
    navItems,
    profile,
    expandedMenus,
    toggleMenu,
    isActive,
    onSignOut,
    onCloseMobile,
}: {
    navItems: typeof navigationItems;
    profile: { nama: string; role: string; username: string } | null;
    expandedMenus: string[];
    toggleMenu: (title: string) => void;
    isActive: (href: string) => boolean;
    onSignOut: () => void;
    onCloseMobile?: () => void;
}) {
    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b px-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <GraduationCap className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <span className="font-semibold">Guru Spenturi</span>
                    <span className="text-xs text-muted-foreground">v2.0</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto p-2">
                {navItems.map((item, index) => (
                    <div key={index}>
                        {item.children ? (
                            <div>
                                <button
                                    onClick={() => toggleMenu(item.title)}
                                    className={cn(
                                        'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                                        expandedMenus.includes(item.title)
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground'
                                    )}
                                >
                                    <span className="flex items-center gap-3">
                                        <item.icon className="h-5 w-5" />
                                        {item.title}
                                    </span>
                                    <ChevronDown
                                        className={cn(
                                            'h-4 w-4 transition-transform',
                                            expandedMenus.includes(item.title) && 'rotate-180'
                                        )}
                                    />
                                </button>

                                {/* Children */}
                                {expandedMenus.includes(item.title) && (
                                    <div className="ml-6 mt-1 space-y-1">
                                        {item.children
                                            .filter(
                                                (child) =>
                                                    !child.roles ||
                                                    (profile && child.roles.includes(profile.role))
                                            )
                                            .map((child, childIndex) => (
                                                <Link
                                                    key={childIndex}
                                                    href={child.href}
                                                    onClick={onCloseMobile}
                                                    className={cn(
                                                        'block rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                                                        isActive(child.href)
                                                            ? 'bg-primary/10 text-primary'
                                                            : 'text-muted-foreground'
                                                    )}
                                                >
                                                    {child.title}
                                                </Link>
                                            ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href={item.href || '#'}
                                onClick={onCloseMobile}
                                className={cn(
                                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                                    isActive(item.href || '')
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-muted-foreground'
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.title}
                            </Link>
                        )}
                    </div>
                ))}
            </nav>

            {/* User info at bottom */}
            <div className="border-t p-2">
                <div className="flex items-center gap-2 rounded-md px-3 py-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {profile?.nama?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium">{profile?.nama}</p>
                        <p className="truncate text-xs capitalize text-muted-foreground">
                            {profile?.role}
                        </p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    className="mt-1 w-full justify-start text-muted-foreground hover:text-destructive"
                    onClick={onSignOut}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                </Button>
            </div>
        </div>
    );
}