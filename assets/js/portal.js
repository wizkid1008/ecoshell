(function(){
  var form = document.getElementById('loginForm');
  if(!form) return;

  var authSection = document.getElementById('authSection');
  var dashboardSection = document.getElementById('dashboardSection');
  var siteHeader = document.getElementById('siteHeader');
  var statusEl = document.getElementById('loginStatus');
  var appNav = document.getElementById('appNav');
  var heading = document.getElementById('dashboardHeading');
  var kpis = document.getElementById('dashboardKpis');
  var list = document.getElementById('dashboardList');
  var userEmailEl = document.getElementById('userEmail');
  var userRoleEl = document.getElementById('userRole');
  var avatarEl = document.getElementById('userAvatar');
  var signOutButton = document.getElementById('signOutButton');

  var accountForm = document.getElementById('accountForm');
  var accountStatusEl = document.getElementById('accountStatus');
  var acctClientRow1 = document.getElementById('acctClientRow1');
  var acctClientRow2 = document.getElementById('acctClientRow2');

  var SESSION_KEY = 'ecoshell_session';
  var EMAIL_KEY = 'ecoshell_email';
  var ROLE_KEY = 'ecoshell_role';
  var STATUS_KEY = 'ecoshell_status';

  var state = {role: null, status: null, sessionToken: null, view: 'dashboard', data: null, profile: null, opportunity: null};

  var STAGES = [
    ['new_inquiry', 'New inquiry'],
    ['qualified_lead', 'Qualified lead'],
    ['technical_review', 'Technical review'],
    ['nda_documentation', 'NDA / documentation'],
    ['sample_pilot_request', 'Sample or pilot request'],
    ['pilot_in_progress', 'Pilot in progress'],
    ['pilot_complete', 'Pilot complete'],
    ['commercial_proposal', 'Commercial proposal'],
    ['contract_negotiation', 'Contract negotiation'],
    ['commercial_customer', 'Commercial customer'],
    ['closed_not_fit', 'Closed not fit'],
    ['closed_lost', 'Closed lost']
  ];

  var ICON_DASHBOARD = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>';
  var ICON_ENQUIRIES = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var ICON_PROJECTS = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>';
  var ICON_SAMPLES = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8l-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>';
  var ICON_CLIENTS = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  var ICON_ACCOUNT = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

  function navItem(view, icon, label){
    return '<button type="button" class="app-nav__item" data-view="' + view + '">' + icon + label + '</button>';
  }

  var CLIENT_NAV = '<p class="app-nav__label">Overview</p>' +
    navItem('dashboard', ICON_DASHBOARD, 'Dashboard') +
    navItem('account', ICON_ACCOUNT, 'Account');

  var ADMIN_NAV = '<p class="app-nav__label">Workspace</p>' +
    navItem('enquiries', ICON_ENQUIRIES, 'Enquiries') +
    navItem('projects', ICON_PROJECTS, 'Opportunities') +
    navItem('samples', ICON_SAMPLES, 'Samples') +
    navItem('clients', ICON_CLIENTS, 'Clients') +
    navItem('account', ICON_ACCOUNT, 'Account');

  var clientDemo = {
    projects: [
      {
        reference_code: 'ECO-8A41C2F0',
        name: 'Injection moulded closure review',
        status: 'pilot_in_progress',
        polymer: 'PP',
        process: 'Injection moulding',
        target: 'Reduce virgin plastic while keeping stiffness and food-contact readiness.',
        companies: {name: 'Demo Packaging Co.'},
        sample_requests: [{status: 'delivered', tracking_number: '1Z-DEMO-9241'}],
        pilots: [{status: 'in_progress', success_criteria: 'Match incumbent stiffness within 5%.', start_date: '2026-08-01', end_date: null, pilot_results: []}],
        proposals: [],
        contracts: [],
        project_documents: [{title: 'Technical data sheet', url: '#', visibility: 'client'}],
        project_updates: [
          {body: 'Pilot trial is underway on your line. Ecoshell is monitoring loading range and cycle time.', created_at: new Date().toISOString()},
          {body: 'Initial inquiry received and converted into a project.', created_at: new Date(Date.now() - 86400000).toISOString()}
        ]
      }
    ]
  };

  var adminDemo = {
    enquiries: [{first_name: 'Maya', last_name: 'Singh', company: 'Demo Packaging Co.', email: 'maya@example.com', country: 'United States', application: 'Injection moulding', message: 'Looking for a lower-plastic closure compound.', status: 'new'}],
    projects: [{id: 'demo-1', reference_code: 'ECO-8A41C2F0', name: 'Injection moulded closure review', status: 'pilot_in_progress', polymer: 'PP', process: 'Injection moulding', companies: {name: 'Demo Packaging Co.'}, owner: {name: 'Kyle Newell', email: 'kyle@ecoshell.eco'}, contact: {name: 'Maya Singh', email: 'maya@example.com'}}],
    samples: [{status: 'delivered', tracking_number: '1Z-DEMO-9241', projects: {reference_code: 'ECO-8A41C2F0', name: 'Injection moulded closure review', companies: {name: 'Demo Packaging Co.'}}}],
    pilots: [{status: 'in_progress', success_criteria: 'Match incumbent stiffness within 5%.', projects: {reference_code: 'ECO-8A41C2F0', name: 'Injection moulded closure review', companies: {name: 'Demo Packaging Co.'}}}],
    proposals: [],
    contracts: [],
    clients: [{email: 'maya@example.com', name: 'Maya Singh', status: 'contact', company_name: 'Demo Packaging Co.', job_title: 'Procurement', phone: '', country: 'United States', industry: 'Food and Agri', archetype: 'Emerging Brand'}],
    admins: [{id: 'demo-admin', name: 'Kyle Newell', email: 'kyle@ecoshell.eco'}],
    companies: [{id: 'demo-co', name: 'Demo Packaging Co.', industry: 'Food and Agri', archetype: 'Emerging Brand', country: 'United States'}]
  };

  function labelStatus(status){
    return String(status || 'new').replace(/_/g, ' ');
  }

  function esc(value){
    return String(value || '').replace(/[&<>"']/g, function(char){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
    });
  }

  function setStatus(message, isError){
    if(!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.classList.toggle('is-error', !!isError);
  }

  function setAccountStatus(message, isError){
    if(!accountStatusEl) return;
    accountStatusEl.textContent = message || '';
    accountStatusEl.classList.toggle('is-error', !!isError);
  }

  function showAuth(){
    dashboardSection.hidden = true;
    authSection.hidden = false;
    if(siteHeader) siteHeader.hidden = false;
  }

  function setActiveNav(view){
    appNav.querySelectorAll('.app-nav__item').forEach(function(item){
      item.classList.toggle('is-active', item.dataset.view === view);
    });
  }

  function apiFetch(url, options){
    options = options || {};
    options.headers = Object.assign({'x-session': state.sessionToken}, options.headers || {});
    return fetch(url, options).then(function(res){
      return res.json()
        .catch(function(){ return {}; })
        .then(function(body){ return {ok: res.ok, status: res.status, body: body}; });
    });
  }

  function postJSON(url, data){
    return apiFetch(url, {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(data)});
  }

  function patchJSON(url, data){
    return apiFetch(url, {method: 'PATCH', headers: {'content-type': 'application/json'}, body: JSON.stringify(data)});
  }

  function enterDashboard(role, email, status){
    authSection.hidden = true;
    dashboardSection.hidden = false;
    if(siteHeader) siteHeader.hidden = true;

    userEmailEl.textContent = email;
    userRoleEl.textContent = role === 'admin' ? 'Admin' : labelStatus(status || 'lead');
    avatarEl.textContent = email ? email.charAt(0).toUpperCase() : '?';
    appNav.innerHTML = role === 'admin' ? ADMIN_NAV : CLIENT_NAV;

    appNav.querySelectorAll('.app-nav__item[data-view]').forEach(function(tab){
      tab.addEventListener('click', function(){
        state.view = tab.dataset.view;
        state.opportunity = null;
        setActiveNav(state.view);
        renderCurrentView();
      });
    });

    state.view = role === 'admin' ? 'enquiries' : 'dashboard';
    setActiveNav(state.view);
  }

  function renderClientKpis(data){
    var projects = data.projects || [];
    var active = projects.filter(function(project){ return !/closed|complete|not_fit/.test(project.status || ''); }).length;
    var samples = projects.reduce(function(total, project){ return total + (project.sample_requests || []).length; }, 0);
    kpis.innerHTML = [
      '<article><b>' + projects.length + '</b><span>Projects</span></article>',
      '<article><b>' + active + '</b><span>Active reviews</span></article>',
      '<article><b>' + samples + '</b><span>Sample requests</span></article>'
    ].join('');
  }

  function renderClientList(data){
    var projects = data.projects || [];
    if(!projects.length){
      list.innerHTML = '<article class="portal-card"><h2>No projects found</h2><p>Once you submit an enquiry through the contact form, it will show up here.</p></article>';
      return;
    }

    list.innerHTML = projects.map(function(project){
      var updates = (project.project_updates || []).slice(0, 3).map(function(update){
        return '<li>' + esc(update.body) + '</li>';
      }).join('');
      var sample = (project.sample_requests || [])[0];
      var pilot = (project.pilots || [])[0];
      var proposal = (project.proposals || [])[0];
      var contract = (project.contracts || [])[0];
      var documents = (project.project_documents || []).filter(function(d){ return d.visibility === 'client'; });

      var docsHtml = documents.length
        ? '<ul class="portal-updates">' + documents.map(function(d){ return '<li><a href="' + esc(d.url) + '" target="_blank" rel="noopener">' + esc(d.title) + '</a></li>'; }).join('') + '</ul>'
        : '<p class="portal-note">No shared documents yet.</p>';

      return '<article class="portal-card">' +
        '<div class="portal-card__top"><div><p class="portal-ref">' + esc(project.reference_code) + '</p><h2>' + esc(project.name) + '</h2></div><span class="pill">' + esc(labelStatus(project.status)) + '</span></div>' +
        '<dl class="portal-meta"><div><dt>Company</dt><dd>' + esc(project.companies?.name || 'Client company') + '</dd></div><div><dt>Polymer</dt><dd>' + esc(project.polymer || 'Review needed') + '</dd></div><div><dt>Process</dt><dd>' + esc(project.process || 'Review needed') + '</dd></div></dl>' +
        '<p>' + esc(project.target || 'No project target has been added yet.') + '</p>' +
        (sample ? '<p class="portal-note">Sample: ' + esc(labelStatus(sample.status)) + (sample.tracking_number ? ' · Tracking ' + esc(sample.tracking_number) : '') + '</p>' : '') +
        (pilot ? '<p class="portal-note">Pilot: ' + esc(labelStatus(pilot.status)) + (pilot.success_criteria ? ' — ' + esc(pilot.success_criteria) : '') + '</p>' : '') +
        (proposal ? '<p class="portal-note">Proposal: ' + esc(labelStatus(proposal.status)) + '</p>' : '') +
        (contract ? '<p class="portal-note">Contract: ' + esc(labelStatus(contract.status)) + '</p>' : '') +
        '<h3>Latest updates</h3><ul class="portal-updates">' + (updates || '<li>No updates yet.</li>') + '</ul>' +
        '<h3>Documents</h3>' + docsHtml +
      '</article>';
    }).join('');
  }

  function loadClientDashboard(sessionToken){
    heading.textContent = 'Track material reviews, sample requests and next steps.';
    list.innerHTML = '<article class="portal-card"><p>Loading projects...</p></article>';

    fetch('/api/client/projects', {headers: {'x-session': sessionToken}})
      .then(function(res){
        if(res.status === 401){
          clearSession();
          setStatus('Your session has expired. Please sign in again.', true);
          showAuth();
          return null;
        }
        if(!res.ok) throw new Error('client unavailable');
        return res.json();
      })
      .then(function(data){
        if(data){ state.data = data; renderClientKpis(data); renderClientList(data); }
      })
      .catch(function(){
        setStatus('Could not reach the portal service right now. Showing sample data instead.', true);
        state.data = clientDemo;
        renderClientKpis(clientDemo);
        renderClientList(clientDemo);
      });
  }

  function adminCard(title, meta, body, status){
    return '<article class="portal-card">' +
      '<div class="portal-card__top"><div><p class="portal-ref">' + esc(meta) + '</p><h2>' + esc(title) + '</h2></div>' +
      (status ? '<span class="pill">' + esc(labelStatus(status)) + '</span>' : '') + '</div>' +
      '<p>' + esc(body) + '</p>' +
    '</article>';
  }

  function renderAdminKpis(data){
    kpis.innerHTML = [
      '<article><b>' + data.enquiries.length + '</b><span>Enquiries</span></article>',
      '<article><b>' + data.projects.length + '</b><span>Opportunities</span></article>',
      '<article><b>' + data.samples.length + '</b><span>Samples</span></article>',
      '<article><b>' + data.clients.length + '</b><span>Clients</span></article>'
    ].join('');
  }

  function countBy(items, key){
    var counts = {};
    items.forEach(function(item){
      var value = item[key] || 'Not set';
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  }

  function breakdownTable(title, counts){
    var rows = Object.keys(counts).sort().map(function(key){
      return '<div><dt>' + esc(key) + '</dt><dd>' + counts[key] + '</dd></div>';
    }).join('');
    return '<article class="portal-card">' +
      '<h3>' + esc(title) + '</h3>' +
      '<dl class="breakdown-table">' + rows + '</dl>' +
    '</article>';
  }

  function renderClientsView(data){
    var clients = data.clients || [];
    var archetypeCounts = countBy(clients, 'archetype');
    var industryCounts = countBy(clients, 'industry');

    var cards = clients.map(function(item){
      var details = [item.job_title, item.industry, item.archetype].filter(Boolean).join(' · ') || 'No profile details yet';
      return adminCard(
        item.name || item.email,
        item.company_name || 'Company not set',
        details,
        item.status || 'lead'
      );
    }).join('');

    list.innerHTML =
      '<div class="breakdown-grid">' +
        breakdownTable('By archetype', archetypeCounts) +
        breakdownTable('By industry', industryCounts) +
      '</div>' +
      (cards || '<article class="portal-card"><h2>No client accounts yet</h2><p>Client sign-ups will show up here.</p></article>');
  }

  function renderAdminList(){
    var data = state.data || adminDemo;
    if(state.view === 'enquiries'){
      list.innerHTML = data.enquiries.map(function(item){
        return adminCard(item.company, item.email + ' · ' + item.application, item.message, item.status);
      }).join('');
    }
    if(state.view === 'projects'){
      list.innerHTML = data.projects.map(function(item){
        var meta = item.reference_code + ' · ' + (item.companies?.name || 'Company');
        var body = 'Owner: ' + (item.owner ? (item.owner.name || item.owner.email) : 'Unassigned') +
          ' · Contact: ' + (item.contact ? (item.contact.name || item.contact.email) : 'No contact');
        return '<div class="opportunity-row" data-open-project="' + esc(item.id) + '">' + adminCard(item.name, meta, body, item.status) + '</div>';
      }).join('');
      list.querySelectorAll('[data-open-project]').forEach(function(el){
        el.addEventListener('click', function(){ openOpportunity(el.getAttribute('data-open-project')); });
      });
    }
    if(state.view === 'samples'){
      list.innerHTML = data.samples.map(function(item){
        var project = item.projects || {};
        return adminCard(project.name || 'Sample request', (project.reference_code || 'Project') + ' · ' + (project.companies?.name || 'Company'), item.tracking_number ? 'Tracking: ' + item.tracking_number : 'No tracking number yet.', item.status);
      }).join('');
    }
    if(state.view === 'clients'){
      renderClientsView(data);
    }
  }

  function stageOptions(selected){
    return STAGES.map(function(pair){
      return '<option value="' + pair[0] + '"' + (pair[0] === selected ? ' selected' : '') + '>' + esc(pair[1]) + '</option>';
    }).join('');
  }

  function backToOpportunities(){
    kpis.hidden = false;
    state.opportunity = null;
    state.view = 'projects';
    setActiveNav('projects');
    renderAdminList();
  }

  function openOpportunity(id){
    kpis.hidden = true;
    list.innerHTML = '<article class="portal-card"><p>Loading opportunity...</p></article>';
    apiFetch('/api/admin/opportunity?id=' + encodeURIComponent(id))
      .then(function(result){
        if(!result.ok){
          list.innerHTML = '<article class="portal-card"><h2>Unable to load opportunity</h2><p>' + esc(result.body.error || 'Please try again.') + '</p><button type="button" class="btn" id="oppBackBtnErr">Back to opportunities</button></article>';
          var backBtn = document.getElementById('oppBackBtnErr');
          if(backBtn) backBtn.addEventListener('click', backToOpportunities);
          return;
        }
        state.opportunity = result.body;
        renderOpportunityDetail();
      })
      .catch(function(){
        list.innerHTML = '<article class="portal-card"><h2>Unable to load opportunity</h2><p>Check your connection and try again.</p></article>';
      });
  }

  function renderOpportunityDetail(){
    var data = state.opportunity;
    var project = data.project;
    var admins = (state.data && state.data.admins) || [];

    var ownerOptions = '<option value="">Unassigned</option>' + admins.map(function(a){
      return '<option value="' + esc(a.id) + '"' + (project.owner && project.owner.email === a.email ? ' selected' : '') + '>' + esc(a.name || a.email) + '</option>';
    }).join('');

    var samplesHtml = (data.samples || []).map(function(s){
      return '<p class="portal-note">' + esc(labelStatus(s.status)) + (s.tracking_number ? ' · Tracking ' + esc(s.tracking_number) : '') + (s.shipping_name ? ' · ' + esc(s.shipping_name) : '') + '</p>';
    }).join('') || '<p class="portal-note">No sample requests yet.</p>';

    var pilotsHtml = (data.pilots || []).map(function(p){
      var results = (p.pilot_results || []).map(function(r){
        return '<li>' + (r.outcome ? esc(r.outcome.toUpperCase()) + ' — ' : '') + esc(r.summary) + '</li>';
      }).join('');
      return '<div class="portal-note"><b>' + esc(labelStatus(p.status)) + '</b>' + (p.success_criteria ? ' — ' + esc(p.success_criteria) : '') +
        (p.start_date || p.end_date ? ' (' + esc(p.start_date || '?') + ' to ' + esc(p.end_date || '?') + ')' : '') +
        (results ? '<ul class="portal-updates">' + results + '</ul>' : '') + '</div>';
    }).join('') || '<p class="portal-note">No pilots yet.</p>';

    var proposalsHtml = (data.proposals || []).map(function(p){
      return '<p class="portal-note">' + esc(labelStatus(p.status)) + (p.amount ? ' · ' + esc(p.currency || 'USD') + ' ' + esc(p.amount) : '') + '</p>';
    }).join('') || '<p class="portal-note">No proposals yet.</p>';

    var contractsHtml = (data.contracts || []).map(function(c){
      return '<p class="portal-note">' + esc(labelStatus(c.status)) + (c.value ? ' · ' + esc(c.currency || 'USD') + ' ' + esc(c.value) : '') + '</p>';
    }).join('') || '<p class="portal-note">No contracts yet.</p>';

    var documentsHtml = (data.documents || []).map(function(d){
      return '<li><a href="' + esc(d.url) + '" target="_blank" rel="noopener">' + esc(d.title) + '</a> · ' + esc(labelStatus(d.visibility)) + (d.document_type ? ' · ' + esc(d.document_type) : '') + '</li>';
    }).join('') || '<li>No documents yet.</li>';

    var updatesHtml = (data.updates || []).map(function(u){
      return '<li>' + esc(u.body) + '</li>';
    }).join('') || '<li>No client updates yet.</li>';

    var notesHtml = (data.notes || []).map(function(n){
      return '<div class="internal-note">' + esc(n.body) + ' <span class="portal-ref">— ' + esc(n.created_by) + '</span></div>';
    }).join('') || '<p class="portal-note">No internal notes yet.</p>';

    list.innerHTML =
      '<button type="button" class="btn" id="oppBackBtn">Back to opportunities</button>' +
      '<article class="portal-card">' +
        '<div class="portal-card__top"><div><p class="portal-ref">' + esc(project.reference_code) + '</p><h2>' + esc(project.name) + '</h2></div><span class="pill">' + esc(labelStatus(project.status)) + '</span></div>' +
        '<dl class="portal-meta"><div><dt>Company</dt><dd>' + esc(project.companies?.name || 'Company') + '</dd></div><div><dt>Contact</dt><dd>' + esc(project.contact?.name || project.contact?.email || 'No contact') + '</dd></div><div><dt>Owner</dt><dd>' + esc(project.owner?.name || project.owner?.email || 'Unassigned') + '</dd></div></dl>' +
        '<div class="frow">' +
          '<div class="field"><label for="oppStageSelect">Pipeline stage</label><select id="oppStageSelect">' + stageOptions(project.status) + '</select></div>' +
          '<div class="field"><label for="oppOwnerSelect">Owner</label><select id="oppOwnerSelect">' + ownerOptions + '</select></div>' +
        '</div>' +
        '<button type="button" class="btn btn--solid" id="oppSaveBtn">Save stage / owner</button>' +
        '<p class="portal-status" id="oppSaveStatus"></p>' +
      '</article>' +

      '<article class="portal-card"><h3>Samples</h3>' + samplesHtml +
        '<div class="frow">' +
          '<div class="field"><label for="sampleShippingName">Shipping name</label><input id="sampleShippingName"></div>' +
          '<div class="field"><label for="sampleTracking">Tracking number</label><input id="sampleTracking"></div>' +
        '</div>' +
        '<div class="field"><label for="sampleStatus">Status</label><select id="sampleStatus"><option value="requested">Requested</option><option value="preparing">Preparing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option></select></div>' +
        '<button type="button" class="btn" id="sampleSaveBtn">Record sample</button>' +
      '</article>' +

      '<article class="portal-card"><h3>Pilot</h3>' + pilotsHtml +
        '<div class="frow">' +
          '<div class="field"><label for="pilotCriteria">Success criteria</label><input id="pilotCriteria"></div>' +
          '<div class="field"><label for="pilotStatus">Status</label><select id="pilotStatus"><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="complete">Complete</option></select></div>' +
        '</div>' +
        '<div class="frow">' +
          '<div class="field"><label for="pilotStart">Start date</label><input type="date" id="pilotStart"></div>' +
          '<div class="field"><label for="pilotEnd">End date</label><input type="date" id="pilotEnd"></div>' +
        '</div>' +
        '<button type="button" class="btn" id="pilotSaveBtn">Record pilot</button>' +
        (data.pilots && data.pilots.length ? (
          '<div class="frow" style="margin-top:16px">' +
            '<div class="field"><label for="pilotResultOutcome">Result outcome (latest pilot)</label><select id="pilotResultOutcome"><option value="">Select outcome</option><option value="pass">Pass</option><option value="partial">Partial</option><option value="fail">Fail</option></select></div>' +
            '<div class="field"><label for="pilotResultSummary">Summary</label><input id="pilotResultSummary"></div>' +
          '</div>' +
          '<button type="button" class="btn" id="pilotResultSaveBtn">Record pilot result</button>'
        ) : '') +
      '</article>' +

      '<article class="portal-card"><h3>Proposal</h3>' + proposalsHtml +
        '<div class="frow">' +
          '<div class="field"><label for="proposalAmount">Amount</label><input type="number" id="proposalAmount"></div>' +
          '<div class="field"><label for="proposalCurrency">Currency</label><input id="proposalCurrency" value="USD"></div>' +
        '</div>' +
        '<div class="field"><label for="proposalStatus">Status</label><select id="proposalStatus"><option value="draft">Draft</option><option value="sent">Sent</option><option value="accepted">Accepted</option><option value="declined">Declined</option></select></div>' +
        '<button type="button" class="btn" id="proposalSaveBtn">Record proposal</button>' +
      '</article>' +

      '<article class="portal-card"><h3>Contract</h3>' + contractsHtml +
        '<div class="frow">' +
          '<div class="field"><label for="contractValue">Value</label><input type="number" id="contractValue"></div>' +
          '<div class="field"><label for="contractCurrency">Currency</label><input id="contractCurrency" value="USD"></div>' +
        '</div>' +
        '<div class="field"><label for="contractStatus">Status</label><select id="contractStatus"><option value="pending">Pending</option><option value="signed">Signed</option><option value="active">Active</option><option value="ended">Ended</option></select></div>' +
        '<button type="button" class="btn" id="contractSaveBtn">Record contract</button>' +
      '</article>' +

      '<article class="portal-card"><h3>Documents</h3><ul class="portal-updates">' + documentsHtml + '</ul>' +
        '<div class="frow">' +
          '<div class="field"><label for="documentTitle">Title</label><input id="documentTitle"></div>' +
          '<div class="field"><label for="documentUrl">URL</label><input id="documentUrl"></div>' +
        '</div>' +
        '<div class="frow">' +
          '<div class="field"><label for="documentType">Type</label><input id="documentType" placeholder="e.g. spec sheet"></div>' +
          '<div class="field"><label for="documentVisibility">Visibility</label><select id="documentVisibility"><option value="client">Client-visible</option><option value="internal">Internal only</option></select></div>' +
        '</div>' +
        '<button type="button" class="btn" id="documentSaveBtn">Add document</button>' +
      '</article>' +

      '<article class="portal-card"><h3>Client-visible updates</h3><ul class="portal-updates">' + updatesHtml + '</ul>' +
        '<div class="field"><label for="clientUpdateBody">New update</label><input id="clientUpdateBody" placeholder="Shown to the client"></div>' +
        '<button type="button" class="btn" id="clientUpdateSaveBtn">Post client update</button>' +
      '</article>' +

      '<article class="portal-card"><h3>Internal notes</h3>' + notesHtml +
        '<div class="field"><label for="internalNoteBody">New note</label><input id="internalNoteBody" placeholder="Admin only, never shown to the client"></div>' +
        '<button type="button" class="btn" id="internalNoteSaveBtn">Add internal note</button>' +
      '</article>';

    document.getElementById('oppBackBtn').addEventListener('click', backToOpportunities);

    document.getElementById('oppSaveBtn').addEventListener('click', function(){
      var saveStatus = document.getElementById('oppSaveStatus');
      saveStatus.textContent = 'Saving...';
      saveStatus.classList.remove('is-error');
      patchJSON('/api/admin/projects', {
        id: project.id,
        status: document.getElementById('oppStageSelect').value,
        owner_id: document.getElementById('oppOwnerSelect').value || null
      }).then(function(result){
        if(!result.ok){
          saveStatus.textContent = result.body.error || 'Could not save.';
          saveStatus.classList.add('is-error');
          return;
        }
        openOpportunity(project.id);
      });
    });

    document.getElementById('sampleSaveBtn').addEventListener('click', function(){
      postJSON('/api/admin/samples', {
        project_id: project.id,
        shipping_name: document.getElementById('sampleShippingName').value,
        tracking_number: document.getElementById('sampleTracking').value,
        status: document.getElementById('sampleStatus').value
      }).then(function(){ openOpportunity(project.id); });
    });

    document.getElementById('pilotSaveBtn').addEventListener('click', function(){
      postJSON('/api/admin/pilots', {
        project_id: project.id,
        success_criteria: document.getElementById('pilotCriteria').value,
        status: document.getElementById('pilotStatus').value,
        start_date: document.getElementById('pilotStart').value || null,
        end_date: document.getElementById('pilotEnd').value || null
      }).then(function(){ openOpportunity(project.id); });
    });

    var pilotResultBtn = document.getElementById('pilotResultSaveBtn');
    if(pilotResultBtn){
      pilotResultBtn.addEventListener('click', function(){
        var latestPilot = data.pilots[0];
        postJSON('/api/admin/pilot-results', {
          pilot_id: latestPilot.id,
          outcome: document.getElementById('pilotResultOutcome').value || null,
          summary: document.getElementById('pilotResultSummary').value
        }).then(function(){ openOpportunity(project.id); });
      });
    }

    document.getElementById('proposalSaveBtn').addEventListener('click', function(){
      postJSON('/api/admin/proposals', {
        project_id: project.id,
        amount: document.getElementById('proposalAmount').value || null,
        currency: document.getElementById('proposalCurrency').value || 'USD',
        status: document.getElementById('proposalStatus').value
      }).then(function(){ openOpportunity(project.id); });
    });

    document.getElementById('contractSaveBtn').addEventListener('click', function(){
      postJSON('/api/admin/contracts', {
        project_id: project.id,
        value: document.getElementById('contractValue').value || null,
        currency: document.getElementById('contractCurrency').value || 'USD',
        status: document.getElementById('contractStatus').value
      }).then(function(){ openOpportunity(project.id); });
    });

    document.getElementById('documentSaveBtn').addEventListener('click', function(){
      postJSON('/api/admin/documents', {
        project_id: project.id,
        title: document.getElementById('documentTitle').value,
        url: document.getElementById('documentUrl').value,
        document_type: document.getElementById('documentType').value,
        visibility: document.getElementById('documentVisibility').value
      }).then(function(){ openOpportunity(project.id); });
    });

    document.getElementById('clientUpdateSaveBtn').addEventListener('click', function(){
      var body = document.getElementById('clientUpdateBody').value;
      if(!body) return;
      patchJSON('/api/admin/projects', {id: project.id, client_update: body}).then(function(){ openOpportunity(project.id); });
    });

    document.getElementById('internalNoteSaveBtn').addEventListener('click', function(){
      var body = document.getElementById('internalNoteBody').value;
      if(!body) return;
      patchJSON('/api/admin/projects', {id: project.id, internal_note: body}).then(function(){ openOpportunity(project.id); });
    });
  }

  function loadAdminDashboard(sessionToken){
    heading.textContent = 'Manage client inquiries from first contact to sample trial.';
    list.innerHTML = '<article class="portal-card"><p>Loading admin workspace...</p></article>';

    fetch('/api/admin/overview', {headers: {'x-session': sessionToken}})
      .then(function(res){ return res.json().then(function(body){ return {ok: res.ok, status: res.status, body: body}; }); })
      .then(function(result){
        if(!result.ok){
          if(result.status === 401){
            clearSession();
            setStatus(result.body.error || 'Please sign in again.', true);
            showAuth();
            return;
          }
          setStatus(result.body.error || 'Could not reach the admin service right now.', true);
          list.innerHTML = '<article class="portal-card"><h2>Unable to load admin data</h2><p>' + esc(result.body.error || 'Please try again.') + '</p></article>';
          return;
        }
        setStatus('', false);
        state.data = result.body;
        renderAdminKpis(result.body);
        renderAdminList();
      })
      .catch(function(){
        setStatus('Could not reach the admin service right now.', true);
        list.innerHTML = '<article class="portal-card"><h2>Unable to load admin data</h2><p>Check your connection and try again.</p></article>';
      });
  }

  var countriesCache = null;

  function ensureCountries(){
    if(countriesCache) return Promise.resolve(countriesCache);
    return fetch('/api/countries')
      .then(function(res){ return res.json(); })
      .then(function(body){
        countriesCache = body.countries || [];
        var select = document.getElementById('acctCountry');
        countriesCache.forEach(function(name){
          var option = document.createElement('option');
          option.value = name;
          option.textContent = name;
          select.appendChild(option);
        });
        return countriesCache;
      })
      .catch(function(){ return []; });
  }

  function loadAccountForm(){
    setAccountStatus('Loading account...', false);
    accountForm.acctEmailInput = document.getElementById('acctEmail');

    Promise.all([
      ensureCountries(),
      fetch('/api/profile', {headers: {'x-session': state.sessionToken}}).then(function(res){
        return res.json().then(function(body){ return {ok: res.ok, body: body}; });
      })
    ])
      .then(function(results){
        var result = results[1];
        if(!result.ok){
          setAccountStatus(result.body.error || 'Could not load account.', true);
          return;
        }
        var profile = result.body.profile || {};
        state.profile = profile;
        document.getElementById('acctName').value = profile.name || '';
        document.getElementById('acctEmail').value = profile.email || '';
        document.getElementById('acctCompanyName').value = profile.company_name || '';
        document.getElementById('acctJobTitle').value = profile.job_title || '';
        document.getElementById('acctPhone').value = profile.phone || '';
        document.getElementById('acctCountry').value = profile.country || '';
        document.getElementById('acctIndustry').value = profile.industry || '';
        document.getElementById('acctArchetype').value = profile.archetype || '';
        setAccountStatus('', false);
      })
      .catch(function(){
        setAccountStatus('Could not reach the account service right now.', true);
      });
  }

  function renderCurrentView(){
    if(state.view === 'account'){
      kpis.hidden = true;
      list.hidden = true;
      accountForm.hidden = false;
      var isMember = state.role === 'member';
      acctClientRow1.hidden = !isMember;
      acctClientRow2.hidden = !isMember;
      loadAccountForm();
      return;
    }

    kpis.hidden = false;
    list.hidden = false;
    accountForm.hidden = true;

    if(state.role === 'admin') renderAdminList();
  }

  function loadDashboard(role, sessionToken){
    if(role === 'admin') loadAdminDashboard(sessionToken);
    else loadClientDashboard(sessionToken);
  }

  function persistSession(role, sessionToken, email, status){
    sessionStorage.setItem(SESSION_KEY, sessionToken);
    sessionStorage.setItem(EMAIL_KEY, email || '');
    sessionStorage.setItem(ROLE_KEY, role);
    sessionStorage.setItem(STATUS_KEY, status || '');
    state.role = role;
    state.status = status;
    state.sessionToken = sessionToken;
  }

  function clearSession(){
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(STATUS_KEY);
    state.role = null;
    state.status = null;
    state.sessionToken = null;
  }

  form.addEventListener('submit', function(event){
    event.preventDefault();
    var email = form.loginEmail.value.trim();
    var password = form.loginPassword.value;
    var submitButton = form.querySelector('button[type="submit"]');
    if(submitButton) submitButton.disabled = true;
    setStatus('Signing in...', false);

    fetch('/api/login', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({email: email, password: password})
    })
      .then(function(res){ return res.json().then(function(body){ return {ok: res.ok, body: body}; }); })
      .then(function(result){
        if(submitButton) submitButton.disabled = false;
        if(!result.ok){
          setStatus(result.body.error || 'Something went wrong. Please try again.', true);
          return;
        }
        var role = result.body.role;
        persistSession(role, result.body.session_token, result.body.email, result.body.status);
        setStatus('', false);
        enterDashboard(role, result.body.email, result.body.status);
        loadDashboard(role, result.body.session_token);
      })
      .catch(function(){
        if(submitButton) submitButton.disabled = false;
        setStatus('Could not reach the login service right now. Please try again shortly.', true);
      });
  });

  accountForm.addEventListener('submit', function(event){
    event.preventDefault();
    var submitButton = accountForm.querySelector('button[type="submit"]');
    if(submitButton) submitButton.disabled = true;
    setAccountStatus('Saving...', false);

    var payload = {
      name: document.getElementById('acctName').value,
      phone: document.getElementById('acctPhone').value,
      country: document.getElementById('acctCountry').value
    };
    if(state.role === 'member'){
      payload.company_name = document.getElementById('acctCompanyName').value;
      payload.job_title = document.getElementById('acctJobTitle').value;
      payload.industry = document.getElementById('acctIndustry').value;
      payload.archetype = document.getElementById('acctArchetype').value;
    }

    fetch('/api/profile', {
      method: 'PATCH',
      headers: {'content-type': 'application/json', 'x-session': state.sessionToken},
      body: JSON.stringify(payload)
    })
      .then(function(res){ return res.json().then(function(body){ return {ok: res.ok, body: body}; }); })
      .then(function(result){
        if(submitButton) submitButton.disabled = false;
        if(!result.ok){
          setAccountStatus(result.body.error || 'Could not save changes.', true);
          return;
        }
        state.profile = result.body.profile;
        setAccountStatus('Saved.', false);
      })
      .catch(function(){
        if(submitButton) submitButton.disabled = false;
        setAccountStatus('Could not reach the account service right now.', true);
      });
  });

  if(signOutButton){
    signOutButton.addEventListener('click', function(){
      clearSession();
      form.reset();
      showAuth();
    });
  }

  var storedSession = sessionStorage.getItem(SESSION_KEY);
  var storedRole = sessionStorage.getItem(ROLE_KEY);
  var storedEmail = sessionStorage.getItem(EMAIL_KEY);
  var storedStatus = sessionStorage.getItem(STATUS_KEY);
  if(storedSession && storedRole){
    state.role = storedRole;
    state.status = storedStatus;
    state.sessionToken = storedSession;
    enterDashboard(storedRole, storedEmail, storedStatus);
    loadDashboard(storedRole, storedSession);
  }
})();
