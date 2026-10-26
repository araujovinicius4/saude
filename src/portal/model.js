export const portalModules = [
  {id:'overview',path:'',label:'Visão Geral'},
  {id:'prevention',path:'prevencao',label:'Prevenção'},
  {id:'healthRecord',path:'prontuario',label:'Prontuário'},
  {id:'appointments',path:'atendimentos',label:'Atendimentos'},
  {id:'benefits',path:'beneficios',label:'Meus Benefícios'},
  {id:'profile',path:'perfil',label:'Meu Perfil'},
];

// Presentation policy only. A future backend must authenticate and authorize every request.
const demoVisibility = {citizen:portalModules.map(module => module.id),professional:['overview','healthRecord','appointments'],administrator:portalModules.map(module => module.id)};
export function visibleDemoModules(role) {
  return portalModules.filter(module => (demoVisibility[role] || []).includes(module.id));
}

// Monetary amounts remain integer cents, independent of prevention records or points.
export function benefitSummary(benefit) {
  const credits = benefit.transactions.filter(t => t.type === 'credit').reduce((sum,t) => sum + t.amountCents,0);
  const payments = benefit.transactions.filter(t => t.type === 'payment').reduce((sum,t) => sum + t.amountCents,0);
  return {credits,payments,balance:benefit.openingBalanceCents + credits - payments};
}
export const formatMoney = cents => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents / 100);
export const formatDate = date => new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR');
