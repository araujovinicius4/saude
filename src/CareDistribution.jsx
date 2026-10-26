import React, {useEffect, useState} from 'react';
import {STORAGE_KEY, pillars} from './config';
import {overviewCareDistribution, validState} from './model';

export default function CareDistribution({data}) {
  const [records, setRecords] = useState(data.records);
  useEffect(() => {
    setRecords(data.records);
    const onStorage = event => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try {
        const saved = JSON.parse(event.newValue);
        setRecords(validState(saved) ? saved.records : []);
      } catch { setRecords([]); }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [data]);
  const {total, areas, simulated} = overviewCareDistribution(records);
  const colors = {sono:'#9584ad', alimentacao:'#c49b63', atividade:'#81966a'};
  let offset = 0;
  return <section className="panel care-distribution" aria-labelledby="care-distribution-title">
    <h3 id="care-distribution-title">Distribuição da atenção aos cuidados</h3>
    <p className="muted">Últimos 7 dias · Dias com registros em cada área</p>
    {simulated && <span className="tag">Dados simulados para demonstração</span>}
    {total ? <div className="care-distribution-content">
      <svg className="care-donut" viewBox="0 0 120 120" role="img" aria-label={areas.map(area => `${pillars.find(p => p.id === area.id).name}: ${area.percentage}%`).join('; ')}>
        {areas.map(area => {
          const start = offset;
          const share = area.count / total * 100;
          offset += share;
          return share > 0 && <circle key={area.id} cx="60" cy="60" r="44" fill="none" stroke={colors[area.id]} strokeWidth="22" pathLength="100" strokeDasharray={`${share} ${100-share}`} strokeDashoffset={-start} transform="rotate(-90 60 60)"/>;
        })}
      </svg>
      <ul className="care-legend">{areas.map(area => <li key={area.id}><span className="care-swatch" style={{background:colors[area.id]}} aria-hidden="true"/><span>{pillars.find(p => p.id === area.id).name}<small>{area.count} de 7 dias com registro</small></span><strong>{area.percentage}%</strong></li>)}</ul>
    </div> : <p role="status">Nenhum cuidado registrado neste período</p>}
    <p className="fine">Distribuição dos cuidados registrados. Não representa uma avaliação clínica ou a qualidade da saúde.</p>
  </section>;
}
