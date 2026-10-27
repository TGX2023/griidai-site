(() => {
 const root=document.querySelector('.hub-data');if(!root)return;
 const emit=(event,data={})=>window.griidaiEvents?.push({event,page_key:'data',...data});
 // Draw decorative connectors from actual card positions after each layout change.
 const flow=root.querySelector('.dp-journey-flow');
 if(flow){
  const svg=flow.querySelector('svg'),cards=[...flow.querySelectorAll('li')],button=flow.parentElement.querySelector('.dp-journey-motion');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:700px)');
  const ns='http://www.w3.org/2000/svg';let paused=false,frame;
  const motion=()=>{const stop=paused||reduced.matches||document.hidden;if(stop)svg.pauseAnimations?.();else svg.unpauseAnimations?.();button.hidden=reduced.matches;button.textContent=paused?'Resume motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));};
  const draw=()=>{
   frame=undefined;const base=flow.getBoundingClientRect();if(!base.width||!base.height)return;
   svg.setAttribute('viewBox',`0 0 ${base.width} ${base.height}`);svg.replaceChildren();
   const bounds=cards.map(card=>{const r=card.getBoundingClientRect();return {left:r.left-base.left,right:r.right-base.left,top:r.top-base.top,bottom:r.bottom-base.top,cx:r.left-base.left+r.width/2,cy:r.top-base.top+r.height/2};});
   bounds.slice(0,-1).forEach((a,i)=>{
    const b=bounds[i+1];let d;
    if(mobile.matches){const middle=(a.cy+b.cy)/2;d=`M ${a.left} ${a.cy} C ${a.left-30} ${a.cy} ${a.left-30} ${middle-16} ${a.left-15} ${middle} C ${a.left} ${middle+16} ${b.left-30} ${b.cy} ${b.left} ${b.cy}`;}
    else if(Math.abs(a.top-b.top)<10){const right=b.cx>a.cx,sx=right?a.right:a.left,ex=right?b.left:b.right,mid=(sx+ex)/2;d=`M ${sx} ${a.cy} C ${mid} ${a.cy-22} ${mid} ${b.cy+22} ${ex} ${b.cy}`;}
    else {const mid=(a.bottom+b.top)/2;d=`M ${a.cx} ${a.bottom} C ${a.cx+25} ${mid} ${b.cx-25} ${mid} ${b.cx} ${b.top}`;}
    const path=document.createElementNS(ns,'path');path.setAttribute('d',d);path.setAttribute('class','dp-flow-rope');svg.append(path);
    const dot=document.createElementNS(ns,'circle');dot.setAttribute('r','3.5');dot.setAttribute('class','dp-flow-dot');
    const animation=document.createElementNS(ns,'animateMotion');animation.setAttribute('path',d);animation.setAttribute('dur','3.6s');animation.setAttribute('begin',`${i*.18}s`);animation.setAttribute('repeatCount','indefinite');dot.append(animation);svg.append(dot);
   });motion();
  };
  const schedule=()=>{if(frame===undefined)frame=requestAnimationFrame(draw);};
  button.addEventListener('click',()=>{paused=!paused;motion();});
  reduced.addEventListener('change',motion);document.addEventListener('visibilitychange',motion);
  if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(schedule);observer.observe(flow);cards.forEach(card=>observer.observe(card));}
  addEventListener('resize',schedule,{passive:true});document.fonts?.ready.then(schedule);schedule();
 }
 const normalize=s=>s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
 const filters=new Map(),states={};
 root.querySelectorAll('[data-data-filter]').forEach(form=>{
  const kind=form.dataset.dataFilter,items=[...root.querySelectorAll(kind==='format'?'[data-format-id]':'[data-provider-id]')],empty=root.querySelector(`[data-${kind}-empty]`),count=form.querySelector('.dp-filter-count'),query=form.elements.q;
  const groups=new Map();form.querySelectorAll('input[type=checkbox]').forEach(input=>{if(!groups.has(input.name))groups.set(input.name,[]);groups.get(input.name).push(input);});
  const filterSummary=form.querySelector('.dp-filter-options>summary'),activeFilters=document.createElement('span');
  activeFilters.className='dp-active-filters';activeFilters.setAttribute('aria-hidden','true');activeFilters.hidden=true;filterSummary?.append(activeFilters);
  const selected=name=>(groups.get(name)||[]).filter(i=>i.checked).map(i=>i.value);
  const selections=()=>Object.fromEntries([...groups].map(([name])=>[name,selected(name)]));
  const update=(message='')=>{
   const words=normalize(query.value.trim()).split(/\s+/).filter(Boolean),chosen={family:[],direction:[],status:[],...selections()};let visible=0;
   const activeCount=Object.values(chosen).reduce((n,values)=>n+values.length,0);
   activeFilters.hidden=activeCount===0;activeFilters.textContent=String(activeCount);
   filterSummary?.setAttribute('aria-label',activeCount?`Filters, ${activeCount} active`:'Filters');
   items.forEach(item=>{
    let match=words.every(word=>normalize(item.dataset.search||'').includes(word));
    if(kind==='format'){
     if(chosen.family.length&&!chosen.family.includes(item.dataset.family))match=false;
     const directions=chosen.direction.length?chosen.direction.map(v=>v.toLowerCase()):['upload','inspect','analyze','export'];
     if(chosen.status.length&&!directions.some(d=>chosen.status.includes(item.dataset[d])))match=false;
     if(chosen.direction.length&&!chosen.status.length&&!directions.some(d=>['Supported','Limited','Beta'].includes(item.dataset[d])))match=false;
    }else{
     const values={type:JSON.parse(item.dataset.types),coverage:JSON.parse(item.dataset.coverage),access:[item.dataset.access],provider_type:[item.dataset.providerType],status:[item.dataset.status]};
     for(const [key,options]of Object.entries(chosen))if(options.length&&!options.some(value=>values[key].includes(value)))match=false;
    }
    item.hidden=!match;if(match)visible++;
   });
   if(kind==='format')root.querySelectorAll('[data-format-group]').forEach(group=>group.hidden=![...group.querySelectorAll('[data-format-id]')].some(i=>!i.hidden));
   empty.hidden=visible!==0||items.length===0;count.textContent=message||`${visible} of ${items.length} ${kind==='format'?'formats':'sources'}`;return visible;
  };
  const clear=(message='')=>{query.value='';groups.forEach(inputs=>inputs.forEach(i=>i.checked=false));return update(message);};
  let timer;form.hidden=items.length===0;update();
  form.addEventListener('submit',e=>{e.preventDefault();const n=update();emit(kind==='source'?'data_source_search':'data_format_filter',{result_count:n,...(kind==='format'?{filter_name:'search'}:{})});});
  query.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{const n=update();emit(kind==='source'?'data_source_search':'data_format_filter',{result_count:n,...(kind==='format'?{filter_name:'search'}:{})});},280);});
  form.addEventListener('change',e=>{if(e.target.type!=='checkbox')return;clearTimeout(timer);const n=update();emit('data_'+kind+'_filter',{filter_name:e.target.name,values:selected(e.target.name),result_count:n});});
  form.addEventListener('reset',e=>{e.preventDefault();clearTimeout(timer);const n=clear();query.focus();emit('data_'+kind+'_filter',{filter_name:'reset',values:[],result_count:n});});
  filters.set(kind,{items,update,clear,query,form,groups});
 });
 function toggle(button,open){button.setAttribute('aria-expanded',String(open));const panel=document.getElementById(button.getAttribute('aria-controls'));panel.hidden=!open;return panel;}
 root.querySelectorAll('[data-format-toggle],.dp-provider-toggle').forEach(button=>{button.disabled=false;toggle(button,false);button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';toggle(button,open);if(button.matches('.dp-provider-toggle')){button.textContent=open?'Hide Source Details':'View Source Details';if(open)emit('data_source_expand',{provider_id:button.closest('[data-provider-id]').dataset.providerId});}else if(open)emit('data_format_expand',{format_id:button.dataset.formatToggle});});});
 const focusTarget=target=>{const heading=target.querySelector('h2,h3,h4')||target;heading.tabIndex=-1;requestAnimationFrame(()=>{target.scrollIntoView({block:'start',behavior:'instant'});heading.focus({preventScroll:true});});};
 function reveal(focus=false){
  let id;try{id=decodeURIComponent(location.hash.slice(1))}catch{return}if(!id)return;
  const target=document.getElementById(id);
  for(const kind of ['source','format']){const note=root.querySelector(`[data-${kind}-fragment]`);if(note)note.hidden=true;}
  if(!target){const kind=id.startsWith('provider-')||id.startsWith('dataset-')?'source':id.startsWith('format-')?'format':null;if(kind){const note=root.querySelector(`[data-${kind}-fragment]`);note.hidden=false;focusTarget(root.querySelector(kind==='source'?'#data-sources':'#supported-formats'));}return;}
  const record=target.closest('[data-format-id],[data-provider-id]');
  if(record){const kind=record.dataset.formatId?'format':'source',controller=filters.get(kind);if(record.hidden)controller.clear(`Filters cleared to show the linked ${kind==='format'?'format':'source'}.`);const button=record.querySelector(kind==='format'?'[data-format-toggle]':'.dp-provider-toggle');toggle(button,true);if(kind==='source')button.textContent='Hide Source Details';}
  if(target.tagName==='DETAILS')target.open=true;
  if(focus)focusTarget(target);
 }
 addEventListener('hashchange',()=>reveal(true));reveal(Boolean(location.hash));
 root.addEventListener('click',e=>{
  const family=e.target.closest('[data-family] a,a[data-family]');if(family?.matches('a[data-family]')){const controller=filters.get('format');if(controller){controller.clear();const options=controller.groups.get('family');if(options)options.forEach(input=>input.checked=input.value===family.dataset.family);else controller.query.value=family.dataset.family;controller.update();emit('data_family_interaction',{family:family.dataset.family});}}
  const link=e.target.closest('a');if(!link)return;
  const section=link.closest('section')?.id||'hero';
  if(link.dataset.dataCta){const target=new URL(link.href),type=target.origin===location.origin?(target.hash?'section':'contact'):'signup';emit('cta_click',{section_key:section,cta_id:link.dataset.dataCta,destination_type:type});}
  if(link.dataset.imageViewer!==undefined)emit('data_proof_expand',{asset_id:link.dataset.assetId,section_key:section});
  const workflow=link.closest('[data-workflow-id]');if(workflow)emit('data_workflow_click',{workflow_id:workflow.dataset.workflowId,section_key:section});
  if(link.dataset.officialProvider)emit('data_source_official_click',{provider_id:link.dataset.officialProvider,placement:'source_details'});
  if(link.getAttribute('href')?.startsWith('#'))setTimeout(()=>reveal(true),0);
 });
 root.querySelectorAll('[data-data-faq]').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)emit('data_faq_expand',{question_id:detail.dataset.dataFaq});}));
 root.querySelectorAll('[data-dataset-id]').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)emit('data_source_dataset_expand',{provider_id:detail.closest('[data-provider-id]').dataset.providerId,dataset_id:detail.dataset.datasetId});}));
 let referrer='direct';try{if(document.referrer)referrer=new URL(document.referrer).origin===location.origin?'internal':'external';}catch{}
 emit('data_page_view',{locale:document.documentElement.lang,referrer_category:referrer});
})();
