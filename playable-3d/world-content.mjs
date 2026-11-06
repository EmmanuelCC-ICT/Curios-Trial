export function validateConfig(value){
 if(!value||typeof value.title!=='string'||value.title.length>120)throw Error('A world title of up to 120 characters is required.');
 if(typeof value.welcome!=='string'||value.welcome.length>2000)throw Error('Provide a welcome message of up to 2000 characters.');
 if(!value.places||['hall','centre','market','community'].some(k=>typeof value.places[k]!=='string'||value.places[k].length>80))throw Error('Each place needs a name of up to 80 characters.');
 if(!Array.isArray(value.stations)||value.stations.length!==4||value.stations.some(x=>typeof x!=='string'||x.length>80))throw Error('Provide four station names.');
 for(const [id,npc] of Object.entries(value.npcs||{})){if(!/^[a-z][a-z0-9-]*$/.test(id)||typeof npc.name!=='string'||npc.name.length>100||typeof npc.enabled!=='boolean'||typeof npc.dialogue!=='string'||npc.dialogue.length>4000)throw Error('Invalid NPC configuration: '+id);}
 if(!Array.isArray(value.extraNpcs)||value.extraNpcs.length>30)throw Error('Provide up to 30 additional NPCs.');
 const ids=new Set(Object.keys(value.npcs||{}));
 for(const n of value.extraNpcs){if(!n||typeof n.id!=='string'||!(/^[a-z][a-z0-9-]*$/).test(n.id)||ids.has(n.id)||typeof n.name!=='string'||typeof n.enabled!=='boolean'||typeof n.dialogue!=='string'||n.dialogue.length>4000||(n.greetOnArrival!==undefined&&typeof n.greetOnArrival!=='boolean')||!Array.isArray(n.position)||n.position.length!==2||n.position.some(x=>!Number.isFinite(x)||Math.abs(x)>100)||typeof n.model!=='string'||!/^\.\/assets\/[a-zA-Z0-9_./ -]+\.glb$/.test(n.model)||n.model.includes('..'))throw Error('Invalid additional NPC. Use a unique id, a local ./assets/ GLB and a position.');ids.add(n.id);}
 return value;
}

export const previewStorageKey=basePath=>'year8-world:teacher-draft:'+basePath;
