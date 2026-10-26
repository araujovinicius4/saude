import React,{useState} from 'react';
import {usePortal} from '../PortalContext';
import {formatDate} from '../model';
import {appointmentStatuses,filterAppointments} from './model';
import AppointmentForm from './AppointmentForm';

export default function AppointmentList(){
  const {data,session,currentCitizen,canWriteClinical,clinicalRecords,changeAppointments}=usePortal();
  const [filters,setFilters]=useState({date:'',professionalId:'',status:''});
  const [form,setForm]=useState(null);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const professionalView=session.role==='professional';
  const items=data.appointments.filter(item=>item.citizenId===currentCitizen.id&&(!professionalView||item.professionalId===session.userId));
  const records=filterAppointments(items,filters);
  const filter=event=>setFilters(previous=>({...previous,[event.target.name]:event.target.value}));
  const save=draft=>{changeAppointments({type:'save',citizenId:currentCitizen.id,draft});setForm(null);setMessage('Rascunho salvo em memória.');setError('');};
  const finalize=id=>{try{changeAppointments({type:'finalize',citizenId:currentCitizen.id,appointmentId:id});setMessage('Atendimento finalizado. Registro bloqueado e integrado ao prontuário.');setError('');setForm(null);}catch(error){setError(error.message);}};
  return <>
    <div className="row hr-section-heading"><h2>Meus atendimentos</h2>{professionalView&&canWriteClinical&&<button className="button" type="button" onClick={()=>{setForm({});setError('');}}>Registrar atendimento demonstrativo</button>}</div>
    <div className="panel appointment-filters" role="group" aria-label="Filtros de atendimentos">
      <label>Filtrar por data<input type="date" name="date" value={filters.date} onChange={filter}/></label>
      <label>Filtrar por profissional<select name="professionalId" value={filters.professionalId} onChange={filter}><option value="">Todos os profissionais</option>{data.professionals.filter(professional=>items.some(item=>item.professionalId===professional.id)).map(professional=><option key={professional.id} value={professional.id}>{professional.name}</option>)}</select></label>
      <label>Filtrar por situação<select name="status" value={filters.status} onChange={filter}><option value="">Todas as situações</option>{Object.entries(appointmentStatuses).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
      <button className="button secondary" type="button" onClick={()=>setFilters({date:'',professionalId:'',status:''})}>Limpar filtros</button>
    </div>
    <p role="status" className="success hr-status">{message}</p>{error&&<p role="alert">{error}</p>}
    {professionalView&&!canWriteClinical&&<p className="muted">Sem autorização para registrar. Solicite o escopo de registro em Autorizações de acesso.</p>}
    {form&&<AppointmentForm key={form.id||'new'} appointment={form.id?form:null} onSave={save} onCancel={()=>setForm(null)}/>}
    <div className="hr-records appointment-list">{records.map(item=>{
      const professional=data.professionals.find(professional=>professional.id===item.professionalId);
      const record=clinicalRecords.find(record=>record.id===item.recordId);
      return <article className="panel appointment-card" key={item.id} aria-label={item.type} data-appointment-id={item.id} data-status={item.status}>
        <div className="row"><h3>{item.type}</h3><span className="tag">{appointmentStatuses[item.status]}</span></div>
        <dl className="hr-metadata">{[['ID',item.id],['Cidadão',item.citizenId],['Profissional responsável',professional.name],['Unidade fictícia',item.unit],['Especialidade',item.specialty],['Data e horário',`${formatDate(item.date)} às ${item.time}`]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        {item.status==='completed'&&<>{record?<><p><b>Resumo:</b> {record.summary||record.description}</p><p><b>Orientações fictícias:</b> {record.instructions||'Sem orientação adicional.'}</p><small>Registro clínico: {record.id}</small></>:<p className="muted">Conteúdo clínico disponível somente após consulta autorizada na seção Registros clínicos.</p>}<p className="fine">Finalizado. Edição direta bloqueada; correções exigem retificação.</p></>}
        {professionalView&&canWriteClinical&&item.status==='scheduled'&&<div className="actions"><button type="button" className="button secondary" onClick={()=>{setForm(item);setMessage('');setError('');}}>Editar rascunho</button><button type="button" className="button" onClick={()=>finalize(item.id)}>Finalizar atendimento</button></div>}
      </article>;
    })}</div>{!records.length&&<p className="panel">Nenhum atendimento encontrado para estes filtros.</p>}
  </>;
}
