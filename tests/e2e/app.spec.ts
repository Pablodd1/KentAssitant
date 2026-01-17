import { test, expect } from '@playwright/test';

test.describe('Kent Assistant MD - E2E Tests', () => {
    test.describe('Home Page', () => {
        test('should display the home page with title', async ({ page }) => {
            await page.goto('/');
            
            await expect(page.locator('h1')).toContainText('American Wellness');
            await expect(page.locator('h1')).toContainText('MD Assistant');
        });

        test('should have link to manage cases', async ({ page }) => {
            await page.goto('/');
            
            const manageCasesLink = page.getByRole('link', { name: /Manage Cases/i });
            await expect(manageCasesLink).toBeVisible();
            
            await manageCasesLink.click();
            await expect(page).toHaveURL('/cases');
        });
    });

    test.describe('Cases Page', () => {
        test('should display demo mode notice', async ({ page }) => {
            await page.goto('/cases');
            
            // Wait for page to load
            await page.waitForSelector('h1');
            
            // Should show demo mode banner
            await expect(page.getByText(/Demo Mode/i)).toBeVisible();
        });

        test('should display sample cases in demo mode', async ({ page }) => {
            await page.goto('/cases');
            
            // Wait for cases to load
            await page.waitForTimeout(1000);
            
            // Should show at least one case
            await expect(page.getByText('AWM-2025-0001')).toBeVisible();
        });

        test('should have New Case button', async ({ page }) => {
            await page.goto('/cases');
            
            const newCaseButton = page.getByRole('button', { name: /New Case/i });
            await expect(newCaseButton).toBeVisible();
        });

        test('should create new case when clicking New Case button', async ({ page }) => {
            await page.goto('/cases');
            
            await page.getByRole('button', { name: /New Case/i }).click();
            
            // Should navigate to upload page
            await expect(page).toHaveURL(/\/case\/.*\/upload/);
        });

        test('should navigate to case upload when clicking Open Case', async ({ page }) => {
            await page.goto('/cases');
            
            // Wait for cases to load
            await page.waitForTimeout(1000);
            
            // Click Open Case on first case
            await page.getByRole('link', { name: /Open Case/i }).first().click();
            
            await expect(page).toHaveURL(/\/case\/.*\/upload/);
        });
    });

    test.describe('Upload Page', () => {
        test('should display upload interface', async ({ page }) => {
            await page.goto('/cases');
            await page.getByRole('link', { name: /Open Case/i }).first().click();
            
            await expect(page.getByText(/Upload Medical Data/i)).toBeVisible();
            await expect(page.getByText(/Drop files here/i)).toBeVisible();
        });

        test('should show uploaded files section', async ({ page }) => {
            await page.goto('/cases');
            await page.getByRole('link', { name: /Open Case/i }).first().click();
            
            await expect(page.getByText(/Uploaded Files/i)).toBeVisible();
        });

        test('should have navigation to voice capture', async ({ page }) => {
            await page.goto('/cases');
            await page.getByRole('link', { name: /Open Case/i }).first().click();
            
            const voiceLink = page.getByRole('link', { name: /Voice Capture/i }).first();
            await expect(voiceLink).toBeVisible();
        });

        test('should have navigation to run analysis', async ({ page }) => {
            await page.goto('/cases');
            await page.getByRole('link', { name: /Open Case/i }).first().click();
            
            const analysisLink = page.getByRole('link', { name: /Run Analysis/i });
            await expect(analysisLink).toBeVisible();
        });
    });

    test.describe('Voice Page', () => {
        test('should display voice capture interface', async ({ page }) => {
            await page.goto('/cases');
            await page.getByRole('link', { name: /Open Case/i }).first().click();
            await page.getByRole('link', { name: /Voice Capture/i }).first().click();
            
            await expect(page.getByText(/Voice Context Capture/i)).toBeVisible();
        });

        test('should have record button', async ({ page }) => {
            await page.goto('/cases');
            await page.getByRole('link', { name: /Open Case/i }).first().click();
            await page.getByRole('link', { name: /Voice Capture/i }).first().click();
            
            // Should have a button for recording
            const recordButton = page.locator('button').filter({ has: page.locator('svg') }).first();
            await expect(recordButton).toBeVisible();
        });

        test('should have navigation to analysis', async ({ page }) => {
            await page.goto('/cases');
            await page.getByRole('link', { name: /Open Case/i }).first().click();
            await page.getByRole('link', { name: /Voice Capture/i }).first().click();
            
            const analysisLink = page.getByRole('link', { name: /Run Analysis/i });
            await expect(analysisLink).toBeVisible();
        });
    });

    test.describe('Results Page', () => {
        test('should display clinical intelligence report', async ({ page }) => {
            // Navigate to a completed case results
            await page.goto('/case/case-001/results');
            
            // Wait for loading
            await page.waitForTimeout(2000);
            
            // Should show report title
            await expect(page.getByText(/Clinical Intelligence Report/i)).toBeVisible({ timeout: 10000 });
        });

        test('should display executive summary section', async ({ page }) => {
            await page.goto('/case/case-001/results');
            await page.waitForTimeout(2000);
            
            await expect(page.getByText(/Executive Summary/i)).toBeVisible({ timeout: 10000 });
        });

        test('should have PDF download button', async ({ page }) => {
            await page.goto('/case/case-001/results');
            await page.waitForTimeout(2000);
            
            await expect(page.getByRole('button', { name: /Download PDF/i }).first()).toBeVisible({ timeout: 10000 });
        });

        test('should have print button', async ({ page }) => {
            await page.goto('/case/case-001/results');
            await page.waitForTimeout(2000);
            
            await expect(page.getByRole('button', { name: /Print/i })).toBeVisible({ timeout: 10000 });
        });

        test('should have fax preparation button', async ({ page }) => {
            await page.goto('/case/case-001/results');
            await page.waitForTimeout(2000);
            
            await expect(page.getByRole('button', { name: /Prepare for Fax/i }).first()).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('API Rate Limiting', () => {
        test('should handle rate limiting gracefully', async ({ page }) => {
            // Make multiple rapid requests
            const responses: number[] = [];
            
            for (let i = 0; i < 5; i++) {
                const response = await page.request.get('/api/cases');
                responses.push(response.status());
            }
            
            // All should succeed or get rate limited gracefully
            responses.forEach(status => {
                expect([200, 429]).toContain(status);
            });
        });
    });
});
