const {normalizeTags,tagsHTML}=require('../shared/tags.cjs');
const {esc,doc,youtubeId,slugify}=require('../shared/content.cjs');
const {normalizeParts,legacyParts}=require('../shared/content-parts.cjs');
const {titleHTML,summaryHTML}=require('../shared/intro-formatting.cjs');
const {normalizeSEO,normalizeUseCaseEditorial,absolute}=require('../shared/seo.cjs');
const pages=require('./cms-pages.cjs');const ui=require('./use-case-ui.cjs');const renderDetail=require('./render-use-case-detail.cjs');const image=require('./use-case-media.cjs');
const text=(v,max=2000)=>typeof v==='string'?v.slice(0,max):'';
function snapshotRecord(data,publicURL){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid preview data');
 const media=Array.isArray(data.cover)?data.cover[0]:data.cover;
 const videoId=youtubeId(data.videoUrl);const focus=require('../shared/cover-focus.cjs').focus(data.coverFocus);
 let coverURL='';if(typeof media?.url==='string'){try{const u=new URL(media.url,publicURL);if(['http:','https:'].includes(u.protocol)&&!u.username&&!u.password)coverURL=u.href;}catch{}}
 if(!coverURL&&data.mediaType!=='image'&&videoId)coverURL=`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
 const list=name=>(Array.isArray(data[name])?data[name]:[]).slice(0,100).map(i=>doc(i?.content));
 const name=text(data.title,160)||'Your use case title';const slug=slugify(data.slug||name)||'new';
 const sharing=Array.isArray(data.sharingImage)?data.sharingImage[0]:data.sharingImage;
 return {id:slug,name,tags:normalizeTags(data.tags),titleFormatting:data.titleFormatting,summaryFormatting:data.summaryFormatting,kind:text(data.classification,80)||'Full demo',summary:text(data.summary,1000),question:text(data.question,500),overview:doc(data.overview),seo:normalizeSEO(data.seo),editorial:normalizeUseCaseEditorial(data.editorial),updatedAt:data.updatedAt,publishedAt:data.publishedAt,sharingImage:sharing?{url:absolute(sharing.url,publicURL),width:sharing.width,height:sharing.height,mime:sharing.mime,alt:text(sharing.alternativeText,500)}:null,parts:normalizeParts(data.parts??legacyParts(data.question,data.overview),{publicURL}),contentOrder:data.contentOrder,mediaType:data.mediaType==='image'?'image':'video',detailUrl:`/use-cases/${slug}/`,inputs:list('inputs'),steps:list('steps'),outputs:list('outputs'),review:list('review'),cover:{url:coverURL,width:1280,height:720,alt:text(data.coverAlt,500)||name,focus},video:{id:videoId||'',url:videoId?`https://www.youtube.com/watch?v=${videoId}`:'https://www.youtube.com/',title:text(data.videoTitle,300)||name}};
}
function renderSnapshot(data,{siteURL,publicURL,relatedCatalog=[]}){
 const r=snapshotRecord(data,publicURL);
 const card=`<section class="container cms-live-card" id="live-card-preview" hidden><h2>Card preview</h2><article class="uc-question-card uc-channel-card"><div class="uc-card-image">${image(r,{eager:true})}</div><div class="uc-card-copy"><span class="hub-tag">${esc(r.kind)}</span><h3>${titleHTML(r)}</h3><div class="cms-card-summary uc-part-copy">${summaryHTML(r)}</div>${tagsHTML(r)}<span class="text-link">Explore use case ↗</span></div></article></section>`;
 return pages.page(`<section class="container cms-live-notice"><strong>Unsaved preview</strong><span>Only you can see these edits. Save and Publish remain separate.</span><button type="button" data-live-card-toggle>Card preview</button></section>${card}${renderDetail(ui,r,{siteURL,relatedCatalog})}`,{metadataRecord:r,route:r.detailUrl,siteURL,preview:true,records:relatedCatalog.filter(r=>r.contentType!=='blog')});
}
function canvas({siteURL,cmsOrigin}){
 const html=pages.page('<section class="hub-section"><div class="container"><h1>Live preview</h1><p>Waiting for the editor…</p></div></section>',{siteURL,preview:true});
 return html.replace('</body>',()=>`<script src="/cms-live-preview.js" data-cms-origin="${esc(cmsOrigin)}" defer></script></body>`);
}
module.exports={snapshotRecord,renderSnapshot,canvas};
