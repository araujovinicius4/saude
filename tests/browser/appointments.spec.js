import {test,expect} from '@playwright/test';

async function section(page,label){await page.getByRole('navigation',{name:'Seções de atendimentos'}).getByRole('link',{name:label,exact:true}).click();}
async function professional(page,id='prof-1'){
  await page.getByRole('combobox',{name:'Perfil demonstrativo',exact:true}).selectOption('professional');
  if(id!=='prof-1')await page.getByRole('combobox',{name:'Profissional fictício',exact:true}).selectOption(id);
}
async function newAppointment(page,title){
  await section(page,'Meus atendimentos');
  await page.getByRole('button',{name:'Registrar atendimento demonstrativo',exact:true}).click();
  await page.getByLabel('Título do atendimento').fill(title);
  await page.getByLabel('Data do atendimento').fill('2026-10-26');
  await page.getByLabel('Horário',{exact:true}).fill('10:30');
  await page.getByRole('textbox',{name:'Resumo fictício',exact:true}).fill('Resumo original inteiramente fictício.');
  await page.getByRole('textbox',{name:'Evolução fictícia',exact:true}).fill('Evolução de exemplo, sem avaliação real.');
  await page.getByRole('textbox',{name:'Orientações fictícias',exact:true}).fill('Orientações de exemplo, sem prescrição.');
  await page.getByRole('button',{name:'Salvar rascunho',exact:true}).click();
  return page.getByRole('article',{name:title,exact:true});
}

for(const width of [1440,390,320]){
  test(`appointments navigation, filters and fictional directory at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:1000});
    await page.goto('/app/atendimentos');
    await page.evaluate(()=>{window.appointmentsDocument='same-document';});
    await expect(page.locator('.appointment-card')).toHaveCount(3);
    await page.getByLabel('Filtrar por data').fill('2026-11-05');
    await expect(page.locator('.appointment-card')).toHaveCount(1);
    await expect(page.locator('.appointment-card')).toHaveAttribute('data-appointment-id','appt-1');
    await page.getByRole('button',{name:'Limpar filtros'}).click();
    await page.getByLabel('Filtrar por profissional').selectOption('prof-1');
    await expect(page.locator('.appointment-card')).toHaveCount(2);
    await page.getByLabel('Filtrar por situação').selectOption('cancelled');
    await expect(page.locator('.appointment-card')).toHaveCount(1);
    await expect(page.locator('.appointment-card')).toHaveAttribute('data-appointment-id','appt-3');
    await page.getByLabel('Filtrar por data').fill('2020-01-01');
    await expect(page.getByText('Nenhum atendimento encontrado para estes filtros.')).toBeVisible();
    await page.getByRole('button',{name:'Limpar filtros'}).click();
    await page.getByLabel('Filtrar por situação').selectOption('completed');
    await expect(page.locator('.appointment-card')).toHaveCount(1);
    await expect(page.locator('.appointment-card')).toContainText('Atendimento fictício de rotina.');
    await page.getByRole('button',{name:'Limpar filtros'}).click();
    for(const [label,id] of [['Meus atendimentos','atendimentos'],['Profissionais vinculados','profissionais'],['Registros clínicos','registros'],['Autorizações de acesso','autorizacoes']]){
      await section(page,label);
      await expect(page.getByRole('heading',{name:label,exact:true})).toBeVisible();
      expect(await page.evaluate(()=>window.appointmentsDocument)).toBe('same-document');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(id==='profissionais')await expect(page.getByText('FICTÍCIO-001',{exact:true})).toBeVisible();
      if(width!==320&&id!=='registros')await page.screenshot({path:`test-results/appointments-${id}-${width}.png`,fullPage:true});
    }
  });

  test(`professional draft, finalization, immutable original and rectification at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:1000});
    await page.goto('/app/atendimentos');
    const storage=await page.evaluate(()=>JSON.stringify({...localStorage}));
    await professional(page);
    const title=`Atendimento fictício ${width}`;
    const card=await newAppointment(page,title);
    await expect(card).toHaveAttribute('data-status','scheduled');
    await card.getByRole('button',{name:'Editar rascunho'}).click();
    await page.getByRole('textbox',{name:'Resumo fictício',exact:true}).fill('Resumo original preservado.');
    await page.getByRole('button',{name:'Salvar rascunho'}).click();
    await card.getByRole('button',{name:'Finalizar atendimento'}).click();
    await expect(card).toHaveAttribute('data-status','completed');
    await expect(card.getByRole('button',{name:'Editar rascunho'})).toHaveCount(0);
    await expect(card.getByRole('button',{name:'Finalizar atendimento'})).toHaveCount(0);
    await section(page,'Registros clínicos');
    await page.getByRole('button',{name:'Consultar prontuário autorizado'}).click();
    const original=page.getByRole('article',{name:title,exact:true});
    await expect(original).toContainText('Resumo original preservado.');
    const id=await original.getAttribute('data-record-id');
    const before=await original.innerText();
    await page.getByRole('button',{name:`Retificar ${title}`,exact:true}).click();
    await page.getByLabel('Motivo da retificação').fill('Correção demonstrativa de anotação.');
    await page.getByRole('textbox',{name:'Correção fictícia',exact:true}).fill('Conteúdo corrigido fictício, preservando o original.');
    await page.getByRole('button',{name:'Registrar retificação',exact:true}).click();
    expect(await original.innerText()).toBe(before);
    const correction=page.getByRole('article',{name:`Retificação de ${title}`,exact:true});
    await expect(correction).toContainText(id);
    await expect(correction).toContainText('Conteúdo corrigido fictício');
    await expect(correction.getByRole('button')).toHaveCount(0);
    await page.getByRole('link',{name:'Abrir linha do tempo do prontuário'}).click();
    await expect(page.getByRole('article',{name:title,exact:true})).toHaveCount(1);
    await expect(page.getByRole('article',{name:`Retificação de ${title}`,exact:true})).toHaveCount(1);
    await page.getByRole('combobox',{name:'Perfil demonstrativo',exact:true}).selectOption('citizen');
    await expect(page.getByRole('article',{name:title,exact:true})).toContainText('Resumo original preservado.');
    await expect(page.getByRole('article',{name:title,exact:true}).getByRole('button')).toHaveCount(0);
    expect(await page.evaluate(()=>JSON.stringify({...localStorage}))).toBe(storage);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    if(width!==320)await page.locator('.hr-timeline').screenshot({path:`test-results/appointments-timeline-${width}.png`});
    await page.reload();
    await expect(page.getByRole('article',{name:title,exact:true})).toHaveCount(0);
    await expect(page.getByRole('article',{name:`Retificação de ${title}`,exact:true})).toHaveCount(0);
  });
}

