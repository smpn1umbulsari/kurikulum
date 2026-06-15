# Guru Spenturi v2

Aplikasi administrasi kurikulum sekolah SMP yang dibangun dengan Next.js, Supabase, dan Tailwind CSS.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, React
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **PDF Generation**: jsPDF, jspdf-autotable
- **Excel Processing**: xlsx (SheetJS)
- **Mobile**: Capacitor (Android)

## Getting Started

### Prerequisites

- Node.js 18+
- npm atau pnpm
- Akun Supabase

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd guru-spenturi-v2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` dan isi dengan kredensial Supabase Anda.

4. **Setup database**
   
   Buat project Supabase baru dan jalankan schema SQL yang ada di `database/schema.sql`.

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Buka browser**
   
   Buka [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Auth routes (login)
│   │   ├── (protected)/       # Protected routes (dashboard, master, dll)
│   │   └── layout.tsx        # Root layout
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── providers/         # Context providers (AuthProvider)
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities
│   │   └── supabase/         # Supabase clients
│   └── services/              # Server actions
├── database/
│   └── schema.sql            # Database schema
├── docs/                      # Documentation
│   ├── prd.md               # Product Requirements Document
│   ├── architecture.md      # System Architecture
│   └── api-spec.md          # API Specifications
└── ui/                       # UI Documentation
    ├── design-system.md      # Design System
    └── wireframe.md         # Wireframes
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Documentation

- [PRD](docs/prd.md) - Product Requirements Document
- [Architecture](docs/architecture.md) - System Architecture
- [API Spec](docs/api-spec.md) - API Specifications
- [Design System](ui/design-system.md) - UI Design System

## License

MIT License