'use strict';
module.exports=require('@strapi/strapi').factories.createCoreRouter('api::blog.blog',{only:['find','findOne']});
