import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication
 * Tests login, registration, and logout flows
 */
test.describe('Authentication', () => {
    test.describe('Login', () => {
        test('should display login form', async ({ page }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');

            // Check for login form elements
            const emailInput = page.locator('input[type="email"], input[name="email"]').first();
            const passwordInput = page.locator('input[type="password"]').first();
            const loginButton = page.getByRole('button', { name: /đăng nhập|login|sign in/i });

            await expect(emailInput).toBeVisible({ timeout: 10000 });
            await expect(passwordInput).toBeVisible();
            await expect(loginButton).toBeVisible();
        });

        test('should show error for invalid credentials', async ({ page }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');

            const emailInput = page.locator('input[type="email"], input[name="email"]').first();
            const passwordInput = page.locator('input[type="password"]').first();
            const loginButton = page.getByRole('button', { name: /đăng nhập|login|sign in/i });

            await emailInput.fill('invalid@test.com');
            await passwordInput.fill('wrongpassword123');
            await loginButton.click();

            // Wait for error message
            await page.waitForTimeout(2000);

            // Should show some error feedback (toast, inline message, etc)
            const errorIndicator = page.locator('text=/sai|không đúng|invalid|error|thất bại/i');
            await expect(errorIndicator.first()).toBeVisible({ timeout: 10000 });
        });

        test('should have link to registration', async ({ page }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');

            const registerLink = page.getByRole('link', { name: /đăng ký|register|tạo tài khoản/i });
            await expect(registerLink).toBeVisible({ timeout: 10000 });
        });

        test('should have link to forgot password', async ({ page }) => {
            await page.goto('/login');
            await page.waitForLoadState('networkidle');

            const forgotLink = page.getByRole('link', { name: /quên mật khẩu|forgot|reset/i });
            await expect(forgotLink).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('Registration', () => {
        test('should display registration form', async ({ page }) => {
            await page.goto('/register');
            await page.waitForLoadState('networkidle');

            // Check for registration form elements
            const emailInput = page.locator('input[type="email"], input[name="email"]').first();
            const passwordInput = page.locator('input[type="password"]').first();
            const registerButton = page.getByRole('button', { name: /đăng ký|register|tạo/i });

            await expect(emailInput).toBeVisible({ timeout: 10000 });
            await expect(passwordInput).toBeVisible();
            await expect(registerButton).toBeVisible();
        });

        test('should validate required fields', async ({ page }) => {
            await page.goto('/register');
            await page.waitForLoadState('networkidle');

            // Try to submit empty form
            const registerButton = page.getByRole('button', { name: /đăng ký|register|tạo/i });
            await registerButton.click();

            await page.waitForTimeout(500);

            // Should show validation errors
            // Most forms prevent submission or show errors
            const currentUrl = page.url();
            expect(currentUrl).toContain('/register');
        });

        test('should have link to login', async ({ page }) => {
            await page.goto('/register');
            await page.waitForLoadState('networkidle');

            const loginLink = page.getByRole('link', { name: /đăng nhập|login|đã có tài khoản/i });
            await expect(loginLink).toBeVisible({ timeout: 10000 });
        });
    });
});
