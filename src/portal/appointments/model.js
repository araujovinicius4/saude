import {localDate} from '../../model.js';
import {validEventDate} from '../health-record/model.js';

export const appointmentStatuses={scheduled:'Agendado',completed:'Realizado',cancelled:'Cancelado'};
export const appointmentSections=[{id:'atendimentos',label:'Meus atendimentos'},{id:'profissionais',label:'Profissionais vinculados'},{id:'registros',label:'Registros clínicos'},{id:'autorizacoes',label:'Autorizações de acesso'}];
export const accessScopes={read:'Consultar prontuário',write:'Registrar atendimento e retificação'};
export const auditLabels={profile_changed:'Perfil demonstrativo alterado',citizen_selected:'Cidadão vinculado selecionado',access_granted:'Consulta ao prontuário',access_denied:'Consulta recusada',authorization_requested:'Acesso solicitado',authorization_granted:'Autorização concedida',authorization_revoked:'Autorização revogada',appointment_saved:'Rascunho salvo',appointment_finalized:'Atendimento finalizado',record_rectified:'Retificação registrada',professional_registered:'Profissional fictício cadastrado',personal_record_saved:'Registro autodeclarado salvo',personal_record_deleted:'Registro autodeclarado excluído'};
export function isLinked(data,professionalId,citizenId){return data.professionalLinks.some(link=>link.professionalId===professionalId&&link.citizenId===citizenId&&link.status==='active');}
export function linkedCitizens(data,professionalId){return data.citizens.filter(citizen=>isLinked(data,professionalId,citizen.id));}
export function activeAuthorization(data,professionalId,citizenId){return data.authorizations.find(auth=>auth.professionalId===professionalId&&auth.citizenId===citizenId&&auth.status==='granted');}
export function hasClinicalAccess(data,actor,citizenId,scope='read'){
  if(actor?.mode!=='demo')return false;
  if(actor.role==='citizen')return actor.userId===citizenId;
  const auth=activeAuthorization(data,actor.userId,citizenId);
  return actor.role==='professional'&&isLinked(data,actor.userId,citizenId)&&!!auth?.scopes.includes(scope);
}
export function recordsFor(data,actor,citizenId){return hasClinicalAccess(data,actor,citizenId)?data.healthRecord.records.filter(record=>record.citizenId===citizenId):[];}
export function filterAppointments(appointments,{date='',professionalId='',status=''}={}){return appointments.filter(item=>(!date||item.date===date)&&(!professionalId||item.professionalId===professionalId)&&(!status||item.status===status)).sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)||a.id.localeCompare(b.id));}

function requireDemo(actor){if(actor?.mode!=='demo'||!['citizen','professional'].includes(actor.role))throw new Error('Perfil demonstrativo inválido.');}
function requireCitizen(actor,citizenId){requireDemo(actor);if(actor.role!=='citizen'||actor.userId!==citizenId)throw new Error('Somente o cidadão pode conceder ou revogar esta autorização simulada.');}
function requireProfessional(data,actor,citizenId,scope){requireDemo(actor);if(actor.role!=='professional'||!hasClinicalAccess(data,actor,citizenId,scope))throw new Error('Vínculo ativo e autorização simulada compatível são necessários.');}
function text(value,label,required=true,max=2000){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new Error(`Informe ${label} válido (até ${max} caracteres).`);return value.trim();}
function checkedScopes(scopes){if(!Array.isArray(scopes)||!scopes.includes('read')||scopes.some(scope=>!Object.hasOwn(accessScopes,scope)))throw new Error('O escopo deve permitir consulta e, opcionalmente, registro.');return [...new Set(scopes)];}
function event(data,actor,action,fields,now){return {...data,accessEvents:[...data.accessEvents,{id:globalThis.crypto.randomUUID(),at:now,actorId:actor.userId,actorRole:actor.role,action,...fields}]};}

