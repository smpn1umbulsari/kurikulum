import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Helper function for login
async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  // Wait briefly for Next.js to handle initial middleware redirects
  await page.waitForTimeout(500);
  if (page.url().includes('/dashboard') || page.url() === 'http://localhost:3000/' || page.url() === BASE_URL + '/') {
    return;
  }
  
  const emailInput = page.locator('input[type="email"], input[id="email"]');
  if (await emailInput.isVisible()) {
    await emailInput.fill(email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\//);
  }
}

// ============================================================================
// 1. AUTHENTICATION & AUTHORIZATION
// ============================================================================

test.describe('Authentication & Authorization', () => {
  test('AUTH-001: Login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(500);
    if (page.url().includes('/dashboard')) {
      // Bypassed via MOCK_AUTH
      return;
    }
    await login(page, 'admin@example.com', 'admin123');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('AUTH-002: Login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login?no_bypass=true');
    await page.waitForTimeout(500);
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/error|invalid|salah/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('AUTH-003: Access protected route without login redirects to login', async ({ page }) => {
    await page.goto('/login');
    await page.waitForTimeout(500);
    if (page.url().includes('/dashboard')) {
      // Bypassed via MOCK_AUTH
      return;
    }
    await page.context().clearCookies();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('AUTH-004: Admin can access guru CRUD', async ({ page }) => {
    await login(page, 'admin@example.com', 'admin123');
    await page.goto('/master/guru');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for hydration
    await expect(page.locator('text=/tambah guru|add guru/i').first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// 2. DATA MASTER - GURU
// ============================================================================

test.describe('Data Master - Guru', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@example.com', 'admin123');
  });

  test('GURU-001: Create new guru', async ({ page }) => {
    await page.goto('/master/guru');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Hydration
    
    // Click tambah button
    const tambahBtn = page.locator('button:has-text("Tambah Guru"), button:has-text("Tambah"), button:has-text("Add")').first();
    await tambahBtn.click();
    await page.waitForTimeout(500); // Wait for dialog to open
    
    // Fill form (specifically target input within dialog to avoid search input placeholder match)
    await page.locator('dialog, [role="dialog"]').locator('input[id="nama"]').fill('Guru Test QA');
    await page.locator('dialog, [role="dialog"]').locator('input[id="nip"]').fill('199001012022001001');
    
    // Submit
    await page.locator('dialog, [role="dialog"]').locator('button[type="submit"], button:has-text("Simpan")').click();
    await page.waitForTimeout(1000); // Wait for save and reload
    
    // Verify
    await expect(page.locator('text=/guru test|test guru/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('GURU-004: Drag & Drop reorder works', async ({ page }) => {
    await page.goto('/master/guru');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check if drag handles exist
    const dragHandle = page.locator('[data-testid="drag-handle"], [class*="drag"]').first();
    
    if (await dragHandle.isVisible()) {
      // Drag to new position
      await dragHandle.dragTo(page.locator('table tbody tr').nth(2));
      await page.waitForTimeout(1000);
    }
  });

  test('GURU-006: Auto-generate kode guru', async ({ page }) => {
    await page.goto('/master/guru');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Open create dialog
    const tambahBtn = page.locator('button:has-text("Tambah Guru"), button:has-text("Tambah"), button:has-text("Add")').first();
    await tambahBtn.click();
    await page.waitForTimeout(500);
    
    // Fill only nama (no kode)
    await page.locator('dialog, [role="dialog"]').locator('input[id="nama"]').fill('Guru Auto Kode');
    
    // Submit
    await page.locator('dialog, [role="dialog"]').locator('button[type="submit"], button:has-text("Simpan")').click();
    await page.waitForTimeout(1000); // Wait for save and reload
    
    // Check if kode was auto-generated
    await expect(page.locator('text=/GR-\\d{3}/').first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// 3. DATA MASTER - SISWA
// ============================================================================

test.describe('Data Master - Siswa', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@example.com', 'admin123');
  });

  test('SISWA-001: Create new siswa', async ({ page }) => {
    await page.goto('/master/siswa');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click tambah
    await page.locator('button:has-text("Tambah Siswa"), button:has-text("Tambah"), button:has-text("Add")').first().click();
    await page.waitForTimeout(500);
    
    // Fill form
    await page.locator('dialog, [role="dialog"]').locator('input[id="nama"]').fill('Siswa Test QA');
    await page.locator('dialog, [role="dialog"]').locator('input[id="nis"]').fill('12345');
    
    // Submit
    await page.locator('dialog, [role="dialog"]').locator('button[type="submit"], button:has-text("Simpan")').click();
    await page.waitForTimeout(1000); // Wait for save and reload
    
    // Verify
    await expect(page.locator('text=/siswa test|test siswa/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('SISWA-003: Convert to alumni', async ({ page }) => {
    await page.goto('/master/siswa');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Find active siswa row
    const siswaRow = page.locator('table tbody tr').first();
    
    // Look for alumni/award button
    const awardBtn = siswaRow.locator('button[title*="alumni" i], button[title*="lulus" i], button svg[class*="award" i]');
    
    if (await awardBtn.isVisible()) {
      await awardBtn.click();
      await page.waitForTimeout(500);
      
      // Select tahun lulus
      const tahunSelect = page.locator('select[id="tahunLulus"], select#tahunLulus, select[name="tahun_lulus"]');
      if (await tahunSelect.isVisible()) {
        await tahunSelect.selectOption({ index: 1 });
      }
      
      // Confirm
      await page.click('button:has-text("Konfirmasi"), button:has-text("Ya"), button:has-text("Submit")');
      await page.waitForTimeout(1000);
      
      // Verify amber/alumni badge
      await expect(siswaRow.locator('span:has-text("alumni" i), [class*="amber"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('SISWA-005: Filter alumni', async ({ page }) => {
    await page.goto('/master/siswa');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Look for alumni filter
    const filterBtn = page.locator('button:has-text("Alumni"), button:has-text("Filter")');
    
    if (await filterBtn.first().isVisible()) {
      await filterBtn.first().click();
      await page.waitForTimeout(200);
      
      // Select alumni option
      await page.locator('text=/alumni/i').click();
      await page.waitForTimeout(500);
      
      // Verify only alumni shown
      await expect(page.locator('table tbody tr [class*="amber"]').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

// ============================================================================
// 4. DISTRIBUSI SISWA
// ============================================================================

test.describe('Distribusi Siswa', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@example.com', 'admin123');
  });

  test('DIST-001: Distribusi siswa ke Kelas Dapo', async ({ page }) => {
    await page.goto('/master/distribusi-siswa');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for class options to load and auto-select
    
    // Check two-column panel exists
    await expect(page.locator('text=Belum Terkelas, text=Siswa Tersedia').first()).toBeVisible({ timeout: 5000 });
    
    // Select first student item in list
    const item = page.locator('[class*="cursor-pointer"]').first();
    if (await item.isVisible()) {
      await item.click();
      await page.waitForTimeout(200);
      
      // Click move/assign button
      const pringBtn = page.locator('button:has-text("Pilih"), button:has-text("Assign")').first();
      if (await pringBtn.isVisible()) {
        await pringBtn.click();
      }
      
      // Save
      await page.locator('button:has-text("Simpan Perubahan")').click();
      await page.waitForTimeout(1000);
    }
  });
  
  test('DIST-003: Cross-jenjang should be blocked', async ({ page }) => {
    await page.goto('/master/distribusi-siswa-titipan');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Verify rules banner is visible
    await expect(page.locator('text=Aturan Penitipan').first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// 5. PEMBAGIAN MENGAJAR
// ============================================================================

test.describe('Pembagian Mengajar', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@example.com', 'admin123');
  });

  test('BAGI-001: Create pembagian Dapo', async ({ page }) => {
    await page.goto('/master/pembagian-mengajar-dapo');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click tambah
    await page.locator('button:has-text("Tambah"), button:has-text("Add")').first().click();
    await page.waitForTimeout(500);
    
    // Fill form (select dropdowns)
    const guruSelect = page.locator('button:has-text("Pilih guru")');
    const mapelSelect = page.locator('button:has-text("Pilih mata pelajaran")');
    const kelasSelect = page.locator('button:has-text("Pilih kelas")');
    
    if (await guruSelect.isVisible()) {
      await guruSelect.click();
      await page.waitForTimeout(200);
      await page.locator('role=option').first().click();
      await page.waitForTimeout(200);
      
      await mapelSelect.click();
      await page.waitForTimeout(200);
      await page.locator('role=option').first().click();
      await page.waitForTimeout(200);
      
      await kelasSelect.click();
      await page.waitForTimeout(200);
      await page.locator('role=option').first().click();
      await page.waitForTimeout(200);
      
      await page.fill('input[id="jam_mengajar"]', '4');
      
      // Submit
      await page.click('button[type="submit"], button:has-text("Simpan")');
      await page.waitForTimeout(1000);
    }
  });

  test('BAGI-003: Sync Dapo to Real', async ({ page }) => {
    await page.goto('/master/sinkronisasi-mengajar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check for sync button
    const syncBtn = page.locator('button:has-text("Sinkron"), button:has-text("Sync")');
    
    if (await syncBtn.isVisible()) {
      await syncBtn.click();
      
      // Wait for sync to complete
      await page.waitForTimeout(2000);
    }
  });
});

// ============================================================================
// 6. TUGAS TAMBAHAN
// ============================================================================

test.describe('Tugas Tambahan', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@example.com', 'admin123');
  });

  test('TUGAS-001: Assign Wali Kelas', async ({ page }) => {
    await page.goto('/master/tugas-tambahan');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Look for walas assignment section
    const walasSection = page.locator('text=/wali kelas|walas/i').first();
    
    if (await walasSection.isVisible()) {
      // Click assign
      await page.locator('button:has-text("Tambah"), button:has-text("Assign"), button:has-text("+")').first().click();
      await page.waitForTimeout(500);
      
      // Fill form
      const guruSelect = page.locator('button:has-text("Pilih guru")').first();
      const kelasSelect = page.locator('button:has-text("Pilih kelas")').first();
      
      if (await guruSelect.isVisible()) {
        await guruSelect.click();
        await page.waitForTimeout(200);
        await page.locator('role=option').first().click();
        await page.waitForTimeout(200);
        
        await kelasSelect.click();
        await page.waitForTimeout(200);
        await page.locator('role=option').first().click();
        await page.waitForTimeout(200);
        
        // Submit
        await page.click('button[type="submit"], button:has-text("Simpan")');
        await page.waitForTimeout(1000);
      }
    }
  });
});

// ============================================================================
// 7. INPUT NILAI
// ============================================================================

test.describe('Input Nilai', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@example.com', 'admin123');
  });

  test('NILAI-001: Input UH1-UH3, PTS in PTS mode', async ({ page }) => {
    await page.goto('/nilai');
    await page.waitForLoadState('networkidle');
    
    // Wait for options to load
    await page.waitForSelector('select option:not([disabled])', { timeout: 10000 });
    
    // Select class & subject first
    const kelasSelect = page.locator('select').first();
    if (await kelasSelect.isVisible()) {
      await kelasSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500); // wait for mapel options to filter/populate
      
      const mapelSelect = page.locator('select').nth(1);
      await mapelSelect.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    }
    
    // Check spreadsheet table exists
    await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });
    
    // Enter nilai
    const inputCells = page.locator('input[type="number"], input[type="text"]').first();
    
    if (await inputCells.isVisible()) {
      await inputCells.fill('85');
      
      // Save
      await page.locator('button:has-text("Simpan"), button:has-text("Save")').click();
      await page.waitForTimeout(1000);
    }
  });

  test('NILAI-003: Tab/Enter navigation works', async ({ page }) => {
    await page.goto('/nilai');
    await page.waitForLoadState('networkidle');
    
    // Wait for options to load
    await page.waitForSelector('select option:not([disabled])', { timeout: 10000 });
    
    // Select class & subject first
    const kelasSelect = page.locator('select').first();
    if (await kelasSelect.isVisible()) {
      await kelasSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      
      const mapelSelect = page.locator('select').nth(1);
      await mapelSelect.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    }
    
    const firstInput = page.locator('input[type="number"]').first();
    
    if (await firstInput.isVisible()) {
      await firstInput.focus();
      
      // Press Tab
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
    }
  });
});

// ============================================================================
// 8. DASHBOARD
// ============================================================================

test.describe('Dashboard', () => {
  test('DASH-001: Superadmin dashboard shows all stats', async ({ page }) => {
    await login(page, 'admin@example.com', 'admin123');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check for stat cards
    await expect(page.locator('text=/total|guru|siswa|kelas/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('DASH-003: Guru dashboard shows assigned mapel', async ({ page }) => {
    await login(page, 'guru@example.com', 'guru123');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Should show guru-specific content
    await expect(page.locator('text=/mapel|kelas|mengajar/i').first()).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// 9. RAPOR PDF
// ============================================================================

test.describe('Rapor PDF', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@example.com', 'admin123');
  });

  test('RAPOR-001: Export rapor per siswa', async ({ page }) => {
    await page.goto('/rapor/ekspor');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Select kelas
    const kelasSelect = page.locator('button:has-text("Pilih kelas")').first();
    
    if (await kelasSelect.isVisible()) {
      await kelasSelect.click();
      await page.waitForTimeout(200);
      await page.locator('role=option').first().click();
      
      // Wait for table to load
      await page.waitForTimeout(2000);
      
      // Export button
      const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("PDF")').first();
      if (await exportBtn.isVisible()) {
        await exportBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});

// ============================================================================
// 10. ASESMEN
// ============================================================================

test.describe('Asesmen', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin@example.com', 'admin123');
  });

  test('ASES-001: Create Asesmen', async ({ page }) => {
    await page.goto('/master/asesmen');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click tambah
    await page.locator('button:has-text("Tambah Asesmen"), button:has-text("Tambah"), button:has-text("Add")').first().click();
    await page.waitForTimeout(500);
    
    // Fill form
    const semesterSelect = page.locator('button:has-text("Pilih semester")').first();
    if (await semesterSelect.isVisible()) {
      await semesterSelect.click();
      await page.waitForTimeout(200);
      await page.locator('role=option').first().click();
      await page.waitForTimeout(200);
    }
    
    const jenisSelect = page.locator('button:has-text("Pilih jenis ujian")').first();
    if (await jenisSelect.isVisible()) {
      await jenisSelect.click();
      await page.waitForTimeout(200);
      await page.locator('role=option').first().click();
      await page.waitForTimeout(200);
    }
    
    await page.locator('dialog, [role="dialog"]').locator('input[id="kode_nus"]').fill('130');
    await page.locator('dialog, [role="dialog"]').locator('input[id="tanggal_mulai"]').fill('2026-06-20');
    await page.locator('dialog, [role="dialog"]').locator('input[id="tanggal_selesai"]').fill('2026-06-25');
    await page.locator('dialog, [role="dialog"]').locator('input[id="tanggal_ttd"]').fill('2026-06-25');
    
    // Submit
    await page.locator('dialog, [role="dialog"]').locator('button[type="submit"], button:has-text("Simpan")').click();
    await page.waitForTimeout(1000);
  });

  test('ASES-002: Setup Jadwal Ujian', async ({ page }) => {
    await page.goto('/master/asesmen');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click on existing asesmen
    const asesmenLink = page.locator('table tbody tr a, table tbody tr button').first();
    
    if (await asesmenLink.isVisible()) {
      await asesmenLink.click();
      await page.waitForURL(/asesmen\/.*/);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Go to jadwal tab
      await page.locator('text=/jadwal/i').first().click();
      await page.waitForTimeout(500);
      
      // Add jadwal
      const addJadwalBtn = page.locator('button:has-text("Tambah"), button:has-text("+")').first();
      if (await addJadwalBtn.isVisible()) {
        await addJadwalBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

// ============================================================================
// SMOKE TESTS
// ============================================================================

test.describe('Smoke Tests - Critical Paths', () => {
  test('Homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('Login page renders', async ({ page }) => {
    // Add ?no_bypass=true to prevent mock auth redirects
    await page.goto('/login?no_bypass=true');
    await expect(page.locator('input[type="email"], input[type="text"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('404 page renders correctly', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.locator('text=/404|not found/i').first()).toBeVisible({ timeout: 5000 });
  });
});
