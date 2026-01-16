import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Admin and Portal Pages
 * Tests admin, contractor, and supplier portals
 */
test.describe('Admin Panel', () => {
    test('should redirect to login if not authenticated', async ({ page }) => {
        await page.goto('/admin');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Should either show login form or redirect to login
        const loginForm = page.locator('input[type="email"], input[type="password"]').first();
        const isLoginVisible = await loginForm.isVisible();

        // Either on login page or redirected
        const currentUrl = page.url();
        expect(isLoginVisible || currentUrl.includes('/login')).toBeTruthy();
    });
});

test.describe('Contractor Portal', () => {
    test('should display contractor landing page', async ({ page }) => {
        await page.goto('/contractor');
        await page.waitForLoadState('networkidle');

        // Check for contractor-specific content
        const contractorContent = page.getByText(/nhà thầu|contractor|đối tác/i);
        await expect(contractorContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have registration option for contractors', async ({ page }) => {
        await page.goto('/contractor');
        await page.waitForLoadState('networkidle');

        // Look for register/signup link
        const registerLink = page.getByRole('link', { name: /đăng ký|register|tham gia/i });
        await expect(registerLink.first()).toBeVisible({ timeout: 10000 });
    });

    test('should have login link for contractors', async ({ page }) => {
        await page.goto('/contractor');
        await page.waitForLoadState('networkidle');

        const loginLink = page.getByRole('link', { name: /đăng nhập|login/i });
        await expect(loginLink.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display contractor login page', async ({ page }) => {
        await page.goto('/contractor/login');
        await page.waitForLoadState('networkidle');

        // Check for login form
        const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
        const passwordInput = page.locator('input[type="password"]').first();

        await expect(emailInput).toBeVisible({ timeout: 10000 });
        await expect(passwordInput).toBeVisible();
    });
});

test.describe('Supplier Portal', () => {
    test('should display supplier login page', async ({ page }) => {
        await page.goto('/supplier/login');
        await page.waitForLoadState('networkidle');

        // Check for login form
        const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
        const passwordInput = page.locator('input[type="password"]').first();

        await expect(emailInput).toBeVisible({ timeout: 10000 });
        await expect(passwordInput).toBeVisible();
    });

    test('should have login button', async ({ page }) => {
        await page.goto('/supplier/login');
        await page.waitForLoadState('networkidle');

        const loginButton = page.getByRole('button', { name: /đăng nhập|login/i });
        await expect(loginButton).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Contractors Marketplace', () => {
    test('should display contractors listing page', async ({ page }) => {
        await page.goto('/contractors');
        await page.waitForLoadState('networkidle');

        // Should show contractors list or search
        await expect(page.locator('header').first()).toBeVisible();

        // Check for contractors content
        const content = page.locator('main, .container, section').first();
        await expect(content).toBeVisible({ timeout: 10000 });
    });
});
