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
  var modalRoot = document.getElementById('modalRoot');

  var ICON_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  var ICON_PENCIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var ICON_CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
  var ICON_BACK = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';

  // ---------- modal ----------
  // openModal renders a popup with a body and Save/Cancel footer. onSave receives
  // the modal element (so it can read its own inputs) and a done(ok) callback:
  // call done(true) to close on success, done(false) or nothing to keep it open
  // (e.g. after showing a validation/API error inside the modal).
  var activeModal = null;

  function closeModal(){
    if(!activeModal) return;
    activeModal.overlay.classList.remove('is-open');
    setTimeout(function(){ modalRoot.innerHTML = ''; }, 160);
    activeModal = null;
    document.removeEventListener('keydown', onModalKeydown);
  }

  function onModalKeydown(event){
    if(event.key === 'Escape') closeModal();
  }

  function openModal(options){
    modalRoot.innerHTML =
      '<div class="modal-overlay" id="modalOverlay">' +
        '<div class="modal" role="dialog" aria-modal="true">' +
          '<div class="modal__head"><h3>' + esc(options.title) + '</h3><button type="button" class="modal__close" id="modalCloseBtn" aria-label="Close">' + ICON_CLOSE + '</button></div>' +
          '<div class="modal__body" id="modalBody">' + options.bodyHtml + '</div>' +
          '<div class="modal__foot">' +
            '<p class="modal__foot-status" id="modalFootStatus"></p>' +
            '<div class="modal__foot-actions">' +
              '<button type="button" class="btn" id="modalCancelBtn">Cancel</button>' +
              '<button type="button" class="btn btn--solid" id="modalSaveBtn">' + esc(options.saveLabel || 'Save') + '</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var overlay = document.getElementById('modalOverlay');
    var modalEl = modalRoot.querySelector('.modal');
    var footStatus = document.getElementById('modalFootStatus');
    var saveBtn = document.getElementById('modalSaveBtn');

    activeModal = {overlay: overlay, el: modalEl};
    requestAnimationFrame(function(){ overlay.classList.add('is-open'); });
    document.addEventListener('keydown', onModalKeydown);

    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', function(event){ if(event.target === overlay) closeModal(); });

    if(options.onMount) options.onMount(modalEl);

    saveBtn.addEventListener('click', function(){
      footStatus.textContent = '';
      footStatus.classList.remove('is-error');
      saveBtn.disabled = true;
      var done = function(ok, message){
        saveBtn.disabled = false;
        if(ok){ closeModal(); return; }
        if(message){
          footStatus.textContent = message;
          footStatus.classList.add('is-error');
        }
      };
      options.onSave(modalEl, done);
    });
  }

  var SESSION_KEY = 'ecoshell_session';
  var EMAIL_KEY = 'ecoshell_email';
  var ROLE_KEY = 'ecoshell_role';
  var STATUS_KEY = 'ecoshell_status';

  var state = {role: null, status: null, sessionToken: null, view: 'dashboard', data: null, profile: null, opportunity: null, returnView: null};

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
  var ICON_CLIENTS = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
  var ICON_ACCOUNT = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

  function navItem(view, icon, label){
    return '<button type="button" class="app-nav__item" data-view="' + view + '">' + icon + label + '</button>';
  }

  function stageNavItem(pair, count){
    return '<button type="button" class="app-nav__item" data-view="stage:' + pair[0] + '">' + esc(pair[1]) + '<span class="app-nav__count">' + count + '</span></button>';
  }

  var CLIENT_NAV = '<p class="app-nav__label">Overview</p>' +
    navItem('dashboard', ICON_DASHBOARD, 'Dashboard') +
    navItem('account', ICON_ACCOUNT, 'Account');

  // Admin nav is built dynamically (see adminNavHtml) so each pipeline stage
  // can show a live count of opportunities currently sitting in it.
  function adminNavHtml(projects){
    var counts = countBy(projects || [], 'status');
    var open = STAGES.slice(0, 10);
    var closed = STAGES.slice(10);
    return '<p class="app-nav__label">Pipeline</p>' +
      open.map(function(pair){ return stageNavItem(pair, counts[pair[0]] || 0); }).join('') +
      '<p class="app-nav__label">Closed</p>' +
      closed.map(function(pair){ return stageNavItem(pair, counts[pair[0]] || 0); }).join('') +
      '<p class="app-nav__label">Workspace</p>' +
      navItem('clients', ICON_CLIENTS, 'Clients') +
      navItem('account', ICON_ACCOUNT, 'Account');
  }

  var INDUSTRIES = ['Beauty', 'Fashion', 'Food and Agri', 'Health & Life Sciences', 'Tech', 'Toys'];
  var ARCHETYPES = [
    'Converter', 'Distributors', 'Ecoshell Branded', 'Ecosystem Player', 'Emerging Brand',
    'Large Brands', 'Large Retailer', 'Material Manufacturer', 'Manufacturer Supplier',
    'Mid Market', 'Specialty compounder'
  ];
  var CLIENT_STATUSES = ['lead', 'contact', 'client'];

  function optionsHtml(values, selected, placeholder){
    return '<option value="">' + placeholder + '</option>' + values.map(function(v){
      return '<option value="' + esc(v) + '"' + (v === selected ? ' selected' : '') + '>' + esc(v) + '</option>';
    }).join('');
  }

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
    // Placeholder counts until loadAdminDashboard fetches real data and calls renderAdminNav.
    appNav.innerHTML = role === 'admin' ? adminNavHtml(adminDemo.projects) : CLIENT_NAV;

    // Delegated on the container (not per-item) so it survives renderAdminNav rebuilding the nav.
    appNav.addEventListener('click', function(event){
      var tab = event.target.closest('.app-nav__item[data-view]');
      if(!tab) return;
      state.view = tab.dataset.view;
      state.opportunity = null;
      setActiveNav(state.view);
      renderCurrentView();
    });

    state.view = role === 'admin' ? 'stage:new_inquiry' : 'dashboard';
    setActiveNav(state.view);
  }

  function renderAdminNav(data){
    appNav.innerHTML = adminNavHtml(data.projects);
    setActiveNav(state.view);
  }

  // While viewing one opportunity, the sidebar swaps the global stage list
  // for that opportunity's own pipeline position, so it's clear where this
  // particular client sits without scrolling back up to the top of the page.
  function renderOppNav(project){
    var companyName = project.companies?.name;
    var siblings = ((state.data || adminDemo).projects || []).filter(function(p){
      return companyName && p.companies && p.companies.name === companyName && p.id !== project.id;
    });
    var siblingsHtml = siblings.length ? (
      '<p class="app-nav__label">Also for ' + esc(companyName) + '</p>' +
      siblings.map(function(p){
        return '<button type="button" class="app-nav__item" data-switch-opp="' + esc(p.id) + '">' + esc(p.name) + '<span class="app-nav__count">' + esc(labelStatus(p.status)) + '</span></button>';
      }).join('')
    ) : '';

    appNav.innerHTML =
      '<button type="button" class="app-nav__item" id="oppNavBackBtn">' + ICON_BACK + 'Back to pipeline</button>' +
      '<p class="app-nav__label">' + esc(project.reference_code) + '</p>' +
      pipelineHtml(project.status) +
      siblingsHtml;

    document.getElementById('oppNavBackBtn').addEventListener('click', backToOpportunities);

    appNav.querySelectorAll('[data-switch-opp]').forEach(function(btn){
      btn.addEventListener('click', function(){ openOpportunity(btn.getAttribute('data-switch-opp')); });
    });

    appNav.querySelectorAll('.pipeline__step').forEach(function(btn){
      btn.addEventListener('click', function(){
        var stage = btn.getAttribute('data-stage');
        if(stage === project.status) return;
        var label = STAGES.find(function(s){ return s[0] === stage; })[1];
        openModal({
          title: 'Move to "' + label + '"?',
          saveLabel: 'Move stage',
          bodyHtml: '<p class="portal-note">This updates the opportunity\'s pipeline stage. The client sees the new stage next time they open the portal.</p>',
          onSave: function(modalEl, done){
            patchJSON('/api/admin/projects', {id: project.id, status: stage}).then(function(result){
              if(!result.ok){ done(false, result.body.error || 'Could not save.'); return; }
              done(true);
              openOpportunity(project.id);
            });
          }
        });
      });
    });
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

  // Compact single-line rows for admin lists, replacing full-width cards.
  // dataAttrs is a raw HTML attribute string (e.g. 'data-open-project="123"').
  function rowItem(opts){
    return '<div class="rowlist__item"' + (opts.dataAttrs || '') + '>' +
      '<div class="rowlist__main"><p class="rowlist__title">' + esc(opts.title) + '</p>' +
      (opts.sub ? '<p class="rowlist__sub">' + esc(opts.sub) + '</p>' : '') + '</div>' +
      (opts.status ? '<span class="pill">' + esc(labelStatus(opts.status)) + '</span>' : '') +
      (opts.extraHtml || '') +
      (opts.clickable ? '<span class="icon-btn" aria-hidden="true">' + ICON_CHEVRON + '</span>' : '') +
    '</div>';
  }

  function rowlistHtml(rows, emptyText, clickable){
    return '<div class="rowlist' + (clickable ? ' rowlist--clickable' : '') + '">' +
      (rows.length ? rows.join('') : '<div class="rowlist__empty">' + esc(emptyText) + '</div>') +
    '</div>';
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
    heading.textContent = 'Clients';
    var clients = data.clients || [];
    var companies = data.companies || [];
    var archetypeCounts = countBy(clients, 'archetype');
    var industryCounts = countBy(clients, 'industry');

    kpis.hidden = false;
    kpis.innerHTML = [
      '<article><b>' + clients.length + '</b><span>Clients</span></article>',
      '<article><b>' + companies.length + '</b><span>Companies</span></article>'
    ].join('');

    var editIcon = function(attr, id){
      return '<button type="button" class="icon-btn" data-' + attr + '="' + esc(id) + '" aria-label="Edit profile" title="Edit profile">' + ICON_PENCIL + '</button>';
    };

    function oppCountLabel(n){
      return n ? n + ' opportunit' + (n === 1 ? 'y' : 'ies') : 'No opportunities yet';
    }

    var oppCountByEmail = {};
    var oppCountByCompany = {};
    (data.projects || []).forEach(function(p){
      if(p.contact && p.contact.email) oppCountByEmail[p.contact.email] = (oppCountByEmail[p.contact.email] || 0) + 1;
      if(p.companies && p.companies.name) oppCountByCompany[p.companies.name] = (oppCountByCompany[p.companies.name] || 0) + 1;
    });

    var clientRows = clients.map(function(item){
      var details = [item.company_name, item.job_title, item.industry, oppCountLabel(oppCountByEmail[item.email])].filter(Boolean).join(' · ');
      return rowItem({
        title: item.name || item.email, sub: details, status: item.status || 'lead',
        clickable: true, extraHtml: editIcon('edit-client', item.id),
        dataAttrs: ' data-go-client="' + esc(item.id) + '"'
      });
    });

    var companyRows = companies.map(function(item){
      var details = [item.industry, item.archetype, item.country, oppCountLabel(oppCountByCompany[item.name])].filter(Boolean).join(' · ');
      return rowItem({
        title: item.name, sub: details, clickable: true,
        extraHtml: editIcon('edit-company', item.id),
        dataAttrs: ' data-go-company="' + esc(item.id) + '"'
      });
    });

    list.innerHTML =
      '<div class="breakdown-grid">' +
        breakdownTable('By archetype', archetypeCounts) +
        breakdownTable('By industry', industryCounts) +
      '</div>' +
      '<article class="portal-card"><h3>Clients</h3>' + rowlistHtml(clientRows, 'No client accounts yet.', true) + '</article>' +
      '<article class="portal-card"><h3>Companies</h3>' + rowlistHtml(companyRows, 'No companies yet.', true) + '</article>';

    list.querySelectorAll('[data-edit-client]').forEach(function(el){
      el.addEventListener('click', function(event){ event.stopPropagation(); openClientModal(el.getAttribute('data-edit-client')); });
    });
    list.querySelectorAll('[data-edit-company]').forEach(function(el){
      el.addEventListener('click', function(event){ event.stopPropagation(); openCompanyModal(el.getAttribute('data-edit-company')); });
    });

    list.querySelectorAll('[data-go-client]').forEach(function(el){
      el.addEventListener('click', function(event){
        if(event.target.closest('[data-edit-client]')) return;
        var client = clients.find(function(c){ return String(c.id) === el.getAttribute('data-go-client'); });
        if(!client) return;
        var matches = (data.projects || []).filter(function(p){ return p.contact && p.contact.email === client.email; });
        goToClientOpportunity(matches, function(){ openClientModal(client.id); });
      });
    });
    list.querySelectorAll('[data-go-company]').forEach(function(el){
      el.addEventListener('click', function(event){
        if(event.target.closest('[data-edit-company]')) return;
        var company = companies.find(function(c){ return String(c.id) === el.getAttribute('data-go-company'); });
        if(!company) return;
        var matches = (data.projects || []).filter(function(p){ return p.companies && p.companies.name === company.name; });
        goToClientOpportunity(matches, function(){ openCompanyModal(company.id); });
      });
    });
  }

  // A client/company row leads straight into their opportunity's workflow
  // view (the same one opened from the pipeline stage list) rather than a
  // profile popup — the popup is now the pencil icon instead of the default
  // click. With no opportunity yet, falls back to the profile edit.
  function goToClientOpportunity(matches, fallback){
    if(!matches.length){ fallback(); return; }
    if(matches.length === 1){ openOpportunity(matches[0].id); return; }
    var rows = matches.map(function(p){
      return rowItem({
        title: p.reference_code + ' — ' + p.name, sub: labelStatus(p.status),
        clickable: true, dataAttrs: ' data-pick-opp="' + esc(p.id) + '"'
      });
    });
    openModal({
      title: 'Choose an opportunity',
      saveLabel: 'Close',
      bodyHtml: rowlistHtml(rows, 'No opportunities.', true),
      onMount: function(modalEl){
        modalEl.querySelectorAll('[data-pick-opp]').forEach(function(el){
          el.addEventListener('click', function(){
            var id = el.getAttribute('data-pick-opp');
            closeModal();
            openOpportunity(id);
          });
        });
      },
      onSave: function(modalEl, done){ done(true); }
    });
  }

  function openClientModal(id){
    var data = state.data || adminDemo;
    var client = (data.clients || []).find(function(c){ return String(c.id) === id; });
    if(!client) return;

    ensureCountries().then(function(){
      openModal({
        title: client.name || client.email,
        saveLabel: 'Save client',
        bodyHtml:
          '<div class="frow">' +
            '<div class="field"><label for="clientEditName">Name</label><input id="clientEditName" value="' + esc(client.name || '') + '"></div>' +
            '<div class="field"><label for="clientEditStatus">Status</label><select id="clientEditStatus">' + CLIENT_STATUSES.map(function(v){ return '<option value="' + v + '"' + (v === (client.status || 'lead') ? ' selected' : '') + '>' + esc(labelStatus(v)) + '</option>'; }).join('') + '</select></div>' +
          '</div>' +
          '<div class="frow">' +
            '<div class="field"><label for="clientEditCompanyName">Company name</label><input id="clientEditCompanyName" value="' + esc(client.company_name || '') + '"></div>' +
            '<div class="field"><label for="clientEditJobTitle">Job title</label><input id="clientEditJobTitle" value="' + esc(client.job_title || '') + '"></div>' +
          '</div>' +
          '<div class="frow">' +
            '<div class="field"><label for="clientEditPhone">Phone</label><input id="clientEditPhone" value="' + esc(client.phone || '') + '"></div>' +
            '<div class="field"><label for="clientEditCountry">Country</label><select id="clientEditCountry">' + optionsHtml(countriesCache || [], client.country || '', 'Select a country') + '</select></div>' +
          '</div>' +
          '<div class="frow">' +
            '<div class="field"><label for="clientEditIndustry">Industry</label><select id="clientEditIndustry">' + optionsHtml(INDUSTRIES, client.industry || '', 'Select an industry') + '</select></div>' +
            '<div class="field"><label for="clientEditArchetype">Archetype</label><select id="clientEditArchetype">' + optionsHtml(ARCHETYPES, client.archetype || '', 'Select an archetype') + '</select></div>' +
          '</div>',
        onSave: function(modalEl, done){
          patchJSON('/api/admin/clients', {
            id: client.id,
            name: document.getElementById('clientEditName').value,
            status: document.getElementById('clientEditStatus').value,
            company_name: document.getElementById('clientEditCompanyName').value,
            job_title: document.getElementById('clientEditJobTitle').value,
            phone: document.getElementById('clientEditPhone').value,
            country: document.getElementById('clientEditCountry').value,
            industry: document.getElementById('clientEditIndustry').value,
            archetype: document.getElementById('clientEditArchetype').value
          }).then(function(result){
            if(!result.ok){ done(false, result.body.error || 'Could not save.'); return; }
            done(true);
            loadAdminDashboard(state.sessionToken);
          });
        }
      });
    });
  }

  function openCompanyModal(id){
    var data = state.data || adminDemo;
    var company = (data.companies || []).find(function(c){ return String(c.id) === id; });
    if(!company) return;

    ensureCountries().then(function(){
      openModal({
        title: company.name,
        saveLabel: 'Save company',
        bodyHtml:
          '<div class="field"><label for="companyEditName">Company name</label><input id="companyEditName" value="' + esc(company.name || '') + '"></div>' +
          '<div class="frow">' +
            '<div class="field"><label for="companyEditIndustry">Industry</label><select id="companyEditIndustry">' + optionsHtml(INDUSTRIES, company.industry || '', 'Select an industry') + '</select></div>' +
            '<div class="field"><label for="companyEditArchetype">Archetype</label><select id="companyEditArchetype">' + optionsHtml(ARCHETYPES, company.archetype || '', 'Select an archetype') + '</select></div>' +
          '</div>' +
          '<div class="field"><label for="companyEditCountry">Country</label><select id="companyEditCountry">' + optionsHtml(countriesCache || [], company.country || '', 'Select a country') + '</select></div>',
        onSave: function(modalEl, done){
          patchJSON('/api/admin/companies', {
            id: company.id,
            name: document.getElementById('companyEditName').value,
            industry: document.getElementById('companyEditIndustry').value,
            archetype: document.getElementById('companyEditArchetype').value,
            country: document.getElementById('companyEditCountry').value
          }).then(function(result){
            if(!result.ok){ done(false, result.body.error || 'Could not save.'); return; }
            done(true);
            loadAdminDashboard(state.sessionToken);
          });
        }
      });
    });
  }

  function openNewOpportunityModal(defaultStage){
    openModal({
      title: 'New opportunity',
      saveLabel: 'Add opportunity',
      bodyHtml:
        '<p class="portal-note">For leads that didn\'t come through the website contact form — a trade show contact, a referral, a cold outreach target.</p>' +
        '<div class="frow">' +
          '<div class="field"><label for="newOppCompany">Company name</label><input id="newOppCompany" placeholder="Acme Packaging"></div>' +
          '<div class="field"><label for="newOppName">Opportunity name</label><input id="newOppName" placeholder="Closure review for Acme Packaging"></div>' +
        '</div>' +
        '<div class="frow">' +
          '<div class="field"><label for="newOppContactName">Contact name</label><input id="newOppContactName" placeholder="Jordan Lee"></div>' +
          '<div class="field"><label for="newOppContactEmail">Contact email</label><input id="newOppContactEmail" type="email" placeholder="jordan@acme.com"></div>' +
        '</div>' +
        '<div class="field"><label for="newOppStage">Starting stage</label><select id="newOppStage">' + stageOptions(defaultStage || 'new_inquiry') + '</select></div>',
      onSave: function(modalEl, done){
        var companyName = document.getElementById('newOppCompany').value.trim();
        var oppName = document.getElementById('newOppName').value.trim();
        var contactEmail = document.getElementById('newOppContactEmail').value.trim();

        if(!companyName || !oppName || !contactEmail){
          done(false, 'Company name, opportunity name and contact email are required.');
          return;
        }

        postJSON('/api/admin/opportunities', {
          company_name: companyName,
          name: oppName,
          contact_name: document.getElementById('newOppContactName').value.trim(),
          contact_email: contactEmail,
          status: document.getElementById('newOppStage').value
        }).then(function(result){
          if(!result.ok){ done(false, result.body.error || 'Could not add opportunity.'); return; }
          done(true);
          loadAdminDashboard(state.sessionToken);
          openOpportunity(result.body.project.id);
        });
      }
    });
  }

  function renderStageView(data, stage){
    var stagePair = STAGES.find(function(s){ return s[0] === stage; });
    var stageLabel = stagePair ? stagePair[1] : labelStatus(stage);
    heading.textContent = stageLabel;

    var stageProjects = data.projects.filter(function(item){ return item.status === stage; });
    kpis.hidden = false;
    kpis.innerHTML = '<article><b>' + stageProjects.length + '</b><span>' + esc(stageLabel) + '</span></article>';

    var projectRows = stageProjects.map(function(item){
      var sub = (item.companies?.name || 'Company') + ' · Owner: ' + (item.owner ? (item.owner.name || item.owner.email) : 'Unassigned') +
        ' · Contact: ' + (item.contact ? (item.contact.name || item.contact.email) : 'No contact');
      return rowItem({
        title: item.reference_code + ' — ' + item.name, sub: sub,
        clickable: true, dataAttrs: ' data-open-project="' + esc(item.id) + '"'
      });
    });
    list.innerHTML =
      '<article class="portal-card">' +
        '<div class="card-head"><h3>' + esc(stageLabel) + '</h3><button type="button" class="btn" id="newOppBtn">' + ICON_PLUS + 'New opportunity</button></div>' +
        rowlistHtml(projectRows, 'No opportunities at this stage.', true) +
      '</article>';
    list.querySelectorAll('[data-open-project]').forEach(function(el){
      el.addEventListener('click', function(){ openOpportunity(el.getAttribute('data-open-project')); });
    });
    document.getElementById('newOppBtn').addEventListener('click', function(){ openNewOpportunityModal(stage); });
  }

  function renderAdminList(){
    var data = state.data || adminDemo;
    if(state.view.indexOf('stage:') === 0){
      renderStageView(data, state.view.slice(6));
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
    state.view = state.returnView || 'stage:new_inquiry';
    renderAdminNav(state.data || adminDemo);
    renderAdminList();
  }

  function openOpportunity(id){
    if(state.view.indexOf('stage:') === 0 || state.view === 'clients') state.returnView = state.view;
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

  function pipelineHtml(currentStatus){
    var currentIndex = STAGES.findIndex(function(s){ return s[0] === currentStatus; });
    return '<nav class="pipeline" aria-label="Pipeline stage">' + STAGES.map(function(pair, i){
      var cls = pair[0] === currentStatus ? 'is-current' : (i < currentIndex ? 'is-done' : '');
      return '<button type="button" class="pipeline__step ' + cls + '" data-stage="' + pair[0] + '" title="' + esc(pair[1]) + '">' +
        '<span class="pipeline__bar"></span><span class="pipeline__label">' + esc(pair[1]) + '</span></button>';
    }).join('') + '</nav>';
  }

  // Each section below the pipeline (samples, pilot, proposal, contract,
  // documents, updates, notes) shares one shape: a list of compact rows,
  // a "+" to add one via modal, and a pencil on each row to edit it via
  // the same modal with fields pre-filled.
  function oppSections(data){
    return {
      sample: {
        label: 'sample', createLabel: 'Add sample', createUrl: '/api/admin/samples', updateUrl: '/api/admin/samples',
        items: data.samples || [],
        row: function(r){ return {title: labelStatus(r.status), sub: [r.shipping_name, r.tracking_number ? 'Tracking ' + r.tracking_number : null].filter(Boolean).join(' · ')}; },
        fieldsHtml: function(r){
          r = r || {};
          return '<div class="frow">' +
            '<div class="field"><label for="fShippingName">Shipping name</label><input id="fShippingName" value="' + esc(r.shipping_name || '') + '"></div>' +
            '<div class="field"><label for="fTracking">Tracking number</label><input id="fTracking" value="' + esc(r.tracking_number || '') + '"></div>' +
          '</div>' +
          '<div class="field"><label for="fStatus">Status</label><select id="fStatus">' + ['requested', 'preparing', 'shipped', 'delivered'].map(function(v){ return '<option value="' + v + '"' + (v === (r.status || 'requested') ? ' selected' : '') + '>' + esc(labelStatus(v)) + '</option>'; }).join('') + '</select></div>';
        },
        payload: function(){
          return {
            shipping_name: document.getElementById('fShippingName').value,
            tracking_number: document.getElementById('fTracking').value,
            status: document.getElementById('fStatus').value
          };
        }
      },
      pilot: {
        label: 'pilot', createLabel: 'Add pilot', createUrl: '/api/admin/pilots', updateUrl: '/api/admin/pilots',
        items: data.pilots || [],
        row: function(r){
          var resultCount = (r.pilot_results || []).length;
          return {title: labelStatus(r.status), sub: [r.success_criteria, (r.start_date || r.end_date) ? (r.start_date || '?') + ' – ' + (r.end_date || '?') : null, resultCount ? resultCount + ' result' + (resultCount > 1 ? 's' : '') : null].filter(Boolean).join(' · ')};
        },
        fieldsHtml: function(r){
          r = r || {};
          return '<div class="field"><label for="fCriteria">Success criteria</label><input id="fCriteria" value="' + esc(r.success_criteria || '') + '"></div>' +
          '<div class="field"><label for="fStatus">Status</label><select id="fStatus">' + ['planned', 'in_progress', 'complete'].map(function(v){ return '<option value="' + v + '"' + (v === (r.status || 'planned') ? ' selected' : '') + '>' + esc(labelStatus(v)) + '</option>'; }).join('') + '</select></div>' +
          '<div class="frow">' +
            '<div class="field"><label for="fStart">Start date</label><input type="date" id="fStart" value="' + esc(r.start_date || '') + '"></div>' +
            '<div class="field"><label for="fEnd">End date</label><input type="date" id="fEnd" value="' + esc(r.end_date || '') + '"></div>' +
          '</div>';
        },
        payload: function(){
          return {
            success_criteria: document.getElementById('fCriteria').value,
            status: document.getElementById('fStatus').value,
            start_date: document.getElementById('fStart').value || null,
            end_date: document.getElementById('fEnd').value || null
          };
        }
      },
      proposal: {
        label: 'proposal', createLabel: 'Add proposal', createUrl: '/api/admin/proposals', updateUrl: '/api/admin/proposals',
        items: data.proposals || [],
        row: function(r){ return {title: labelStatus(r.status), sub: r.amount ? (r.currency || 'USD') + ' ' + r.amount : ''}; },
        fieldsHtml: function(r){
          r = r || {};
          return '<div class="frow">' +
            '<div class="field"><label for="fAmount">Amount</label><input type="number" id="fAmount" value="' + esc(r.amount || '') + '"></div>' +
            '<div class="field"><label for="fCurrency">Currency</label><input id="fCurrency" value="' + esc(r.currency || 'USD') + '"></div>' +
          '</div>' +
          '<div class="field"><label for="fStatus">Status</label><select id="fStatus">' + ['draft', 'sent', 'accepted', 'declined'].map(function(v){ return '<option value="' + v + '"' + (v === (r.status || 'draft') ? ' selected' : '') + '>' + esc(labelStatus(v)) + '</option>'; }).join('') + '</select></div>';
        },
        payload: function(){
          return {
            amount: document.getElementById('fAmount').value || null,
            currency: document.getElementById('fCurrency').value || 'USD',
            status: document.getElementById('fStatus').value
          };
        }
      },
      contract: {
        label: 'contract', createLabel: 'Add contract', createUrl: '/api/admin/contracts', updateUrl: '/api/admin/contracts',
        items: data.contracts || [],
        row: function(r){ return {title: labelStatus(r.status), sub: r.value ? (r.currency || 'USD') + ' ' + r.value : ''}; },
        fieldsHtml: function(r){
          r = r || {};
          return '<div class="frow">' +
            '<div class="field"><label for="fValue">Value</label><input type="number" id="fValue" value="' + esc(r.value || '') + '"></div>' +
            '<div class="field"><label for="fCurrency">Currency</label><input id="fCurrency" value="' + esc(r.currency || 'USD') + '"></div>' +
          '</div>' +
          '<div class="field"><label for="fStatus">Status</label><select id="fStatus">' + ['pending', 'signed', 'active', 'ended'].map(function(v){ return '<option value="' + v + '"' + (v === (r.status || 'pending') ? ' selected' : '') + '>' + esc(labelStatus(v)) + '</option>'; }).join('') + '</select></div>';
        },
        payload: function(){
          return {
            value: document.getElementById('fValue').value || null,
            currency: document.getElementById('fCurrency').value || 'USD',
            status: document.getElementById('fStatus').value
          };
        }
      },
      document: {
        label: 'document', createLabel: 'Add document', createUrl: '/api/admin/documents', updateUrl: '/api/admin/documents',
        items: data.documents || [],
        row: function(r){ return {title: r.title, sub: [labelStatus(r.visibility), r.document_type].filter(Boolean).join(' · ')}; },
        fieldsHtml: function(r){
          r = r || {};
          return '<div class="frow">' +
            '<div class="field"><label for="fTitle">Title</label><input id="fTitle" value="' + esc(r.title || '') + '"></div>' +
            '<div class="field"><label for="fUrl">URL</label><input id="fUrl" value="' + esc(r.url || '') + '"></div>' +
          '</div>' +
          '<div class="frow">' +
            '<div class="field"><label for="fType">Type</label><input id="fType" placeholder="e.g. spec sheet" value="' + esc(r.document_type || '') + '"></div>' +
            '<div class="field"><label for="fVisibility">Visibility</label><select id="fVisibility"><option value="client"' + (r.visibility !== 'internal' ? ' selected' : '') + '>Client-visible</option><option value="internal"' + (r.visibility === 'internal' ? ' selected' : '') + '>Internal only</option></select></div>' +
          '</div>';
        },
        payload: function(){
          return {
            title: document.getElementById('fTitle').value,
            url: document.getElementById('fUrl').value,
            document_type: document.getElementById('fType').value,
            visibility: document.getElementById('fVisibility').value
          };
        }
      },
      clientUpdate: {
        label: 'client update', createLabel: 'Post update', createUrl: null, updateUrl: '/api/admin/updates',
        items: data.updates || [],
        row: function(r){ return {title: r.body, sub: ''}; },
        fieldsHtml: function(r){ r = r || {}; return '<div class="field"><label for="fBody">Update</label><textarea id="fBody" placeholder="Shown to the client">' + esc(r.body || '') + '</textarea></div>'; },
        payload: function(){ return {body: document.getElementById('fBody').value}; }
      },
      note: {
        label: 'internal note', createLabel: 'Add note', createUrl: null, updateUrl: '/api/admin/notes',
        items: data.notes || [],
        row: function(r){ return {title: r.body, sub: '— ' + r.created_by}; },
        fieldsHtml: function(r){ r = r || {}; return '<div class="field"><label for="fBody">Note</label><textarea id="fBody" placeholder="Admin only, never shown to the client">' + esc(r.body || '') + '</textarea></div>'; },
        payload: function(){ return {body: document.getElementById('fBody').value}; }
      }
    };
  }

  function renderOpportunityDetail(){
    var data = state.opportunity;
    var project = data.project;
    var admins = (state.data && state.data.admins) || [];
    var sections = oppSections(data);

    function reload(){ openOpportunity(project.id); }

    function openRecordModal(type, record){
      var cfg = sections[type];
      openModal({
        title: (record ? 'Edit ' : 'Add ') + cfg.label,
        saveLabel: record ? 'Save' : cfg.createLabel,
        bodyHtml: cfg.fieldsHtml(record),
        onSave: function(modalEl, done){
          var url = record ? cfg.updateUrl : cfg.createUrl;
          var body = record ? Object.assign({id: record.id}, cfg.payload()) : Object.assign({project_id: project.id}, cfg.payload());
          var request = record ? patchJSON(url, body) : postJSON(url, body);
          request.then(function(result){
            if(!result.ok){ done(false, result.body.error || 'Could not save.'); return; }
            done(true);
            reload();
          });
        }
      });
    }

    function sectionHtml(type, heading){
      var cfg = sections[type];
      var rows = cfg.items.map(function(item){
        var r = cfg.row(item);
        var extraHtml = type === 'pilot'
          ? '<button type="button" class="icon-btn" data-add-result="' + esc(item.id) + '" aria-label="Record pilot result" title="Record pilot result">' + ICON_PLUS + '</button>'
          : '';
        return rowItem({title: r.title, sub: r.sub, clickable: true, extraHtml: extraHtml, dataAttrs: ' data-open-record="' + type + '" data-id="' + esc(item.id) + '"'});
      });
      return '<article class="portal-card">' +
        '<div class="card-head"><h3>' + esc(heading) + '</h3><button type="button" class="icon-btn icon-btn--accent" data-add-record="' + type + '" aria-label="' + esc(cfg.createLabel) + '">' + ICON_PLUS + '</button></div>' +
        rowlistHtml(rows, 'Nothing recorded yet.', true) +
      '</article>';
    }

    function openPilotResultModal(pilotId){
      openModal({
        title: 'Record pilot result',
        saveLabel: 'Save result',
        bodyHtml:
          '<div class="field"><label for="fOutcome">Outcome</label><select id="fOutcome"><option value="">Select outcome</option><option value="pass">Pass</option><option value="partial">Partial</option><option value="fail">Fail</option></select></div>' +
          '<div class="field"><label for="fSummary">Summary</label><textarea id="fSummary"></textarea></div>',
        onSave: function(modalEl, done){
          var summary = document.getElementById('fSummary').value;
          if(!summary){ done(false, 'A summary is required.'); return; }
          postJSON('/api/admin/pilot-results', {
            pilot_id: pilotId,
            outcome: document.getElementById('fOutcome').value || null,
            summary: summary
          }).then(function(result){
            if(!result.ok){ done(false, result.body.error || 'Could not save.'); return; }
            done(true);
            reload();
          });
        }
      });
    }

    heading.textContent = project.companies?.name || project.name;
    renderOppNav(project);

    list.innerHTML =
      '<article class="portal-card">' +
        '<div class="portal-card__top"><div><p class="portal-ref">' + esc(project.reference_code) + '</p><h2>' + esc(project.name) + '</h2></div><span class="pill">' + esc(labelStatus(project.status)) + '</span></div>' +
        '<dl class="portal-meta"><div><dt>Company</dt><dd>' + esc(project.companies?.name || 'Company') + '</dd></div><div><dt>Contact</dt><dd>' + esc(project.contact?.name || project.contact?.email || 'No contact') + '</dd></div><div><dt>Owner</dt><dd>' + esc(project.owner?.name || project.owner?.email || 'Unassigned') + '</dd></div></dl>' +
        '<div class="card-head">' +
          '<p class="portal-note" style="flex:1">' +
            (project.polymer ? '<b>Polymer:</b> ' + esc(project.polymer) + ' &nbsp; ' : '') +
            (project.process ? '<b>Process:</b> ' + esc(project.process) + ' &nbsp; ' : '') +
            (project.target ? esc(project.target) : (project.polymer || project.process ? '' : 'No polymer, process or target set yet.')) +
          '</p>' +
          '<button type="button" class="icon-btn" id="oppDetailsEditBtn" aria-label="Edit details">' + ICON_PENCIL + '</button>' +
        '</div>' +
      '</article>' +

      sectionHtml('sample', 'Samples') +
      sectionHtml('pilot', 'Pilot') +
      sectionHtml('proposal', 'Proposal') +
      sectionHtml('contract', 'Contract') +
      sectionHtml('document', 'Documents') +
      sectionHtml('clientUpdate', 'Client-visible updates') +
      sectionHtml('note', 'Internal notes');

    document.getElementById('oppDetailsEditBtn').addEventListener('click', function(){
      var ownerOptions = '<option value="">Unassigned</option>' + admins.map(function(a){
        return '<option value="' + esc(a.id) + '"' + (project.owner && project.owner.email === a.email ? ' selected' : '') + '>' + esc(a.name || a.email) + '</option>';
      }).join('');
      openModal({
        title: 'Edit details',
        saveLabel: 'Save',
        bodyHtml:
          '<div class="field"><label for="fOwner">Owner</label><select id="fOwner">' + ownerOptions + '</select></div>' +
          '<div class="frow">' +
            '<div class="field"><label for="fPolymer">Polymer</label><input id="fPolymer" value="' + esc(project.polymer || '') + '"></div>' +
            '<div class="field"><label for="fProcess">Process</label><input id="fProcess" value="' + esc(project.process || '') + '"></div>' +
          '</div>' +
          '<div class="field"><label for="fTarget">Target</label><input id="fTarget" value="' + esc(project.target || '') + '"></div>',
        onSave: function(modalEl, done){
          patchJSON('/api/admin/projects', {
            id: project.id,
            owner_id: document.getElementById('fOwner').value || null,
            polymer: document.getElementById('fPolymer').value,
            process: document.getElementById('fProcess').value,
            target: document.getElementById('fTarget').value
          }).then(function(result){
            if(!result.ok){ done(false, result.body.error || 'Could not save.'); return; }
            done(true);
            reload();
          });
        }
      });
    });

    list.querySelectorAll('[data-add-record]').forEach(function(btn){
      btn.addEventListener('click', function(){ openRecordModal(btn.getAttribute('data-add-record'), null); });
    });

    list.querySelectorAll('[data-add-result]').forEach(function(btn){
      btn.addEventListener('click', function(event){
        event.stopPropagation();
        openPilotResultModal(btn.getAttribute('data-add-result'));
      });
    });

    list.querySelectorAll('[data-open-record]').forEach(function(el){
      el.addEventListener('click', function(event){
        if(event.target.closest('[data-add-result]')) return;
        var type = el.getAttribute('data-open-record');
        var id = el.getAttribute('data-id');
        var record = sections[type].items.find(function(item){ return String(item.id) === id; });
        if(record) openRecordModal(type, record);
      });
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
        renderAdminNav(result.body);
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
