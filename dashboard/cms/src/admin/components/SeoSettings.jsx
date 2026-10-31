import React,{useEffect,useState} from 'react';
import {useField,useForm,useFetchClient,useStrapiApp} from '@strapi/strapi/admin';
import './seo-settings.css';
import {useLocation} from 'react-router-dom';
import ContentGuidance from './ContentGuidance';
const trim=v=>typeof v==='string'?v.trim():'';
const excerpt=value=>{const v=trim(value).replace(/\s+/g,' ');if(v.length<=160)return v;const cut=v.slice(0,159),space=cut.lastIndexOf(' ');return cut.slice(0,space>104?space:159)+'…';};
const plain=node=>node?.type==='text'?node.text:(node?.content||[]).map(plain).join(' ');
export default function SeoSettings({name,label,disabled}){
 const field=useField(name),imageField=useField('sharingImage'),data=useForm('GriidAiSeo',s=>s.values);
 const location=useLocation(),blog=location.pathname.includes('/api::blog.blog'),documentId=location.pathname.split('/').filter(Boolean).pop();
 const {get}=useFetchClient();const MediaLibrary=useStrapiApp('GriidAiSeo',s=>s.components['media-library']);
 const [siteURL,setSiteURL]=useState(''),[picker,setPicker]=useState(false);
 useEffect(()=>{let active=true;get('/content-manager/preview/url/'+(blog?'api::blog.blog':'api::use-case.use-case'),{params:{documentId:'new',status:'draft'}}).then(r=>{if(active&&r.data?.data?.url)setSiteURL(new URL(r.data.data.url).origin);}).catch(()=>{});return()=>{active=false;};},[get,blog]);
 const value=field.value||{},manualFields=Array.isArray(value.manualFields)?value.manualFields:[];
 const set=(key,v)=>field.onChange(name,{...value,[key]:v,manualFields:[...new Set([...manualFields,key])]});
 const title=trim(data.title)?trim(data.title)+' | GriidAi':(blog?'Your article title':'Your use case title')+' | GriidAi';
 const description=excerpt(data.summary||(data.parts||[]).map(p=>plain(p.content)).join(' '));
 const auto={title,description};
 const effective=key=>manualFields.includes(key)?(typeof value[key]==='string'?value[key]:''):(trim(value[key])||auto[key]||'');
 const route=(blog?'/blogs/':'/use-cases/')+(data.slug||'your-page')+'/';
 const canonical=siteURL?new URL(route,siteURL).href:route;
 const media=Array.isArray(imageField.value)?imageField.value[0]:imageField.value;
 const cover=Array.isArray(data.cover)?data.cover[0]:data.cover;
 const previewImage=media||cover;
 const imageAlt=previewImage?.alternativeText||(!media?data.coverAlt:'')||data.title||'';
 const input=(key,title,max,multiline=false)=><div className="griidai-seo-input" key={key}><div><label htmlFor={'seo-'+key}>{title}</label><span>{manualFields.includes(key)||trim(value[key])?'Custom':'Automatic'}</span></div>{multiline?<textarea id={'seo-'+key} aria-label={title} disabled={disabled} maxLength={max} rows={3} value={effective(key)} onChange={e=>set(key,e.target.value)}/>:<input id={'seo-'+key} aria-label={title} type="text" disabled={disabled} maxLength={max} value={effective(key)} onChange={e=>set(key,e.target.value)}/>}<div><small>{effective(key).length} characters</small></div></div>;
 return <div className="griidai-seo-settings"><strong>{label||'SEO & Sharing'}</strong><p>Initial suggestions come from your content. Once edited, a field stays under your control, even when cleared. Use the generate button to replace both fields with fresh suggestions.</p>
  <details open><summary>Search appearance</summary><div className="griidai-seo-group">
   {input('title','SEO title',200)}{input('description','Meta description',1000,true)}
   <small>Write a clear, distinctive title and summary. Around 50–60 characters for titles and 140–160 for descriptions are editing guidelines, not Google limits. Keep the page title and search title consistent in meaning.</small>
   <button type="button" disabled={disabled} onClick={()=>field.onChange(name,{...value,title,description,manualFields:['title','description']})}>Generate search text from current content</button>
   <small>If a field is left empty, the website uses the page content as a fallback. The editor stays empty so you can write a replacement.</small>
   <div className="griidai-search-preview" aria-label="Search result preview"><small>{canonical}</small><strong>{trim(effective('title'))||auto.title}</strong><p>{trim(effective('description'))||auto.description||'Add a short page description to generate a suggestion.'}</p></div>
   <small>This is a preview. Search engines may display a different title or description.</small>
   <p>The page URL is edited in the existing Page URL field. It stays locked after publication.</p>
  </div></details>
  <ContentGuidance data={{...data,seo:value}} value={value} disabled={disabled} kind={blog?'blog':'use-case'} documentId={documentId} onChange={next=>field.onChange(name,next)}/>
  <details><summary>Sharing appearance</summary><div className="griidai-seo-group">
   <p>The title and description always follow the page title and short description. Choose a different image here, or keep the page cover.</p>
   <div className="griidai-seo-image"><strong>Sharing image</strong><div><button type="button" disabled={disabled} onClick={()=>setPicker(true)}>{media?'Change sharing image':'Choose sharing image'}</button>{media&&<button type="button" disabled={disabled} onClick={()=>imageField.onChange('sharingImage',null)}>Use page cover instead</button>}</div><small>Leave unset to use the page cover. A dedicated image around 1200 × 630 works well for sharing. Image descriptions come from the Media Library.</small></div>
   <div className="griidai-share-preview" aria-label="Sharing preview">{previewImage?.url&&<img src={previewImage.url} alt={imageAlt}/>}<div><small>{siteURL?new URL(siteURL).hostname:'Your website'}</small><strong>{data.title||'Your page title'}</strong><p>{description}</p></div></div>
  </div></details>
  {field.error&&<p role="alert">{field.error}</p>}
  {picker&&MediaLibrary&&<MediaLibrary allowedTypes={['images']} multiple={false} initiallySelectedAssets={media?[media]:[]} onClose={()=>setPicker(false)} onSelectAssets={assets=>{imageField.onChange('sharingImage',assets[0]||null);setPicker(false);}}/>}
 </div>;
}
