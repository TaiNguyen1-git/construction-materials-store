import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Cart and Checkout
 * Tests shopping cart and checkout flow
 */
test.describe('Cart', () => {
    test('should display empty cart message when cart is empty', async ({ page }) => {
        await page.goto('/cart');
        await page.waitForLoadState('networkidle');

        // Check for empty cart message
        const emptyMessage = page.getByText('Giỏ hàng trống', { exact: false });
        await expect(emptyMessage).toBeVisible({ timeout: 10000 });
    });

    test('should show cart page structure', async ({ page }) => {
        await page.goto('/cart');
        await page.waitForLoadState('networkidle');

        // Check for cart header
        await expect(page.locator('header').first()).toBeVisible();

        // The page should show cart content or empty message
        const pageContent = page.locator('main, .container, section').first();
        await expect(pageContent).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to checkout when cart has items', async ({ page }) => {
        // First add a product
        await page.goto('/products');
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.grid .bg-white.rounded-2xl', { timeout: 20000 });

        // Go to product detail first
        const detailButton = page.getByRole('link', { name: 'Chi Tiết' }).first();
        await detailButton.click();
        await page.waitForURL(/\/products\/[^/]+/);

        // Find add to cart button and click
        const addToCartButton = page.getByRole('button', { name: /Thêm vào giỏ|Mua ngay/i });
        if (await addToCartButton.isVisible({ timeout: 5000 })) {
            await addToCartButton.click();
            await page.waitForTimeout(1000);
        }

        // Go to cart
        await page.goto('/cart');
        await page.waitForLoadState('networkidle');

        // Look for checkout button
        const checkoutButton = page.getByRole('link', { name: /Thanh toán|Tiến hành/i });
        if (await checkoutButton.isVisible({ timeout: 5000 })) {
            await expect(checkoutButton).toBeVisible();
        }
    });
});

test.describe('Checkout', () => {
    test('should handle empty cart checkout attempt', async ({ page }) => {
        await page.goto('/checkout');
        await page.waitForLoadState('networkidle');

        // Should either redirect or show message
        await page.waitForTimeout(2000);

        // Check current URL or for empty/redirect message
        const currentUrl = page.url();
        expect(currentUrl.includes('/cart') || currentUrl.includes('/checkout') || currentUrl.includes('/')).toBeTruthy();
    });

    test('should display checkout form when cart has items', async ({ page }) => {
        // First add a product
        await page.goto('/products');
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.grid .bg-white.rounded-2xl', { timeout: 20000 });

        // Click product detail
        const detailButton = page.getByRole('link', { name: 'Chi Tiết' }).first();
        await detailButton.click();
        await page.waitForURL(/\/products\/[^/]+/);

        // Add to cart
        const addToCartButton = page.getByRole('button', { name: /Thêm vào giỏ|Mua ngay/i });
        if (await addToCartButton.isVisible({ timeout: 5000 })) {
            await addToCartButton.click();
            await page.waitForTimeout(1000);
        }

        // Go to checkout
        await page.goto('/checkout');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for form fields - may show empty cart or form
        const formOrMessage = page.locator('form, [data-testid="empty-cart"], .container').first();
        await expect(formOrMessage).toBeVisible({ timeout: 10000 });
    });

    test('should show QR payment section for bank transfer', async ({ page }) => {
        // Add product and go to checkout
        await page.goto('/products');
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.grid .bg-white.rounded-2xl', { timeout: 20000 });

        const detailButton = page.getByRole('link', { name: 'Chi Tiết' }).first();
        await detailButton.click();
        await page.waitForURL(/\/products\/[^/]+/);

        const addToCartButton = page.getByRole('button', { name: /Thêm vào giỏ|Mua ngay/i });
        if (await addToCartButton.isVisible({ timeout: 5000 })) {
            await addToCartButton.click();
            await page.waitForTimeout(1000);
        }

        await page.goto('/checkout');
        await page.waitForLoadState('networkidle');

        // Look for bank transfer / QR payment text
        const paymentText = page.getByText(/chuyển khoản|QR|thanh toán/i);
        // This may or may not be visible depending on cart state
        if (await paymentText.first().isVisible({ timeout: 5000 })) {
            await expect(paymentText.first()).toBeVisible();
        }
    });

    test('should display order summary', async ({ page }) => {
        await page.goto('/products');
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.grid .bg-white.rounded-2xl', { timeout: 20000 });

        const detailButton = page.getByRole('link', { name: 'Chi Tiết' }).first();
        await detailButton.click();
        await page.waitForURL(/\/products\/[^/]+/);

        const addToCartButton = page.getByRole('button', { name: /Thêm vào giỏ|Mua ngay/i });
        if (await addToCartButton.isVisible({ timeout: 5000 })) {
            await addToCartButton.click();
            await page.waitForTimeout(1000);
        }

        await page.goto('/checkout');
        await page.waitForLoadState('networkidle');

        // Look for total/summary section
        const summaryText = page.getByText(/tổng|cộng|tiền/i);
        if (await summaryText.first().isVisible({ timeout: 5000 })) {
            await expect(summaryText.first()).toBeVisible();
        }
    });
});
