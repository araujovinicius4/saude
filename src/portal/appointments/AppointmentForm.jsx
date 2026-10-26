import React,{useEffect,useRef,useState} from 'react';
import {localDate} from '../../model';

export default function AppointmentForm({appointment,onSave,onCancel}){
  const [form,setForm]=useState(appointment?{...appointment,...appointment.draft}:{type:'Atendimento fictício',date:localDate(),time:'09:00',summary:'',evolution:'',instructions:''});
  const [error,setError]=useState('');
  const titleRef=useRef(null);
  useEffect(()=>{titleRef.current?.focus();},[]);
  const change=event=>{setForm(previous=>({...previous,[event.target.name]:event.target.value}));setError('');};
  return <form className="panel form-panel appointment-form" aria-label="Registro de atendimento demonstrativo" onSubmit={event=>{event.preventDefault();try{onSave(form);}catch(error){setError(error.message);}}}>
    <h3>{appointment?'Editar rascunho':'Novo atendimento demonstrativo'}</h3>
    <p className="fine">Somente conteúdo fictício. A finalização bloqueia a edição direta; correções posteriores geram retificação. Este formulário não emite prescrição médica.</p>
    <label>Título do atendimento<input ref={titleRef} name="type" required maxLength={120} value={form.type} onChange={change}/></label>
    <div className="appointment-filters"><label>Data do atendimento<input type="date" name="date" required value={form.date} onChange={change}/></label><label>Horário<input type="time" name="time" required value={form.time} onChange={change}/></label></div>
    {[['summary','Resumo fictício'],['evolution','Evolução fictícia'],['instructions','Orientações fictícias']].map(([name,label])=><label key={name}>{label}<textarea name={name} maxLength={2000} value={form[name]} onChange={change}/></label>)}
    {error&&<p role="alert">{error}</p>}<div className="actions"><button className="button" type="submit">Salvar rascunho</button><button className="button secondary" type="button" onClick={onCancel}>Cancelar edição</button></div>
  </form>;
}
