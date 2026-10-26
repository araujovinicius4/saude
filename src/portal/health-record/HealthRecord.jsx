import React,{useRef,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {ShieldCheck} from 'lucide-react';
import Heading from '../../components/Heading';
import {usePortal} from '../PortalContext';
import {formatDate} from '../model';
import {recordSections,timelineRecords} from './model';
import RecordForm from './RecordForm';
import RecordCard from './RecordCard';
import ProfileSelector from '../appointments/ProfileSelector';

function CitizenData({citizen}) {
  return <section className="panel portal-section"><h3>Dados do cidadão de exemplo</h3><dl className="portal-profile">{[['Nome fictício',citizen.name],['Identificador demonstrativo',citizen.identifier],['Nascimento fictício',formatDate(citizen.birthDate)],['Município',`${citizen.city} / ${citizen.state}`],['Contato de exemplo',citizen.email],['Unidade de referência',citizen.unit]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="fine">Cadastro fictício de referência. Registre informações pessoais adicionais como autodeclaradas abaixo.</p></section>;
}

function RecordSection({section}) {
  const {currentCitizen,clinicalRecords,session,saveHealthRecord,deleteHealthRecord}=usePortal();
  const [editing,setEditing]=useState(null);
  const [adding,setAdding]=useState(false);
  const [message,setMessage]=useState('');
  const addRef=useRef(null);
  const timeline=section.id==='linha-do-tempo';
  const actor={...session,name:currentCitizen.name};
  const records=timeline?timelineRecords(clinicalRecords):clinicalRecords.filter(record=>section.types.includes(record.type));
  const closeForm=()=>{setAdding(false);setEditing(null);addRef.current?.focus();};
  const save=draft=>{saveHealthRecord(draft);setMessage(editing?'Registro autodeclarado atualizado.':'Registro autodeclarado adicionado.');closeForm();};
  const remove=id=>{deleteHealthRecord(id);if(editing?.id===id)closeForm();setMessage('Registro autodeclarado excluído.');addRef.current?.focus();};
  return <section aria-labelledby={`hr-section-${section.id}`}>
    <div className="row hr-section-heading"><h2 id={`hr-section-${section.id}`}>{section.label}</h2>{!timeline&&session.role==='citizen'&&<button ref={addRef} className="button" type="button" onClick={()=>{setEditing(null);setAdding(true);setMessage('');}}>Adicionar registro pessoal</button>}</div>
    {timeline&&<p className="muted">Ordem cronológica, do evento mais recente ao mais antigo. Sem data de evento, utiliza-se a data do registro. Eventos futuros são exemplos de agendamento.</p>}
    <p className="success hr-status" role="status">{message}</p>
    {section.id==='pessoais'&&<CitizenData citizen={currentCitizen}/>}
    {(adding||editing)&&session.role==='citizen'&&<RecordForm key={editing?.id||'new'} record={editing} types={section.types.filter(type=>!['history','rectification'].includes(type))} onSave={save} onCancel={closeForm}/>}
    {!records.length?<p className="panel">Nenhum registro demonstrativo nesta seção.</p>:<div className={timeline?'hr-timeline':'hr-records'}>{records.map(record=><RecordCard key={record.id} record={record} actor={actor} timeline={timeline} onEdit={record=>{setEditing(record);setAdding(false);setMessage('');}} onDelete={remove}/>)}</div>}
  </section>;
}

export default function HealthRecord() {
  const {session,currentCitizen,clinicalViewed,canReadClinical,openClinicalRecord}=usePortal();
  const [denied,setDenied]=useState(false);
  const [params]=useSearchParams();
  const section=recordSections.find(section=>section.id===params.get('secao'))||recordSections[0];
  return <>
    <Heading eyebrow="PORTAL DO CIDADÃO · DEMONSTRAÇÃO" title="Prontuário" description="Seu histórico demonstrativo, organizado por informação e origem."/>
    <div className="portal-demo-notice"><ShieldCheck size={20}/><div><strong>Dados demonstrativos</strong><p>Use apenas informações fictícias. Alterações ficam em memória e são descartadas ao recarregar. Registros autodeclarados não são dados clínicos validados. Registros profissionais são somente leitura.</p><p className="fine">Este módulo não realiza diagnóstico, prescrição ou interpretação de exames e não interfere nos benefícios. O controle de acesso é uma simulação; a futura API deverá autenticar e autorizar as operações.</p></div></div>
    <ProfileSelector/>
    <nav className="hr-navigation" aria-label="Seções do prontuário">{recordSections.map(item=><Link key={item.id} to={`?secao=${item.id}`} aria-current={section.id===item.id?'page':undefined}>{item.label}</Link>)}</nav>
    {!currentCitizen?<p className="panel">Nenhum cidadão vinculado para este perfil demonstrativo.</p>:session.role==='professional'&&(!canReadClinical||!clinicalViewed)?<section className="panel"><h2 className="appointment-heading">Consulta autorizada ao prontuário</h2><p>Vínculo e autorização de leitura são necessários. A consulta será registrada em memória.</p><button type="button" className="button" onClick={()=>setDenied(!openClinicalRecord())}>Consultar prontuário autorizado</button>{denied&&<p role="alert">Acesso simulado recusado. Solicite autorização ao cidadão.</p>}</section>:<RecordSection key={`${section.id}:${session.role}:${session.userId}:${currentCitizen.id}`} section={section}/>}
  </>;
}
