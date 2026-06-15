# Design System: Guru Spenturi v2

Dokumen ini mendefinisikan sistem desain visual aplikasi untuk diimplementasikan oleh desainer dan developer. Sistem ini berfokus pada estetika **"White Clean Design"**, border yang tegas, navigasi yang intuitif, serta aksesibilitas kontras tinggi.

---

## 1. Token Warna (Color Palette)

Aplikasi menggunakan variabel HSL untuk fleksibilitas styling. Warna dasar dirancang untuk memberikan kontras tinggi (sesuai standar WCAG AA).

```css
:root {
  /* Brand / Primary */
  --primary: hsl(220, 90%, 56%);        /* Blue - #2F6FEF */
  --primary-hover: hsl(220, 90%, 48%);
  --primary-foreground: hsl(0, 0%, 100%);

  /* Backgrounds */
  --background: hsl(0, 0%, 100%);        /* White - #FFFFFF */
  --surface: hsl(210, 20%, 98%);         /* Very light gray - #F8F9FA */
  --surface-hover: hsl(210, 20%, 95%);

  /* Borders & Lines */
  --border: hsl(210, 14%, 80%);          /* Medium Gray - #CED4DA (Firm & crisp border) */
  --border-focus: hsl(220, 90%, 56%);

  /* Muted Text / Placeholders */
  --foreground: hsl(220, 15%, 15%);      /* Dark Charcoal - #212529 */
  --muted: hsl(220, 10%, 46%);           /* Slate Gray - #6C757D */
  
  /* Statuses */
  --success: hsl(142, 72%, 29%);         /* Deep Green - #198754 */
  --success-bg: hsl(142, 70%, 95%);
  --danger: hsl(0, 84%, 44%);            /* Strong Red - #DC3545 */
  --danger-bg: hsl(0, 80%, 96%);
  --warning: hsl(35, 92%, 35%);          /* Dark Amber - #D97706 */
  --warning-bg: hsl(35, 90%, 96%);
  --info: hsl(195, 85%, 35%);            /* Teal - #0D6EFD */
  --info-bg: hsl(195, 80%, 96%);
}
```

---

## 2. Tipografi (Typography)

Menggunakan font **Inter** (Google Fonts) sebagai font utama untuk keterbacaan data numerik dan teks kecil di layar mobile.

| Tingkat | Ukuran (px/rem) | Berat (Weight) | Kegunaan |
| :--- | :--- | :--- | :--- |
| **Heading 1** | 24px / 1.5rem | Bold (700) | Judul halaman utama, form title |
| **Heading 2** | 20px / 1.25rem | SemiBold (600) | Judul modul, header panel |
| **Heading 3** | 16px / 1.0rem | SemiBold (600) | Sub-section, header form |
| **Body (Regular)**| 14px / 0.875rem| Regular (400) | Teks utama, isi baris tabel, deskripsi |
| **Body (Medium)** | 14px / 0.875rem| Medium (500) | Teks tombol, label input, status |
| **Small Muted** | 12px / 0.75rem | Regular (400) | Keterangan tambahan, metadata, placeholder |

---

## 3. Spacing & Border Tegas (Layout & Grid)

* **Borders (Garis Batas)**:
  * Semua border menggunakan tebal **1px solid** dengan warna `--border`.
  * Menghindari penggunaan bayangan (*box-shadow*) yang tebal/halus untuk menjaga kebersihan visual.
  * Border radius diatur ketat: **4px** (untuk tombol, input, dan card) agar visual tetap terasa kaku dan tegas (*sharp & technical*).
* **Spacing (Margin/Padding)**:
  * Menggunakan kelipatan 4px: `4px, 8px, 12px, 16px, 24px, 32px`.
  * Padding standar untuk card/panel: `16px` (mobile) dan `24px` (desktop).
  * Spacing antar input field: `16px`.

---

## 4. Komponen & State UI

### 4.1 Tombol (Buttons)
* **Primary**: Background `--primary`, teks `--primary-foreground`, border `--primary`.
  * Hover: `--primary-hover`.
  * Disabled: Opacity 50%, kursor not-allowed.
* **Secondary**: Background `--background`, teks `--foreground`, border `--border`.
  * Hover: Background `--surface`.

### 4.2 Form Inputs
* Border `1px solid --border`, background `--background`, padding `8px 12px`.
* Focus State: Border berubah menjadi `--border-focus`, outline/ring ditiadakan.
* Disabled State: Background `--surface`, teks `--muted`, kursor `not-allowed`.

### 4.3 Status Badges
Digunakan pada tabel rekap nilai, kelengkapan nilai, dan status guru/siswa.
* **Lengkap (Success)**: Teks `--success`, background `--success-bg`, border `1px solid --success`.
* **Sebagian (Warning)**: Teks `--warning`, background `--warning-bg`, border `1px solid --warning`.
* **Kosong / Gagal (Danger)**: Teks `--danger`, background `--danger-bg`, border `1px solid --danger`.

---

## 5. Aksesibilitas & Mobile First (Responsive Rules)

1. **Tap Target**: Semua elemen interaktif (tombol, checkbox, tautan) harus memiliki area sentuh minimal **44px × 44px** di mobile.
2. **Spreadsheet Scrolling**: Tabel spreadsheet nilai di layar mobile dibungkus dalam kontainer `overflow-x: auto` dengan kolom nama siswa diposisikan `position: sticky; left: 0` agar nama tetap terlihat saat menggeser kolom nilai.
3. **Double Columns Adaptability**: Layout dua panel untuk pembagian kelas menggunakan layout horizontal berdampingan di desktop, dan otomatis berubah menjadi layout tab atas-bawah (tab toggle) di mobile untuk menghindari penyempitan panel.
4. **Transition**: Menggunakan durasi transisi seragam `150ms ease-in-out` untuk hover state pada semua tombol dan tautan menu.
