import React,{useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {formatDate} from '../model';
import {canEditRecord,recordTypes,recordSections} from './model';

export default function RecordCard({record,actor,onEdit,onDelete,timeline=false,linkBase=''}) {
  const [confirm,setConfirm]=useState(false);
  const [error,setError]=useState('');
  const deleteRef=useRef(null);
  const editable=canEditRecord(record,actor)&&!timeline;
  const section=recordSections.find(section=>section.id!=='linha-do-tempo'&&section.types.includes(record.type));
  return <article id={`clinical-${record.id}`} className={`panel hr-record hr-${record.origin}`} data-record-id={record.id} data-origin={record.origin} data-event-date={record.eventDate||record.registeredAt} aria-label={record.title}>
    <div className="row"><span className={`tag hr-origin-${record.origin}`}>{record.origin==='citizen'?'Autodeclarado · cidadão':'Profissional · somente leitura'}</span><small>{recordTypes[record.type]}</small></div>
    <h3>{record.title}</h3><p className="hr-description">{record.description||'Sem descrição adicional.'}</p>
    {record.locked&&<p className="fine">Registro finalizado · edição direta bloqueada.</p>}
    {record.originalRecordId&&<p className="fine">Retificação vinculada ao original: <a href={`#clinical-${record.originalRecordId}`}>{record.originalRecordId}</a>. O original permanece preservado.</p>}
    <dl className="hr-metadata">
      <div><dt>ID</dt><dd>{record.id}</dd></div><div><dt>Data do registro</dt><dd>{formatDate(record.registeredAt)}</dd></div>
      <div><dt>Data do evento</dt><dd>{record.eventDate?formatDate(record.eventDate):'Não se aplica'}</dd></div>
      <div><dt>Autor fictício</dt><dd>{record.author}</dd></div>
    </dl>
    {editable&&<div className="actions"><button type="button" className="button secondary" onClick={()=>onEdit(record)} aria-label={`Editar ${record.title}`}>Editar</button><button ref={deleteRef} type="button" className="danger-button" onClick={()=>setConfirm(true)} aria-label={`Excluir ${record.title}`}>Excluir</button></div>}
    {confirm&&<div className="delete-confirm" role="group" aria-label="Confirmar exclusão do registro"><p>Excluir este registro autodeclarado da sessão demonstrativa?</p><div className="actions"><button autoFocus type="button" className="button secondary" onClick={()=>{setConfirm(false);deleteRef.current?.focus();}}>Cancelar exclusão</button><button type="button" className="danger-button" onClick={()=>{try{onDelete(record.id);}catch(error){setError(error.message);}}}>Confirmar exclusão</button></div>{error&&<p role="alert">{error}</p>}</div>}
    {timeline&&section&&<Link className="text-button hr-section-link" to={`${linkBase}?secao=${section.id}`}>Ver em {section.label}</Link>}
  </article>;
}
