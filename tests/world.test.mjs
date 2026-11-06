import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateConfig} from '../playable-3d/world-content.mjs';
import {createIsolatedStorage} from '../playable-3d/world-storage.mjs';
const base=JSON.parse(await readFile(new URL('../world-config.json',import.meta.url),'utf8'));
test('default world leaves all named NPCs present with no assigned dialogue',()=>{validateConfig(base);for(const npc of Object.values(base.npcs)){assert.equal(npc.enabled,true);assert.equal(npc.dialogue,'');}});
test('teachers can disable, rename and give an NPC their own dialogue',()=>{const next=structuredClone(base);next.npcs.mara={enabled:false,name:'Science guide',dialogue:'Look around the garden.'};assert.equal(validateConfig(next).npcs.mara.name,'Science guide');});
test('additional characters require a local asset and unique identity',()=>{const next=structuredClone(base);next.extraNpcs=[{id:'guide',name:'Guide',enabled:true,dialogue:'Hello',position:[0,5],model:'./assets/helpers/echo.glb'}];assert.equal(validateConfig(next).extraNpcs.length,1);next.extraNpcs[0].model='https://example.com/model.glb';assert.throws(()=>validateConfig(next));next.extraNpcs[0].model='./assets/../private.glb';assert.throws(()=>validateConfig(next));});
test('malformed teacher configuration is rejected before scene construction',()=>{for(const change of [s=>s.stations=[],s=>s.places.hall=23,s=>s.npcs.echo.enabled='false',s=>s.extraNpcs.push({})]){const next=structuredClone(base);change(next);assert.throws(()=>validateConfig(next));}});
test('prototype saves never read, overwrite or remove original Career Empire keys',()=>{const data=new Map([['career-empire-3d-profiles-v2-tripo','original']]);const backing={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};const store=createIsolatedStorage(backing);assert.equal(store.getItem('career-empire-3d-profiles-v2-tripo'),null);store.setItem('career-empire-3d-profiles-v2-tripo','prototype');assert.equal(data.get('career-empire-3d-profiles-v2-tripo'),'original');assert.equal(store.getItem('career-empire-3d-profiles-v2-tripo'),'prototype');store.removeItem('career-empire-3d-profiles-v2-tripo');assert.equal(data.get('career-empire-3d-profiles-v2-tripo'),'original');});
test('restricted browser storage still supports current-session character state',()=>{const store=createIsolatedStorage({getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}});store.setItem('avatar','saved');assert.equal(store.getItem('avatar'),'saved');store.removeItem('avatar');assert.equal(store.getItem('avatar'),null);});
test('app rooms accept the three supplied HTTPS destinations and reject unsafe or duplicate routes',()=>{assert.equal(validateConfig(base).apps.length,3);for(const change of [s=>s.apps[0].url='javascript:alert(1)',s=>s.apps[0].url='https://',s=>s.apps[0].badge='../private.png',s=>s.apps[1].room=s.apps[0].room,s=>s.apps[0].enabled='false']){const next=structuredClone(base);change(next);assert.throws(()=>validateConfig(next));}});

test('welcome video is optional and only accepts local media',()=>{
 const custom=structuredClone(base),basil=custom.extraNpcs.find(n=>n.id==='basil');
 basil.videoEnabled=false;basil.dialogue='Welcome to our science world';assert.equal(validateConfig(custom).extraNpcs.find(n=>n.id==='basil').videoEnabled,false);
 basil.video='https://example.com/film.mp4';assert.throws(()=>validateConfig(custom),/local assets/);
});
