import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ROOM_POINTS,MENU_DESTINATIONS,resolveCampusDestination,campusMapDestinations} from '../playable-3d/campus-destinations.mjs';
const config=JSON.parse(await readFile(new URL('../world-config.json',import.meta.url),'utf8'));
const appSource=await readFile(new URL('../playable-3d/app.js',import.meta.url),'utf8');
const hubSource=await readFile(new URL('../playable-3d/curios-hub.mjs',import.meta.url),'utf8');
const dock={x:12,z:3},resolve=(key,options={})=>resolveCampusDestination(config,key,{roverDock:dock,...options});

test('Loopy follows its configured centre and left PC instead of the old oval/media point',()=>{
 const loopy=resolve('app:loopy',{enter:true});
 assert.equal(loopy.room,'centre');assert.equal(loopy.station,'left');assert.equal(loopy.action,'room');
 assert.equal(loopy.label,'Loopy Tunes');assert.deepEqual([loopy.x,loopy.z],[ROOM_POINTS.centre.x,ROOM_POINTS.centre.z]);
 assert.notEqual(loopy.z,ROOM_POINTS.media.z);
 const art=resolve('app:artquest',{enter:true});assert.equal(art.room,'centre');assert.equal(art.station,'right');
 assert.match(appSource,/target\.room==='hall'\?enterHall\(target.appId\):enterCareers\(target.appId\)/);
 assert.match(appSource,/curiosHub\?\.installRoomMonitors\(\)/);
});

test('App IDs, room IDs, custom labels, moves and disabled apps resolve independently',()=>{
 const custom=structuredClone(config),loopy=custom.apps.find(app=>app.id==='loopy');
 loopy.name='Music Lab';loopy.room='media';delete loopy.station;
 assert.equal(resolveCampusDestination(custom,'app:loopy').label,'Music Lab');
 assert.deepEqual([resolveCampusDestination(custom,'app:loopy').x,resolveCampusDestination(custom,'app:loopy').z],[ROOM_POINTS.media.x,ROOM_POINTS.media.z]);
 loopy.room='hall';custom.apps[0].room='media';
 assert.equal(resolveCampusDestination(custom,'app:loopy',{enter:true}).room,'hall');
 loopy.id='centre';assert.equal(resolveCampusDestination(custom,'app:centre').room,'hall');assert.equal(resolveCampusDestination(custom,'room:centre').room,'centre');
 loopy.enabled=false;assert.equal(resolveCampusDestination(custom,'app:centre'),null);
 assert.equal(resolveCampusDestination(custom,'app:loopy'),null);assert.equal(resolveCampusDestination(custom,'room:missing'),null);
 custom.places.market='Weekend Market';assert.equal(resolveCampusDestination(custom,'market').label,'Weekend Market');
 assert.equal(resolveCampusDestination(custom,'missing'),null);
});

test('Every active Places menu entry has one shared resolver binding',async()=>{
 const html=await readFile(new URL('../playable-3d/index.html',import.meta.url),'utf8');
 const ids=[...html.match(/<div class="destination-bar"[\s\S]*?<\/div>/)[0].matchAll(/<button id="([^"]+)"/g)].map(match=>match[1]).filter(id=>id!=='resources-destination');
 assert.deepEqual([...Object.keys(MENU_DESTINATIONS)].sort(),ids.sort());
 for(const [id,key] of Object.entries(MENU_DESTINATIONS)){assert.ok(resolve(key),id);assert.equal(resolve(key,{driving:true,enter:true}).action,'route',id);}
 assert.match(appSource,/Object\.entries\(MENU_DESTINATIONS\)\)\$\(id\)\.addEventListener\('click',\(\)=>visitCampusDestination\(key,\{enter:true\}\)\)/);
 assert.doesNotMatch(appSource,/\$\('media-destination'\)\.addEventListener/);
 assert.match(appSource,/\$\(id\)\.hidden=!target/);
});

