(()=>{
 const discardBrokenPhotos=()=>document.querySelectorAll('.blog-author-photo').forEach(photo=>{if(photo.complete&&!photo.naturalWidth)photo.remove();});
 document.addEventListener('error',event=>{if(event.target instanceof HTMLImageElement&&event.target.matches('.blog-author-photo'))event.target.remove();},true);
 discardBrokenPhotos();
 const input=document.querySelector('#blog-search');
 if(input){
  const cards=[...document.querySelectorAll('[data-blog-card]')],count=document.querySelector('[data-blog-count]'),empty=document.querySelector('[data-blog-empty]');
  input.form.addEventListener('submit',event=>event.preventDefault());
  input.addEventListener('input',()=>{const words=input.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);let visible=0;cards.forEach(card=>{card.hidden=!words.every(word=>card.dataset.blogSearch.includes(word));if(!card.hidden)visible++;});count.textContent=`${visible} ${visible===1?'article':'articles'}`;empty.hidden=visible!==0;});
 }
 function followArticle(){
  const links=[...document.querySelectorAll('.blog-toc a[href^="#"]')];
  const sections=links.map(link=>({link,heading:document.getElementById(link.hash.slice(1))})).filter(item=>item.heading);
  if(!sections.length)return ()=>{};
  let pending=0,active=null;
  const update=()=>{
   pending=0;
   const header=document.querySelector('body>header');
   const anchorOffset=(parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||0)+(parseFloat(getComputedStyle(sections[0].heading).scrollMarginTop)||0);
   const readingLine=Math.max(135,(header?.getBoundingClientRect().bottom||0)+32,anchorOffset);
   let current=sections[0];
   for(const section of sections){if(section.heading.getBoundingClientRect().top<=readingLine+1)current=section;else break;}
   if(current===active)return;
   active=current;
   for(const section of sections){if(section===current)section.link.setAttribute('aria-current','location');else section.link.removeAttribute('aria-current');}
  };
  const schedule=()=>{if(!pending)pending=requestAnimationFrame(update);};
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  window.addEventListener('hashchange',schedule);
  window.addEventListener('load',schedule);
  document.fonts?.ready.then(schedule);
  update();
  return ()=>{cancelAnimationFrame(pending);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);window.removeEventListener('hashchange',schedule);window.removeEventListener('load',schedule);};
 }
 let stop=followArticle();
 document.addEventListener('griidai:content-updated',()=>{stop();stop=followArticle();discardBrokenPhotos();});
})();
