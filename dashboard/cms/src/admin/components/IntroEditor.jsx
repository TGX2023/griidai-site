import React from 'react';
import {useField} from '@strapi/strapi/admin';
import {useLocation} from 'react-router-dom';
import {RichPart} from './RichPart';
const plain=node=>{if(!node)return '';if(node.type==='text')return node.text||'';if(node.type==='hardBreak')return ' ';const s=(node.content||[]).map(plain).join('');return ['paragraph','heading','listItem','taskItem','tableCell','tableHeader','tableRow','blockquote'].includes(node.type)?s+' ':s;};
const text=doc=>plain(doc).replace(/\s+/g,' ').trim();
const fromText=value=>({type:'doc',content:[{type:'paragraph',...(value?{content:[{type:'text',text:value}]}:{})}]});
export default function IntroEditor({name,label,disabled}){
 const title=name==='titleFormatting',base=title?'title':'summary',field=useField(name),plainField=useField(base),blog=useLocation().pathname.includes('/api::blog.blog');
 const max=title?(blog?240:160):(blog?1200:1000);
 const content=field.value&&text(field.value)===String(plainField.value||'').replace(/\s+/g,' ').trim()?field.value:fromText(plainField.value||'');
 const change=({content})=>{field.onChange(name,content);plainField.onChange(base,text(content));};
 return <div className="griidai-parts-field griidai-intro-editor" data-intro-field={base}>
  <div className="griidai-parts-label"><strong>{label||(title?'Page title':'Short description')} *</strong><p>{title?'Format the page title. It remains the main heading; links, lists and tables belong in the description or article.':'Format the description shown on the card and inside the page. The same text is used for search and sharing defaults.'}</p></div>
  <div className="griidai-part-card"><RichPart part={{content}} index={0} mode={title?'title':'body'} ariaLabel={title?'Page title':'Short description'} disabled={disabled} onChange={change}/></div>
  <small>{text(content).length} / {max} text characters. Search metadata and the URL use plain text.</small>
  {(field.error||plainField.error||text(content).length>max)&&<p role="alert">{field.error||plainField.error||`Use up to ${max} text characters.`}</p>}
 </div>;
}