test('grants, revocation, new requests and audit block new reads but preserve clinical history',async({page})=>{
  await page.goto('/app/atendimentos');
  await professional(page);
  const card=await newAppointment(page,'Atendimento preservado após revogação');
  await card.getByRole('button',{name:'Finalizar atendimento'}).click();
  await section(page,'Registros clínicos');
  await page.getByRole('button',{name:'Consultar prontuário autorizado'}).click();
  await expect(page.getByRole('article',{name:'Atendimento preservado após revogação',exact:true})).toBeVisible();
  await page.getByRole('combobox',{name:'Perfil demonstrativo',exact:true}).selectOption('citizen');
  await section(page,'Autorizações de acesso');
  let auth=page.getByRole('article',{name:'Autorização de Dra. Clara Exemplo',exact:true});
  await auth.getByRole('button',{name:'Revogar autorização'}).click();
  await expect(auth).toContainText('Autorização revogada');
  await professional(page);
  await section(page,'Registros clínicos');
  await page.getByRole('button',{name:'Consultar prontuário autorizado'}).click();
  await expect(page.getByRole('alert')).toContainText('Consulta recusada');
  await expect(page.locator('.clinical-records article')).toHaveCount(0);
  await section(page,'Meus atendimentos');
  await expect(page.getByRole('button',{name:'Registrar atendimento demonstrativo'})).toHaveCount(0);
  await page.getByRole('navigation',{name:'Portal do Cidadão',exact:true}).getByRole('link',{name:'Prontuário',exact:true}).click();
  await page.getByRole('button',{name:'Consultar prontuário autorizado'}).click();
  await expect(page.getByRole('alert')).toContainText('recusado');
  await expect(page.locator('.hr-record')).toHaveCount(0);
  await page.getByRole('navigation',{name:'Portal do Cidadão',exact:true}).getByRole('link',{name:'Atendimentos',exact:true}).click();
  await page.getByRole('combobox',{name:'Perfil demonstrativo',exact:true}).selectOption('citizen');
  await section(page,'Registros clínicos');
  await expect(page.getByRole('article',{name:'Atendimento preservado após revogação',exact:true})).toBeVisible();
  await section(page,'Autorizações de acesso');
  await expect(page.getByRole('list',{name:'Eventos simulados'})).toContainText('Consulta recusada');
  await expect(page.getByRole('list',{name:'Eventos simulados'})).toContainText('Autorização revogada');
});

