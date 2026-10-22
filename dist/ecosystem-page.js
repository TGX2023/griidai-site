(() => {
 const root=document.querySelector('.hub-ecosystem');if(!root)return;
 const emit=(event,data={})=>window.griidaiEvents?.push({event,page_key:'ecosystem',...data});
 const allowedSections=['hero','contributors','education_research','community_growth','solutions_resellers','help_me_choose','closing'];
 root.querySelectorAll('.eco-faq button').forEach(button=>{button.disabled=false;button.setAttribute('aria-expanded','false');const answer=document.getElementById(button.getAttribute('aria-controls'));answer.hidden=true;button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!open));answer.hidden=open;});});
 root.addEventListener('click',event=>{
  const link=event.target.closest('a');if(!link)return;
  const section=link.dataset.ecosystemCta;
  if(allowedSections.includes(section)){
   const target=new URL(link.href),path=target.searchParams.get('path'),interest=target.searchParams.get('interest');
   const data={section_key:section,cta_id:'ecosystem_'+section,destination_type:'interest_form'};
   if(['contributors','education_research','community_growth','solutions_resellers','help_me_choose'].includes(path))data.path=path;
   if(['ambassador','affiliate','referral_partner','solution_delivery','reseller'].includes(interest))data.interest=interest;
   emit('cta_click',data);try{sessionStorage.setItem('griidaiEcosystemSource',JSON.stringify({section,at:Date.now()}));}catch{}
  }
  if(link.dataset.pathExplore)emit('ecosystem_path_explore',{path:link.dataset.pathExplore,section_key:link.closest('section')?.id==='choose-your-route'?'comparison':'selector'});
  const href=link.getAttribute('href');if(href?.startsWith('#')){const target=document.getElementById(href.slice(1));if(target){const heading=target.querySelector('h2')||target;setTimeout(()=>{heading.tabIndex=-1;heading.focus({preventScroll:true});},0);}}
 });
 const form=document.getElementById('ecosystem-interest-form');if(!form)return;
 const config=JSON.parse(document.getElementById('ecosystem-form-config').textContent),copy=config.states;
 form.noValidate=true;
 const paths=[...form.querySelectorAll('[name="paths"]')],specifics=[...form.querySelectorAll('[data-path]')],participant=form.elements.participant_type,organization=form.elements.organization;
 const status=document.getElementById('interest-status'),submit=document.getElementById('interest-submit'),summary=document.getElementById('interest-errors'),pathStatus=document.getElementById('path-status'),message=form.elements.message;
 const fields=['full_name','email','participant_type','organization','role','country','paths','message','profile_url','contact_consent'];
 let source='direct';try{const value=JSON.parse(sessionStorage.getItem('griidaiEcosystemSource'));if(value&&allowedSections.includes(value.section)&&Date.now()-value.at<1800000){source=value.section;sessionStorage.removeItem('griidaiEcosystemSource');}}catch{}
 const params=new URLSearchParams(location.search);if(allowedSections.includes(params.get('source')))source=params.get('source');
 let inFlight=false,received=false,started=false,attempt=null;
 const start=()=>{if(!started){started=true;emit('form_start',{section_key:source});}};
 ['input','change'].forEach(name=>form.addEventListener(name,event=>{if(event.target.matches('input,select,textarea')&&event.target.name!=='company_website')start();}));
 function syncPaths(changed){
  if(changed?.checked&&changed.value==='help_me_choose'){paths.filter(p=>p!==changed).forEach(p=>p.checked=false);pathStatus.textContent='Help me choose selected. Named paths and specific interests have been cleared.';}
  else if(changed?.checked){paths.find(p=>p.value==='help_me_choose').checked=false;pathStatus.textContent='You can select more than one named path.';}
  specifics.forEach(group=>{const selected=paths.some(p=>p.checked&&p.value===group.dataset.path);group.hidden=!selected;group.disabled=!selected;if(!selected)group.querySelectorAll('input').forEach(input=>input.checked=false);});
 }
 const syncOrg=()=>{organization.required=participant.value==='organization';organization.labels[0].innerHTML='Organization or institution'+(organization.required?' <span aria-hidden="true">*</span>':' <span class="eco-optional">(optional)</span>');};
 paths.forEach(p=>p.addEventListener('change',()=>syncPaths(p)));participant.addEventListener('change',syncOrg);syncOrg();
 const selected=paths.find(p=>p.value===params.get('path'));if(selected){selected.checked=true;syncPaths();const group=specifics.find(g=>g.dataset.path===selected.value);const option=[...(group?.querySelectorAll('input')||[])].find(i=>i.value===params.get('interest'));if(option)option.checked=true;}syncPaths();
 message.addEventListener('input',()=>document.getElementById('message-count').textContent=`${message.value.length.toLocaleString('en')} / 2,000 characters`);
 const control=name=>name==='paths'?paths[0]:form.elements[name];
 function showErrors(errors){
  fields.forEach(name=>{const field=control(name),error=document.getElementById(name+'-error');field?.removeAttribute('aria-invalid');if(error){error.textContent='';error.hidden=true;}});
  summary.replaceChildren();summary.hidden=!errors.length;if(!errors.length)return;
  const heading=document.createElement('h2');heading.textContent=copy['Error summary'];const list=document.createElement('ul');summary.append(heading,list);
  errors.forEach(({name,text,code})=>{const field=control(name),error=document.getElementById(name+'-error');field.setAttribute('aria-invalid','true');if(error){error.textContent=text;error.hidden=false;}const item=document.createElement('li'),anchor=document.createElement('a');anchor.href='#'+field.id;anchor.textContent=text;anchor.addEventListener('click',event=>{event.preventDefault();field.focus();});item.append(anchor);list.append(item);});
  summary.focus();emit('form_validation_error',{section_key:source,errors:errors.map(({name,code})=>({field:name,code}))});
 }
 function validate(){
  syncOrg();syncPaths();const errors=[],add=(name,key,code='required')=>errors.push({name,text:copy[key],code});
  if(!form.elements.full_name.value.trim())add('full_name','Required name');
  const email=form.elements.email;if(!email.value.trim()||email.validity.typeMismatch||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))add('email','Invalid email','invalid_email');
  if(!participant.value)add('participant_type','Missing participant type');
  if(organization.required&&!organization.value.trim())add('organization','Required organization');
  const country=form.elements.country;const countryMatch=[...document.getElementById('country-options').options].find(o=>o.value.toLowerCase()===country.value.trim().toLowerCase());if(!countryMatch)add('country','Missing country');else country.value=countryMatch.value;
  if(!paths.some(p=>p.checked))add('paths','Missing path');
  if(!message.value.trim())add('message','Missing message');else if(message.value.length>2000)add('message','Message limit','too_long');
  const url=form.elements.profile_url.value.trim();if(url){try{const parsed=new URL(url);if(!['https:','http:'].includes(parsed.protocol)||!parsed.hostname||url.length>500)throw new Error();}catch{add('profile_url','Invalid URL','invalid_url');}}
  if(!form.elements.contact_consent.checked)add('contact_consent','Missing consent');
  // Native maxlength bounds remain authoritative for the other short text fields.
  ['full_name','email','organization','role'].forEach(name=>{const field=form.elements[name];if(field.value.length>field.maxLength&&!errors.some(e=>e.name===name))errors.push({name,text:`Keep ${field.labels[0].textContent.replace(/\s*\*|\s*\(optional\)/g,'').trim().toLowerCase()} within ${field.maxLength} characters.`,code:'too_long'});});
  showErrors(errors);return errors.length===0;
 }
 function result(ok){status.replaceChildren();status.classList.toggle('error',!ok);const heading=document.createElement('h2');heading.textContent=ok?copy['Success heading']:copy['Submission failure'];status.append(heading);if(ok){const body=document.createElement('p');body.textContent=copy['Success body'];status.append(body);}const link=document.createElement('a');link.href=root.querySelector('.eco-form-return a').href;link.textContent=copy['Success link'];status.append(link);status.hidden=false;status.focus();}
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(inFlight||received)return;start();if(!validate())return;
  if(form.elements.company_website.value){result(false);emit('form_submit_error',{section_key:source,category:'spam_check'});return;}
  const values={fullName:form.elements.full_name.value.trim(),email:form.elements.email.value.trim(),country:form.elements.country.value,organization:organization.value.trim(),role:form.elements.role.value.trim(),profile:form.elements.profile_url.value.trim(),participant:participant.value,paths:paths.filter(p=>p.checked).map(p=>p.value),interests:[...form.querySelectorAll('[name="interests"]:checked')].filter(i=>!i.closest('fieldset').disabled).map(i=>i.value),message:message.value.trim()};
  const fingerprint=JSON.stringify(values);
  if(!attempt||attempt.fingerprint!==fingerprint){const at=new Date().toISOString(),token=crypto.randomUUID();const details=['Ecosystem expression of interest','Participant: '+values.participant,'Paths: '+values.paths.join(', '),'Interests: '+(values.interests.join(', ')||'Not specified'),'Idea: '+values.message,'Permission to respond: agreed; '+config.consentVersion+'; '+at,'Consent wording: '+config.consentText,'Privacy Notice: '+config.privacyUrl,'Source: ecosystem / '+source,'Submission attempt: '+token].join('\n');attempt={fingerprint,payload:{fullName:values.fullName,email:values.email,phone:'',city:'',country:values.country,organization:values.organization||'Individual',role:values.role||'Ecosystem inquiry',linkedin:values.profile,gisUsage:details,timestamp:at}};}
  // The existing provider contract has ten fields. The stable attempt token is
  // retained for retries, but only the receiving service can enforce deduplication.
  inFlight=true;submit.disabled=true;submit.textContent=copy['In progress'];form.setAttribute('aria-busy','true');status.hidden=true;emit('form_submit_attempt',{section_key:source,paths:values.paths});
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),25000);
  try{
   const response=await fetch(form.dataset.endpoint,{method:'POST',mode:config.transport,credentials:'omit',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(attempt.payload),signal:controller.signal});
   // Opaque/OK/email-sent responses cannot prove that a record was stored.
   if(response.type==='opaque')throw new Error('receipt_unconfirmed');if(!response.ok)throw new Error('service_error');
   const receipt=await response.json().catch(()=>null);if(receipt?.durableAccepted!==true||typeof receipt.submission_id!=='string'||!/^[A-Za-z0-9_-]{8,128}$/.test(receipt.submission_id))throw new Error('receipt_unconfirmed');
   received=true;result(true);emit('lead_submitted',{section_key:source,submission_id:receipt.submission_id});
  }catch(error){result(false);emit('form_submit_error',{section_key:source,category:error.name==='AbortError'?'timeout':['receipt_unconfirmed','service_error'].includes(error.message)?error.message:'transport_error'});}
  finally{clearTimeout(timeout);inFlight=false;submit.disabled=received;submit.textContent=copy['Submit button'];form.removeAttribute('aria-busy');}
 });
})();
