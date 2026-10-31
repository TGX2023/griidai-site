import React,{useEffect,useId,useState} from 'react';
import {useField,useFetchClient} from '@strapi/strapi/admin';
import './tags-input.css';
const key=v=>v.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase();
export default function TagsInput({name,label,disabled}){
 const {value,onChange,error}=useField(name),{get}=useFetchClient(),inputId=useId();
 const tags=Array.isArray(value)?value:[],[draft,setDraft]=useState(''),[message,setMessage]=useState(''),[suggestions,setSuggestions]=useState([]);
 useEffect(()=>{let active=true;const load=async uid=>{let page=1,pages=1,result=[];do{const r=await get('/content-manager/collection-types/'+uid,{params:{page,pageSize:100}});result.push(...(r.data.results||[]).flatMap(r=>Array.isArray(r.tags)?r.tags:[]));pages=r.data.pagination?.pageCount||1;if(pages>1000)throw Error('Too many pages');page++;}while(page<=pages);return result;};Promise.allSettled(['api::blog.blog','api::use-case.use-case'].map(load)).then(result=>{if(active){const seen=new Set();setSuggestions(result.flatMap(r=>r.status==='fulfilled'?r.value:[]).filter(tag=>typeof tag==='string'&&!seen.has(key(tag))&&seen.add(key(tag))).sort((a,b)=>a.localeCompare(b)));}});return()=>{active=false;};},[get]);
 const add=(raw=draft)=>{
  if(disabled)return;const values=raw.split(/[,\n]/).map(v=>v.normalize('NFKC').trim().replace(/\s+/g,' ')).filter(Boolean);
  if(!values.length)return;
  if(values.some(v=>v.length>50||/[<>\x00-\x1f\x7f]/.test(v))){setMessage('Use plain text, up to 50 characters per tag.');return;}
  const next=[...tags];for(const tag of values)if(!next.some(v=>key(v)===key(tag)))next.push(tag);
  if(next.length>12){setMessage('Add up to twelve tags.');return;}
  if(next.length===tags.length){setMessage('That tag is already added.');return;}
  onChange(name,next);setDraft('');setMessage('');
 };
 return <div className="griidai-tags-field"><label htmlFor={inputId}>{label||'Tags'}</label><p>Use a few clear topics, such as Remote Sensing or Solar Energy. Tags help readers explore related content.</p>
  <ul aria-label="Selected tags">{tags.map(tag=><li key={key(tag)}><span>{tag}</span><button type="button" disabled={disabled} aria-label={'Remove tag '+tag} onClick={()=>{onChange(name,tags.filter(t=>key(t)!==key(tag)));setMessage('');}}>×</button></li>)}</ul>
  <div><input id={inputId} type="text" aria-label="New tag" list={inputId+'-suggestions'} value={draft} disabled={disabled||tags.length>=12} onChange={e=>{setDraft(e.target.value);setMessage('');}} onKeyDown={e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();e.stopPropagation();add();}}} onPaste={e=>{const value=e.clipboardData.getData('text');if(/[,\n]/.test(value)){e.preventDefault();add(value);}}} placeholder="Write a tag and press Enter"/><button type="button" disabled={disabled||!draft.trim()||tags.length>=12} onClick={()=>add()}>Add tag</button></div>
  <datalist id={inputId+'-suggestions'}>{suggestions.filter(t=>!tags.some(tag=>key(tag)===key(t))).map(tag=><option key={key(tag)} value={tag}/>)}</datalist>
  <small>{tags.length} / 12 tags. Enter or comma adds a tag. Save keeps a draft; Publish updates the website.</small>{(message||error)&&<p role="alert">{message||error}</p>}
 </div>;
}
