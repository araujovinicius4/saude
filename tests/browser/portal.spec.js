import {test,expect} from '@playwright/test';

for(const width of [1440,390,320]) {
  test(`citizen portal navigation and rendering at ${width}px`,async({page})=>{
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.setViewportSize({width,height:1000});
    await page.goto('/app');
    await expect(page).toHaveTitle('Bolsa Saúde Cidadão');
    const routes=[['Prevenção','prevencao'],['Prontuário','prontuario'],['Atendimentos','atendimentos'],['Meus Benefícios','beneficios'],['Meu Perfil','perfil'],['Visão Geral','']];
    for(const [label,path] of routes){
      if(width<=800)await page.getByRole('button',{name:'Abrir menu'}).click();
      await page.getByRole('navigation',{name:'Portal do Cidadão',exact:true}).getByRole('link',{name:label,exact:true}).click();
      await expect(page).toHaveURL(new RegExp(`/app${path?'/'+path:''}$`));
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(['prontuario','atendimentos','beneficios','perfil'].includes(path))await expect(page.getByText('Dados demonstrativos',{exact:true})).toBeVisible();
      if(path==='prontuario')await expect(page.getByRole('navigation',{name:'Seções do prontuário'}).getByRole('link')).toHaveCount(6);
      if(path==='beneficios'){
        await expect(page.locator('.portal-metrics')).toContainText('180,00');
        await expect(page.locator('tbody tr')).toHaveCount(3);
      }
      if(width!==320&&path!=='')await page.screenshot({path:`test-results/portal-${path}-${width}.png`,fullPage:true});
    }
    expect(errors).toEqual([]);
  });
}

test('existing prevention records and storage schema remain compatible',async({page})=>{
  await page.goto('/app/check-in');
  const fields=page.locator('input[type=number]');
  await fields.nth(0).fill('7');await fields.nth(1).fill('2');await fields.nth(2).fill('20');
  await page.getByRole('button',{name:'Salvar meu dia'}).click();
  const before=await page.evaluate(()=>localStorage.getItem('minha-saude:v1'));
  for(const path of ['prevencao','prontuario','atendimentos','beneficios','perfil'])await page.goto(`/app/${path}`);
  expect(await page.evaluate(()=>localStorage.getItem('minha-saude:v1'))).toBe(before);
  expect(Object.keys(JSON.parse(before)).sort()).toEqual(['goals','records','sharing']);
  await page.goto('/app/prevencao');
  await page.getByRole('link',{name:'Minhas metas',exact:true}).last().click();
  await expect(page).toHaveURL(/\/app\/metas$/);
});
