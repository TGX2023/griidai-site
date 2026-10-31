import React,{useEffect,useMemo,useState} from 'react';
import {useFetchClient} from '@strapi/strapi/admin';
import products from '../../../../shared/product-pages.json';
import './content-guidance.css';

const TYPES=[['use-case','api::use-case.use-case'],['blog','api::blog.blog']];
const key=r=>r.kind+':'+r.id;
export default function ContentGuidance({value,onChange,disabled,kind,documentId}){
 const {get}=useFetchClient();
 const [catalog,setCatalog]=useState([]),[loading,setLoading]=useState(false),[catalogError,setCatalogError]=useState(''),[selected,setSelected]=useState('');
 useEffect(()=>{
  let active=true;setLoading(true);setCatalogError('');
  const load=async(kind,uid,status)=>{let page=1,total=1,records=[];do{const r=await get('/content-manager/collection-types/'+uid,{params:{page,pageSize:100,status,sort:'title:ASC'}});const body=r.data;if(!Array.isArray(body?.results))throw Error('Content list unavailable');records.push(...body.results.map(r=>({...r,kind,status})));total=body.pagination?.pageCount||1;if(total>1000)throw Error('Content list too large');page++;}while(page<=total);return records;};
  Promise.allSettled(TYPES.map(([kind,uid])=>load(kind,uid,'published'))).then(results=>{
   if(!active)return;const records=results.flatMap(r=>r.status==='fulfilled'?r.value:[]);setCatalog(records);
   if(results.some(r=>r.status==='rejected'))setCatalogError('Some related pages could not be loaded or are outside your permissions.');
  }).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};
 },[get,kind]);
 const refs=Array.isArray(value.related)?value.related:[];
 const options=useMemo(()=>[...catalog.filter(r=>r.status==='published'&&r.publishedAt&&!(r.kind===kind&&r.documentId===documentId)).map(r=>({kind:r.kind,id:r.documentId,name:r.title,detailUrl:`/${r.kind==='blog'?'blogs':'use-cases'}/${r.slug}/`})),...products].filter((r,i,list)=>list.findIndex(o=>key(o)===key(r))===i),[catalog,kind,documentId]);
 const update=patch=>onChange({...value,...patch});
 const move=(i,offset)=>{const next=[...refs];[next[i],next[i+offset]]=[next[i+offset],next[i]];update({related:next});};
 return <div className="griidai-content-guidance">
  <details open><summary>Search planning</summary><div className="griidai-guidance-group">
   <label>Target search phrase<input type="text" aria-label="Target search phrase" disabled={disabled} maxLength={200} value={value.focusPhrase||''} onChange={e=>update({focusPhrase:e.target.value})}/></label>
   <small>What would your reader search for? This is an internal writing aid, not a meta-keywords tag. Answer the question naturally; do not repeat keywords to meet a quota.</small>
   <label>Reader questions<textarea aria-label="Reader questions" disabled={disabled} rows={3} value={(value.relatedQuestions||[]).join('\n')} onChange={e=>update({relatedQuestions:e.target.value.split('\n').slice(0,10).map(v=>v.slice(0,300))})}/></label><small>One question per line, up to ten. These notes guide your writing and do not appear automatically on the page.</small>
  </div></details>
  <details><summary>Related content</summary><div className="griidai-guidance-group">
   <p>Select useful published blogs, use cases or product pages. They appear after the article or explanation. Unpublished pages are automatically omitted from the website.</p>
   {catalogError&&<p role="status">{catalogError}</p>}
   {refs.length>0&&<ol className="griidai-related-list">{refs.map((ref,i)=>{const entry=options.find(o=>key(o)===key(ref));return <li key={key(ref)}><span>{entry?.name||(loading?'Loading selected page…':'Selected page is unavailable or not published')}</span><div><button type="button" aria-label={`Move related page ${i+1} up`} disabled={disabled||i===0} onClick={()=>move(i,-1)}>Up</button><button type="button" aria-label={`Move related page ${i+1} down`} disabled={disabled||i===refs.length-1} onClick={()=>move(i,1)}>Down</button><button type="button" aria-label={`Remove related page ${i+1}`} disabled={disabled} onClick={()=>update({related:refs.filter((_,j)=>j!==i)})}>Remove</button></div></li>;})}</ol>}
   <label>Add related content<select aria-label="Add related content" disabled={disabled||loading||refs.length>=6} value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Choose a page</option>{['use-case','blog','page'].map(type=><optgroup key={type} label={type==='use-case'?'Use cases':type==='blog'?'Blogs':'Product pages'}>{options.filter(o=>o.kind===type&&!refs.some(r=>key(r)===key(o))).map(o=><option key={key(o)} value={key(o)}>{o.name}</option>)}</optgroup>)}</select></label>
   <button type="button" disabled={disabled||!selected||refs.length>=6} onClick={()=>{const entry=options.find(o=>key(o)===selected);if(entry)update({related:[...refs,{kind:entry.kind,id:entry.id}]});setSelected('');}}>Add related page</button><small>Select up to six pages, in the order you want visitors to see them.</small>
  </div></details>
 </div>;
}