// Pure, in-memory transitions. These checks illustrate the future server contract.
// They are not authentication or effective security in a frontend application.
export function changeAppointments(data,action,actor,{now=new Date().toISOString(),id=globalThis.crypto.randomUUID()}={}){
  requireDemo(actor);
  const citizenId=action.citizenId;
  if(!data.citizens.some(citizen=>citizen.id===citizenId))throw new Error('Cidadão fictício não encontrado.');
  if(action.type==='registerProfessional'){
    requireCitizen(actor,citizenId);
    const draft=action.draft;
    const professional={id:`prof-${id}`,name:text(draft.name,'um nome fictício',true,120),category:text(draft.category,'uma categoria',true,100),specialty:text(draft.specialty,'uma especialidade',true,100),council:text(draft.council,'um conselho fictício',true,100),registration:text(draft.registration,'um registro fictício',true,100),unit:text(draft.unit,'uma unidade fictícia',true,120)};
    if(!professional.registration.startsWith('FICTÍCIO-')||professional.registration==='FICTÍCIO-')throw new Error('Use um número de registro fictício com o prefixo FICTÍCIO-.');
    if(!['active','inactive'].includes(draft.linkStatus))throw new Error('Informe a situação do vínculo.');
    if(data.professionals.some(item=>item.id===professional.id))throw new Error('Identificador de profissional duplicado.');
    return event({...data,professionals:[...data.professionals,professional],professionalLinks:[...data.professionalLinks,{id:`link-${id}`,citizenId,professionalId:professional.id,status:draft.linkStatus}]},actor,'professional_registered',{citizenId,professionalId:professional.id,details:'Cadastro exclusivamente fictício, sem validação de conselho.'},now);
  }
  const professionalId=actor.role==='professional'?actor.userId:action.professionalId;
  const professional=data.professionals.find(item=>item.id===professionalId);
  const fields={citizenId,professionalId};
  if(action.type==='view'){
    const allowed=hasClinicalAccess(data,actor,citizenId);
    return event(data,actor,allowed?'access_granted':'access_denied',fields,now);
  }
  if(['request','grant','revoke'].includes(action.type)){
    if(!professional)throw new Error('Profissional fictício não encontrado.');
    const existing=data.authorizations.find(auth=>auth.citizenId===citizenId&&auth.professionalId===professionalId);
    if(action.type==='revoke'){
      requireCitizen(actor,citizenId);
      if(!existing||existing.status!=='granted')throw new Error('Não há autorização concedida para revogar.');
      const auth={...existing,status:'revoked',updatedAt:now};
      return event({...data,authorizations:data.authorizations.map(item=>item.id===auth.id?auth:item)},actor,'authorization_revoked',{...fields,authorizationId:auth.id,details:existing.purpose},now);
    }
    if(!isLinked(data,professionalId,citizenId))throw new Error('É necessário vínculo ativo com o cidadão.');
    if(action.type==='request'){
      if(actor.role!=='professional')throw new Error('Somente o profissional pode solicitar acesso.');
      if(existing&&['granted','requested'].includes(existing.status))throw new Error('Já existe uma autorização concedida ou solicitação pendente.');
    }else requireCitizen(actor,citizenId);
    const purpose=text(action.purpose,'uma finalidade',true,300);
    const scopes=checkedScopes(action.scopes);
    if(!existing&&data.authorizations.some(item=>item.id===id))throw new Error('Identificador de autorização duplicado.');
    const auth={id:existing?.id||id,citizenId,professionalId,status:action.type==='request'?'requested':'granted',purpose,scopes,requestedAt:existing?.requestedAt||now,updatedAt:now};
    const authorizations=existing?data.authorizations.map(item=>item.id===auth.id?auth:item):[...data.authorizations,auth];
    return event({...data,authorizations},actor,action.type==='request'?'authorization_requested':'authorization_granted',{...fields,authorizationId:auth.id,details:`${purpose} · ${scopes.join(', ')}`},now);
  }
  requireProfessional(data,actor,citizenId,'write');
  if(action.type==='save'){
    const draft=action.draft;
    const previous=draft.id?data.appointments.find(item=>item.id===draft.id):null;
    if(draft.id&&(!previous||previous.citizenId!==citizenId||previous.professionalId!==actor.userId))throw new Error('Atendimento indisponível para este profissional.');
    if(previous&&previous.status!=='scheduled')throw new Error('Atendimento finalizado ou cancelado não aceita edição direta.');
    if(!previous&&data.appointments.some(item=>item.id===id))throw new Error('Identificador de atendimento duplicado.');
    if(!validEventDate(draft.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.time))throw new Error('Informe data e horário válidos.');
    const appointment={...(previous||{id,citizenId,professionalId:actor.userId,unit:professional.unit,specialty:professional.specialty,status:'scheduled',recordId:null}),date:draft.date,time:draft.time,type:text(draft.type,'um título',true,120),draft:{summary:text(draft.summary,'um resumo',false),evolution:text(draft.evolution,'uma evolução',false),instructions:text(draft.instructions,'orientações',false)}};
    return event({...data,appointments:previous?data.appointments.map(item=>item.id===appointment.id?appointment:item):[...data.appointments,appointment]},actor,'appointment_saved',{...fields,appointmentId:appointment.id},now);
  }
  const appointment=data.appointments.find(item=>item.id===action.appointmentId);
  if(!appointment||appointment.citizenId!==citizenId||appointment.professionalId!==actor.userId)throw new Error('Atendimento indisponível para este profissional.');
  if(action.type==='finalize'){
    if(appointment.status!=='scheduled')throw new Error('Atendimento já finalizado ou cancelado.');
    const summary=text(appointment.draft?.summary,'um resumo');
    const evolution=text(appointment.draft?.evolution,'uma evolução');
    const instructions=text(appointment.draft?.instructions,'orientações fictícias');
    const recordId=appointment.recordId||id;
    const previous=data.healthRecord.records.find(item=>item.id===recordId);
    if(previous&&(!appointment.recordId||previous.citizenId!==citizenId||previous.authorId!==actor.userId||previous.appointmentId!==appointment.id))throw new Error('Identificador clínico duplicado ou incompatível.');
    if(previous?.locked)throw new Error('Registro clínico já finalizado.');
    const record={id:recordId,citizenId,appointmentId:appointment.id,type:'consultation',title:appointment.type,description:`Resumo: ${summary}\nEvolução: ${evolution}\nOrientações fictícias: ${instructions}`,summary,evolution,instructions,origin:'professional',authorId:actor.userId,author:professional.name,registeredAt:previous?.registeredAt||localDate(new Date(now)),eventDate:appointment.date,locked:true,finalizedAt:now};
    const records=previous?data.healthRecord.records.map(item=>item.id===recordId?record:item):[...data.healthRecord.records,record];
    return event({...data,appointments:data.appointments.map(item=>item.id===appointment.id?{...item,status:'completed',recordId,draft:null,finalizedAt:now}:item),healthRecord:{...data.healthRecord,records}},actor,'appointment_finalized',{...fields,appointmentId:appointment.id,recordId},now);
  }
  if(action.type==='rectify'){
    if(appointment.status!=='completed')throw new Error('Retificação exige atendimento finalizado.');
    const original=data.healthRecord.records.find(item=>item.id===appointment.recordId);
    if(!original?.locked||original.authorId!==actor.userId)throw new Error('Registro original indisponível para retificação.');
    if(data.healthRecord.records.some(item=>item.id===id))throw new Error('Identificador clínico duplicado.');
    const reason=text(action.reason,'um motivo de retificação',true,500);
    const correction=text(action.correction,'a correção fictícia');
    const record={id,citizenId,appointmentId:appointment.id,originalRecordId:original.id,type:'rectification',title:`Retificação de ${original.title}`,description:`Motivo: ${reason}\nCorreção fictícia: ${correction}`,reason,correction,origin:'professional',authorId:actor.userId,author:professional.name,registeredAt:localDate(new Date(now)),eventDate:localDate(new Date(now)),locked:true,finalizedAt:now};
    return event({...data,healthRecord:{...data.healthRecord,records:[...data.healthRecord.records,record]}},actor,'record_rectified',{...fields,appointmentId:appointment.id,recordId:id,originalRecordId:original.id,details:reason},now);
  }
  throw new Error('Operação demonstrativa desconhecida.');
}
