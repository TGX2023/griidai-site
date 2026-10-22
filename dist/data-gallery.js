(() => {
  const links=[...document.querySelectorAll('.hub-data [data-image-viewer]')];
  if(!links.length||typeof HTMLDialogElement==='undefined')return;
  const dialog=document.createElement('dialog');
  dialog.className='data-image-dialog';
  dialog.setAttribute('aria-labelledby','data-viewer-title');
  dialog.setAttribute('aria-describedby','data-viewer-caption');
  dialog.innerHTML='<div class="data-viewer-toolbar"><h2 id="data-viewer-title"></h2><div class="data-viewer-actions"><button type="button" class="data-viewer-zoom" aria-pressed="false">Actual size</button><button type="button" class="data-viewer-close" aria-label="Close image viewer">×</button></div></div><div class="data-viewer-stage"><img alt=""></div><p id="data-viewer-caption" class="data-viewer-caption"></p>';
  document.body.append(dialog);
  const stage=dialog.querySelector('.data-viewer-stage'),image=stage.querySelector('img');
  const zoom=dialog.querySelector('.data-viewer-zoom');
  let trigger;
  function fit(){stage.classList.remove('is-zoomed');zoom.setAttribute('aria-pressed','false');zoom.textContent='Actual size';stage.scrollTo(0,0);}
  links.forEach(link=>link.addEventListener('click',event=>{
    if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;
    event.preventDefault();trigger=link;
    const source=link.querySelector('img');
    dialog.querySelector('#data-viewer-title').textContent=link.dataset.imageLabel;
    dialog.querySelector('#data-viewer-caption').textContent=link.closest('figure').querySelector('figcaption>span')?.textContent||link.dataset.imageLabel||source.alt;
    image.src=link.href;image.alt=source.alt;image.width=Number(source.getAttribute('width'));image.height=Number(source.getAttribute('height'));
    stage.style.setProperty('--image-width',source.getAttribute('width')+'px');fit();
    dialog.showModal();dialog.querySelector('.data-viewer-close').focus();
  }));
  zoom.addEventListener('click',()=>{const actual=stage.classList.toggle('is-zoomed');zoom.setAttribute('aria-pressed',String(actual));zoom.textContent=actual?'Fit image':'Actual size';if(!actual)stage.scrollTo(0,0);});
  dialog.querySelector('.data-viewer-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>{fit();trigger?.focus({preventScroll:true});});
})();
