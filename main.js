import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import ANTON from '../assets/anton.js';
const W=()=>innerWidth,H=()=>innerHeight;
const REDUCED=matchMedia('(prefers-reduced-motion:reduce)').matches;

const renderer=new THREE.WebGLRenderer({canvas:document.getElementById('c'),antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(W(),H());
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.0;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(40,W()/H(),0.1,200); camera.position.set(0,0,24);

const pmrem=new THREE.PMREMGenerator(renderer);
scene.environment=pmrem.fromScene(new RoomEnvironment(),0.035).texture;
const key=new THREE.DirectionalLight(0xfff3da,1.0); key.position.set(5,8,11); scene.add(key);
const gold=new THREE.DirectionalLight(0xf0c46a,1.0); gold.position.set(-8,3,6); scene.add(gold);
const warm=new THREE.DirectionalLight(0xffb24d,0.6); warm.position.set(8,-3,6); scene.add(warm);
const cool=new THREE.DirectionalLight(0xbfd0ff,0.4); cool.position.set(0,7,-6); scene.add(cool);

function makeNormalMap(size=512){
  const cv=document.createElement('canvas');cv.width=cv.height=size;
  const ctx=cv.getContext('2d'),id=ctx.createImageData(size,size),d=id.data,h=new Float32Array(size*size);
  const rnd=(x,y,s)=>{const n=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453;return n-Math.floor(n);};
  const nz=(x,y,c,s)=>{const gx=x/c,gy=y/c,x0=Math.floor(gx),y0=Math.floor(gy),fx=gx-x0,fy=gy-y0;
    const a=rnd(x0,y0,s),b=rnd(x0+1,y0,s),cc=rnd(x0,y0+1,s),dd=rnd(x0+1,y0+1,s);
    const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return a*(1-u)*(1-v)+b*u*(1-v)+cc*(1-u)*v+dd*u*v;};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){let v=0,a=.5,c=70;for(let o=0;o<5;o++){v+=nz(x,y,c,o)*a;a*=.5;c*=.5;}h[y*size+x]=v;}
  const st=2.3;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const xl=h[y*size+((x-1+size)%size)],xr=h[y*size+((x+1)%size)];
    const yt=h[((y-1+size)%size)*size+x],yb=h[((y+1)%size)*size+x];
    const dx=(xl-xr)*st,dy=(yt-yb)*st,z=1,L=Math.hypot(dx,dy,z),i=(y*size+x)*4;
    d[i]=((dx/L)*.5+.5)*255;d[i+1]=((dy/L)*.5+.5)*255;d[i+2]=((z/L)*.5+.5)*255;d[i+3]=255;}
  ctx.putImageData(id,0,0);const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);return t;
}
const mat=new THREE.MeshPhysicalMaterial({color:0xE8C066,metalness:1.0,roughness:0.3,envMapIntensity:1.75,
  clearcoat:0.6,clearcoatRoughness:0.25,normalMap:makeNormalMap(512),normalScale:new THREE.Vector2(0.5,0.5)});

const LINES=['CONTENT','HELPER','COMMUNITY'];
const SIZE=2.2,LH=2.45,GAP=0.05;
let group=null,letters=[],font=null,layoutW=1,layoutH=1;
const rand=(a,b)=>a+Math.random()*(b-a);
function build(){
  group=new THREE.Group();letters=[];layoutW=1;
  LINES.forEach((line,ri)=>{
    const row=[];let cursor=0;
    for(const ch of line){
      let geo;try{geo=new TextGeometry(ch,{font,size:SIZE,height:0.62,curveSegments:9,
        bevelEnabled:true,bevelThickness:0.08,bevelSize:0.05,bevelSegments:3});}catch(e){continue;}
      geo.computeBoundingBox();const w=geo.boundingBox.max.x-geo.boundingBox.min.x;geo.center();
      const m=new THREE.Mesh(geo,mat);m.position.x=cursor+w/2;cursor+=w+GAP;row.push(m);
    }
    layoutW=Math.max(layoutW,cursor);const yo=(1-ri)*LH;
    row.forEach(m=>{m.position.x-=cursor/2;m.position.y=yo;group.add(m);letters.push(m);});
  });
  layoutH=(LINES.length-1)*LH+SIZE*1.2;
  letters.forEach((m,i)=>{const side=i<letters.length/2?-1:1;
    m.userData={home:m.position.clone(),
      sPos:new THREE.Vector3(side*rand(6.5,13.5),rand(-8.5,8.5),rand(-5,7)),
      sRot:new THREE.Euler(rand(-.9,.9),rand(-1,1),rand(-.6,.6)),
      phase:Math.random()*Math.PI*2,bob:rand(.25,.6),sway:rand(.1,.3),revealAt:0,expAt:0};
    m.rotation.set(0,0,0);m.scale.setScalar(0.0001);});
  scene.add(group);fit();
}
function visible(z=0){const d=camera.position.z-z;const h=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*d;return{h,w:h*camera.aspect};}
function fit(){const v=visible(0);group.scale.setScalar(Math.min(v.w*0.92/layoutW,v.h*0.6/layoutH));}

