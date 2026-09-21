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
  var form = document.getElementById('enquiry');
  if(!form) return;

  var msg = document.getElementById('formmsg');
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    fetch('/api/enquiries', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
      first_name: form.fn.value,
      last_name: form.ln.value,
      company: form.co.value,
      email: form.em.value,
      country: form.ct.value,
      application: form.ap.value,
      message: form.ms.value
      })
    }).then(function(res){
      if(!res.ok) throw new Error('enquiry failed');
      return res.json();
    }).then(function(){
      submitBtn.disabled = false;
      msg.hidden = false;
      msg.textContent = 'Thanks — your enquiry has been sent. Our team will be in touch shortly.';
      form.reset();
    }).catch(function(){
      submitBtn.disabled = false;
      msg.hidden = false;
      msg.textContent = 'Something went wrong sending your enquiry. Please try again or email us directly.';
    });
  });
})();
