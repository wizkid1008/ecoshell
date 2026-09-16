(function(){
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs__strip [role="tab"]'));
  function select(tab){
    tabs.forEach(function(t){
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function(t){
    t.addEventListener('click', function(){ select(t); });
    t.addEventListener('keydown', function(e){
      var i = tabs.indexOf(t);
      if(e.key === 'ArrowRight'){ var n = tabs[(i+1)%tabs.length]; n.focus(); select(n); }
      if(e.key === 'ArrowLeft'){ var p = tabs[(i-1+tabs.length)%tabs.length]; p.focus(); select(p); }
    });
  });
  var SUPABASE_URL = 'https://bogzsjzqdewbsgglqvpr.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_XSUzq3WQdWNTqKpVYivYDw_Q9aCGcwc';
  var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var form = document.getElementById('enquiry');
  var msg = document.getElementById('formmsg');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    supabase.from('enquiries').insert({
      first_name: form.fn.value,
      last_name: form.ln.value,
      company: form.co.value,
      email: form.em.value,
      country: form.ct.value,
      application: form.ap.value,
      message: form.ms.value
    }).then(function(res){
      submitBtn.disabled = false;
      msg.hidden = false;
      if(res.error){
        msg.textContent = 'Something went wrong sending your enquiry. Please try again or email us directly.';
      } else {
        msg.textContent = 'Thanks — your enquiry has been sent. Our team will be in touch shortly.';
        form.reset();
      }
    });
  });
})();
