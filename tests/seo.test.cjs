const test=require('node:test'),assert=require('node:assert/strict');
const {normalizeSEO,normalizeEditorial,validateEditorialPublication,effectiveSEO,metadata,schema,credits,includeInSitemap}=require('../shared/seo.cjs');
const siteURL='https://www.griidai.com';
const record={name:'Solar potential',summary:'Inspect roofs and solar exposure.',detailUrl:'/use-cases/solar/',mediaType:'video',cover:{url:'https://cdn.example.com/cover.webp',alt:'A rooftop map',width:1280,height:720},video:{id:'8vB3U31Apqw',title:'Solar demo',url:'https://www.youtube.com/watch?v=8vB3U31Apqw'},updatedAt:'2026-10-26T12:00:00Z',publishedAt:'2026-10-25T10:00:00Z'};
test('metadata defaults follow content; manual overrides persist and empty fields reset to automatic',()=>{
 assert.equal(effectiveSEO(record,{siteURL}).title,'Solar potential | GriidAi');
 const r={...record,seo:{title:'Custom title',description:'Custom description',shareTitle:'Social title'}};
 const changed=effectiveSEO({...r,name:'Changed name',summary:'Changed summary'},{siteURL});assert.equal(changed.title,'Custom title');assert.equal(changed.description,'Custom description');assert.equal(changed.shareTitle,'Changed name');assert.equal(changed.shareDescription,'Changed summary');
 const reset=effectiveSEO({...r,seo:{title:'',description:''}},{siteURL});assert.equal(reset.title,'Solar potential | GriidAi');assert.equal(reset.description,record.summary);assert.equal(reset.image.url,record.cover.url);
 const edited=normalizeSEO({title:'',description:'',manualFields:['title','description','untrusted']});assert.deepEqual(edited.manualFields,['title','description']);
 assert.deepEqual(normalizeSEO(edited).manualFields,edited.manualFields);
 assert.equal(effectiveSEO({...record,seo:edited},{siteURL}).title,'Solar potential | GriidAi');
});
test('sharing images remain configurable; retired controls cannot disable published indexing and previews stay private',()=>{
 const r={...record,seo:{shareTitle:'Share me',imageAlt:'Social map',allowIndexing:false,followLinks:false},sharingImage:{url:'https://cdn.example.com/social.png',width:1200,height:630,mime:'image/png'}};
 const html=metadata(r,{siteURL});assert.match(html,/content="index,follow"/);assert.match(html,/property="og:image" content="https:\/\/cdn.example.com\/social.png"/);assert.match(html,/twitter:image:alt" content="Solar potential"/);assert.equal((html.match(/<title>/g)||[]).length,1);
 assert.match(metadata({...record,seo:{allowIndexing:true}},{siteURL,preview:true}),/name="robots" content="noindex,nofollow"/);
});
test('published pages use their own canonical URL and remain eligible for the sitemap despite retired overrides',()=>{
 assert.equal(includeInSitemap(record,{siteURL}),true);assert.equal(includeInSitemap({...record,seo:{allowIndexing:false}},{siteURL}),true);assert.equal(includeInSitemap({...record,seo:{canonicalUrl:'https://example.org/original/'}},{siteURL}),true);
 const seo=effectiveSEO({...record,seo:{canonicalUrl:'https://example.org/original/',shareTitle:'Stale social title',shareDescription:'Stale description',allowIndexing:false,followLinks:false}},{siteURL});assert.equal(seo.canonical,siteURL+record.detailUrl);assert.equal(seo.shareTitle,record.name);assert.equal(seo.shareDescription,record.summary);assert.equal(seo.allowIndexing,true);assert.equal(seo.followLinks,true);
});
test('retired Use Case contributors stay absent, blog authors stay present and video dates are never invented',()=>{
 assert.ok(!schema(record,{siteURL})['@graph'].some(n=>n['@type']==='VideoObject'));
 const r={...record,editorial:{author:{name:'Example Author',url:'https://example.org/author'},reviewer:{name:'Example Reviewer'},sources:[{title:'Dataset documentation',url:'https://example.org/data'}],videoUploadDate:'2026-10-01',videoDurationSeconds:120}};
 const graph=schema(r,{siteURL})['@graph'],page=graph.find(n=>n['@type']==='WebPage'),video=graph.find(n=>n['@type']==='VideoObject');
 assert.equal(page.author,undefined);assert.equal(page.reviewedBy,undefined);assert.equal(page.citation,undefined);assert.equal(video.uploadDate,'2026-10-01');assert.equal(video.duration,'PT120S');
 assert.equal(credits(r,{siteURL}),'');assert.doesNotMatch(metadata(r,{siteURL}),/Example Author|Example Reviewer|Dataset documentation|name="author"/);
 const blogPage=schema({...r,contentType:'blog'},{siteURL})['@graph'].find(n=>n['@type']==='WebPage');assert.equal(blogPage.author.name,'Example Author');assert.match(metadata({...r,contentType:'blog'},{siteURL}),/name="author" content="Example Author"/);
 assert.ok(!schema({...r,mediaType:'image'},{siteURL})['@graph'].some(n=>n['@type']==='VideoObject'));
});
test('SEO and source inputs reject HTML, unsafe links and invalid dates; JSON-LD cannot close its script',()=>{
 assert.throws(()=>normalizeSEO({title:'<script>alert(1)</script>'}));assert.equal(normalizeSEO({canonicalUrl:'javascript:evil()'}).canonicalUrl,'');assert.throws(()=>normalizeEditorial({sources:[{title:'Test',url:'/industries/'}]}));assert.throws(()=>normalizeEditorial({videoUploadDate:'2026-02-31'}));assert.throws(()=>validateEditorialPublication({sources:[{title:'Incomplete'}]}));
 const html=metadata({...record,name:'</script><script>alert(1)</script>'},{siteURL});assert.equal((html.match(/<script/g)||[]).length,1);assert.match(html,/\\u003c\/script/);
});
test('runtime canonical, sharing image and robots URLs use deployment SITE_URL',()=>{
 const {staticURLs,robots}=require('../scripts/runtime-seo.cjs');
 const html=staticURLs('<head><link rel="canonical" href="https://old.example/platform/"><meta property="og:url" content="https://old.example/platform/"><meta property="og:image" content="https://old.example/assets/logo.png"></head>','/platform/index.html',siteURL);
 assert.doesNotMatch(html,/old.example/);assert.match(html,/href="https:\/\/www.griidai.com\/platform\/"/);assert.match(robots(siteURL),/Sitemap: https:\/\/www.griidai.com\/sitemap.xml/);assert.match(robots(siteURL),/Disallow: \/preview\//);
});
