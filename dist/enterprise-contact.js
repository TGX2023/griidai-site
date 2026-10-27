(() => {
  const params=new URLSearchParams(location.search),sources=['hero','review','requirements','pilot','final'];
  const active=params.get('audience')==='enterprise',source=sources.includes(params.get('source'))?params.get('source'):'hero';
  const state={active,submitted:false,started:false};
  const event=(name,properties={})=>{window.griidaiEvents=window.griidaiEvents||[];window.griidaiEvents.push({event:name,source_section:source,...properties});};
  function status(title,copy){const box=document.getElementById('enterprise-contact-status');box.replaceChildren();const heading=document.createElement('h3'),paragraph=document.createElement('p'),email=document.createElement('a');heading.textContent=title;paragraph.textContent=copy;email.href='mailto:contact@griidai.com';email.textContent='Contact contact@griidai.com';box.append(heading,paragraph,email);if(state.submitted){const again=document.createElement('button');again.type='button';again.className='btn btn-outline';again.textContent='Submit Another Inquiry';again.addEventListener('click',()=>window.resetForm());box.append(again);}box.hidden=false;box.focus();}
  function init(form){
    if(!active||!form)return;
    const fields=document.getElementById('enterprise-qualification');fields.hidden=false;fields.disabled=false;form.dataset.enterprise='true';
    document.querySelector('label[for=email]').textContent='Work email *';document.getElementById('email').autocomplete='email';
    document.getElementById('phone').required=false;document.getElementById('phone').closest('.form-group').hidden=true;document.getElementById('city').closest('.form-group').hidden=true;document.getElementById('phone').closest('.form-row').style.gridTemplateColumns='1fr';document.getElementById('linkedin').closest('.form-row').hidden=true;
    const usage=document.getElementById('gis-usage');usage.required=false;document.querySelector('label[for=gis-usage]').textContent='Workflow context (optional)';
    document.getElementById('enterprise-use-case').required=true;document.getElementById('enterprise-contact-consent').required=true;
    const sync=()=>{const other=document.getElementById('enterprise-use-case').value==='Other';document.getElementById('enterprise-other-group').hidden=!other;const field=document.getElementById('enterprise-other-use-case');field.required=other;field.disabled=!other;if(!other)field.value='';};sync();document.getElementById('enterprise-use-case').addEventListener('change',sync);
    form.addEventListener('focusin',e=>{if(!state.started&&e.target.matches('input:not([name=website]),textarea,select')){state.started=true;event('enterprise_form_start');}});
    form.addEventListener('input',e=>{e.target.removeAttribute('aria-invalid');});
  }
  function validate(){
    if(!active)return true;let valid=true;
    for(const id of ['enterprise-use-case',...(document.getElementById('enterprise-use-case').value==='Other'?['enterprise-other-use-case']:[])]){if(!document.getElementById(id).value.trim()){showError(id,'Please complete this field.');valid=false;}}
    return document.getElementById('early-access-form').reportValidity()&&valid;
  }
  function enrich(payload){
    if(!active)return payload;
    const value=id=>document.getElementById(id).value.trim(),selected=value('enterprise-use-case');
    const lines=['Enterprise workflow inquiry','Primary use case: '+(selected==='Other'?value('enterprise-other-use-case'):selected),'Team size / expected users: '+(value('enterprise-team-size')||'Not specified'),'Workflow context: '+(payload.gisUsage||'Not specified'),'Data / integration needs: '+(value('enterprise-data-needs')||'Not specified'),'Security / deployment needs: '+(value('enterprise-security-needs')||'Not specified'),'Permission to respond: agreed; enterprise inquiry privacy wording v1','Source: enterprise / '+source];
    return {...payload,gisUsage:lines.join('\n')};
  }
  function response(result){
    if(result.type!=='opaque'&&!result.ok)throw Error('Contact service rejected request');state.submitted=true;
    if(result.type==='opaque'||result.status===0){status('Request sent — receipt unconfirmed','The request was sent through our contact service. This browser cannot confirm that it was saved or that an email was delivered. Your answers remain available here.');event('enterprise_form_sent',{outcome:'receipt_unconfirmed'});}
    else{status('Request received','The contact service confirmed your submission. Your answers remain available here.');event('enterprise_form_submit',{outcome:'confirmed'});}
  }
  function error(){state.submitted=false;status('We could not confirm your request.','Your answers are still here. Please try again, or contact the team directly.');}
  function reset(){state.submitted=false;state.started=false;const box=document.getElementById('enterprise-contact-status');if(box)box.hidden=true;if(active){document.getElementById('enterprise-use-case').dispatchEvent(new Event('change'));document.getElementById('early-access-form').dataset.submitting='false';document.getElementById('submit-btn').disabled=false;document.getElementById('btn-text').textContent='Submit';document.getElementById('full-name').focus();}}
  window.griidaiEnterpriseContact={...state,state,init,validate,enrich,response,error,reset};
})();
