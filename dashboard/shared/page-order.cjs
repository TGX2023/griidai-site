const SECTIONS=[
 {id:'section:hero',label:'Title and cover'},
 {id:'section:video',label:'Source video'},
 {id:'section:method',label:'From question to analysis'},
 {id:'section:results',label:'Understand the output'},
 {id:'section:return',label:'Final call to action'}
];
const partKey=part=>'part:'+part.id;
function pageOrder(parts,value,{isVideo=true}={}) {
 const before=parts.filter(part=>!isVideo||part.placement!=='below-video').map(partKey);
 const after=isVideo?parts.filter(part=>part.placement==='below-video').map(partKey):[];
 const defaults=['section:hero',...before,'section:video',...after,'section:method','section:results','section:return'];
 if(value==null)return defaults;
 if(!Array.isArray(value)||value.length>100)throw Error('Page order must contain up to 100 sections and parts.');
 const allowed=new Set(defaults),seen=new Set();
 const ordered=value.filter(key=>typeof key==='string'&&allowed.has(key)&&!seen.has(key)&&seen.add(key));
 for(const key of defaults)if(!seen.has(key)) {
  if(key.startsWith('part:')&&ordered.includes('section:return'))ordered.splice(ordered.indexOf('section:return'),0,key);
  else ordered.push(key);
  seen.add(key);
 }
 return ordered;
}
module.exports={SECTIONS,partKey,pageOrder};
