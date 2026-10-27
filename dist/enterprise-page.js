(() => {
  const root=document.querySelector('.hub-enterprise');if(!root)return;
  const event=(name,properties={})=>window.griidaiEvents?.push({event:name,...properties});
  const frames=[...root.querySelectorAll('.ep-proof-frame')],wide=matchMedia('(min-width:768px)');
  const layout=()=>{if(!frames.length)return;frames.forEach(frame=>{frame.open=false;frame.removeAttribute('name');});if(wide.matches)frames.forEach(frame=>frame.open=true);else{frames.forEach(frame=>frame.setAttribute('name','enterprise-proof-sequence'));frames[0].open=true;}};layout();wide.addEventListener('change',()=>{layout();reveal();});
  const reveal=()=>{let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const target=document.getElementById(id);if(!target?.matches('.ep-proof-frame'))return;target.open=true;requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));};reveal();addEventListener('hashchange',reveal);
  root.addEventListener('click',e=>{
    const anchor=e.target.closest('a');if(!anchor)return;
    const label=anchor.textContent.trim(),source=anchor.closest('section')?.id||'hero',workflow=anchor.closest('[data-workflow]'),industry=anchor.closest('[data-industry]');
    if(source==='hero'&&label.startsWith('Talk to Sales'))event('enterprise_hero_talk_to_sales',{source_section:'hero'});
    else if(source==='hero'&&label.startsWith('See How'))event('enterprise_see_how_it_works',{source_section:'hero'});
    else if(source==='enterprise-next-step'&&label.startsWith('Talk to Sales'))event('enterprise_final_talk_to_sales',{source_section:'final'});
    else if(source==='enterprise-pilot'&&label.startsWith('Plan an Enterprise Pilot'))event('enterprise_pilot_cta',{source_section:source});
    else if(workflow)event('enterprise_workflow_click',{source_section:source,entity_type:'workflow',entity_slug:workflow.dataset.workflow});
    else if(industry)event('enterprise_industry_click',{source_section:source,entity_type:'industry',entity_slug:industry.dataset.industry,card_position:Number(industry.dataset.position)});
  });
  root.querySelectorAll('[data-enterprise-faq]').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)event('enterprise_faq_expand',{source_section:'enterprise-faq',entity_slug:'faq-'+detail.dataset.enterpriseFaq});}));
  if(!('IntersectionObserver'in window))return;
  const seen=new Set(),timers=new Map(),proofSeen=new Set();
  const sections={'enterprise-validation':'enterprise_validation_section_view','enterprise-integrations':'enterprise_integration_view','enterprise-security':'enterprise_security_view'};
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    const element=entry.target,key=element.dataset.proofFrame?'frame-'+element.dataset.proofFrame:element.closest('section').id;
    if(!entry.isIntersecting||entry.intersectionRatio<.5){clearTimeout(timers.get(element));timers.delete(element);return;}
    if(seen.has(key)||timers.has(element))return;
    timers.set(element,setTimeout(()=>{timers.delete(element);if(document.visibilityState==='hidden')return;seen.add(key);if(element.dataset.proofFrame){proofSeen.add(element.dataset.proofFrame);if(proofSeen.size===frames.length)event('enterprise_workflow_proof_view',{source_section:'enterprise-proof',entity_type:'workflow',entity_slug:'dem-hydrology-stream-network'});}else event(sections[key],{source_section:key});observer.unobserve(element);},1000));
  }),{threshold:[0,.5]});
  Object.keys(sections).forEach(id=>observer.observe(root.querySelector('#'+id+' .hub-section-heading')));root.querySelectorAll('[data-proof-frame]').forEach(body=>observer.observe(body));
})();
