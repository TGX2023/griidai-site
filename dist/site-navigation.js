(() => {
  const nav=document.querySelector('#navigation'),toggle=document.querySelector('.menu-toggle');
  const groups=[...document.querySelectorAll('.nav-group')];
  const setMore=(button,open)=>{
    const list=document.getElementById(button.getAttribute('aria-controls'));
    button.setAttribute('aria-expanded',String(open));list.hidden=!open;
    button.querySelector('[data-nav-more-label]').textContent=open?'Show less':'Show more ('+button.dataset.remaining+')';
  };
  const moreButtons=[...document.querySelectorAll('[data-nav-more]')];
  moreButtons.forEach(button=>button.addEventListener('click',()=>setMore(button,button.getAttribute('aria-expanded')!=='true')));

  const closeMenus=except=>groups.forEach(group=>{if(group===except)return;group.querySelector('.nav-disclosure').setAttribute('aria-expanded','false');group.querySelector('.nav-submenu').hidden=true;group.querySelectorAll('[data-nav-more]').forEach(button=>setMore(button,false));});
  const closeNav=()=>{nav?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');closeMenus();};
  toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav?.classList.toggle('open',open);if(!open)closeMenus();});
  groups.forEach(group=>{const button=group.querySelector('.nav-disclosure'),panel=group.querySelector('.nav-submenu');button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';closeMenus(group);button.setAttribute('aria-expanded',String(open));panel.hidden=!open;});group.addEventListener('focusout',event=>{if(!group.contains(event.relatedTarget))closeMenus();});});
  nav?.addEventListener('click',event=>{if(event.target.closest('a'))closeNav();});
  document.addEventListener('click',event=>{if(!event.target.closest('.nav-group'))closeMenus();});
  document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;const open=groups.find(g=>g.querySelector('.nav-disclosure').getAttribute('aria-expanded')==='true');if(open){const button=open.querySelector('.nav-disclosure');closeMenus();button.focus();}else if(nav?.classList.contains('open')){closeNav();toggle.focus();}});
  const dialog=document.querySelector('#detail');
  document.querySelectorAll('.close,.close-bottom').forEach(button=>button.addEventListener('click',()=>dialog?.close()));
  dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  document.querySelectorAll('.modal-link').forEach(a=>{const ecosystem=document.querySelector('.footer-sitemap a[href*="ecosystem"]');if(ecosystem)a.href=ecosystem.href;});
  window.griidaiEvents=[];
  const prefillSalesTopic=()=>{
    const field=document.querySelector('#early-access-form #gis-usage');
    const topic=new URLSearchParams(location.search).get('topic');
    const allowed=['Enterprise','Enterprise integrations','Security and deployment','Enterprise workflow pilot','Data source inquiry', 'Shapefile compatibility','GeoJSON compatibility','FlatGeobuf compatibility','KML compatibility','File Geodatabase compatibility','GeoTIFF compatibility','CSV compatibility','Parquet compatibility','GeoParquet compatibility','Zarr compatibility','ZIP compatibility','PNG & JPEG compatibility','PDF compatibility'];
    if(field&&!field.value&&allowed.includes(topic)){field.value="I'd like to discuss "+topic.toLowerCase()+'.';requestAnimationFrame(()=>field.dispatchEvent(new Event('input',{bubbles:true})));}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prefillSalesTopic);else prefillSalesTopic();
  document.addEventListener('click',event=>{const a=event.target.closest('a');if(a&&!a.getAttribute('href')?.startsWith('mailto:'))window.griidaiEvents.push({event:'site_link_click',label:a.textContent.trim(),destination:a.getAttribute('href')});});
})();
