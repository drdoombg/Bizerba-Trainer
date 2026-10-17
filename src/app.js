(function(){
"use strict";
/* ============================================================ utilities */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const clone=o=>JSON.parse(JSON.stringify(o));
const f3=n=>Number(n).toFixed(3),f2=n=>Number(n).toFixed(2),f4=n=>Number(n).toFixed(4);
const pad6=n=>String(n).padStart(6,"0");
const fmtD=d=>String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+Number(n||0));return x};
function gauss(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("on"),3000)}
const reduced=()=>{try{return window.matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){return true}};
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
function tne(g){if(g<=50)return g*.09;if(g<=100)return 4.5;if(g<=200)return g*.045;if(g<=300)return 9;if(g<=500)return g*.03;if(g<=1000)return 15;if(g<=10000)return g*.015;return 150}
function ean13check(d12){let s=0;for(let i=0;i<12;i++)s+=Number(d12[i])*(i%2?3:1);return String((10-s%10)%10)}
/* GS1 price verifier digit for a 4-digit price (weights 2-,2-,3,5-) */
function priceCheck4(p){const w2m=[0,2,4,6,8,9,1,3,5,7],w3=[0,3,6,9,2,5,8,1,4,7],w5m=[0,5,1,6,2,7,3,8,4,9];const d=p.split("").map(Number);return String((w2m[d[0]]+w2m[d[1]]+w3[d[2]]+w5m[d[3]])*3%10)}
const EL=["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"],EG=["0100111","0110011","0011011","0100001","0011101","0111001","0000101","0010001","0001001","0010111"],ER=["1110010","1100110","1101100","1000010","1011100","1001110","1010000","1000100","1001000","1110100"],EP=["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG","LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"];
function eanSvg(c,w){if(!/^\d{13}$/.test(c))return`<div style="font-family:monospace;font-size:8px">${esc(c)}</div>`;let b="101",p=EP[c[0]];for(let i=1;i<7;i++)b+=(p[i-1]==="L"?EL:EG)[c[i]];b+="01010";for(let i=7;i<13;i++)b+=ER[c[i]];b+="101";let r="";
 for(let i=0;i<b.length;i++)if(b[i]==="1"){const g=i<3||(i>=45&&i<50)||i>=92;r+=`<rect x="${9+i}" y="0" width="1" height="${g?44:38}" fill="#000"/>`}
 return`<svg viewBox="0 0 113 54" width="${w}" height="${w*.48}" aria-hidden="true">${r}<text x="1" y="52" font-size="8" font-family="monospace" fill="#000">${c[0]}</text><text x="14" y="52" font-size="8" font-family="monospace" fill="#000" letter-spacing="1.55">${c.slice(1,7)}</text><text x="60" y="52" font-size="8" font-family="monospace" fill="#000" letter-spacing="1.55">${c.slice(7)}</text></svg>`}

/* ============================================================ site configuration */
const LVN={0:"Standby",1:"Check settings",2:"Article change",3:"Create and maintain article",4:"Service / Configuration",5:"BIZERBA",9:"Customer spec. operat. level"};
/* manual mode levels (1 std op, 2 extended, 3 local data, 4 global data, 5 service) mapped to the site's level names */
const MAP_LV={"1":1,"2":2,"3":3,"4":3,"5":4,"T":9};
const siteLv=l=>l==null?2:(MAP_LV[String(l)]??2);
const LINES={
 "FP2-L03":{tab:"FP2 · Line 3",model:"GLM-I 40",dev:[{bus:2,name:"FP2-L03-Master"}],heads:[{id:"LC 1",name:"Labeller 1 (top)",ch:"internal",conv:"LC 1"},{id:"LC 2",name:"Labeller 2 (top)",ch:"A",conv:"LC 2"}],
  chan:{internal:"always active",A:"always active"},sendE:"Labeller 2 data (assumed)",note:"Screens photographed on this line.",photo:true},
 "FP2-L04":{tab:"FP2 · Line 4",model:"GLM-I 40",dev:[{bus:2,name:"FP2-L04-Master"}],heads:[{id:"LC 1",name:"Labeller 1 (top)",ch:"internal",conv:"LC 1"},{id:"LC 2",name:"Labeller 2 (top)",ch:"A",conv:"LC 2"}],
  chan:{internal:"always active",A:"always active"},sendE:"Labeller 2 data (assumed)",note:"Same machine type and software as Line 3. Device name assumed."},
 "FP1-L03":{tab:"FP1 · Line 3",model:"GLM-I 70",dev:[{bus:1,name:"FP1-L03-Master"},{bus:2,name:"FP1-L03-Slave"}],heads:[{id:"M",name:"Master head",ch:"internal",conv:"LC 1"},{id:"S",name:"Slave head",ch:"A",conv:"LC 1"}],
  online:false,chan:{internal:"Pair1 (start) change on paper end",A:"Pair1 (Standby) Change on paper end"},sendE:"Slave head (assumed)",note:"Master and slave heads. Pairing on paper end is the manual's example (p. 285); confirm your line's setting."},
 "FP1-CW":{tab:"FP1 · C-Wrap",model:"GLM-I with C-Wrap applicator",dev:[{bus:1,name:"FP1-CWrap-Master"}],heads:[{id:"T",name:"Top labeller",ch:"internal",conv:"LC 1"},{id:"CW",name:"C-Wrap applicator",ch:"A",conv:"LC 2",wrap:true}],
  chan:{internal:"always active",A:"always active"},sendE:"External data (assumed)",note:"Station layout taken from Bizerba's product picture. Line number not given."}
};
const CHAN_OPTS=["always active","not active","active when special price","not active when special price","Pair1 (start) change on paper end","Pair1 (Standby) Change on paper end","Pair1 (start) alternated after each package","Pair1 (Standby) alternat. after each package","Pair2 (start) change on paper end","Pair2 (Standby) Change on paper end"];
const CHANS=["internal","A","B","C","D","E","F","G"];

/* ============================================================ price list (PLU data)
   No real price list ships in this file. DEMO_PRODUCTS is a small fictional sample.
   Your own price list is loaded from the Price list tab and kept in this browser's
   localStorage only, so it is never part of the page or of anything you share. */
const PLU_KEY="glmi-plu-v1",SITE_KEY="glmi-site-v1";
const DEF_SITE={name:"",macroLabel:"CUST PLU ONLY",macroFilter:""};
let SITE=Object.assign({},DEF_SITE,store.get(SITE_KEY,{})||{});
let PLU_SRC=store.get(PLU_KEY,null);
if(!(PLU_SRC&&Array.isArray(PLU_SRC.rows)&&PLU_SRC.rows.length))PLU_SRC=null;
let PRODUCTS=PLU_SRC?PLU_SRC.rows:DEMO_PRODUCTS;
const usingDemo=()=>!PLU_SRC;
const BIRD=/\b(WB|WHOLE|Whole|wholebird|Wholebird|Spatchcock|Spatchcook|CIB|Rotisserie|Bird|BIRD|Joint)\b/;
/* the level 9 "<customer> PLU ONLY" macro: label and filter are set in Settings */
function macroLabel(){return (SITE.macroLabel||"").trim()||DEF_SITE.macroLabel}
function custMatch(p){const f=(SITE.macroFilter||"").trim().toLowerCase();if(!f)return true;
 return ((p.text||"")+" "+(p.cust||"")).toLowerCase().includes(f)}
/* which PLU a line boots on: a whole-bird article on FP1, otherwise the first in the list */
function defaultPlu(key){if(!PRODUCTS.length)return 0;
 const bird=PRODUCTS.find(r=>BIRD.test(r.name));
 return ((key.startsWith("FP1")&&bird)||PRODUCTS[0]).plu}
function parseProduct(r){
 const name=r.name;const tare=parseFloat(String(r.tare).replace(/[^\d.]/g,""))||0;
 let lo=null,hi=null,nom=null;
 const rg=name.match(/(\d+(?:\.\d+)?)\s*(kg|g)?\s*-\s*(\d+(?:\.\d+)?)\s*(kg|g)/i);
 if(rg){const u=rg[4].toLowerCase()==="kg"?1000:1;lo=parseFloat(rg[1])*u;hi=parseFloat(rg[3])*u}
 const all=[...name.matchAll(/(\d+(?:\.\d+)?)\s*(kg|g)\b/gi)];if(all.length){const m=all[all.length-1];nom=parseFloat(m[1])*(m[2].toLowerCase()==="kg"?1000:1)}
 const bird=BIRD.test(name);
 let mode="Weight",unit=0,fixp=0,fixw=0,minw=0,maxw=0,mean,sd;
 const ppkg=parseFloat(r.ppkg);
 if(String(r.price).toUpperCase()==="C/W"){unit=isNaN(ppkg)?0:ppkg}
 if(rg){minw=lo;maxw=hi;mean=(lo+hi)/2;sd=(hi-lo)/5}
 else if(nom&&bird){minw=nom;maxw=Math.round(nom*1.35);mean=nom*1.08;sd=nom*.03}
 else if(nom){mode="Fixed weight";fixw=nom;minw=Math.round(nom-tne(nom));maxw=Math.round(nom*1.2);mean=nom+tne(nom)*.7;sd=tne(nom)*.45}
 else{mean=1000;sd=50}
 const bc=String(r.barcode||"").replace(/\s+/g," ").trim();let code=null;
 if(/^\d{13}$/.test(bc))code={type:"GTIN",v:bc};
 else if(/^2\d{6}P/.test(bc))code={type:"Price embedded",v:bc.slice(0,7)};
 else if(/^2\d{6}0{5}\d$/.test(bc))code={type:"Price embedded",v:bc.slice(0,7)};
 else if(/^[A-Z] ?\d{4,} ?[A-Z]$/i.test(bc))code={type:"Customer code",v:bc};
 const num=v=>{const n=parseInt(String(v||"").replace(/[^\d]/g,""),10);return isNaN(n)?0:n};
 return{plu:r.plu,text:name,cust:r.cust||"",sect:r.sect||"",mode,unit,fixp,fixw,tare,minw,maxw,life1:8,life2:8,d1:"Packed on",d2:"Use by",d3:"Without",
  lab:bird?3:4,aut:bird?1:2,wc:r.plu,txt1:bird?22:31,code,pre1:num(r.case),eob:num(r.eob),pz:r.pz||0,fops:num(r.fops),basket:r.basket||"",outer:r.outer||"",nav:r.nav||"",pcode:r.pcode||"",
  barcode:bc,tray:r.tray||"",info:r.info||"",flash:r.flash||"",acode:r.acode||"",mean:mean||1000,sd:sd||40,pack:bird?"bird":"tray",grp:0,pcs:1,chan:{}}}
function mkCol(up,ltype){return{up,ltype,weight:0,txt1:-1,life1:0,totaliz:"with",noprint:false,pre:{type:"Weight",val:0},glob:true}}
function mkWC(name,lt,lo,hi){return{name,stype:lt==="Fixed weight"?"FPV Europe":"Weight determination",factor:3,lower:lo,upper:hi,stops:0,cols:[mkCol(lo,"No labeling"),mkCol(hi,lt),mkCol(null,"No labeling")]}}
function wcColIx(W,g){const c=W.cols;for(let i=0;i<c.length;i++){if(c[i].up==null||g<c[i].up)return i}return c.length-1}
function wcHead(W,i){const c=W.cols;return c[i].up==null?`Great.than ${c[i-1]?c[i-1].up:W.lower}g`:`to ${c[i].up}g`}
function freshDB(){
 const db={plu:{},label:{
   3:{name:"58 x 40 date label",size:"58 x 40",type:"Standard",speed:150,vpos:432,hpos:50,feed:20,rev:"W/o",sales:"without",lbf:2,lbb:2},
   4:{name:"80 x 80 retail label",size:"80 x 80",type:"Standard",speed:150,vpos:300,hpos:40,feed:16,rev:"W/o",sales:"with",lbf:2,lbb:2}},
  auto:{1:{name:"Whole bird bags",ref:"Pckg. edge front side",dist:160,speed:35,conv:40,sepf:1.2,lb1:360,lb23:0,pkh:110,pkw:260,len:380},
        2:{name:"Retail trays",ref:"Pckg. edge front side",dist:120,speed:40,conv:45,sepf:1.2,lb1:150,lb23:0,pkh:55,pkw:190,len:240}},
  wc:{},
  text:{1:"Keep refrigerated below 5°C.",2:"Produced in the UK.",21:"Cook from chilled: 190°C, Fan 170°C, Gas 5 for 1 hr 15 mins.",22:"Cook from chilled: 190°C, Fan 170°C, Gas 5 for 1 hr 25 mins.",23:"Cook from chilled: 190°C, Fan 170°C, Gas 5 for 1 hr 35 mins.",24:"Cook from chilled: 190°C, Fan 170°C, Gas 5 for 1 hr 45 mins.",31:"Cook from chilled: 200°C, Fan 180°C, Gas 6 for 20-25 mins."}};
 PRODUCTS.forEach(r=>{if(db.plu[r.plu])return;const p=parseProduct(r);db.plu[r.plu]=p;db.wc[r.plu]=mkWC("WC "+r.plu,p.mode==="Fixed weight"?"Fixed weight":"Weight",p.minw,p.maxw)});
 return db}

/* ============================================================ menu tree from the manual */
function cleanTok(t){return t.replace(/&statistic\.$/,"&statistics").replace(/\s+/g," ").replace(/\/ /g,"/").replace(/\b(out|sub|Pre|pre|re|Spe)- (\w)/g,"$1$2").replace(/(\w)- (\w)/g,"$1-$2").trim()}
function buildTree(){
 const root={label:"Main menu",ch:[],secs:[],ranges:[]};
 const SKIP=new Set(["Main menu","Etc","ETC"]);
 MAN.forEach((sec,si)=>{
  const pls=sec.paths.map(p=>siteLv(p.level??sec.levels[0]));
  sec.paths.forEach((p,pi)=>{
   const toks=p.path.map(cleanTok).filter(t=>!SKIP.has(t));if(!toks.length)return;
   const L=pls[pi];const higher=pls.filter(x=>x>L);const maxShow=higher.length?Math.min(...higher)-1:99;
   let n=root;toks.forEach((t,i)=>{let c=n.ch.find(x=>x.label===t);if(!c){c={label:t,ch:[],secs:[],ranges:[]};n.ch.push(c)}c.ranges.push([L,maxShow]);if(i===toks.length-1&&!c.secs.includes(si))c.secs.push(si);n=c});
  })});
 return root}
const TREE=buildTree();
function findNode(path){let n=TREE;for(const t of path){n=n.ch.find(x=>x.label===t);if(!n)return null}return n}
function inject(path,label,lv,secNum,before){const par=findNode(path);if(!par)return;if(par.ch.some(c=>c.label===label))return;const si=MAN.findIndex(s=>s.num===secNum);const node={label,ch:[],secs:si>=0?[si]:[],ranges:[[lv,99]]};
 if(before){const i=par.ch.findIndex(c=>c.label===before);par.ch.splice(i<0?par.ch.length:i,0,node)}else par.ch.push(node)}
/* softkeys the manual shows inside one function screen */
["Hor. print position","Vert. print position","Saturation DT","Saturation TTF"].forEach((l,i)=>inject(["Labels","Printer menu"],l,1,i<2?"29.3.2":"29.4.2"));
["Presel.type total 1","Presel.type total 2"].forEach(l=>inject(["Processing","Presel. total"],l,2,"22.2.1","Presel.type total 3"));
["Presel. piece *1","Presel. piece *2"].forEach(l=>inject(["Processing","Presel. total"],l,2,"22.2.2","Presel. piece *3"));
["Total 2","Total 3","Article total"].forEach(l=>inject(["Release total"],l,2,"22.8"));
["Send channel A","Send channel B","Send channel C","Send channel D","Send channel E","Internal printing"].forEach(l=>inject(["Printer + interface","Send chan. active?"],l,2,"30.10"));
["Stop after errors","Stop after send error"].forEach(l=>inject(["Device menu","Error handling","Acc. to frequency"],l,1,"25.3.2"));
inject(["Device menu"],"Position trigger 2",1,"20.3.1");
inject(["Processing","Cancel. & minus"],"Cancel via cons. no.",2,"24.9.1","Minus");
function nodeVisible(n,L){return n.ranges.some(([a,b])=>L>=a&&L<=b)}
function treeAt(path){let n=TREE;for(const t of path){const c=n.ch.find(x=>x.label===t);if(!c)break;n=c}return n}

/* ============================================================ state (one per line) */
const DEF_SET={feed:20,dist:160,ref:"Pckg. edge front side",mode:"Direct",trig2:1300,lb1:360,lb23:0,vpos:432,hpos:50,speed:35,conv:40,sepf:1.2,pspeed:150,satDT:0,satTTF:0,retract:"W/o",tearoff:"LE",
 pe:"PE:On error and Min/Max",release:"Start autom. labeler",sendCur:"40 mA",totaliz:"With summing up",num1:"With *1 numerator",opmode:"Weighing Continuous",lcmode:"LC 1 contin. LC 2 contin.",onErr:"Stop",errN:3,errSend:3,
 presel:{1:{type:"None",val:0},2:{type:"Number of total 1",val:0},3:{type:"None",val:0}},send:{A:true,B:true,C:true,D:true,E:true,int:true},labcopies:1,labseq:1,wcCols:3,operator:"07",batch:"",printOp:"no"};
const SEED=[[14885273,2.2597],[14885272,2.3131],[14885271,2.2558],[14885270,2.1942],[14885269,2.2584],[14885268,2.3134],[14885267,2.3137],[14885266,2.3137],[14885265,2.3155],[14885264,2.3147],[14885263,2.3140],[14885262,2.2195],[14885261,2.2803],[14885260,2.3144],[14885259,2.2557],[14885258,2.3137],[14885257,2.1939],[14885256,2.3481],[14885255,2.2201],[14885254,2.3503],[14885253,2.3556],[14885252,2.3593],[14885251,2.2509],[14885250,2.2886],[14885249,2.2192],[14885248,2.2736],[14885247,2.3218],[14885246,2.2938],[14885245,2.2930],[14885244,2.2657],[14885243,2.4272],[14885242,2.3778],[14885241,2.3871],[14885240,2.2223],[14885239,2.2019],[14885238,2.2643],[14885237,2.2201],[14885236,2.2313],[14885235,2.3732],[14885234,2.3664],[14885233,2.2838],[14885232,2.3157],[14885231,2.3236],[14885230,2.2701],[14885229,2.2380],[14885228,2.3983],[14885227,2.2897],[14885226,2.3800]];
function freshState(key){const L=LINES[key];const photo=!!L.photo;
 const heads={};L.heads.forEach((h,i)=>{heads[h.id]={roll:{left:i===1&&key==="FP1-L03"?900:1200,cap:1200},head:false,door:false,pivot:false,rollers:false,ribbon:false,height:L.heads.length&&key.startsWith("FP2")?140:90,chan:L.chan[h.ch]||"always active",vac:true,printing:true,steps:[]}});
 return{key,level:9,path:[],page:0,plu:defaultPlu(key),bootPlu:defaultPlu(key),product:null,dev:0,
  set:clone(DEF_SET),heads,running:false,power:true,boot:0,estop:false,air:true,airBar:6.0,lbDirty:false,beltDirty:false,
  tot:{1:{n:photo?105689:0,kg:photo?169934.033:0,val:0},2:{n:photo?2:0,kg:photo?65505.369:0,val:0},3:{n:0,kg:0,val:0},A:{n:0,kg:0,val:0}},
  cons:photo?14885273:Math.floor(14000000+Math.random()*900000),list:photo?SEED.map(x=>({c:x[0],w:x[1],neg:false,rej:false})):[],d:{1:null,2:null,3:null},life:{1:null,2:null},
  tareOv:null,drift:0,msgs:[],msgView:null,dlg:null,editor:null,softHidden:false,quick:false,quickTab:"",last:null,lastTotal:null,lastPacks:[],log:[],seq:0,rejRun:0,errRun:0,dbl:0,cancelBlock:0,
  disp:{net:null,cls:null},gen:{},cur:{IC:0,SC:0,WC:.1,"LC 1":.1,"LC 2":.4},unlocked:{},altFlip:false,
  sc:null,scDrill:null,good:0,biasLow:0,ev:{},guideW:null,mod:{shift:false,alt:false,second:false},twoLine:false,rec:null,playing:null,macros:[],macroDelay:150,awaitAssign:false,awaitPlay:false,l9extra:[],matrix:null,wcTot:{},pluTot:{}}}
let DB=freshDB();const REF=clone(DB);const DBS={};
const ST={};let S;
function useLine(k){if(S&&S.running)stop("Line switched");if(!DBS[k])DBS[k]=Object.keys(DBS).length?freshDB():DB;DB=DBS[k];if(!ST[k]){ST[k]=freshState(k);S=ST[k];loadJob(true)}S=ST[k];store.set("line",k);renderLines();render();renderHW();renderDrills()}
const P=()=>DB.plu[S.plu];
const LT=()=>DB.label[P()?.lab]||null;
const AT=()=>DB.auto[P()?.aut]||null;
const WC=()=>{const p=P();if(S&&S.wcJob)return S.wcJob;return p&&p.wc!==-1?DB.wc[p.wc]:null};
const wcCol=w=>{const W=WC();if(!W||!W.cols)return null;const i=wcColIx(W,w*1000);return{i,c:W.cols[i]}};
function textFor(w){const p=P(),wc=wcCol(w);if(wc&&wc.c.txt1>0&&DB.text[wc.c.txt1]!=null)return{t:DB.text[wc.c.txt1],src:"wc",n:wc.c.txt1,cls:wc.i+1};
 if(S.jobText&&S.jobText[1]!=null)return{t:S.jobText[1],src:"job"};if(p&&p.txt1>0&&DB.text[p.txt1]!=null)return{t:DB.text[p.txt1],src:"plu",n:p.txt1};return{t:"",src:"none"}}
const shortT=t=>{const m=String(t||"").match(/(\d+\s*hrs?\s*\d*\s*(mins)?|\d+-?\d*\s*mins)/i);return m?m[0]:String(t||"–").slice(0,18)};
const LINE=()=>LINES[S.key];
function log(t){S.log.unshift(new Date().toTimeString().slice(0,8)+"  "+t);if(S.log.length>200)S.log.length=200}
const d1=()=>S.d[1]||new Date();
const life=n=>S.life[n]!=null?S.life[n]:(P()?P()["life"+n]:0);
const d2=()=>S.d[2]||addDays(d1(),life(1));
const d3=()=>S.d[3]||addDays(d1(),life(2));
/* PLU call-up loads label and labeler tables into the job (manual pp. 394-396) */
function loadJob(init){const L=LT(),A=AT(),p=P();if(!p)return;
 if(L){S.set.vpos=L.vpos;S.set.hpos=L.hpos;S.set.feed=L.feed;S.set.pspeed=L.speed;S.set.retract=L.rev}
 if(A){S.set.dist=A.dist;S.set.ref=A.ref;S.set.speed=A.speed;S.set.conv=A.conv;S.set.sepf=A.sepf;S.set.lb1=A.lb1;S.set.lb23=A.lb23}
 S.tareOv=null;S.life={1:null,2:null};S.jobText={};S.wcJob=null;
 if(A&&!init){LINE().heads.forEach(h=>{S.heads[h.id].height=A.pkh+25})}else if(A){LINE().heads.forEach(h=>{S.heads[h.id].height=A.pkh+25})}
 Object.entries(p.chan||{}).forEach(([c,v])=>{const h=LINE().heads.find(x=>x.ch===c);if(h)S.heads[h.id].chan=v});}
function geo(){const p=P();const A=REF.auto[p.aut]||REF.auto[1],L=REF.label[p.lab]||REF.label[3];return{dist:A.dist,vpos:L.vpos,hpos:L.hpos,feed:L.feed,len:A.len,pkh:A.pkh,pitch:A.len/1000+.22}}

/* ============================================================ passwords (stored only in this browser) */
function pwFor(level){const sp=store.get("sitepw",null);
 if(sp&&sp.lower&&Number(sp.lowerLv)===level)return sp.lower;
 if(sp&&sp.higher&&(sp.higherLv||"3,4").split(",").map(Number).includes(level))return sp.higher;
 return({2:"2222",3:"3333",4:"4444"})[level]||null}
function macroPw(){const sp=store.get("sitepw",null);return sp&&sp.lower?sp.lower:"2222"}

