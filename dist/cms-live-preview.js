(()=>{
 const script=document.querySelector('script[data-cms-origin]');if(!script||window.parent===window)return;
 const cmsOrigin=script.dataset.cmsOrigin;let sequence=0,controller;
 const notify=data=>window.parent.postMessage(data,cmsOrigin);
 window.addEventListener('message',async event=>{
  if(event.origin!==cmsOrigin||event.source!==window.parent||event.data?.type!=='griidai:preview-update')return;
  const current=++sequence;controller?.abort();controller=new AbortController();
  try{
   const response=await fetch(location.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({data:event.data.data}),cache:'no-store',signal:controller.signal});
   if(!response.ok)throw Error(response.status===403?'Preview link expired. Use Refresh preview.':'Preview could not update. Check the content or try Refresh preview.');
   const html=await response.text();if(current!==sequence)return;
   const parsed=new DOMParser().parseFromString(html,'text/html');const next=parsed.querySelector('main');if(!next)throw Error('Preview is unavailable.');
   const main=document.querySelector('main');const scroll=window.scrollY;const currentCard=document.querySelector('#live-card-preview');const cardOpen=!!currentCard&&!currentCard.hidden;
   main.className=next.className;main.innerHTML=next.innerHTML;if(cardOpen&&document.querySelector('#live-card-preview'))document.querySelector('#live-card-preview').hidden=false;
   document.title=parsed.title;window.scrollTo(0,scroll);document.dispatchEvent(new Event('griidai:content-updated'));
   const metadataSelector='meta[name="description"],meta[name="robots"],meta[name="author"],meta[name^="twitter:"],meta[property^="og:"],link[rel="canonical"],script[type="application/ld+json"]';
   document.head.querySelectorAll(metadataSelector).forEach(node=>node.remove());
   parsed.head.querySelectorAll(metadataSelector).forEach(node=>document.head.appendChild(document.importNode(node,true)));
   notify({type:'griidai:preview-rendered',version:event.data.version});
  }catch(error){if(error.name!=='AbortError')notify({type:'griidai:preview-error',message:error.message});}
 });
 document.addEventListener('click',event=>{if(event.target.closest('[data-live-card-toggle]')){const card=document.querySelector('#live-card-preview');card.hidden=!card.hidden;if(!card.hidden)card.scrollIntoView({behavior:'smooth',block:'start'});}});
 document.addEventListener('error',event=>{const img=event.target;if(img instanceof HTMLImageElement&&/^https:\/\/i\.ytimg\.com\/vi\/[\w-]{11}\/maxresdefault\.jpg$/.test(img.src))img.src=img.src.replace('maxresdefault.jpg','hqdefault.jpg');},true);
 notify({type:'griidai:preview-ready'});
})();
