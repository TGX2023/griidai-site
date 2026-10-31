const {esc}=require('../shared/content.cjs');
function staticURLs(html,route,siteURL){
 const normalized=route.endsWith('/index.html')?route.slice(0,-10):route;
 const canonical=new URL(normalized,siteURL).href;
 html=html.replace(/<link\b[^>]*rel="canonical"[^>]*>/gi,'').replace(/<meta\b[^>]*property="og:url"[^>]*>/gi,'');
 html=html.replace(/(<meta\b[^>]*property="og:image"[^>]*content=")([^"]+)("[^>]*>)/gi,(all,start,url,end)=>{try{const parsed=new URL(url,siteURL);return parsed.pathname.startsWith('/assets/')?start+esc(new URL(parsed.pathname,siteURL).href)+end:all;}catch{return all;}});
 return html.replace('</head>',()=>`<link rel="canonical" href="${esc(canonical)}"><meta property="og:url" content="${esc(canonical)}"></head>`);
}
function robots(siteURL){return `User-agent: *\nDisallow: /preview/\nDisallow: /workflows/\nDisallow: /industries/\nSitemap: ${new URL('/sitemap.xml',siteURL).href}\n`;}
module.exports={staticURLs,robots};
