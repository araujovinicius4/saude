import {test} from 'node:test';
import assert from 'node:assert/strict';
import {careDistribution, overviewCareDistribution, seedData} from '../src/model.js';

test('overview renders existing MVP mocks without persisted records', () => {
  const mocks = seedData().records;
  const result = overviewCareDistribution([]);
  assert.equal(result.simulated, true);
  assert.equal(result.total, mocks.length * 3);
  assert.ok(result.areas.every(area => area.count > 0));
  assert.equal(result.areas.reduce((sum, area) => sum + area.percentage, 0), 100);
});

test('overview uses supplied records and only falls back for an empty period', () => {
  const today = new Date(2026,9,26,12);
  const mocks = [{date:'2026-10-26',sono:8,alimentacao:3,atividade:30}];
  const records = [{date:'2026-10-26',sono:1}];
  assert.deepEqual(overviewCareDistribution(records,mocks,today), {...careDistribution(records,today),simulated:false});
  assert.deepEqual(overviewCareDistribution([{date:'2025-01-01',sono:8}],mocks,today), {...careDistribution(mocks,today),simulated:true});
  assert.deepEqual(records,[{date:'2026-10-26',sono:1}]);
});

const today = new Date(2026, 9, 26, 12);
const calculate = records => careDistribution(records, today);
test('empty and out-of-period records have no distribution', () => {
  for (const records of [[], [{date:'2026-10-19',sono:8}], [{date:'2026-10-27',sono:8}]]) {
    assert.deepEqual(calculate(records), {total:0,areas:['sono','alimentacao','atividade'].map(id => ({id,count:0,percentage:0}))});
  }
});
test('counts valid days per area, including zero, independently of goals', () => {
  const result = calculate([
    {date:'2026-10-20',sono:0,alimentacao:1,atividade:0},
    {date:'2026-10-26',sono:2},
    {date:'2026-10-26',sono:8},
    {date:'2026-10-25',sono:NaN,alimentacao:'3',atividade:-1},
    {date:'2026-10-24',sono:null,alimentacao:Infinity,atividade:''},
    null,
  ]);
  assert.equal(result.total,4);
  assert.deepEqual(result.areas.map(a => [a.count,a.percentage]), [[2,50],[1,25],[1,25]]);
});
test('rounds equal shares deterministically to a total of 100', () => {
  assert.deepEqual(calculate([{date:'2026-10-26',sono:8,alimentacao:3,atividade:30}]).areas.map(a => a.percentage), [34,33,33]);
});
test('allocates remaining points to the largest fractional shares', () => {
  assert.deepEqual(calculate([{date:'2026-10-26',sono:8,alimentacao:3,atividade:30},{date:'2026-10-25',sono:8,alimentacao:3},{date:'2026-10-24',sono:8}]).areas.map(a => a.percentage),[50,33,17]);
  assert.deepEqual(calculate([{date:'2026-10-26',atividade:0}]).areas.map(a => a.percentage),[0,0,100]);
});
test('all possible weekly area counts sum to 100 when nonempty', () => {
  for(let s=0;s<=7;s++) for(let f=0;f<=7;f++) for(let a=0;a<=7;a++) {
    const records=Array.from({length:7},(_,i)=>({date:`2026-10-${20+i}`,sono:i<s?0:undefined,alimentacao:i<f?0:undefined,atividade:i<a?0:undefined}));
    const result=calculate(records);
    assert.equal(result.areas.reduce((sum,area)=>sum+area.percentage,0),s+f+a?100:0);
  }
});
test('seven day window crosses month and year boundaries', () => {
  const result=careDistribution([{date:'2025-12-27',sono:1},{date:'2025-12-26',sono:1},{date:'2026-01-02',sono:1}],new Date(2026,0,2,12));
  assert.equal(result.total,2);
});
