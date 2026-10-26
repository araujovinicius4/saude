import {test} from 'node:test';
import assert from 'node:assert/strict';
import {portalMock,demoSession} from '../src/data/portal.js';
import {benefitSummary,visibleDemoModules,portalModules} from '../src/portal/model.js';
import {seedData,validState,saveRecord} from '../src/model.js';
import {demoPortalRepository} from '../src/portal/repository.js';

test('repository returns isolated mock snapshots and a non-authenticated session',()=>{
  const snapshot=demoPortalRepository.getSnapshot();
  snapshot.benefits.transactions.length=0;
  snapshot.citizen.name='Changed locally';
  const fresh=demoPortalRepository.getSnapshot();
  assert.equal(fresh.benefits.transactions.length,3);
  assert.equal(fresh.citizen.name,portalMock.citizen.name);
  assert.deepEqual(demoPortalRepository.getSession(),demoSession);
});

test('demonstrative ledger derives totals in cents from credits and payments',()=>{
  assert.deepEqual(benefitSummary(portalMock.benefits),{credits:30000,payments:12000,balance:18000});
  assert.deepEqual(benefitSummary({openingBalanceCents:100,transactions:[]}),{credits:0,payments:0,balance:100});
  assert.deepEqual(benefitSummary({openingBalanceCents:0,transactions:[{type:'credit',amountCents:30},{type:'payment',amountCents:10}]}),{credits:30,payments:10,balance:20});
});
test('benefits do not depend on prevention records, points or goals',()=>{
  const before=benefitSummary(portalMock.benefits);
  const data=seedData();
  data.records=saveRecord(data.records,{date:'2026-10-26',sono:0,alimentacao:0,atividade:0});
  data.goals.sono=1;
  assert.deepEqual(benefitSummary(portalMock.benefits),before);
  assert.ok(validState(seedData()));
});
test('demo visibility has explicit profiles and does not authenticate anyone',()=>{
  assert.equal(demoSession.authenticated,false);
  assert.deepEqual(visibleDemoModules('citizen'),portalModules);
  assert.deepEqual(visibleDemoModules('unknown'),[]);
  assert.deepEqual(visibleDemoModules('professional').map(module=>module.id),['overview','healthRecord','appointments']);
});
test('fictional appointments reference existing fictional professionals',()=>{
  assert.ok(portalMock.appointments.every(item=>portalMock.professionals.some(professional=>professional.id===item.professionalId)));
  assert.equal(new Set(portalModules.map(module=>module.path)).size,6);
});
