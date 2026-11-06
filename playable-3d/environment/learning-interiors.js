import * as T from 'three';

// Upgrade the existing exterior roots; never rebuild their walls or colliders.
export function addTeachingInteriors(english,space,palette){
 function helpers(root){
  const box=(w,h,d,m,x,y,z)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);if(m===palette.stone||m===palette.timber){const uv=o.geometry.attributes.uv,n=o.geometry.attributes.normal;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*(Math.abs(n.getX(i))>.5?d:w)/2,uv.getY(i)*(Math.abs(n.getY(i))>.5?d:h)/2);}o.castShadow=!m.transparent;o.receiveShadow=true;root.add(o);return o;};
  const beam=(a,b,r,m=palette.blue)=>{const A=new T.Vector3(...a),B=new T.Vector3(...b),v=B.clone().sub(A),o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),8),m);o.position.copy(A.add(B).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());root.add(o);return o;};
  return {box,beam};
 }
 if(!english.getObjectByName('Media learning rooms')){
  const room=new T.Group();room.name='Media learning rooms';const {box}=helpers(room),wood=palette.timber,silver=new T.MeshStandardMaterial({color:0xb7c4c9,roughness:.3}),screen=new T.MeshStandardMaterial({color:0x203a43,roughness:.8}),display=learningDisplays();
  for(const [level,y]of [1.1,3.85].entries())for(const [i,x]of [-8,-4,0,4,8].entries()){
   box(1.20,1.95,.09,wood,x,y+1.43,-2.68);display(room,(i+level*2)%6,1.10,1.78,x,y+1.43,-2.62);
   box(2.45,.13,1.0,wood,x,y+.78,.30);for(const dx of[-.96,.96])box(.07,.73,.60,silver,x+dx,y+.365,.30);
   box(.60,.12,.56,wood,x+.55,y+.45,1.08);box(.60,.64,.08,wood,x+.55,y+.80,1.32);
   if(level===0&&i%2===0){box(.96,.62,.08,screen,x-.3,y+1.17,.22);display(room,i,.87,.51,x-.3,y+1.17,.268);box(.09,.18,.1,silver,x-.3,y+.83,.22);}
   if(level===1&&i%2===1){box(.06,1.58,.07,wood,x-.50,y+.83,.12);display(room,4,.61,1.05,x-.50,y+1.35,.18,-.12);}
  }
  english.add(room);
 }
 if(!space.getObjectByName('SPACE learning hall')){
  const hall=new T.Group();hall.name='SPACE learning hall';const {box,beam}=helpers(hall);addSportsHall(hall,palette,box,beam);space.add(hall);
 }
}

