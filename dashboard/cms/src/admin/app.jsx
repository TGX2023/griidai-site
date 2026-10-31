import LivePreviewPanel from './components/LivePreview';
import {restrictAdminRoutes} from './components/AdminRoleLayout';
import './admin-navigation.css';
export default {
  config: {locales:['en'], tutorials:false, notifications:{releases:false}},
  register(app) {
    app.customFields.register({name:'content-tags',type:'json',intlLabel:{id:'griidai.tags',defaultMessage:'Tags'},intlDescription:{id:'griidai.tags.help',defaultMessage:'Topics visitors can use to explore content.'},components:{Input:()=>import('./components/TagsInput')}});
    app.customFields.register({name:'intro-richtext',type:'json',intlLabel:{id:'griidai.intro',defaultMessage:'Formatted title or description'},intlDescription:{id:'griidai.intro.help',defaultMessage:'Format a page title or short description while preserving plain text for search.'},components:{Input:()=>import('./components/IntroEditor')}});
    restrictAdminRoutes(app);
    app.customFields.register({name:'blog-body',type:'json',intlLabel:{id:'griidai.blogbody',defaultMessage:'Article content'},intlDescription:{id:'griidai.blogbody.help',defaultMessage:'Formatted blog content.'},components:{Input:()=>import('./components/BlogBody')}});
    app.customFields.register({name:'seo-settings',type:'json',intlLabel:{id:'griidai.seo',defaultMessage:'SEO & Sharing'},intlDescription:{id:'griidai.seo.help',defaultMessage:'Generated from content, with editable overrides.'},components:{Input:()=>import('./components/SeoSettings')}});
    app.customFields.register({name:'editorial-details',type:'json',intlLabel:{id:'griidai.editorial',defaultMessage:'Video search details'},intlDescription:{id:'griidai.editorial.help',defaultMessage:'Actual YouTube upload date and duration.'},components:{Input:()=>import('./components/EditorialDetails')}});
    app.customFields.register({name:'content-parts',type:'json',intlLabel:{id:'griidai.parts',defaultMessage:'Page content — Add part'},intlDescription:{id:'griidai.parts.help',defaultMessage:'Flexible text sections and images, with GriidAi green.'},components:{Input:()=>import('./components/ContentParts')}});
    app.customFields.register({name:'managed-slug',type:'string',intlLabel:{id:'griidai.slug',defaultMessage:'Page URL (Slug)'},intlDescription:{id:'griidai.slug.help',defaultMessage:'Suggested from the title and locked after publication.'},components:{Input:()=>import('./components/ManagedText')}});
    app.customFields.register({name:'video-text',type:'string',intlLabel:{id:'griidai.video',defaultMessage:'Video field'},intlDescription:{id:'griidai.video.help',defaultMessage:'Shown for YouTube videos only.'},components:{Input:()=>import('./components/ManagedText')}});
    app.customFields.register({name:'limited-richtext',type:'json',intlLabel:{id:'griidai.rich',defaultMessage:'Formatted text'},intlDescription:{id:'griidai.rich.help',defaultMessage:'Bold, italic, links and paragraphs only. The website controls the design.'},components:{Input:()=>import('./components/LimitedRichText')}});
    app.customFields.register({name:'cover-focus',type:'json',intlLabel:{id:'griidai.focus',defaultMessage:'Cover crop'},intlDescription:{id:'griidai.focus.help',defaultMessage:'Choose the visible area for the shared 16:9 cover.'},components:{Input:()=>import('./components/CoverFocus')}});
  },
  bootstrap(app) {
    app.getPlugin('content-manager').apis.addEditViewSidePanel([LivePreviewPanel]);
  }
};
