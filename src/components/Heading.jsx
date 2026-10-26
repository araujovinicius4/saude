import React from 'react';
export default function Heading({eyebrow='SEU CUIDADO NO DIA A DIA',title,description,action}) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
