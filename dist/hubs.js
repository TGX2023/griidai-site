(() => {
  const normalize=s=>s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
  const controllers=new Map();
  document.querySelectorAll('[data-filter-for]').forEach(form=>{
    const id=form.dataset.filterFor,list=document.getElementById(id),items=[...list.querySelectorAll('.hub-filter-item')],controls=[...form.querySelectorAll('input,select')];
    const count=form.querySelector('.hub-filter-count'),empty=document.querySelector(`[data-empty-for="${id}"]`);
    const syncFromURL=()=>{const params=new URLSearchParams(location.search);controls.forEach(control=>{const value=params.get(control.name)||'';control.value=control.tagName==='SELECT'&&![...control.options].some(o=>o.value===value)?'':value;});};
    const update=(writeURL=false,announcement='')=>{
      const words=normalize(form.elements.q.value.trim()).split(/\s+/).filter(Boolean);let visible=0;
      items.forEach(item=>{const search=normalize(item.dataset.search||item.textContent);const match=words.every(word=>search.includes(word))&&controls.filter(c=>c.name!=='q').every(c=>!c.value||item.dataset[c.name]===c.value);item.hidden=!match;if(match)visible++;});
      count.textContent=announcement||`${visible} of ${items.length} ${id==='format-list'?'formats':id==='case-list'?'use cases':'workflow examples'}`;empty.hidden=visible!==0;
      if(writeURL){const url=new URL(location.href);controls.forEach(c=>c.value?url.searchParams.set(c.name,c.value):url.searchParams.delete(c.name));history.replaceState(null,'',url);}
    };
    const clear=(writeURL=true,announcement='')=>{controls.forEach(c=>c.value='');update(writeURL,announcement);};
    form.hidden=false;syncFromURL();update();form.addEventListener('submit',event=>{event.preventDefault();update(true);});
    form.addEventListener('input',()=>update(true));form.addEventListener('change',()=>update(true));
    form.addEventListener('reset',event=>{event.preventDefault();clear();form.elements.q.focus();});
    document.querySelector(`[data-reset="${id}"]`)?.addEventListener('click',()=>{clear();form.elements.q.focus();});
    window.addEventListener('popstate',()=>{syncFromURL();update();revealHash();});controllers.set(id,{items,clear});
  });
  function revealHash(){
    let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}if(!id)return;const target=document.getElementById(id);if(!target)return;
    const hiddenItem=target.closest('.hub-filter-item[hidden]');if(hiddenItem){for(const controller of controllers.values())if(controller.items.includes(hiddenItem))controller.clear(true,'Filters cleared to show the linked record.');}
    let parent=target;while(parent){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}
    requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'instant'}));
  }
  window.addEventListener('hashchange',revealHash);revealHash();
  // Shared section navigation: sticky position, scroll tracking and mobile disclosure.
  document.querySelectorAll('.hub-jump, .platform-jump').forEach(jump=>{
    const root=jump.closest('main')||document.body,header=document.querySelector('body>header');
    const details=jump.querySelector('details'),summary=details?.querySelector('summary');
    const wide=matchMedia('(min-width:900px)');
    jump.setAttribute('role','navigation');jump.setAttribute('aria-label','On this page');
    const items=[...jump.querySelectorAll('a[href^="#"]')].map(link=>{
      let target;try{target=document.getElementById(decodeURIComponent(link.hash.slice(1)));}catch{}
      return {link,target};
    }).filter(item=>item.target).sort((a,b)=>a.target.compareDocumentPosition(b.target)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1);
    const current=document.createElement('span');current.className='hub-current-section';current.setAttribute('aria-hidden','true');
    summary?.insertBefore(current,summary.querySelector('svg'));
    let pending=false;
    const highlight=()=>{
      pending=false;const threshold=(header?.getBoundingClientRect().height||0)+jump.getBoundingClientRect().height+32;
      let active;for(const item of items)if(item.target.getClientRects().length&&item.target.getBoundingClientRect().top<=threshold)active=item;
      for(const item of items){if(item===active)item.link.setAttribute('aria-current','location');else item.link.removeAttribute('aria-current');}
      current.textContent=active?.link.textContent.trim()||'';
    };
    const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(highlight);}};
    const measure=()=>{
      root.style.setProperty('--section-header-height',`${header?.getBoundingClientRect().height||0}px`);
      root.style.setProperty('--section-jump-height',`${jump.getBoundingClientRect().height}px`);schedule();
    };
    const setDisclosure=()=>{if(details)details.open=wide.matches;measure();};
    wide.addEventListener('change',setDisclosure);setDisclosure();
    jump.addEventListener('click',event=>{if(event.target.closest('a')&&!wide.matches&&details){details.open=false;measure();}});
    jump.addEventListener('keydown',event=>{if(event.key==='Escape'&&!wide.matches&&details?.open){details.open=false;measure();summary?.focus();}});
    details?.addEventListener('toggle',measure);
    if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(measure);if(header)observer.observe(header);observer.observe(jump);}
    addEventListener('scroll',schedule,{passive:true});addEventListener('resize',measure,{passive:true});
    document.fonts?.ready.then(measure);
  });
})();
