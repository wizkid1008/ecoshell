(function(){
  var form = document.getElementById('clientLogin');
  if(!form) return;

  var list = document.getElementById('clientProjects');
  var kpis = document.getElementById('clientKpis');
  var statusEl = document.getElementById('clientLoginStatus');
  var authSection = document.getElementById('authSection');
  var dashboardSection = document.getElementById('dashboardSection');
  var signOutButton = document.getElementById('clientSignOut');
  var siteHeader = document.getElementById('siteHeader');
  var userEmailEl = document.getElementById('clientUserEmail');
  var avatarEl = document.getElementById('clientAvatar');
  var SESSION_KEY = 'ecoshell_client_session';
  var EMAIL_KEY = 'ecoshell_client_email';

  var demo = {
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
      },
      {
        reference_code: 'ECO-4B92D13A',
        name: 'PET thermoformed tray pilot',
        status: 'sample_shipped',
        polymer: 'PET',
        process: 'Thermoforming',
        target: 'Explore a lower-plastic tray for a retail packaging pilot.',
        companies: {name: 'Demo Packaging Co.'},
        sample_requests: [{status: 'shipped', tracking_number: '1Z-DEMO-9241'}],
        project_updates: [
          {body: 'Sample pack shipped. Trial notes will appear here once testing begins.', created_at: new Date().toISOString()}
        ]
      }
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

  function setStatus(message, isError){
    if(!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.classList.toggle('is-error', !!isError);
  }

  function showDashboard(){
    authSection.hidden = true;
    dashboardSection.hidden = false;
    if(siteHeader) siteHeader.hidden = true;

    var email = sessionStorage.getItem(EMAIL_KEY) || '';
    if(userEmailEl) userEmailEl.textContent = email;
    if(avatarEl) avatarEl.textContent = email ? email.charAt(0) : '?';
  }

  function showAuth(){
    dashboardSection.hidden = true;
    authSection.hidden = false;
    if(siteHeader) siteHeader.hidden = false;
  }

  function render(data){
    var projects = data.projects || [];
    var active = projects.filter(function(project){ return !/closed|complete|not_fit/.test(project.status || ''); }).length;
    var samples = projects.reduce(function(total, project){ return total + (project.sample_requests || []).length; }, 0);
    kpis.innerHTML = [
      '<article><b>' + projects.length + '</b><span>Projects</span></article>',
      '<article><b>' + active + '</b><span>Active reviews</span></article>',
      '<article><b>' + samples + '</b><span>Sample requests</span></article>'
    ].join('');

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

  function loadProjects(sessionToken){
    showDashboard();
    list.innerHTML = '<article class="portal-card"><p>Loading projects...</p></article>';

    fetch('/api/client/projects', {headers: {'x-client-session': sessionToken}})
      .then(function(res){
        if(res.status === 401){
          sessionStorage.removeItem(SESSION_KEY);
          sessionStorage.removeItem(EMAIL_KEY);
          setStatus('Your session has expired. Please sign in again.', true);
          showAuth();
          return null;
        }
        if(!res.ok) throw new Error('client unavailable');
        return res.json();
      })
      .then(function(data){
        if(data) render(data);
      })
      .catch(function(){
        setStatus('Could not reach the client portal service right now. Showing sample data instead.', true);
        render(demo);
      });
  }

  form.addEventListener('submit', function(event){
    event.preventDefault();
    var email = form.clientEmail.value.trim();
    var password = form.clientPassword.value;
    var submitButton = form.querySelector('button[type="submit"]');
    if(submitButton) submitButton.disabled = true;
    setStatus('Signing in...', false);

    fetch('/api/client/login', {
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
        sessionStorage.setItem(EMAIL_KEY, result.body.email || '');
        setStatus('', false);
        loadProjects(result.body.session_token);
      })
      .catch(function(){
        if(submitButton) submitButton.disabled = false;
        setStatus('Could not reach the login service right now. Please try again shortly.', true);
      });
  });

  if(signOutButton){
    signOutButton.addEventListener('click', function(){
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(EMAIL_KEY);
      form.reset();
      showAuth();
    });
  }

  var storedSession = sessionStorage.getItem(SESSION_KEY);
  if(storedSession){
    loadProjects(storedSession);
  }
})();
