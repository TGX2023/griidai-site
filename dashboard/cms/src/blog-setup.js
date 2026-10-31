'use strict';
const {UID}=require('./blog-rules');
module.exports=async strapi=>{
 const type=strapi.contentType(UID),svc=strapi.plugin('content-manager').service('content-types');const config=await svc.findConfiguration(type);
 const rows=[['titleFormatting'],['summaryFormatting'],['slug','category'],['tags'],['cover'],['coverAlt'],['coverFocus'],['authorName','authorLinkedIn'],['authorPhoto'],['publicationDate'],['body'],['sourceUrl'],['seo'],['featureOnHomepage','homepageOrder']];
 const labels={title:'Article title',summary:'Short description — shown on the blog card',slug:'Page URL (Slug)',category:'Category',coverAlt:'Cover image description',coverFocus:'16:9 cover crop',authorName:'Author name — as published',authorLinkedIn:'Author LinkedIn profile',publicationDate:'Original publication date and time',body:'Article content',sourceUrl:'Original article link',seo:'SEO & Sharing'};
 labels.titleFormatting=labels.title;labels.summaryFormatting=labels.summary;
 labels.tags='Tags';
 labels.featureOnHomepage='Feature on homepage';labels.homepageOrder='Homepage order';
 for(const name of ['featureOnHomepage','homepageOrder'])if(config.metadatas[name]?.edit)config.metadatas[name].edit.description=name==='featureOnHomepage'?'Show in Find News after publishing. Maximum two published blogs. To replace one, turn this off on the old entry and publish first.':'Homepage only. Lowest number first; does not change the Blogs list.';
 labels.authorPhoto='Author photo';
 for(const [name,label]of Object.entries(labels))if(config.metadatas[name]?.edit)config.metadatas[name].edit.label=label;
 if(config.metadatas.authorPhoto?.edit)config.metadatas.authorPhoto.edit.description='Choose a square portrait, ideally 400 × 400 or larger. It appears in a circle beside the author name on cards and articles. Leave empty to show the initial.';
 for(const name of ['title','summary','renderedCover','renderedFrom','publishedSlug','importKey','sharingImage'])if(config.metadatas[name]?.edit)config.metadatas[name].edit.visible=false;
 config.layouts.edit=rows.map(row=>row.map(name=>({name,size:row.length===2?6:12})));config.layouts.list=['title','authorName','publicationDate','updatedAt'];config.settings.mainField='title';await svc.updateConfiguration(type,config);
 const fields=Object.keys(type.attributes).filter(f=>!['importKey','renderedFrom','renderedCover','publishedSlug'].includes(f));
 for(const [name,canPublish]of [['Marketing Editor',false],['Marketing Publisher',true]]){
  const role=await strapi.db.query('admin::role').findOne({where:{name}});if(!role)continue;
  for(const action of ['read','create','update',...(canPublish?['publish']:[])]){
   const spec={role:role.id,action:`plugin::content-manager.explorer.${action}`,subject:UID};
   const permission=await strapi.db.query('admin::permission').findOne({where:spec});
   if(!permission)await strapi.db.query('admin::permission').create({data:{...spec,properties:{fields:action==='read'?[...fields,'publishedSlug']:fields},conditions:[]}});
   else if(['read','create','update'].includes(action)&&['featureOnHomepage','homepageOrder','tags','authorPhoto','titleFormatting','summaryFormatting'].some(f=>!permission.properties?.fields?.includes(f)))await strapi.db.query('admin::permission').update({where:{id:permission.id},data:{properties:{...permission.properties,fields:[...new Set([...(permission.properties?.fields||[]),'featureOnHomepage','homepageOrder','tags','authorPhoto','titleFormatting','summaryFormatting'])]}}});
  }
 }
 // Extend only this lab's existing, server-side read token. Do not rotate it.
 const token=await strapi.db.query('admin::api-token').findOne({where:{name:'GriidAi local website',type:'custom'},populate:['permissions']});
 if(token){const actions=token.permissions.map(p=>p.action),required=[UID+'.find',UID+'.findOne'];if(required.some(a=>!actions.includes(a)))await strapi.admin.services['api-token'].update(token.id,{permissions:[...new Set([...actions,...required])]});}
};