// Authored classroom displays and court markings: one small canvas per building,
// no external image request and no change to the non-enterable teaching footprints.
export function learningDisplays(){
 const c=document.createElement('canvas');c.width=1536;c.height=512;const x=c.getContext('2d');
 const colours=['#254b57','#b55d4b','#dfb752','#7c977d','#d4cbb4'];
 for(let card=0;card<6;card++){
  x.save();x.translate(card*256,0);x.fillStyle=card%2?'#173746':'#f4efdf';x.fillRect(0,0,256,512);
  x.fillStyle=card%2?'#f4efdf':'#254b57';x.font='bold 20px sans-serif';x.fillText(['VISUAL STORIES','FILM / MEDIA','COLOUR & FORM','ON LOCATION','DRAWING STUDIO','SOUND & VISION'][card],18,40);
  x.font='12px sans-serif';x.fillText(['Observe. Imagine. Create.','LIGHT  /  FRAME  /  EDIT','Explore a different perspective','A story begins with a frame','Look closely. Make your mark.','Capture the world around you'][card],18,64);
  x.save();x.beginPath();x.rect(18,88,220,325);x.clip();
  if(card===0||card===3){
   const g=x.createLinearGradient(0,88,0,380);g.addColorStop(0,'#92b5bd');g.addColorStop(1,'#f1d8a4');x.fillStyle=g;x.fillRect(18,88,220,325);
   x.fillStyle='#f2d69b';x.beginPath();x.arc(178,158,32,0,Math.PI*2);x.fill();
   for(let i=0;i<4;i++){x.fillStyle=['#728b88','#487472','#315d5d','#204a51'][i];x.beginPath();x.moveTo(18,280+i*35);for(let a=18;a<=238;a+=4)x.lineTo(a,252+i*34+Math.sin(a*.018+i)*27);x.lineTo(238,413);x.lineTo(18,413);x.fill();}
   if(card===3){x.strokeStyle='#f8eee0';x.lineWidth=3;for(const [a,b]of [[32,106],[202,106],[32,375],[202,375]]){x.beginPath();x.moveTo(a,b+15);x.lineTo(a,b);x.lineTo(a+20,b);x.stroke();}x.fillStyle='#df705d';x.beginPath();x.arc(46,130,5,0,7);x.fill();x.font='12px monospace';x.fillText('REC',59,135);}
  }else if(card===1){
   x.fillStyle='#dcb75f';x.beginPath();x.arc(128,220,83,0,7);x.fill();x.fillStyle='#182c34';x.fillRect(46,208,164,114);x.save();x.translate(46,190);x.rotate(-.13);x.fillRect(0,0,164,29);x.fillStyle='#f2efdc';for(let a=5;a<164;a+=34){x.beginPath();x.moveTo(a,0);x.lineTo(a+24,0);x.lineTo(a+10,29);x.lineTo(a-14,29);x.fill();}x.restore();x.fillStyle='#e9e5d4';x.font='15px monospace';x.fillText('SCENE  01',65,249);x.fillText('TAKE   03',65,279);x.fillStyle='#73a49a';x.fillRect(46,349,164,6);
  }else if(card===2){
   x.fillStyle='#e3d7ba';x.fillRect(18,88,220,325);for(let i=0;i<5;i++){x.fillStyle=colours[i];x.beginPath();x.arc(72+(i%2)*102,141+i*48,48,0,7);x.fill();}x.strokeStyle='#f5efdf';x.lineWidth=7;x.beginPath();x.moveTo(48,379);x.lineTo(202,106);x.stroke();
  }else if(card===4){
   x.fillStyle='#ece4ce';x.fillRect(18,88,220,325);x.strokeStyle='#476b5a';x.lineWidth=3;x.beginPath();x.moveTo(130,386);x.bezierCurveTo(110,280,158,208,118,108);x.stroke();for(let i=0;i<10;i++){const yy=140+i*22,sign=i%2?1:-1;x.save();x.translate(130,yy);x.rotate(sign*.6);x.beginPath();x.ellipse(sign*23,-9,34,8,sign*.4,0,7);x.stroke();x.restore();}x.strokeStyle='#bca984';x.lineWidth=1;x.strokeRect(32,102,192,296);
  }else{
   x.fillStyle='#d4a55e';for(let i=0;i<40;i++){const h=12+95*Math.abs(Math.sin(i*.43)*Math.cos(i*.13));x.fillRect(26+i*5.2,250-h/2,2.8,h);}x.strokeStyle='#75a5a0';x.lineWidth=3;x.beginPath();x.moveTo(27,359);x.lineTo(91,359);x.lineTo(118,333);x.lineTo(153,333);x.lineTo(182,371);x.lineTo(227,371);x.stroke();x.font='16px monospace';x.fillStyle='#ede6d5';x.fillText('00:01:24:08',59,161);
  }
  x.restore();x.fillStyle=card%2?'#b9cbc5':'#6a8275';x.fillRect(18,445,74,3);x.font='13px sans-serif';x.fillText('ENGLISH + MEDIA',18,477);x.restore();
 }
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=8;
 const material=new T.MeshStandardMaterial({map,emissiveMap:map,emissive:0xffffff,emissiveIntensity:.45,roughness:.85});material.name='English and Media authored display atlas';
 return (root,card,w,h,px,py,pz,angle=0)=>{const geo=new T.PlaneGeometry(w,h),uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,(uv.getX(i)+card)/6);const o=new T.Mesh(geo,material);o.name='Art and media learning display';o.position.set(px,py,pz);o.rotation.y=angle;root.add(o);return o;};
}

