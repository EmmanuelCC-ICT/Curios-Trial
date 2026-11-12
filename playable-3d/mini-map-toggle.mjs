/** Session-local collapse; leaves full Campus map and movement untouched. */
export function installMiniMapToggle({mini,header,label,expand,plan}){
 const toggle=document.createElement('button');toggle.type='button';toggle.id='curios-map-toggle';plan.id='curios-mini-map-plan';toggle.setAttribute('aria-controls',plan.id);label.hidden=true;header.prepend(toggle);
 let expanded=true;
 function render(){plan.hidden=!expanded;expand.hidden=!expanded;mini.classList.toggle('map-collapsed',!expanded);toggle.textContent=expanded?'Hide map':'Show map';toggle.setAttribute('aria-expanded',String(expanded));}
 toggle.onclick=()=>{expanded=!expanded;render();};render();return toggle;
}
