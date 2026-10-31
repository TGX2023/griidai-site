const {esc,plain,safeLink}=require('./content.cjs');
const TEXT_FIELDS={title:200,description:1000,focusPhrase:200};
function text(value,max,label){if(value==null)return '';if(typeof value!=='string'||value.length>max||/<\/?[a-z][^>]*>/i.test(value))throw Error(`${label}: use plain text, up to ${max} characters.`);return value.trim();}
function webLink(value,{absolute=false,canonical=false}={}){
 if(!value)return '';
 if(!safeLink(value))throw Error('Use a valid HTTP or HTTPS link. Industries and Workflows links are unavailable.');
 if(!/^https?:\/\//i.test(value)&&!(value.startsWith('/')&&!value.startsWith('//')&&!absolute))throw Error('Use a full HTTP or HTTPS URL, or an internal link starting with /.');
 const u=new URL(value,'https://griidai.com');
 if(!['http:','https:'].includes(u.protocol)||(absolute&&!/^https?:\/\//i.test(value))||(canonical&&u.hash))throw Error(canonical?'Canonical URL must be a full HTTP or HTTPS URL without a fragment.':'Use an HTTP or HTTPS link.');
 return value;
}
function normalizeSEO(value){
 if(value==null)value={};if(typeof value!=='object'||Array.isArray(value))throw Error('Invalid SEO settings.');
 const result={};for(const [key,max]of Object.entries(TEXT_FIELDS))result[key]=text(value[key],max,key);
 // Remember intentional editing blanks in the dashboard without emitting empty public metadata.
 result.manualFields=Array.isArray(value.manualFields)?['title','description'].filter(key=>value.manualFields.includes(key)):[];
 if(value.relatedQuestions!=null&&(!Array.isArray(value.relatedQuestions)||value.relatedQuestions.length>10))throw Error('Add up to ten reader questions.');
 result.relatedQuestions=(value.relatedQuestions||[]).map(q=>text(q,300,'Reader question')).filter(Boolean);
 result.related=require('./related-content.cjs').normalizeRelated(value.related);
 // Retired overrides must not affect existing published records or API writes.
 Object.assign(result,{shareTitle:'',shareDescription:'',imageAlt:'',canonicalUrl:'',allowIndexing:true,followLinks:true});
 return result;
}
function normalizeEditorial(value){
 if(value==null)value={};if(typeof value!=='object'||Array.isArray(value))throw Error('Invalid contributor details.');
 const person=(p={})=>({name:text(p?.name,160,'Contributor name'),url:webLink(text(p?.url,2000,'Contributor URL')),bio:text(p?.bio,800,'Contributor bio')});
 if(value.sources!=null&&(!Array.isArray(value.sources)||value.sources.length>30))throw Error('Add up to 30 sources.');
 const sources=(value.sources||[]).map((s,i)=>({id:/^[\w-]{1,100}$/.test(s?.id||'')?s.id:'source-'+i,title:text(s?.title,300,'Source title'),url:webLink(text(s?.url,2000,'Source URL'))})).filter(s=>s.title||s.url);
 const uploadDate=text(value.videoUploadDate,10,'Video upload date');
 if(uploadDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(uploadDate)||Number.isNaN(Date.parse(uploadDate))||new Date(uploadDate).toISOString().slice(0,10)!==uploadDate))throw Error('Enter the actual YouTube upload date as YYYY-MM-DD.');
 let duration=value.videoDurationSeconds;if(duration===''||duration==null)duration=null;
 else if(!Number.isInteger(+duration)||+duration<=0||+duration>604800)throw Error('Video duration must be a positive number of seconds.');
 else duration=+duration;
 return {author:person(value.author),reviewer:person(value.reviewer),sources,videoUploadDate:uploadDate,videoDurationSeconds:duration};
}
function normalizeUseCaseEditorial(value){
 // Contributors and source lists are retired for Use Cases; keep video facts only.
 return normalizeEditorial({videoUploadDate:value?.videoUploadDate,videoDurationSeconds:value?.videoDurationSeconds});
}
function validateEditorialPublication(value){
 const e=normalizeEditorial(value);
 for(const person of [e.author,e.reviewer])if((person.url||person.bio)&&!person.name)throw Error('Add the contributor name or clear their profile and bio.');
 if(e.sources.some(source=>!source.title||!source.url))throw Error('Each source needs a title and a link before publishing.');
 return e;
}
const excerpt=(value,max=160)=>{const v=String(value||'').replace(/\s+/g,' ').trim();if(v.length<=max)return v;const cut=v.slice(0,max-1),space=cut.lastIndexOf(' ');return cut.slice(0,space>max*.65?space:cut.length)+'…';};
const absolute=(value,siteURL)=>{if(!value)return '';try{webLink(value);return new URL(value,siteURL).href;}catch{return '';}};
function effectiveSEO(record,{siteURL}){
 const settings=normalizeSEO(record.seo);
 const pageURL=new URL(record.detailUrl||'/use-cases/',siteURL).href;
 const generatedTitle=record.name?record.name+' | GriidAi':'Geospatial Use Cases | GriidAi';
 const generatedDescription=excerpt(record.summary||(record.parts||[]).map(p=>plain(p.content)).join(' '));
 const title=settings.title||generatedTitle,description=settings.description||generatedDescription;
 const media=record.sharingImage||record.cover||{};
 return {...settings,title,description,shareTitle:record.name||generatedTitle,shareDescription:generatedDescription,canonical:pageURL,pageURL,image:{url:absolute(media.url,siteURL),width:media.width,height:media.height,mime:media.mime,alt:media.alt||media.alternativeText||(!record.sharingImage?record.cover?.alt:'')||record.name||'GriidAi'},editorial:record.contentType==='blog'?normalizeEditorial(record.editorial):normalizeUseCaseEditorial(record.editorial)};
}
const isoDate=value=>{const n=Date.parse(value);return Number.isFinite(n)?new Date(n).toISOString():undefined;};
function schema(record,{siteURL,records=[],hub=false}={}){
 const blog=record.contentType==='blog';
 const seo=effectiveSEO(record,{siteURL}),url=seo.canonical,base=new URL('/',siteURL).href;
 const organization={'@type':'Organization','@id':base+'#organization',name:'GriidAi',url:base,logo:new URL('/assets/logo.png',siteURL).href};
 const person=p=>p.name?{'@type':'Person',name:p.name,...(p.url?{url:absolute(p.url,siteURL)}:{}),...(p.bio?{description:p.bio}:{})}:undefined;
 const webpage={'@type':hub?'CollectionPage':'WebPage','@id':url+'#webpage',url,name:record.name||seo.title,description:seo.description,publisher:{'@id':organization['@id']},inLanguage:'en',...(isoDate(record.publishedAt)?{datePublished:isoDate(record.publishedAt)}:{}),...(isoDate(record.updatedAt)?{dateModified:isoDate(record.updatedAt)}:{})};
 if(record.cover?.url)webpage.primaryImageOfPage={'@type':'ImageObject',url:absolute(record.cover.url,siteURL)};
 const e=seo.editorial;if(e.author.name)webpage.author=person(e.author);if(e.reviewer.name)webpage.reviewedBy=person(e.reviewer);
 if(blog&&webpage.author&&record.authorPhoto?.url){const url=absolute(record.authorPhoto.url,siteURL);if(url)webpage.author.image=url;}
 const sources=e.sources.filter(s=>s.title&&s.url);if(sources.length)webpage.citation=sources.map(s=>({'@type':'CreativeWork',name:s.title,url:absolute(s.url,siteURL)}));
 const breadcrumbs={'@type':'BreadcrumbList','@id':url+'#breadcrumbs',itemListElement:[{name:'Home',item:base},{name:blog?'Blogs':'Use Cases',item:new URL(blog?'/blogs/':'/use-cases/',siteURL).href},...(!hub?[{name:record.name,item:url}]:[])].map((item,i)=>({'@type':'ListItem',position:i+1,...item}))};
 webpage.breadcrumb={'@id':breadcrumbs['@id']};
 const graph=[organization,webpage,breadcrumbs];
 if(blog&&!hub){const article={'@type':'BlogPosting','@id':url+'#article',headline:record.name,description:record.summary,url,mainEntityOfPage:{'@id':webpage['@id']},publisher:{'@id':organization['@id']},inLanguage:'en',...(webpage.author?{author:webpage.author}:{}),...(webpage.datePublished?{datePublished:webpage.datePublished}:{}),...(webpage.dateModified?{dateModified:webpage.dateModified}:{}),...(record.cover?.url?{image:absolute(record.cover.url,siteURL)}:{})};graph.push(article);webpage.mainEntity={'@id':article['@id']};}
 if(hub)webpage.mainEntity={'@type':'ItemList',itemListElement:records.map((r,i)=>({'@type':'ListItem',position:i+1,name:r.name,url:new URL(r.detailUrl,siteURL).href}))};
 if(!hub&&record.mediaType==='video'&&record.video?.id&&e.videoUploadDate&&record.cover?.url){
  const video={'@type':'VideoObject','@id':url+'#video',name:record.video.title||record.name,description:record.summary||seo.description,thumbnailUrl:[absolute(record.cover.url,siteURL)],uploadDate:e.videoUploadDate,embedUrl:`https://www.youtube.com/embed/${record.video.id}`,url:record.video.url,...(e.videoDurationSeconds?{duration:'PT'+e.videoDurationSeconds+'S'}:{})};
  graph.push(video);webpage.video={'@id':video['@id']};
 }
 return {'@context':'https://schema.org','@graph':graph};
}
const safeJSON=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
function metadata(record,{siteURL,preview=false,records=[],hub=false}={}){
 const seo=effectiveSEO(record,{siteURL});
 const tag=(name,value,property=false)=>`<meta ${property?'property':'name'}="${name}" content="${esc(value)}">`;
 let html=`<title>${esc(seo.title)}</title><link rel="canonical" href="${esc(seo.canonical)}">`+
 tag('description',seo.description)+tag('robots',preview?'noindex,nofollow':`${seo.allowIndexing?'index':'noindex'},${seo.followLinks?'follow':'nofollow'}`)+
 tag('og:type',record.contentType==='blog'&&!hub?'article':'website',true)+tag('og:site_name','GriidAi',true)+tag('og:title',seo.shareTitle,true)+tag('og:description',seo.shareDescription,true)+tag('og:url',seo.canonical,true)+
 tag('twitter:card',seo.image.url?'summary_large_image':'summary')+tag('twitter:title',seo.shareTitle)+tag('twitter:description',seo.shareDescription);
 if(seo.image.url){html+=tag('og:image',seo.image.url,true)+tag('og:image:alt',seo.image.alt,true)+tag('twitter:image',seo.image.url)+tag('twitter:image:alt',seo.image.alt);for(const key of ['width','height'])if(Number.isFinite(seo.image[key]))html+=tag('og:image:'+key,seo.image[key],true);if(seo.image.mime)html+=tag('og:image:type',seo.image.mime,true);}
 if(seo.editorial.author.name)html+=tag('author',seo.editorial.author.name);
 return html+`<script type="application/ld+json">${safeJSON(schema(record,{siteURL,records,hub}))}</script>`;
}
function credits(record,{siteURL}={}){
 if(record.contentType!=='blog')return '';
 const e=normalizeEditorial(record.editorial),people=[];
 const renderPerson=(p,label)=>{if(!p.name)return '';const url=absolute(p.url,siteURL||'https://griidai.com');return `<div class="uc-contributor"><p><strong>${label}</strong> ${url?`<a href="${esc(url)}" rel="noopener noreferrer">${esc(p.name)}</a>`:esc(p.name)}</p>${p.bio?`<p>${esc(p.bio)}</p>`:''}</div>`;};
 people.push(renderPerson(e.author,'Written by'),renderPerson(e.reviewer,'Reviewed by'));
 const sources=e.sources.filter(s=>s.title&&s.url);
 if(!people.some(Boolean)&&!sources.length)return '';
 const modified=isoDate(record.updatedAt);
 return `${people.join('')}${modified?`<p class="uc-content-date">Updated <time datetime="${modified}">${modified.slice(0,10)}</time></p>`:''}${sources.length?`<h3>Sources</h3><ul class="uc-source-list">${sources.map(s=>`<li><a href="${esc(absolute(s.url,siteURL||'https://griidai.com'))}" target="_blank" rel="noopener noreferrer">${esc(s.title)} <span aria-hidden="true">↗</span></a></li>`).join('')}</ul>`:''}`;
}
function includeInSitemap(record,{siteURL}){const seo=effectiveSEO(record,{siteURL});return seo.allowIndexing&&seo.canonical===seo.pageURL;}
module.exports={normalizeSEO,normalizeEditorial,normalizeUseCaseEditorial,validateEditorialPublication,effectiveSEO,metadata,schema,credits,includeInSitemap,excerpt,absolute,safeJSON};
