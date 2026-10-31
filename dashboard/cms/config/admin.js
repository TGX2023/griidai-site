module.exports = ({ env }) => ({
  preview: { enabled: true, config: {
    allowedOrigins: [env('SITE_URL', 'http://localhost:3000')],
    async handler(uid, { documentId, status }) {
      if (!['api::use-case.use-case','api::blog.blog'].includes(uid) || !documentId) return null;
      const blog=uid==='api::blog.blog',route=blog?'blogs':'use-cases';
      if (status === 'published') {
        const record = await strapi.documents(uid).findOne({documentId, status:'published'});
        return record ? `${env('SITE_URL', 'http://localhost:3000')}/${route}/${record.slug}/` : null;
      }
      const secret = env('PREVIEW_SECRET');
      if (!secret) return null;
      const {sign} = require('../../shared/content.cjs');
      const expires = Date.now() + 15 * 60 * 1000;
      return `${env('SITE_URL', 'http://localhost:3000')}/preview/${route}/${documentId}?expires=${expires}&signature=${sign(blog?'blog-'+documentId:documentId,expires,secret)}`;
    },
  }},
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    docLinks: env.bool('FLAG_DOC_LINKS', true),
  },
});
