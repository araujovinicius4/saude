import {createPreventionMock} from './data/prevention.js';
export function localDate(date = new Date()) { const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function recentDates(count=7) { return Array.from({length:count},(_,i)=>{const d=new Date();d.setDate(d.getDate()-count+1+i);return localDate(d)}); }
export const defaultGoals = {sono:8,alimentacao:3,atividade:30};
// Each area counts distinct days with an explicit, non-negative numeric value.
export function careDistribution(records, today = new Date()) {
  const dates = new Set(Array.from({length:7}, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    return localDate(date);
  }));
  const areas = Object.keys(defaultGoals).map(id => ({
    id,
    count: new Set(records.filter(record => record && dates.has(record.date) && Number.isFinite(record[id]) && record[id] >= 0).map(record => record.date)).size,
    percentage: 0,
  }));
  const total = areas.reduce((sum, area) => sum + area.count, 0);
  if (!total) return {total, areas};
  areas.forEach(area => { area.percentage = Math.floor(area.count * 100 / total); });
  // Largest remainders; ties follow the fixed area order for stable results.
  const ranked = [...areas].sort((a, b) => (b.count * 100 % total) - (a.count * 100 % total));
  const remaining = 100 - areas.reduce((sum, area) => sum + area.percentage, 0);
  ranked.slice(0, remaining).forEach(area => { area.percentage += 1; });
  return {total, areas};
}
export function seedData() { return createPreventionMock(recentDates(), defaultGoals); }
// Keep the MVP fallback separate from persistence and from percentage calculations.
export function overviewCareDistribution(records, mocks = seedData().records, today = new Date()) {
  const distribution = careDistribution(records, today);
  return distribution.total
    ? {...distribution, simulated:false}
    : {...careDistribution(mocks, today), simulated:true};
}
export function points(record) { if(!record)return 0; const g=record.targets||defaultGoals;return 2+(record.sono>=g.sono?10:0)+(record.alimentacao>=g.alimentacao?10:0)+(record.atividade>=g.atividade?15:0); }
export function totalPoints(records) {return records.reduce((sum,r)=>sum+points(r),0)+Math.floor(new Set(records.map(r=>r.date)).size/7)*10;}
export function percentage(records,id){return records.length?Math.round(100*records.filter(r=>r[id]>=(r.targets||defaultGoals)[id]).length/records.length):0;}
export function saveRecord(records,record){return [...records.filter(r=>r.date!==record.date),record].sort((a,b)=>a.date.localeCompare(b.date));}
export function validState(value){return value && value.goals && Object.keys(defaultGoals).every(k=>Number.isFinite(value.goals[k])&&value.goals[k]>0) && Array.isArray(value.records) && value.records.every(r=>r && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && Object.keys(defaultGoals).every(k=>Number.isFinite(r[k])&&r[k]>=0) && (!r.targets || Object.keys(defaultGoals).every(k=>Number.isFinite(r.targets[k])&&r.targets[k]>0))) && value.sharing && typeof value.sharing.professional==='string';}
