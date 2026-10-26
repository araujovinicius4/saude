import React,{useState} from 'react';
import {usePortal} from '../PortalContext';

function RegistrationForm({onSave,onCancel}){
  const [draft,setDraft]=useState({name:'',category:'',specialty:'',council:'Conselho DEMO',registration:'FICTÍCIO-',unit:'',linkStatus:'active'});
  const [error,setError]=useState('');
  return <form className="panel form-panel appointment-form" aria-label="Cadastro de profissional fictício" onSubmit={event=>{event.preventDefault();try{onSave(draft);}catch(error){setError(error.message);}}}>
    <h3>Cadastrar profissional fictício</h3><p className="fine">Use somente identidades, conselhos e unidades inventados. O cadastro não valida habilitação nem concede acesso ao prontuário.</p>
    {[['name','Nome fictício',120],['category','Categoria profissional',100],['specialty','Especialidade',100],['council','Conselho fictício',100],['registration','Número de registro fictício',100],['unit','Unidade de atuação fictícia',120]].map(([name,label,max])=><label key={name}>{label}<input autoFocus={name==='name'} name={name} required maxLength={max} value={draft[name]} onChange={event=>setDraft(previous=>({...previous,[name]:event.target.value}))}/></label>)}
    <label>Situação do vínculo<select value={draft.linkStatus} onChange={event=>setDraft(previous=>({...previous,linkStatus:event.target.value}))}><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label>
    {error&&<p role="alert">{error}</p>}<div className="actions"><button className="button" type="submit">Salvar profissional fictício</button><button className="button secondary" type="button" onClick={onCancel}>Cancelar cadastro</button></div>
  </form>;
}

export default function Professionals(){
  const {data,session,currentCitizen,changeAppointments}=usePortal();
  const [adding,setAdding]=useState(false);const [message,setMessage]=useState('');
  const links=data.professionalLinks.filter(link=>link.citizenId===currentCitizen.id&&(session.role!=='professional'||link.professionalId===session.userId));
  return <><div className="row hr-section-heading"><h2 className="appointment-heading">Profissionais vinculados</h2>{session.role==='citizen'&&<button className="button" type="button" onClick={()=>setAdding(true)}>Cadastrar profissional fictício</button>}</div><p className="muted">Cadastro demonstrativo. Conselhos, registros, nomes e unidades são fictícios. Vínculo não equivale a autorização para consultar o prontuário.</p><p className="success hr-status" role="status">{message}</p>
    {adding&&<RegistrationForm onCancel={()=>setAdding(false)} onSave={draft=>{changeAppointments({type:'registerProfessional',citizenId:currentCitizen.id,draft});setAdding(false);setMessage('Profissional fictício cadastrado em memória, sem autorização automática.');}}/>}
    <div className="hr-records">{links.map(link=>{
    const professional=data.professionals.find(item=>item.id===link.professionalId);
    return <article className="panel" key={link.id} aria-label={professional.name}><h3>{professional.name}</h3><span className="tag">Vínculo {link.status==='active'?'ativo':'inativo'}</span><dl className="hr-metadata">{[['Identificador',professional.id],['Categoria',professional.category],['Especialidade',professional.specialty],['Conselho fictício',professional.council],['Registro fictício',professional.registration],['Unidade de atuação',professional.unit]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></article>;
  })}</div></>;
}
