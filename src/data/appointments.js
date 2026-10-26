// All identities, councils, registration numbers and units are fictional.
export const professionalsMock = [
  {id:'prof-1',name:'Dra. Clara Exemplo',category:'Medicina (fictícia)',specialty:'Medicina de família',council:'Conselho DEMO',registration:'FICTÍCIO-001',unit:'Unidade de Saúde Modelo'},
  {id:'prof-2',name:'Rafael Demonstração',category:'Enfermagem (fictícia)',specialty:'Enfermagem',council:'Conselho DEMO',registration:'FICTÍCIO-002',unit:'Centro de Cuidado Exemplo'},
  {id:'prof-3',name:'Alex Profissional de Exemplo',category:'Equipe de saúde (fictícia)',specialty:'Acompanhamento demonstrativo',council:'Conselho DEMO',registration:'FICTÍCIO-003',unit:'Unidade Fictícia Sul'},
];
export const otherCitizensMock = [
  {id:'cid-demo-2',name:'Cidadão Vinculado de Exemplo',birthDate:'1985-03-12',city:'Cidade Exemplo',state:'UF',identifier:'DEMO-002',email:'exemplo2@example.invalid',unit:'Unidade de Saúde Modelo'},
  {id:'cid-demo-3',name:'Cidadão Sem Vínculo de Exemplo',birthDate:'1980-01-10',city:'Cidade Exemplo',state:'UF',identifier:'DEMO-003',email:'exemplo3@example.invalid',unit:'Unidade Fictícia Sul'},
];
export const professionalLinksMock = [
  {id:'link-1',citizenId:'cid-demo',professionalId:'prof-1',status:'active'},
  {id:'link-2',citizenId:'cid-demo',professionalId:'prof-2',status:'active'},
  {id:'link-3',citizenId:'cid-demo',professionalId:'prof-3',status:'inactive'},
  {id:'link-4',citizenId:'cid-demo-2',professionalId:'prof-1',status:'active'},
];
export const appointmentsMock = [
  {id:'appt-1',citizenId:'cid-demo',professionalId:'prof-1',unit:'Unidade de Saúde Modelo',specialty:'Medicina de família',date:'2026-11-05',time:'09:00',status:'scheduled',type:'Consulta de acompanhamento',recordId:'hr-consultation-1',draft:{summary:'',evolution:'',instructions:''}},
  {id:'appt-2',citizenId:'cid-demo',professionalId:'prof-2',unit:'Centro de Cuidado Exemplo',specialty:'Enfermagem',date:'2026-10-15',time:'14:30',status:'completed',type:'Atendimento de rotina',recordId:'hr-consultation-2',draft:null,finalizedAt:'2026-10-16T12:00:00Z'},
  {id:'appt-3',citizenId:'cid-demo',professionalId:'prof-1',unit:'Unidade de Saúde Modelo',specialty:'Medicina de família',date:'2026-10-21',time:'10:00',status:'cancelled',type:'Consulta cancelada de exemplo',recordId:null,draft:null},
  {id:'appt-4',citizenId:'cid-demo-2',professionalId:'prof-1',unit:'Unidade de Saúde Modelo',specialty:'Medicina de família',date:'2026-11-06',time:'11:00',status:'scheduled',type:'Consulta fictícia vinculada',recordId:null,draft:{summary:'',evolution:'',instructions:''}},
];
export const authorizationsMock = [
  {id:'auth-1',citizenId:'cid-demo',professionalId:'prof-1',status:'granted',purpose:'Acompanhamento fictício do cuidado',scopes:['read','write'],requestedAt:'2026-10-01T10:00:00Z',updatedAt:'2026-10-01T11:00:00Z'},
  {id:'auth-2',citizenId:'cid-demo',professionalId:'prof-2',status:'requested',purpose:'Revisão demonstrativa do histórico',scopes:['read'],requestedAt:'2026-10-20T10:00:00Z',updatedAt:'2026-10-20T10:00:00Z'},
  {id:'auth-3',citizenId:'cid-demo-2',professionalId:'prof-1',status:'granted',purpose:'Consulta ilustrativa do histórico',scopes:['read'],requestedAt:'2026-10-01T10:00:00Z',updatedAt:'2026-10-01T11:00:00Z'},
];
export const accessEventsMock = [
  {id:'audit-demo-1',at:'2026-10-01T11:00:00Z',actorId:'cid-demo',actorRole:'citizen',action:'authorization_granted',citizenId:'cid-demo',professionalId:'prof-1',authorizationId:'auth-1',details:'Autorização demonstrativa inicial: consulta e registro.'},
];
