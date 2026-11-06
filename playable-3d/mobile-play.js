// Phone controls stay available without leaving information cards over the world.
const toggles=[...document.querySelectorAll('[data-mobile-panel]')];
function collapse(){for(const button of toggles){button.setAttribute('aria-expanded','false');document.getElementById(button.dataset.mobilePanel).classList.remove('mobile-expanded');}}
for(const button of toggles)button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';collapse();if(open){button.setAttribute('aria-expanded','true');document.getElementById(button.dataset.mobilePanel).classList.add('mobile-expanded');}});
for(const id of ['scene','movement','destination-bar'])document.getElementById(id).addEventListener('pointerdown',e=>{if(!e.target.closest('#arrival-mission'))collapse();});
document.addEventListener('keydown',event=>{if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)&&event.target===document.getElementById('scene'))collapse();if(event.key==='Escape'){const active=toggles.find(b=>b.getAttribute('aria-expanded')==='true');collapse();active?.focus();}});
