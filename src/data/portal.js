import {healthRecordMock} from './healthRecord.js';
import {professionalsMock,otherCitizensMock,professionalLinksMock,appointmentsMock,authorizationsMock,accessEventsMock} from './appointments.js';
// Entirely fictional fixtures. No patient, banking or payment service is connected.
export const portalMock = {
  citizen:{id:'cid-demo',name:'Pessoa Cidadã de Exemplo',birthDate:'1990-05-15',city:'Cidade Exemplo',state:'UF',email:'cidadao@example.invalid',phone:'Não informado na demonstração',identifier:'DEMO-001',unit:'Unidade de Saúde Modelo',profile:'Cidadão'},
  healthRecord:{records:healthRecordMock},
  professionals:professionalsMock,
  appointments:appointmentsMock,
  professionalLinks:professionalLinksMock,
  authorizations:authorizationsMock,
  accessEvents:accessEventsMock,
  benefits:{name:'Bolsa Saúde Cidadão · exemplo',status:'Demonstrativo',openingBalanceCents:0,transactions:[
    {id:'tx-3',date:'2026-10-20',type:'payment',description:'Pagamento de exemplo B',amountCents:4500,status:'Simulado'},
    {id:'tx-2',date:'2026-10-10',type:'payment',description:'Pagamento de exemplo A',amountCents:7500,status:'Simulado'},
    {id:'tx-1',date:'2026-10-01',type:'credit',description:'Crédito demonstrativo do programa',amountCents:30000,status:'Simulado'},
  ]},
};
portalMock.citizens=[portalMock.citizen,...otherCitizensMock];

export const demoSession = {mode:'demo',authenticated:false,userId:'cid-demo',role:'citizen'};
