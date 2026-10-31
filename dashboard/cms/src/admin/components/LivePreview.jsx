import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {useFetchClient,useForm} from '@strapi/strapi/admin';
import './live-preview.css';
const fields=['tags','titleFormatting','summaryFormatting','title','classification','summary','slug','mediaType','videoUrl','videoTitle','cover','coverAlt','coverFocus','question','overview','parts','contentOrder','inputs','steps','outputs','review','seo','sharingImage','editorial','updatedAt','publishedAt','body','category','authorName','authorLinkedIn','authorPhoto','publicationDate','sourceUrl'];
function LivePreview({documentId,activeTab,model}){
 const previewTitle=model==='api::blog.blog'?'Live blog preview':'Live use case preview';
 const values=useForm('GriidAiLivePreview',s=>s.values);const {get}=useFetchClient();
 const [open,setOpen]=useState(()=>localStorage.getItem('griidai-live-preview')!=='closed');
 const [url,setURL]=useState('');const [status,setStatus]=useState('Connecting to preview…');const [mobile,setMobile]=useState(false);const [refresh,setRefresh]=useState(0);
 const frame=useRef(null),viewport=useRef(null),ready=useRef(false),version=useRef(0),latest=useRef({});
 const [size,setSize]=useState({width:600,height:700});
 const snapshot=Object.fromEntries(fields.map(name=>[name,values?.[name]]));const originalCover=Array.isArray(snapshot.cover)?snapshot.cover[0]:snapshot.cover;
 snapshot.cover=originalCover?{url:originalCover.url,width:originalCover.width,height:originalCover.height}:null;
 const share=Array.isArray(snapshot.sharingImage)?snapshot.sharingImage[0]:snapshot.sharingImage;
 snapshot.sharingImage=share?{url:share.url,width:share.width,height:share.height,mime:share.mime,alternativeText:share.alternativeText}:null;
 const photo=Array.isArray(snapshot.authorPhoto)?snapshot.authorPhoto[0]:snapshot.authorPhoto;
 const portrait=photo?.formats?.thumbnail||photo;
 snapshot.authorPhoto=photo?{url:portrait.url,width:portrait.width,height:portrait.height,alternativeText:photo.alternativeText}:null;
 const key=JSON.stringify(snapshot);latest.current=snapshot;
 const deviceWidth=mobile?390:1280;const scale=Math.min(1,size.width/deviceWidth);
 const send=()=>{if(!ready.current||!url||!frame.current?.contentWindow)return;version.current++;setStatus('Updating preview…');frame.current.contentWindow.postMessage({type:'griidai:preview-update',data:latest.current,version:version.current},new URL(url).origin);};
 useEffect(()=>{
  localStorage.setItem('griidai-live-preview',open?'open':'closed');document.body.classList.toggle('griidai-live-open',open);
  return()=>document.body.classList.remove('griidai-live-open');
 },[open]);
 useEffect(()=>{if(!open||!viewport.current)return;const observer=new ResizeObserver(entries=>{const rect=entries[0].contentRect;if(rect.width>0&&rect.height>0)setSize({width:rect.width,height:rect.height});});observer.observe(viewport.current);return()=>observer.disconnect();},[open]);
 useEffect(()=>{
  if(!open)return;let cancelled=false;ready.current=false;setStatus('Connecting to preview…');
  get('/content-manager/preview/url/'+model,{params:{documentId:documentId||'new',status:'draft'}}).then(response=>{if(cancelled)return;const value=response.data?.data?.url;if(!value)throw Error('Preview is not configured.');const next=new URL(value);next.searchParams.set('live','1');setURL(next.href);}).catch(()=>{if(!cancelled)setStatus('Could not connect. Check that the website is running, then use Refresh preview.');});
  const renewal=setInterval(()=>setRefresh(n=>n+1),12*60*1000);
  return()=>{cancelled=true;clearInterval(renewal);};
 },[open,documentId,refresh,get,model]);
 useEffect(()=>{
  if(!open||!url)return;
  const receive=event=>{
   if(event.origin!==new URL(url).origin||event.source!==frame.current?.contentWindow)return;
   if(event.data?.type==='griidai:preview-ready'){ready.current=true;send();}
   if(event.data?.type==='griidai:preview-rendered'&&event.data.version===version.current)setStatus('Preview is up to date · Not published');
   if(event.data?.type==='griidai:preview-error')setStatus('Preview could not update. Check the fields or use Refresh preview.');
  };
  window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive);
 },[open,url]);
 useEffect(()=>{if(!open)return;const timer=setTimeout(send,350);return()=>clearTimeout(timer);},[key,open,url]);
 return <>
  <div className="griidai-live-launch"><p>See edits beside the form as you type. Save and Publish stay manual.</p><button type="button" onClick={()=>setOpen(v=>!v)}>{open?'Hide live preview':'Show live preview'}</button></div>
  {open&&createPortal(
   <aside className="griidai-live-pane" aria-label={previewTitle}>
    <div className="griidai-live-heading"><div><strong>Live preview</strong><p role="status">{status}</p></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close live preview">Close</button></div>
    <div className="griidai-live-tools"><button type="button" aria-pressed={!mobile} onClick={()=>setMobile(false)}>Desktop</button><button type="button" aria-pressed={mobile} onClick={()=>setMobile(true)}>Mobile</button><button type="button" onClick={()=>setRefresh(n=>n+1)}>Refresh preview</button></div>
    <p className="griidai-live-help">{activeTab==='published'?'Viewing the published tab. Switch to Draft to edit.':'Changes here are private until you choose Save and Publish.'}</p>
    <div ref={viewport} className="griidai-live-viewport">
     {url?<div className="griidai-live-scaled" style={{width:deviceWidth*scale}}><div className="griidai-live-device" style={{width:deviceWidth,height:size.height/scale,transform:`scale(${scale})`}}><iframe ref={frame} src={url} title={previewTitle} referrerPolicy="no-referrer" onLoad={()=>{ready.current=true;send();}}/></div></div>:<p>Opening website preview…</p>}
    </div>
   </aside>,document.body)}
 </>;
}
export default function LivePreviewPanel(props){
 if(!['api::use-case.use-case','api::blog.blog'].includes(props.model))return null;
 return {title:'Live preview',content:<LivePreview documentId={props.documentId} activeTab={props.activeTab} model={props.model}/>};
}
