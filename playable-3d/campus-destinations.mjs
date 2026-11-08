import {ROCKET_SITE} from './rocket-site.mjs';

/** Shared destination identity. App IDs are not room IDs: teachers can move apps. */
export const ROOM_POINTS={hall:{x:16,z:11.2,sign:[16,4.2,12.1],yaw:Math.PI},centre:{x:-18,z:12.2,sign:[-18,4.2,13.1],yaw:Math.PI},media:{x:-4,z:-41.3,sign:[-4,7.2,-40.3],yaw:Math.PI}};
export const MENU_DESTINATIONS=Object.freeze({
 'town-view':'town','studio-view':'studio','home-destination':'arrival',
 'est-destination':'room:hall','careers-destination':'room:centre',
 'chapel-destination':'chapel','market-destination':'market',
 'oval-destination':'oval','media-destination':'app:loopy','space-destination':'space'
});
const PLACES={
 town:{label:'Campus',x:8.2,z:3.2,action:'town'},
 arrival:{label:'ECC Entrance',x:8.2,z:3.2,pin:{x:8.2,z:3.2}},
 studio:{label:'Avatar Studio',x:-12.2,z:5,pin:{x:-16,z:0},rover:{x:-16,z:12},action:'studio'},
 // Pedestrian-sized entrances: park on clear approaches outside the retained trees.
 // Studio uses the north approach; Chapel uses the west approach.
 chapel:{label:'Chapel',x:-3.15,z:-8.8,pin:{x:-2,z:-10},rover:{x:-12,z:-12},action:'chapel'},
 market:{label:'Markets',x:43,z:-22,pin:{x:43,z:-26},action:'market'},
 oval:{label:'Oval',x:-4,z:-49.8,pin:{x:-4,z:-61}},
 space:{label:'SPACE',x:7,z:-53,yaw:-Math.PI/2},
 rocket:{label:'Rocket Launch Pad',x:ROCKET_SITE.x,z:ROCKET_SITE.viewingZ,pin:{x:ROCKET_SITE.x,z:ROCKET_SITE.z},rover:{x:ROCKET_SITE.roverX,z:ROCKET_SITE.roverZ},badges:['./assets/curios/rocket-pad.svg']},
 circuit:{label:'Lunar Rover Circuit',x:51,z:-56,pin:{x:62,z:-69},rover:{x:60,z:-50}},
 lunar:{label:'Curios Lunar Lab',x:38,z:-54.5,badges:['./assets/curios/lunar-lab.svg']}
};
export function resolveCampusDestination(config,key,{driving=false,enter=false,roverDock}={}){
 const apps=(config.apps||[]).filter(app=>app.enabled!==false);
 let target;
 if(key.startsWith('app:')||key.startsWith('room:')){
  const app=key.startsWith('app:')?apps.find(app=>app.id===key.slice(4)):null;
  const room=app?.room||(key.startsWith('room:')?key.slice(5):null),point=ROOM_POINTS[room];
  if(!point)return null;
  const group=apps.filter(app=>app.room===room);
  target={key,room,appId:app?.id,station:app?.station,label:app?.name||config.places?.[room]||group.map(app=>app.name).join(' + ')||'Media',x:point.x,z:point.z,yaw:point.yaw,pin:{x:point.x,z:point.z},badges:group.map(app=>app.badge),action:room==='media'?'travel':'room'};
 }else{
  const place=PLACES[key];if(!place)return null;
  target={...place,key,label:key==='market'?(config.places?.market||place.label):place.label};
 }
 target={yaw:0,...target};
 if(driving){
  const point=['arrival','town'].includes(key)?roverDock:target.rover;
  if(['arrival','town'].includes(key)&&(!Number.isFinite(point?.x)||!Number.isFinite(point?.z)))return null;
  return {...target,...(point?{x:point.x,z:point.z}:{}),action:'route'};
 }
 return {...target,action:enter||key==='studio'?(target.action||'travel'):'travel'};
}
export function campusMapDestinations(config){
 const rooms=[...new Set((config.apps||[]).filter(app=>app.enabled!==false).map(app=>app.room))];
 return [...rooms.map(room=>{
  const target=resolveCampusDestination(config,'room:'+room);
  return target&&{...target,label:config.apps.filter(app=>app.enabled!==false&&app.room===room).map(app=>app.name).join(' + ')};
 }),...['studio','chapel','market','oval','lunar','circuit','rocket','arrival'].map(key=>resolveCampusDestination(config,key))].filter(Boolean);
}
