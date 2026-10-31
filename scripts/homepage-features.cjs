const {esc}=require('../shared/content.cjs');
const image=require('./use-case-media.cjs');
const {titleHTML}=require('../shared/intro-formatting.cjs');
// Editorial selection, never popularity or recency. Unselected content is not a fallback.
const TITLE='Find News';
const order=(a,b)=>(a.homepageOrder||0)-(b.homepageOrder||0)||String(a.detailUrl).localeCompare(String(b.detailUrl));
function select(useCases=[],blogs=[]){
 const chosen=records=>records.filter(r=>r.featureOnHomepage===true&&r.publishedAt).sort(order).slice(0,2);
 return [...chosen(useCases),...chosen(blogs)].sort(order);
}
function section(useCases,blogs){
 const records=select(useCases,blogs);if(!records.length)return '';
 return `<section class="section container home-find-news" id="find-news" aria-labelledby="find-news-title"><div class="section-heading"><span class="eyebrow">BLOGS &amp; USE CASES</span><h2 id="find-news-title">${TITLE}</h2><p>Discover the latest blogs and use cases.</p></div><div class="home-news-grid">${records.map(r=>{
  const blog=r.contentType==='blog',label=blog?'Blog':'Use case',cta=blog?'Read article':'Explore use case';
  return `<article class="home-news-card" data-home-feature="${esc(r.documentId||r.id)}" data-content-kind="${blog?'blog':'use-case'}"><a class="home-news-cover" href="${esc(r.detailUrl)}" aria-label="${esc(cta+': '+r.name)}">${image(r,{sizes:'(max-width: 600px) calc(100vw - 40px), (max-width: 1100px) 45vw, 22vw'})}</a><div class="home-news-copy"><span class="home-news-kind">${label}</span><h3><a href="${esc(r.detailUrl)}">${titleHTML(r)}</a></h3><p class="home-news-summary">${esc(r.summary)}</p><a class="text-link home-news-link" href="${esc(r.detailUrl)}">${cta} <span aria-hidden="true">↗</span><span class="home-news-sr">: ${esc(r.name)}</span></a></div></article>`;
 }).join('')}</div></section>`;
}
function inject(html,useCases,blogs){
 const content=section(useCases,blogs);if(!content)return html;
 const marker=/<section\b[^>]*\bid="solutions"[^>]*>/i;
 if(!marker.test(html))return html;
 return html.replace(marker,match=>content+match).replace('</head>','<link rel="stylesheet" href="/home-features.css"></head>');
}
module.exports={TITLE,select,section,inject};
