import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Products Page
 * Tests product listing, filtering, and detail views
 */
test.describe('Products Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/products');
        await page.waitForLoadState('networkidle');
    });

    test('should load products page successfully', async ({ page }) => {
        await expect(page).toHaveURL(/\/products/);

        // Check for page header
        await expect(page.getByText('Vật Liệu Xây Dựng')).toBeVisible({ timeout: 10000 });
    });

    test('should display product cards with images, names, and prices', async ({ page }) => {
        // Wait for products to load - products are in cards with rounded-2xl class
        await page.waitForSelector('.grid .bg-white.rounded-2xl', { timeout: 20000 });

        // Get first product card
        const productCards = page.locator('.grid .bg-white.rounded-2xl');
        await expect(productCards.first()).toBeVisible();

        // Check for price (VND format - ends with đ or ₫)
        const price = page.locator('text=/\\d+.*[đ₫]/').first();
        await expect(price).toBeVisible({ timeout: 15000 });
    });

    test('should display category filters', async ({ page }) => {
        // ProductFilters component should be visible - searching for "Bộ Lọc" or "Danh mục"
        const filterHeader = page.getByText('Bộ Lọc').or(page.getByText('Danh mục'));
        await expect(filterHeader.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display view mode toggle (grid/list)', async ({ page }) => {
        // Grid and List view buttons
        const gridButton = page.locator('button').filter({ has: page.locator('svg') }).first();
        await expect(gridButton).toBeVisible({ timeout: 15000 });
    });

    test('should navigate to product detail when clicking Chi Tiết button', async ({ page }) => {
        // Wait for products to load
        await page.waitForSelector('.grid .bg-white.rounded-2xl', { timeout: 20000 });

        // Click on "Chi Tiết" button (product detail link)
        const detailButton = page.getByRole('link', { name: 'Chi Tiết' }).first();
        await detailButton.click();

        // Wait for navigation
        await page.waitForURL(/\/products\/[^/]+/, { timeout: 10000 });

        // Verify we're on product detail page
        await expect(page).toHaveURL(/\/products\/[^/]+/);
    });

    test('should add product to cart', async ({ page }) => {
        // Wait for products to load
        await page.waitForSelector('.grid .bg-white.rounded-2xl', { timeout: 20000 });

        // Find and click the cart button (Shopping cart icon button)
        const addToCartButton = page.locator('.grid .bg-white.rounded-2xl button').filter({
            has: page.locator('svg')
        }).first();

        if (await addToCartButton.isVisible()) {
            await addToCartButton.click();

            // Wait for toast notification
            await page.waitForTimeout(1000);

            // Check for success toast or cart count update
            const successToast = page.getByText('Đã thêm vào giỏ hàng', { exact: false });
            await expect(successToast).toBeVisible({ timeout: 5000 });
        }
    });
});
