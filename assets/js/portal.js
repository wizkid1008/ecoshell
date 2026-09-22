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

  var state = {role: null, status: null, sessionToken: null, view: 'dashboard', data: null, profile: null};

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
    navItem('projects', ICON_PROJECTS, 'Projects') +
    navItem('samples', ICON_SAMPLES, 'Samples') +
    navItem('clients', ICON_CLIENTS, 'Clients') +
    navItem('account', ICON_ACCOUNT, 'Account');

  var clientDemo = {
    projects: [
      {
        reference_code: 'ECO-8A41C2F0',
        name: 'Injection moulded closure review',
        status: 'technical_review',
        polymer: 'PP',
        process: 'Injection moulding',
        target: 'Reduce virgin plastic while keeping stiffness and food-contact readiness.',
        users: {company_name: 'Demo Packaging Co.'},
        sample_requests: [{status: 'preparing', tracking_number: null}],
        project_updates: [
          {body: 'Technical review is underway. Ecoshell is checking process fit and likely loading range.', created_at: new Date().toISOString()},
          {body: 'Initial inquiry received and converted into a project.', created_at: new Date(Date.now() - 86400000).toISOString()}
        ]
      }
    ]
  };

  var adminDemo = {
    enquiries: [{first_name: 'Maya', last_name: 'Singh', company: 'Demo Packaging Co.', email: 'maya@example.com', country: 'United States', application: 'Injection moulding', message: 'Looking for a lower-plastic closure compound.', status: 'new'}],
    projects: [{id: 'demo-1', reference_code: 'ECO-8A41C2F0', name: 'Injection moulded closure review', status: 'technical_review', polymer: 'PP', process: 'Injection moulding', users: {company_name: 'Demo Packaging Co.'}}],
    samples: [{status: 'preparing', tracking_number: '', projects: {reference_code: 'ECO-8A41C2F0', name: 'Injection moulded closure review', users: {company_name: 'Demo Packaging Co.'}}}],
    clients: [{email: 'maya@example.com', name: 'Maya Singh', status: 'contact', company_name: 'Demo Packaging Co.', job_title: 'Procurement', phone: '', country: 'United States', industry: 'Food and Agri', archetype: 'Emerging Brand'}]
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
      return '<article class="portal-card">' +
        '<div class="portal-card__top"><div><p class="portal-ref">' + esc(project.reference_code) + '</p><h2>' + esc(project.name) + '</h2></div><span class="pill">' + esc(labelStatus(project.status)) + '</span></div>' +
        '<dl class="portal-meta"><div><dt>Company</dt><dd>' + esc(project.users?.company_name || 'Client company') + '</dd></div><div><dt>Polymer</dt><dd>' + esc(project.polymer || 'Review needed') + '</dd></div><div><dt>Process</dt><dd>' + esc(project.process || 'Review needed') + '</dd></div></dl>' +
        '<p>' + esc(project.target || 'No project target has been added yet.') + '</p>' +
        (sample ? '<p class="portal-note">Sample: ' + esc(labelStatus(sample.status)) + (sample.tracking_number ? ' · Tracking ' + esc(sample.tracking_number) : '') + '</p>' : '<p class="portal-note">No sample request yet.</p>') +
        '<h3>Latest updates</h3><ul class="portal-updates">' + updates + '</ul>' +
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
      '<article><b>' + data.projects.length + '</b><span>Projects</span></article>',
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
        return adminCard(item.name, item.reference_code + ' · ' + (item.users?.company_name || 'Company'), (item.polymer || 'Polymer TBD') + ' · ' + (item.process || 'Process TBD'), item.status);
      }).join('');
    }
    if(state.view === 'samples'){
      list.innerHTML = data.samples.map(function(item){
        var project = item.projects || {};
        return adminCard(project.name || 'Sample request', (project.reference_code || 'Project') + ' · ' + (project.users?.company_name || 'Company'), item.tracking_number ? 'Tracking: ' + item.tracking_number : 'No tracking number yet.', item.status);
      }).join('');
    }
    if(state.view === 'clients'){
      renderClientsView(data);
    }
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
