import {test} from 'node:test';
import assert from 'node:assert/strict';
import {points,totalPoints,saveRecord,percentage,validState,seedData,defaultGoals} from '../src/model.js';
test('pontos reconhecem registros e metas, sem duplicar edições',()=>{const record={date:'2026-09-30',sono:8,alimentacao:3,atividade:30,targets:defaultGoals};assert.equal(points(record),37);const records=saveRecord([record],{...record,atividade:0});assert.equal(records.length,1);assert.equal(totalPoints(records),22)});
test('metas históricas são preservadas e ausência de registros não gera percentuais inválidos',()=>{assert.equal(percentage([],'sono'),0);assert.equal(points({sono:7,alimentacao:0,atividade:0,targets:{...defaultGoals,sono:7}}),12)});
test('bônus é por sete datas distintas e estado inválido é rejeitado',()=>{const records=Array.from({length:7},(_,i)=>({date:`2026-09-${20+i}`,sono:0,alimentacao:0,atividade:0}));assert.equal(totalPoints(records),24);assert.equal(validState(seedData()),true);assert.ok(!validState({records:[]}));assert.ok(!validState({...seedData(),records:[{date:'invalid'}]}))});
