import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight, ShieldCheck} from 'lucide-react';
import Heading from '../components/Heading';
import {usePortal} from './PortalContext';
import {benefitSummary, formatDate, formatMoney} from './model';

function DemoNotice({children}) {
  return <div className="portal-demo-notice"><ShieldCheck size={20}/><div><strong>Dados demonstrativos</strong><p>{children || 'Pessoas, informações de saúde e serviços são fictícios. Nenhuma integração com serviços de saúde está ativa.'}</p></div></div>;
}
function ModulePage({title,description,children}) {
  return <><Heading eyebrow="PORTAL DO CIDADÃO · DEMONSTRAÇÃO" title={title} description={description}/><DemoNotice/>{children}</>;
}
function RecordList({title,items,render}) {
  return <section className="panel portal-section"><h2>{title}</h2><ul className="portal-list">{items.map(item => <li key={item.id}>{render(item)}</li>)}</ul></section>;
}

export function Prevention({children}) {
  return <><Heading title="Prevenção" description="Seus registros, metas e cuidados diários reunidos em um só lugar." action={<Link className="button" to="/app/check-in">Registrar meu dia <ArrowUpRight size={18}/></Link>}/>
    <div className="portal-shortcuts">{[['sono','Sono'],['alimentacao','Alimentação'],['atividade','Atividade física'],['metas','Minhas metas'],['evolucao','Evolução e registros'],['pontos','Pontos e conquistas'],['compartilhamento','Compartilhamento']].map(([path,label]) => <Link className="button secondary" to={`/app/${path}`} key={path}>{label}<ArrowUpRight size={16}/></Link>)}</div>
    <p className="fine">Os pontos reconhecem registros e metas pessoais; não concedem nem suspendem benefícios.</p>{children}</>;
}

export {default as HealthRecord} from './health-record/HealthRecord';

export {default as Appointments} from './appointments/Appointments';

export function Benefits() {
  const {data:{benefits}} = usePortal();
  const summary = benefitSummary(benefits);
  return <><Heading eyebrow="PORTAL DO CIDADÃO · DEMONSTRAÇÃO" title="Meus Benefícios" description="Saldo e movimentações de exemplo do Bolsa Saúde Cidadão."/>
    <DemoNotice>Valores e movimentações simulados. Sem integração bancária, transferência ou pagamento real. Hábitos, metas e pontos de saúde não determinam a concessão ou suspensão de benefícios.</DemoNotice>
    <div className="portal-metrics">{[['Saldo demonstrativo',summary.balance],['Créditos simulados',summary.credits],['Pagamentos simulados',summary.payments]].map(([label,value]) => <section className="panel" key={label}><h2>{label}</h2><strong>{formatMoney(value)}</strong><small>Valor fictício</small></section>)}</div>
    <section className="panel portal-section"><h2>Extrato demonstrativo</h2><p>{benefits.name} · {benefits.status}</p><div className="table-scroll"><table><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th><th>Status</th></tr></thead><tbody>{benefits.transactions.map(item => <tr key={item.id}><td>{formatDate(item.date)}</td><td>{item.description}</td><td>{item.type === 'credit' ? 'Crédito' : 'Pagamento'}</td><td>{item.type === 'credit' ? '+' : '−'} {formatMoney(item.amountCents)}</td><td>{item.status}</td></tr>)}</tbody></table></div></section>
  </>;
}

export function CitizenProfile() {
  const {data:{citizen},session} = usePortal();
  return <ModulePage title="Meu Perfil" description="Perfil fictício do cidadão para apresentação do portal.">
    <section className="panel portal-section"><h2>Dados do cidadão de exemplo</h2><dl className="portal-profile">{[['Nome',citizen.name],['Identificador demonstrativo',citizen.identifier],['Nascimento fictício',formatDate(citizen.birthDate)],['Município',`${citizen.city} / ${citizen.state}`],['E-mail de exemplo',citizen.email],['Telefone',citizen.phone],['Unidade de referência',citizen.unit],['Perfil demonstrativo',citizen.profile]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
    <section className="panel portal-section"><h2>Sessão demonstrativa</h2><p>Modo: {session.mode === 'demo' ? 'Demonstração sem login' : session.mode}. Nenhuma identidade foi autenticada.</p><p>Perfis e permissões do frontend organizam a apresentação. Não são mecanismos reais de segurança; a futura API deverá validar identidade e acesso.</p><Link className="button secondary" to="/app/compartilhamento">Gerenciar compartilhamento e dados locais</Link></section>
  </ModulePage>;
}
