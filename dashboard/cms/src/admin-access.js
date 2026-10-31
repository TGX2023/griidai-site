'use strict';
const {errors} = require('@strapi/utils');
const repeatables = ['inputs', 'steps', 'outputs', 'review', 'topics'];
const isSuperAdmin = ctx => ctx?.state?.auth?.strategy?.name === 'admin' &&
  ctx.state.user?.roles?.some(role => role.code === 'strapi-super-admin');

function assertRepeatableChanges(existing, data, allowed) {
  if (allowed || !existing) return;
  for (const field of repeatables) {
    if (!Object.hasOwn(data, field)) continue;
    const before = (existing[field] || []).map(item => String(item.id));
    const after = Array.isArray(data[field]) ? data[field] : [];
    const retained = after.filter(item => before.includes(String(item.id))).map(item => String(item.id));
    if (before.length !== retained.length || before.some((id, i) => id !== retained[i])) {
      throw new errors.ForbiddenError('Only a Super Admin can delete or reorder existing content items. You can edit their text or add new items.');
    }
  }
}

function registerSettingsPolicies(strapi) {
  const adminOnly = ctx => Boolean(isSuperAdmin(ctx));
  const policyName = 'global::griidai-super-admin';
  strapi.get('policies').set(policyName, adminOnly);
  const restrict = (router, pluginName) => {
    if (!router || router.type === 'content-api') return;
    for (const route of router.routes || []) {
      const policies = route.config?.policies || [];
      const settings = policies.some(policy => typeof policy === 'object' &&
        /hasPermissions$/.test(policy.name || '') &&
        (policy.config?.actions || []).some(action => action.startsWith('admin::') ||
          action.includes('.settings.') || pluginName === 'users-permissions'));
      if (settings) route.config.policies = [...policies, policyName];
    }
  };
  for (const router of Object.values(strapi.admin.routes)) restrict(router, 'admin');
  for (const [name, plugin] of Object.entries(strapi.plugins)) {
    if (Array.isArray(plugin.routes)) restrict({routes: plugin.routes}, name);
    else for (const router of Object.values(plugin.routes || {})) if (typeof router !== 'function') restrict(router, name);
  }
}
module.exports = {isSuperAdmin, assertRepeatableChanges, registerSettingsPolicies};