test('Full and mini map share configured room groups, labels and the same click callbacks',()=>{
 const pins=campusMapDestinations(config),centre=pins.find(pin=>pin.key==='room:centre');
 assert.equal(centre.label,'ArtQuest + Loopy Tunes');assert.equal(centre.badges.length,2);
 assert.ok(!pins.some(pin=>pin.key==='room:media'));
 assert.deepEqual(pins.map(pin=>pin.key),['room:hall','room:centre','studio','chapel','market','oval','lunar','circuit','arrival']);
 for(const pin of pins){assert.ok(resolve(pin.key));assert.equal(resolve(pin.key,{driving:true}).action,'route');}
 const custom=structuredClone(config);custom.apps.find(app=>app.id==='loopy').enabled=false;
 assert.equal(campusMapDestinations(custom).find(pin=>pin.key==='room:centre').badges.length,1);
 assert.match(hubSource,/campusMapDestinations\(config\)/);
 assert.match(hubSource,/\(\)=>visit\(target.key\)/);
 assert.match(hubSource,/button.onclick=originals\[i\].onclick/);
 assert.doesNotMatch(hubSource,/marker\('Avatar Studio'.*studio/);
});

test('Walking shortcuts keep room/PC entry, while rover choices only select exterior routes',()=>{
 assert.equal(resolve('room:centre',{enter:true}).action,'room');
 assert.equal(resolve('room:hall',{enter:true}).action,'room');
 assert.equal(resolve('room:centre').action,'travel','map visits the room entrance');
 assert.equal(resolve('studio').action,'studio','map retains on-foot Studio shortcut');
 assert.equal(resolve('chapel',{enter:true}).action,'chapel');
 assert.equal(resolve('market',{enter:true}).action,'market');
 for(const key of ['studio','chapel']){const walking=resolve(key),driving=resolve(key,{driving:true});assert.notDeepEqual([driving.x,driving.z],[walking.x,walking.z]);}
 for(const key of ['arrival','town']){const target=resolve(key,{driving:true});assert.deepEqual({x:target.x,z:target.z},dock);}
 assert.equal(resolveCampusDestination(config,'arrival',{driving:true}),null,'a missing dock must not invent a return location');
});

// Run the real app routing adapter with a simulated driver. These are source-level
// integration checks, not browser or rendering acceptance.
function drivingAdapter(reachable=true){
 const calls=[],title={textContent:'Rover → Previous destination'};
 const rover={driving:true,routeTo(x,z){calls.push(['route',x,z]);return {reachable,reason:reachable?null:'No clear stopping space'};}};
 const source=appSource.slice(appSource.indexOf('async function visitCampusDestination('),appSource.indexOf('function resetStudioCamera('));
 const fail=name=>()=>{throw Error('Driving must not call '+name);};
 const visit=new Function('config','resolveCampusDestination','ROVER_DOCK','lunarRover','$','toast','setLocation','setMode','openStudio','returnTown','worlds',source+';return visitCampusDestination;')(config,resolveCampusDestination,dock,rover,()=>title,message=>calls.push(['toast',message]),label=>title.textContent=label,fail('setMode'),fail('openStudio'),fail('returnTown'),{teleport:fail('teleport')});
 return {visit,calls,title,rover};
}

test('Real menu/full-map adapter never changes mode, teleports or dismounts a driver',async()=>{
 const fixture=drivingAdapter();
 for(const key of new Set([...Object.values(MENU_DESTINATIONS),...campusMapDestinations(config).map(pin=>pin.key)])){
  for(const enter of [false,true]){const expected=resolve(key,{driving:true,enter});await fixture.visit(key,{enter});assert.deepEqual(fixture.calls.at(-2),['route',expected.x,expected.z]);assert.equal(fixture.rover.driving,true);}
 }
});

test('A failed replacement route resets the old destination label without changing driver state',async()=>{
 const fixture=drivingAdapter(false);await fixture.visit('app:loopy',{enter:true});
 assert.equal(fixture.title.textContent,'Lunar Rover');assert.equal(fixture.rover.driving,true);
 assert.deepEqual(fixture.calls.at(-1),['toast','No clear stopping space']);
});

test('Loopy menu dispatch enters the configured room and respects the unsaved Studio guard',async()=>{
 const calls=[],source=appSource.slice(appSource.indexOf('async function visitCampusDestination('),appSource.indexOf('async function campusSpot('));let pendingLeave;
 const visit=new Function('config','resolveCampusDestination','ROVER_DOCK','lunarRover','mode','leaveStudio','setMode','enterHall','enterCareers','toast',source+';return visitCampusDestination;')(config,resolveCampusDestination,dock,null,'studio',callback=>pendingLeave=callback,async mode=>{calls.push(['mode',mode]);return true;},id=>calls.push(['hall',id]),id=>calls.push(['centre',id]),message=>calls.push(['toast',message]));
 await visit('app:loopy',{enter:true});assert.equal(calls.length,0,'do not discard an unsaved avatar');assert.equal(typeof pendingLeave,'function');
 await pendingLeave();assert.deepEqual(calls,[['mode','town'],['centre','loopy']]);
});

test('Room map coordinates agree with door triggers and static exhibits',async()=>{
 const doors=await readFile(new URL('../playable-3d/destinations.js',import.meta.url),'utf8');
 for(const [room,name] of [['hall','EST'],['centre','CAREERS']]){
  const door=new Function('config','return '+doors.match(new RegExp('export const '+name+'=(\\{[^;]+\\});'))[1])(config);
  assert.equal(ROOM_POINTS[room].x,door.x);assert.ok(Math.abs(ROOM_POINTS[room].z-door.doorZ)<3);
 }
 const chapel=await readFile(new URL('../playable-3d/chapel.js',import.meta.url),'utf8');
 const door=new Function('return '+chapel.match(/export const CHAPEL=(\{[^;]+\});/)[1])();
 assert.deepEqual([resolve('chapel').x,resolve('chapel').z],[door.x,door.z]);
 const lab=await readFile(new URL('../playable-3d/curios-lunar-lab.mjs',import.meta.url),'utf8');
 const site=new Function('return '+lab.match(/export const LUNAR_SITE=Object.freeze\((\{[^;]+\})\);/)[1])();
 assert.deepEqual([resolve('lunar').x,resolve('lunar').z],[site.arrivalX,site.arrivalZ]);
});
