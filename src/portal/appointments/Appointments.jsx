import React from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {ShieldCheck} from 'lucide-react';
import Heading from '../../components/Heading';
import {usePortal} from '../PortalContext';
import {appointmentSections} from './model';
import ProfileSelector from './ProfileSelector';
import AppointmentList from './AppointmentList';
import Professionals from './Professionals';
import ClinicalRecords from './ClinicalRecords';
import Authorizations from './Authorizations';

export default function Appointments(){
  const {session,currentCitizen}=usePortal();
  const [params]=useSearchParams();
  const section=appointmentSections.find(section=>section.id===params.get('secao'))||appointmentSections[0];
  const Section={atendimentos:AppointmentList,profissionais:Professionals,registros:ClinicalRecords,autorizacoes:Authorizations}[section.id];
  return <>
    <Heading eyebrow="PORTAL DO CIDADÃO · DEMONSTRAÇÃO" title="Atendimentos" description="Acompanhe atendimentos, profissionais e autorizações simuladas."/>
    <div className="portal-demo-notice"><ShieldCheck size={20}/><div><strong>Dados demonstrativos</strong><p>Pessoas, conselhos, unidades e informações clínicas são fictícios. Não há prescrição real ou integração com serviços de saúde. Informações clínicas não concedem nem suspendem benefícios financeiros.</p></div></div>
    <ProfileSelector/>
    <nav className="hr-navigation" aria-label="Seções de atendimentos">{appointmentSections.map(item=><Link key={item.id} to={`?secao=${item.id}`} aria-current={section.id===item.id?'page':undefined}>{item.label}</Link>)}</nav>
    {currentCitizen?<div key={`${session.role}:${session.userId}:${currentCitizen.id}:${section.id}`}><p className="muted">Cidadão fictício: {currentCitizen.name} · {currentCitizen.id}</p><Section/></div>:<section className="panel"><h2 className="appointment-heading">Nenhum cidadão vinculado</h2><p>Este profissional fictício não possui vínculos ativos. Nenhum prontuário ou atendimento é exibido.</p></section>}
  </>;
}
