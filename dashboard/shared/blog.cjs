const {plain,safeLink}=require('./content.cjs');
const {partDoc}=require('./content-parts.cjs');
function linkedIn(value){
 if(value==null||value==='')return '';
 if(typeof value!=='string'||value.length>500)throw Error('Enter a valid LinkedIn profile URL.');
 const u=new URL(value);if(u.protocol!=='https:'||!/(^|\.)linkedin\.com$/i.test(u.hostname)||!/^\/in\/[^/]+\/?$/.test(u.pathname)||u.username||u.password)throw Error('Use an HTTPS LinkedIn personal profile: https://www.linkedin.com/in/your-name/.');
 u.search='';u.hash='';return u.href;
}
function validate(data){
 if(Object.hasOwn(data,'tags'))data.tags=require('./tags.cjs').normalizeTags(data.tags);
 for(const [key,max] of [['title',240],['summary',1200],['category',80],['coverAlt',500],['authorName',160]])if(data[key]!=null&&(typeof data[key]!=='string'||data[key].length>max||/<\/?[a-z][^>]*>/i.test(data[key])))throw Error(`${key}: use plain text, up to ${max} characters.`);
 if(Object.hasOwn(data,'body'))data.body=partDoc(data.body);
 if(Object.hasOwn(data,'authorLinkedIn'))data.authorLinkedIn=linkedIn(data.authorLinkedIn);
 if(data.publicationDate&&(!/^\d{4}-\d{2}-\d{2}T/.test(data.publicationDate)||Number.isNaN(Date.parse(data.publicationDate))))throw Error('Choose a valid original publication date.');
 if(data.sourceUrl){const u=new URL(data.sourceUrl);if(!['http:','https:'].includes(u.protocol)||!safeLink(data.sourceUrl))throw Error('Use a valid source URL.');}
 if(data.coverFocus){const {x,y,zoom=1}=data.coverFocus;if(![x,y].every(n=>Number.isFinite(n)&&n>=0&&n<=100)||!Number.isFinite(zoom)||zoom<1||zoom>3)throw Error('Invalid cover crop.');}
 return data;
}
function publication(data){validate(data);for(const key of ['title','slug','summary','authorName','publicationDate','coverAlt'])if(!String(data[key]||'').trim())throw Error(`Complete ${key} before publishing.`);if(!plain(data.body).trim())throw Error('Add article content before publishing.');}
module.exports={linkedIn,validate,publication};
