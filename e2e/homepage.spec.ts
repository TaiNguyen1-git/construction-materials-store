import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Homepage
 * Tests the main landing page functionality
 */
test.describe('Homepage', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        // Wait for page to fully load
        await page.waitForLoadState('networkidle');
    });

    test('should load homepage successfully', async ({ page }) => {
        // Check page has loaded by looking for header
        await expect(page.locator('header').first()).toBeVisible();

        // Check for hero section content
        await expect(page.getByText('Vật Liệu Xây Dựng', { exact: false })).toBeVisible({ timeout: 10000 });
    });

    test('should display product search bar', async ({ page }) => {
        // Check for search input - the input has placeholder "Bạn đang tìm vật liệu gì?..."
        const searchInput = page.locator('input[placeholder*="Bạn đang tìm"]');
        await expect(searchInput).toBeVisible({ timeout: 15000 });
    });

    test('should display categories section', async ({ page }) => {
        // Look for the category sidebar with "NGÀNH HÀNG" text
        const categoriesSection = page.getByText('NGÀNH HÀNG');
        await expect(categoriesSection).toBeVisible({ timeout: 10000 });
    });

    test('should have working navigation to products', async ({ page }) => {
        // Check for products link in header or navigation
        const productsLink = page.locator('a[href="/products"]').first();
        await expect(productsLink).toBeVisible({ timeout: 10000 });
    });

    test('should display partner logos section', async ({ page }) => {
        // Look for partners section - they have logos and names like "Hòa Phát"
        const partnersSection = page.getByText('Hòa Phát');
        await expect(partnersSection).toBeVisible({ timeout: 15000 });
    });

    test('should display featured products', async ({ page }) => {
        // Scroll down to featured products section
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(1000);

        // Look for product cards - they show price in VND format (either đ or ₫)
        const priceText = page.locator('text=/\\d+.*[đ₫]/').first();
        await expect(priceText).toBeVisible({ timeout: 15000 });
    });
});
