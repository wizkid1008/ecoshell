import {json} from './lib/supabase.js';
import {enquiriesCreate} from './api/enquiries.js';
import {adminOverview} from './api/adminOverview.js';
import {adminProjectsUpdate} from './api/adminProjects.js';
import {login} from './api/login.js';
import {clientProjects} from './api/clientProjects.js';
import {profileGet, profileUpdate} from './api/profile.js';
import {countriesList} from './api/countries.js';
import {opportunityDetail} from './api/adminOpportunity.js';
import {
  sampleCreate,
  pilotCreate,
  pilotResultCreate,
  proposalCreate,
  contractCreate,
  documentCreate
} from './api/adminRecords.js';

const routes = [
  {method: 'POST', path: '/api/enquiries', handler: enquiriesCreate},
  {method: 'GET', path: '/api/admin/overview', handler: adminOverview},
  {method: 'GET', path: '/api/admin/opportunity', handler: opportunityDetail},
  {method: 'PATCH', path: '/api/admin/projects', handler: adminProjectsUpdate},
  {method: 'POST', path: '/api/admin/samples', handler: sampleCreate},
  {method: 'POST', path: '/api/admin/pilots', handler: pilotCreate},
  {method: 'POST', path: '/api/admin/pilot-results', handler: pilotResultCreate},
  {method: 'POST', path: '/api/admin/proposals', handler: proposalCreate},
  {method: 'POST', path: '/api/admin/contracts', handler: contractCreate},
  {method: 'POST', path: '/api/admin/documents', handler: documentCreate},
  {method: 'POST', path: '/api/login', handler: login},
  {method: 'GET', path: '/api/client/projects', handler: clientProjects},
  {method: 'GET', path: '/api/profile', handler: profileGet},
  {method: 'PATCH', path: '/api/profile', handler: profileUpdate},
  {method: 'GET', path: '/api/countries', handler: countriesList}
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      const route = routes.find((r) => r.method === request.method && r.path === url.pathname);
      if (!route) return json({error: 'Not found.'}, {status: 404});
      try {
        return await route.handler({request, env, ctx});
      } catch (error) {
        return json({error: error.message}, {status: 500});
      }
    }

    return env.ASSETS.fetch(request);
  }
};
