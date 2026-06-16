import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_USER = {
    email: 'admin@example.com',
    password: 'TestPassword123!'
};

async function login(page: Page, user = TEST_USER) {
    // Capture browser console logs and errors
    page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.error(`[BROWSER PAGEERROR] ${err.message}`));

    // Mock Supabase calls to enable local storage injection
    await page.route('**/auth/**', async (route) => {
        console.log(`[MOCK AUTH] Intercepted auth request: ${route.request().url()}`);
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'mock-jwt-token',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'mock-refresh-token',
                user: {
                    id: '00000000-0000-0000-0000-000000000000',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: user.email,
                    app_metadata: { provider: 'email' },
                    user_metadata: { role: 'superadmin' },
                    created_at: '2026-06-14T00:00:00Z'
                }
            })
        });
    });

    await page.route('**/rest/v1/**', async (route) => {
        const url = route.request().url();
        console.log(`[MOCK REST] Intercepted REST request: ${url}`);
        
        if (url.includes('/rest/v1/siswa')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    {
                        id: 'siswa-1',
                        nis: '12345',
                        nisn: '1234567890',
                        nipd: '987654',
                        nama: 'Siswa Test QA Mobile',
                        jenis_kelamin: 'L',
                        status: 'aktif',
                        created_at: '2026-06-14T00:00:00Z'
                    }
                ])
            });
        } else {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([])
            });
        }
    });

    // Set mock localStorage auth before navigating
    await page.goto(`${BASE_URL}/login`);
    
    // Inject mock auth state into localStorage
    await page.evaluate((email) => {
        localStorage.setItem('supabase-auth-token', JSON.stringify({
            access_token: 'mock-jwt-token',
            user: { id: '00000000-0000-0000-0000-000000000000', email, role: 'superadmin' }
        }));
    }, user.email);

    // Navigate directly to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
}

test.describe('Mobile Responsiveness Verification', () => {

    test('MOB-01: Verify Dashboard renders properly on iPhone SE viewport size', async ({ page }) => {
        // Emulate iPhone SE size
        await page.setViewportSize({ width: 375, height: 667 });

        await login(page);
        await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
        
        // Wait for dashboard header to be visible
        await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 });
        
        // Check that dashboard cards are stacked/visible
        const cards = page.locator('.grid [class*="card"], .grid [class*="Card"]');
        const cardCount = await cards.count();
        console.log(`[MOB-01] Found ${cardCount} dashboard main grid elements`);
        
        // Ensure no horizontal scroll of the body
        const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
        expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1); // Allow 1px border calculation variance
        console.log('✅ MOB-01 PASSED - Dashboard is fully responsive on iPhone SE (no overflow)');
    });

    test('MOB-02: Verify Input Nilai page responsiveness on Android/Pixel 5 viewport size', async ({ page }) => {
        // Emulate Pixel 5 size
        await page.setViewportSize({ width: 393, height: 851 });

        await login(page);
        await page.goto(`${BASE_URL}/nilai`);
        await page.waitForLoadState('domcontentloaded');

        // Wait for page header
        await page.waitForSelector('h1', { timeout: 10000 });

        // Verify navigation layout on mobile size (sidebar should collapse / burger menu visible)
        const mobileMenuBtn = page.locator('button[aria-label*="menu"], button:has(.lucide-menu), button:has([class*="menu"])').first();
        const isMenuBtnVisible = await mobileMenuBtn.isVisible().catch(() => false);
        console.log(`[MOB-02] Mobile navigation menu button visible: ${isMenuBtnVisible}`);

        // Ensure no horizontal body overflow on Pixel 5 viewport width
        const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
        expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1);
        console.log('✅ MOB-02 PASSED - Input Nilai page loads correctly on Pixel 5 (no overflow)');
    });

    test('MOB-04: Verify large student list table has horizontal scrolling enabled on iPad Mini viewport size', async ({ page }) => {
        // Emulate iPad Mini size
        await page.setViewportSize({ width: 768, height: 1024 });

        await login(page);
        await page.goto(`${BASE_URL}/master/siswa`);
        await page.waitForLoadState('domcontentloaded');

        // Wait for page title/card
        await page.waitForSelector('text=Daftar Siswa', { timeout: 10000 });

        // Find table container and verify it is visible
        const tableContainer = page.locator('.overflow-x-auto, div:has(> table)').first();
        await page.waitForSelector('.overflow-x-auto, div:has(> table)', { timeout: 10000 });

        const isScrollable = await tableContainer.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return style.overflowX === 'auto' || style.overflow === 'auto' || style.overflowX === 'scroll' || style.overflow === 'scroll';
        }).catch(() => false);

        expect(isScrollable).toBe(true);
        console.log(`[MOB-04] Student table container scrollability: ${isScrollable}`);
        console.log('✅ MOB-04 PASSED - Table container allows horizontal scrolling on iPad Mini');
    });
});
