(function(){
  var form = document.getElementById('adminLogin');
  if(!form) return;

  var kpis = document.getElementById('adminKpis');
  var list = document.getElementById('adminList');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.portal-tabs button'));
  var state = {view: 'enquiries', data: null};
  var SESSION_KEY = 'ecoshell_admin_session';

  var demo = {
    companies: [
      {name: 'Demo Packaging Co.', region: 'United States', industry: 'Packaging', access_status: 'lead'},
      {name: 'Circular Beauty Labs', region: 'Canada', industry: 'Cosmetics', access_status: 'approved'}
    ],
    enquiries: [
      {first_name: 'Maya', last_name: 'Singh', company: 'Demo Packaging Co.', email: 'maya@example.com', country: 'United States', application: 'Injection moulding', message: 'Looking for a lower-plastic closure compound.', status: 'new'},
      {first_name: 'Jon', last_name: 'Reed', company: 'Circular Beauty Labs', email: 'jon@example.com', country: 'Canada', application: 'Blow moulding', message: 'Refillable cosmetics packaging pilot.', status: 'reviewing'}
    ],
    projects: [
      {id: 'demo-1', reference_code: 'ECO-8A41C2F0', name: 'Injection moulded closure review', status: 'technical_review', polymer: 'PP', process: 'Injection moulding', companies: {name: 'Demo Packaging Co.'}},
      {id: 'demo-2', reference_code: 'ECO-4B92D13A', name: 'PET thermoformed tray pilot', status: 'sample_shipped', polymer: 'PET', process: 'Thermoforming', companies: {name: 'Circular Beauty Labs'}}
    ],
    samples: [
      {status: 'preparing', tracking_number: '', projects: {reference_code: 'ECO-8A41C2F0', name: 'Injection moulded closure review', companies: {name: 'Demo Packaging Co.'}}},
      {status: 'shipped', tracking_number: '1Z-DEMO-9241', projects: {reference_code: 'ECO-4B92D13A', name: 'PET thermoformed tray pilot', companies: {name: 'Circular Beauty Labs'}}}
    ]
  };

  function labelStatus(status){
    return String(status || 'new').replace(/_/g, ' ');
  }

  function esc(value){
    return String(value || '').replace(/[&<>"']/g, function(char){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
    });
  }

  function renderKpis(data){
    kpis.innerHTML = [
      '<article><b>' + data.enquiries.length + '</b><span>Enquiries</span></article>',
      '<article><b>' + data.projects.length + '</b><span>Projects</span></article>',
      '<article><b>' + data.samples.length + '</b><span>Samples</span></article>',
      '<article><b>' + data.companies.length + '</b><span>Companies</span></article>'
    ].join('');
  }

  function card(title, meta, body, status){
    return '<article class="portal-card">' +
      '<div class="portal-card__top"><div><p class="portal-ref">' + esc(meta) + '</p><h2>' + esc(title) + '</h2></div>' +
      (status ? '<span class="pill">' + esc(labelStatus(status)) + '</span>' : '') + '</div>' +
      '<p>' + esc(body) + '</p>' +
    '</article>';
  }

  function renderList(){
    var data = state.data || demo;
    if(state.view === 'enquiries'){
      list.innerHTML = data.enquiries.map(function(item){
        return card(item.company, item.email + ' · ' + item.application, item.message, item.status);
      }).join('');
    }
    if(state.view === 'projects'){
      list.innerHTML = data.projects.map(function(item){
        return card(item.name, item.reference_code + ' · ' + (item.companies?.name || 'Company'), (item.polymer || 'Polymer TBD') + ' · ' + (item.process || 'Process TBD'), item.status);
      }).join('');
    }
    if(state.view === 'samples'){
      list.innerHTML = data.samples.map(function(item){
        var project = item.projects || {};
        return card(project.name || 'Sample request', (project.reference_code || 'Project') + ' · ' + (project.companies?.name || 'Company'), item.tracking_number ? 'Tracking: ' + item.tracking_number : 'No tracking number yet.', item.status);
      }).join('');
    }
    if(state.view === 'companies'){
      list.innerHTML = data.companies.map(function(item){
        return card(item.name, (item.region || 'Region TBD') + ' · ' + (item.industry || 'Industry TBD'), 'Access status: ' + labelStatus(item.access_status), item.access_status);
      }).join('');
    }
  }

  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      tabs.forEach(function(item){ item.classList.toggle('is-active', item === tab); });
      state.view = tab.dataset.view;
      renderList();
    });
  });

  var statusEl = document.getElementById('adminLoginStatus');
  function setStatus(message, isError){
    if(!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.classList.toggle('is-error', !!isError);
  }

  function loadOverview(sessionToken){
    list.innerHTML = '<article class="portal-card"><p>Loading admin workspace...</p></article>';

    fetch('/api/admin/overview', {headers: {'x-admin-session': sessionToken}})
      .then(function(res){ return res.json().then(function(body){ return {ok: res.ok, status: res.status, body: body}; }); })
      .then(function(result){
        if(!result.ok){
          if(result.status === 401) sessionStorage.removeItem(SESSION_KEY);
          setStatus(result.body.error || 'Could not reach the admin service right now.', true);
          list.innerHTML = '<article class="portal-card"><h2>Unable to load admin data</h2><p>' + esc(result.body.error || 'Please log in again.') + '</p></article>';
          return;
        }
        setStatus('', false);
        state.data = result.body;
        renderKpis(result.body);
        renderList();
      })
      .catch(function(){
        setStatus('Could not reach the admin service right now.', true);
        list.innerHTML = '<article class="portal-card"><h2>Unable to load admin data</h2><p>Check your connection and try again.</p></article>';
      });
  }

  form.addEventListener('submit', function(event){
    event.preventDefault();
    var email = form.adminEmail.value.trim();
    var password = form.adminPassword.value;
    var submitButton = form.querySelector('button[type="submit"]');
    if(submitButton) submitButton.disabled = true;
    setStatus('Signing in...', false);

    fetch('/api/admin/login', {
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
        sessionStorage.setItem(SESSION_KEY, result.body.session_token);
        setStatus('', false);
        loadOverview(result.body.session_token);
      })
      .catch(function(){
        if(submitButton) submitButton.disabled = false;
        setStatus('Could not reach the login service right now. Please try again shortly.', true);
      });
  });

  state.data = demo;
  renderKpis(demo);
  renderList();

  var storedSession = sessionStorage.getItem(SESSION_KEY);
  if(storedSession) loadOverview(storedSession);
})();
