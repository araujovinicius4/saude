import React from 'react';
import {usePortal} from '../PortalContext';
import {linkedCitizens} from './model';

export default function ProfileSelector(){
  const {data,session,currentCitizen,switchDemoProfile,selectCitizen}=usePortal();
  return <section className="panel demo-profile" aria-label="Simulação de perfil">
    <div className="appointment-filters">
      <label>Perfil demonstrativo<select value={session.role} onChange={event=>switchDemoProfile(event.target.value)}><option value="citizen">Cidadão</option><option value="professional">Profissional de saúde</option></select></label>
      {session.role==='professional'&&<><label>Profissional fictício<select value={session.userId} onChange={event=>switchDemoProfile('professional',event.target.value)}>{data.professionals.map(professional=><option key={professional.id} value={professional.id}>{professional.name}</option>)}</select></label>
      <label>Cidadão vinculado<select value={currentCitizen?.id||''} onChange={event=>selectCitizen(event.target.value)}>{!currentCitizen&&<option value="">Nenhum cidadão vinculado</option>}{linkedCitizens(data,session.userId).map(citizen=><option key={citizen.id} value={citizen.id}>{citizen.name}</option>)}</select></label></>}
    </div><p className="fine">Seletor exclusivamente demonstrativo. Não autentica pessoas nem oferece segurança real. Alterações e eventos ficam somente em memória.</p>
  </section>;
}
