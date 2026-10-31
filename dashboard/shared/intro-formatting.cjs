const {esc}=require('./content.cjs');
const {partDoc,partRich}=require('./content-parts.cjs');
const normalizeText=value=>String(value||'').replace(/\s+/g,' ').trim();
function introText(doc){
 const walk=node=>{if(!node)return '';if(node.type==='text')return node.text||'';if(node.type==='hardBreak')return ' ';const result=(node.content||[]).map(walk).join('');return ['paragraph','heading','listItem','taskItem','tableCell','tableHeader','tableRow','blockquote'].includes(node.type)?result+' ':result;};
 return normalizeText(walk(doc));
}
function normalizeIntro(value,{title=false}={}){
 const doc=partDoc(value);
 if(!title)return doc;
 if(doc.content.some(node=>!['paragraph','heading'].includes(node.type)))throw Error('Page titles support formatted text and line breaks. Put lists and tables in the description or article.');
 return {type:'doc',content:doc.content.map(node=>({type:'paragraph',...(node.attrs?.textAlign?{attrs:{textAlign:node.attrs.textAlign}}:{}),content:(node.content||[]).map(child=>{
  if(!['text','hardBreak'].includes(child.type))throw Error('Use text and line breaks in the page title.');
  return child.type==='text'?{...child,...(child.marks?{marks:child.marks.filter(mark=>mark.type!=='link')}:{})}:child;
 })}))};
}
function synchronizeIntro(data,existing={},kind='use-case'){
 for(const name of ['title','summary']){
  const field=name+'Formatting',max=name==='title'?(kind==='blog'?240:160):(kind==='blog'?1200:1000);
  if(Object.hasOwn(data,field)&&data[field]!=null){const doc=normalizeIntro(data[field],{title:name==='title'}),text=introText(doc);if(text.length>max)throw Error(`${name}: use up to ${max} text characters.`);data[field]=doc;data[name]=text;}
  else if(Object.hasOwn(data,name)&&existing[field]&&introText(existing[field])!==normalizeText(data[name]))data[field]=null;
 }
 return data;
}
function matchingDoc(record,name){
 const value=record[name+'Formatting'];if(!value)return null;
 try{const doc=normalizeIntro(value,{title:name==='title'});return introText(doc)===normalizeText(record[name==='title'?'name':'summary'])?doc:null;}catch{return null;}
}
function titleHTML(record){
 const doc=matchingDoc(record,'title');if(!doc)return esc(record.name);
 return doc.content.map(node=>{
  const html=partRich({type:'doc',content:[node]});const match=html.match(/^<p(?: class="(uc-part-align-[a-z]+)")?>([\s\S]*)<\/p>$/);
  return match?`<span class="cms-title-line${match[1]?' '+match[1]:''}">${match[2]||'<br>'}</span>`:'';
 }).join('');
}
function summaryHTML(record){const doc=matchingDoc(record,'summary');return doc?partRich(doc):`<p>${esc(record.summary)}</p>`;}
module.exports={introText,normalizeIntro,synchronizeIntro,titleHTML,summaryHTML};
