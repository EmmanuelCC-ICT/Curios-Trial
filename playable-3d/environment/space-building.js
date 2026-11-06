import * as T from 'three';
// SPACE revision 2: source-photo-led exterior; compact, non-enterable background asset.
export function buildSpace(palette,textures){
 const root=new T.Group();root.name='SPACE reference-led exterior';
 const mat=(c,r=.8)=>new T.MeshStandardMaterial({color:c,roughness:r});
 const grey=mat(0xa6aaa3),blue=palette.blue,steel=mat(0x9ca8a6,.42),roof=mat(0xc8ccc4),dark=mat(0x333c3a),stone=palette.stone,brick=mat(0x9e6651),glass=palette.glass,warm=palette.glow,green=mat(0x477761);
 function box(w,h,d,m,x,y,z){const geometry=m===glass?new T.PlaneGeometry(w<d?d:w,h):new T.BoxGeometry(w,h,d);if(m===glass&&w<d)geometry.rotateY(Math.PI/2);const o=new T.Mesh(geometry,m);o.position.set(x,y,z);if(m.map&&!m.transparent){const uv=o.geometry.attributes.uv,n=o.geometry.attributes.normal;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(Math.abs(n.getX(i))>.5?d:w)/2,uv.getY(i)*(Math.abs(n.getY(i))>.5?d:h)/2);}o.castShadow=!m.transparent;o.receiveShadow=true;root.add(o);return o;}
 function beam(a,b,r,m=steel){const A=new T.Vector3(...a),B=new T.Vector3(...b),v=B.clone().sub(A);const o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),8),m);o.position.copy(A.add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());root.add(o);return o;}
 // Long grey hall with shallow roof and a raised brick terrace.
 box(27,.5,10.7,stone,0,.25,.6);box(26.8,.09,10.5,brick,0,.545,.6);
 box(25,2.1,.25,grey,0,4.94,2.55);box(25,5.5,.25,grey,0,3.3,-4.2);box(.25,5.5,7,grey,-12.4,3.3,-.8);box(.25,5.5,7,grey,12.4,3.3,-.8);box(25,.14,7,stone,0,.63,-.8);
 for(let x=-12.4;x<12.5;x+=.32)box(.025,1.99,.04,steel,x,4.94,2.701);box(25.7,.22,7.8,roof,0,6.15,-.8).rotation.z=-.025;
 // Front glazing and upper louvres, in repeated structural bays.
 for(let i=0;i<7;i++){const x=-10.8+i*3.2;
  box(2.85,2.55,.07,glass,x,1.9,2.73);box(.1,2.6,.1,steel,x,1.9,2.8);box(2.9,.1,.1,steel,x,1.92,2.8);
  box(2.7,1.05,.07,dark,x,4.55,2.74);
  for(let j=0;j<8;j++)box(2.95,.055,.12,steel,x,4.08+j*.135,2.82);
 }
 box(25.7,.13,2.4,roof,0,3.4,3.7);
 for(let i=0;i<8;i++){const x=-12+i*3.2;box(.23,6.25,.23,steel,x,3.6,4.6);box(.25,.23,2.2,steel,x,6.57,3.6);box(.65,.5,.65,stone,x,.8,4.6);box(.28,.3,.22,dark,x,6.65,4.65);box(.19,.14,.03,warm,x,6.67,4.78);}
 // Tall blue corner feature with folded angular panel seams and wraparound canopy.
 box(4.5,7.1,6.8,blue,9.65,4.1,-.48);box(4.9,.18,7.15,roof,9.65,7.72,-.7);
 box(4.8,.14,2.1,roof,9.65,3.5,3.65);box(2.1,.14,7.6,roof,12.2,3.5,-.05);
 for(const z of [-3,0,3.5]){box(.11,3,.11,steel,13,2,z);beam([11.9,3.35,z],[13,3.5,z],.035);}
 // Panel joint lines, distinct from the bird artwork.
 for(const [a,b]of [[[7.42,.6,2.95],[11.9,6.4,2.95]],[[7.42,4.1,2.95],[10.7,.6,2.95]],[[7.42,7.4,2.95],[11.9,3.1,2.95]]])beam(a,b,.013,dark);
 box(.85,1.8,.08,dark,8.1,1.5,2.98);for(let i=0;i<12;i++)box(.8,.045,.08,steel,8.1,.72+i*.13,3.02);
 box(.06,1.95,1.1,roof,11.94,1.58,-1.6);
 // User-corrected rear-facing foyer; collect authored parts and relocate as one group.
 const foyerStart=root.children.length;
 box(4.4,4.4,.035,glass,-11.2,2.8,3.76);box(.035,4.4,3.5,glass,-13.38,2.8,2);box(.035,4.4,3.5,glass,-9.02,2.8,2);box(4.4,4.2,.15,palette.plaster,-11.2,2.8,.3);box(3.9,.1,3.3,palette.timber,-11.2,.67,2);box(2.5,.9,.8,stone,-11.2,1.2,1.1);box(4.75,.85,3.8,blue,-11.2,5.1,2.05);
 for(const x of [-13.3,-12.3,-11.2,-10.1,-9.1])box(.1,4.35,.13,steel,x,2.8,3.8);
 box(4.4,.14,.13,steel,-11.2,2.9,3.8);box(.5,4,.08,green,-12.75,2.65,3.69);
 for(const x of [-12.1,-11,-9.9])box(.7,.06,.7,warm,x,4.65,3);
 const foyer=new T.Group();foyer.name='Rear-facing glazed foyer';
 for(const part of root.children.slice(foyerStart)){part.position.x+=11.2;part.position.z-=2;foyer.add(part);}
 foyer.rotation.y=Math.PI;foyer.position.set(9.7,0,-6.8);root.add(foyer);
 // Side wall sequence from white door toward rear: grey, cream over red base, then foyer corner.
 const red=mat(0x743d35),cream=mat(0xc9b792);
 box(.22,1.0,3.6,red,12.55,1.05,-3.6);box(.22,1.45,3.6,cream,12.55,2.275,-3.6);box(.22,2.7,3.6,grey,12.55,4.35,-3.6);
 for(const z of [-2.6,-4.5]){box(.045,.42,.75,steel,12.685,2.65,z);box(.05,.3,.62,dark,12.715,2.65,z);}
 // Rear brick court and the photographed circular paving motif.
 box(8,.18,5.8,brick,9.7,.35,-9.7);
 const ring=new T.Mesh(new T.RingGeometry(1.8,1.94,64),dark);ring.rotation.x=-Math.PI/2;ring.position.set(9.7,.448,-10);root.add(ring);
 box(.42,.015,3,dark,9.7,.453,-9.7);
 // Terrace steps serve the two principal bays.  The prior rails ran into the
 // planter beds, so leave the landing clear until the built stair geometry has
 // an appropriate edge for a correctly aligned rail.
 for(const x of [-6,5]){for(let i=0;i<4;i++)box(2.4,.13*(i+1),.38,stone,x,.065*(i+1),6.1-i*.36);
 }
 // Bird mural uses a reference photograph sampled through an authored UV projection.
 // This keeps the distinctive original artwork rather than inventing a replacement crest.
 const muralURL='environment/assets/SPACE-reference.jpg',loader=new T.TextureLoader();
 const texture=textures?textures.defer(loader,muralURL,{colour:'#31596f'}):loader.load(muralURL);texture.colorSpace=T.SRGBColorSpace;
 const mural=new T.Mesh(new T.PlaneGeometry(3.15,3.1),new T.MeshBasicMaterial({map:texture}));
 const uv=mural.geometry.attributes.uv; // source photo feature-wall patch, conservative inset
 uv.setXY(0,.397,1-.071);uv.setXY(1,.655,1-.055);uv.setXY(2,.397,1-.424);uv.setXY(3,.655,1-.424);uv.needsUpdate=true;
 mural.position.set(9.63,5.6,2.97);root.add(mural);
 return root;
}
