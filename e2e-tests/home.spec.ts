import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Derive the expected posting count from the job content collection so this
// assertion stays correct as roles are added or removed.
const jobsDir = fileURLToPath(new URL('../src/content/jobs', import.meta.url));
const expectedRoleCount = readdirSync(jobsDir).filter((f) => f.endsWith('.md')).length;

test.describe('Open roles listing', () => {
    test('shows the roles grid with all postings', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible();

        const grid = page.getByTestId('roles-grid');
        await expect(grid).toBeVisible();
        await expect(page.getByTestId('role-card')).toHaveCount(expectedRoleCount);
    });

    test('filters roles by department and location, then resets', async ({ page }) => {
        await page.goto('/');

        const departmentFilter = page.getByTestId('department-filter');
        const locationFilter = page.getByTestId('location-filter');
        const visibleRoleCards = page.locator('[data-testid="role-card"]:visible');

        await test.step('filters by department', async () => {
            await departmentFilter.selectOption('Finance');

            await expect(visibleRoleCards).toHaveCount(2);
            await expect(
                visibleRoleCards.filter({
                    has: page.getByRole('heading', { name: 'Financial Analyst', exact: true }),
                }),
            ).toBeVisible();
            await expect(
                visibleRoleCards.filter({
                    has: page.getByRole('heading', {
                        name: 'Financial Reconciliation Specialist',
                        exact: true,
                    }),
                }),
            ).toBeVisible();
        });

        await test.step('filters by location', async () => {
            await page.getByTestId('filter-reset').click();
            await locationFilter.selectOption('Woodinville, WA, USA');

            await expect(visibleRoleCards).toHaveCount(3);
            await expect(
                visibleRoleCards.filter({
                    has: page.getByRole('heading', { name: 'Financial Analyst', exact: true }),
                }),
            ).toBeVisible();
        });

        await test.step('combines filters with AND behavior', async () => {
            await departmentFilter.selectOption('Finance');

            await expect(visibleRoleCards).toHaveCount(1);
            await expect(
                visibleRoleCards.getByRole('heading', {
                    name: 'Financial Analyst',
                    exact: true,
                }),
            ).toBeVisible();
        });

        await test.step('shows an empty state when no role matches', async () => {
            await locationFilter.selectOption('Remote (US & Canada)');

            await expect(visibleRoleCards).toHaveCount(0);
            await expect(page.getByTestId('filter-empty-state')).toBeVisible();
            await expect(page.getByTestId('filter-empty-state')).toContainText(
                'No roles match those filters',
            );
        });

        await test.step('resets filters and restores every role', async () => {
            await page.getByTestId('filter-reset').click();

            await expect(departmentFilter).toHaveValue('');
            await expect(locationFilter).toHaveValue('');
            await expect(visibleRoleCards).toHaveCount(expectedRoleCount);
            await expect(page.getByTestId('filter-results')).toHaveText(
                `Showing all ${expectedRoleCount} roles`,
            );
        });
    });

    test('links through to a role detail page', async ({ page }) => {
        await page.goto('/');
        const firstCard = page.getByTestId('role-card').first();
        const title = await firstCard.getByTestId('role-title').textContent();
        await firstCard.click();
        await expect(page.getByTestId('role-detail-title')).toHaveText(title!.trim());
        await expect(page.getByTestId('apply-form')).toBeVisible();
    });

    for (const { title, location } of [
        { title: 'Senior Frontend Engineer', location: 'Remote (US & Canada)' },
        { title: 'Financial Analyst', location: 'Woodinville, WA, USA' },
    ]) {
        test(`shows ${title} location on its card and details`, async ({ page }) => {
            await page.goto('/');
            const card = page.getByTestId('role-card').filter({
                has: page.getByRole('heading', { name: title, exact: true }),
            });

            await expect(card).toBeVisible();
            await expect(card.getByTestId('role-location')).toHaveText(location);
            await card.click();
            await expect(page.getByText(location, { exact: true })).toBeVisible();
        });
    }

    test('has no automatically detectable accessibility violations', async ({ page }) => {
        await page.goto('/');
        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();
        expect(results.violations).toEqual([]);
    });
});
