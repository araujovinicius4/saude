import {localDate} from '../../model.js';
export const recordTypes = {
  personal:'Informação pessoal',condition:'Condição de saúde',allergy:'Alergia',
  medication:'Medicamento',exam:'Exame',consultation:'Consulta',history:'Histórico',rectification:'Retificação',
};
export const recordSections = [
  {id:'pessoais',label:'Dados pessoais',types:['personal']},
  {id:'condicoes',label:'Condições de saúde e alergias',types:['condition','allergy']},
  {id:'medicamentos',label:'Medicamentos',types:['medication']},
  {id:'exames',label:'Exames',types:['exam']},
  {id:'consultas',label:'Consultas',types:['consultation','rectification']},
  {id:'linha-do-tempo',label:'Linha do tempo',types:['condition','allergy','medication','exam','consultation','history','rectification']},
];

export function canEditRecord(record, actor) {
  return actor?.mode === 'demo' && actor.role === 'citizen' && record.origin === 'citizen' && !record.locked && record.authorId === actor.userId && (!record.citizenId || record.citizenId===actor.userId);
}
export function validEventDate(value) {
  if(typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
}
function validateDraft(draft) {
  if(!Object.hasOwn(recordTypes,draft.type) || ['history','rectification'].includes(draft.type))throw new Error('Selecione um tipo de registro pessoal válido.');
  if(typeof draft.title!=='string' || !draft.title.trim() || draft.title.trim().length>120)throw new Error('Informe um título de até 120 caracteres.');
  if(typeof draft.description!=='string' || draft.description.length>2000)throw new Error('Use até 2000 caracteres na descrição.');
  if((draft.type!=='personal' || draft.eventDate) && !validEventDate(draft.eventDate))throw new Error('Informe uma data do evento válida.');
}
export function saveCitizenRecord(records,draft,actor,{id=globalThis.crypto.randomUUID(),registeredAt=localDate()}={}) {
  if(actor?.mode!=='demo' || actor.role!=='citizen' || !actor.userId)throw new Error('Ação indisponível para este perfil demonstrativo.');
  const existing=draft.id ? records.find(record=>record.id===draft.id) : null;
  if(draft.id && (!existing || !canEditRecord(existing,actor)))throw new Error('Este registro não pode ser alterado pelo cidadão.');
  validateDraft(draft);
  if(!existing && records.some(record=>record.id===id))throw new Error('Identificador de registro duplicado.');
  const record={
    ...(existing || {id,citizenId:actor.userId,registeredAt,origin:'citizen',authorId:actor.userId,author:actor.name}),
    type:draft.type,title:draft.title.trim(),description:draft.description.trim(),eventDate:draft.eventDate || '',
  };
  return existing ? records.map(item=>item.id===existing.id ? record : item) : [...records,record];
}
export function deleteCitizenRecord(records,id,actor) {
  const record=records.find(item=>item.id===id);
  if(!record || !canEditRecord(record,actor))throw new Error('Este registro não pode ser excluído pelo cidadão.');
  return records.filter(item=>item.id!==id);
}
export function timelineRecords(records) {
  const types=recordSections.find(section=>section.id==='linha-do-tempo').types;
  return records.filter(record=>types.includes(record.type)).sort((a,b)=>(b.eventDate || b.registeredAt).localeCompare(a.eventDate || a.registeredAt) || b.registeredAt.localeCompare(a.registeredAt) || a.id.localeCompare(b.id));
}