export function addSportsHall(root,p,box,beam){
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=768;const x=canvas.getContext('2d');
 x.fillStyle='#cba16b';x.fillRect(0,0,2048,768);
 for(let row=0;row<32;row++)for(let col=-1;col<13;col++){const a=col*180+(row%3)*60,b=row*24;x.fillStyle=['#c9a170','#d4af7e','#c29a68','#d7b17c'][(row*7+col+13)%4];x.fillRect(a,b,179,23);x.fillStyle='rgba(113,75,36,.10)';x.fillRect(a+9,b+7,156,1);}
 // Two practice half courts fit the accepted compact hall; no footprint expansion.
 for(const centre of [510,1515]){
  x.strokeStyle='#fff4d5';x.lineWidth=7;x.strokeRect(centre-470,40,940,683);
  x.fillStyle='rgba(40,92,103,.72)';x.fillRect(centre-181,40,362,266);x.strokeRect(centre-181,40,362,266);
  x.beginPath();x.arc(centre,306,110,0,Math.PI*2);x.stroke();
  x.beginPath();x.arc(centre,93,418,0,Math.PI);x.stroke();
  x.beginPath();x.arc(centre,723,99,Math.PI,Math.PI*2);x.stroke();
  x.strokeStyle='#df7950';x.lineWidth=5;x.beginPath();x.arc(centre,94,42,0,Math.PI*2);x.stroke();
 }
 const tx=new T.CanvasTexture(canvas);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=8;
 const timber=new T.MeshStandardMaterial({map:tx,roughness:.48,emissiveMap:tx,emissive:0xffffff,emissiveIntensity:.18});
 const floor=new T.Mesh(new T.PlaneGeometry(19.8,6.48),timber);floor.name='SPACE two basketball practice courts';floor.rotation.x=-Math.PI/2;floor.position.set(-2.4,.712,-.8);floor.receiveShadow=true;root.add(floor);
 const wall=new T.MeshStandardMaterial({color:0xe0ddcb,roughness:.85,emissive:0xe0ddcb,emissiveIntensity:.15});
 box(19.8,4.9,.045,wall,-2.4,3.15,-4.055);
 const pad=new T.MeshStandardMaterial({color:0x316578,roughness:.8}),white=new T.MeshStandardMaterial({color:0xf4eedb,roughness:.5,emissive:0xffffff,emissiveIntensity:.12}),orange=new T.MeshStandardMaterial({color:0xd26a35,roughness:.5});
 for(const cx of[-7.25,2.45]){
  box(3.15,1.45,.16,pad,cx,1.48,-3.92);box(1.52,.96,.07,white,cx,3.15,-3.33);
  box(.62,.025,.015,pad,cx,2.98,-3.286);box(.62,.025,.015,pad,cx,3.39,-3.286);for(const dx of[-.31,.31])box(.025,.41,.015,pad,cx+dx,3.18,-3.286);
  beam([cx,3.2,-4],[cx,3.15,-3.35],.055,p.blue);
  const hoop=new T.Mesh(new T.TorusGeometry(.245,.022,6,32),orange);hoop.rotation.x=Math.PI/2;hoop.position.set(cx,2.86,-3.03);root.add(hoop);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;beam([cx+Math.cos(a)*.23,2.85,-3.03+Math.sin(a)*.23],[cx+Math.cos(a+.3)*.14,2.44,-3.03+Math.sin(a+.3)*.14],.007,white);}
  for(const y of[2.53,2.7]){const ring=new T.Mesh(new T.TorusGeometry(y===2.53?.16:.2,.006,4,24),white);ring.rotation.x=Math.PI/2;ring.position.set(cx,y,-3.03);root.add(ring);}
 }
 for(const cx of[-10,-5,0,5]){box(2.3,.035,.23,p.glow,cx,5.52,-.4);beam([cx,5.95,-3.8],[cx,5.6,2.3],.045,p.blue);}
 // Benches remain against the ends, leaving both playing surfaces readable.
 for(const cx of[-11.85,7.0]){box(.4,.12,3.1,p.timber,cx,1.0,-.75);for(const z of[-1.85,.35])box(.3,.35,.13,p.blue,cx,.78,z);}
}
