import React,{useState} from 'react';
import {usePortal} from '../PortalContext';
import {accessScopes,auditLabels} from './model';

function AuthorizationCard({professional,link,authorization,professionalView,onAction}){
  const [purpose,setPurpose]=useState(authorization?.purpose||'');
  const [scope,setScope]=useState(authorization?.scopes.includes('write')?'read-write':'read');
  const status=authorization?.status||'none';
  const labels={none:'Sem autorização',requested:'Solicitação pendente',granted:'Autorização concedida',revoked:'Autorização revogada'};
  const mayRequest=professionalView&&link.status==='active'&&['none','revoked'].includes(status);
  return <article className="panel" aria-label={`Autorização de ${professional.name}`}>
    <h3>{professional.name}</h3><span className="tag">{labels[status]}</span>
    <p className="muted">Vínculo {link.status==='active'?'ativo':'inativo'}</p>
    {authorization&&<dl className="hr-metadata"><div><dt>ID da autorização</dt><dd>{authorization.id}</dd></div><div><dt>Finalidade registrada</dt><dd>{authorization.purpose}</dd></div><div><dt>Escopo registrado</dt><dd>{authorization.scopes.map(scope=>accessScopes[scope]).join(' · ')}</dd></div><div><dt>Atualização</dt><dd>{new Date(authorization.updatedAt).toLocaleString('pt-BR')}</dd></div></dl>}
    {link.status==='active'&&(!professionalView||mayRequest)&&<form className="authorization-form" aria-label={`Configurar acesso de ${professional.name}`} onSubmit={event=>{event.preventDefault();onAction({type:professionalView?'request':'grant',professionalId:professional.id,purpose,scopes:scope==='read-write'?['read','write']:['read']});}}>
      <label>Finalidade da autorização<input required maxLength={300} value={purpose} onChange={event=>setPurpose(event.target.value)}/></label>
      <label>Escopo da autorização<select value={scope} onChange={event=>setScope(event.target.value)}><option value="read">Consultar prontuário</option><option value="read-write">Consultar e registrar atendimentos</option></select></label>
      <button type="submit" className="button">{professionalView?'Solicitar acesso':status==='granted'?'Atualizar autorização':'Conceder autorização'}</button>
    </form>}
    {!professionalView&&status==='granted'&&<button type="button" className="danger-button" onClick={()=>onAction({type:'revoke',professionalId:professional.id})}>Revogar autorização</button>}
    {professionalView&&status==='requested'&&<p className="fine">Aguarde a concessão pelo cidadão na simulação.</p>}
  </article>;
}

export default function Authorizations(){
  const {data,session,currentCitizen,changeAppointments}=usePortal();
  const [message,setMessage]=useState('');const [error,setError]=useState('');
  const professionalView=session.role==='professional';
  const links=data.professionalLinks.filter(link=>link.citizenId===currentCitizen.id&&(!professionalView||link.professionalId===session.userId));
  const events=data.accessEvents.filter(event=>event.citizenId===currentCitizen.id&&(!professionalView||event.professionalId===session.userId||event.actorId===session.userId));
  const action=action=>{try{changeAppointments({...action,citizenId:currentCitizen.id});setMessage({grant:'Autorização simulada concedida.',revoke:'Autorização revogada. Novos acessos simulados foram bloqueados.',request:'Solicitação de acesso registrada.'}[action.type]);setError('');}catch(error){setError(error.message);}};
  return <>
    <h2 className="appointment-heading">Autorizações de acesso</h2><p className="muted">A concessão é feita pelo cidadão. Revogar impede novas consultas e registros simulados, preservando o histórico clínico. Estes controles não substituem autenticação ou autorização de backend.</p>
    <p role="status" className="success hr-status">{message}</p>{error&&<p role="alert">{error}</p>}
    <div className="hr-records">{links.map(link=>{
      const professional=data.professionals.find(item=>item.id===link.professionalId);
      const authorization=data.authorizations.find(item=>item.professionalId===link.professionalId&&item.citizenId===currentCitizen.id);
      return <AuthorizationCard key={`${link.id}:${authorization?.updatedAt||''}`} link={link} professional={professional} authorization={authorization} professionalView={professionalView} onAction={action}/>;
    })}</div>
    <section className="panel portal-section appointment-audit"><h3>Eventos de acesso e alterações</h3><p className="fine">Auditoria demonstrativa em memória, descartada ao recarregar. Cada consulta e mudança realizada pelo módulo registra um evento.</p>
      {!events.length?<p>Nenhum evento nesta sessão.</p>:<ol className="portal-list" aria-label="Eventos simulados">{[...events].reverse().map(event=><li key={event.id}><strong>{auditLabels[event.action]||event.action}</strong><p>{new Date(event.at).toLocaleString('pt-BR')} · {event.actorRole==='citizen'?'Cidadão':'Profissional'} · {event.actorId}</p><small>{event.details||event.recordId||event.appointmentId||'Evento demonstrativo'} · ID {event.id}</small></li>)}</ol>}
    </section>
  </>;
}
