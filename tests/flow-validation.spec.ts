import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_USER_EMAIL || 'baba@baba.com';
const PASSWORD = process.env.TEST_USER_PASSWORD || '123';

test.describe('Gaga List - E2E Flow Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    // 1. Authentication Flow
    await page.goto('/');
    
    // Check if we are already logged in or at the landing page
    const loginButton = page.locator('button:has-text("Entrar"), a:has-text("Entrar")').first();
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.waitForURL('**/api/auth/**'); // Supabase Auth UI or custom
      
      // Since it's Supabase Auth UI, we look for input fields
      await page.fill('input[type="email"]', EMAIL);
      await page.fill('input[type="password"]', PASSWORD);
      await page.click('button[type="submit"]');
    }
    
    // Wait for redirect to /app
    await expect(page).toHaveURL(/\/app/, { timeout: 15000 });
  });

  test('Flow: Dashboard & List Creation', async ({ page }) => {
    // 2. Home/Dashboard Flow
    await page.goto('/app');
    await expect(page.locator('h1')).toContainText(/Minhas Listas|Suas Listas/i);
    
    // Test List Creation Modal
    await page.click('button:has-text("Nova Lista"), button:has-text("Criar")');
    const modalTitle = page.locator('h2:has-text("Nova Lista")');
    await expect(modalTitle).toBeVisible();
    
    // Test Validation (Button should be disabled)
    const createBtn = page.locator('button[type="submit"]');
    await expect(createBtn).toBeDisabled();
    
    // Fill title and enable button
    await page.fill('input[placeholder*="nome da lista"]', 'Lista de Teste Automatizado');
    await expect(createBtn).toBeEnabled();
  });

  test('Flow: List Detail & Items', async ({ page }) => {
    await page.goto('/app');
    // Click on the first list card
    const firstList = page.locator('a[href*="/app/lists/"]').first();
    if (await firstList.isVisible()) {
      await firstList.click();
      await expect(page).toHaveURL(/\/app\/lists\/.+/);
      
      // Check totals are visible
      await expect(page.locator('span:has-text("Itens")')).toBeVisible();
      await expect(page.locator('span:has-text("Faltando")')).toBeVisible();
      await expect(page.locator('span:has-text("Comprado")')).toBeVisible();
      
      // Test Item Addition
      await page.fill('input[placeholder*="Adicionar item"]', 'Item de Teste');
      await page.keyboard.press('Enter');
      
      // Verify item appeared
      await expect(page.locator('span:has-text("Item de Teste")')).toBeVisible();
    }
  });

  test('Flow: Recipes & Tabs', async ({ page }) => {
    await page.goto('/app/recipes');
    await expect(page.locator('h1')).toContainText('Receitas Inteligentes');
    
    // Test Tabs
    await page.click('button:has-text("Inventário")');
    await expect(page.locator('h2:has-text("Inventário")')).toBeVisible();
    
    await page.click('button:has-text("Meu Livro")');
    await expect(page.locator('h2:has-text("Meu Livro")')).toBeVisible();
  });

  test('Flow: Notifications & Empty State', async ({ page }) => {
    await page.goto('/app/notifications');
    await expect(page.locator('h1')).toContainText('Central de Avisos');
    
    // Verify our new empty state with CTA
    if (await page.locator('h2:has-text("Tudo limpo por aqui")').isVisible()) {
      await expect(page.locator('button:has-text("Copiar Link de Convite")')).toBeVisible();
    }
  });

  test('Flow: Profile & Credits', async ({ page }) => {
    await page.goto('/app/profile');
    await expect(page.locator('h1')).toContainText('Ajustes');
    
    // Navigate to Credits
    await page.click('a[href="/app/credits"]');
    await expect(page.locator('h1')).toContainText('Energia IA');
    await expect(page.locator('h2:has-text("O que são Grãos Mágicos?")')).toBeVisible();
  });

});
