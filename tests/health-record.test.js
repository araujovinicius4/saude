import {test} from 'node:test';
import assert from 'node:assert/strict';
import {healthRecordMock} from '../src/data/healthRecord.js';
import {demoPortalRepository} from '../src/portal/repository.js';
import {canEditRecord,saveCitizenRecord,deleteCitizenRecord,timelineRecords,validEventDate,recordTypes} from '../src/portal/health-record/model.js';

const actor={mode:'demo',role:'citizen',userId:'cid-demo',name:'Pessoa Cidadã de Exemplo'};
const draft={type:'exam',title:' Exame fictício pessoal ',description:' Nota de demonstração ',eventDate:'2026-10-22'};
const metadata={id:'test-id',registeredAt:'2026-10-26'};

test('all mock records have unique ids and valid dates, types and authors',()=>{
  assert.equal(new Set(healthRecordMock.map(record=>record.id)).size,healthRecordMock.length);
  for(const record of healthRecordMock){
    assert.ok(validEventDate(record.registeredAt));
    assert.ok(!record.eventDate||validEventDate(record.eventDate));
    assert.ok(Object.hasOwn(recordTypes,record.type));
    assert.ok(['citizen','professional'].includes(record.origin));
    assert.ok(record.authorId&&record.author);
  }
});
test('create ignores forged metadata and does not mutate the snapshot',()=>{
  const snapshot=demoPortalRepository.getSnapshot();
  const previous=structuredClone(snapshot);
  const records=saveCitizenRecord(snapshot.healthRecord.records,{...draft,origin:'professional',author:'Forged',authorId:'other',registeredAt:'1900-01-01'},actor,metadata);
  assert.deepEqual(records.at(-1),{...metadata,citizenId:actor.userId,type:'exam',title:'Exame fictício pessoal',description:'Nota de demonstração',eventDate:'2026-10-22',origin:'citizen',authorId:actor.userId,author:actor.name});
  assert.deepEqual(snapshot,previous);
});
test('default ids are unique and editing preserves registration, identity and ownership',()=>{
  const first=saveCitizenRecord([],draft,actor);
  const second=saveCitizenRecord(first,draft,actor);
  assert.notEqual(first[0].id,second[1].id);
  const edited=saveCitizenRecord(second,{...draft,id:first[0].id,title:'Título atualizado',origin:'professional',author:'other',registeredAt:'1900-01-01'},actor);
  assert.equal(edited.length,2);
  assert.deepEqual({...edited[0],title:first[0].title},first[0]);
  assert.equal(edited[1],second[1]);
});
test('citizen can delete own records but cannot edit or delete professional or foreign records',()=>{
  const personal=healthRecordMock.find(record=>record.origin==='citizen');
  const professional=healthRecordMock.find(record=>record.origin==='professional');
  assert.equal(canEditRecord(professional,actor),false);
  assert.equal(canEditRecord(personal,{...actor,userId:'other'}),false);
  assert.equal(canEditRecord(personal,{...actor,role:'professional'}),false);
  assert.equal(canEditRecord(personal,{...actor,mode:'real'}),false);
  for(const record of [professional,{...personal,id:'foreign',authorId:'other'}]){
    const records=[record];
    assert.throws(()=>saveCitizenRecord(records,{...draft,id:record.id},actor),/não pode ser alterado/);
    assert.throws(()=>deleteCitizenRecord(records,record.id,actor),/não pode ser excluído/);
  }
  assert.throws(()=>saveCitizenRecord([],draft,{...actor,role:'professional'}),/indisponível/);
  assert.throws(()=>saveCitizenRecord([],{...draft,id:'missing'},actor),/não pode/);
  assert.throws(()=>deleteCitizenRecord([],'missing',actor),/não pode/);
  assert.ok(!deleteCitizenRecord(healthRecordMock,personal.id,actor).some(record=>record.id===personal.id));
});
test('invalid fields, impossible dates and id collisions are rejected',()=>{
  for(const invalid of [{title:' '},{title:'x'.repeat(121)},{description:'x'.repeat(2001)},{type:'diagnosis'},{type:'history'},{eventDate:''},{eventDate:'2026-02-30'}]){
    assert.throws(()=>saveCitizenRecord([],{...draft,...invalid},actor,metadata));
  }
  assert.equal(validEventDate('2024-02-29'),true);
  assert.equal(validEventDate('2026-02-29'),false);
  assert.equal(validEventDate('2026-13-01'),false);
  const records=saveCitizenRecord([],draft,actor,metadata);
  assert.throws(()=>saveCitizenRecord(records,draft,actor,metadata),/duplicado/);
  assert.equal(saveCitizenRecord([],{...draft,type:'personal',eventDate:''},actor,metadata)[0].eventDate,'');
});
test('timeline combines clinical categories in descending event order with stable ties and registration fallback',()=>{
  assert.deepEqual(timelineRecords([]),[]);
  const records=[
    {id:'b',type:'condition',eventDate:'2026-01-01',registeredAt:'2026-01-02'},
    {id:'a',type:'exam',eventDate:'2026-01-01',registeredAt:'2026-01-02'},
    {id:'c',type:'medication',eventDate:'',registeredAt:'2026-02-01'},
    {id:'d',type:'consultation',eventDate:'2026-03-01',registeredAt:'2026-01-01'},
    {id:'e',type:'personal',eventDate:'',registeredAt:'2026-04-01'},
  ];
  const before=structuredClone(records);
  assert.deepEqual(timelineRecords(records).map(record=>record.id),['d','c','a','b']);
  assert.deepEqual(records,before);
  const types=new Set(timelineRecords(healthRecordMock).map(record=>record.type));
  for(const type of ['condition','allergy','medication','exam','consultation'])assert.ok(types.has(type));
});
