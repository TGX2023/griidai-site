(() => {
  const root=document.querySelector('.hub-workflows');
  const form=root?.querySelector('[data-workflow-filters]');
  if(!form)return;
  const list=document.getElementById('workflow-list');
  const records=[...list.querySelectorAll('[data-workflow-record]')];
  const controls=[...form.querySelectorAll('input,select')];
  const count=form.querySelector('[data-workflow-count]');
  const empty=root.querySelector('[data-workflow-empty]');
  const normalize=value=>value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
  const event=(name,properties={})=>window.griidaiEvents?.push({event:name,...properties});
  const readURL=()=>{
    const params=new URLSearchParams(location.search);
    controls.forEach(control=>{
      const value=params.get(control.name)||(control.name==='sort'?'featured':'');
      control.value=control.tagName==='SELECT'&&![...control.options].some(o=>o.value===value)?(control.name==='sort'?'featured':''):value;
    });
  };
  const writeURL=()=>{
    const url=new URL(location.href);
    controls.forEach(c=>c.value&&(c.name!=='sort'||c.value!=='featured')?url.searchParams.set(c.name,c.value):url.searchParams.delete(c.name));
    history.replaceState(null,'',url);
  };
  function apply({save=false}={}){
    const values=Object.fromEntries(controls.map(c=>[c.name,c.value]));
    const words=normalize(values.q.trim()).split(/\s+/).filter(Boolean);
    let visible=0;
    records.forEach(item=>{
      const text=normalize(item.dataset.search);
      let relation=true;
      if(values.relation){const [kind,value]=values.relation.split(':');relation=kind==='industry'?item.dataset.industries.split(' ').includes(value):item.dataset.useCase===value;}
      const match=words.every(w=>text.includes(w))&&(!values.domain||item.dataset.domain===values.domain)&&(!values.type||item.dataset.type===values.type)&&(!values.status||item.dataset.status===values.status)&&relation;
      item.hidden=!match;if(match)visible++;
    });
    const sorted=[...records].sort((a,b)=>{
      if(values.sort==='az')return a.dataset.name.localeCompare(b.dataset.name,'en');
      if(values.sort==='verified'){const diff=(Date.parse(b.dataset.verified)||0)-(Date.parse(a.dataset.verified)||0);if(diff)return diff;}
      return Number(a.dataset.featured)-Number(b.dataset.featured);
    });
    sorted.forEach(item=>list.append(item));
    count.textContent=`${visible} / ${records.length} workflows`;
    empty.hidden=visible>0;
    if(save)writeURL();
  }
  function clear(){controls.forEach(c=>c.value=c.name==='sort'?'featured':'');apply({save:true});}
  function reveal(){
    let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
    const target=document.getElementById(id),item=target?.closest('[data-workflow-record]');
    if(!item)return;
    if(item.hidden)clear();
    if(target.tagName==='DETAILS')target.open=true;
    requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));
  }
  form.hidden=false;readURL();apply();reveal();
  form.addEventListener('submit',e=>{e.preventDefault();apply({save:true});event('workflow_search_used',{query_length:form.elements.q.value.trim().length});});
  form.elements.q.addEventListener('input',()=>{apply({save:true});event('workflow_search_used',{query_length:form.elements.q.value.trim().length});});
  form.querySelectorAll('select').forEach(control=>control.addEventListener('change',()=>{apply({save:true});event('workflow_filter_applied',{filter_type:control.name,filter_value:control.value});}));
  form.addEventListener('reset',e=>{e.preventDefault();clear();form.elements.q.focus();});
  empty.querySelector('[data-clear-workflows]').addEventListener('click',()=>{clear();form.elements.q.focus();});
  addEventListener('hashchange',reveal);
  addEventListener('popstate',()=>{readURL();apply();reveal();});
  const disclosure=form.querySelector('.wf-filter-disclosure');
  const wide=matchMedia('(min-width:900px)');
  const layout=()=>disclosure.open=wide.matches;layout();wide.addEventListener('change',layout);
  root.querySelectorAll('.wf-method').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)event('workflow_card_click',{workflow_slug:detail.id,workflow_status:detail.closest('[data-workflow-record]').dataset.status,destination_type:'inline'});}));
  root.addEventListener('click',e=>{
    const link=e.target.closest('a');if(!link)return;
    const href=link.getAttribute('href')||'';
    if(href==='#workflow-featured')event('workflow_explore_click',{source:'hero'});
    else if(link.textContent.includes('Start for Free'))event('workflow_start_free_click',{source_section:link.closest('section')?.id||'hero'});
    else if(link.textContent.includes('Talk to Sales'))event('workflow_enterprise_click',{source_section:link.closest('section')?.id||'hero'});
    else if(link.closest('.wf-related,.wf-data-links'))event('workflow_related_link_click',{entity_type:link.closest('div')?.querySelector('strong')?.textContent||'data'});
  });
  event('workflow_hub_view',{page_variant:'library',locale:document.documentElement.lang});
})();