const composer=new EffectComposer(renderer);
composer.addPass(new RenderPass(scene,camera));
const bloom=new UnrealBloomPass(new THREE.Vector2(W(),H()),0.3,0.5,0.86);
composer.addPass(bloom);composer.addPass(new OutputPass());

let T={};
function buildTimeline(){
  const N=letters.length;const TYPE_START=0.5,TYPE_STEP=0.05,TYPE_GROW=0.26;
  const typeEnd=TYPE_START+N*TYPE_STEP+TYPE_GROW;const MK=typeEnd+0.25;
  const MARK=[MK,MK+0.55],MARK_DUR=0.6,markEnd=MARK[1]+MARK_DUR;
  const EXP_START=markEnd+0.35,EXP_DUR=1.1,EXP_STAGGER=0.02;const CAP_START=EXP_START+0.65;
  letters.forEach((m,i)=>{m.userData.revealAt=TYPE_START+i*TYPE_STEP;m.userData.expAt=EXP_START+i*EXP_STAGGER;});
  T={TYPE_GROW,MARK,MARK_DUR,EXP_START,EXP_DUR,CAP_START};
}
const clamp=x=>Math.max(0,Math.min(1,x));
const outBack=x=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);};
const inOut=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;

let mx=0,my=0;
addEventListener('pointermove',e=>{mx=(e.clientX/W())*2-1;my=(e.clientY/H())*2-1;});
const spark=document.getElementById('spark'),marker=document.getElementById('marker');
const chunks=[document.getElementById('m1'),document.getElementById('m2')];
const heroInner=document.getElementById('heroInner');

let clock=new THREE.Clock(false),booted=false;
function frame(){
  requestAnimationFrame(frame);
  if(scrollY>H()*1.15){return;} // pause render when scrolled past hero
  const t=clock.getElapsedTime();
  const sIn=clamp((t-0.15)/0.5),sOut=1-clamp((t-(T.EXP_START-0.3))/0.5);
  spark.style.opacity=(sIn*sOut*0.9).toFixed(3);
  spark.style.transform=`translate(-50%,-50%) scale(${0.85*(0.6+0.4*Math.sin(t*3))})`;
  letters.forEach(m=>{const u=m.userData,g=clamp((t-u.revealAt)/T.TYPE_GROW),sc=g<=0?0.0001:outBack(g);
    if(t<u.expAt){m.position.copy(u.home);m.rotation.set(0,0,0);m.scale.setScalar(sc);}
    else{const e=clamp((t-u.expAt)/T.EXP_DUR),k=inOut(e);
      m.position.set(u.home.x+(u.sPos.x-u.home.x)*k,u.home.y+(u.sPos.y-u.home.y)*k,u.home.z+(u.sPos.z-u.home.z)*k);
      m.rotation.set(u.sRot.x*k,u.sRot.y*k,u.sRot.z*k);m.scale.setScalar(1);
      const amp=clamp((t-(u.expAt+T.EXP_DUR))/0.8);
      if(amp>0){m.position.y+=Math.sin(t*0.9+u.phase)*u.bob*amp;
        m.rotation.y+=Math.sin(t*0.5+u.phase)*u.sway*amp;m.rotation.z+=Math.sin(t*0.4+u.phase)*0.06*amp;}}});
  const pOn=clamp((t-T.EXP_START)/0.6);
  group.rotation.y+=(mx*0.4*pOn-group.rotation.y)*0.05;
  group.rotation.x+=(my*0.25*pOn-group.rotation.x)*0.05;
  chunks.forEach((c,i)=>{const f=clamp((t-T.MARK[i])/T.MARK_DUR);c.style.opacity=f>0?1:0;c.style.clipPath=`inset(0 ${(1-f)*100}% 0 0)`;});
  const mOut=clamp((t-T.EXP_START)/0.4);
  marker.style.opacity=(1-mOut).toFixed(3);marker.style.transform=`translateY(${-mOut*28}px)`;marker.style.filter=`blur(${mOut*6}px)`;
  const cf=clamp((t-T.CAP_START)/0.8);
  if(cf>0){heroInner.style.opacity=cf;heroInner.style.transform=`translateY(${(1-cf)*20}px)`;}
  composer.render();
  if(!booted){booted=true;document.getElementById('boot').classList.add('gone');}
}
addEventListener('resize',()=>{camera.aspect=W()/H();camera.updateProjectionMatrix();
  renderer.setSize(W(),H());composer.setSize(W(),H());bloom.setSize(W(),H());if(group)fit();});

