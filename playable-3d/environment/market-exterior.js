import * as T from 'three';
import {dressedBox,batchStatic} from './approved-campus-kit.js?v=ecc-ba60122';

// Same accepted market shell, independent of gardens and activity modules.
export function createMarketExterior(p){
 const house=new T.Group();house.position.set(43,0,-26);house.name='Market courtyard dressed exterior';
 const b=(x,y,z,w,h,d,m=p.stone)=>dressedBox(house,x,y,z,w,h,d,m);
 // Existing low footprint and roofline, now with depth, windows and shaded entry.
 b(0,1.4,-1.45,12,2.8,.18);b(-5.92,1.4,0,.16,2.8,3);b(5.92,1.4,0,.16,2.8,3);b(0,2.71,1.42,12,.25,.2);b(0,.25,1.42,12,.5,.2);
 b(0,2.97,.30,13,.20,4.4,p.blue);b(0,2.85,.45,12.7,.07,4.4,p.timber);b(0,.075,0,11.8,.15,3,p.paving);
 for(let x=-5;x<=5;x+=2){b(x,1.62,1.45,1.66,1.83,.025,p.glass);b(x-.89,1.5,1.49,.12,2.42,.19,p.blue);b(x,1.32,1.51,1.78,.07,.11,p.blue);b(x,.87,-.25,1.8,.12,.8,p.timber);b(x,.44,-.25,1.7,.8,.65,p.stone);b(x,2.65,.25,.65,.04,.35,p.glow);}
 b(0,1.48,-1.3,11.7,2.44,.08,p.plaster);for(const x of[-5.4,5.4])b(x,1.39,2.14,.13,2.78,.13,p.blue);
 return batchStatic(house);
}
