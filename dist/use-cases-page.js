(() => {
 const root=document.querySelector('.hub-use-cases');
 if(!root)return;
 const event=(name,properties)=>window.griidaiEvents?.push({event:name,...properties});
 // Keep the local poster visible through player startup, not just iframe navigation.
 const heroFrame=root.querySelector('#use-cases-hero-video');
 if(heroFrame){
  const shell=heroFrame.closest('.uc-hero-video');
  const reveal=()=>shell.classList.add('is-ready');
  let playerInitialized=false;
  const nativeFallback=window.setTimeout(reveal,15000);
  const showPlayer=()=>{window.clearTimeout(nativeFallback);reveal();};
  const initialize=()=>{
   if(playerInitialized||!window.YT?.Player)return;
   playerInitialized=true;
   new window.YT.Player(heroFrame,{
    events:{
     onReady:event=>{event.target.mute();event.target.playVideo();if(event.target.getPlayerState()===1)showPlayer();},
     onStateChange:event=>{if([0,1,2].includes(event.data))showPlayer();},
     onAutoplayBlocked:showPlayer,
     onError:showPlayer
    }
   });
  };
  if(window.YT?.Player)initialize();
  else{
   const previous=window.onYouTubeIframeAPIReady;
   window.onYouTubeIframeAPIReady=()=>{try{if(typeof previous==='function')previous();}finally{initialize();}};
   if(!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')){
    const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;
    script.addEventListener('error',showPlayer);document.head.append(script);
   }
  }
 }

 const form=root.querySelector('#use-case-filters');
 if(form){
  const search=form.querySelector('[name="q"]'),type=form.querySelector('[name="kind"]');
  const cards=[...root.querySelectorAll('.uc-channel-card')],groups=[...root.querySelectorAll('[data-case-group]')];
  const normalize=value=>value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
  const update=()=>{
   const terms=normalize(search.value.trim()).split(/\s+/).filter(Boolean);
   let count=0;
   cards.forEach(card=>{const text=normalize(card.dataset.search);const match=terms.every(term=>text.includes(term))&&(!type.value||card.dataset.kind===type.value);card.hidden=!match;if(match)count++;});
   groups.forEach(group=>group.hidden=![...group.querySelectorAll('.uc-channel-card')].some(card=>!card.hidden));
   root.querySelector('#use-case-empty').hidden=count!==0;
   form.querySelector('[role="status"]').textContent=`${count} of ${cards.length} use cases`;
  };
  form.hidden=false;
  form.addEventListener('submit',e=>e.preventDefault());
  form.addEventListener('input',update);form.addEventListener('change',update);
  const clear=()=>{form.reset();search.focus();};
  form.addEventListener('reset',()=>{search.value='';type.value='';update();});
  root.querySelector('[data-clear-case-filters]').addEventListener('click',clear);
  update();
 }
 root.addEventListener('click',e=>{
  const play=e.target.closest('[data-video-play]');
  if(play){
   const shell=play.closest('[data-video-id]'),id=shell.dataset.videoId;
   if(!/^[A-Za-z0-9_-]{11}$/.test(id))return;
   const frame=document.createElement('iframe');
   frame.src=`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
   frame.title=shell.dataset.videoTitle;
   frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
   frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';
   shell.replaceChildren(frame);frame.focus();
   event('use_case_video_play',{video_id:id});return;
  }
  const card=e.target.closest('.uc-channel-card');
  if(card&&e.target.closest('a'))event('use_case_card_click',{use_case_id:card.dataset.useCase,card_position:Number(card.dataset.position),destination_type:'detail'});
 });
})();