try{font=new FontLoader().parse(ANTON);build();buildTimeline();
  if(REDUCED){letters.forEach(m=>{m.userData.revealAt=-999;m.userData.expAt=-999;});
    T.TYPE_GROW=.001;T.EXP_DUR=.001;T.MARK=[-999,-999];T.CAP_START=-999;T.EXP_START=-999;
    heroInner.style.opacity=1;heroInner.style.transform='none';}
  frame();
}catch(err){document.getElementById('boot').innerHTML='<div style="color:#9c9180;font:13px Inter">Init failed: '+err.message+'</div>';}
/* intro -> hero gate */
window.__startHero=function(){try{if(clock&&!clock.running)clock.start();}catch(_){}};
if(typeof REDUCED!=='undefined'&&REDUCED)window.__startHero();
else if(!window.__introPending)window.__startHero();

/* ---- scroll reveal ---- */
/* ---- creators (edit subs / url / drop pfp in assets/creators/<slug>.webp) ---- */
/* ---- creators: LIVE subs via /api/subs (YouTube), embedded fallback ---- */
const FALLBACK_CREATORS=[
  {name:'ZND',                  subs:'10.5M', url:'https://www.youtube.com/@zndshort'},
  {name:'the same Wednesday',   subs:'10.3M', url:'https://www.youtube.com/@fake_ortega'},
  {name:'Cheesymembey',         subs:'6.91M', url:'https://www.youtube.com/@cheesymembey'},
  {name:'RealBacon',            subs:'4.89M', url:'https://www.youtube.com/@realbaccon'},
  {name:'DonFuria',             subs:'4.75M', url:'https://www.youtube.com/@donfuria'},
  {name:'SkyFly Facts',         subs:'4.72M', url:'https://www.youtube.com/@skyflyfacts'},
  {name:'Plaza',                subs:'3.88M', url:'https://www.youtube.com/@plazamc'},
  {name:'Tiger Now',            subs:'3.21M', url:'https://www.youtube.com/@tigernows'},
  {name:'Explorer Elizabeth',   subs:'1.69M', url:'https://www.youtube.com/@elizabethroblox'},
  {name:'RichGardner',          subs:'1.01M', url:'https://www.youtube.com/@torichblox'},
  {name:'Aixory',               subs:'727K',  url:'https://www.youtube.com/@aixoryistaken'},
  {name:'DonFuria Minecraft 1', subs:'622K',  url:'https://www.youtube.com/@donfuriaminecraft1'},
  {name:'Crewzi',               subs:'541K',  url:'https://www.youtube.com/@crewzi'},
  {name:'ChickenMan',           subs:'372K',  url:'https://www.youtube.com/@chickenmanrblx'},
  {name:'BabyBacon',            subs:'259K',  url:'https://www.youtube.com/@babybaconyt'},
  {name:'Jairai',               subs:'113K',  url:'https://www.youtube.com/@jairaiyt'},
  {name:'Xory Studios',         subs:'38.5K', url:'https://www.youtube.com/@xorystudios'},
  {name:'Stanky Boi',           subs:'18.1K', url:'https://www.youtube.com/@stankyboikins'},
];
const initials=n=>{const w=n.trim().split(/\s+/);return (w.length>1?w[0][0]+w[1][0]:n.slice(0,2)).toUpperCase();};
const slug=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
const parseSubs=s=>{const m=String(s||'').replace(/,/g,'').match(/([\d.]+)\s*([KMB]?)/i);if(!m)return 0;return parseFloat(m[1])*({'':1,k:1e3,m:1e6,b:1e9}[(m[2]||'').toLowerCase()]);};
const grid=document.getElementById('creatorGrid');
const mq=document.getElementById('marquee');
function renderCreators(list){
  if(grid){
    grid.innerHTML='';
    list.forEach(c=>{
      const a=document.createElement('a');
      a.className='creator'; a.href=c.url||'#';
      if(c.url&&c.url!=='#'){a.target='_blank';a.rel='noopener';}
      const label=(!c.subs||c.subs==='\u2014')?'YouTube':c.subs+' subs';
      const img=c.avatar?c.avatar:('assets/creators/'+slug(c.name)+'.webp');
      a.innerHTML='<div class="avatar">'+initials(c.name)+'<img src="'+img+'" alt="'+c.name+'" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"></div>'+
        '<div class="cname">'+c.name+'</div><div class="csub"><span class="yt">&#9658;</span>'+label+'</div>';
      grid.appendChild(a);
    });
    const more=document.createElement('a');
    more.className='creator more-tile'; more.href='https://discord.gg/PEcAFY3EZF'; more.target='_blank'; more.rel='noopener';
    more.innerHTML='+ many<br>more';
    grid.appendChild(more);
  }
  if(mq){const names=list.map(c=>c.name).concat(list.map(c=>c.name));
    mq.innerHTML=names.map(n=>'<span>'+n+' &#9670;</span>').join('');}
}
renderCreators(FALLBACK_CREATORS);
fetch('/api/subs').then(r=>r.ok?r.json():Promise.reject()).then(d=>{const list=Array.isArray(d)?d:[];
  if(list.length){list.sort((a,b)=>parseSubs(b.subs)-parseSubs(a.subs));renderCreators(list);}
}).catch(()=>{});

