'use strict';
const {AsyncLocalStorage}=require('node:async_hooks');
const {errors}=require('@strapi/utils');
const TYPES={'api::use-case.use-case':'use cases','api::blog.blog':'blogs'};
const queues=new Map(),scope=new AsyncLocalStorage();
async function serialized(uid,work){
 if(scope.getStore()===uid)return work();
 const previous=queues.get(uid)||Promise.resolve();let release;
 const pending=new Promise(resolve=>{release=resolve;});queues.set(uid,pending);
 await previous;
 try{return await scope.run(uid,work);}finally{release();if(queues.get(uid)===pending)queues.delete(uid);}
}
module.exports={register(strapi){strapi.documents.use(async(context,next)=>{
 const {uid,action}=context;if(!TYPES[uid]||!['create','update','publish','unpublish','delete','discardDraft'].includes(action))return next();
 const data=context.params.data||{};
 if(Object.hasOwn(data,'featureOnHomepage')&&data.featureOnHomepage==null)data.featureOnHomepage=false;
 if(Object.hasOwn(data,'homepageOrder')&&data.homepageOrder==null)data.homepageOrder=0;
 if(Object.hasOwn(data,'featureOnHomepage')&&typeof data.featureOnHomepage!=='boolean')throw new errors.ValidationError('Feature on homepage must be on or off.');
 if(Object.hasOwn(data,'homepageOrder')&&(!Number.isInteger(data.homepageOrder)||data.homepageOrder<0||data.homepageOrder>9999))throw new errors.ValidationError('Homepage order must be a whole number from 0 to 9999.');
 return serialized(uid,()=>strapi.db.transaction(async({trx})=>{
  // Keep the two-slot limit atomic across PostgreSQL instances as well as the local SQLite process.
  const dialect=strapi.db.connection.client.config.client;
  if(['pg','postgres','postgresql'].includes(dialect))await trx.raw('SELECT pg_advisory_xact_lock(?, ?)',[195240,uid==='api::blog.blog'?1:2]);
  if(['create','update','publish'].includes(action)){
   const id=context.params.documentId;
   const existing=id?await strapi.documents(uid).findOne({documentId:id,status:'draft'}):null;
   const featured=data.featureOnHomepage??existing?.featureOnHomepage??false;
   if(featured){
    const others=await strapi.documents(uid).findMany({status:'published',filters:{featureOnHomepage:true,...(id?{documentId:{$ne:id}}:{})},fields:['documentId','title'],limit:2});
    if(others.length>=2)throw new errors.ValidationError(`The homepage already features two ${TYPES[uid]}. Turn off Feature on homepage on an existing entry and publish that change first. Your current published selections have not been replaced.`);
   }
  }
  return next();
 }));
});}};