/* ============================================================ messages (manual ch. 25) */
const MSG={
 head:{t:"Print head lifted up",lock:true,cause:"The print head is open.",fix:"Close the print head (Hardware tab › labeller).",ok:()=>!activeHeads().some(h=>S.heads[h.id].head)},
 paper:{t:"Paper supply?",lock:false,cause:"The label roll will run out soon.",fix:"Have a new label roll ready.",ok:()=>true},
 empty:{t:"Label roll empty",lock:true,cause:"The label roll is empty or the backing paper is inserted incorrectly.",fix:"Insert a new label roll (Hardware tab) or re-insert the backing paper correctly.",ok:()=>!activeHeads().some(h=>S.heads[h.id].roll.left<=0)},
 finished:{t:"Label roll finished ?",lock:false,cause:"Label roll of one head of a pair is empty; the paired head took over.",fix:"Insert a new roll in the empty head while the other one prints.",ok:()=>true},
 nolabel:{t:"No label",lock:true,cause:"No labels, or the spacing between labels on the backing paper is too large.",fix:"Check the label roll and replace it if necessary. Check Label feed.",ok:()=>S.set.feed-geo().feed>-12&&S.set.feed-geo().feed<40},
 air:{t:"No air pressure",lock:true,cause:"The required minimum air pressure is not present.",fix:"Check the compressed-air supply and hose connections.",ok:()=>S.air&&S.airBar>=4},
 vac:{t:"No vacuum",lock:true,cause:"The required vacuum is not achieved.",fix:"Check the vacuum pump and connections.",ok:()=>Object.values(S.heads).every(h=>h.vac)},
 slow:{t:"Label too slow. Automat stopped",lock:true,cause:"At labeling time the label had repeatedly not yet been printed.",fix:"Stop the automat before a PLU change, or reduce the belt speed and restart.",ok:()=>true},
 infeed:{t:"Repeats error on pckg. handling. Automat stopped",lock:true,cause:"Infeed or separation errors repeated: infeed rate too high, belt speed too low, or one package seen as several.",fix:"Check packages on the belts. Clear with <Clear> and remove the cause (LB1 susp. path, dirty light barrier, separation factor).",ok:()=>S.set.lb1>=100&&!S.lbDirty},
 long:{t:"Package too long",lock:true,cause:"Package longer than the configured maximum, or the light-barrier offset is too long so the next package is not recognised as new.",fix:"Eject the long package. Keep LB1 susp. path shorter than the package.",ok:()=>S.set.lb1<geo().len},
 underload:{t:"Process blocked: Scale underload",lock:true,cause:"Weight stayed below minimum for more than 5 s.",fix:"No action needed. The lock releases once the scale shows zero for 1 s.",ok:()=>Math.abs(S.drift)<.03},
 pluload:{t:"Process blocked: Error during loading of PLU data record",lock:true,cause:"The article data is incomplete.",fix:"Check the article data, add what's missing, then change the article. Only a successful article change clears this.",ok:()=>S.pluOK!==false},
 estop:{t:"Emergency stop pressed",lock:true,cause:"An emergency stop button is pressed in.",fix:"Find and release the E-stop (Hardware tab), check the line is safe, then acknowledge.",ok:()=>!S.estop,sim:true},
 stops:{t:"Automat stopped: packages with incorrect weight",lock:true,cause:"Successive wrong-weight packages reached the error count (Device menu / Error handling).",fix:"Check the article (right PLU?), the scale zero and the product. Then Enable and restart.",ok:()=>true,sim:true}
};
const openMsgs=()=>S.msgs.filter(m=>!m.c);
const locked=()=>openMsgs().some(m=>MSG[m.id].lock);
function push(id,x){if(openMsgs().some(m=>m.id===id))return;S.msgs.push({id,x:x||"",c:false,at:new Date().toTimeString().slice(0,8)});log("MSG "+MSG[id].t);if(MSG[id].lock&&S.running)stop("Automat stopped by message");S.msgView={i:openMsgs().length-1,m:"t"};render()}

/* ============================================================ production engine */
let timer=null;
function canRun(){if(!S.power||S.boot>0){toast("Device is not ready");return false}if(S.level===0){toast("Standby. Change authorization level first.");return false}
 if(locked()){S.msgView={i:0,m:"t"};render();toast("Processing locked. Clear the message first.");return false}return true}
function start(){if(S.running||!canRun())return;S.running=true;log("Start · automat running");render();schedule()}
function schedule(){clearTimeout(timer);if(!S.running)return;const dt=geo().pitch/(S.set.speed/60)*1000;timer=setTimeout(()=>{tick();schedule()},Math.max(320,dt))}
function stop(why){if(!S.running)return;S.running=false;clearTimeout(timer);log(why||"Stop");render()}
function activeHeads(){return LINE().heads.filter(h=>{const st=S.heads[h.id];return st.chan!=="not active"})}
function tick(){const p=P();if(!p){stop();return}
 if(S.estop){push("estop");return}
 if(!S.air||S.airBar<4){push("air");return}
 if(Object.values(S.heads).some(h=>!h.vac)){push("vac");return}
 if(S.set.opmode!=="Transport"){
  if(activeHeads().some(h=>S.heads[h.id].head)){push("head");return}
  if(S.set.feed-geo().feed<=-12||S.set.feed-geo().feed>=40){push("nolabel");return}}
 if(S.set.lb1>=geo().len){push("long");return}
 if(S.set.lb1<100||S.lbDirty){if(Math.random()<.6){S.dbl++;log(S.lbDirty?"Separation error: dirty light barrier LB1 missed a package edge":"Infeed error: one package seen as two (LB1 susp. path "+S.set.lb1+" mm)");if(S.dbl>=S.set.errN){S.dbl=0;if(S.set.onErr==="Conv."){S.set.opmode="Transport";log("Automat on error = Conv.: switched to transport operation");toast("Error count reached: device switched to transport")}else{push("infeed");return}}}}
 else S.dbl=0;
 pack(p)}
function pickHeads(){
 /* resolve print channel control: which heads print this package (manual 21.10) */
 const L=LINE(),res=[];
 L.heads.forEach(h=>{const st=S.heads[h.id],c=st.chan;
  if(c==="always active"||c==="not active when special price")res.push(h);
  else if(/^Pair(\d)/.test(c)){const pair=c.match(/^Pair(\d)/)[1];const mates=L.heads.filter(x=>(S.heads[x.id].chan||"").startsWith("Pair"+pair));
   const startH=mates.find(x=>/\(start\)/.test(S.heads[x.id].chan))||mates[0];const other=mates.find(x=>x!==startH);
   let active=S.heads[startH.id].pairActive||startH.id;
   if(/alternat/.test(c)){active=S.altFlip?(other||startH).id:startH.id}
   else{if(S.heads[active].roll.left<=0&&other){const nx=active===startH.id?other.id:startH.id;if(S.heads[nx].roll.left>0){S.heads[startH.id].pairActive=nx;active=nx;push("finished",`${L.heads.find(x=>x.id!==nx).name} empty; ${L.heads.find(x=>x.id===nx).name} took over`)}}}
   if(h.id===active&&!res.includes(h))res.push(h)}});
 S.altFlip=!S.altFlip;return res}