const io=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.18});
document.querySelectorAll('[data-reveal]').forEach(el=>io.observe(el));

/* ---- count-up stats ---- */
function countUp(el){const target=+el.dataset.count,suf=el.dataset.suffix||'';const dur=1400,t0=performance.now();
  (function step(now){const p=clamp((now-t0)/dur),e=1-Math.pow(1-p,3);el.textContent=Math.round(target*e)+suf;if(p<1)requestAnimationFrame(step);})(t0);}
const sio=new IntersectionObserver((es)=>{es.forEach(e=>{if(e.isIntersecting){countUp(e.target);sio.unobserve(e.target);}});},{threshold:.5});
document.querySelectorAll('[data-count]').forEach(el=>sio.observe(el));

/* ---- music: loops assets/music.mp3 (Brooklyn Bloodpop). Autostarts on first tap/click. ---- */
const audio=new Audio('assets/music.mp3');
audio.preload='auto'; audio.loop=true; audio.volume=0.5;
let playing=false;
const mbtn=document.getElementById('music');
function _setBtn(){ if(mbtn) mbtn.style.color=playing?'#fff':''; }
function _play(){ audio.play().then(()=>{playing=true;_setBtn();}).catch(()=>{}); }
function _pause(){ audio.pause(); playing=false; _setBtn(); }
window.__playMusic=_play;
audio.play().then(()=>{playing=true;_setBtn();}).catch(()=>{});
let _unlocked=false;
function _unlock(){ if(_unlocked) return; _unlocked=true; if(!playing) _play(); }
['pointerdown','touchstart','keydown'].forEach(ev=>addEventListener(ev,_unlock,{once:true,passive:true}));
if(mbtn) mbtn.addEventListener('click',()=>{ _unlocked=true; if(playing) _pause(); else _play(); });
