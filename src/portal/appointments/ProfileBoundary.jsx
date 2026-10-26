import React from 'react';
import {Link,useLocation} from 'react-router-dom';
import {usePortal} from '../PortalContext';
import ProfileSelector from './ProfileSelector';

// Demo presentation boundary only; real routes and APIs require server authorization.
export default function ProfileBoundary({children}){
  const {session}=usePortal();
  const {pathname}=useLocation();
  if(session.role!=='professional'||['/app/atendimentos','/app/prontuario'].includes(pathname.replace(/\/$/,'')))return children;
  return <><ProfileSelector/><section className="panel"><h1>Visão profissional demonstrativa</h1><p>Consulte apenas cidadãos vinculados e autorizações simuladas nos módulos de atendimento e prontuário. Para utilizar os recursos pessoais, retorne ao perfil Cidadão.</p><Link className="button" to="/app/atendimentos">Abrir atendimentos</Link></section></>;
}
