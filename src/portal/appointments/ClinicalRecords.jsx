import React,{useState} from 'react';
import {Link} from 'react-router-dom';
import {usePortal} from '../PortalContext';
import RecordCard from '../health-record/RecordCard';

function RectificationForm({record,onSave,onCancel}){
  const [reason,setReason]=useState('');const [correction,setCorrection]=useState('');const [error,setError]=useState('');
  return <form className="panel form-panel appointment-form" aria-label="Retificação de registro finalizado" onSubmit={event=>{event.preventDefault();try{onSave(reason,correction);}catch(error){setError(error.message);}}}>
    <h3>Retificar registro finalizado</h3><p className="fine">Original preservado: {record.id}. A retificação cria outro registro, com autoria e data próprias, sem apagar a informação original.</p>
    <label>Motivo da retificação<input autoFocus required maxLength={500} value={reason} onChange={event=>setReason(event.target.value)}/></label>
    <label>Correção fictícia<textarea required maxLength={2000} value={correction} onChange={event=>setCorrection(event.target.value)}/></label>
    {error&&<p role="alert">{error}</p>}<div className="actions"><button className="button" type="submit">Registrar retificação</button><button className="button secondary" type="button" onClick={onCancel}>Cancelar retificação</button></div>
  </form>;
}
export default function ClinicalRecords(){
  const {session,currentCitizen,canReadClinical,canWriteClinical,clinicalViewed,clinicalRecords,openClinicalRecord,changeAppointments}=usePortal();
  const [message,setMessage]=useState('');const [error,setError]=useState('');const [original,setOriginal]=useState(null);
  const records=clinicalRecords.filter(record=>record.type!=='personal');
  return <>
    <h2 className="appointment-heading">Registros clínicos</h2>
    <p className="muted">Mesma fonte do Prontuário. Registros profissionais finalizados são imutáveis; correções geram retificações vinculadas. Todo conteúdo é fictício.</p>
    {session.role==='professional'&&<div className="panel portal-section"><p>{canReadClinical?'Autorização de consulta disponível.':'Sem autorização de consulta ativa para este cidadão.'}</p><button type="button" className="button" onClick={()=>{if(openClinicalRecord()){setMessage('Consulta simulada registrada na auditoria.');setError('');}else setError('Consulta recusada: vínculo e autorização de leitura são necessários.');}}>Consultar prontuário autorizado</button></div>}
    <p role="status" className="success hr-status">{message}</p>{error&&<p role="alert">{error}</p>}
    {clinicalViewed&&canReadClinical&&<>
      <Link className="button secondary" to="/app/prontuario?secao=linha-do-tempo">Abrir linha do tempo do prontuário</Link>
      {original&&canWriteClinical&&<RectificationForm key={original.id} record={original} onSave={(reason,correction)=>{changeAppointments({type:'rectify',citizenId:currentCitizen.id,appointmentId:original.appointmentId,reason,correction});setOriginal(null);setMessage('Retificação registrada. O conteúdo original foi preservado.');}} onCancel={()=>setOriginal(null)}/>}
      <div className="hr-records clinical-records">{records.map(record=><div className="clinical-entry" key={record.id}><RecordCard record={record} actor={session} timeline linkBase="/app/prontuario"/>
        {session.role==='professional'&&canWriteClinical&&record.type==='consultation'&&record.locked&&record.authorId===session.userId&&record.appointmentId&&<button type="button" className="button secondary" aria-label={`Retificar ${record.title}`} onClick={()=>setOriginal(record)}>Criar retificação</button>}
      </div>)}</div>{!records.length&&<p className="panel">Nenhum registro clínico disponível para este cidadão.</p>}
    </>}
  </>;
}
