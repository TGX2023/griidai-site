import React, {useLayoutEffect} from 'react';
import {useAuth} from '@strapi/strapi/admin';
import {Navigate, useLocation} from 'react-router-dom';

export default function AdminRoleLayout({children}) {
  const user = useAuth('GriidAiAdminRole', state => state.user);
  const {pathname} = useLocation();
  const isAdmin = Boolean(user?.roles?.some(role => role.code === 'strapi-super-admin'));
  useLayoutEffect(() => {
    document.body.classList.toggle('griidai-super-admin', isAdmin);
    document.body.classList.toggle('griidai-content-editor', Boolean(user) && !isAdmin);
    document.body.classList.toggle('griidai-use-case-page', pathname.includes('/api::use-case.use-case'));
    return () => document.body.classList.remove('griidai-super-admin', 'griidai-content-editor', 'griidai-use-case-page');
  }, [user, isAdmin, pathname]);
  if (!user) return null;
  if (!isAdmin && /(?:^|\/)settings(?:\/|$)/.test(pathname)) {
    return <Navigate to="/content-manager/collection-types/api::use-case.use-case" replace />;
  }
  return children;
}

// Keep Strapi's original route paths and lazy modules, including Settings children.
export function restrictAdminRoutes(app) {
  app.router.addRoute(routes => routes.map(route => {
    if (route.lazy) {
      const load = route.lazy;
      return {...route, lazy: async (...args) => {
        const loaded = await load(...args);
        if (!loaded.Component) return loaded;
        const Component = loaded.Component;
        return {...loaded, Component: props => <AdminRoleLayout><Component {...props} /></AdminRoleLayout>};
      }};
    }
    if (route.element) return {...route, element: <AdminRoleLayout>{route.element}</AdminRoleLayout>};
    if (route.Component) {
      const Component = route.Component;
      return {...route, Component: props => <AdminRoleLayout><Component {...props} /></AdminRoleLayout>};
    }
    return route;
  }));
}
