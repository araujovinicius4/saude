import {test, expect} from '@playwright/test';

test('overview places one donut right of the button on desktop and below it on phones', async ({page}) => {
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/app');
  const top = page.locator('.dashboard-top');
  const button = top.getByRole('link',{name:'Registrar meu dia'});
  const chart = page.locator('.care-distribution');
  await expect(chart).toHaveCount(1);
  await expect(chart.locator('svg')).toBeVisible();
  const desktopButton = await button.boundingBox();
  const desktopChart = await chart.boundingBox();
  expect(desktopChart.x).toBeGreaterThan(desktopButton.x + desktopButton.width);
  expect(desktopButton.y).toBeGreaterThanOrEqual(desktopChart.y);
  expect(desktopButton.y + desktopButton.height).toBeLessThanOrEqual(desktopChart.y + desktopChart.height);
  await top.screenshot({path:'test-results/overview-top-desktop.png'});
  for (const width of [390,320]) {
    await page.setViewportSize({width,height:1000});
    const mobileButton = await button.boundingBox();
    const mobileChart = await chart.boundingBox();
    expect(mobileChart.y).toBeGreaterThan(mobileButton.y + mobileButton.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(chart.locator('svg')).toBeVisible();
    await expect(chart.locator('.care-legend li')).toHaveCount(3);
    await top.screenshot({path:`test-results/overview-top-mobile-${width}.png`});
  }
});

test('distribution uses persisted records and refreshes after storage changes', async ({page, context}) => {
  await page.goto('/app');
  const panel = page.locator('.care-distribution');
  await expect(panel.locator('svg')).toBeVisible();
  await expect(panel.locator('svg circle')).toHaveCount(3);
  await expect(panel.locator('.care-legend strong')).toHaveText(['34%','33%','33%']);
  expect(await page.evaluate(() => localStorage.getItem('minha-saude:v1'))).toBeNull();
  await panel.screenshot({path:'test-results/care-distribution-desktop.png'});
  const otherTab = await context.newPage();
  await otherTab.goto('/app');
  await otherTab.evaluate(() => {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    localStorage.setItem('minha-saude:v1', JSON.stringify({goals:{sono:8,alimentacao:3,atividade:30},records:[{date,sono:0,alimentacao:1,atividade:0}],sharing:{professional:''}}));
  });
  await expect(panel.locator('svg')).toBeVisible();
  await expect(panel.locator('.care-legend strong')).toHaveText(['34%','33%','33%']);
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await panel.screenshot({path:'test-results/care-distribution-mobile.png'});
  await page.reload();
  await expect(panel.locator('.care-legend strong')).toHaveText(['34%','33%','33%']);
  await otherTab.evaluate(() => localStorage.removeItem('minha-saude:v1'));
  await expect(panel).toContainText('Dados simulados para demonstração');
  await expect(panel.locator('svg circle')).toHaveCount(3);
  await page.reload();
  await expect(panel.locator('svg')).toBeVisible();
});

test('empty or outdated storage still displays MVP mocks without rewriting storage', async ({page}) => {
  await page.goto('/app');
  for (const records of [[], [{date:'2020-01-01',sono:8,alimentacao:3,atividade:30}]]) {
    await page.evaluate(records => localStorage.setItem('minha-saude:v1',JSON.stringify({goals:{sono:8,alimentacao:3,atividade:30},records,sharing:{professional:''}})), records);
    await page.reload();
    await expect(page.locator('.care-distribution svg circle')).toHaveCount(3);
    await expect(page.locator('.care-distribution')).toContainText('Dados simulados para demonstração');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('minha-saude:v1')).records)).toEqual(records);
  }
});
