'use strict';
const {UID}=require('./use-case-rules');
module.exports={
 register({strapi}){
  require('./homepage-features').register(strapi);
  strapi.customFields.register({name:'content-tags',type:'json'});
  strapi.customFields.register({name:'intro-richtext',type:'json'});
  require('./content-link-checker').register(strapi);
  require('./admin-access').registerSettingsPolicies(strapi);
  strapi.customFields.register({name:'blog-body',type:'json'});
  require('./blog-rules').register(strapi);
  strapi.customFields.register({name:'seo-settings',type:'json'});
  strapi.customFields.register({name:'editorial-details',type:'json'});
  strapi.customFields.register({name:'content-parts',type:'json'});
  strapi.customFields.register({name:'limited-richtext',type:'json'});
  strapi.customFields.register({name:'cover-focus',type:'json'});
  strapi.customFields.register({name:'managed-slug',type:'string'});
  strapi.customFields.register({name:'video-text',type:'string'});
  require('./use-case-rules').register(strapi);
 },
 async bootstrap({strapi}){
  const svc=strapi.plugin('content-manager').service('content-types');
  const type=strapi.contentType(UID);const config=await svc.findConfiguration(type);
  const rows=[['titleFormatting'],['classification'],['tags'],['summaryFormatting'],['slug'],['mediaType','videoUrl'],['videoTitle','coverAlt'],['cover'],['coverFocus'],['parts'],['inputs'],['steps'],['outputs'],['review'],['editorial'],['seo'],['featureOnHomepage','homepageOrder'],['order','showInSolutions']];
  const labels={title:'1. Use case title',classification:'Classification (for example Full demo)',summary:'Short description — card and page',slug:'Page URL (Slug)',mediaType:'2. Media type',videoUrl:'YouTube URL — video only',videoTitle:'Source video title',coverAlt:'Cover image description',cover:'Cover — leave empty to import the YouTube thumbnail',coverFocus:'16:9 cover crop',question:'3. Main question',overview:'Detailed explanation',inputs:'4. Data and inputs',steps:'Analysis — add and reorder steps',outputs:'5. Outputs described',review:'What to review',order:'6. Display order (lowest first)',showInSolutions:'Feature in Solutions menu'};
  labels.titleFormatting=labels.title;labels.summaryFormatting=labels.summary;
  labels.tags='Tags';
  labels.featureOnHomepage='Feature on homepage';labels.homepageOrder='Homepage order';
  for(const name of ['featureOnHomepage','homepageOrder'])if(config.metadatas[name]?.edit)config.metadatas[name].edit.description=name==='featureOnHomepage'?'Show in Find News after publishing. Maximum two published use cases. To replace one, turn this off on the old entry and publish first.':'Homepage only. Lowest number first; does not change the Use Cases list or Solutions menu.';
  labels.parts='3. Page content — Add part';
  labels.seo='SEO & Sharing — automatic values with your overrides';
  labels.editorial='Video search details';
  for(const [name,label] of Object.entries(labels))if(config.metadatas[name]?.edit)Object.assign(config.metadatas[name].edit,{label,description:name==='slug'?'Automatically suggested from the title. Do not change after publication.':config.metadatas[name].edit.description});
  for(const name of ['topics','title','summary','question','overview','contentOrder','sharingImage','renderedCover','publishedSlug','importKey','renderedFrom','coverSourceVideo'])if(config.metadatas[name]?.edit)config.metadatas[name].edit.visible=false;
  config.layouts.edit=rows.map(row=>row.map(name=>({name,size:row.length===2?6:12})));
  config.layouts.list=['title','mediaType','order','updatedAt'];config.settings.mainField='title';
  await svc.updateConfiguration(type,config);
  const fields=Object.keys(type.attributes).filter(f=>!['publishedSlug','importKey','renderedFrom','renderedCover','coverSourceVideo'].includes(f));
  for(const [name,canPublish] of [['Marketing Editor',false],['Marketing Publisher',true]]){
   let role=await strapi.db.query('admin::role').findOne({where:{name}});
   const permissions=['read','create','update',...(canPublish?['publish']:[])].map(action=>({action:`plugin::content-manager.explorer.${action}`,subject:UID,properties:{fields:action==='read'?[...fields,'publishedSlug']:fields},conditions:[]}));
   if(role){
    const perms=await strapi.db.query('admin::permission').findMany({where:{role:role.id,action:{$in:['plugin::content-manager.explorer.read','plugin::content-manager.explorer.create','plugin::content-manager.explorer.update']},subject:UID}});
    for(const perm of perms){const added=['featureOnHomepage','homepageOrder',...(perm.action.endsWith('.read')?['tags','titleFormatting','summaryFormatting','parts','contentOrder','seo','sharingImage','editorial','publishedSlug']:['tags','titleFormatting','summaryFormatting','parts','contentOrder','seo','sharingImage','editorial'])];const previous=perm.properties?.fields||[];if(added.some(field=>!previous.includes(field)))await strapi.db.query('admin::permission').update({where:{id:perm.id},data:{properties:{...perm.properties,fields:[...new Set([...previous,...added])]}}});}
    continue;
   }
   role=await strapi.admin.services.role.create({name,description:canPublish?'Edit, preview, publish and unpublish Use Cases.':'Create, edit, save and preview Use Cases. Publishing requires a publisher.'});
   permissions.push(...['plugin::upload.read','plugin::upload.assets.create','plugin::upload.assets.update'].map(action=>({action,subject:null,properties:{},conditions:[]})));
   await strapi.admin.services.role.assignPermissions(role.id,permissions);
  }
  await require('./content-parts').migrateLegacyParts(strapi,UID);
  await require('./blog-setup')(strapi);
 }
};
