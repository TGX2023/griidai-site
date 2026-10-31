import React,{useId,useState} from 'react';
import {useField,useForm} from '@strapi/strapi/admin';
import './editor.css';
export default function CoverFocus({name,label,disabled}) {
 const {value,onChange}=useField(name);const cover=useForm('CoverFocus',s=>s.values.cover);
 const media=Array.isArray(cover)?cover[0]:cover;
 const [loaded,setLoaded]=useState(null);const inputId=useId();
 const focus={x:50,y:50,zoom:1,...value};
 const change=(axis,n)=>onChange(name,{...focus,[axis]:Number(n)});
 const dimensions=loaded?.url===media?.url?loaded:media;
 const width=dimensions?.width||0,height=dimensions?.height||0;
 const available=Boolean(media?.url&&width&&height);
 const scale=available?Math.max(16/width,9/height)*focus.zoom:1;
 const canMove={x:available&&width*scale>16.01,y:available&&height*scale>9.01};
 const cropWidth=available?Math.floor(Math.min(width,height*16/9)/focus.zoom):0;
 const lowResolution=available&&(cropWidth<1280||cropWidth*9/16<720);
 return <div className="griidai-field griidai-cover-focus">
  <label>{label||'Cover crop — shared by the card and page'}</label>
  {media?.url?<>
   <div className="griidai-cover-preview"><img src={media.url} alt="16:9 crop preview" onLoad={event=>setLoaded({url:media.url,width:event.currentTarget.naturalWidth,height:event.currentTarget.naturalHeight})} style={{objectPosition:`${focus.x}% ${focus.y}%`,transform:`scale(${focus.zoom})`,transformOrigin:`${focus.x}% ${focus.y}%`}}/></div>
   {lowResolution?<p role="status">The selected crop is below 1280 × 720. It will not be enlarged; reduce zoom for more detail.</p>:<small>Target: 1280 × 720 or larger. The original image stays unchanged.</small>}
  </>:<p>Select a cover above. For a YouTube video, Save once to import its thumbnail.</p>}
  <label htmlFor={`${inputId}-zoom`}>Zoom <output>{focus.zoom.toFixed(2)}×</output><input id={`${inputId}-zoom`} type="range" min="1" max="3" step="0.05" disabled={disabled||!available} value={focus.zoom} onChange={e=>change('zoom',e.target.value)}/></label>
  {['x','y'].map(axis=><label key={axis} htmlFor={`${inputId}-${axis}`}>{axis==='x'?'Horizontal focus':'Vertical focus'} <output>{Math.round(focus[axis])}%</output><input id={`${inputId}-${axis}`} type="range" min="0" max="100" step="1" disabled={disabled||!canMove[axis]} value={focus[axis]} onChange={e=>change(axis,e.target.value)}/></label>)}
  {available&&!canMove.x&&!canMove.y?<small>The whole image already fits 16:9. Increase Zoom to move the visible area.</small>:available&&(!canMove.x||!canMove.y)?<small>{!canMove.x?'The full image width fits. Increase Zoom to move horizontally.':'The full image height fits. Increase Zoom to move vertically.'}</small>:null}
  <button className="griidai-cover-reset" type="button" disabled={disabled||!available} onClick={()=>onChange(name,{x:50,y:50,zoom:1})}>Reset crop</button>
  <small>Changes appear immediately here and in the live preview. Save to keep the crop; Publish to update the public page.</small>
 </div>;
}
