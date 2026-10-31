'use strict';

// This CMS has invited admin-team accounts only. Keep the plugin's data intact,
// but do not expose visitor registration, sign-in, OAuth or user-management APIs.
module.exports = plugin => {
  plugin.routes['content-api'] = {type: 'content-api', routes: []};
  const user = plugin.contentTypes.user.schema;
  user.pluginOptions = {
    ...user.pluginOptions,
    'content-manager': {...user.pluginOptions?.['content-manager'], visible: false},
    'content-type-builder': {...user.pluginOptions?.['content-type-builder'], visible: false},
  };
  return plugin;
};
