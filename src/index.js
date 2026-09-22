import {json} from './lib/supabase.js';
import {enquiriesCreate} from './api/enquiries.js';
import {adminOverview} from './api/adminOverview.js';
import {adminProjectsUpdate} from './api/adminProjects.js';
import {adminRequestLink} from './api/adminRequestLink.js';
import {adminSession} from './api/adminSession.js';
import {clientProjects} from './api/clientProjects.js';
import {clientRequestLink} from './api/clientRequestLink.js';
import {clientSession} from './api/clientSession.js';

const routes = [
  {method: 'POST', path: '/api/enquiries', handler: enquiriesCreate},
  {method: 'GET', path: '/api/admin/overview', handler: adminOverview},
  {method: 'PATCH', path: '/api/admin/projects', handler: adminProjectsUpdate},
  {method: 'POST', path: '/api/admin/request-link', handler: adminRequestLink},
  {method: 'GET', path: '/api/admin/session', handler: adminSession},
  {method: 'GET', path: '/api/client/projects', handler: clientProjects},
  {method: 'POST', path: '/api/client/request-link', handler: clientRequestLink},
  {method: 'GET', path: '/api/client/session', handler: clientSession}
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
