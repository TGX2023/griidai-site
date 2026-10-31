const {tagsHTML}=require('../shared/tags.cjs');
const image=require('./use-case-media.cjs');
const {renderParts,normalizeParts,legacyParts}=require('../shared/content-parts.cjs');
const {pageOrder}=require('../shared/page-order.cjs');
const {normalizeUseCaseEditorial}=require('../shared/seo.cjs');
const {relatedHTML}=require('../shared/related-content.cjs');
const {titleHTML,summaryHTML}=require('../shared/intro-formatting.cjs');
module.exports=function renderUseCaseDetail(ui,record,{siteURL,relatedCatalog=[]}={}){
 const {esc,hero,section,paragraphs,button,link}=ui;
 const isVideo=record.mediaType!=='image';
 const editorial=normalizeUseCaseEditorial(record.editorial);
 const rich=ui.rich||(value=>Array.isArray(value)?value.map(v=>`<p>${ui.esc(v)}</p>`).join(''):`<p>${ui.esc(value)}</p>`);
 const videoArt=isVideo?`<figure class="uc-hero-art uc-channel-art"><a href="#watch-example" aria-label="Watch the source video for ${esc(record.name)}">${image(record,{eager:true})}<span class="uc-thumbnail-play" aria-hidden="true">▶</span></a><figcaption><strong>${esc(record.kind)}</strong><span>English video</span></figcaption></figure>`:'';
 const art=isVideo?videoArt:`<figure class="uc-hero-art uc-channel-art">${image(record,{eager:true})}<figcaption><strong>${esc(record.kind)}</strong></figcaption></figure>`;
 let introduction=hero(record.name,record.name,record.summary,(isVideo?button('Watch the Video','#watch-example'):'')+button('All Use Cases','/use-cases/',false),art,record.kind,{title:titleHTML(record),summary:record.summaryFormatting?summaryHTML(record):null,tags:tagsHTML(record)});
 introduction=introduction.replace('<span>'+esc(record.name)+'</span></div>',`<a href="/use-cases/">Use Cases</a><span aria-hidden="true">/</span><span>${esc(record.name)}</span></div>`);
 const list=items=>`<ul class="uc-detail-list">${items.map(item=>`<li>${rich(item)}</li>`).join('')}</ul>`;
 const parts=normalizeParts(record.parts??legacyParts(record.question,record.overview));
 const partsSection=(id,items,extra='')=>items.length||extra?`<section class="hub-section uc-content-parts" id="${id}"><div class="container">${renderParts(items)}${extra}</div></section>`:'';
 const steps=`<ol class="uc-proof-sequence">${record.steps.map(step=>`<li>${rich(step)}</li>`).join('')}</ol>`;
 const method=`<div class="uc-detail-method"><div><h3>Data and inputs</h3>${list(record.inputs)}</div><div><h3>${isVideo?'Analysis described in the video':'Analysis described'}</h3>${steps}</div></div>`;
 const outputs=`<div class="uc-detail-method"><div><h3>Outputs described</h3>${list(record.outputs)}</div><div><h3>What to review</h3>${list(record.review)}</div></div>`;
 const video=isVideo?`<div class="uc-video-shell" data-video-id="${record.video.id}" data-video-title="${esc(record.video.title)}"><button class="uc-video-play" type="button" data-video-play aria-label="Play ${esc(record.video.title)}">${image(record,{sizes:'(max-width: 1000px) 100vw, 960px'})}<span><b aria-hidden="true">▶</b>Play source video</span></button><noscript><style>.uc-video-play{display:none}</style><p>Use the YouTube link below to watch this video.</p></noscript></div><div class="uc-video-source"><div><span class="hub-tag">${esc(record.kind)}</span><p>${esc(record.video.title)}</p></div><a class="text-link" href="${record.video.url}" target="_blank" rel="noopener noreferrer">Watch on YouTube <span aria-hidden="true">↗</span><span class="uc-visually-hidden"> (opens in a new tab)</span></a></div>`:'';
 const fixed={
  'section:hero':introduction,
  'section:video':isVideo?section('watch-example','Source video','Watch the example',video+(editorial.videoUploadDate?`<p class="uc-content-date">Uploaded <time datetime="${editorial.videoUploadDate}">${editorial.videoUploadDate}</time>${editorial.videoDurationSeconds?` · Duration: ${editorial.videoDurationSeconds} seconds`:''}</p>`:''),{pale:true}):'',
  'section:method':section('use-case-method','','From question to analysis',method),
  'section:results':section('use-case-results','','Understand the output',outputs,{pale:true}),
  'section:return':relatedHTML(record,relatedCatalog)+`<section class="hub-section uc-detail-return"><div class="container"><div><h2>Explore another spatial question</h2>${link('All Use Cases','/use-cases/')}</div><div class="actions">${button('Start for Free','https://app.griidai.com')}${button('Talk to Sales','/contact-sales.html',false)}</div></div></section>`
 };
 const byId=new Map(parts.map(part=>['part:'+part.id,part]));
 let output='',pending=[],groups=0,seenVideo=false,hadAbove=false,hadBelow=false;
 const flush=()=>{if(!pending.length)return;let id='use-case-parts-'+(++groups);if(seenVideo&&!hadBelow){id='use-case-content-after-video';hadBelow=true;}else if(!seenVideo&&!hadAbove){id='use-case-overview';hadAbove=true;}output+=partsSection(id,pending);pending=[];};
 for(const key of pageOrder(parts,record.contentOrder,{isVideo})) {
  if(byId.has(key)){pending.push(byId.get(key));continue;}
  if(!fixed[key])continue;
  flush();output+=fixed[key];if(key==='section:video')seenVideo=true;
 }
 flush();return output;
};
