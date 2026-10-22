(() => {
  const root=document.querySelector('.hub-industries');if(!root)return;
  const matrix=[...root.querySelectorAll('.ih-matrix-row')],wide=matchMedia('(min-width:768px)');
  const layout=()=>matrix.forEach(row=>row.open=wide.matches);layout();wide.addEventListener('change',layout);
  const reveal=()=>{let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const target=document.getElementById(id);if(!target?.matches('.ih-matrix-row'))return;target.open=true;requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));};
  reveal();addEventListener('hashchange',reveal);addEventListener('popstate',reveal);
  const event=(name,properties={})=>window.griidaiEvents?.push({event:name,...properties});
  root.addEventListener('click',e=>{
    const anchor=e.target.closest('a');if(!anchor)return;
    const hero=anchor.closest('.hub-hero'),final=anchor.closest('#industry-next-step'),label=anchor.textContent.trim();
    const industry=anchor.closest('.ih-industry-card'),useCase=anchor.closest('.ih-use-case-card'),workflow=anchor.closest('.ih-workflow-card');
    if(hero&&label.startsWith('Start for Free'))event('industries_hero_start_free');
    else if(industry)event('industries_explore_industry',{industry_id:industry.dataset.industry,slug:industry.dataset.industry,card_position:Number(industry.dataset.position)});
    else if(useCase)event('industries_use_case_click',{use_case_id:useCase.dataset.useCase,slug:useCase.dataset.useCase,card_position:Number(useCase.dataset.position)});
    else if(workflow)event('industries_workflow_click',{workflow_id:workflow.dataset.workflow,slug:workflow.dataset.workflow,status:workflow.dataset.status,card_position:Number(workflow.dataset.position)});
    else if(label.startsWith('Talk to Sales'))event('industries_talk_to_sales',{source_section:anchor.closest('section')?.id});
    else if(anchor.closest('#industry-enterprise')&&label.startsWith('Explore Enterprise'))event('industries_enterprise_click');
    else if(final&&label.startsWith('Start for Free'))event('industries_final_start_free');
    else if(anchor.closest('#industry-pattern,#how-it-works')&&['/platform/','/agentic-geoai/','/spatial-analysis/'].some(route=>anchor.pathname.endsWith(route)))event('industries_platform_click',{destination:anchor.pathname});
  });
})();
