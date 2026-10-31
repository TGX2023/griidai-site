import React,{useState} from 'react';
import {useField,useForm,useStrapiApp} from '@strapi/strapi/admin';
import './content-parts.css';

import {RichPart} from './RichPart';
export {RichPart} from './RichPart';
const sectionLabels={'section:hero':'Title and cover','section:video':'Source video','section:method':'From question to analysis','section:results':'Understand the output','section:return':'Final call to action'};
function editorOrder(parts,value,isVideo){
 const before=parts.filter(p=>!isVideo||p.placement!=='below-video').map(p=>'part:'+p.id),after=isVideo?parts.filter(p=>p.placement==='below-video').map(p=>'part:'+p.id):[];
 const defaults=['section:hero',...before,'section:video',...after,'section:method','section:results','section:return'];
 if(!Array.isArray(value))return defaults;
 const result=[...new Set(value.filter(key=>defaults.includes(key)))];
 for(const key of defaults)if(!result.includes(key)){const end=result.indexOf('section:return');if(key.startsWith('part:')&&end>=0)result.splice(end,0,key);else result.push(key);}
 return result;
}
const empty=()=>({type:'doc',content:[{type:'paragraph'}]});
export default function ContentParts({name,label,disabled}) {
 const {value,onChange,error}=useField(name);
 const orderField=useField('contentOrder');
 const legacy=useForm('GriidAiContentParts',s=>({question:s.values.question,overview:s.values.overview,mediaType:s.values.mediaType}));
 const MediaLibrary=useStrapiApp('GriidAiContentParts',s=>s.components['media-library']);
 const [picker,setPicker]=useState(null);
 let parts=Array.isArray(value)?value:[];
 if(value==null&&(legacy.question||legacy.overview))parts=[{id:'original-introduction',content:{type:'doc',content:[...(legacy.question?[{type:'heading',attrs:{level:2},content:[{type:'text',text:legacy.question}]}]:[]),...(legacy.overview?.content||[])]},image:null,imageWidth:40,imagePosition:'right',imageAlt:''}];
 const isVideo=legacy.mediaType!=='image';
 const order=editorOrder(parts,orderField.value,isVideo);
 const visible=order.filter(key=>(key!=='section:video'||isVideo));
 const commit=next=>{onChange(name,next);orderField.onChange('contentOrder',editorOrder(next,order,isVideo));};
 const change=(index,patch)=>commit(parts.map((part,i)=>i===index?{...part,...patch}:part));
 const move=(key,offset)=>{const index=visible.indexOf(key),target=visible[index+offset];if(!target)return;const next=[...order],a=next.indexOf(key),b=next.indexOf(target);[next[a],next[b]]=[next[b],next[a]];orderField.onChange('contentOrder',next);};
 return <div className="griidai-parts-field">
  <div className="griidai-parts-label"><strong>{label||'3. Page content — Add part'}</strong><p>Add a part for each section. Write headings and formatted text, place an image beside it. Only GriidAi green is available.</p></div>
  <div className="griidai-page-order"><strong>Page order</strong><p>Move any section or part up or down. The live preview follows this exact order.</p><ol aria-label="Page section order">{visible.map((key,index)=>{
   const partIndex=parts.findIndex(part=>'part:'+part.id===key),label=partIndex>=0?`Part ${partIndex+1}`:sectionLabels[key];
   const name=partIndex>=0?`part ${partIndex+1}`:`section ${label}`;
   return <li key={key} data-page-block={key}><span>{label}</span><div><button type="button" aria-label={`Move ${name} up`} disabled={disabled||index===0} onClick={()=>move(key,-1)}>Move up</button><button type="button" aria-label={`Move ${name} down`} disabled={disabled||index===visible.length-1} onClick={()=>move(key,1)}>Move down</button></div></li>;
  })}</ol></div>
  {visible.filter(key=>key.startsWith('part:')).map(key=>{const index=parts.findIndex(part=>'part:'+part.id===key),part=parts[index];return <section className="griidai-part-card" key={part.id} data-content-part={part.id}>
   <header><strong>Part {index+1} · Page position {visible.indexOf(key)+1}</strong><div>
    <button type="button" disabled={disabled} onClick={()=>{if(window.confirm(`Remove part ${index+1}? This stays a draft until you publish.`))commit(parts.filter((_,i)=>i!==index));}}>Remove part</button>
   </div></header>
   <RichPart part={part} index={index} disabled={disabled} onChange={patch=>change(index,patch)}/>
   <div className="griidai-part-media">
    <div className="griidai-part-media-heading"><strong>Image</strong><button type="button" disabled={disabled} onClick={()=>setPicker(part.id)}>{part.image?'Replace image':'Add image'}</button>{part.image&&<button type="button" disabled={disabled} onClick={()=>change(index,{image:null})}>Remove image</button>}</div>
    {part.image&&<div className="griidai-part-image-options"><img src={part.image.url} alt={part.imageAlt||'Selected part image'}/><div>
     <label>Image description *<input type="text" aria-label={`Part ${index+1} image description`} aria-required="true" maxLength={500} disabled={disabled} value={part.imageAlt||''} onChange={e=>change(index,{imageAlt:e.target.value})}/></label>
     <label>Image position<select aria-label={`Part ${index+1} image position`} disabled={disabled} value={part.imagePosition||'right'} onChange={e=>change(index,{imagePosition:e.target.value})}><option value="right">Right of text</option><option value="left">Left of text</option><option value="top">Above text</option><option value="bottom">Below text</option></select></label>
     <label>Image width: {part.imageWidth||40}%<input type="range" aria-label={`Part ${index+1} image width`} min="20" max="100" step="5" disabled={disabled} value={part.imageWidth||40} onChange={e=>change(index,{imageWidth:Number(e.target.value)})}/></label>
    </div></div>}
    <small>Images stack on mobile. Widths above 75% use a full row. Check placement in the live preview.</small>
   </div>
  </section>;})}
  <button className="griidai-add-part" type="button" disabled={disabled||parts.length>=40} onClick={()=>commit([...parts,{id:crypto.randomUUID(),content:empty(),placement:'above-video',image:null,imageWidth:40,imagePosition:'right',imageAlt:''}])}>+ Add part</button>
  {error&&<p role="alert">{error}</p>}
  {picker&&MediaLibrary&&<MediaLibrary allowedTypes={['images']} multiple={false} initiallySelectedAssets={parts.find(p=>p.id===picker)?.image?[parts.find(p=>p.id===picker).image]:[]} onClose={()=>setPicker(null)} onSelectAssets={assets=>{const media=assets[0];if(media){if(!/^image\/(jpeg|png|webp|gif|avif)$/.test(media.mime||'')){window.alert('Choose a JPG, PNG, WebP, GIF or AVIF image.');return;}commit(parts.map(part=>part.id===picker?{...part,image:{id:media.id,url:media.url,width:media.width,height:media.height,mime:media.mime},imageAlt:part.imageAlt||media.alternativeText||''}:part));}setPicker(null);}}/>}
 </div>;
}
