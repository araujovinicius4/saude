import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoPortalRepository} from '../src/portal/repository.js';
import {changeAppointments,filterAppointments,linkedCitizens,hasClinicalAccess,recordsFor} from '../src/portal/appointments/model.js';
import {saveCitizenRecord,timelineRecords} from '../src/portal/health-record/model.js';

const professional={mode:'demo',authenticated:false,role:'professional',userId:'prof-1'};
const citizen={mode:'demo',authenticated:false,role:'citizen',userId:'cid-demo'};
const now='2026-10-26T12:00:00Z';
const draft={type:'Consulta fictícia de teste',date:'2026-10-26',time:'10:00',summary:'Resumo fictício.',evolution:'Evolução fictícia.',instructions:'Orientação ilustrativa, sem prescrição.'};
const snapshot=()=>demoPortalRepository.getSnapshot();
const change=(data,action,actor=professional,id='test-record')=>changeAppointments(data,{citizenId:'cid-demo',...action},actor,{id,now});
function completeNew(){const saved=change(snapshot(),{type:'save',draft},professional,'new-appointment');return change(saved,{type:'finalize',appointmentId:'new-appointment'},professional,'new-record');}

test('appointments have fictional identity, council, links and all three statuses',()=>{
  const data=snapshot();
  for(const item of data.appointments){
    assert.ok(item.citizenId&&item.id&&item.unit&&item.specialty&&item.time);
    assert.ok(data.professionals.some(professional=>professional.id===item.professionalId));
  }
  assert.deepEqual(new Set(data.appointments.map(item=>item.status)),new Set(['scheduled','completed','cancelled']));
  assert.ok(data.professionals.every(professional=>professional.registration.startsWith('FICTÍCIO-')&&professional.council==='Conselho DEMO'));
  assert.deepEqual(linkedCitizens(data,'prof-1').map(citizen=>citizen.id),['cid-demo','cid-demo-2']);
  assert.deepEqual(linkedCitizens(data,'prof-3'),[]);
});
test('filters combine date, professional and status without changing the collection',()=>{
  const appointments=snapshot().appointments;const before=structuredClone(appointments);
  assert.deepEqual(filterAppointments(appointments,{date:'2026-11-05',professionalId:'prof-1',status:'scheduled'}).map(item=>item.id),['appt-1']);
  assert.equal(filterAppointments(appointments,{status:'completed'}).length,1);
  assert.equal(filterAppointments(appointments,{status:'cancelled'}).length,1);
  assert.deepEqual(filterAppointments(appointments,{date:'2000-01-01'}),[]);
  assert.deepEqual(appointments,before);
});
test('scope, ownership and active links gate simulated access',()=>{
  const data=snapshot();
  assert.equal(hasClinicalAccess(data,professional,'cid-demo','write'),true);
  assert.equal(hasClinicalAccess(data,professional,'cid-demo-2','read'),true);
  assert.equal(hasClinicalAccess(data,professional,'cid-demo-2','write'),false);
  assert.equal(hasClinicalAccess(data,professional,'cid-demo-3'),false);
  assert.equal(hasClinicalAccess(data,{...professional,userId:'prof-2'},'cid-demo'),false);
  assert.equal(hasClinicalAccess(data,{...professional,mode:'real'},'cid-demo'),false);
  assert.deepEqual(recordsFor(data,professional,'cid-demo-3'),[]);
  assert.ok(recordsFor(data,professional,'cid-demo').every(record=>record.citizenId==='cid-demo'));
  assert.throws(()=>change(data,{type:'save',draft},citizen),/necessários/);
  assert.throws(()=>change(data,{type:'save',citizenId:'cid-demo-2',draft}),/necessários/);
  assert.throws(()=>change(data,{type:'save',draft:{...draft,id:'appt-2'}}),/indisponível/);
});
test('finalization creates one locked canonical record and repeat finalization is rejected',()=>{
  const data=snapshot();const before=structuredClone(data);
  const saved=change(data,{type:'save',draft},professional,'new-appointment');
  assert.equal(saved.healthRecord,data.healthRecord);
  const completed=change(saved,{type:'finalize',appointmentId:'new-appointment'},professional,'new-record');
  const appointment=completed.appointments.find(item=>item.id==='new-appointment');
  const record=completed.healthRecord.records.find(item=>item.id===appointment.recordId);
  assert.equal(appointment.status,'completed');assert.equal(appointment.draft,null);
  assert.equal(record.locked,true);assert.equal(record.origin,'professional');assert.equal(record.authorId,'prof-1');
  assert.equal(record.summary,draft.summary);assert.equal(record.instructions,draft.instructions);
  assert.equal(record.citizenId,'cid-demo');assert.equal(record.type,'consultation');
  assert.equal(timelineRecords(completed.healthRecord.records).filter(item=>item.appointmentId===appointment.id).length,1);
  assert.throws(()=>change(completed,{type:'finalize',appointmentId:appointment.id}),/já finalizado/);
  assert.throws(()=>change(completed,{type:'save',draft:{...draft,id:appointment.id}}),/edição direta/);
  assert.throws(()=>saveCitizenRecord(completed.healthRecord.records,{id:record.id,type:'consultation',title:'forged',description:'',eventDate:'2026-10-26'},citizen),/não pode ser alterado/);
  assert.deepEqual(data,before);assert.deepEqual(completed.benefits,before.benefits);
});
test('finalizing an existing scheduled appointment reuses its canonical record id',()=>{
  const data=snapshot();const length=data.healthRecord.records.length;
  const saved=change(data,{type:'save',draft:{...draft,id:'appt-1'}});
  const completed=change(saved,{type:'finalize',appointmentId:'appt-1'});
  assert.equal(completed.appointments.find(item=>item.id==='appt-1').recordId,'hr-consultation-1');
  assert.equal(completed.healthRecord.records.length,length);
  assert.equal(completed.healthRecord.records.filter(record=>record.appointmentId==='appt-1').length,1);
});
test('rectification appends a locked, authored record linked to an unchanged original',()=>{
  const data=completeNew();
  const before=structuredClone(data);
  const next=change(data,{type:'rectify',appointmentId:'new-appointment',reason:'Ajuste demonstrativo',correction:'Texto fictício corrigido'},professional,'rectification-1');
  const correction=next.healthRecord.records.find(record=>record.id==='rectification-1');
  assert.equal(correction.originalRecordId,'new-record');assert.equal(correction.type,'rectification');assert.equal(correction.locked,true);
  assert.equal(correction.authorId,'prof-1');assert.equal(correction.registeredAt,'2026-10-26');
  assert.deepEqual(next.healthRecord.records.find(record=>record.id==='new-record'),before.healthRecord.records.find(record=>record.id==='new-record'));
  assert.deepEqual(next.appointments,data.appointments);
  assert.equal(next.healthRecord.records.length,data.healthRecord.records.length+1);
  assert.throws(()=>change(next,{type:'rectify',appointmentId:'appt-1',reason:'x',correction:'y'}),/finalizado/);
  assert.throws(()=>change(next,{type:'rectify',appointmentId:'new-appointment',reason:'',correction:'y'}),/motivo/);
});
test('requests, grants, revocation and access attempts are audited without erasing records',()=>{
  const data=completeNew();
  const granted=data.authorizations.find(auth=>auth.id==='auth-1');
  const read=change(data,{type:'view'});assert.equal(read.accessEvents.at(-1).action,'access_granted');
  const revoked=change(read,{type:'revoke',professionalId:'prof-1'},citizen);
  assert.equal(hasClinicalAccess(revoked,professional,'cid-demo'),false);
  assert.deepEqual(revoked.healthRecord,data.healthRecord);
  assert.equal(revoked.accessEvents.at(-1).action,'authorization_revoked');
  assert.equal(change(revoked,{type:'view'}).accessEvents.at(-1).action,'access_denied');
  for(const action of [{type:'save',draft},{type:'finalize',appointmentId:'appt-1'},{type:'rectify',appointmentId:'new-appointment',reason:'x',correction:'y'}])assert.throws(()=>change(revoked,action),/necessários/);
  const requested=change(revoked,{type:'request',purpose:'Consulta fictícia',scopes:['read']});
  assert.equal(requested.authorizations.find(auth=>auth.id===granted.id).status,'requested');
  assert.equal(hasClinicalAccess(requested,professional,'cid-demo'),false);
  const restored=change(requested,{type:'grant',professionalId:'prof-1',purpose:'Consulta fictícia',scopes:['read']},citizen);
  assert.equal(hasClinicalAccess(restored,professional,'cid-demo'),true);
  assert.equal(hasClinicalAccess(restored,professional,'cid-demo','write'),false);
  assert.deepEqual(restored.healthRecord,data.healthRecord);
  assert.ok(restored.accessEvents.some(event=>event.action==='authorization_requested'));
  assert.ok(restored.accessEvents.some(event=>event.action==='authorization_granted'));
  assert.equal(restored.authorizations.filter(auth=>auth.professionalId==='prof-1'&&auth.citizenId==='cid-demo').length,1);
});
test('authorization validation rejects forged grants, inactive links, blank purposes and invalid scopes',()=>{
  const data=snapshot();
  assert.throws(()=>change(data,{type:'grant',professionalId:'prof-1',purpose:'x',scopes:['read']}),/Somente o cidadão/);
  assert.throws(()=>change(data,{type:'grant',professionalId:'prof-3',purpose:'x',scopes:['read']},citizen),/vínculo ativo/);
  assert.throws(()=>change(data,{type:'grant',professionalId:'prof-1',purpose:'',scopes:['read']},citizen),/finalidade/);
  assert.throws(()=>change(data,{type:'grant',professionalId:'prof-1',purpose:'x',scopes:['write']},citizen),/escopo/);
  assert.throws(()=>change(data,{type:'grant',professionalId:'prof-1',purpose:'x',scopes:['read','admin']},citizen),/escopo/);
  assert.throws(()=>change(data,{type:'save',draft:{...draft,date:'2026-02-30'}}),/data e horário/);
  assert.throws(()=>change(data,{type:'save',draft:{...draft,time:'25:00'}}),/data e horário/);
  const blank=change(data,{type:'save',draft:{...draft,summary:''}},professional,'blank');
  assert.throws(()=>change(blank,{type:'finalize',appointmentId:'blank'}),/resumo/);
});

