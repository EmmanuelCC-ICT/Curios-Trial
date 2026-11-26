const names=["Communication", "Creativity", "Citizenship", "Critical thinking", "Collaboration", "Character", "Independence", "Resilience"];
const prompts=["I explained\u2026", "I tried a different way to\u2026", "I thought about who might need\u2026", "I compared\u2026 and chose\u2026 because\u2026", "Someone in my group suggested\u2026 and I helped by\u2026", "I chose to\u2026 because it was fair to\u2026", "I decided my next step would be\u2026", "When it didn\u2019t work, I\u2026"];
const samples=[["Alex", "Challenge Arena", "2027-02-09", [1, 4], "Our first bridge sagged. I folded the card into a zigzag and Mia held the ends while we tested it. It held two more counters."], ["Alex", "Beyond Earth", "2027-02-18", [3, 4], "We disagreed about where to land. I asked everyone to mark a spot, then compared the slopes. We picked the flatter patch together."], ["Alex", "Make it matter", "2027-03-02", [1, 3], "I made two handles from scrap card. The wider one was easier to grip, so I used that shape for the next version."], ["Riley", "Challenge Arena", "2027-02-11", [4], "I noticed we were both building the same part. We split the jobs and checked the pieces fitted before taping them."], ["Riley", "Beyond Earth", "2027-02-24", [3], "I timed two rover routes. The shorter route took longer because of the rocks, so I chose the smoother path."]];
const $ = selector => document.querySelector(selector);
const key = "curios.year8.capability-portfolio.v1";
const pairs = {"Challenge Arena":[1,4],"Beyond Earth":[3,4],"Make it matter":[1,3]};
function saved() { return JSON.parse(localStorage.getItem(key) || "[]"); }
function node(tag, text) { const el=document.createElement(tag); el.textContent=text; return el; }
function practiceCard(row) {
  const el=node("article",""); el.className="evidence";
  el.append(node("small","MY PRACTICE · "+new Date(row.date).toLocaleDateString("en-AU")),node("h3",row.activity),node("p",row.reflection),node("strong",(row.capabilities || [row.capability]).join(" · ")));
  return el;
}
if ($("#entry")) {
  const form=$("#entry"), groups=$("#groups"), timeline=$("#timeline");
  const initialGroups=groups.innerHTML, initialTimeline=timeline.innerHTML;
  function refresh() {
    groups.innerHTML=initialGroups; timeline.innerHTML=initialTimeline;
    let records;
    try {records=saved();} catch {$("#status").textContent="Browser storage is unavailable. The fictional examples are still available.";return;}
    for(const row of records) {
      timeline.prepend(practiceCard(row));
      for(const name of row.capabilities || [row.capability]) {
        const i=names.indexOf(name), list=$('[data-group="'+i+'"]');
        if(!list) continue;
        if(list.firstElementChild?.tagName==="P") list.replaceChildren();
        list.prepend(practiceCard(row));
        $('[data-count="'+i+'"]').textContent=list.children.length+(list.children.length===1?" reflection":" reflections");
      }
    }
  }
  function mode(by) {
    groups.hidden=!by; timeline.hidden=by;
    $("#by").setAttribute("aria-pressed",by); $("#chron").setAttribute("aria-pressed",!by);
  }
  $("#by").onclick=()=>mode(true); $("#chron").onclick=()=>mode(false);
  $("#start").onclick=()=>{form.hidden=false;$("#activity").focus();};
  $("#cancel").onclick=()=>{form.hidden=true;$("#start").focus();};
  $("#print").onclick=()=>{mode(false);window.print();};
  const selected=()=>Array.from(document.querySelectorAll("#choices input:checked"),c=>Number(c.value));
  function hint() {$("#hint").textContent=selected().map(i=>prompts[i]).join("  /  ");}
  function choices() {
    $("#choices").replaceChildren();
    for(const [j,i] of pairs[$("#activity").value].entries()) {
      const label=node("label",""), input=document.createElement("input");
      Object.assign(input,{type:"checkbox",value:i,checked:j===0});
      label.append(input," "+names[i]);$("#choices").append(label);
    }
    hint();
  }
  $("#activity").onchange=choices; $("#choices").onchange=hint;choices();
  form.onsubmit=e=>{
    e.preventDefault();
    const tags=selected(), reflection=$("#reflection").value.trim();
    if(!tags.length||!reflection){$("#status").textContent="Choose a capability and write a reflection.";return;}
    try {
      const records=saved();records.push({activity:$("#activity").value,capabilities:tags.map(i=>names[i]),reflection,date:new Date().toISOString()});
      localStorage.setItem(key,JSON.stringify(records));
      $("#reflection").value="";form.hidden=true;refresh();mode(false);
      $("#status").textContent="Reflection saved. Your entry is first in Chronological view.";
    } catch {$("#status").textContent="Saving failed. Copy your reflection before leaving.";}
  };
  refresh();
} else {
  function draw() {
    const local=$("#source").selectedIndex===1, filter=$("#filter").value;
    let records=samples.map(([who,activity,date,ids,reflection])=>({who,activity,date,capabilities:ids.map(i=>names[i]),reflection}));
    if(local) {
      try {records=saved().map(row=>({...row,who:"This browser"}));}
      catch {$("tbody").replaceChildren(); const tr=$("tbody").insertRow();const td=tr.insertCell();td.colSpan=9;td.textContent="Browser storage is unavailable.";return;}
    }
    $("tbody").replaceChildren();
    for(const who of local?["This browser"]:["Alex","Riley"]) {
      const tr=$("tbody").insertRow();tr.append(node("th",who));
      for(const name of names) {
        const td=tr.insertCell();
        for(const row of records.filter(r=>r.who===who&&(filter==="All activities"||r.activity===filter)&&(r.capabilities||[r.capability]).includes(name))) {
          const details=node("details","");details.append(node("summary",row.activity),node("small",new Date(row.date).toLocaleDateString("en-AU")),node("p",row.reflection));td.append(details);
        }
        if(!td.children.length)td.textContent="—";
      }
    }
  }
  $("#source").onchange=draw;$("#filter").onchange=draw;draw();
}
