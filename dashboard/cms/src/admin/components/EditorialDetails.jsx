import React from 'react';
import {useField,useForm} from '@strapi/strapi/admin';
import './seo-settings.css';
export default function EditorialDetails({name,label,disabled}){
 const {value:stored,onChange,error}=useField(name),mediaType=useForm('GriidAiVideoDetails',s=>s.values.mediaType);
 const value=stored||{},change=patch=>onChange(name,{videoUploadDate:value.videoUploadDate||'',videoDurationSeconds:value.videoDurationSeconds??null,...patch});
 if(mediaType==='image')return null;
 return <div className="griidai-editorial"><strong>{label||'Video search details'}</strong><p>Use the video's actual upload date and duration. These help describe the source video to search engines.</p>
  <label>Video upload date<input type="date" aria-label="Video upload date" disabled={disabled} value={value.videoUploadDate||''} onChange={e=>change({videoUploadDate:e.target.value})}/></label>
  <label>Video duration in seconds<input type="number" aria-label="Video duration in seconds" min={1} max={604800} disabled={disabled} value={value.videoDurationSeconds??''} onChange={e=>change({videoDurationSeconds:e.target.value?Number(e.target.value):null})}/></label>
  <small>Use the actual YouTube upload date. Without it, no VideoObject is generated; the page publication date is not used as a substitute.</small>
  {error&&<p role="alert">{error}</p>}
 </div>;
}