test('fictional professional registration creates a link without granting clinical access',()=>{
  const data=snapshot();
  const draft={name:'Equipe de Exemplo Nova',category:'Categoria fictícia',specialty:'Especialidade fictícia',council:'Conselho DEMO',registration:'FICTÍCIO-004',unit:'Unidade Nova de Exemplo',linkStatus:'active'};
  const next=change(data,{type:'registerProfessional',draft},citizen,'registered-professional');
  const id='prof-registered-professional';
  assert.equal(next.professionals.find(item=>item.id===id).name,draft.name);
  assert.deepEqual(linkedCitizens(next,id).map(item=>item.id),['cid-demo']);
  assert.equal(hasClinicalAccess(next,{...professional,userId:id},'cid-demo'),false);
  assert.equal(next.accessEvents.at(-1).action,'professional_registered');
  assert.throws(()=>change(data,{type:'registerProfessional',draft},professional),/Somente o cidadão/);
  assert.throws(()=>change(data,{type:'registerProfessional',draft:{...draft,registration:'12345'}},citizen),/FICTÍCIO/);
  assert.throws(()=>change(next,{type:'registerProfessional',draft},citizen,'registered-professional'),/duplicado/);
});
test('canonical record id collisions cannot overwrite an unrelated record',()=>{
  const data=change(snapshot(),{type:'save',draft},professional,'collision-appointment');
  assert.throws(()=>change(data,{type:'save',draft},professional,'collision-appointment'),/duplicado/);
  assert.throws(()=>change(data,{type:'finalize',appointmentId:'collision-appointment'},professional,'hr-allergy-1'),/duplicado/);
  const completed=completeNew();
  assert.throws(()=>change(completed,{type:'rectify',appointmentId:'new-appointment',reason:'teste',correction:'teste'},professional,'new-record'),/duplicado/);
});
