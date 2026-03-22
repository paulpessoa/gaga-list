import { test, expect } from '@playwright/test';

test.use({
  viewport: { width: 390, height: 844 }, // iPhone 12/13/14 size
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
});

test('Mobile Login Flow', async ({ page, context }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  // Clear state
  await context.clearCookies();
  
  // 1. Go to home
  await page.goto('http://localhost:3000');
  
  // Clear localStorage
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  
  // 2. Click "Acessar minhas listas"
  const accessButton = page.getByRole('button', { name: /Acessar minhas listas/i });
  await accessButton.waitFor({ state: 'visible' });
  
  // Try to click until modal appears (sometimes hydration causes issues)
  await accessButton.click({ force: true });
  
  // Wait for the modal/email input to appear
  const emailInput = page.locator('input[type="email"]');
  try {
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  } catch (e) {
    // If not visible, try clicking again
    await accessButton.click({ force: true });
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  }
  
  // 3. Click "Senha" in the modal toggle
  const passwordTab = page.getByRole('button', { name: /^Senha$/i });
  await passwordTab.click();
  
  // 4. Fill email and password
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ state: 'visible' });
  
  await emailInput.fill('baba@baba.com');
  await passwordInput.fill('123');
  
  // 5. Submit login
  const loginButton = page.getByRole('button', { name: /Entrar/i });
  await loginButton.click();
  
  // 6. Wait for navigation and verify bottom bar (menu inferior)
  await page.waitForURL('**/app**', { timeout: 20000 });
  
  console.log('Login successful! Current URL:', page.url());
  
  // Verify if Tab Bar is visible (Mobile Menu)
  const tabBar = page.locator('nav').filter({ hasText: /Listas|Perfil|Produtos/i });
  await expect(tabBar).toBeVisible();
  
  console.log('Mobile menu (Bottom Bar) is visible.');
});
