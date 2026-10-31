(()=>{
const search=document.querySelector('#use-case-search');
if(search){const cards=[...document.querySelectorAll('[data-use-case]')];search.form.addEventListener('submit',e=>e.preventDefault());search.addEventListener('input',()=>{const q=search.value.trim().toLocaleLowerCase();let count=0;cards.forEach(card=>{card.hidden=!card.dataset.search.toLocaleLowerCase().includes(q);if(!card.hidden)count++;});document.querySelector('[data-case-count]').textContent=count?`${count} use cases`:'No matching use cases. Try a different search.';});}
document.querySelector('[data-preview-card]')?.addEventListener('click',()=>{const card=document.querySelector('.cms-card-preview');card.hidden=!card.hidden;});
})();
