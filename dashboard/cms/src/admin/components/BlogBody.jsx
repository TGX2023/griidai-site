import React from 'react';
import {useField} from '@strapi/strapi/admin';
import {RichPart} from './ContentParts';
export default function BlogBody({name,label,disabled}){
 const {value,onChange,error}=useField(name);
 return <div className="griidai-parts-field griidai-blog-body"><div className="griidai-parts-label"><strong>{label||'Article content'}</strong><p>Write the full article here. Use headings, paragraphs, lists and links; the website keeps the GriidAi design.</p></div><div className="griidai-part-card"><RichPart part={{content:value}} index={0} disabled={disabled} onChange={({content})=>onChange(name,content)}/></div>{error&&<p role="alert">{error}</p>}</div>;
}
