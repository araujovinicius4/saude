import {test,expect} from '@playwright/test';

const sections=[['Dados pessoais','pessoais'],['Condições de saúde e alergias','condicoes'],['Medicamentos','medicamentos'],['Exames','exames'],['Consultas','consultas'],['Linha do tempo','linha-do-tempo']];
async function section(page,label){await page.getByRole('navigation',{name:'Seções do prontuário'}).getByRole('link',{name:label,exact:true}).click();}

for(const width of [1440,390,320]) {
  test(`health record sections, read-only origins and timeline at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:1000});
    await page.goto('/app/prontuario');
    await page.evaluate(()=>{window.healthRecordNavigationMarker='same-document';});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    for(const [label,id] of sections){
      await section(page,label);
      await expect(page.getByRole('heading',{name:label,exact:true})).toBeVisible();
      await expect(page.getByRole('navigation',{name:'Seções do prontuário'}).getByRole('link',{name:label,exact:true})).toHaveAttribute('aria-current','page');
      expect(await page.evaluate(()=>window.healthRecordNavigationMarker)).toBe('same-document');
      const professionals=page.locator('.hr-record[data-origin="professional"]');
      for(const card of await professionals.all()){
        await expect(card).toContainText('Profissional · somente leitura');
        await expect(card.getByRole('button')).toHaveCount(0);
      }
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(width!==320)await page.screenshot({path:`test-results/health-record-${id}-${width}.png`,fullPage:true});
    }
    const dates=await page.locator('.hr-timeline article').evaluateAll(items=>items.map(item=>item.dataset.eventDate));
    expect(dates.length).toBeGreaterThan(5);
    expect(dates).toEqual([...dates].sort().reverse());
    await expect(page.locator('.hr-timeline')).toContainText('Medicamento demonstrativo A');
    await expect(page.locator('.hr-timeline')).toContainText('Condição de exemplo A');
    const exams=page.getByRole('navigation',{name:'Seções do prontuário'}).getByRole('link',{name:'Exames',exact:true});
    await exams.focus();await page.keyboard.press('Enter');
    await expect(page.getByRole('heading',{name:'Exames',exact:true})).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('create, edit and delete every personal category with confirmation and metadata',async({page})=>{
  test.setTimeout(60000);
  await page.goto('/app/prontuario');
  for(const [label,type] of [['Dados pessoais','personal'],['Condições de saúde e alergias','condition'],['Condições de saúde e alergias','allergy'],['Medicamentos','medication'],['Exames','exam'],['Consultas','consultation']]){
    await section(page,label);
    await page.getByRole('button',{name:'Adicionar registro pessoal'}).click();
    const form=page.getByRole('form',{name:'Adicionar registro autodeclarado'});
    await expect(form.getByLabel('Título do registro')).toBeFocused();
    await form.getByLabel('Tipo de informação').selectOption(type);
    const title=`Exemplo pessoal ${type}`;
    await form.getByLabel('Título do registro').fill(title);
    await form.getByLabel('Data do evento').fill('2026-10-22');
    await form.getByLabel('Descrição demonstrativa').fill('Anotação fictícia de teste.');
    await form.getByRole('button',{name:'Salvar registro'}).click();
    await expect(page.getByRole('status')).toContainText('adicionado');
    await expect(page.getByRole('button',{name:'Adicionar registro pessoal'})).toBeFocused();
    let card=page.getByRole('article',{name:title,exact:true});
    await expect(card).toContainText('Autodeclarado · cidadão');
    await expect(card).toContainText('Pessoa Cidadã de Exemplo');
    await expect(card).toContainText('22/10/2026');
    const id=await card.getAttribute('data-record-id');
    const registration=await card.locator('.hr-metadata').innerText();
    expect(id.length).toBeGreaterThan(10);
    await card.getByRole('button',{name:`Editar ${title}`,exact:true}).click();
    await page.getByLabel('Título do registro').fill(title+' atualizado');
    await page.getByRole('button',{name:'Salvar registro'}).click();
    card=page.getByRole('article',{name:title+' atualizado',exact:true});
    await expect(card).toHaveAttribute('data-record-id',id);
    expect(await card.locator('.hr-metadata').innerText()).toBe(registration);
    await card.getByRole('button',{name:`Excluir ${title} atualizado`,exact:true}).click();
    await card.getByRole('button',{name:'Cancelar exclusão'}).click();
    await expect(card).toBeVisible();
    await card.getByRole('button',{name:`Excluir ${title} atualizado`,exact:true}).click();
    await card.getByRole('button',{name:'Confirmar exclusão'}).click();
    await expect(card).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText('excluído');
  }
});

test('mobile edits update timeline, survive client navigation and never persist clinical data',async({page})=>{
  await page.setViewportSize({width:390,height:1000});
  await page.goto('/app/prontuario?secao=exames');
  const storage=await page.evaluate(()=>JSON.stringify({...localStorage}));
  await page.getByRole('button',{name:'Adicionar registro pessoal'}).click();
  await page.getByLabel('Título do registro').fill('Exame autodeclarado móvel');
  await page.getByLabel('Data do evento').fill('2026-12-01');
  await page.getByRole('button',{name:'Salvar registro'}).click();
  await section(page,'Linha do tempo');
  await expect(page.locator('.hr-timeline article').first()).toHaveAccessibleName('Exame autodeclarado móvel');
  await page.getByRole('button',{name:'Abrir menu'}).click();
  await page.getByRole('navigation',{name:'Portal do Cidadão',exact:true}).getByRole('link',{name:'Meus Benefícios'}).click();
  await expect(page.locator('.portal-metrics')).toContainText('180,00');
  await page.getByRole('button',{name:'Abrir menu'}).click();
  await page.getByRole('navigation',{name:'Portal do Cidadão',exact:true}).getByRole('link',{name:'Prontuário',exact:true}).click();
  await section(page,'Exames');
  const card=page.getByRole('article',{name:'Exame autodeclarado móvel',exact:true});
  await expect(card).toBeVisible();
  await card.getByRole('button',{name:'Editar Exame autodeclarado móvel'}).click();
  await page.getByLabel('Data do evento').fill('2020-01-01');
  await page.getByRole('button',{name:'Salvar registro'}).click();
  await section(page,'Linha do tempo');
  await expect(page.locator('.hr-timeline article').last()).toHaveAccessibleName('Exame autodeclarado móvel');
  await page.getByRole('link',{name:'Ver em Exames',exact:true}).last().click();
  await card.getByRole('button',{name:'Excluir Exame autodeclarado móvel'}).click();
  await card.getByRole('button',{name:'Confirmar exclusão'}).click();
  await section(page,'Linha do tempo');
  await expect(page.getByRole('article',{name:'Exame autodeclarado móvel',exact:true})).toHaveCount(0);
  expect(await page.evaluate(()=>JSON.stringify({...localStorage}))).toBe(storage);
  await section(page,'Exames');
  await page.getByRole('button',{name:'Adicionar registro pessoal'}).click();
  await page.getByLabel('Título do registro').fill('Descartar ao recarregar');
  await page.getByLabel('Data do evento').fill('2026-10-20');
  await page.getByRole('button',{name:'Salvar registro'}).click();
  await expect(page.getByRole('article',{name:'Descartar ao recarregar',exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('article',{name:'Descartar ao recarregar',exact:true})).toHaveCount(0);
  expect(await page.evaluate(()=>JSON.stringify({...localStorage}))).toBe(storage);
});
