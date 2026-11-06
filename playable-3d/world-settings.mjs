import {validateConfig,previewStorageKey} from './world-content.mjs?v=navigation-final1';
const response=await fetch('../world-config.json?v=navigation-final1');
if(!response.ok)throw Error('World settings could not load.');
let settings=await response.json();
if(new URLSearchParams(location.search).get('teacher-preview')==='1'){try{const draft=localStorage.getItem(previewStorageKey(new URL('../',location.href).pathname));if(draft)settings=validateConfig(JSON.parse(draft));}catch(error){console.warn('Teacher preview settings unavailable; using published settings.',error);}}
export const config=validateConfig(settings);
export const npcInfo=id=>config.npcs[id]||{name:id.startsWith('customer-')?'Visitor':id,enabled:true,dialogue:''};
const labels={
 'ORIGINAL CAREER EMPIRE':'WELCOME','OPEN THE ORIGINAL GAME':'EXPLORE THE CAMPUS',
 'CAREERS ADVICE CENTRE':config.places.centre.toUpperCase(),'Careers Advice Centre':config.places.centre,
 'EST PREP':config.places.hall.toUpperCase(),'EST Prep':config.places.hall,
 'MY LIFE':'','SHOP DEMO':'','$100,000 PRACTICE MONEY':'',
 CORE:config.stations[0],TERM:config.stations[1],VTCS:config.stations[2],BOSS:config.stations[3],
 'LIVE MUSIC & SUNDAY MARKETS':config.places.market.toUpperCase(),'LIVE MUSIC & SUNDAY MARKET':config.places.market.toUpperCase(),
 'MARA · START HERE':npcInfo('mara').name,'SAM · MARKET CREW':npcInfo('sam').name,
 'MARKETS ADMINISTRATION':config.places.community.toUpperCase(),
 'PHONE ORDER / ALREADY PAID':'','WALK-UP / ORDER & PAY':'','FOOD READY / COLLECT HERE':'',
 'WAITING FOR A PHONE ORDER':'','CREW PASS':'','THANK YOU, JUNIPER CREW':'',
 'FREE STAGE BREAK':'STAGE','WORK BENCH':'TABLE',
 '80 employers / 3 years':'','WHO • WHEN • WHERE?':'','ORDERS':'DISPLAY','24 / TODAY':'',
 'ARCHIVE':'RESOURCES','8 YEARS EARLIER':'','REGIONAL BULLETIN':'NOTICEBOARD',
 'A CLAIM IS A START':'NOTICEBOARD','Check what supports it':'',
 'OPERATIONS / DEV':'ACTIVITY SPACE','Service yard and deliveries':'',
 'WE ARE HIRING':'NOTICEBOARD','Service • Stock':'','SUPERVISED ROLES':'',
 'COMMUNITY ADMINISTRATION':config.places.community.toUpperCase(),'Research • Operations • Opportunities':'',
 'Next gigs • Paid research':'','SERVICE YARD →':'COURTYARD →','Work trials with Dev':'',
 'Assign available blocks':'','WORK PLAN':'DISPLAY','Choose a pressure at the yard':'',
 'No extra wages or grades':'','OPPORTUNITIES':'ACTIVITY SPACE','Talk to the adviser':'',
 'RESEARCH / NORA':'ROOM 1','OPPORTUNITIES / APPLICATIONS':'ROOM 2',
 'Research room':'Room 1','Service yard':'Courtyard','Opportunities room':'Room 2'
};
export function neutralLabel(text){return Object.hasOwn(labels,text)?labels[text]:/^WORK ROLE \d$/.test(text)?text.replace('WORK ROLE','SPACE'):text;}
