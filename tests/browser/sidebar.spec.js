import {test,expect} from '@playwright/test';

for(const width of [390,800]) {
  test(`sidebar dismissal, focus and keyboard at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:900});
    await page.goto('/app');
    const toggle=page.locator('.mobile-menu');
    const sidebar=page.locator('#citizen-sidebar');
    const overlay=page.locator('.sidebar-overlay');
    await expect(toggle).toHaveAttribute('aria-controls','citizen-sidebar');
    await expect(toggle).toHaveAttribute('aria-expanded','false');
    await expect(sidebar).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded','true');
    await expect(sidebar).toBeVisible();
    await expect(sidebar.locator('nav a').first()).toBeFocused();
    await sidebar.locator('.eyebrow').click();
    await expect(sidebar).toBeVisible();
    await overlay.click({position:{x:width-10,y:250}});
    await expect(sidebar).toBeHidden();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await page.keyboard.press('Escape');
    await expect(sidebar).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded','false');
    await expect(toggle).toBeFocused();
    await toggle.click();
    await sidebar.getByRole('link',{name:'Prontuário',exact:true}).click();
    await expect(page).toHaveURL(/\/app\/prontuario$/);
    await expect(sidebar).toBeHidden();
    await expect(toggle).toBeFocused();
    await toggle.click();
    await toggle.click();
    await expect(sidebar).toBeHidden();
    await toggle.click();
    // Focus stays within the sidebar and its toggle while the overlay is open.
    await sidebar.locator('.brand').focus();
    await page.keyboard.press('Shift+Tab');
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(sidebar.locator('.brand')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(toggle).toBeFocused();
  });
}

test('desktop sidebar remains visible and resizing clears mobile overlay',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/app');
  const sidebar=page.locator('#citizen-sidebar');
  const toggle=page.locator('.mobile-menu');
  await expect(sidebar).toBeVisible();
  await expect(toggle).toBeHidden();
  await expect(page.locator('.sidebar-overlay')).toHaveCount(0);
  await page.locator('h1').click();
  await page.keyboard.press('Escape');
  await expect(sidebar).toBeVisible();
  await sidebar.getByRole('link',{name:'Prontuário',exact:true}).click();
  await expect(page).toHaveURL(/\/app\/prontuario$/);
  await expect(sidebar).toBeVisible();
  await page.setViewportSize({width:390,height:900});
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded','true');
  await page.setViewportSize({width:1440,height:1000});
  await expect(page.locator('.sidebar-overlay')).toHaveCount(0);
  await expect(sidebar).toBeVisible();
  await page.setViewportSize({width:390,height:900});
  await expect(sidebar).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded','false');
});
