const image=require('./use-case-media.cjs');
module.exports=function renderUseCaseDetail(ui,record){
 const {esc,hero,section,paragraphs,button,link}=ui;
 const exercise=record.kind==='Practice exercise';
 const outline=exercise||record.kind==='Short overview'||record.kind==='Academy case study';
 const art=`<figure class="uc-hero-art uc-channel-art"><a href="#watch-example" aria-label="Watch the source video for ${esc(record.name)}">${image(record,{eager:true})}<span class="uc-thumbnail-play" aria-hidden="true">▶</span></a><figcaption><strong>${esc(record.kind)}</strong><span>English video</span></figcaption></figure>`;
 let introduction=hero(record.name,record.name,record.summary,button('Watch the Video','#watch-example')+button('All Use Cases','/use-cases/',false),art,record.kind);
 introduction=introduction.replace('<span>'+esc(record.name)+'</span></div>',`<a href="/use-cases/">Use Cases</a><span aria-hidden="true">/</span><span>${esc(record.name)}</span></div>`);
 const list=items=>`<ul class="uc-detail-list">${items.map(item=>`<li>${esc(item)}</li>`).join('')}</ul>`;
 const topics=record.topics?.length?`<div class="uc-video-topics"><h3>${exercise?'Scenarios in this exercise':'Topics in this video'}</h3><div>${record.topics.map(topic=>`<article><h4>${esc(topic.title)}</h4><p>${esc(topic.description)}</p></article>`).join('')}</div></div>`:'';
 const intro=`<div class="uc-detail-prose">${paragraphs(record.overview)}</div>${topics}`;
 const steps=`<ol class="uc-proof-sequence">${record.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol>`;
 const method=`<div class="uc-detail-method"><div><h3>${exercise?'Inputs to identify':'Data and inputs'}</h3>${list(record.inputs)}</div><div><h3>${outline?'Suggested analysis plan':'Analysis described in the video'}</h3>${steps}</div></div>`;
 const outputs=`<div class="uc-detail-method"><div><h3>${outline?'Proposed deliverables':'Outputs described'}</h3>${list(record.outputs)}</div><div><h3>What to review</h3>${list(record.review)}</div></div>`;
 const video=`<div class="uc-video-shell" data-video-id="${record.video.id}" data-video-title="${esc(record.video.title)}"><button class="uc-video-play" type="button" data-video-play aria-label="Play ${esc(record.video.title)}">${image(record,{sizes:'(max-width: 1000px) 100vw, 960px'})}<span><b aria-hidden="true">▶</b>Play source video</span></button><noscript><style>.uc-video-play{display:none}</style><p>Use the YouTube link below to watch this video.</p></noscript></div><div class="uc-video-source"><div><span class="hub-tag">${esc(record.kind)}</span><p>${esc(record.video.title)}</p></div><a class="text-link" href="${record.video.url}" target="_blank" rel="noopener noreferrer">Watch on YouTube <span aria-hidden="true">↗</span><span class="uc-visually-hidden"> (opens in a new tab)</span></a></div>`;
 return introduction+
 section('use-case-overview','',record.question,intro)+
 section('watch-example','Source video',exercise?'Explore the Academy exercise':'Watch the example',video,{pale:true})+
 section('use-case-method','','From question to analysis',method)+
 section('use-case-results','',outline?'Define the evidence you need':'Understand the output',outputs,{pale:true})+
 `<section class="hub-section uc-detail-return"><div class="container"><div><h2>Explore another spatial question</h2>${link('All Use Cases','/use-cases/')}</div><div class="actions">${button('Start for Free','https://app.griidai.com')}${button('Talk to Sales','/contact-sales.html',false)}</div></div></section>`;
};
