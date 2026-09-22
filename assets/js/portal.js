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

  var SESSION_KEY = 'ecoshell_session';
  var EMAIL_KEY = 'ecoshell_email';
  var ROLE_KEY = 'ecoshell_role';

  var adminState = {view: 'enquiries', data: null};

  var CLIENT_NAV = '<p class="app-nav__label">Overview</p>' +
    '<span class="app-nav__item is-active"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>Dashboard</span>';

  var ADMIN_NAV = '<p class="app-nav__label">Workspace</p>' +
    '<button type="button" class="app-nav__item is-active" data-view="enquiries"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Enquiries</button>' +
    '<button type="button" class="app-nav__item" data-view="projects"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>Projects</button>' +
    '<button type="button" class="app-nav__item" data-view="samples"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8l-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>Samples</button>' +
    '<button type="button" class="app-nav__item" data-view="companies"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>Companies</button>';

  var clientDemo = {
    projects: [
      {
        reference_code: 'ECO-8A41C2F0',
        name: 'Injection moulded closure review',
        status: 'technical_review',
        polymer: 'PP',
        process: 'Injection moulding',
        target: 'Reduce virgin plastic while keeping stiffness and food-contact readiness.',
        companies: {name: 'Demo Packaging Co.'},
        sample_requests: [{status: 'preparing', tracking_number: null}],
        project_updates: [
          {body: 'Technical review is underway. Ecoshell is checking process fit and likely loading range.', created_at: new Date().toISOString()},
          {body: 'Initial inquiry received and converted into a project.', created_at: new Date(Date.now() - 86400000).toISOString()}
        ]
      }
    ]
  };

  var adminDemo = {
    companies: [{name: 'Demo Packaging Co.', region: 'United States', industry: 'Packaging', access_status: 'lead'}],
    enquiries: [{first_name: 'Maya', last_name: 'Singh', company: 'Demo Packaging Co.', email: 'maya@example.com', country: 'United States', application: 'Injection moulding', message: 'Looking for a lower-plastic closure compound.', status: 'new'}],
    projects: [{id: 'demo-1', reference_code: 'ECO-8A41C2F0', name: 'Injection moulded closure review', status: 'technical_review', polymer: 'PP', process: 'Injection moulding', companies: {name: 'Demo Packaging Co.'}}],
    samples: [{status: 'preparing', tracking_number: '', projects: {reference_code: 'ECO-8A41C2F0', name: 'Injection moulded closure review', companies: {name: 'Demo Packaging Co.'}}}]
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

  function showAuth(){
    dashboardSection.hidden = true;
    authSection.hidden = false;
    if(siteHeader) siteHeader.hidden = false;
  }

  function enterDashboard(role, email){
    authSection.hidden = true;
    dashboardSection.hidden = false;
    if(siteHeader) siteHeader.hidden = true;

    userEmailEl.textContent = email;
    userRoleEl.textContent = role === 'admin' ? 'Admin' : 'Client';
    avatarEl.textContent = email ? email.charAt(0).toUpperCase() : '?';
    appNav.innerHTML = role === 'admin' ? ADMIN_NAV : CLIENT_NAV;

    if(role === 'admin'){
      appNav.querySelectorAll('.app-nav__item[data-view]').forEach(function(tab){
        tab.addEventListener('click', function(){
          appNav.querySelectorAll('.app-nav__item').forEach(function(item){ item.classList.toggle('is-active', item === tab); });
          adminState.view = tab.dataset.view;
          renderAdminList();
        });
      });
    }
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
        '<dl class="portal-meta"><div><dt>Company</dt><dd>' + esc(project.companies?.name || 'Client company') + '</dd></div><div><dt>Polymer</dt><dd>' + esc(project.polymer || 'Review needed') + '</dd></div><div><dt>Process</dt><dd>' + esc(project.process || 'Review needed') + '</dd></div></dl>' +
        '<p>' + esc(project.target || 'No project target has been added yet.') + '</p>' +
        (sample ? '<p class="portal-note">Sample: ' + esc(labelStatus(sample.status)) + (sample.tracking_number ? ' · Tracking ' + esc(sample.tracking_number) : '') + '</p>' : '<p class="portal-note">No sample request yet.</p>') +
        '<h3>Latest updates</h3><ul class="portal-updates">' + updates + '</ul>' +
      '</article>';
    }).join('');
  }

  function loadClientDashboard(sessionToken){
    heading.textContent = 'Track material reviews, sample requests and next steps.';
    list.innerHTML = '<article class="portal-card"><p>Loading projects...</p></article>';

    fetch('/api/client/projects', {headers: {'x-client-session': sessionToken}})
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
        if(data){ renderClientKpis(data); renderClientList(data); }
      })
      .catch(function(){
        setStatus('Could not reach the portal service right now. Showing sample data instead.', true);
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
      '<article><b>' + data.companies.length + '</b><span>Companies</span></article>'
    ].join('');
  }

  function renderAdminList(){
    var data = adminState.data || adminDemo;
    if(adminState.view === 'enquiries'){
      list.innerHTML = data.enquiries.map(function(item){
        return adminCard(item.company, item.email + ' · ' + item.application, item.message, item.status);
      }).join('');
    }
    if(adminState.view === 'projects'){
      list.innerHTML = data.projects.map(function(item){
        return adminCard(item.name, item.reference_code + ' · ' + (item.companies?.name || 'Company'), (item.polymer || 'Polymer TBD') + ' · ' + (item.process || 'Process TBD'), item.status);
      }).join('');
    }
    if(adminState.view === 'samples'){
      list.innerHTML = data.samples.map(function(item){
        var project = item.projects || {};
        return adminCard(project.name || 'Sample request', (project.reference_code || 'Project') + ' · ' + (project.companies?.name || 'Company'), item.tracking_number ? 'Tracking: ' + item.tracking_number : 'No tracking number yet.', item.status);
      }).join('');
    }
    if(adminState.view === 'companies'){
      list.innerHTML = data.companies.map(function(item){
        return adminCard(item.name, (item.region || 'Region TBD') + ' · ' + (item.industry || 'Industry TBD'), 'Access status: ' + labelStatus(item.access_status), item.access_status);
      }).join('');
    }
  }

  function loadAdminDashboard(sessionToken){
    heading.textContent = 'Manage client inquiries from first contact to sample trial.';
    list.innerHTML = '<article class="portal-card"><p>Loading admin workspace...</p></article>';

    fetch('/api/admin/overview', {headers: {'x-admin-session': sessionToken}})
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
        adminState.data = result.body;
        adminState.view = 'enquiries';
        renderAdminKpis(result.body);
        renderAdminList();
      })
      .catch(function(){
        setStatus('Could not reach the admin service right now.', true);
        list.innerHTML = '<article class="portal-card"><h2>Unable to load admin data</h2><p>Check your connection and try again.</p></article>';
      });
  }

  function persistSession(role, sessionToken, email){
    sessionStorage.setItem(SESSION_KEY, sessionToken);
    sessionStorage.setItem(EMAIL_KEY, email || '');
    sessionStorage.setItem(ROLE_KEY, role);
  }

  function clearSession(){
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(EMAIL_KEY);
    sessionStorage.removeItem(ROLE_KEY);
  }

  function loadDashboard(role, sessionToken){
    if(role === 'admin') loadAdminDashboard(sessionToken);
    else loadClientDashboard(sessionToken);
  }

  form.addEventListener('submit', function(event){
    event.preventDefault();
    var email = form.loginEmail.value.trim();
    var password = form.loginPassword.value;
    var submitButton = form.querySelector('button[type="submit"]');
    if(submitButton) submitButton.disabled = true;
    setStatus('Signing in...', false);

    function fail(message){
      if(submitButton) submitButton.disabled = false;
      setStatus(message, true);
    }

    function jsonResult(res){
      return res.json().then(function(body){ return {ok: res.ok, body: body}; });
    }

    fetch('/api/admin/login', {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({email: email, password: password})
    })
      .then(jsonResult)
      .then(function(adminResult){
        if(adminResult.ok){
          if(submitButton) submitButton.disabled = false;
          persistSession('admin', adminResult.body.session_token, adminResult.body.email);
          setStatus('', false);
          enterDashboard('admin', adminResult.body.email);
          loadAdminDashboard(adminResult.body.session_token);
          return;
        }

        if(!/not an authorized admin/i.test(adminResult.body.error || '')){
          fail(adminResult.body.error || 'Something went wrong. Please try again.');
          return;
        }

        return fetch('/api/client/login', {
          method: 'POST',
          headers: {'content-type': 'application/json'},
          body: JSON.stringify({email: email, password: password})
        })
          .then(jsonResult)
          .then(function(clientResult){
            if(submitButton) submitButton.disabled = false;
            if(!clientResult.ok){
              setStatus(clientResult.body.error || 'Something went wrong. Please try again.', true);
              return;
            }
            persistSession('client', clientResult.body.session_token, clientResult.body.email);
            setStatus('', false);
            enterDashboard('client', clientResult.body.email);
            loadClientDashboard(clientResult.body.session_token);
          });
      })
      .catch(function(){
        fail('Could not reach the login service right now. Please try again shortly.');
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
  if(storedSession && storedRole){
    enterDashboard(storedRole, storedEmail);
    loadDashboard(storedRole, storedSession);
  }
})();