function pack(p){
 const W=WC(),G=geo(),prod=DB.plu[S.product||S.plu]||p;
 const tw=Math.max(.05,(prod.mean-S.biasLow)/1000+gauss()*prod.sd/1000);
 const tare=(S.tareOv??p.tare)/1000,trueTare=prod.tare/1000;
 const w=Math.round((tw+S.drift+(trueTare-tare))*10000)/10000; /* net reading: wrong tare biases net */
 S.seq++;S.cons++;
 let cls="OK",rej=false;
 const WCC=wcCol(w);
 if(W){const g=w*1000;if(g<W.lower){cls="Underweight";rej=true}else if(g>W.upper){cls="Overweight";rej=true}else if(WCC&&WCC.c.ltype==="No labeling"){cls=WCC.i===0?"Underweight":WCC.i===W.cols.length-1?"Overweight":"No labeling ("+wcHead(W,WCC.i)+")";rej=true}else if(W.cols.length>3||WCC&&WCC.i>0)cls="OK"}
 const transport=S.set.opmode==="Transport";
 const autoPrint=!transport&&(S.set.release==="Start autom. labeler"||S.set.release==="Automatic");
 const heads=autoPrint&&!rej&&!(WCC&&WCC.c.noprint)?pickHeads():[];
 let printed=[],l1="None",l1off=null;
 heads.forEach(h=>{const st=S.heads[h.id];if(st.roll.left<=0){push("empty");return}
  st.roll.left--;printed.push(h.id);if(st.roll.left===40)push("paper",h.name+": 40 labels left")});
 const mainHead=LINE().heads[0];
 if(printed.length){
  if(S.set.mode==="TTF"&&!Object.values(S.heads).some(h=>h.ribbon))l1="Blank";
  else{const dv=Math.abs(S.set.vpos-G.vpos+S.set.feed-G.feed),dh=Math.abs(S.set.hpos-G.hpos);l1=(dv>24||dh>24)?"Shifted":"OK"}
  l1off=(S.set.dist-G.dist)+(S.set.ref==="Pckg. edge front side"?0:S.set.ref==="Pckg. edge middle"?G.len/2-40:G.len-80);
  const ht=S.heads[mainHead.id].height,pk=G.pkh;if(ht<pk+3){l1="Jammed";}else if(ht>pk+60)l1off+=Math.round((ht-pk-60)*0.6);
 }
 const peMinMax=S.set.pe==="PE:Depend. on Min/Max"||S.set.pe==="PE:On error and Min/Max";
 const peErr=S.set.pe==="PE:Active on error"||S.set.pe==="PE:On error and Min/Max";
 let ej=false;if(S.set.pe==="PE:Static active")ej=true;else if(rej&&peMinMax)ej=true;else if(!rej&&!printed.length&&peErr&&!transport)ej=true;
 if(ej&&Math.abs(S.set.trig2-1300)>60){ej=false}
 let ok=true,note=[];const need=LINE().heads.filter(h=>S.heads[h.id].chan==="always active").length;
 if(rej&&!ej){ok=false;note.push("wrong-weight pack not ejected")}
 if(!rej&&ej){ok=false;note.push(printed.length?"good pack ejected":"unlabelled pack ejected")}
 if(!rej&&!ej){
  if(!printed.length){ok=false;note.push(transport?"transport mode: no label":"no label printed")}
  else{if(l1==="Jammed"){ok=false;note.push("labeller too low: pack hit the labeller")}
   else if(l1!=="OK"){ok=false;note.push(l1==="Blank"?"blank label":"print off position")}
   if(l1off!=null&&Math.abs(l1off)>15){ok=false;note.push(`label ${l1off>0?"behind":"ahead of"} target by ${Math.abs(l1off)} mm`+(Math.abs(l1off)>G.len/2-20?" (off the pack)":""))}
   if(printed.length<need){ok=false;note.push((need-printed.length)+" label(s) missing")}
   if(!S.set.send.E&&LINE().heads.length>1&&printed.length>1){}}}
 if(rej&&ej)note.push(cls+" ejected");
 if(Math.abs(S.set.trig2-1300)>60&&rej)note.push("ejector timing off (Position trigger 2)");
 let glob=true;
 if(!rej&&printed.length&&S.set.totaliz==="Weight class-related"&&WCC){S.wcTot=S.wcTot||{};const T=S.wcTot[WCC.i]=S.wcTot[WCC.i]||{n:0,kg:0,val:0};T.n++;T.kg+=w;glob=WCC.c.glob!==false;const pr=WCC.c.pre||{};if(pr.val>0&&((pr.type==="Weight"&&T.kg*1000>=pr.val)||(pr.type==="Pcs"&&T.n>=pr.val))){mxRelease("wc",WCC.i,"preselection")}}
 if(!rej&&printed.length&&(S.set.totaliz==="PLU-related"||S.set.totaliz==="PLU dynamic")){S.pluTot=S.pluTot||{};const T=S.pluTot[S.plu]=S.pluTot[S.plu]||{n:0,kg:0,val:0,pre:{type:"Pcs",val:P().pre1||0},glob:true};T.n++;T.kg+=w;glob=T.glob!==false;if(T.pre.val>0&&((T.pre.type==="Pcs"&&T.n>=T.pre.val)||(T.pre.type==="Weight"&&T.kg*1000>=T.pre.val)))mxRelease("plu",S.plu,"preselection")}
 if(glob&&!rej&&printed.length&&S.set.totaliz!=="Without summing up"){[1,2,3,"A"].forEach(n=>{S.tot[n].n++;S.tot[n].kg+=w;S.tot[n].val+=0});
  for(const n of [1,2,3])if(preselReached(n)){releaseTotal(n,"preselection")}}
 S.list.unshift({c:S.cons,w,neg:false,rej});if(S.list.length>250)S.list.length=250;
 S.disp.net=w;S.disp.cls=cls;
 if(rej||!ok)S.errRun++;else S.errRun=0;
 if(rej)S.rejRun++;else S.rejRun=0;
 if(W&&W.stops>0&&S.rejRun>=W.stops){S.rejRun=0;push("stops",`${W.stops} successive packages outside ${W.lower}–${W.upper} g`)}
 const price=p.mode==="Weight"?Math.round(w*p.unit*100)/100:p.mode==="Fixed weight"?Math.round(p.fixw/1000*p.unit*100)/100:p.fixp;
 const T1=textFor(w);if(printed.length&&ok){if(T1.src==="job"&&p.mode==="Fixed weight")S.ev.ctJob=(S.ev.ctJob||0)+1;if(T1.src==="plu"&&DB.text[p.txt1]!==REF.text[p.txt1])S.ev.ctDb=(S.ev.ctDb||0)+1;if(T1.src==="wc"){S.ev.ctWc=S.ev.ctWc||{};S.ev.ctWc[T1.n]=true}}
 const rec={t1:T1.t,t1src:T1.src,t1cls:T1.cls,c:S.cons,w,cls,l1,l1off,printed,ej,ok,note:note.join("; ")||"OK",plu:S.plu,d1:d1(),d2:WCC&&WCC.c.life1>0?addDays(d1(),WCC.c.life1):d2(),d3:d3(),wcIx:WCC?WCC.i:null,vpos:S.set.vpos,hpos:S.set.hpos,feed:S.set.feed,price,batch:S.set.batch||S.key.replace("-","")+"-"+fmtD(new Date()).replace(/\//g,""),op:S.set.operator};
 S.lastPacks.unshift(rec);if(S.lastPacks.length>8)S.lastPacks.length=8;
 if(printed.length)S.last=rec;
 if(ok)S.good++;else S.good=0;
 S.ev["packs_"+S.plu]=(S.ev["packs_"+S.plu]||0)+(ok?1:0);
 anim(rec);render();checkDrills()}
function preselReached(n){const P_=S.set.presel[n],t=S.tot[n];if(!P_||!P_.val||P_.type==="None")return false;
 if(P_.type==="Preselect pieces")return t.n>=P_.val;if(P_.type==="Preselect weight")return t.kg>=P_.val;if(P_.type==="Preselect price")return t.val>=P_.val;
 if(P_.type==="Number of total 1")return(t.c1||0)>=P_.val;if(P_.type==="Number of total 2")return(t.c2||0)>=P_.val;return false}
function mxRelease(kind,key,why){const T=kind==="wc"?(S.wcTot||{})[key]:(S.pluTot||{})[key];if(!T||!T.n){toast("Total is empty");return}
 const lab=kind==="wc"?wcHead(WC(),key):"PLU "+pad6(key);log(`Total 1 (${kind==="wc"?"weight class "+lab:lab}) printed and cleared (${why}): # ${T.n}, ${f3(T.kg)} kg`);
 S.lastTotal={n:"1 · "+lab,t:{...T},plu:S.plu,eob:P().eob,why,at:new Date(),basket:P().basket,case:P().pre1};S.ev.mxRelease=(S.ev.mxRelease||0)+1;
 T.n=0;T.kg=0;T.val=0;renderLog();checkDrills()}
function releaseTotal(n,why){const t=S.tot[n];if(!t.n){toast(`Total ${n} is empty`);return}
 const p=P();S.lastTotal={n,t:{...t},plu:S.plu,eob:p.eob,why,at:new Date(),basket:p.basket,case:p.pre1};
 log(`Total ${n} released (${why}): # ${t.n}, ${f3(t.kg)} kg`+(p.eob?` · End of Batch PLU ${p.eob}`:""));
 if(n===1){S.tot[2].c1=(S.tot[2].c1||0)+1;S.tot[3].c1=(S.tot[3].c1||0)+1;S.ev.t1=(S.ev.t1||0)+1;if(why==="preselection")S.ev.t1auto=(S.ev.t1auto||0)+1}
 if(n===2)S.tot[3].c2=(S.tot[3].c2||0)+1;
 S.tot[n]={n:0,kg:0,val:0,c1:0,c2:0};S.cancelBlock=S.cons;renderLog();checkDrills()}
function anim(r){const b=$("#belt");if(!b)return;const el=document.createElement("div");el.className="pk"+(P().pack==="tray"?" tray":"")+(r.cls!=="OK"?" rej":"");
 const wrap=LINE().heads.some(h=>h.wrap&&r.printed.includes(h.id));
 if(r.printed.length&&r.l1!=="Jammed"){const off=Math.max(-60,Math.min(100,(r.l1off||0)*0.25));el.innerHTML=`<div class="l1 ${r.l1==="Blank"?"blank":""} ${wrap?"wrap":""}" style="left:${34+off}px"></div>`}
 if(r.printed.length>1&&!wrap)el.innerHTML+='<div class="l2"></div>';
 b.appendChild(el);const w=b.clientWidth,red=reduced();el.style.transition=red?"none":"left 1.5s linear, top .3s";
 requestAnimationFrame(()=>{el.style.left=(w*.80)+"px";setTimeout(()=>{if(r.ej)el.style.top="104px";el.style.left=(w+20)+"px"},red?30:1500);setTimeout(()=>el.remove(),red?200:2900)})}

/* ============================================================ dialogs */
function num(title,unit,cur,ok,extra){S.dlg={k:"num",title,unit:unit||"",val:String(cur??""),fresh:true,ok,extra:extra||[]};render()}
function sel(title,opts,cur,ok){S.dlg={k:"sel",title,opts,ix:Math.max(0,opts.indexOf(cur)),ok};render()}
function conf(title,text,yes,no){S.dlg={k:"conf",title,text,yes,no};render()}
function info(title,html){S.dlg={k:"info",title,html};render()}
function textIn(title,cur,ok){S.dlg={k:"pw",title,val:String(cur??""),mask:false,ok,shift:true};render()}
function pw(ok,title){S.dlg={k:"pw",title:title||"Enter password",val:"",mask:true,ok,shift:false};render()}
function protect(fn){if(S.unlocked.macro){fn();return}pw(v=>{if(v===macroPw()){S.unlocked.macro=true;fn()}else toast("Wrong password")})}
function authDlg(){const opts=[0,1,2,3,4,5,9];S.dlg={k:"auth",ix:Math.max(0,opts.indexOf(S.level)),opts};render()}
function setLevel(l){
 const go=()=>{S.level=l;S.path=[];S.page=0;S.editor=null;S.quick=false;S.unlocked={};log(`Authorization level ${l}: ${LVN[l]}`);toast(`Authorization level ${l}`);S.ev["lv"+l]=true;if(l===9&&S.ev.lv3)S.ev.back9=true;render();checkDrills()};
 if(l===5){pw(()=>info("Authorization level 5","Level 5 BIZERBA is reserved for Bizerba service engineers. Site staff don't get this password."));return}
 if(S.level===0&&l!==0&&!pwFor(l)){num("From standby: enter 183","","",v=>{if(v==="183")go();else toast("Wrong entry")});return}
 const need=pwFor(l);if(need&&l!==S.level&&!(l<S.level&&S.level!==9)){pw(v=>{if(v===need)go();else toast("Wrong password")});return}
 go()}

/* ============================================================ functions behind softkeys */
function setN(k,v,lo,hi,name){const n=Number(v);if(v===""||isNaN(n)){toast("Enter a number");return false}if(n<lo||n>hi){toast(`Allowed range ${lo} … ${hi}`);return false}S.set[k]=n;log(`${name} = ${n}`);return true}
function askPLU(){if(S.running){toast("Stop the automat before a PLU change");return}num("PLU","",pad6(S.plu),v=>callPLU(Number(v)),[{label:"Article text",fn:()=>pluList(()=>true)}])}
function pluList(filter){if(S.running){toast("Stop the automat before a PLU change");return}const ks=Object.keys(DB.plu).filter(k=>filter(DB.plu[k])).sort((a,b)=>DB.plu[a].text.localeCompare(DB.plu[b].text));if(!ks.length){toast("No matching articles");return}
 sel("Select article",ks.map(k=>pad6(k)+"  "+DB.plu[k].text),"",v=>callPLU(Number(v.slice(0,6))))}
function validatePLU(p){const e=[];if(!p.text)e.push("Article text is empty");if(!DB.label[p.lab])e.push(`Label param. No. ${p.lab} not found`);if(p.aut!==-1&&!DB.auto[p.aut])e.push(`Auto. labeler param. No. ${p.aut} not found`);if(p.wc!==-1&&!DB.wc[p.wc])e.push(`Weight class No. ${p.wc} not found`);return e}
function callPLU(n){if(S.running){toast("Stop the automat before a PLU change");return}const p=DB.plu[n];if(!p){toast(`PLU ${pad6(n||0)} not found`);return}
 const e=validatePLU(p);if(e.length){S.pluOK=false;push("pluload",e.join("; "));return}
 S.pluOK=true;openMsgs().filter(m=>m.id==="pluload").forEach(m=>m.c=true);
 S.plu=n;S.d={1:null,2:null,3:null};S.rejRun=0;loadJob();S.disp={net:null,cls:null};log(`PLU ${pad6(n)} called up · ${p.text}`);toast(`PLU ${pad6(n)} active from the next package`);S.ev["called_"+n]=true;render();checkDrills()}
function editText1(){const p=P();const cur=S.jobText[1]??DB.text[p.txt1]??"";
 textIn("Text 1 · "+pad6(S.plu),cur,v=>{S.dlg=null;sel("Save Text 1",["Save for current labeling","Save to the database"+(p.txt1>0?" (text "+p.txt1+")":"")],"Save for current labeling",c=>{
  if(c.startsWith("Save for current")){S.jobText[1]=v;log("Text 1 changed for current labeling: "+v);toast("Text 1 saved for the current labeling job only")}
  else{let n=p.txt1;if(!(n>0)){n=100;while(DB.text[n]!=null)n++;p.txt1=n}DB.text[n]=v;delete S.jobText[1];log(`Text ${n} saved to the database: ${v}`);toast(`Saved as text ${n} in the database`)}checkDrills()})})}
function textEditor(){num("Text number","",P().txt1>0?P().txt1:"",n=>{n=Number(n);if(!(n>0)){toast("Enter a text number");return}textIn(`Text editor · text ${n}`,DB.text[n]??"",v=>{S.dlg=null;conf("Security check",`Save text ${n} in the database?`,()=>{DB.text[n]=v;log(`Text ${n} saved in the database`);toast(`Text ${n} saved`+(P().txt1===n?". The active PLU uses it.":". Point PLU data › Text 1 to "+n+" to use it."))})})})}
function dateDlg(n){num(`Date ${n} (DDMMYY)`,"","",v=>{const m=String(v).match(/^(\d{2})(\d{2})(\d{2})$/);if(!m){toast("Enter 6 digits DDMMYY");return}const d=new Date(2000+Number(m[3]),Number(m[2])-1,Number(m[1]));if(isNaN(d)||d.getDate()!==Number(m[1])){toast("Invalid date");return}S.d[n]=d;log(`Date ${n} entered ${fmtD(d)}`)})}
function pkgReset(){conf("RESET","Execute package reset? Packages on the belts are forgotten; empty the conveyor belts.",()=>{$$("#belt .pk").forEach(e=>e.remove());S.dbl=0;log("Package reset");toast("Package reset done. Empty the belts.")})}
function cancelDlg(){num("Cancel: consecutive no.","","",v=>{const c=Number(v);const e=S.list.find(x=>x.c===c&&!x.neg&&!x.rej);
 if(!e){toast("Consecutive number not found among labelled packages");return}
 if(S.cancelBlock&&c<=S.cancelBlock){toast("A total was released after this package. Cancellation not possible.");return}
 if(S.cons-c>100){toast("Only the last 100 packages can be cancelled");return}
 e.neg=true;[1,2,3,"A"].forEach(n=>{S.tot[n].n--;S.tot[n].kg-=e.w});log(`Package ${c} cancelled: -${f4(e.w)} kg deducted from totals`);S.ev.cancelled=true;toast(`Package ${c} cancelled`);render();checkDrills()})}
function minusDlg(){if(S.running){toast("Stop the automat first");return}conf("Minus","Place the package on the weighing belt, then confirm. Its weight is deducted from the totals.",()=>{const p=P();const w=Math.round(((p.mean)/1000+gauss()*p.sd/1000)*1000)/1000;[1,2,3,"A"].forEach(n=>{S.tot[n].n--;S.tot[n].kg-=w});S.list.unshift({c:S.cons,w,neg:true,rej:false});log(`Minus: ${f3(w)} kg re-weighed and deducted`);S.ev.minus=true;checkDrills()})}
function chanDlg(){S.dlg={k:"chan",ix:0,work:Object.fromEntries(LINE().heads.map(h=>[h.ch,S.heads[h.id].chan]))};render()}
/* special behaviour keyed by softkey label (generic handler covers the rest) */
const SPECIAL={
 "PLU":{val:()=>pad6(S.plu),run:askPLU},
 "Call up PLU":{val:()=>pad6(S.plu),run:askPLU},
 "PLU data local":{ico:"▦",run:()=>askTable("plu")},"PLU data global only":{ico:"▦",run:()=>askTable("plu")},"PLU data glob.+local":{ico:"▦",run:()=>askTable("plu")},
 "Delete PLU locally":{run:()=>delPLU()},"Delete PLU":{run:()=>delPLU()},
 "Label data local":{ico:"▦",run:()=>askTable("label")},"Lab. data global only":{ico:"▦",run:()=>askTable("label")},"Lab. data glob.+local":{ico:"▦",run:()=>askTable("label")},
 "Aut.labeler data loc.":{ico:"▦",run:()=>askTable("auto")},"A.lab.data glob.only":{ico:"▦",run:()=>askTable("auto")},"A.lab.data glob.+local":{ico:"▦",run:()=>askTable("auto")},
 "Weight class data":{ico:"▦",run:()=>askTable("wc")},"Wgt class columns":{val:()=>S.set.wcCols,run:()=>num("Wgt class columns","",S.set.wcCols,v=>{v=Number(v);if(!(v>=1&&v<=80)){toast("1 … 80 (more than 3 needs licence WEIGHT_CLASSES)");return}S.set.wcCols=v;log("Wgt class columns = "+v)})},"Preselect tot. matrix":{ico:"▦",run:()=>{if(!/Weight class-related|PLU-related|PLU dynamic/.test(S.set.totaliz)){info("Total preselection matrix","The matrix is only used when Totalization › Totaliz. mode is <PLU-related>, <PLU dynamic> or <Weight class-related> (service level, manual p. 286). It is currently "+esc(S.set.totaliz)+".");return}S.matrix={sel:0};S.editor=null;render()}},"Weight class editor":{ico:"▦",run:()=>{if(!WC()){toast("No weight class table on this PLU");return}S.editor={kind:"wc",id:P().wc,data:clone(WC()),cur:0,dirty:false,isNew:false,job:true};S.page=0;render()}},
 "Text 1":{val:()=>shortT(S.jobText[1]??DB.text[P().txt1]),run:editText1},
 "Text editor local":{ico:"✎",run:textEditor},"Text editor":{ico:"✎",run:textEditor},
 "Text No. occupied":{run:()=>info("Text No. occupied",Object.entries(DB.text).map(([n,t])=>`${n}: ${esc(t)}`).join("<br>"))},
 "Label param. No.":{val:()=>P().lab,run:()=>num("Label param. No.","",P().lab,v=>{if(!DB.label[v]){toast("Table not found");return}P().lab=Number(v);loadJob()})},
 "Auto.labeler param. No.":{val:()=>P().aut,run:()=>num("Auto.labeler param. No.","",P().aut,v=>{if(!DB.auto[v]){toast("Table not found");return}P().aut=Number(v);loadJob()})},
 "Label distance":{val:()=>S.set.dist+" mm",run:()=>num("Label distance","mm",S.set.dist,v=>setN("dist",v,0,2000,"Label distance"))},
 "Ref. point lab. distan.":{val:()=>S.set.ref.replace("Pckg. edge ",""),run:()=>sel("Ref. point lab. distan.",["Pckg. edge front side","Pckg. edge back side","Pckg. edge middle"],S.set.ref,v=>{S.set.ref=v;log("Ref. point = "+v)})},
 "LB1 susp. path":{val:()=>S.set.lb1+" mm",run:()=>num("LB1 susp. path","mm",S.set.lb1,v=>setN("lb1",v,0,2000,"LB1 susp. path"))},
 "LB2/3 susp. path":{val:()=>S.set.lb23+" mm",run:()=>num("LB2/3 susp. path","mm",S.set.lb23,v=>setN("lb23",v,0,2000,"LB2/3 susp. path"))},
 "Speed":{val:()=>S.set.speed+" m/min",run:()=>num("Speed","m/min",S.set.speed,v=>{setN("speed",v,10,60,"Speed");if(S.running)schedule()})},
 "Conveying speed":{val:()=>S.set.conv+" m/min",run:()=>num("Conveying speed","m/min",S.set.conv,v=>setN("conv",v,10,80,"Conveying speed"))},
 "Fact. IC/SC label. mode":{val:()=>S.set.sepf,run:()=>num("Fact. IC/SC label. mode","",S.set.sepf,v=>setN("sepf",v,.5,3,"Separation factor"))},
 "Operating mode":{val:()=>S.set.opmode.replace("Weighing ",""),run:()=>sel("Operating mode",["Transport","Weighing Continuous","Weighing Start/Stop"],S.set.opmode,v=>{S.set.opmode=v;log("Operating mode = "+v)})},
 "Labeler conv. mode":{val:()=>S.set.lcmode.replace(/contin\./g,"cont."),run:()=>sel("Labeler conv. mode",["LC 1 contin. LC 2 contin.","LC 1 stop LC 2 contin.","LC 1 stop LC 2 stop"],S.set.lcmode,v=>{S.set.lcmode=v})},
 "PE:Activation criteria":{val:()=>S.set.pe.replace("PE:",""),run:()=>sel("PE:Activation criteria",["PE:Static passive","PE:Static active","PE:Active on error","PE:Depend. on Min/Max","PE:On error and Min/Max","PE:Chan.when total1reach.","PE:Chan.when total2reach.","PE:Chan.when total3reach.","PE: Metal detector"],S.set.pe,v=>{S.set.pe=v;log("Ejector activation = "+v)})},
 "Position trigger 2":{val:()=>S.set.trig2+" mm",run:()=>num("Position trigger 2","mm",S.set.trig2,v=>setN("trig2",v,0,5000,"Position trigger 2"))},
 "Process":{val:()=>S.set.release.replace("Start autom. labeler","Start aut."),run:()=>sel("Release mode: Process",["Automatic","Manual","Start autom. labeler","External start","Remote device","Remote aut.labeler","Remote inactive"],S.set.release,v=>{S.set.release=v;log("Release mode = "+v)})},
 "Print mode: thermal...":{split:["Direct","TTF"],cur:()=>S.set.mode,run:()=>{S.set.mode=S.set.mode==="Direct"?"TTF":"Direct";log("Print mode: thermal "+S.set.mode)}},
 "Label feed":{val:()=>S.set.feed+" DOT",run:()=>num("Label feed","DOT",S.set.feed,v=>setN("feed",v,-99,99,"Label feed"))},
 "Hor. print position":{val:()=>S.set.hpos+" DOT",run:()=>num("Hor. print position","DOT",S.set.hpos,v=>setN("hpos",v,-999,999,"Hor. print position"))},
 "Vert. print position":{val:()=>S.set.vpos+" DOT",run:()=>num("Vert. print position","DOT",S.set.vpos,v=>setN("vpos",v,-999,999,"Vert. print position"))},
 "Print speed":{val:()=>S.set.pspeed+" mm/s",run:()=>num("Print speed","mm/s",S.set.pspeed,v=>setN("pspeed",v,50,250,"Print speed"))},
 "Saturation DT":{val:()=>S.set.satDT+" %",run:()=>num("Saturation DT","%",S.set.satDT,v=>setN("satDT",v,-50,50,"Saturation DT"))},
 "Saturation TTF":{val:()=>S.set.satTTF+" %",run:()=>num("Saturation TTF","%",S.set.satTTF,v=>setN("satTTF",v,-50,50,"Saturation TTF"))},
 "Retract operation":{split:["W/o","With"],cur:()=>S.set.retract,run:()=>{S.set.retract=S.set.retract==="W/o"?"With":"W/o"}},
 "Position tearoffEdge":{split:["LE","TE"],cur:()=>S.set.tearoff,run:()=>{S.set.tearoff=S.set.tearoff==="LE"?"TE":"LE"}},
 "Date 1":{val:()=>S.d[1]?fmtD(S.d[1]):"("+fmtD(d1())+")",run:()=>dateDlg(1)},"Date 2":{val:()=>S.d[2]?fmtD(S.d[2]):"("+fmtD(d2())+")",run:()=>dateDlg(2)},"Date 3":{val:()=>S.d[3]?fmtD(S.d[3]):"("+fmtD(d3())+")",run:()=>dateDlg(3)},
 "Shelf-life 1":{val:()=>life(1),run:()=>num("Shelf-life 1","days",life(1),v=>{S.life[1]=Number(v)||0;S.d[2]=null;log("Shelf-life 1 = "+v)})},
 "Shelf-life 2":{val:()=>life(2),run:()=>num("Shelf-life 2","days",life(2),v=>{S.life[2]=Number(v)||0;S.d[3]=null;log("Shelf-life 2 = "+v)})},
 "Tare":{val:()=>((S.tareOv??P().tare)/1000).toFixed(3)+" kg",run:()=>num("Tare","g",S.tareOv??P().tare,v=>{S.tareOv=Number(v);log("Tare overwritten: "+v+" g");S.ev.tare=true;checkDrills()})},
 "Fixed weight":{val:()=>P().fixw+" g",run:()=>num("Fixed weight","g",P().fixw,v=>{P().fixw=Number(v)||0})},
 "Unit price":{val:()=>"£"+f2(P().unit),run:()=>num("Unit price","£/kg",P().unit,v=>{P().unit=Number(v)||0})},
 "Fixed price":{val:()=>"£"+f2(P().fixp),run:()=>num("Fixed price","£",P().fixp,v=>{P().fixp=Number(v)||0})},
 "Labeling mode":{val:()=>P().mode,run:()=>sel("Labeling mode",["Weight","Fixed price","Fixed weight","Fixed value"],P().mode,v=>{P().mode=v})},
 "Operator number":{val:()=>S.set.operator,run:()=>num("Operator number","",S.set.operator,v=>{S.set.operator=v})},
 "Batch number":{val:()=>S.set.batch||"–",run:()=>textIn("Batch number",S.set.batch,v=>{S.set.batch=v;log("Batch number = "+v)})},
 "Number of lab.copies":{val:()=>S.set.labcopies,run:()=>num("Number of lab.copies","",S.set.labcopies,v=>{S.set.labcopies=Number(v)||1})},
 "Print chan. control":{ico:"▦",run:chanDlg},
 "Totaliz. mode":{val:()=>S.set.totaliz.replace(" summing up",""),run:()=>sel("Totaliz. mode",["Without summing up","With summing up","PLU-related","Weight class-related","PLU dynamic"],S.set.totaliz,v=>{S.set.totaliz=v;log("Totaliz. mode = "+v)})},
 "Single numerator":{val:()=>S.set.num1.replace(" numerator",""),run:()=>sel("Single numerator",["Without numerator","With numerator","As a constant","Delete with *1","Delete with *2","Delete with *3"],S.set.num1,v=>{S.set.num1=v})},
 "Automat on error":{split:["Stop","Conv."],cur:()=>S.set.onErr,run:()=>{S.set.onErr=S.set.onErr==="Stop"?"Conv.":"Stop";log("Automat on error = "+S.set.onErr)}},
 "Stop after errors":{val:()=>S.set.errN,run:()=>num("Stop after errors","",S.set.errN,v=>setN("errN",v,1,99,"Stop after errors"))},
 "Stop after send error":{val:()=>S.set.errSend,run:()=>num("Stop after send error","",S.set.errSend,v=>setN("errSend",v,1,99,"Stop after send error"))},
 "Minus":{run:minusDlg},"Cancel via cons. no.":{run:cancelDlg},
 "Software version":{run:()=>info("Software version",`GLM-I application (simulated)<br>Device ${LINE().dev[S.dev].bus}: ${LINE().dev[S.dev].name}<br>Menu type 1`)},
 "History of messages":{run:()=>info("History of messages",S.msgs.slice(-14).reverse().map(m=>`${m.at}  ${esc(MSG[m.id].t)}${m.c?" (cleared)":""}`).join("<br>")||"No messages")},
 "Label counter":{run:()=>info("Label counter",LINE().heads.map(h=>`${h.name}: ${S.heads[h.id].roll.cap-S.heads[h.id].roll.left} labels from current roll`).join("<br>")+`<br>Packages this session: ${S.seq}`)},
 "Operator language":{val:()=>"English",run:()=>sel("Operator language",["Deutsch","English","Français","Italiano","Português","Español"],"English",v=>{if(v!=="English")toast("Only English is simulated")})}
};
[1,2,3].forEach(n=>{
 SPECIAL["Presel.type total "+n]={val:()=>S.set.presel[n].type.replace("Preselect ","").replace("Number of total ","#*"),run:()=>sel("Presel.type total "+n,["None","Preselect pieces","Preselect weight","Preselect price"].concat(n>1?["Number of total 1"]:[]).concat(n>2?["Number of total 2"]:[]),S.set.presel[n].type,v=>{S.set.presel[n].type=v;log(`Presel.type total ${n} = ${v}`);checkDrills()})};
 SPECIAL["Presel. piece *"+n]={val:()=>S.set.presel[n].val,run:()=>num("Presel. value total "+n,"",S.set.presel[n].val,v=>{S.set.presel[n].val=Number(v)||0;log(`Presel. value total ${n} = ${v}`);checkDrills()})};
 SPECIAL["Total "+n]={val:()=>"# "+S.tot[n].n,run:()=>{if(S.path[0]==="Release total"||S.level===9)conf("Release total",`Total ${n}: # ${S.tot[n].n}, ${f3(S.tot[n].kg)} kg. Release now?`,()=>releaseTotal(n,"manual"));else info("Total "+n,`# ${S.tot[n].n}<br>kg ${f3(S.tot[n].kg)}`)}}});
SPECIAL["Article total"]={val:()=>"# "+S.tot.A.n,run:()=>conf("Release total",`Article total: # ${S.tot.A.n}. Release now?`,()=>{log("Article total released");S.tot.A={n:0,kg:0,val:0}})};
["A","B","C","D","E"].forEach(c=>SPECIAL["Send channel "+c]={split:["Off","On"],cur:()=>S.set.send[c]?"On":"Off",run:()=>{S.set.send[c]=!S.set.send[c];log(`Send channel ${c} ${S.set.send[c]?"On":"Off"}`)}});
SPECIAL["Internal printing"]={split:["Off","On"],cur:()=>S.set.send.int?"On":"Off",run:()=>{S.set.send.int=!S.set.send.int;log("Internal printing "+(S.set.send.int?"On":"Off"))}};
function genericKey(node){const sec=MAN[node.secs[0]];const key=S.path.concat(node.label).join("/");
 const opts=(sec.options||[]).filter(o=>o.length<34);const kind=sec.kind;
 const unit=(/\b(\d+\s*)?dots?\b|\bdot\b/i.test(sec.text)?"DOT":/\bmm\b/.test(sec.text)?"mm":/m\/min/.test(sec.text)?"m/min":/percent|%/.test(sec.text)?"%":/days/.test(sec.text)?"days":"");
 if((kind==="toggle")){const o=opts.length>=2?opts:["W/o","With"];return{split:o.length===2?o:null,val:o.length!==2?()=>S.gen[key]??o[0]:null,cur:()=>S.gen[key]??o[0],run:()=>{const c=S.gen[key]??o[0];S.gen[key]=o[(o.indexOf(c)+1)%o.length];log(`${node.label} = ${S.gen[key]}`)}}}
 if(kind==="value")return{val:()=>S.gen[key]!=null?S.gen[key]+(unit?" "+unit:""):"",run:()=>num(node.label,unit,S.gen[key]??"",v=>{S.gen[key]=v;log(`${node.label} = ${v}`)})};
 if((kind==="list"||kind==="choice")&&opts.length>=2)return{val:()=>S.gen[key]??"",run:()=>sel(node.label,opts,S.gen[key]??opts[0],v=>{S.gen[key]=v;log(`${node.label} = ${v}`)})};
 return{run:()=>info(node.label,`<b>${esc(sec.num)} ${esc(sec.title)}</b> · manual p. ${sec.page}<br><br>${esc(sec.text.slice(0,700)).replace(/\n/g,"<br>")}${sec.text.length>700?"…":""}<br><br><i>In the trainer this function is shown for navigation practice; it has no effect on the simulation.</i>`)}}
function keyFor(node){const sp=SPECIAL[node.label];const g=node.secs.length?genericKey(node):{};const k=Object.assign({},g,sp||{});k.label=node.label;k.node=node;
 const ch=node.ch.filter(c=>nodeVisible(c,S.level));if(ch.length)k.menu=true;return k}

/* level 9: customer layout photographed on FP2-L03 */
function L9(){const K=(label,o)=>Object.assign({label},o);return[
 K("plu change",{mac:"P",prot:true,run:()=>protect(askPLU),sec:"12.10.1"}),
 K("PLU",{val:()=>pad6(S.plu),grey:true,sec:"12.10.1"}),
 K(macroLabel(),{mac:"m",prot:true,run:()=>protect(()=>pluList(custMatch)),sec:"12.10.2"}),
 K("Print chan. control",{ico:"▦",run:chanDlg,sec:"21.10"}),
 K("Date 2",{val:()=>(S.d[2]?"":"(")+fmtD(d2())+(S.d[2]?"":")"),grey:true,sec:"16.1.2"}),
 K("Shelf-life 1",{val:()=>life(1),grey:true,sec:"16.2.1"}),
 K("Speed",Object.assign({},SPECIAL["Speed"],{sec:"20.8.4"})),
 K("RESET",{mac:"f",run:pkgReset,sec:"7.3"}),
 K("Label feed",Object.assign({},SPECIAL["Label feed"],{sec:"29.3.1"})),
 K("Label distance",Object.assign({},SPECIAL["Label distance"],{sec:"20.3.1"})),
 K("Print mode: Thermo ...",Object.assign({},SPECIAL["Print mode: thermal..."],{sec:"29.2.2"})),
 K("Position trigger 2",Object.assign({},SPECIAL["Position trigger 2"],{sec:"20.3.1"})),
 K("LB1 susp. path",{val:()=>S.set.lb1+" mm",grey:true,sec:"20.8.2"}),
 K("Send channel E",Object.assign({},SPECIAL["Send channel E"],{sec:"30.10"})),
 K("Vert. print position",Object.assign({},SPECIAL["Vert. print position"],{sec:"29.3.2"})),
 K("Hor. print position",Object.assign({},SPECIAL["Hor. print position"],{sec:"29.3.2"}))].concat((S.l9extra||[]).map(x=>{const m=S.macros.find(mm=>mm.name===x.macro);return K(x.label,{mac:"·",prot:m&&!!m.pw,sec:"10.7.5",run:()=>{if(m)startMacro(m)}})}))}
function curList(){if(S.level===9)return L9();const n=treeAt(S.path);return n.ch.filter(c=>nodeVisible(c,S.level)).map(keyFor)}

/* ============================================================ table editors */
const DEFS={
 plu:[["text","Article text","Text"],["mode","Labeling mode","Selection",["Weight","Fixed price","Fixed weight","Fixed value"]],["unit","Unit price","Value","£/kg"],["fixp","Fixed price","Value","£"],["fixw","Fixed weight","Value","g"],["tare","Tare","Value","g"],["minw","Minimum weight","Value","g"],["maxw","Maximum weight","Value","g"],["pcs","Pieces/ package","Value",""],["life1","Shelf-life 1","Value","days"],["life2","Shelf-life 2","Value","days"],["d1","Date 1 options","Selection",["Packed on","Without"]],["d2","Date 2 options","Selection",["Use by","Best before","Sell by","Without"]],["d3","Date 3 options","Selection",["Use by","Without"]],["lab","Label param. No.","Parameters","label"],["aut","Auto. labeler param. No.","Parameters","auto"],["wc","Weight class No.","Parameters","wc"],["txt1","Text 1","Parameters","text"],["pre1","Preselect piece *1","Value","pcs"],["eob","Cust. label no. total1 (End of Batch PLU)","Value",""],["pz","PZ PLU (label design)","Value",""],["grp","Pr. group number","Value",""]],
 label:[["name","Table name","Text"],["size","Label size","Selection",["58 x 40","58 x 80","80 x 80","80 x 120"]],["type","Label type","Selection",["Standard","Total label"]],["speed","Printing speed","Value","mm/s"],["vpos","Vert. print position","Value","DOT"],["hpos","Hor. print position","Value","DOT"],["feed","Label feed","Value","DOT"],["lbf","LB-offset front edge","Value","mm"],["lbb","LB-offset back edge","Value","mm"],["rev","Reverse mode","Setting",["W/o","With"]],["sales","Printout of sales price","Setting",["without","with"]]],
 auto:[["name","Table name","Text"],["ref","Label distance reference point","Selection",["Pckg. edge front side","Pckg. edge back side","Pckg. edge middle"]],["dist","Label distance","Value","mm"],["speed","Speed","Value","m/min"],["conv","Transport conveyor belt speed","Value","m/min"],["sepf","Separation factor IB/SB","Value",""],["lb1","Light barrier 1 masking section","Value","mm"],["lb23","Light barrier 2/3 masking section","Value","mm"],["pkh","Package height","Value","mm"],["pkw","Package width","Value","mm"]],
 wc:[["name","Table name","Text"],["ltype","Labeling type","Selection",["Weight","Fixed weight","Fixed value","No labeling"]],["weight","Weight (0 = PLU)","Value","g"],["stype","Statistics type","Selection",["Weight determination","Contents control","Sliding content check","Weight sorting","FPV Europe"]],["lower","Lower limit","Value","g"],["upper","Upper limit","Value","g"],["stops","Automat stops after ..","Value","pcs"]]};
const TNAME={plu:"PLU data local",label:"Label data local",auto:"Aut.labeler data loc.",wc:"Weight class data"};
function askTable(kind){const title={plu:"PLU number",label:"Label param. number",auto:"Labeler param. number",wc:"Weight class number"}[kind];
 const cur=kind==="plu"?S.plu:kind==="label"?P().lab:kind==="auto"?P().aut:P().wc;
 num(title,"",cur,v=>openTable(kind,Number(v)),[{label:"Next availb. no.",fn:()=>{let k=1;while(DB[kind][k])k++;openTable(kind,k)}}])}
function openTable(kind,n){if(!(n>0)){toast("Enter a number");return}const isNew=!DB[kind][n];let data;
 if(!isNew)data=clone(DB[kind][n]);
 else if(kind==="plu")data={text:"",mode:"Weight",unit:0,fixp:0,fixw:0,tare:0,minw:0,maxw:0,pcs:1,life1:0,life2:0,d1:"Packed on",d2:"Use by",d3:"Without",lab:-1,aut:-1,wc:-1,pre1:0,eob:0,pz:0,grp:0,mean:1000,sd:40,pack:"tray",chan:{},cust:"",code:null};
 else if(kind==="wc")data=mkWC("New weight classes","Weight",P().minw||1000,P().maxw||2000);
 else{data=clone(Object.values(DB[kind])[0]);data.name="New table"}
 S.editor={kind,id:n,data,cur:0,dirty:false,isNew};S.page=0;render()}
const edRows=()=>DEFS[S.editor.kind];
function fmtVal(d,v){if(d[2]==="Parameters")return v===-1||v==null?"-1":String(v);if(d[2]==="Value")return(v??"")+(d[3]?" "+d[3]:"");return v===""||v==null?"—":String(v)}
function editRow(){const E=S.editor,d=edRows()[E.cur],k=d[0],cur=E.data[k];const set=v=>{E.data[k]=v;E.dirty=true;render()};
 if(d[2]==="Selection"||d[2]==="Setting")return sel(d[1],d[3],cur,set);
 if(d[2]==="Text")return textIn(d[1],cur,set);
 if(d[2]==="Parameters")return num(d[1]+" (−1 = none)","",cur,v=>set(v===""?-1:Number(v)));
 num(d[1],d[3],cur,v=>set(Number(v)||0))}
function edKeys(){const E=S.editor;if(E.kind==="wc")return wcKeys();const d=edRows()[E.cur];const isRef=d&&d[2]==="Parameters";const K=(label,o)=>Object.assign({label},o);return[
 K("Edit",{ico:"…",run:editRow}),
 K("Search reference",{ico:"⌕",grey:!isRef,run:()=>{const kind=d[3];sel("Search reference",["-1  none",...Object.keys(DB[kind]).slice(0,400).map(x=>x+"  "+(typeof DB[kind][x]==="string"?DB[kind][x].slice(0,46):DB[kind][x].name))],"",v=>{E.data[d[0]]=Number(v.split(" ")[0]);E.dirty=true;render()})}}),
 K("Up",{ico:"▲",run:()=>{E.cur=Math.max(0,E.cur-1)}}),K("Down",{ico:"▼",run:()=>{E.cur=Math.min(edRows().length-1,E.cur+1)}}),
 K("Save",{ico:"✓",run:()=>E.job?sel("Security check",["yes (current labeling only)","Yes, also in database"],"yes (current labeling only)",c=>{if(c.startsWith("yes")){S.wcJob=clone(E.data);E.dirty=false;log("Weight class table changed for the current labeling job");toast("Saved for the current labeling job");checkDrills();return}
  const go=()=>{DB.wc[E.id]=clone(E.data);S.wcJob=null;E.dirty=false;log(`Weight class table ${E.id} saved in the database`);toast("Saved in the database");checkDrills()};const need=pwFor(3);if(S.level>=3&&S.level!==9||!need)go();else pw(v=>{if(v===need)go();else toast("Wrong password")},"Password for level 3")}):conf("Security check",`Save ${TNAME[E.kind]} under number ${E.id}?`,()=>{if(E.kind==="plu"&&!E.data.text){info("Not saved","Article text is required.");return}if(E.kind==="plu"&&E.isNew){E.data.wc=E.data.wc;}DB[E.kind][E.id]=clone(E.data);E.dirty=false;E.isNew=false;log(`${TNAME[E.kind]} ${E.id} saved`);S.ev["saved_"+E.kind+"_"+E.id]=true;toast(usedByActive(E.kind,E.id)?"Saved. Call up the PLU again to load the new values into the job.":"Saved");checkDrills()})}),
 K("Close",{run:()=>{if(E.dirty)conf("Close table","Discard unsaved changes?",()=>{S.editor=null;render()});else S.editor=null}})]}
function wcSave(){const E=S.editor;const finish=(where)=>{E.dirty=false;E.isNew=false;log(`Weight class table ${E.id} ${where}`);toast("Saved "+where+(LINE().online&&where.includes("database")?". This line is online: the next BRAIN2 download overwrites local changes.":""));S.ev["saved_wc_"+E.id]=true;S.ev.wcSavedLocal=(S.ev.wcSavedLocal||0)+(where.includes("database")?1:0);checkDrills()};
 if(E.job){sel("Security check",["yes (current labeling only)","Yes, also in database"],"yes (current labeling only)",c=>{if(c.startsWith("yes")){S.wcJob=clone(E.data);finish("for the current labeling job")}else{const go=()=>{DB.wc[E.id]=clone(E.data);S.wcJob=null;finish("in the database")};const need=pwFor(3);if((S.level>=3&&S.level!==9)||!need)go();else pw(v=>{if(v===need)go();else toast("Wrong password")},"Password for level 3")}});return}
 conf("Security check",`Save the weight class table under number ${E.id}?`,()=>{DB.wc[E.id]=clone(E.data);if(S.wcJob&&P().wc===E.id)S.wcJob=null;finish("in the database (local)")})}
function wcKeys(){const E=S.editor;const K=(label,o)=>Object.assign({label},o);const s=E.sel||["wc",1];return[
 K("Edit",{ico:"…",run:()=>wcEdit(s[0],s[1])}),K("Add column",{ico:"+",run:wcAddCol}),K("Delete column",{run:()=>{const W=E.data;if(W.cols.length<=1||s[1]<0){toast("Select a column");return}W.cols.splice(s[1],1);W.cols[W.cols.length-1].up=null;E.dirty=true;E.sel=["wc",0]}}),
 K("Table name",{val:()=>E.data.name.slice(0,10),run:()=>textIn("Table name",E.data.name,v=>{E.data.name=v;E.dirty=true})}),
 K("Print table",{run:()=>toast("Table sent to the list printer (simulated)")}),K("Save",{ico:"✓",run:wcSave}),
 K("Close",{run:()=>{if(E.dirty)conf("Close table","Discard unsaved changes?",()=>{S.editor=null;render()});else S.editor=null}})]}
function usedByActive(kind,id){const p=P();return(kind==="label"&&p.lab===id)||(kind==="auto"&&p.aut===id)||(kind==="wc"&&p.wc===id)||(kind==="plu"&&S.plu===id)}
function delPLU(){num("Delete PLU","","",v=>{const n=Number(v);if(!DB.plu[n]){toast("PLU not found");return}if(n===S.plu){toast("Cannot delete the active PLU");return}conf("Security check",`Delete PLU ${pad6(n)}?`,()=>{delete DB.plu[n];log(`PLU ${pad6(n)} deleted`)})})}

/* ============================================================ stage rendering */
function KEY(w,c){return`<svg width="${w}" height="${w*0.45}" viewBox="0 0 40 18" aria-hidden="true"><circle cx="7" cy="9" r="5.5" fill="none" stroke="${c}" stroke-width="3"/><path d="M12 9h26M30 9v6M36 9v5" stroke="${c}" stroke-width="3"/></svg>`}
function LOCK(){return`<svg width="9" height="10" viewBox="0 0 9 10" aria-hidden="true"><rect x="1" y="4" width="7" height="6" fill="#fff"/><path d="M2.5 4V2.8a2 2 0 0 1 4 0V4" fill="none" stroke="#fff" stroke-width="1.2"/></svg>`}
function flag(){return`<svg width="30" height="20" viewBox="0 0 60 40" aria-hidden="true"><rect width="60" height="40" fill="#012169"/><path d="M0,0 60,40 M60,0 0,40" stroke="#fff" stroke-width="8"/><path d="M0,0 60,40 M60,0 0,40" stroke="#c8102e" stroke-width="3"/><path d="M30,0v40M0,20h60" stroke="#fff" stroke-width="12"/><path d="M30,0v40M0,20h60" stroke="#c8102e" stroke-width="7"/></svg>`}
function lblIcon(){return`<svg width="28" height="24" viewBox="0 0 28 24" aria-hidden="true"><rect x="3" y="3" width="18" height="13" fill="#fff" stroke="#555"/><path d="M6 7h12M6 10h9" stroke="#888"/><path d="M14 14c3 0 6 2 8 6l-6 2-4-5z" fill="#c9a27a" stroke="#6b4e2e"/></svg>`}
function statusBox(){const om=openMsgs();const face=om.length?(locked()?"#e53935":"#f2b705"):"#f2b705";const dv=LINE().dev[S.dev];
 return`<div class="p" style="left:402px;top:0;width:166px;height:46px;background:#5d6168;border-color:#4a4e54">
 <div style="display:flex;align-items:center;gap:7px;color:#fff;font-size:10px;height:15px;padding:1px 5px"><span style="display:inline-flex;align-items:center;gap:1px">${KEY(14,"#fff")}<b>${S.level}</b></span><span style="display:inline-block;width:12px;height:8px;border:1px solid #fff"></span><span style="display:inline-block;width:11px;height:11px;border-radius:50%;background:${face};border:1px solid #333;line-height:9px;text-align:center;color:#333;font-size:8px">☺</span>${S.running?'<span style="color:#9be89b">● RUN</span>':""}${locked()?'<span style="color:#ffb4ab">⛔</span>':""}</div>
 <div data-a="dev" style="background:#a8281d;color:#fff;font-size:11px;padding:1px 5px;margin:0 3px;cursor:${LINE().dev.length>1?"pointer":"default"}" title="${LINE().dev.length>1?"Switch operating connection":""}">${dv.bus}: ${esc(dv.name)}</div>
 <div style="padding:0 5px;line-height:0">${LOCK()}</div></div>`}
function totBox(x,w,name,t,cons){const pre=S.set.presel[name.slice(-1)];return`<div class="p" style="left:${x}px;top:46px;width:${w}px;height:96px;padding:2px 6px;font-size:9px;line-height:1.3"><div>${name}</div><div style="display:grid;grid-template-columns:20px 1fr"><span>#</span><span style="text-align:right">${t.n}</span><span>kg</span><span style="text-align:right">${f3(t.kg)}</span><span>£</span><span style="text-align:right">${f2(t.val)}</span></div>${pre&&pre.val&&pre.type!=="None"?`<div style="display:flex;justify-content:space-between"><span>Presel.</span><span>${pre.type==="Preselect pieces"?pre.val+" #":pre.val}</span></div>`:""}${cons?`<div style="margin-top:2px">Cons.No.: ${S.cons}</div>`:""}</div>`}
function labelBox(r,small){if(!r)return'<div class="sm" style="padding:10px">No label printed yet.</div>';
 const p=DB.plu[r.plu]||P(),G=geo(),L=DB.label[p.lab]||REF.label[3];const big=L.size!=="58 x 40";
 const w=big?200:186,h=big?200:128;
 if(r.l1==="Blank")return`<div style="position:absolute;left:${(306-w)/2}px;top:${big?120:150}px;width:${w}px;height:${h}px;border:1px dotted #bbb"></div><div class="sm" style="position:absolute;left:0;right:0;top:${big?330:290}px;text-align:center;color:#aaa">(blank label)</div>`;
 const dy=(r.vpos-G.vpos+r.feed-G.feed)*0.55,dx=-(r.hpos-G.hpos)*0.55;
 let code="";if(p.code){if(p.code.type==="GTIN")code=p.code.v;else if(p.code.type==="Price embedded"){const pr=String(Math.round((r.price||0)*100)).padStart(4,"0").slice(-4);const d12=p.code.v+priceCheck4(pr)+pr;code=d12+ean13check(d12)}}
 const pricePart=p.mode!=="Weight"||p.unit>0;
 const inner=big?`<div style="font-size:8px;font-weight:700;line-height:1.15;width:170px">${esc(p.text)}</div>
  <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:6px"><span>${p.d2!=="Without"?p.d2:""}</span><span style="font-size:9px;font-weight:700">${fmtD(r.d2)}</span></div>
  <div style="display:flex;justify-content:space-between;font-size:6px;border-top:1px solid #bbb;margin-top:3px;padding-top:2px"><span>Net weight</span><span style="font-size:9px;font-weight:700">${p.mode==="Fixed weight"||p.mode==="Fixed value"?p.fixw+"g ℮":f3(r.w)+" kg"}</span></div>
  ${pricePart?`<div style="display:flex;justify-content:space-between;font-size:6px"><span>${p.mode==="Weight"?"£"+f2(p.unit)+"/kg":""}</span><span style="font-size:9px;font-weight:700">£${f2(r.price)}</span></div>`:""}
  ${r.t1?`<div style="font-size:5.5px;margin-top:3px;width:175px;line-height:1.25">${esc(r.t1)}</div>`:""}<div style="margin-top:4px">${code?eanSvg(code,110):p.code?`<div style="font-size:6px">${esc(p.code.v)}</div>`:""}</div><div style="font-size:5px">${pad6(r.plu)} ${esc(r.batch)} ${String(r.c).slice(-6)}</div>`
 :`<div style="position:absolute;left:82px;top:-18px;width:20px;height:12px;border:1px solid #333;border-radius:50%"></div><div style="font-size:11px;font-weight:700">${fmtD(r.d2)}</div><div style="font-size:4.8px;margin-top:2px">${pad6(r.plu)} L${S.key.slice(-2)} ${String(r.c).slice(-6)} ${new Date().toTimeString().slice(0,5)}</div><div style="font-size:4.8px;margin-left:32px;margin-top:4px">${f3(r.w)}kg</div>${r.t1?`<div style="font-size:4.6px;margin-top:3px;width:110px;white-space:normal">${esc(r.t1)}</div>`:""}`;
 return`<div style="position:absolute;left:${(306-w)/2}px;top:${big?120:150}px;width:${w}px;height:${h}px;overflow:hidden;border:1px dotted #d0d0d0"><div style="position:absolute;left:${(big?12:40)+dx}px;top:${(big?10:44)+dy}px;color:#111;line-height:1.3">${inner}</div></div>`}
function label2(r){if(!r)return"";const heads=LINE().heads;if(heads.length<2)return"";const h2=heads[1];
 if(!r.printed.includes(h2.id))return`<div class="sm" style="position:absolute;left:0;right:0;top:140px;text-align:center;color:#aaa;font-size:9px">(${esc(h2.name)}: no print)</div>`;
 if(h2.wrap)return`<div style="position:absolute;left:120px;top:80px;width:60px;height:150px;border:1px solid #999;font-size:6px;padding:4px;text-align:center"><b>C-Wrap</b><br><br>${esc(DB.plu[r.plu].text.slice(0,40))}<br><br>${fmtD(r.d2)}</div>`;
 return`<div style="position:absolute;left:142px;top:100px;transform:rotate(90deg);font-size:5.5px;line-height:1.35;color:#111;white-space:nowrap"><div style="font-weight:700;font-size:6.5px">${fmtD(r.d2)}</div><div>${pad6(r.plu)}</div><div>${f3(r.w)} kg</div></div>`}
function convRows(){const heads=LINE().heads;const rows=["IC","SC","WC"];heads.forEach(h=>{if(!rows.includes(h.conv))rows.push(h.conv)});if(S.key.startsWith("FP2")&&!rows.includes("LC 2"))rows.push("LC 2");return rows}
function stageHTML(){
 if(!S.power)return`<div class="black"></div>`;
 if(S.boot>0)return`<div class="boot"><b style="font-size:22px;color:#6b6f73;letter-spacing:.04em">BIZERBA</b><div>Starting GLM-I · ${esc(LINE().dev[S.dev].name)}</div><div class="bar"><i style="width:${100-S.boot}%"></i></div><div class="sm" style="font-size:12px">Allow 20 minutes after switch-on before production so the scale reaches operating temperature (manual p. 334).</div></div>`;
 const p=P(),W=WC();const tare=(S.tareOv??p.tare)/1000;
 const idleNet=-tare+S.drift;const net=S.disp.net==null?idleNet:S.disp.net;
 const run=S.running,thr=run?Math.round(S.set.speed/geo().pitch):0;
 const dia=run?'<span class="dia stop"><i>■</i></span>':'<span class="dia"><i>◆</i></span>';
 let h=`<div class="p" style="left:0;top:0;width:95px;height:46px;padding:4px 5px"><div style="font-size:17px;color:#6b6f73">BIZERBA<sup style="font-size:7px;color:#555">NET</sup></div><div style="font-size:6.5px;color:#666">FOR PREPACKING ONLY</div></div>
 <div class="p" style="left:95px;top:0;width:127px;height:46px;padding:2px 5px;text-align:right"><div class="sm" style="font-size:9px;text-align:center">${W?"Weight class mode":"Labeling mode"}</div><div style="font-size:17px">${f3(net)}kg</div></div>
 <div class="p" style="left:222px;top:0;width:80px;height:46px;padding:2px 5px;text-align:right"><div class="sm" style="font-size:9px">TARE${S.tareOv!=null?" *":""}</div><div style="font-size:17px">${f3(tare)}kg</div></div>
 <div class="p" style="left:302px;top:0;width:96px;height:46px;padding:2px 5px;font-size:9px;line-height:1.35;display:grid;grid-template-columns:auto 1fr;column-gap:6px"><span>Max</span><span style="text-align:right">3/6 kg</span><span>Min</span><span style="text-align:right">50 g</span><span>e =</span><span style="text-align:right">1/2 g</span></div>
 ${statusBox()}
 <div class="p" style="left:572px;top:0;width:358px;height:46px;padding:3px 8px;display:grid;grid-template-columns:70px 1fr;gap:6px;align-items:start"><span class="sm" style="font-size:8.5px">${thr} items/min</span><div><div style="height:14px;border:1px solid #888;background:#fff;position:relative"><i style="position:absolute;left:0;top:0;bottom:0;width:${Math.min(100,thr)}%;background:#7aa6d8"></i></div><div style="display:flex;justify-content:space-between;font-size:7.5px;color:#555;margin-top:1px"><span>0</span><span>25</span><span>50</span><span>75</span><span>100 [%]</span></div></div></div>
 <div class="btn" data-a="startstop" style="left:932px;top:0;width:338px;height:108px;border-radius:2px" title="${run?"Stop":"Start"}">${dia}</div>
 <div class="btn" data-a="lang" style="left:4px;top:50px;width:40px;height:40px" title="Operator language">${flag()}</div>
 <div class="p" style="left:48px;top:46px;width:177px;height:50px;padding:3px 5px;font-size:9px;line-height:1.3"><div style="white-space:nowrap;overflow:hidden">${esc(p.cust&&!p.text.toUpperCase().startsWith(p.cust.split(" ")[0].toUpperCase())?p.cust.toUpperCase()+" "+p.text:p.text)}</div><div style="display:flex;justify-content:space-between"><span>PLU</span><span>${pad6(S.plu)}</span></div><div>C.No.</div></div>
 <div class="btn" data-a="lblkey" style="left:4px;top:95px;width:40px;height:40px">${lblIcon()}</div>
 <div class="p" style="left:48px;top:96px;width:177px;height:46px;padding:4px 5px;font-size:10px;line-height:1.25;overflow:hidden">${esc(p.text)}</div>
 ${totBox(225,170,"Total 1",S.tot[1],true)}${totBox(395,177,"Total 2",S.tot[2],false)}
 <div class="p" style="left:572px;top:46px;width:358px;height:62px;padding:4px 6px;font-size:10px">${esc(p.text)}</div>
 <div class="p" style="left:572px;top:108px;width:358px;height:34px"></div><div class="p" style="left:932px;top:108px;width:338px;height:34px"></div>
 <div class="btn" data-a="zero" style="left:14px;top:148px;width:40px;height:178px;font-size:15px;font-weight:700;color:#333" title="Zero">&gt;0&lt;</div>
 <div class="btn" data-a="startstop" style="left:14px;top:332px;width:40px;height:294px">${dia}</div>`;
 if(S.editor)h+=editorHTML();else if(S.matrix)h+=matrixHTML();else if(S.quick)h+=quickHTML();
 else{const rows=convRows();h+=`<div class="p" style="left:58px;top:142px;width:322px;height:178px;background:#e9ebed;padding:8px 10px">${rows.map(k=>{const v=S.cur[k]??0;return`<div class="cur-row"><span>${k}</span><span>${v.toFixed(1).replace(".",",")}A</span><span class="bar"><i class="${v>2.8?"hi":""}" style="width:${Math.min(100,v/3.5*100)}%"></i></span><span>3,5A</span></div>`}).join("")}</div>
  <div class="p" style="left:58px;top:320px;width:322px;height:306px">${label2(S.last)}</div>
  <div class="p" style="left:380px;top:133px;width:306px;height:479px">${labelBox(S.last)}<span style="position:absolute;right:0;top:0;background:#3c63b5;color:#fff;font-size:9px;padding:0 4px">${p.lab}</span></div>
  <div class="p" style="left:686px;top:133px;width:452px;height:479px"><div style="position:absolute;left:8px;top:6px;font-size:12px;font-weight:700">⌂ NET</div><div style="position:absolute;left:0;right:0;top:170px;text-align:center;font-size:72px;font-weight:700">${f3(net).replace("-","−")}kg</div>${S.disp.cls&&S.disp.cls!=="OK"&&S.disp.net!=null?`<div style="position:absolute;left:0;right:0;top:270px;text-align:center;font-size:18px;color:#b42318;font-weight:700">${esc(S.disp.cls)}</div>`:""}${S.set.opmode==="Transport"?`<div style="position:absolute;left:0;right:0;top:300px;text-align:center;font-size:16px;color:#a35f00;font-weight:700">Transport operation</div>`:""}</div>`}
 h+=`<div class="p" style="left:1142px;top:105px;width:136px;height:495px;padding:2px 4px;overflow:hidden;font-size:8.6px;line-height:1.22">${S.list.slice(0,52).map(e=>`<div style="display:flex;justify-content:space-between;${e.neg?"background:#fde2df;color:#b42318;":""}${e.rej?"color:#9a9a9a;":""}"><span>${e.neg?"-":""}${e.c}</span><span>${e.neg?"-":""}${f4(e.w)}kg</span></div>`).join("")}</div>`;
 h+=softkeysHTML();
 h+=`<div class="key" data-a="auth" style="left:347px;width:64px" title="Authorization level">${KEY(40,"#222")}</div>
 <div class="key" data-a="quick" style="left:414px;width:64px"><b style="font-size:13px">▦▦</b>Quick</div>
 <div class="key" data-a="win" style="left:481px;width:64px" title="Two-line: show additional keys"><b style="font-size:16px">▭</b></div>
 <div class="key" data-a="info" style="left:626px;width:46px"><b style="font-family:Georgia,serif">i</b></div>
 <div class="key" data-a="clear" style="left:744px;width:64px"><b>←</b>Clear</div>
 <div class="key" data-a="home" style="left:811px;width:64px"><b>⇱</b>Home</div>
 <div class="key" data-a="enter" style="left:878px;width:64px"><b>↵</b>Enter</div>
 <div class="key" data-a="back" style="left:1013px;width:54px"><b>⎗</b>Back</div>`;
 if(S.twoLine)h+=`<div class="twoline">${[["x2nd","2nd.",S.mod.second],["xalt","ALT",S.mod.alt],["xshift","⇧ Shift",S.mod.shift],["xrec","R ⊙⊙ Record",false],["xfeed","Feed",false],["xprint","Print",false],["xpause","Pause",false]].map(([a,l,on])=>`<div class="key" data-a="${a}" style="position:relative;top:0;left:0;width:86px;height:40px;${on?"background:#111;color:#fff":""}">${l}</div>`).join("")}</div>`;
 if(S.rec||S.playing||S.awaitAssign||S.awaitPlay)h+=`<div class="macrobar">${S.awaitAssign?"⊙⊙ Press the key that should start the macro":S.awaitPlay?"⊙⊙ Press the macro's key":S.playing?"▶ ⊙⊙ Playing macro “"+esc(S.playing.m.name)+"”":"● ⊙⊙ Recording macro"+(S.rec.paused?" (paused)":"")+" · "+S.rec.steps.length+" steps · Shift + Record to end"}</div>`;
 h+=overlayHTML();
 if(S.level===0&&!S.dlg)h+=`<div class="standby"><div><b>Authorization level 0 · Standby</b><br><br>Display locked for cleaning. Pick a level; for an unprotected level enter 183.<br><br><div class="cbtn" data-a="auth" style="width:auto;padding:0 14px;height:36px;margin:0 auto;color:#222;font-size:12px;display:inline-flex">${KEY(26,"#222")} Authorization level</div></div></div>`;
 return h}
function softList(){return S.msgView&&!S.dlg?msgKeys():S.editor?edKeys():S.matrix?mxKeys():curList()}
let lastTouched=null;
function softkeysHTML(){if(S.softHidden)return"";
 const list=softList();const pages=Math.max(1,Math.ceil(list.length/8));if(S.page>=pages)S.page=0;
 const sl=list.slice(S.page*8,S.page*8+8);let h="";
 sl.forEach((k,i)=>{const x=347+i*83;const grey=typeof k.grey==="function"?k.grey():k.grey;
  let top;if(k.split){const cur=k.cur();top=`<span class="spl">${k.split.map(s=>`<span class="${s===cur?"on":""}">${esc(s)}</span>`).join("")}</span>`}
  else if(k.mac)top=`<span class="mac">${k.mac} ⊙⊙ ${k.prot?"#":""}</span>`;else if(k.val&&k.val()!=="")top=`<span class="v">${esc(k.val())}</span>`;else if(k.menu)top=`<span class="v">▸</span>`;else if(k.ico)top=`<span class="v">${k.ico}</span>`;else top=`<span class="v"></span>`;
  h+=`<div class="sk ${grey?"grey":""} ${lastTouched===k.label?"hl":""}" data-sk="${i}" style="left:${x}px">${top}<span class="lb">${esc(k.label)}</span></div>`});
 h+=`<div class="sk" data-a="etc" style="left:1013px;width:54px"><span class="v">${pages>1?(S.page+1)+"/"+pages:""}</span><span>⇆<br>ETC</span></div>`;
 if(S.level!==9&&!S.editor&&!S.msgView)h+=`<div class="path">${esc(["Main menu",...S.path].join(" / "))}</div>`;
 return h}
const WCROWS=[["wc","Weight class"],["lab","Labeling mode"],["stat","Statistics"],["art","Article parameters"],["stop","Automat stops after .."],["tot","Totalization"],["dp","Deactivate print!"]];
function wcCell(W,r,i){const c=W.cols[i];switch(r){
 case"wc":return esc(wcHead(W,i));
 case"lab":return`${esc(c.ltype)}<br><span class="sm">Weight ${c.weight?c.weight+" g":"0 (PLU)"}</span>`;
 case"stat":return`${esc(W.stype)}<br><span class="sm">LT ${W.lower} g · UT ${W.upper} g · To ${W.factor}</span>`;
 case"art":return`<span class="sm">Text field 1</span> ${c.txt1>0?c.txt1+" <span class=\"sm\">"+esc(shortT(DB.text[c.txt1]))+"</span>":"–"}<br><span class="sm">Shelf-life 1</span> ${c.life1||"–"}`;
 case"stop":return W.stops||0;case"tot":return c.totaliz;case"dp":return c.noprint?"☑":"☐"}}
function wcEditorHTML(){const E=S.editor,W=E.data;const sel=E.sel||[0,1];
 return`<div class="ed"><div class="h"><span>${E.job?"Weight class editor · current labeling":"Weight class data"} · ${E.id} · ${esc(W.name)}</span><span>${E.dirty?"● unsaved":"saved"} · ${W.cols.length} of ${S.set.wcCols} columns · Authorization level ${S.level}</span></div><div class="tb"><table class="wct"><tr><th data-cell="wc,-1" class="${sel[0]==="wc"&&sel[1]===-1?"cur":""}">Weight class</th>${W.cols.map((c,i)=>`<th data-cell="wc,${i}" class="${sel[0]==="wc"&&sel[1]===i?"cur":""}">${wcCell(W,"wc",i)}</th>`).join("")}</tr>
 ${WCROWS.slice(1).map(([r,lab])=>`<tr><td data-cell="${r},-1" class="rh ${sel[0]===r&&sel[1]===-1?"cur":""}">${lab}</td>${W.cols.map((c,i)=>`<td data-cell="${r},${i}" class="${sel[0]===r&&sel[1]===i?"cur":""}">${wcCell(W,r,i)}</td>`).join("")}</tr>`).join("")}</table>
 <div class="sm" style="padding:6px 8px">Tap a cell to select it, tap again (or Edit) to open its input window. Tap a row name to enter values for all weight classes (manual p. 312). The last column's range is set automatically.</div></div></div>`}
function wcEdit(r,i){const E=S.editor,W=E.data;const all=i===-1;const cols=all?W.cols:[W.cols[i]];const done=()=>{E.dirty=true;render()};
 if(all&&r!=="stat"&&r!=="stop"){}
 if(r==="wc"){if(all){toast("Select a single column to change its limit");return}const c=W.cols[i];if(c.up==null){toast("The range of the last column is entered automatically (manual p. 311)");return}
  const lo=i?W.cols[i-1].up:0,hi=W.cols[i+1]&&W.cols[i+1].up!=null?W.cols[i+1].up:99999;num(`Upper weight limit · column ${i+1}`,"g",c.up,v=>{v=Number(v);if(v===lo){W.cols.splice(i,1);toast("Range 0: column deactivated, neighbour adjusted");done();return}if(!(v>lo&&v<hi)){toast(`Enter a value between ${lo} and ${hi} g`);return}c.up=v;done()});return}
 if(r==="lab"){sel("Labeling mode",["Weight","Fixed price","Fixed weight","Fixed value","No labeling"],cols[0].ltype,v=>{cols.forEach(c=>c.ltype=v);if(v==="No labeling"){done();return}num("Weight (0 = PLU weight)","g",cols[0].weight,x=>{cols.forEach(c=>c.weight=Number(x)||0);done()})});return}
 if(r==="stat"){sel("Statistics",["Statistics type","Factor To(1...30)","Lower limit","Upper limit"],"",f=>{if(f==="Statistics type")sel("Statistics type",["no","FPV Europe","Weight determination","Contents control","Sliding content check","Weight sorting","free selection"],W.stype,v=>{W.stype=v;done()});else if(f.startsWith("Factor"))num("Factor To(1...30)","",W.factor,v=>{W.factor=Math.max(1,Math.min(30,Number(v)||3));done()});else{const k=f==="Lower limit"?"lower":"upper";num(f,"g",W[k],v=>{W[k]=Number(v)||0;done()})}});return}
 if(r==="art"){sel("Article parameters",["Text field 1","Shelf-life 1"],"",f=>{if(f==="Text field 1")sel("Text field 1"+(all?" · all classes":" · column "+(i+1)),["-1  none (use PLU text)"].concat(Object.keys(DB.text).map(n=>n+"  "+DB.text[n])),"",t=>{cols.forEach(c=>c.txt1=Number(t.split(" ")[0]));done()});else num("Shelf-life 1 (0 = PLU)","days",cols[0].life1,v=>{cols.forEach(c=>c.life1=Number(v)||0);done()})});return}
 if(r==="stop"){num("Automat stops after .. (0 = no check)","pcs",W.stops,v=>{W.stops=Number(v)||0;done()});return}
 if(r==="tot"){cols.forEach(c=>c.totaliz=c.totaliz==="with"?"without":"with");done();return}
 if(r==="dp"){cols.forEach(c=>c.noprint=!c.noprint);done();return}}
function wcAddCol(){const E=S.editor,W=E.data;if(W.cols.length>=S.set.wcCols){info("Weight class columns",`This table already has ${W.cols.length} columns, the number set under Processing › Weight class &statistics › Wgt class columns (service level). More than 3 columns needs the WEIGHT_CLASSES licence, which allows up to 80 (manual p. 310).`);return}
 let i=E.sel&&E.sel[1]>=0?E.sel[1]:1;if(W.cols[i].up==null)i=Math.max(0,i-1);const lo=i?W.cols[i-1].up:W.lower;const c=W.cols[i];const up=Math.round((lo+(c.up??W.upper))/2);
 W.cols.splice(i,0,Object.assign(clone(c),{up}));E.sel=["wc",i];E.dirty=true;toast(`Column added: ${wcHead(W,i)} and ${wcHead(W,i+1)}`);render()}
function mxCols(){if(S.set.totaliz==="Weight class-related"){const W=WC();if(!W)return[];return W.cols.map((c,i)=>{S.wcTot=S.wcTot||{};const T=S.wcTot[i]=S.wcTot[i]||{n:0,kg:0,val:0};return{key:i,kind:"wc",head:wcHead(W,i),pre:c.pre=c.pre||{type:"Weight",val:0},T,glob:c.glob!==false,obj:c}})}
 S.pluTot=S.pluTot||{};if(!S.pluTot[S.plu])S.pluTot[S.plu]={n:0,kg:0,val:0,pre:{type:"Pcs",val:P().pre1||0},glob:true};
 return Object.entries(S.pluTot).slice(0,40).map(([k,T])=>({key:Number(k),kind:"plu",head:pad6(k),pre:T.pre,T,glob:T.glob!==false,obj:T}))}
function matrixHTML(){const cols=mxCols(),M=S.matrix;const wc=S.set.totaliz==="Weight class-related";
 const td=(i,inner,cls)=>`<td data-mx="${i}" class="${M.sel===i?"cur":""} ${cls||""}">${inner}</td>`;
 return`<div class="ed"><div class="h"><span>Total preselection matrix · ${wc?"weight class-related · table "+P().wc:"PLU-related"}</span><span>Configure total / Presel. total / Preselect tot. matrix</span></div><div class="tb"><table class="wct mx">
 <tr><th class="rh">${wc?"Weight class":"PLU number<br>Customer number"}</th>${cols.map((c,i)=>`<th data-mx="${i}" class="${M.sel===i?"cur":""}">${esc(c.head)}${wc?"":"<br>---"}</th>`).join("")}</tr>
 <tr><td class="rh">Preset type<br>Preset total 1<span style="float:right;text-align:right">Weight<br>Price<br>Pc no.</span></td>${cols.map((c,i)=>td(i,`${c.pre.type}<br>${c.pre.type==="Weight"?c.pre.val+"g":"---"}<br>${c.pre.type==="Price"?"£"+f2(c.pre.val):"---"}<br>${c.pre.type==="Pcs"?c.pre.val:"---"}`,"num")).join("")}</tr>
 <tr><td class="rh">Value total 1<span style="float:right;text-align:right">Weight<br>Price<br>Pcs</span></td>${cols.map((c,i)=>td(i,`<br>${Math.round(c.T.kg*1000)}g<br>£${f2(c.T.val)}<br>${c.T.n}`,"num")).join("")}</tr>
 <tr><td class="rh">Print total 1 and clear it</td>${cols.map((c,i)=>`<td><div class="cbtn mxp" data-mxp="${i}" style="width:100%;height:34px"></div></td>`).join("")}</tr>
 <tr><td class="rh">Include<br>in global totalization process</td>${cols.map((c,i)=>`<td style="text-align:center"><span class="chk ${c.glob?"on":""}" data-mxg="${i}">${c.glob?"✓":""}</span></td>`).join("")}</tr></table>
 <div class="sm" style="padding:6px 8px">Totals here run in separate memories alongside the general totals (manual p. 299). Select a column, then use the softkeys to set its preset.</div></div></div>`}
function mxKeys(){const cols=mxCols(),c=cols[S.matrix.sel]||cols[0];const K=(label,o)=>Object.assign({label},o);return[
 K("Preset type",{val:()=>c?c.pre.type:"",run:()=>c&&sel("Preset type total 1",["Weight","Price","Pcs"],c.pre.type,v=>{c.pre.type=v;log(`Matrix ${c.head}: preset type ${v}`)})}),
 K("Preset total 1",{val:()=>c?c.pre.val:"",run:()=>c&&num(`Preset total 1 · ${c.head}`,c.pre.type==="Weight"?"g":c.pre.type==="Price"?"£":"pcs",c.pre.val,v=>{c.pre.val=Number(v)||0;log(`Matrix ${c.head}: preset total 1 = ${v}`);S.ev.mxPreset=true;checkDrills()})}),
 K("Print total 1 and clear it",{run:()=>c&&mxRelease(c.kind,c.key,"manual")}),
 K("Include in global",{split:["no","yes"],cur:()=>c&&c.glob?"yes":"no",run:()=>{if(c){c.obj.glob=!(c.glob)}}}),
 K("Close",{run:()=>{S.matrix=null}})]}
function editorHTML(){const E=S.editor;if(E.kind==="wc")return wcEditorHTML();const rows=edRows();
 return`<div class="ed"><div class="h"><span>${E.job?"Weight class editor · current labeling":esc(TNAME[E.kind])} · ${E.id}${E.isNew?" (new)":""}${E.kind==="plu"&&E.data.cust?" · "+esc(E.data.cust):""}</span><span>${E.dirty?"● unsaved":"saved"} · Authorization level ${S.level}</span></div><div class="tb"><table><tr><th>Attribute</th><th>Input</th><th>Value</th></tr>${rows.map((d,i)=>{const v=E.data[d[0]];const err=d[2]==="Parameters"&&v!==-1&&!DB[d[3]][v];return`<tr data-row="${i}" class="${i===E.cur?"cur":""}"><td>${esc(d[1])}</td><td>${d[2]}</td><td class="${err?"err":""}">${esc(fmtVal(d,v))}${err?" ✕ not found":""}</td></tr>`}).join("")}</table></div></div>`}
function quickHTML(){const custs=[...new Set(Object.values(DB.plu).map(p=>p.cust))].filter(Boolean);if(!S.quickTab)S.quickTab=custs.find(c=>c===P().cust)||custs[0];
 const ks=Object.keys(DB.plu).filter(k=>DB.plu[k].cust===S.quickTab);
 return`<div class="quick"><div class="tabsq">${custs.map(c=>`<button data-qt="${esc(c)}" class="${c===S.quickTab?"on":""}">${esc(c)}</button>`).join("")}</div><div class="qk">${ks.map(k=>`<button data-q="${k}"><b>${pad6(k)}</b><br>${esc(DB.plu[k].text)}</button>`).join("")}</div><div class="sm">Quick keys call up articles directly (manual p. 120). The real quick pages are set up in GT-SoftControl, so yours will be arranged differently.</div></div>`}
function msgKeys(){const K=(label,o)=>Object.assign({label},o);return[
 K("Cancel",{run:()=>{S.msgView=null}}),K("Enable",{run:msgEnable}),K("Accept all",{run:msgAll}),K("Close window",{run:()=>{S.msgView=null}}),
 K("Next message",{run:()=>{S.msgView.i=(S.msgView.i+1)%Math.max(1,openMsgs().length);S.msgView.m="t"}}),K("Details",{ico:"ETC",run:()=>{S.msgView.m="d"}}),K("Solve problem",{ico:"ETC",run:()=>{S.msgView.m="s"}}),K("Error list",{run:()=>{S.msgView.m="l"}})]}
function msgEnable(){const m=openMsgs()[S.msgView?.i||0];if(!m){S.msgView=null;return}if(m.id==="pluload"){toast("Only a successful article change clears this lock.");return}if(!MSG[m.id].ok()){toast("Cause still present: "+MSG[m.id].fix);return}m.c=true;log("Message acknowledged: "+MSG[m.id].t);S.msgView=openMsgs().length?{i:0,m:"t"}:null;checkDrills()}
function msgAll(){let n=0;openMsgs().forEach(m=>{if(m.id!=="pluload"&&MSG[m.id].ok()){m.c=true;n++}});log(`Accept all: ${n} cleared, package reset`);$$("#belt .pk").forEach(e=>e.remove());toast(`${n} cleared. Package reset: empty the belts.`);S.msgView=openMsgs().length?{i:0,m:"t"}:null;checkDrills()}
function overlayHTML(){const d=S.dlg;
 if(!d&&S.msgView){const L=openMsgs();if(!L.length){S.msgView=null;return""}const i=Math.min(S.msgView.i,L.length-1),m=L[i],M=MSG[m.id];
  let b=`<div><b>${esc(M.t)}</b>${M.sim?' <span class="sm">(trainer message)</span>':""}</div>`;
  if(S.msgView.m==="d")b+=`<div class="det"><b>Cause:</b> ${esc(M.cause)}${m.x?`<br><b>Details:</b> ${esc(m.x)}`:""}</div>`;
  if(S.msgView.m==="s")b+=`<div class="det"><b>Remedy:</b> ${esc(M.fix)}</div>`;
  if(S.msgView.m==="l")b+=`<div class="det">${L.map((x,j)=>`${j+1}. ${esc(MSG[x.id].t)}${MSG[x.id].lock?" (lock)":""}`).join("<br>")}</div>`;
  return`<div class="ov part"><div class="msgbox ${M.lock?"":"warn"}"><h4>${M.lock?"Process blocked":"Message"} ${i+1}/${L.length}</h4><div class="bd">${b}<div class="sm">Softkeys: Details, Solve problem, Enable. The Clear key shows messages again.</div></div></div></div>`}
 if(!d)return"";
 const btns=(okLabel)=>`<div style="display:grid;gap:6px;align-content:center"><div class="cbtn" data-a="dcancel">Cancel<span class="x">✕</span></div><div class="cbtn" data-a="dok">${okLabel||"OK"}<span class="ck">✓</span></div></div>`;
 if(d.k==="auth")return`<div class="ov"><div class="band"><div class="dbox" style="left:425px;top:24px;width:320px;height:182px"><div class="dlbl" style="width:86px">Authorization level</div><div class="lst" style="width:180px;height:170px">${d.opts.map((l,i)=>`<div data-li="${i}" class="${i===d.ix?"on":""}">${l===0?"0: ":l+" "}${LVN[l]}</div>`).join("")}</div>${btns()}</div>${keypad(true)}</div></div>`;
 if(d.k==="macro")return`<div class="ov"><div class="dbox macro" style="left:470px;top:60px;width:300px;height:470px;background:#f2f0e6;flex-direction:column"><div style="font-size:15px;text-align:center;border-bottom:1px solid #999;padding-bottom:6px">Macro menu</div><div style="display:flex;gap:10px;flex:1"><div class="lst mlst" style="width:170px">${MACRO_ITEMS.map((it,i)=>`<div data-li="${i}" class="${i===d.ix?"on":""} ${d.dis[i]?"dis":""}">${it}</div>`).join("")}</div><div style="display:grid;gap:8px;align-content:end"><div class="cbtn" data-a="dcancel" style="width:70px;height:50px">Cancel<span class="x">✕</span></div><div class="cbtn" data-a="dok" style="width:70px;height:50px">OK<span class="ck">✓</span></div></div></div></div></div>`;
 if(d.k==="sel")return`<div class="ov"><div class="band"><div class="dbox" style="left:300px;top:10px;width:600px;height:208px"><div class="dlbl">${esc(d.title)}</div><div class="lst" style="width:400px;height:194px">${d.opts.map((o,i)=>`<div data-li="${i}" class="${i===d.ix?"on":""}">${esc(o)}</div>`).join("")}</div>${btns()}</div></div></div>`;
 if(d.k==="chan"){const heads=LINE().heads;return`<div class="ov"><div class="chan"><div style="font-weight:700;margin-bottom:6px">Print chan. control · current labeling job (not saved in the database)</div><table><tr><th>Channel</th><th>Labeller</th><th>Setting</th></tr>${CHANS.map((c,i)=>{const h=heads.find(x=>x.ch===c);const v=h?d.work[c]:"not active";return`<tr data-li="${i}" class="${i===d.ix?"on":""}"><td>${c==="internal"?"Print chan. internal":"Print channel "+c}</td><td>${h?esc(h.name):"–"}</td><td>${esc(v)}</td></tr>`}).join("")}</table>
  <div style="display:flex;gap:8px;margin-top:8px;justify-content:flex-end"><div class="cbtn" data-a="chanset" style="width:auto;padding:0 10px">Change setting</div><div class="cbtn" data-a="dcancel" style="width:auto;padding:0 10px">Exit<span class="x">✕</span></div><div class="cbtn" data-a="chansave" style="width:auto;padding:0 10px">Save (yes)<span class="ck">✓</span></div></div></div></div>`}
 if(d.k==="num")return`<div class="ov"><div class="band"><div class="dbox" style="left:340px;top:50px;width:500px;min-height:110px;align-items:center"><div class="dlbl" style="width:140px">${esc(d.title)}</div><div style="display:grid;gap:6px"><div class="inp">${esc(d.val)}<span class="sm"> ${esc(d.unit)}</span></div>${d.extra.length?`<div style="display:flex;gap:6px">${d.extra.map((x,i)=>`<div class="cbtn" style="width:auto;padding:0 8px" data-x="${i}">${esc(x.label)}</div>`).join("")}</div>`:""}</div>${btns()}</div>${keypad(false)}</div></div>`;
 if(d.k==="conf"||d.k==="info")return`<div class="ov"><div class="band"><div class="dbox" style="left:280px;top:16px;width:620px;max-height:200px;flex-direction:column"><div style="font-weight:700;font-size:12px">${esc(d.title)}</div><div style="font-size:12px;background:#fff;border:1px solid #aaa;padding:8px;line-height:1.4;overflow:auto">${d.k==="info"?d.html:esc(d.text)}</div><div style="display:flex;gap:8px;justify-content:flex-end">${d.k==="conf"?`<div class="cbtn" data-a="dno" style="width:60px">no<span class="x">✕</span></div><div class="cbtn" data-a="dyes" style="width:60px">yes<span class="ck">✓</span></div>`:`<div class="cbtn" data-a="dcancel" style="width:60px">OK<span class="ck">✓</span></div>`}</div></div></div></div>`;
 if(d.k==="pw")return`<div class="ov"><div class="dbox" style="left:${d.mask?577:440}px;top:230px;width:${d.mask?126:400}px;flex-direction:column;gap:4px;padding:4px 6px"><div style="font-size:11px;font-weight:700">${esc(d.title)}</div><div class="inp" style="min-width:0;height:22px;font-size:13px">${d.mask?"•".repeat(d.val.length):esc(d.val)}</div><div style="display:flex;gap:4px;justify-content:flex-end"><div class="cbtn" data-a="dcancel" style="width:42px;height:28px">Cancel<span class="x">✕</span></div><div class="cbtn" data-a="dok" style="width:42px;height:28px">OK<span class="ck">✓</span></div></div></div>${qwerty(d)}</div>`;
 return""}
function keypad(auth){const ks=auth?["7","8","9","4","5","6","1","2","3","T","0",""]:["7","8","9","4","5","6","1","2","3","−","0","."];
 return`<div class="kp" style="left:1110px;top:${auth?30:20}px">${ks.map(k=>k?`<button data-kp="${k}">${k}</button>`:"<span></span>").join("")}${auth?"":`<button data-kp="⌫" style="grid-column:span 3">← Clear</button>`}</div>`}
function qwerty(d){const rows=[["1","2","3","4","5","6","7","8","9","0"],["Q","W","E","R","T","Y","U","I","O","P","Ü"],["A","S","D","F","G","H","J","K","L","Ö","Ä"],["Z","X","C","V","B","N","M",",",".","-"]];
 const sup={"1":"+","2":"\"","3":"=","5":"%","6":"&","7":"/","8":"(","9":")"};let h=`<div class="kbd">`;
 rows.forEach((r,ri)=>{r.forEach((k,i)=>{const x=434+i*44,y=10+ri*42;const lab=(/[A-ZÜÖÄ]/.test(k)&&!d.shift)?k.toLowerCase():k;h+=`<button data-kb="${k}" style="left:${x}px;top:${y}px;width:40px">${sup[k]?`<sup>${sup[k]}</sup>`:""}${lab}</button>`})});
 h+=`<button data-kb="ESC" style="left:345px;top:10px;width:64px">✕<br><span style="font-size:9px">Esc</span></button><button data-kb="2ND" style="left:345px;top:52px;width:64px">2nd.</button><button data-kb="SHIFT" style="left:345px;top:94px;width:64px;${d.shift?"background:#111;color:#fff":""}">⇧</button><button data-kb="ALT" style="left:345px;top:136px;width:64px">ALT</button>
 <button data-kb=" " style="left:434px;top:178px;width:92px"></button><button data-kb="BS" style="left:874px;top:136px;width:40px">←<br><span style="font-size:8px">Clear</span></button><button data-kb="ESC" style="left:830px;top:178px;width:40px">⇱<br><span style="font-size:8px">Home</span></button><button data-kb="OK" style="left:874px;top:178px;width:40px">✓<br><span style="font-size:8px">OK</span></button></div>`;
 return h}

/* ============================================================ manual panel */
function showManual(k){const ids=[];if(k.node)ids.push(...k.node.secs);if(k.sec){const i=MAN.findIndex(s=>s.num===k.sec);if(i>=0)ids.push(i)}
 const uniq=[...new Set(ids)].slice(0,3);const body=$("#manBody");
 if(!uniq.length){body.innerHTML=`<div class="t">${esc(k.label)}</div><div class="meta">No manual section is linked to this softkey${S.level===9?" (customer level 9 layout)":""}.</div>`;return}
 const pth=k.node?["Main menu",...S.path,k.label].join(" / "):"Level 9 · "+k.label;
 body.innerHTML=`<div class="meta" style="margin-bottom:4px">${esc(pth)}</div>`+uniq.map(i=>{const s=MAN[i];const lv=s.paths.map(p=>`manual level ${p.level??"?"} → site ${siteLv(p.level??s.levels[0])}: ${p.path.map(cleanTok).join(" / ")}`);return`<div class="sec"><div class="t">${esc(s.num)} ${esc(s.title)}</div><div class="meta">Manual p. ${s.page}${lv.length?" · "+esc(lv.slice(0,3).join(" | ")):""}</div><pre>${esc(s.text)}</pre></div>`}).join("")}

/* ============================================================ render */
function render(){if(!S)return;$("#stage").innerHTML=stageHTML();$("#pwrLed").classList.toggle("off",!S.power);
 const dv=LINE().dev[S.dev];$("#bezelInfo").textContent=`${LINE().model} · ${dv.bus}: ${dv.name} · BRAIN2 ${LINE().online===false?"offline: change data at this terminal":"online"} · ${LINE().note}`;
 renderQA();renderLog();if(!$("#tab-hw").hidden)renderHWState()}
function renderLines(){$("#lines").innerHTML=Object.entries(LINES).map(([k,L])=>`<button aria-pressed="${S&&S.key===k}" data-line="${k}"><b>${esc(L.tab)}</b>${esc(L.model)}</button>`).join("");
 $$("#lines [data-line]").forEach(b=>b.addEventListener("click",()=>useLine(b.dataset.line)));
 const L=LINE();$("#belt").innerHTML=[["Infeed (IC)",0],["Separation (SC)",16],["Weighing (WC)",32]].concat(L.heads.map((h,i)=>[h.name,48+i*16])).concat([["Ejector",88]]).map(([n,x])=>`<span class="z" style="left:${x}%">${esc(n)}</span>`).join("")}
function renderQA(){const L=S.lastPacks;$("#lineInfo").textContent=`${LINE().tab} · good packs in a row: ${S.good}`;
 $("#qa").innerHTML=`<table><tr><th>Cons.No.</th><th>Weight</th><th>Class</th><th>Print</th><th>Label pos.</th><th>Heads</th><th>Text 1</th><th>Ejected</th><th>Result</th></tr>${L.length?L.map(r=>`<tr><td>${r.c}</td><td>${f4(r.w)}</td><td>${r.cls}</td><td>${r.printed.length?r.l1:"–"}</td><td>${r.l1off==null?"–":(r.l1off===0?"on target":(r.l1off>0?"+":"")+r.l1off+" mm")}</td><td>${r.printed.join(", ")||"–"}</td><td title="${esc(r.t1)}">${r.printed.length?esc(shortT(r.t1))+` <span style="color:#5b6670">(${r.t1src==="wc"?"WC class "+r.t1cls:r.t1src==="job"?"job":r.t1src==="plu"?"PLU":"–"})</span>`:"–"}</td><td>${r.ej?"yes":"no"}</td><td class="${r.ok?"okc":"badc"}">${esc(r.note)}</td></tr>`).join(""):'<tr><td colspan="9" class="note">Press the green start key on the terminal to run packs. This is the check a line leader does by eye; the terminal itself does not show it.</td></tr>'}</table>`}
function renderLog(){const r=S.last;$("#lg1").innerHTML=r?`<div style="position:relative;height:300px;background:#fff;border:1px solid #e3e7ea;max-width:306px">${labelBox(r)}</div><div class="note">Cons.No. ${r.c} · ${r.printed.join(", ")} · ${fmtD(r.d2)} · ${f3(r.w)} kg</div>`:"No label yet.";
 const T=S.lastTotal;$("#lg2").innerHTML=T?`<div class="kv"><span>Total</span><span>${T.n}</span><span>PLU</span><span>${pad6(T.plu)}</span><span>Packs</span><span>${T.t.n}</span><span>Net weight</span><span>${f3(T.t.kg)} kg</span><span>End of Batch PLU</span><span>${T.eob||"–"}</span><span>Case size (price list)</span><span>${T.case||"–"}</span><span>Basket tare</span><span>${esc(T.basket||"–")}</span><span>Released</span><span>${T.at.toTimeString().slice(0,8)} by ${T.why}</span></div>`:"No total released yet.";
 $("#lgLog").innerHTML=S.log.map(l=>`<div>${esc(l)}</div>`).join("")||"<div>No events yet.</div>"}

/* ============================================================ stage events */
let explain=false;
function toggleExplain(){explain=!explain;$("#explain").setAttribute("aria-pressed",explain);$("#stageWrap").classList.toggle("explain",explain);toast(explain?"Explain ON (E): softkeys show their manual section and don't run":"Explain OFF (E): softkeys work normally")}
$("#explain").addEventListener("click",toggleExplain);
document.addEventListener("keydown",e=>{if(e.key!=="e"&&e.key!=="E")return;if(e.ctrlKey||e.metaKey||e.altKey)return;if(e.target&&e.target.closest&&e.target.closest("input,select,textarea"))return;if(S&&S.dlg)return;e.preventDefault();toggleExplain()});
function descOf(t){const D=t.dataset;if(D.qt)return{qt:D.qt};if(D.q)return{q:D.q};if(D.cell)return{cell:D.cell};if(D.mxp!=null)return{mxp:Number(D.mxp)};if(D.mxg!=null)return{mxg:Number(D.mxg)};if(D.mx!=null)return{mx:Number(D.mx)};if(D.row!=null)return{row:Number(D.row)};
 if(D.li!=null)return{li:Number(D.li)};if(D.kp!=null)return{kp:D.kp};if(D.kb!=null)return{kb:D.kb};if(D.x!=null)return{x:Number(D.x)};if(D.sk!=null){const k=softList()[S.page*8+Number(D.sk)];return k?{sk:k.label}:null}if(D.a)return{a:D.a};return null}
const NOREC=new Set(["xshift","xalt","x2nd","xrec","xfeed","xprint","xpause","win"]);
$("#stage").addEventListener("click",e=>{if(!S.power||S.boot>0)return;
 const t=e.target.closest("[data-a],[data-sk],[data-li],[data-kp],[data-kb],[data-x],[data-row],[data-q],[data-qt],[data-cell],[data-mx],[data-mxp],[data-mxg]");if(!t)return;
 const desc=descOf(t);if(!desc)return;
 if(S.awaitAssign&&!S.dlg&&(desc.sk||(desc.a&&!NOREC.has(desc.a)))){finishMacro(desc);return}
 if(S.awaitPlay&&!S.dlg&&(desc.sk||(desc.a&&!NOREC.has(desc.a)))){S.awaitPlay=false;const m=S.macros.find(m=>JSON.stringify(m.key)===JSON.stringify(desc));if(!m){toast("No macro on that key in this level");render();return}startMacro(m);return}
 if(S.rec&&!S.rec.paused&&!(desc.a&&NOREC.has(desc.a))){S.rec.steps.push(desc)}
 handle(desc)});
function findSk(label){const L=softList();const i=L.findIndex(k=>k.label===label);if(i<0)return null;S.page=Math.floor(i/8);return L[i]}
function handle(desc){const d=S.dlg;
 if(desc.qt){S.quickTab=desc.qt;render();return}
 if(desc.q){S.quick=false;callPLU(Number(desc.q));return}
 if(desc.cell){const [r,cs]=desc.cell.split(",");const c=Number(cs);const E=S.editor;if(!E)return;if(E.sel&&E.sel[0]===r&&E.sel[1]===c){if(c===-1&&r!=="wc")conf("Weight class table","Make the entry for all weight classes?",()=>wcEdit(r,-1));else wcEdit(r,c)}else{E.sel=[r,c];render()}return}
 if(desc.mx!=null){S.matrix.sel=desc.mx;render();return}
 if(desc.mxp!=null){const c=mxCols()[desc.mxp];if(c)mxRelease(c.kind,c.key,"manual");render();return}
 if(desc.mxg!=null){const c=mxCols()[desc.mxg];if(c)c.obj.glob=!c.glob;render();return}
 if(desc.row!=null){const i=desc.row;if(S.editor.cur===i)editRow();else{S.editor.cur=i;render()}return}
 if(desc.li!=null){if(!d)return;d.ix=desc.li;if(d.k==="macro"&&d.dis&&d.dis[d.ix])toast("Not available now");render();return}
 if(desc.kp!=null){padKey(desc.kp);return}
 if(desc.kb!=null){kbKey(desc.kb);return}
 if(desc.x!=null){const x=d.extra[desc.x];S.dlg=null;x.fn();render();return}
 const a=desc.a;
 if(a==="dcancel"){S.dlg=null;render();return}
 if(a==="dok"){dlgOK();return}
 if(a==="dyes"){S.dlg=null;d.yes();render();return}
 if(a==="dno"){S.dlg=null;if(d.no)d.no();render();return}
 if(a==="chanset"){const c=CHANS[d.ix];const h=LINE().heads.find(x=>x.ch===c);if(!h){toast("No labeller on this channel");return}const work=d.work;S.dlg=null;sel(`Print channel ${c==="internal"?"internal":c}`,CHAN_OPTS,work[c],v=>{work[c]=v;S.dlg={k:"chan",ix:CHANS.indexOf(c),work}});return}
 if(a==="chansave"){conf("Security check","Save the print channel settings for the current labeling job?",()=>{Object.entries(d.work).forEach(([c,v])=>{const h=LINE().heads.find(x=>x.ch===c);if(h){S.heads[h.id].chan=v;S.heads[h.id].pairActive=null}});log("Print chan. control saved: "+Object.entries(d.work).map(([c,v])=>c+"="+v).join(", "));S.ev.chan=true;checkDrills()});return}
 if(d)return;
 if(desc.sk!=null){if(S.level===0)return;const k=findSk(desc.sk);if(!k){toast(`Softkey “${desc.sk}” is not on this screen`);if(S.playing)abortMacro("step not possible");render();return}lastTouched=k.label;showManual(k);
  if(explain&&!S.msgView&&!S.editor&&!S.playing){render();return}
  const grey=typeof k.grey==="function"?k.grey():k.grey;if(grey){toast(k.label==="LB1 susp. path"?"Display only at level 9. Change it at level 1 or higher: Device menu / LB1 susp. path":"Display only at this level");render();return}
  if(k.menu){S.path.push(k.label);S.page=0;render();return}
  if(k.run)k.run();render();return}
 if(a==="xshift"){S.mod.shift=!S.mod.shift;render();return}
 if(a==="xalt"){S.mod.alt=!S.mod.alt;render();return}
 if(a==="x2nd"){S.mod.second=!S.mod.second;render();return}
 if(a==="xrec"){if(S.mod.shift){S.mod.shift=false;macroMenu();return}if(S.mod.second){S.mod.second=false;copyMacroToSoftkey();return}if(S.mod.alt){S.mod.alt=false;toast("Alt + Record: edit softkey design (not simulated)");render();return}if(!S.macros.length){toast("No macros recorded in this level yet. Shift + Record opens the macro menu.");return}S.awaitPlay=true;toast("Record: press the key assigned to the macro");render();return}
 if(a==="xfeed"){const h=LINE().heads[0];const st=S.heads[h.id];if(st.head||st.roll.left<=0){toast("Cannot feed: check the printer");return}st.roll.left--;log("Blank label fed");render();return}
 if(a==="xprint"){if(!P()||locked()){toast("Printing not possible now");return}pack(P());return}
 if(a==="xpause"){if(S.running)stop("Pause");else toast("Nothing to pause");return}
 if(a==="auth"){authDlg();return}
 if(a==="dev"){if(LINE().dev.length>1){S.dev=(S.dev+1)%LINE().dev.length;log("Operating connection: "+LINE().dev[S.dev].name);toast("Operating connection switched to "+LINE().dev[S.dev].name);S.ev.devSwitch=true;render();checkDrills()}return}
 if(S.level===0)return;
 if(a==="startstop"){S.running?stop("Stop"):start();return}
 if(a==="zero"){if(S.running){toast("Stop the automat before zero setting");return}if(Math.abs(S.drift)>0.12){toast("Outside zero-setting range (±2 % of max). Clean the weighing belt.");return}S.drift=0;S.disp.net=null;log("Zero setting");toast("Scale set to zero");render();checkDrills();return}
 if(a==="lang"){SPECIAL["Operator language"].run();return}
 if(a==="lblkey"){info("Key under the flag","This key's function couldn't be identified from the photos. Tap it on the real terminal and send a photo of what opens, and I'll add it.");return}
 if(a==="quick"){S.quick=!S.quick;S.editor=null;S.matrix=null;render();return}
 if(a==="win"){S.twoLine=!S.twoLine;render();return}
 if(a==="info"){info("Information",`Software ID: GLM-I (simulated)<br>Device ${LINE().dev[S.dev].bus}: ${esc(LINE().dev[S.dev].name)}<br>Maximum belt speed: 60 m/min<br>Operating hours: labels this session ${S.seq}<br>History of messages: ${S.msgs.length} entries`);return}
 if(a==="clear"){if(openMsgs().length){S.msgView={i:0,m:"t"};render()}else toast("No messages");return}
 if(a==="home"){S.path=[];S.page=0;S.quick=false;S.msgView=null;S.matrix=null;if(S.editor&&!S.editor.dirty)S.editor=null;render();return}
 if(a==="back"){if(S.msgView)S.msgView=null;else if(S.quick)S.quick=false;else if(S.matrix)S.matrix=null;else if(S.editor){if(!S.editor.dirty)S.editor=null;else toast("Save or close the table first")}else{S.path.pop();S.page=0}render();return}
 if(a==="enter"){if(S.editor){if(S.editor.kind==="wc"){const s=S.editor.sel||["wc",1];wcEdit(s[0],s[1])}else editRow();return}const l=curList()[S.page*8];if(l&&l.menu){S.path.push(l.label);render()}return}
 if(a==="etc"){S.page++;render();return}
}
/* ---------------- macros (manual 10.4) */
const MACRO_ITEMS=["Recording start","Recording pause","Recording end","Append recording","Delete macro","List macros","Recording delay","One-time delay","Abort macro","Exit macro menu"];
function macroMenu(){const r=!!S.rec,pl=!!S.playing,has=S.macros.length>0;
 const dis=[r||pl,!r,!r,r||pl||!has,r||!has,r,false,true,!pl,false];S.dlg={k:"macro",ix:dis.findIndex(x=>!x),dis};render()}
function macroChoose(item){
 if(item==="Recording start"){S.rec={steps:[],paused:false,level:S.level};S.recBase={level:S.level,path:S.path.slice()};log("Macro recording started");toast("Recording: operate the device. Shift + Record to end.");return}
 if(item==="Recording pause"){S.rec.paused=!S.rec.paused;toast(S.rec.paused?"Recording paused":"Recording resumed");return}
 if(item==="Recording end"){if(!S.rec.steps.length){S.rec=null;toast("Nothing recorded");return}S.awaitAssign=true;toast("Press the key that should start the macro (a softkey or a key below the screen)");return}
 if(item==="Append recording"){sel("Append to macro",S.macros.map(m=>m.name),"",n=>{const m=S.macros.find(x=>x.name===n);S.rec={steps:m.steps.slice(),paused:false,append:m};toast("Recording appended steps. Shift + Record to end.")});return}
 if(item==="Delete macro"){sel("Delete macro",S.macros.map(m=>m.name+(m.pw?" #":"")),"",n=>{const m=S.macros.find(x=>x.name===n.replace(/ #$/,""));const go=()=>{S.macros=S.macros.filter(x=>x!==m);log("Macro deleted: "+m.name)};if(m.pw)pw(v=>{if(v===m.pw)go();else toast("Wrong password")});else go()});return}
 if(item==="List macros"){const L=S.macros.map(m=>`${keyName(m.key)}  ${m.name}${m.pw?" #":""}`).concat(["(level 9) P  plu change #","(level 9) m  "+macroLabel()+" #","(level 9) f  RESET"]);sel("Macros in this mode level",L,"",v=>{const m=S.macros.find(x=>v.includes(x.name)&&!v.startsWith("(level 9)"));if(!m){toast("Built-in customer macro: start it from its softkey on level 9");return}sel(m.name,["Start macro","Delete macro","Rename macro","Exit macro menu"],"Start macro",c=>{if(c==="Start macro")startMacro(m);if(c==="Delete macro"){S.macros=S.macros.filter(x=>x!==m);log("Macro deleted: "+m.name)}if(c==="Rename macro")textIn("Macro name (max. 15 characters)",m.name,n=>{m.name=n.slice(0,15)})})});return}
 if(item==="Recording delay"){num("Recording delay (play delay)","ms",S.macroDelay,v=>{S.macroDelay=Math.max(0,Number(v)||0)});return}
 if(item==="Abort macro"){abortMacro("aborted");return}}
function keyName(k){return k.sk?"softkey “"+k.sk+"”":k.a?"key "+k.a:"?"}
function finishMacro(key){S.awaitAssign=false;const steps=S.rec.steps;const app=S.rec.append;S.rec=null;
 if(app){app.steps=steps;log("Macro extended: "+app.name);toast("Macro saved");render();return}
 S.dlg=null;textIn("Macro name (max. 15 characters)","",n=>{n=(n||"Macro").slice(0,15);S.dlg=null;textIn("Macro password (leave empty for none)","",p=>{S.macros.push({name:n,steps,key,pw:p||"",level:S.level});log(`Macro “${n}” saved on ${keyName(key)} with ${steps.length} steps`);toast(`Macro “${n}” saved. Record + ${keyName(key)} plays it.`);S.ev.macroSaved=true;checkDrills()})});render()}
function startMacro(m){const go=()=>{S.playing={m,i:0};log("Macro started: "+m.name);render();stepMacro()};if(m.pw)pw(v=>{if(v===m.pw)go();else toast("Wrong password")},"Macro password");else go()}
function stepMacro(){const P_=S.playing;if(!P_)return;if(P_.i>=P_.m.steps.length){log("Macro finished: "+P_.m.name);S.playing=null;S.ev.macroPlayed=true;checkDrills();render();return}
 const st=P_.m.steps[P_.i++];try{handle(st)}catch(e){abortMacro("error");return}setTimeout(stepMacro,Math.max(60,S.macroDelay))}
function abortMacro(why){if(!S.playing)return;log("Macro "+why+": "+S.playing.m.name);S.playing=null;toast("Macro "+why);render()}
function copyMacroToSoftkey(){if(S.level!==9){toast("Copying macros to softkeys works in mode level T (your level 9), manual p. 124");return}if(!S.macros.length){toast("No macro to copy");return}
 sel("Copy macro to an empty softkey",S.macros.map(m=>m.name),"",n=>{const m=S.macros.find(x=>x.name===n);S.l9extra=S.l9extra||[];S.l9extra.push({label:m.name,macro:m.name});log(`Macro “${m.name}” copied to a level 9 softkey`);toast("Copied to a softkey on the last level 9 page");S.ev.macroCopied=true;checkDrills()})}
function dlgOK(){const d=S.dlg;if(!d)return;
 if(d.k==="auth"){const l=d.opts[d.ix];S.dlg=null;setLevel(l);render();return}
 if(d.k==="sel"){const v=d.opts[d.ix];S.dlg=null;d.ok(v);render();return}
 if(d.k==="macro"){if(d.dis[d.ix]){toast("Not available now");return}const it=MACRO_ITEMS[d.ix];S.dlg=null;if(it!=="Exit macro menu")macroChoose(it);render();return}
 if(d.k==="num"||d.k==="pw"){const v=d.val;S.dlg=null;d.ok(v);render();return}
 S.dlg=null;render()}
function padKey(k){const d=S.dlg;if(!d)return;
 if(d.k==="auth"){const i=d.opts.indexOf(k==="T"?9:Number(k));if(i>=0)d.ix=i;render();return}
 if(d.fresh){d.val="";d.fresh=false}
 if(k==="⌫")d.val=d.val.slice(0,-1);else if(k==="−")d.val=d.val.startsWith("-")?d.val.slice(1):"-"+d.val;else d.val+=k;render()}
function kbKey(k){const d=S.dlg;if(!d)return;
 if(k==="ESC"){S.dlg=null;render();return}if(k==="OK"){dlgOK();return}
 if(k==="SHIFT"){d.shift=!d.shift;render();return}if(k==="2ND"||k==="ALT")return;
 if(k==="BS")d.val=d.val.slice(0,-1);else d.val+=(/[A-ZÜÖÄ]/.test(k)&&!d.shift)?k.toLowerCase():k;render()}
document.addEventListener("keydown",e=>{if(!S)return;const d=S.dlg;if(!d||(e.target&&e.target.closest&&e.target.closest("input,select,textarea")))return;
 if(e.key==="Escape"){S.dlg=null;render();e.preventDefault();return}
 if(e.key==="Enter"){dlgOK();e.preventDefault();return}
 if(d.k==="sel"||d.k==="auth"||d.k==="chan"){const n=d.k==="chan"?8:d.opts.length;if(e.key==="ArrowDown"){d.ix=Math.min(n-1,d.ix+1);render();e.preventDefault()}else if(e.key==="ArrowUp"){d.ix=Math.max(0,d.ix-1);render();e.preventDefault()}else if(d.k==="auth"&&/^[0-9]$/.test(e.key))padKey(e.key);return}
 if(d.k!=="num"&&d.k!=="pw")return;
 if(e.key==="Backspace"){if(d.fresh){d.val="";d.fresh=false}d.val=d.val.slice(0,-1);render();e.preventDefault();return}
 if(e.key.length===1){if(d.k==="num"){if(!/[0-9.\-]/.test(e.key))return;if(d.fresh){d.val="";d.fresh=false}}d.val+=e.key;render();e.preventDefault()}});

/* motor currents + boot timer */
setInterval(()=>{if(!S)return;if(S.boot>0){S.boot=Math.max(0,S.boot-10);if(S.boot===0){log("Device ready");S.ev.booted=true;checkDrills()}render();return}
 const r=S.running,j=()=>(Math.random()-.5)*.1;const jam=S.lastPacks[0]&&S.lastPacks[0].l1==="Jammed";
 const tg=r?{IC:.6+S.set.speed/100,SC:.8+S.set.speed/90,WC:.5,"LC 1":jam?3.1:.9,"LC 2":.7}:{IC:0,SC:0,WC:.1,"LC 1":.1,"LC 2":.4};
 let ch=false;for(const k in tg){const n=Math.max(0,+(tg[k]+(r?j():0)).toFixed(1));if(n!==S.cur[k]){S.cur[k]=n;ch=true}}if(ch&&!S.dlg&&!S.editor&&!S.quick&&S.power)render()},1200);
let viewMode=store.get("viewMode","laptop");
function setMode(m){viewMode=m;store.set("viewMode",m);document.body.classList.toggle("laptop",m==="laptop");$("#mLaptop").setAttribute("aria-pressed",m==="laptop");$("#mDesk").setAttribute("aria-pressed",m!=="laptop");fit();setTimeout(fit,30)}
function fit(){const term=$("#term"),wrap=$("#stageWrap"),bez=$(".bezel");let s;
 if(viewMode==="laptop"){
  const top=term.getBoundingClientRect().top+window.scrollY;const chrome=(bez.querySelector(".brand").offsetHeight||22)+16;
  const availH=Math.max(300,window.innerHeight-top-chrome-10);const availW=term.parentElement.clientWidth;
  const sH=availH/768;const side=availW-1280*sH-24>=300;term.classList.toggle("side",side);
  const maxW=side?availW-24-300:availW-20;s=Math.min(sH,maxW/1280,1.35);
  wrap.style.width=(1280*s)+"px";
  const man=$("#man");if(side){man.style.height=(768*s+chrome)+"px"}else man.style.height="";
 }else{term.classList.remove("side");wrap.style.width="";$("#man").style.height="";const w=wrap.clientWidth||1280;s=Math.min(1,w/1280)}
 $("#stage").style.transform=`scale(${s})`;wrap.style.height=(768*s)+"px"}
$("#mLaptop").addEventListener("click",()=>setMode("laptop"));$("#mDesk").addEventListener("click",()=>setMode("desktop"));
window.addEventListener("resize",fit);

/* ============================================================ hardware view */
let hwSel="lab0";
const ROLL_STEPS=[["door","Open the right side door of the labeller"],["pivot","Lift the safety catch (or press the stop bolt) and pivot the labelling system to the left"],["head","Open the print head: turn the pivot lever (EcoMotion: against the arrows)"],["rollers","EcoMotion: open the pressure rollers in front of the take-up arbor (pull out pivot lever, turn anticlockwise)"],["remove","Remove the backing paper from the take-up and the empty core"],["insert","Push the new label roll onto the roll holder, labels facing outwards"],["thread","Thread the label strip through the printer and around the dispenser edge to the take-up"],["rollersC","Close the pressure rollers: turn the pivot lever clockwise until the catch engages"],["headC","Close the print head"],["pivotC","Pivot the labelling system back until the catch engages"],["doorC","Close the side door"]];
function headAt(i){return LINE().heads[i]}
const STEPFIG=["setsys","catch","pivot","rollopen","rolltake","takeupdev","insert","rollclose","pivot2","catch",null];
const FIGMAP={lab:["opfield","pkgheight","manmove","ruler","turn","eco","openhead","cleanhead","guiderolls","closehead","rollwidth","felt","printimg","labdist"],cab:["mainsw","device"],gt:["screen"],wc:["device","dims"],cell:["device","dims"],ic:["rails","railsoff"],sc:["rails","railsoff"],out:["ejector","pusher"],lc:["pressview","swivel","vbelt","line"],lb1:["labdist"],air:["setsys"],estop:["device"],lamp:["device"]};
function figHTML(ids,big){return`<div class="figs">${ids.filter(i=>FIGS[i]).map(i=>{const f=FIGS[i];return`<button class="fig ${big?"big":""}" data-fig="${i}" title="${esc(f.cap)}"><img src="${f.src}" alt="${esc(f.cap)}" loading="lazy"><span>${esc(f.cap.replace(/^Illustration \d+: /,""))}${f.page?" · p."+f.page:""}</span></button>`}).join("")}</div>`}
function hwSVG(){const L=LINE(),n=L.heads.length,W=900,H=330;const x0=30;
 const comps=[];
 const box=(id,x,y,w,h,fill,label,extra)=>`<g class="comp ${hwSel===id?"sel":""}" data-hw="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="#55606b" stroke-width="1.5"/>${extra||""}<text x="${x+w/2}" y="${y+h+14}" text-anchor="middle">${esc(label)}</text></g>`;
 let s=`<svg class="hwsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(L.model)} line schematic">`;
 s+=`<rect x="0" y="232" width="${W}" height="6" fill="#c5ccd3"/>`;
 const belts=[["ic","IC Infeed",x0,110],["sc","SC Separation",x0+120,110],["wc","WC Weighing",x0+240,140]];
 let bx=x0+390;L.heads.forEach((h,i)=>{belts.push(["lc"+i,h.conv+" Labeling",bx,140]);bx+=150});belts.push(["out","Outfeed / ejector",bx,120]);
 belts.forEach(([id,lab,x,w])=>{const cur=id==="wc"?S.cur.WC:id==="ic"?S.cur.IC:id==="sc"?S.cur.SC:0;s+=box(id,x,200,w,22,id==="wc"&&S.beltDirty?"#c9b48a":"#5b84c4",lab,`<line x1="${x+6}" y1="211" x2="${x+w-6}" y2="211" stroke="#fff" stroke-dasharray="6 6" stroke-width="2" opacity=".6"/>`)});
 s+=`<text x="${x0+241}" y="144" text-anchor="middle">LB1</text>`;s+=box("lb1",x0+236,150,10,48,S.lbDirty?"#a07a3a":"#e8e8e8","",`<circle cx="${x0+241}" cy="160" r="3" fill="${S.lbDirty?"#7a5a22":"#e53935"}"/>`);
 s+=box("cell",x0+290,252,40,12,"#7a7f85","Load cell");s+=`<line x1="${x0+310}" y1="222" x2="${x0+310}" y2="252" stroke="#7a7f85" stroke-width="3"/>`;
 L.heads.forEach((h,i)=>{const st=S.heads[h.id];const x=x0+400+i*150,y=40+(140-st.height)*.35;const roll=st.roll.left/st.roll.cap;
  s+=box("lab"+i,x,y,110,110,st.door?"#dfe7ef":"#c9d1d8",h.name,`<circle cx="${x+35}" cy="${y+38}" r="${8+20*roll}" fill="#f4e6a8" stroke="#8a7a3a"/><circle cx="${x+35}" cy="${y+38}" r="6" fill="#3a9a4a"/><rect x="${x+66}" y="${y+60}" width="34" height="14" fill="${st.head?"#e53935":"#2b2d30"}"/><text x="${x+83}" y="${y+71}" text-anchor="middle" style="fill:#fff;font-size:8px">${st.head?"OPEN":"head"}</text>${h.wrap?`<path d="M${x+20} ${y+110} v12 h70 v-12" fill="none" stroke="#1f5c94" stroke-width="3"/>`:""}<text x="${x+55}" y="${y+102}" text-anchor="middle" style="font-size:9px">${st.roll.left} lbl · ${esc(st.chan.replace(" change on paper end"," (paper end)").slice(0,26))}</text>`);
  s+=`<line x1="${x+55}" y1="${y+110}" x2="${x+55}" y2="196" stroke="#8a939c" stroke-dasharray="3 3"/>`});
 s+=box("cab",x0,20,90,120,"#d7dce1","Control cabinet",`<circle cx="${x0+45}" cy="70" r="16" fill="${S.power?"#f2b705":"#888"}" stroke="#333" stroke-width="2"/><rect x="${x0+42}" y="56" width="6" height="28" fill="#c62828" transform="rotate(${S.power?0:-90} ${x0+45} 70)"/><text x="${x0+45}" y="104" text-anchor="middle" style="font-size:9px">${S.power?"ON":"OFF"}</text>`);
 s+=box("gt",x0+130,40,90,62,"#2b2d30","GT terminal",`<rect x="${x0+136}" y="46" width="78" height="50" fill="${S.power?"#dde1e5":"#111"}"/>`);
 s+=box("estop",x0+250,60,40,40,"#f2d300","E-stop",`<circle cx="${x0+270}" cy="80" r="14" fill="${S.estop?"#8a1a12":"#e53935"}" stroke="#600" stroke-width="2"/>`);
 s+=box("air",x0+310,60,56,40,"#e8eaed","Air unit",`<circle cx="${x0+338}" cy="80" r="14" fill="#fff" stroke="#333"/><line x1="${x0+338}" y1="80" x2="${x0+338+12*Math.cos(Math.PI*(1-(S.air?S.airBar:0)/10))}" y2="${80-12*Math.sin(Math.PI*(1-(S.air?S.airBar:0)/10))}" stroke="${S.air&&S.airBar>=4?"#1d7a3b":"#c62828"}" stroke-width="2.5"/>`);
 s+=box("lamp",W-60,20,24,60,"#d7dce1","Lamps",`<circle cx="${W-48}" cy="34" r="7" fill="${locked()?"#e53935":"#5a1a1a"}"/><circle cx="${W-48}" cy="52" r="7" fill="${openMsgs().length&&!locked()?"#f2b705":"#5a4a10"}"/><circle cx="${W-48}" cy="70" r="7" fill="${S.running?"#2ecc40":"#1a4a22"}"/>`);
 s+=`</svg>`;return s}
function hwPanel(){const L=LINE();const sel=hwSel;let h="";
 const st=sel.startsWith("lab")?S.heads[headAt(Number(sel.slice(3))).id]:null;
 if(st){const hd=headAt(Number(sel.slice(3)));const done=st.steps;
  h+=`<h3>${esc(hd.name)}</h3><div class="kv"><span>Channel</span><span>${hd.ch==="internal"?"Print chan. internal":"Print channel "+hd.ch} · ${esc(st.chan)}</span><span>Label roll</span><span>${st.roll.left} of ${st.roll.cap}</span><span>Print head</span><span>${st.head?"open":"closed"}</span><span>Labeller height</span><span>${st.height} mm (package ${geo().pkh} mm)</span><span>Vacuum</span><span>${st.vac?"OK":"fault"}</span></div>
  ${STEPFIG[done.length]&&FIGS[STEPFIG[done.length]]?`<div class="stepfig"><div class="note"><b>Next: step ${done.length+1}</b> · ${esc(ROLL_STEPS[done.length][1])}</div><button class="fig big" data-fig="${STEPFIG[done.length]}"><img src="${FIGS[STEPFIG[done.length]].src}" alt="${esc(FIGS[STEPFIG[done.length]].cap)}"><span>${esc(FIGS[STEPFIG[done.length]].cap)} · manual p.${FIGS[STEPFIG[done.length]].page}</span></button></div>`:""}
  <h3>Change label roll · manual p. 58</h3><div class="steps">${ROLL_STEPS.map(([k,t],i)=>`<button data-step="${i}" class="${done.includes(i)?"done":""}"><span class="n">${done.includes(i)?"✓":i+1}</span><span>${esc(t)}</span></button>`).join("")}</div>
  <div class="ctl"><button data-hwa="headtog">${st.head?"Close print head":"Open print head"}</button><button data-hwa="up">Height ▲ +5 mm</button><button data-hwa="down">Height ▼ −5 mm</button><button data-hwa="vac">${st.vac?"Block vacuum nozzle":"Clear vacuum nozzle"}</button><button data-hwa="low">Set roll to 30 labels</button></div>
  <p class="note">Height keys on the labeller front: up, down, stop (manual p. 46). The labeller must clear the package; too high and air-jet labels drift.</p>`}
 else if(sel==="cab")h+=`<h3>Main switch · control cabinet</h3><p class="note">Switch off at the main switch for imminent danger and for cleaning outside the cabinet. Compressed air stays on when the device is off (manual p. 35). After switching on, allow 20 minutes before production (p. 334).</p><div class="ctl"><button data-hwa="power">${S.power?"Switch OFF":"Switch ON"}</button></div>`;
 else if(sel==="estop")h+=`<h3>Emergency stop</h3><p class="note">Stops all drives. Release it, then acknowledge the message on the terminal.</p><div class="ctl"><button data-hwa="estop">${S.estop?"Release E-stop":"Press E-stop"}</button></div>`;
 else if(sel==="air")h+=`<h3>Compressed air</h3><div class="kv"><span>Supply</span><span>${S.air?"on":"off"}</span><span>Pressure</span><span>${S.air?S.airBar.toFixed(1):"0.0"} bar</span></div><div class="ctl" style="margin-top:6px"><button data-hwa="air">${S.air?"Close air valve":"Open air valve"}</button><button data-hwa="airlow">Drop pressure to 3 bar</button><button data-hwa="airok">Set 6 bar</button></div>`;
 else if(sel==="lb1")h+=`<h3>Light barrier LB1</h3><p class="note">Detects the leading edge of each package. LB1 susp. path masks it after the first edge so bag film or holes don't trigger it twice (manual p. 264).</p><div class="kv"><span>State</span><span>${S.lbDirty?"dirty: misses edges":"clean"}</span><span>LB1 susp. path</span><span>${S.set.lb1} mm (package ${geo().len} mm)</span></div><div class="ctl" style="margin-top:6px"><button data-hwa="lbclean">Clean light barrier</button><button data-hwa="lbdirty">Smear with fat</button></div>`;
 else if(sel==="wc"||sel==="cell")h+=`<h3>Weighing conveyor</h3><div class="kv"><span>Belt</span><span>${S.beltDirty?"dirty (product residue)":"clean"}</span><span>Zero offset</span><span>${Math.round(S.drift*1000)} g</span><span>Verification</span><span>Max 3/6 kg · Min 50 g · e = 1/2 g</span></div><div class="ctl" style="margin-top:6px"><button data-hwa="clean">Clean weighing belt</button><button data-hwa="dirty">Leave product residue</button></div><p class="note">Zero setting works within ±2 % of max (manual p. 66). Belts lift out with a quick clamp for cleaning.</p>`;
 else if(sel==="gt")h+=`<h3>GT terminal</h3><div class="kv"><span>BRAIN2</span><span>${L.online===false?"offline (BRAIN2 can only read this line)":"online"}</span></div><div class="ctl" style="margin:6px 0"><button data-hwa="brain">BRAIN2 download to this line</button></div><p class="note">${esc(L.model)}. ${L.dev.length>1?"Tap the red device bar on the screen to switch the operating connection between "+L.dev.map(d=>d.name).join(" and ")+" (system bus).":"One device on the system bus."}</p>`;
 else if(sel==="lamp")h+=`<h3>Signal lamps</h3><p class="note">Red: processing blocked. Amber: message waiting (e.g. Paper supply?). Green: automat running. Your line's lamp assignment may differ (manual p. 269 "Paper status signal lamp").</p>`;
 else h+=`<h3>${esc(sel.toUpperCase())} conveyor</h3><div class="kv"><span>Motor current</span><span>${(S.cur[sel==="ic"?"IC":sel==="sc"?"SC":"LC 1"]??0).toFixed(1)} A of 3.5 A</span><span>Speed</span><span>${S.set.speed} m/min labeling · ${S.set.conv} m/min conveying</span><span>Separation factor</span><span>${S.set.sepf}</span></div>`;
 const key=sel.startsWith("lab")?"lab":sel.startsWith("lc")?"lc":sel;
 if(FIGMAP[key])h+=`<h3>Manual drawings</h3>${figHTML(FIGMAP[key])}`;
 return h}
function conf2(title,text,yes){if(window.confirm===undefined){yes();return}S.dlg={k:"conf",title,text,yes};render();toast("Confirm on the terminal screen")}
function renderHW(){const el=$("#tab-hw");const L=LINE();
 el.innerHTML=`<h2>${esc(L.tab)} · ${esc(L.model)}</h2><p class="note">${esc(L.note)} Tap a part to see its state and what you can do to it. Changes here feed straight into the simulation.</p><div class="hw"><div><div id="hwSvg"></div><h3>From the manual</h3>${figHTML(["photo","device","line","screen"],true)}<p class="note">Illustration 1 numbers the main parts of the device. Tap any drawing to enlarge it.</p></div><div id="hwPanel"></div></div>
 <h3>All hardware drawings in the manual</h3>${figHTML(Object.keys(FIGS))}`;
 renderHWState()}
function renderHWState(){const a=$("#hwSvg"),b=$("#hwPanel");if(!a)return;a.innerHTML=hwSVG();b.innerHTML=hwPanel()}
function lightbox(id){const f=FIGS[id];if(!f)return;let lb=$("#lb");if(!lb){lb=document.createElement("div");lb.id="lb";lb.setAttribute("role","dialog");document.body.appendChild(lb);lb.addEventListener("click",()=>{lb.hidden=true})}
 lb.innerHTML=`<figure><img src="${f.src}" alt="${esc(f.cap)}"><figcaption>${esc(f.cap)}${f.page?" · manual p."+f.page:""} · tap or Esc to close</figcaption></figure>`;lb.hidden=false}
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#lb")&&!$("#lb").hidden)$("#lb").hidden=true});
$("#tab-hw").addEventListener("click",e=>{const fg=e.target.closest("[data-fig]");if(fg){lightbox(fg.dataset.fig);return}const c=e.target.closest("[data-hw]");if(c){hwSel=c.dataset.hw;renderHWState();return}
 const st=e.target.closest("[data-step]");const act=e.target.closest("[data-hwa]");
 const hi=hwSel.startsWith("lab")?Number(hwSel.slice(3)):-1;const hd=hi>=0?headAt(hi):null;const H=hd?S.heads[hd.id]:null;
 if(st&&H){const i=Number(st.dataset.step);const exp=H.steps.length;if(i!==exp){toast(i<exp?"Already done":"Do step "+(exp+1)+" first: "+ROLL_STEPS[exp][1]);return}
  if(S.running&&H.chan==="always active"&&i===0){toast("Stop the automat before opening the labeller (or use a standby head on a paired line)");return}
  H.steps.push(i);const k=ROLL_STEPS[i][0];if(k==="door")H.door=true;if(k==="head")H.head=true;if(k==="headC")H.head=false;if(k==="doorC")H.door=false;
  if(k==="insert"){H.roll.left=H.roll.cap;log(`${hd.name}: new label roll inserted`)}
  if(H.steps.length===ROLL_STEPS.length){H.steps=[];log(`${hd.name}: label roll change complete`);toast("Roll change complete. Acknowledge any message on the terminal.");S.ev.rollChange=(S.ev.rollChange||0)+1;checkDrills()}
  if(H.head&&S.running&&H.chan!=="not active"&&!/Standby/.test(H.chan))push("head");render();renderHWState();return}
 if(!act)return;const k=act.dataset.hwa;
 if(H){if(k==="headtog"){H.head=!H.head;log(`${hd.name}: print head ${H.head?"opened":"closed"}`);if(H.head&&S.running)push("head")}
  if(k==="up"){H.height=Math.min(260,H.height+5);log(`${hd.name}: height ${H.height} mm`)}
  if(k==="down"){H.height=Math.max(20,H.height-5);log(`${hd.name}: height ${H.height} mm`)}
  if(k==="vac"){H.vac=!H.vac;if(!H.vac&&S.running)push("vac")}
  if(k==="low"){H.roll.left=30}}
 if(k==="brain"){if(LINE().online===false){toast("This line is not online: BRAIN2 can't send data to it. Change PLU, weight class and text data locally at the terminal.");return}conf2("BRAIN2 download","Download PLU data, texts and weight class tables from BRAIN2? Local changes on this line are overwritten.",()=>{DB=DBS[S.key]=freshDB();S.wcJob=null;S.jobText={};loadJob();log("BRAIN2 download: local PLU, text and weight class data overwritten");toast("BRAIN2 download complete");S.ev.brain=true;render();renderHWState()});return}
 if(k==="power"){if(S.power){stop("Main switch off");S.power=false;log("Main switch OFF")}else{S.power=true;S.boot=100;S.level=9;S.path=[];log("Main switch ON · booting")}}
 if(k==="estop"){S.estop=!S.estop;log(S.estop?"E-stop pressed":"E-stop released");if(S.estop){stop("E-stop");push("estop")}}
 if(k==="air"){S.air=!S.air;log(S.air?"Air valve opened":"Air valve closed");if(!S.air&&S.running)push("air")}
 if(k==="airlow"){S.airBar=3;log("Air pressure 3 bar");if(S.running)push("air")}
 if(k==="airok"){S.airBar=6;S.air=true;log("Air pressure 6 bar")}
 if(k==="lbclean"){S.lbDirty=false;log("LB1 cleaned")}
 if(k==="lbdirty"){S.lbDirty=true}
 if(k==="clean"){S.beltDirty=false;if(Math.abs(S.drift)>0.03)S.drift=0.018;log("Weighing belt cleaned");toast("Belt cleaned. Use >0< to remove the small remaining offset.")}
 if(k==="dirty"){S.beltDirty=true;S.drift=0.074}
 render();renderHWState();checkDrills()});

/* ============================================================ drills */
const SCN={
 dist:{set:()=>{S.set.dist=geo().dist+75},fixed:()=>Math.abs(S.set.dist-geo().dist)<=15&&S.set.ref==="Pckg. edge front side"},
 vpos:{set:()=>{S.set.vpos=geo().vpos+98},fixed:()=>Math.abs(S.set.vpos-geo().vpos+S.set.feed-geo().feed)<=24},
 ttf:{set:()=>{S.set.mode="TTF"},fixed:()=>S.set.mode==="Direct"},
 sendE:{set:()=>{const h2=LINE().heads[1];if(h2)S.heads[h2.id].chan="not active"},fixed:()=>LINE().heads.every(h=>S.heads[h.id].chan!=="not active")},
 lbLong:{set:()=>{S.set.lb1=geo().len+140},fixed:()=>S.set.lb1<geo().len&&S.set.lb1>=100&&!openMsgs().some(m=>m.id==="long")},
 lbShort:{set:()=>{S.set.lb1=20},fixed:()=>S.set.lb1>=100&&S.set.lb1<geo().len&&!openMsgs().some(m=>m.id==="infeed")},
 lbDirty:{set:()=>{S.lbDirty=true},fixed:()=>!S.lbDirty&&!openMsgs().some(m=>m.id==="infeed")},
 pe:{set:()=>{S.set.pe="PE:Static passive";S.biasLow=Math.round(P().sd*2.2)},fixed:()=>S.set.pe==="PE:Depend. on Min/Max"||S.set.pe==="PE:On error and Min/Max"},
 release:{set:()=>{S.set.release="Manual"},fixed:()=>S.set.release==="Start autom. labeler"||S.set.release==="Automatic"},
 transport:{set:()=>{S.set.opmode="Transport"},fixed:()=>S.set.opmode!=="Transport"},
 roll:{set:()=>{const h=LINE().heads[0];S.heads[h.id].roll.left=12},fixed:()=>(S.ev.rollChange||0)>0&&!openMsgs().some(m=>m.id==="empty")},
 drift:{set:()=>{S.beltDirty=true;S.drift=0.074},fixed:()=>Math.abs(S.drift)<0.002&&!S.beltDirty},
 tare:{set:()=>{S.tareOv=Math.max(0,P().tare-40)},fixed:()=>S.tareOv==null||S.tareOv===P().tare},
 wrongplu:{set:()=>{S.product=S.plu;const alt=Object.keys(DB.plu).map(Number).find(k=>DB.plu[k].pack===P().pack&&DB.plu[k].maxw<P().minw);if(alt){const keep=S.plu;S.plu=alt;S.d={1:null,2:null,3:null};loadJob();DB.wc[alt].stops=4;S.scTarget=keep}},fixed:()=>S.plu===S.scTarget},
 height:{set:()=>{const h=LINE().heads[0];S.heads[h.id].height=geo().pkh-5},fixed:()=>{const h=S.heads[LINE().heads[0].id].height;return h>=geo().pkh+3&&h<=geo().pkh+60}},
 air:{set:()=>{S.airBar=3},fixed:()=>S.air&&S.airBar>=4&&!openMsgs().some(m=>m.id==="air")},
 estop:{set:()=>{S.estop=true;push("estop")},fixed:()=>!S.estop&&!openMsgs().some(m=>m.id==="estop")},
 pair:{set:()=>{const hs=LINE().heads;if(hs.length>1){S.heads[hs[0].id].roll.left=6;S.heads[hs[0].id].chan="Pair1 (start) change on paper end";S.heads[hs[1].id].chan="Pair1 (Standby) Change on paper end";S.heads[hs[0].id].pairActive=null}},fixed:()=>(S.ev.rollChange||0)>0&&S.heads[LINE().heads[0].id].roll.left>40}
};
const DRILLS=[
 {g:"Terminal basics",id:"auth",t:"Change authorization level: 9 → 3 → back to 9",d:"Use the key softkey (bottom left). Higher levels ask for a password on the on-screen keyboard.",h:"Key › 3 Create and maintain article › OK › password › OK. Then key › 9 › OK.",ck:()=>S.ev.back9},
 {g:"Terminal basics",id:"explore",t:"Find Print speed in the menu tree",d:"At level 1, go Labels › Printer menu and touch Print speed. Read its manual section in the Manual panel.",h:"Level 1: Labels is on the main menu; use ETC if it's on another page. The manual panel shows section 29.4.1.",ck:()=>lastTouched==="Print speed"},
 {g:"Terminal basics",id:"pluchg",t:"PLU change from the price list",d:"Change to any article other than the one the line booted on. Find its Bizerba PLU in the Price list tab, call it up, check the tare on screen matches the sheet, then run 5 good packs.",h:"Level 9: plu change (macro password) › type the PLU › OK. Or level 2: Article data › PLU. Stop the line first.",ck:()=>Object.keys(S.ev).some(k=>k.startsWith("packs_")&&k!=="packs_"+S.bootPlu&&S.ev[k]>=5)},
 {g:"Terminal basics",id:"case",t:"Case label after each full case",d:"Set Total 1 to trigger at the PLU's case size from the price list and run until a total releases automatically.",h:"Level 2: Processing › Presel. total › Presel.type total 1 = Preselect pieces, Presel. piece *1 = the case size (the Case Size column in the Price list tab, e.g. 2 for whole birds, 12 for portion packs). Then run and watch Total 1.",ck:()=>(S.ev.t1auto||0)>=1&&S.set.presel[1].val===(P().pre1||-1)},
 {g:"Terminal basics",id:"cancel",t:"Cancel a package by its consecutive number",d:"Take a Cons.No. from the right-hand list and cancel it so it comes off the totals.",h:"Level 2: Processing › Cancel. & minus › Cancel via cons. no. Not possible if a total was released after that pack (manual p. 341).",ck:()=>S.ev.cancelled},
 {g:"Terminal basics",id:"macro",t:"Record and play a macro",d:"Record a short macro, e.g. the path Date › Set date/time › Date 2, save it on a key, then play it with Record + that key. Your level 9 keys marked ⊙⊙ (plu change, RESET) are macros like this.",h:"▭ shows the extra key row. Shift + Record › Recording start, do the steps, Shift + Record › Recording end, press the key to assign, give it a name and (optionally) a password. Play: Record, then the key (manual pp. 103–111).",ck:()=>S.ev.macroPlayed},
 {g:"Terminal basics",id:"matrix",t:"Weight class totals in the preselection matrix",d:"Switch totalization to weight class-related, give one weight class a preset total, run until that class prints its own total.",h:"Level 4: Totalization › Totaliz. mode = Weight class-related. Level 2: Configure total › Presel. total › Preselect tot. matrix. Select a column, set Preset total 1 (manual p. 299).",ck:()=>(S.ev.mxRelease||0)>=1&&S.set.totaliz==="Weight class-related"},
 {g:"Terminal basics",id:"brain",t:"Why online lines need BRAIN2 for permanent changes",d:"On an FP2 line, change a text or weight class in the terminal's database, then do a BRAIN2 download (Hardware › GT terminal) and check your change is gone.",h:"Online lines get their PLU, text and weight class data from BRAIN2. A download overwrites local changes, so permanent changes belong in BRAIN2. FP1 Line 3 is the exception: it's offline.",ck:()=>S.ev.brain&&S.key.startsWith("FP2")},
 {g:"Terminal basics",id:"tareov",t:"Overwrite the tare for one job",d:"A different tray is being used. Overwrite the tare, see TARE change on screen, then call the PLU again to restore the table value.",h:"Level 2: Article data › Weight › Tare. A star appears next to TARE while overwritten.",ck:()=>S.ev.tare},
 {g:"Cooking time (exercise with Victor)",id:"ct_job",t:"Cooking time for this job only · fixed-weight product",d:"Call up a fixed-weight product (a portion pack with a fixed weight in its name, e.g. 600G). Change Text 1 to a new cooking time for the current labeling only, then run 3 good packs and check the label and the Text 1 column.",h:"Level 2: Texts › General texts 1-20 › Text 1 (level 1: Texts › Text 1). Type the text, OK, then choose “Save for current labeling”. Calling up the PLU again brings back the database text (manual p. 177).",ck:()=>(S.ev.ctJob||0)>=3},
 {g:"Cooking time (exercise with Victor)",id:"ct_db",t:"Cooking time saved in the database",d:"Make the new cooking time survive a PLU change. Two ways in: save Text 1 “to the database”, or edit the text in Text › Text editor local (level 3) and check PLU data › Text 1 points to that text number. Call the PLU up again and run 3 good packs.",h:"Level 3 password needed for the text editor and PLU data. The PLU's Text 1 is a text number (Parameters field); the words live in the text table (manual pp. 170, 177).",ck:()=>(S.ev.ctDb||0)>=3},
 {g:"Cooking time (exercise with Victor)",id:"ct_wc",t:"Cooking time by weight class · whole birds",d:"On a whole bird PLU, split the weight class table into columns with a different Text field 1 per weight band, e.g. up to 2,250 g → text 21, up to 2,400 g → text 22, heavier → text 23. Run until at least two different cooking times have printed.",h:"The table has 3 columns as standard: under, accepted, over. To split the accepted range you need a 4th column: service level (4) Processing › Weight class &statistics › Wgt class columns = 4. Then level 2: Processing › Weight class &statistics › Weight class editor (save “yes” for this job or “Yes, also in database”), or level 3: Weight class › Weight class data. Select the accepted column, Add column, set its limit, then Article parameters › Text field 1 per column. Weight-class article parameters override the PLU text (manual pp. 310–317).",ck:()=>Object.keys(S.ev.ctWc||{}).length>=2},
 {g:"Cooking time (exercise with Victor)",id:"ct_fp1",t:"FP1 Line 3 (offline): add a weight class and its cooking time at the terminal",d:"FP1 Line 3 isn't online, so BRAIN2 can't send it weight classes or texts. Switch to FP1 · Line 3, call up a whole bird PLU, add a weight class column with its own Text field 1, save it in the terminal's local database, and run until two cooking times print.",h:"Level 4: Processing › Weight class &statistics › Wgt class columns = 4. Level 3: Weight class › Weight class data › the PLU's table number. Select the accepted column › Add column › set the upper limit › Article parameters › Text field 1 for each column › Save › yes.",ck:()=>S.key==="FP1-L03"&&Object.keys(S.ev.ctWc||{}).length>=2&&(S.ev.wcSavedLocal||0)>0},
 {g:"Hardware",id:"hw_roll",sc:"roll",t:"Label roll runs out",d:"Run until labeller 1 empties. Change the roll in the Hardware tab step by step, then acknowledge and restart.",h:"Hardware › tap the labeller › follow the 11 steps in order. Terminal: Clear › Enable › Start.",n:8},
 {g:"Hardware",id:"hw_height",sc:"height",t:"Packs hitting the labeller",d:"LC 1 current spikes and packs jam. Find the cause in the Hardware tab.",h:"The labeller sits lower than the package. Raise it with the height keys until it clears the package (manual p. 46).",n:8},
 {g:"Hardware",id:"hw_air",sc:"air",t:"No air pressure",d:"The line stops on an air message.",h:"Hardware › Air unit › Set 6 bar. Then Clear › Enable.",n:8},
 {g:"Hardware",id:"hw_estop",sc:"estop",t:"Emergency stop pressed",d:"Someone hit an E-stop. Recover the line.",h:"Hardware › E-stop › Release. Terminal: Clear › Enable › Start.",n:8},
 {g:"Hardware",id:"hw_lb",sc:"lbDirty",t:"Separation errors from a dirty light barrier",d:"Settings look right but the line keeps stopping on package handling errors.",h:"Hardware › LB1 › Clean light barrier. Then Clear › Enable.",n:8},
 {g:"Hardware",id:"hw_drift",sc:"drift",t:"Scale reading high",d:"With the belt empty, NET doesn't read minus the tare.",h:"Stop the line. Hardware › Weighing conveyor › Clean belt, then press >0< (zero works within ±2 % of max).",n:8},
 {g:"Hardware",id:"hw_pair",sc:"pair",t:"Paired heads: change a roll without stopping",d:"FP1 Line 3 style: the master head runs out and the slave takes over. Change the master's roll while the slave prints.",h:"Print chan. control pairs the heads (manual p. 285). When “Label roll finished ?” shows, change the empty head's roll in Hardware. Works on lines with two heads.",n:8},
 {g:"Settings faults",id:"s_dist",sc:"dist",t:"Labels landing off-centre",d:"Run the line, read the Line view, fix it from the terminal.",h:"Level 9 ETC page or Device menu › Labeler › Label distance. Target ±15 mm.",n:8},
 {g:"Settings faults",id:"s_vpos",sc:"vpos",t:"Print sits too low on the label",d:"The text is pushed off the label.",h:"Vert. print position: positive moves print in the printing direction (manual p. 395).",n:8},
 {g:"Settings faults",id:"s_ttf",sc:"ttf",t:"Labels come out blank",d:"Labels are applied with nothing printed, and there's no message.",h:"Direct-thermal labels with no ribbon: Print mode must be Direct, not TTF (manual p. 393).",n:8},
 {g:"Settings faults",id:"s_chan",sc:"sendE",t:"Second label missing",d:"Packs leave with one label short.",h:"Print chan. control: the second labeller's channel is set to “not active”. Set it to “always active” and save with yes (manual p. 284).",n:8},
 {g:"Settings faults",id:"s_long",sc:"lbLong",t:"“Package too long” keeps stopping the line",d:"Two packs look like one long one.",h:"Level 1+: Device menu › LB1 susp. path shorter than the pack. Then Clear › Enable › Start.",n:8},
 {g:"Settings faults",id:"s_short",sc:"lbShort",t:"Infeed errors, then “Repeats error on pckg. handling”",d:"Packs trigger the light barrier twice.",h:"LB1 susp. path is too short: at least 100 mm (manual p. 264).",n:8},
 {g:"Settings faults",id:"s_pe",sc:"pe",t:"Underweight packs go through",d:"Light packs are flagged but not ejected.",h:"Device menu › Optional equipment › Dividers › PE:Activation criteria → PE:Depend. on Min/Max or PE:On error and Min/Max (manual p. 269).",n:8},
 {g:"Settings faults",id:"s_rel",sc:"release",t:"Packs pass with no label",d:"The line weighs but prints nothing.",h:"Level 2: Processing › Release mode › Process → Start autom. labeler (manual p. 274).",n:8},
 {g:"Settings faults",id:"s_trans",sc:"transport",t:"Line in transport operation",d:"Packs pass unweighed and unlabelled.",h:"Device menu › Operating mode → Weighing Continuous (manual p. 264).",n:8},
 {g:"Settings faults",id:"s_tare",sc:"tare",t:"Net weights reading heavy",d:"Every pack's net is about 40 g higher than it should be.",h:"Someone overwrote the tare. Compare TARE on screen with the price list; call the PLU again or set Article data › Weight › Tare.",n:8},
 {g:"Settings faults",id:"s_plu",sc:"wrongplu",t:"Wrong article loaded",d:"The automat stops after repeated wrong-weight packs.",h:"Compare the article text with the product on the belt. Change back to the right PLU.",n:8}
];
function startScn(id){const D=DRILLS.find(x=>x.id===id);if(S.running)stop("Stopped for scenario");S.sc=D.sc;S.scDrill=id;S.biasLow=0;S.product=null;SCN[D.sc].set();S.good=0;log("Scenario started: "+D.t);toast("Fault loaded. Run the line and investigate.");render();renderDrills();renderHWState()}
let done=store.get("glmi-done-v4",{});
function checkDrills(){if(!S)return;let ch=false;
 DRILLS.forEach(D=>{const key=S.key+":"+D.id;if(done[key])return;let ok=false;
  if(D.sc)ok=S.scDrill===D.id&&SCN[D.sc].fixed()&&S.good>=D.n;else ok=!!D.ck();
  if(ok){done[key]=true;ch=true;toast("Drill complete: "+D.t);if(D.sc){S.sc=null;S.scDrill=null;S.biasLow=0;S.product=null}}});
 if(ch){store.set("glmi-done-v4",done);renderDrills()}}
function renderDrills(){if(!S)return;const n=DRILLS.filter(d=>done[S.key+":"+d.id]).length;
 const sp=store.get("sitepw",null);
 let h=`<h2>Drills on ${esc(LINE().tab)} · ${n}/${DRILLS.length}</h2><p class="note">Fault drills load a problem as if the last shift left it. Fix it and run 8 good packs in a row. Progress is kept per line. Passwords: ${sp&&sp.lower?"your site passwords from Settings":"training passwords 2222 / 3333 / 4444 (add your site passwords in Settings)"}; standby unlock 183.</p>`;
 let g="";DRILLS.forEach((D,i)=>{if(D.g!==g){g=D.g;h+=`<div class="dgroup">${esc(g)}</div>`}const key=S.key+":"+D.id;
  h+=`<div class="drill ${done[key]?"done":""} ${S.scDrill===D.id?"live":""}"><div class="ck">${done[key]?"✓":i+1}</div><div><b>${esc(D.t)}</b><p>${esc(D.d)}</p><details><summary>Hint</summary><p>${esc(D.h)}</p></details></div>${D.sc?`<button class="go" data-sc="${D.id}">${S.scDrill===D.id?"Running":"Start fault"}</button>`:"<span></span>"}</div>`});
 $("#tab-drills").innerHTML=h;$$("#tab-drills [data-sc]").forEach(b=>b.addEventListener("click",()=>startScn(b.dataset.sc)))}

/* ============================================================ price list import
   CSV or JSON, read in the browser and kept in localStorage. The header names are the
   ones the Retail Product Information Sheet uses, so a sheet exported straight to CSV
   loads without renaming anything. See docs/plu-format.md. */
const PL_COLS=[["cust",["customer","cust"]],["sect",["section","sect","group"]],["name",["product","article","description","name","product description"]],
 ["plu",["bizerba plu","plu","plu no","plu number"]],["price",["pack price","price"]],["ppkg",["price pkg","price pack","price per pack","ppkg"]],
 ["barcode",["pack barcode","barcode","ean"]],["tare",["tray + film","tray+film","tare","tray and film"]],["eob",["end of batch","eob"]],
 ["tray",["tray size","tray"]],["nav",["nav code","nav"]],["pcode",["product code","pcode"]],["case",["case size","case"]],["fops",["fops"]],
 ["basket",["basket tare","basket"]],["outer",["outer-case","outer case","outer"]],["info",["extra info","notes","info"]],["flash",["flash","flash label"]],
 ["pz",["pz plu","pz"]],["acode",["article code","acode","order code"]]];
/* RFC 4180 CSV: quoted fields, doubled quotes, newlines inside quotes, CR or CRLF */
function parseCSV(t){const out=[];let row=[],f="",q=false;
 for(let i=0;i<t.length;i++){const c=t[i];
  if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
  else if(c==='"')q=true;
  else if(c===","){row.push(f);f=""}
  else if(c==="\n"||c==="\r"){if(c==="\r"&&t[i+1]==="\n")i++;row.push(f);f="";if(row.some(x=>x.trim()!==""))out.push(row);row=[]}
  else f+=c}
 row.push(f);if(row.some(x=>x.trim()!==""))out.push(row);
 if(!out.length)return[];
 const head=out[0].map(h=>h.replace(/\s+/g," ").trim().toLowerCase());
 const ix={};PL_COLS.forEach(([k,names])=>{const i=head.findIndex(h=>names.includes(h));if(i>=0)ix[k]=i});
 if(ix.plu==null||ix.name==null)throw new Error('The first row must be a header row with a "Bizerba PLU" column and a product name column');
 return out.slice(1).map(r=>{const o={};Object.entries(ix).forEach(([k,i])=>{o[k]=(r[i]??"").replace(/\s+/g," ").trim()});return o})}
/* one imported record -> the shape parseProduct() expects */
function normRow(o){const g=k=>{const v=o[k];return v==null?"":String(v).replace(/\s+/g," ").trim()};
 const plu=parseInt(g("plu").replace(/[^\d]/g,""),10);if(!plu||!g("name"))return null;
 const r={plu,name:g("name"),cust:g("cust"),sect:g("sect"),price:g("price"),ppkg:g("ppkg"),barcode:g("barcode"),tare:g("tare"),
  eob:g("eob"),tray:g("tray"),nav:g("nav"),pcode:g("pcode"),case:g("case"),fops:g("fops"),basket:g("basket"),outer:g("outer"),
  info:g("info").slice(0,160),flash:g("flash"),acode:g("acode")};
 const pz=parseInt(g("pz").replace(/[^\d]/g,""),10);if(pz)r.pz=pz;
 return r}
function importPLU(fileName,text){
 const t=text.replace(/^﻿/,"").trim();
 let raw;
 if(t[0]==="["||t[0]==="{"){const j=JSON.parse(t);raw=Array.isArray(j)?j:(Array.isArray(j.rows)?j.rows:null);
  if(!raw)throw new Error("JSON must be an array of articles, or an object with a rows array")}
 else raw=parseCSV(t);
 const rows=raw.map(normRow).filter(Boolean);
 if(!rows.length)throw new Error("No rows had both a Bizerba PLU and a product name");
 if(rows.length>4000)throw new Error("That file has "+rows.length+" rows; the trainer takes up to 4000");
 const rec={name:fileName,when:fmtD(new Date()),rows};
 try{localStorage.setItem(PLU_KEY,JSON.stringify(rec))}
 catch(e){throw new Error("This browser wouldn't store the list (it may be too large, or storage is blocked in private browsing)")}
 return rows.length}
function download(name,text,type){const b=new Blob([text],{type:type+";charset=utf-8"}),u=URL.createObjectURL(b);
 const a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}
function plCSV(){const q=v=>{v=v==null?"":String(v);return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
 const head=["Customer","Section","Product","Bizerba PLU","Pack Price","Price Pkg","Pack Barcode","Tray + film","End of Batch","Tray Size",
  "Nav Code","Product Code","Case Size","Fops","Basket Tare","Outer-Case","Extra Info","Flash","PZ PLU","Article Code"];
 const keys=["cust","sect","name","plu","price","ppkg","barcode","tare","eob","tray","nav","pcode","case","fops","basket","outer","info","flash","pz","acode"];
 return "﻿"+[head.join(",")].concat(PRODUCTS.map(r=>keys.map(k=>q(r[k])).join(","))).join("\r\n")+"\r\n"}

/* ============================================================ price list, settings, reference */
function renderPLSrc(){
 const demo=usingDemo();
 $("#plSrc").innerHTML=`<div class="srcrow"><div><b>${demo?"Demo price list":"Your price list"}</b>
   <div class="note" style="margin:2px 0 0">${demo?`${PRODUCTS.length} fictional articles shipped with the trainer. Nothing here is real site data.`
    :`${esc(PLU_SRC.name||"imported file")} · ${PRODUCTS.length} articles · loaded ${esc(PLU_SRC.when||"")} · kept in this browser only`}</div></div>
  <div class="ctl"><button id="plLoad">Load price list…</button><button id="plCsv">Export CSV</button><button id="plJson">Export JSON</button>${demo?"":`<button id="plClear">Remove and use demo data</button>`}</div></div>
  <input type="file" id="plFile" accept=".csv,.json,.txt,text/csv,application/json" style="display:none">
  <div class="plmsg" id="plMsg" role="alert" hidden></div>
  <p class="note" style="margin:6px 0 0">CSV or JSON. The CSV header row takes the names the Retail Product Information Sheet uses — <b>Bizerba PLU</b>, <b>Product</b>, <b>Tray + film</b>, <b>Case Size</b>, <b>Pack Barcode</b>, <b>End of Batch</b>, <b>PZ PLU</b>, <b>Basket Tare</b> — and ignores any column it doesn't know. Export CSV first if you want a template to fill in. The file is read on this device; it is never uploaded and never becomes part of the page.</p>`;
 const msg=(t,bad)=>{const m=$("#plMsg");m.hidden=!t;m.className="plmsg"+(bad?" bad":"");m.innerHTML=t||""};
 $("#plLoad").addEventListener("click",()=>$("#plFile").click());
 $("#plCsv").addEventListener("click",()=>download("plu-export.csv",plCSV(),"text/csv"));
 $("#plJson").addEventListener("click",()=>download("plu-export.json",JSON.stringify(PRODUCTS,null,1),"application/json"));
 const cl=$("#plClear");
 if(cl)cl.addEventListener("click",()=>{
  if(cl.dataset.armed!=="1"){cl.dataset.armed="1";cl.textContent="Click again to remove";msg("This removes the imported list from this browser and goes back to the demo articles. Your own file on disk isn't touched.");return}
  try{localStorage.removeItem(PLU_KEY)}catch(e){}
  msg("Price list removed. Reloading…");setTimeout(()=>location.reload(),700)});
 $("#plFile").addEventListener("change",e=>{const f=e.target.files&&e.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onerror=()=>msg("Could not read that file.",true);
  rd.onload=()=>{try{const n=importPLU(f.name,String(rd.result));msg(n+" articles loaded from "+esc(f.name)+". Reloading…");setTimeout(()=>location.reload(),700)}
   catch(err){msg("<b>Price list not loaded.</b> "+esc(err.message||String(err))+" Save the sheet as CSV with one header row and one row per article, or use the JSON from <code>tools/pricelist_to_plu.py</code>.",true)}};
  rd.readAsText(f);e.target.value=""})}
function renderPL(){const q=($("#plSearch").value||"").toLowerCase();
 const rows=PRODUCTS.filter(r=>!q||[r.name,r.plu,r.cust,r.nav,r.pcode,r.barcode].join(" ").toLowerCase().includes(q));
 $("#plTable").innerHTML=`<tr><th>Customer</th><th>Product</th><th>PLU</th><th>Tare</th><th>Case</th><th>End of Batch</th><th>PZ PLU</th><th>Basket tare</th><th>Barcode</th><th>Price</th></tr>`+rows.map(r=>`<tr class="click" data-plu="${r.plu}"><td>${esc(r.cust)}</td><td>${esc(r.name)}</td><td><b>${r.plu}</b></td><td>${esc(r.tare)}</td><td>${esc(r.case)}</td><td>${esc(r.eob||"–")}</td><td>${esc(r.pz||"–")}</td><td>${esc(r.basket)}</td><td style="font-family:monospace;font-size:.75rem">${esc(r.barcode)}</td><td>${esc(r.price)}${r.ppkg?" "+esc(r.ppkg):""}</td></tr>`).join("")}
$("#plSearch").addEventListener("input",renderPL);
$("#plTable").addEventListener("click",e=>{const tr=e.target.closest("[data-plu]");if(!tr)return;const p=DB.plu[tr.dataset.plu];if(!p)return;
 const W=DB.wc[p.wc];toast(`PLU ${p.plu}: ${p.mode}${p.mode==="Fixed weight"?" "+p.fixw+" g":""} · tare ${p.tare} g · class ${W?W.lower+"–"+W.upper+" g":"–"} · case ${p.pre1||"–"}`)});
function renderSet(){const sp=store.get("sitepw",{lower:"",lowerLv:"2",higher:"",higherLv:"3,4"});
 $("#tab-set").innerHTML=`<h2>Site passwords</h2><p class="note">Saved only in this browser on this device. They aren't written into the page, so sharing the link doesn't share them. Clear them before handing the device to someone else.</p>
 <div class="row"><label>Label checker (lower)<input id="pwL" type="password" autocomplete="off" value="${esc(sp.lower||"")}"></label><label>Used for level<select id="pwLL">${[1,2].map(l=>`<option value="${l}" ${String(sp.lowerLv)===String(l)?"selected":""}>${l} ${LVN[l]}</option>`).join("")}</select></label></div>
 <div class="row"><label>Technical services (higher)<input id="pwH" type="password" autocomplete="off" value="${esc(sp.higher||"")}"></label><label>Used for levels<select id="pwHL"><option value="3,4" ${sp.higherLv==="3,4"?"selected":""}>3 and 4</option><option value="3" ${sp.higherLv==="3"?"selected":""}>3 only</option><option value="4" ${sp.higherLv==="4"?"selected":""}>4 only</option></select></label></div>
 <div class="ctl"><button id="pwSave">Save passwords</button><button id="pwClear">Clear passwords</button></div>
 <p class="note">The lower password is also used for protected macros (#) such as plu change. Which level each password opens on your line is my assumption; change it here if it's different.</p>
 <h3>Your site</h3><p class="note">Nothing site-specific is built into the trainer. Fill these in and they are saved in this browser only, like the passwords and the price list.</p>
 <div class="row"><label>Site or factory name<input id="siteName" autocomplete="off" placeholder="shown under the title" value="${esc(SITE.name||"")}"></label></div>
 <div class="row"><label>Level 9 customer macro · key label<input id="siteML" maxlength="18" autocomplete="off" placeholder="${esc(DEF_SITE.macroLabel)}" value="${esc(SITE.macroLabel===DEF_SITE.macroLabel?"":SITE.macroLabel||"")}"></label>
 <label>shows only articles matching<input id="siteMF" autocomplete="off" placeholder="a customer name, blank = all" value="${esc(SITE.macroFilter||"")}"></label></div>
 <div class="ctl"><button id="siteSave">Save site</button><button id="siteClear">Clear site</button></div>
 <p class="note">On the photographed terminal this level 9 softkey filters the article list down to one customer's PLUs. Set the key label and the text it matches on (checked against the article text and the Customer column).</p>
 <h3>Price list</h3><p class="note" id="setPl"></p>
 <h3>Level mapping</h3><p class="note">The manual's mode levels are 1 Standard operation, 2 Extended settings, 3 Local data, 4 Global data, 5 Service. Your terminal shows 1 Check settings, 2 Article change, 3 Create and maintain article, 4 Service / Configuration, 5 BIZERBA, 9 Customer. The trainer maps manual 1→1, 2→2, 3 and 4→3, 5→4.</p>`;
 $("#setPl").innerHTML=usingDemo()
  ?`The trainer is running on <b>${PRODUCTS.length} fictional demo articles</b>. Load your own price list in the Price list tab to practise on real PLUs — it is read on this device and stored in this browser only.`
  :`Running on <b>${PRODUCTS.length} articles</b> from ${esc(PLU_SRC.name||"your imported file")}, loaded ${esc(PLU_SRC.when||"")}. Stored in this browser only; remove it from the Price list tab.`;
 $("#siteSave").addEventListener("click",()=>{SITE={name:$("#siteName").value.trim(),macroLabel:$("#siteML").value.trim()||DEF_SITE.macroLabel,macroFilter:$("#siteMF").value.trim()};
  store.set(SITE_KEY,SITE);renderHead();render();toast("Site details saved in this browser")});
 $("#siteClear").addEventListener("click",()=>{try{localStorage.removeItem(SITE_KEY)}catch(e){}SITE=Object.assign({},DEF_SITE);renderSet();renderHead();render();toast("Site details cleared")});
 $("#pwSave").addEventListener("click",()=>{store.set("sitepw",{lower:$("#pwL").value.trim(),lowerLv:$("#pwLL").value,higher:$("#pwH").value.trim(),higherLv:$("#pwHL").value});toast("Passwords saved in this browser");renderDrills()});
 $("#pwClear").addEventListener("click",()=>{try{localStorage.removeItem("sitepw")}catch(e){}renderSet();renderDrills();toast("Passwords cleared")})}
function renderRef(){let count=0;const walk=(n,d)=>{n.ch.forEach(c=>{count++;walk(c,d+1)})};walk(TREE,0);
 const ph='<span class="tag photo">photo</span>',dc=p=>`<span class="tag doc">manual p.${p}</span>`,inf='<span class="tag inf">inferred</span>',site='<span class="tag site">site data</span>';
 const rows=[["Authorization level names and dialog",ph],["Level 9 softkeys (both pages)",ph+" FP2-L03 only; used on all lines"],["Screen layout, status box, totals, motor currents, weighing list",ph+" "+dc(63)],["Menu tree: "+count+" softkeys from "+MAN.filter(s=>s.paths.length).length+" manual sections",dc("26–452")],["Level mapping manual → site",inf],["PLU database: "+PRODUCTS.length+(usingDemo()?" fictional demo articles":" articles from the price list you loaded")+" · tare, case, End of Batch, PZ PLU, barcode",usingDemo()?inf+" sample data, invented for this repository":site],["Labeling mode and weight limits derived from product names",inf+" (ranges and FW weights in the name)"],["Shelf-life 8 days for every product",inf],["Messages and remedies",dc("349–355")],["Print chan. control options",dc(284)],["Send channel A–E",dc(419)+" use is customer-specific; assumed per line"],["Position trigger 2",inf+" treated as ejector timing"],["Label layouts",inf],["Hardware: label roll change steps",dc(58)],["Hardware: height keys, main switch, warm-up",dc("35, 46, 334")],["Line models, master/slave on FP1-L03",'<span class="tag site">you</span>'],["C-Wrap station layout",inf+" from Bizerba product picture"]];
 $("#tab-ref").innerHTML=`<h2>What's real and what's assumed</h2><p class="note"><span class="tag photo">photo</span> your terminal · <span class="tag doc">manual</span> GLM-I instruction manual 38.019.129.001 en · <span class="tag site">site data</span> the price list you loaded · <span class="tag inf">inferred</span> my reading, not confirmed.</p><div class="tw"><table class="ref"><tr><th>Item</th><th>Source</th></tr>${rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("")}</table></div>
 <h3>Full menu tree from the manual</h3><p class="note">Every path, with the site level that opens it. Tap a row to read the section.</p><div class="tw" style="max-height:480px;overflow:auto"><table class="ref" id="treeTable"><tr><th>Path</th><th>Site level</th><th>Section</th></tr>${MAN.flatMap((s,i)=>s.paths.map(p=>`<tr class="click" data-sec="${i}"><td>${esc(p.path.map(cleanTok).filter(t=>!["Main menu","Etc","ETC"].includes(t)).join(" / "))}</td><td>${siteLv(p.level??s.levels[0])}</td><td>${esc(s.num)} ${esc(s.title)} · p.${s.page}</td></tr>`)).join("")}</table></div>
 <h3>Not modelled yet</h3><p class="note">GT-SoftControl layouts, macro contents, the key under the flag, real label layouts per customer, BRAIN2 (download/upload, Label_Designer), and service functions beyond navigation.</p>`;
 $("#treeTable").addEventListener("click",e=>{const tr=e.target.closest("[data-sec]");if(!tr)return;const s=MAN[Number(tr.dataset.sec)];$("#manBody").innerHTML=`<div class="sec"><div class="t">${esc(s.num)} ${esc(s.title)}</div><div class="meta">Manual p. ${s.page}</div><pre>${esc(s.text)}</pre></div>`;$("#man").scrollIntoView({behavior:reduced()?"auto":"smooth"})})}

$$(".tabs button").forEach(b=>b.addEventListener("click",()=>{$$(".tabs button").forEach(x=>x.setAttribute("aria-selected",x===b));["drills","hw","pl","log","set","ref"].forEach(t=>$("#tab-"+t).hidden=t!==b.dataset.tab);if(b.dataset.tab==="hw")renderHW();if(b.dataset.tab==="pl"){renderPLSrc();renderPL()}}));

/* the subtitle names the site only if you filled it in under Settings */
function renderHead(){const n=(SITE.name||"").trim();
 $("#subtitle").textContent=`Replica of the Bizerba GLM-I weigh-price labeller terminal${n?" at "+n:"s"}. The menu tree is built from the GLM-I instruction manual; the article database comes from the price list you load in the Price list tab.`}

/* boot */
const startLine=store.get("line","FP2-L03");useLine(LINES[startLine]?startLine:"FP2-L03");
setMode(viewMode);renderHead();renderSet();renderRef();setTimeout(fit,60);
window.__trainer={get S(){return S},get DB(){return DB},get PRODUCTS(){return PRODUCTS},TREE,MAN,importPLU,parseCSV};
})();
