import {json} from './lib/supabase.js';
import {enquiriesCreate} from './api/enquiries.js';
import {adminOverview} from './api/adminOverview.js';
import {adminProjectsUpdate} from './api/adminProjects.js';
import {adminLogin} from './api/adminLogin.js';
import {clientProjects} from './api/clientProjects.js';
import {clientLogin} from './api/clientLogin.js';

const routes = [
  {method: 'POST', path: '/api/enquiries', handler: enquiriesCreate},
  {method: 'GET', path: '/api/admin/overview', handler: adminOverview},
  {method: 'PATCH', path: '/api/admin/projects', handler: adminProjectsUpdate},
  {method: 'POST', path: '/api/admin/login', handler: adminLogin},
  {method: 'GET', path: '/api/client/projects', handler: clientProjects},
  {method: 'POST', path: '/api/client/login', handler: clientLogin}
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      const route = routes.find((r) => r.method === request.method && r.path === url.pathname);
      if (!route) return json({error: 'Not found.'}, {status: 404});
      return route.handler({request, env, ctx});
    }

    return env.ASSETS.fetch(request);
  }
};