test('request and grant flow, linked-citizen isolation and memory-only reset',async({page})=>{
  await page.goto('/app/atendimentos?secao=autorizacoes');
  let auth=page.getByRole('article',{name:'Autorização de Dra. Clara Exemplo',exact:true});
  await auth.getByRole('button',{name:'Revogar autorização'}).click();
  await professional(page);
  auth=page.getByRole('article',{name:'Autorização de Dra. Clara Exemplo',exact:true});
  await auth.getByLabel('Finalidade da autorização').fill('Consulta fictícia solicitada.');
  await auth.getByLabel('Escopo da autorização').selectOption('read');
  await auth.getByRole('button',{name:'Solicitar acesso'}).click();
  await expect(auth).toContainText('Solicitação pendente');
  await page.getByRole('combobox',{name:'Perfil demonstrativo',exact:true}).selectOption('citizen');
  await expect(auth).toContainText('Consulta fictícia solicitada.');
  await auth.getByRole('button',{name:'Conceder autorização'}).click();
  await expect(auth).toContainText('Autorização concedida');
  await expect(page.getByRole('list',{name:'Eventos simulados'})).toContainText('Acesso solicitado');
  await expect(page.getByRole('list',{name:'Eventos simulados'})).toContainText('Autorização revogada');
  await professional(page);
  const options=await page.getByRole('combobox',{name:'Cidadão vinculado',exact:true}).locator('option').allTextContents();
  expect(options).toEqual(['Pessoa Cidadã de Exemplo','Cidadão Vinculado de Exemplo']);
  await section(page,'Registros clínicos');
  await page.getByRole('button',{name:'Consultar prontuário autorizado'}).click();
  await expect(page.locator('.clinical-records article')).not.toHaveCount(0);
  await section(page,'Meus atendimentos');
  await expect(page.getByRole('button',{name:'Registrar atendimento demonstrativo'})).toHaveCount(0);
  await page.getByRole('combobox',{name:'Cidadão vinculado',exact:true}).selectOption('cid-demo-2');
  await expect(page.locator('.appointment-card')).toHaveCount(1);
  await section(page,'Registros clínicos');
  await page.getByRole('button',{name:'Consultar prontuário autorizado'}).click();
  await expect(page.getByText('Condição de exemplo A',{exact:true})).toHaveCount(0);
  await page.getByRole('combobox',{name:'Profissional fictício',exact:true}).selectOption('prof-3');
  await expect(page.getByRole('heading',{name:'Nenhum cidadão vinculado'})).toBeVisible();
  await expect(page.locator('.clinical-records article')).toHaveCount(0);
  await page.getByRole('navigation',{name:'Portal do Cidadão',exact:true}).getByRole('link',{name:'Visão Geral',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Visão profissional demonstrativa'})).toBeVisible();
  await expect(page.getByText('Pessoa Cidadã de Exemplo',{exact:true})).toHaveCount(0);
  await page.getByRole('navigation',{name:'Portal do Cidadão',exact:true}).getByRole('link',{name:'Atendimentos',exact:true}).click();
  await page.reload();
  await expect(page.getByRole('combobox',{name:'Perfil demonstrativo',exact:true})).toHaveValue('citizen');
  expect(await page.evaluate(()=>localStorage.getItem('minha-saude:v1'))).toBeNull();
});

test('citizen registers a fictional professional without automatic authorization',async({page})=>{
  await page.setViewportSize({width:320,height:1000});
  await page.goto('/app/atendimentos?secao=profissionais');
  await page.getByRole('button',{name:'Cadastrar profissional fictício',exact:true}).click();
  const form=page.getByRole('form',{name:'Cadastro de profissional fictício'});
  await form.getByLabel('Nome fictício').fill('Pessoa Profissional de Exemplo Nova');
  await form.getByLabel('Categoria profissional').fill('Categoria inventada');
  await form.getByLabel('Especialidade').fill('Cuidado demonstrativo');
  await form.getByLabel('Número de registro fictício').fill('FICTÍCIO-004');
  await form.getByLabel('Unidade de atuação fictícia').fill('Unidade Inventada');
  await form.getByRole('button',{name:'Salvar profissional fictício'}).click();
  await expect(page.getByRole('article',{name:'Pessoa Profissional de Exemplo Nova',exact:true})).toContainText('Vínculo ativo');
  await section(page,'Autorizações de acesso');
  await expect(page.getByRole('article',{name:'Autorização de Pessoa Profissional de Exemplo Nova',exact:true})).toContainText('Sem autorização');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
