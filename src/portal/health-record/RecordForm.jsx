import React,{useEffect,useRef,useState} from 'react';
import {recordTypes} from './model';

export default function RecordForm({record,types,onSave,onCancel}) {
  const [form,setForm]=useState(record || {type:types[0],title:'',description:'',eventDate:''});
  const [error,setError]=useState('');
  const titleRef=useRef(null);
  useEffect(()=>{titleRef.current?.focus();},[]);
  const change=event=>{setForm(previous=>({...previous,[event.target.name]:event.target.value}));setError('');};
  const submit=event=>{
    event.preventDefault();
    try {onSave(form);}catch(error){setError(error.message);}
  };
  return <form className="panel form-panel hr-form" onSubmit={submit} aria-label={record?'Editar registro autodeclarado':'Adicionar registro autodeclarado'}>
    <h3>{record?'Editar registro autodeclarado':'Adicionar registro autodeclarado'}</h3>
    <p className="fine">Use somente informações fictícias. Este relato não é um diagnóstico, uma prescrição ou um resultado clínico validado.</p>
    <label>Tipo de informação<select name="type" value={form.type} onChange={change}>{types.map(type=><option key={type} value={type}>{recordTypes[type]}</option>)}</select></label>
    <label>Título do registro<input ref={titleRef} name="title" required maxLength={120} value={form.title} onChange={change}/></label>
    <label>Data do evento{form.type==='personal'?' (opcional)':''}<input name="eventDate" type="date" required={form.type!=='personal'} value={form.eventDate} onChange={change}/></label>
    <label>Descrição demonstrativa<textarea name="description" maxLength={2000} value={form.description} onChange={change}/></label>
    {error&&<p role="alert">{error}</p>}
    <div className="actions"><button className="button" type="submit">Salvar registro</button><button className="button secondary" type="button" onClick={onCancel}>Cancelar</button></div>
  </form>;
}
