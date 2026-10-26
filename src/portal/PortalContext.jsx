import React, {createContext, useContext, useState} from 'react';
import {demoPortalRepository} from './repository';
import {visibleDemoModules} from './model';
import {linkedCitizens,hasClinicalAccess,recordsFor} from './appointments/model';

const PortalContext = createContext(null);
export function PortalProvider({children, repository = demoPortalRepository}) {
  const [data,setData] = useState(() => repository.getSnapshot());
  const [session,setSession] = useState(() => repository.getSession());
  const [viewed,setViewed] = useState('');
  const currentCitizen=session.role==='professional'?data.citizens.find(citizen=>citizen.id===session.citizenId):data.citizen;
  const activeProfessional=data.professionals.find(professional=>professional.id===session.userId);
  // Mutations are session-only. A future API must enforce ownership on the server.
  const actor={...session,name:session.role==='professional'?activeProfessional?.name:data.citizen.name};
  const saveHealthRecord=draft=>{
    const records=repository.saveHealthRecord(data.healthRecord.records,draft,actor);
    setData(previous=>({...previous,healthRecord:{...previous.healthRecord,records},accessEvents:[...previous.accessEvents,{id:crypto.randomUUID(),at:new Date().toISOString(),actorId:actor.userId,actorRole:actor.role,action:'personal_record_saved',citizenId:actor.userId,recordId:draft.id||records.at(-1).id}]}));
  };
  const deleteHealthRecord=id=>{
    const records=repository.deleteHealthRecord(data.healthRecord.records,id,actor);
    setData(previous=>({...previous,healthRecord:{...previous.healthRecord,records},accessEvents:[...previous.accessEvents,{id:crypto.randomUUID(),at:new Date().toISOString(),actorId:actor.userId,actorRole:actor.role,action:'personal_record_deleted',citizenId:actor.userId,recordId:id}]}));
  };
  const switchDemoProfile=(role,professionalId='prof-1')=>{
    if(!['citizen','professional'].includes(role))return;
    if(role==='professional'&&!data.professionals.some(professional=>professional.id===professionalId))return;
    const next=role==='citizen'?repository.getSession():{mode:'demo',authenticated:false,role,userId:professionalId,citizenId:linkedCitizens(data,professionalId)[0]?.id||''};
    setSession(next);setViewed('');
    setData(previous=>({...previous,accessEvents:[...previous.accessEvents,{id:crypto.randomUUID(),at:new Date().toISOString(),actorId:next.userId,actorRole:next.role,action:'profile_changed',citizenId:next.citizenId||data.citizen.id,details:'Troca exclusivamente demonstrativa, sem autenticação.'}]}));
  };
  const selectCitizen=id=>{
    if(session.role!=='professional'||!linkedCitizens(data,session.userId).some(citizen=>citizen.id===id))return;
    setSession(previous=>({...previous,citizenId:id}));setViewed('');
    setData(previous=>({...previous,accessEvents:[...previous.accessEvents,{id:crypto.randomUUID(),at:new Date().toISOString(),actorId:session.userId,actorRole:session.role,action:'citizen_selected',citizenId:id,professionalId:session.userId}]}));
  };
  const clinicalKey=`${session.userId}:${currentCitizen?.id}`;
  const canReadClinical=!!currentCitizen&&hasClinicalAccess(data,actor,currentCitizen.id);
  const canWriteClinical=!!currentCitizen&&hasClinicalAccess(data,actor,currentCitizen.id,'write');
  const clinicalRecords=(session.role==='citizen'||viewed===clinicalKey)&&currentCitizen?recordsFor(data,actor,currentCitizen.id):[];
  const changeAppointments=action=>{
    const next=repository.changeAppointments(data,action,actor);
    setData(next);
    if(['grant','revoke','request'].includes(action.type))setViewed('');
  };
  const openClinicalRecord=()=>{
    if(!currentCitizen)return false;
    const next=repository.changeAppointments(data,{type:'view',citizenId:currentCitizen.id},actor);
    setData(next);setViewed(canReadClinical?clinicalKey:'');
    return canReadClinical;
  };
  return <PortalContext.Provider value={{data,session,saveHealthRecord,deleteHealthRecord,modules:visibleDemoModules(session.role),currentCitizen,activeProfessional,switchDemoProfile,selectCitizen,canReadClinical,canWriteClinical,clinicalRecords,clinicalViewed:session.role==='citizen'||(viewed===clinicalKey&&canReadClinical),changeAppointments,openClinicalRecord}}>{children}</PortalContext.Provider>;
}
export function usePortal() { return useContext(PortalContext); }
