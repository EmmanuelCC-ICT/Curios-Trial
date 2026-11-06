import {pavingNetwork} from './paving-network.js?v=student-usability-20260924';
import * as T from 'three';
import {dressedBox,planter,batchStatic} from './approved-campus-kit.js?v=ecc-ba60122';
import {addAuthoredGarden} from '../ecc-preview/authored-garden.js?v=ecc-ba60122';

export function campusExtensions(root,p){
 const works=new T.Group();works.name='Approved standard campus connections';root.add(works);
 const pavingPaths=pavingNetwork(works,p.paving,.075);const path=(points,width)=>pavingPaths.path(points,width,false);
 path([[-15,-22],[-22,-26],[-22,-39],[-18,-41.9],[-4,-41.9]],2.6);
 path([[7,-41.5],[11,-43],[11,-61]],2.4);
 path([[32,-21.8],[43,-21.8],[43,-23]],2.4);
 pavingPaths.finish();
 // A faceted planting ribbon follows the Media frontage.  It removes the
 // leftover grass sliver while keeping a continuous, generous walking path.
 const beds=[[-10.0,-41.15,7.1,.82],[-3.7,-40.72,5.4,.82],[2.8,-41.15,7.1,.82],[12.5,-49.7,1.15,4.1],[12.5,-57,1.15,4.1],[38.4,-23.2,2.7,1.15],[47.6,-23.2,2.7,1.15]];
 const garden=new T.Group();garden.name='Teaching building native landscape';works.add(garden);
 for(const [x,z,w,d]of beds)planter(garden,x,z,w,d,p);
 addAuthoredGarden(garden,beds,{treeSites:[],baseY:.43,density:5.5,detail:'supporting'});
 // Seating uses the same timber/stone language, outside the path and playing line.
 for(const [x,z]of [[-18.5,-40.4],[7.5,-41],[41,-23.4]]){dressedBox(works,x,.42,z,1.8,.16,.48,p.timber);for(const dx of[-.65,.65])dressedBox(works,x+dx,.19,z,.18,.38,.44,p.stone);}
 return {beds};
}

export {createMarketExterior} from './market-exterior.js?v=ecc-ba60122';
