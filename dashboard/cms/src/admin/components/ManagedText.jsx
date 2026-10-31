import React,{useEffect,useRef,useState} from 'react';
import {useField,useForm,useFetchClient} from '@strapi/strapi/admin';
import {useLocation} from 'react-router-dom';
import './editor.css';
const slugify=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100);
export default function ManagedText({name,label,hint,disabled,required}){
 const {value,onChange,error}=useField(name);const data=useForm('ManagedText',s=>s.values);const touched=useRef(!!value);const slug=name==='slug';const locked=slug&&!!data.publishedSlug;
 const {get}=useFetchClient(),location=useLocation(),blog=location.pathname.includes('/api::blog.blog');
 const [siteOrigin,setSiteOrigin]=useState(''),[addressError,setAddressError]=useState(false);
 useEffect(()=>{if(!slug)return;let active=true;setAddressError(false);get('/content-manager/preview/url/'+(blog?'api::blog.blog':'api::use-case.use-case'),{params:{documentId:'new',status:'draft'}}).then(r=>{const url=r.data?.data?.url;if(!url)throw Error('Website address unavailable');if(active)setSiteOrigin(new URL(url).origin);}).catch(()=>{if(active)setAddressError(true);});return()=>{active=false;};},[slug,blog,get]);
 useEffect(()=>{if(slug&&!touched.current&&!locked&&data.title)onChange(name,slugify(data.title));},[data.title,slug,locked]);
 if(!slug&&data.mediaType==='image')return null;
 const prefix=siteOrigin+(blog?'/blogs/':'/use-cases/');
 const input=<input id={`griidai-${name}`} name={name} type="text" value={value||''} disabled={disabled||locked} onChange={e=>{touched.current=true;onChange(name,e.target.value);}} aria-invalid={!!error} aria-describedby={`griidai-help-${name}${slug?' griidai-full-url':''}`} autoCapitalize={slug?'none':undefined} spellCheck={slug?false:undefined}/>;
 return <div className="griidai-field"><label htmlFor={`griidai-${name}`}>{slug?'Page URL (Slug)':label}{required?' *':''}</label>{slug?<><div className="griidai-url-field" dir="ltr"><span className="griidai-url-prefix" aria-hidden="true">{prefix}</span>{input}<span aria-hidden="true">/</span></div><output id="griidai-full-url" className="griidai-full-url" htmlFor={`griidai-${name}`} dir="ltr">{prefix}{value||'your-page'}/</output>{addressError&&<small>Website address could not be loaded. Showing the page path only.</small>}</>:input}<small id={`griidai-help-${name}`}>{locked?'URL locked after first publication. Ask the website team to arrange a redirect before changing it.':slug?'Edit the page name in the address above. The website address and section stay fixed. The page name is suggested from the title and locks after first publication.':hint||'Shown only for video use cases.'}</small>{error&&<p role="alert">{error}</p>}</div>;
}
