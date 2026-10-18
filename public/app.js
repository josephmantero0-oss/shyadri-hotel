let S=null;
function normalize(){
 S.hotel=S.hotel||{name:'Hotel',tagline:'',phone:''};
 S.wifi=S.wifi||{name:'',pass:''};
 S.rules=S.rules||[];
 S.menu=S.menu||[];
 S.notices=S.notices||[];
 S.review=S.review||'';
 S.pw=S.pw||'f549436ca88326a9ab1dd189c8f26e20ee3e357cdcc5a8138a0d38af222f5d7e';
 S.order=S.order||{on:true};
 if(!S.order.food)S.order.food={wa:S.order.wa||'',sms:S.order.sms||''};
 if(!S.order.desk)S.order.desk={wa:S.order.wa||'',sms:S.order.sms||''};
 delete S.order.wa;delete S.order.sms;
 S.toil=S.toil||[['Toothbrush & paste kit'],['Soap'],['Shampoo sachet'],['Extra towel'],['Extra pillow'],['Extra blanket'],['Comb'],['Shaving kit'],['Slippers']].map((x,i)=>({id:'t'+(i+1),n:x[0],p:'',a:true}))
}
const $=s=>document.querySelector(s),esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,8);
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');
let admin=false,login=false,tab='notices',mcat=0,ci=0,q='',vegOnly=false,delArm=-1;
try{admin=sessionStorage.getItem('sh_admin')==='1'}catch(e){}

const greet=()=>{const h=new Date().getHours();return h<5?'Good night':h<12?'Good morning':h<17?'Good afternoon':h<21?'Good evening':'Good night'};
const url=u=>/^https?:\/\//i.test(u)?u:'';
const sun=()=>{const h=new Date().getHours();return h<5?'🌙':h<12?'🌅':h<17?'☀️':h<21?'🌇':'🌙'};
function menuBlock(){
 const c=S.menu[mcat]||{items:[]},n=q.toLowerCase();
 const src=q?S.menu.flatMap(x=>x.items):c.items;
 const items=src.filter(it=>(!vegOnly||it.v)&&(!n||(it.n+' '+it.d).toLowerCase().includes(n))).map(it=>`<div class="it ${it.a?'':'off'}"><span class="vd ${it.v?'v':'n'}"></span><div class="im"><b>${esc(it.n)}</b><small>${esc(it.d)}</small></div><div class="pr">${it.a?'₹'+esc(it.p):'Sold out'}</div></div>`).join('')||'<p class="mu">No dishes match.</p>';
 return (q?'':`<div class="pills sticky">${S.menu.map((x,i)=>`<button class="pill ${i===mcat?'on':''}" data-act="cat" data-i="${i}">${esc(x.cat)}</button>`).join('')}</div>`)+items;
}
function guest(){
 const ph=String(S.hotel.phone).replace(/[^+\d]/g,''),rv=url(S.review),H=hi();
 const nt=S.notices.slice().reverse().map(n=>`<div class="card note rv"><b>From the front desk</b><p style="margin:4px 0">${esc(n.t)}</p><small>${esc(n.time)}</small></div>`).join('');
 return `<div class="adm"><button data-act="login">Admin</button></div><div class="wrap">
 <header class="hero" id="hero"><svg class="mnt" viewBox="0 0 420 170" preserveAspectRatio="none"><path class="m3" d="M0 170V70l45-35 40 40 50-55 55 60 40-30 60 50 45-35 85 55v70z"/><path class="m2" d="M0 170V105l60-40 45 40 70-50 70 60 60-40 115 50v45z"/><path class="m1" d="M0 170v-35l70-40 55 35 65-30 80 45 60-35 90 45v15z"/></svg>
 <div class="scene" data-act="owl"><div class="tilt"><div class="sunc"></div><div class="car" id="car">${Array.from({length:10},(_,i)=>dancer(i)).join('')}</div></div></div>
 <p class="namaste">${H[0]}</p><h1>${esc(S.hotel.name)}</h1><p class="sub">${esc(S.hotel.tagline)}</p><p class="say" id="say">${esc(H[1])}</p></header>
 <div class="zig"></div>
 ${nt}
 <nav class="qa rv"><button class="tile" data-act="food"><i>🍛</i>Order Food<small>जेवण ऑर्डर</small></button><button class="tile" data-act="order"><i>🧴</i>Request<small>मदत</small></button><button class="tile" data-act="go" data-t="wifi"><i>📶</i>WiFi<small>वायफाय</small></button><button class="tile" data-act="go" data-t="menu"><i>🍛</i>Menu<small>जेवण</small></button><button class="tile" data-act="go" data-t="rules"><i>📜</i>Rules<small>नियम</small></button>${rv?`<a class="tile" href="${esc(rv)}" target="_blank" rel="noopener"><i>⭐</i>Review<small>अभिप्राय</small></a>`:''}${ph?`<a class="tile" href="tel:${ph}"><i>📞</i>Call us<small>संपर्क</small></a>`:''}</nav>
 <section class="card rv" id="wifi"><h2>📶 WiFi</h2><div class="kv"><span class="mu">Network</span><b>${esc(S.wifi.name)}</b></div><div class="kv"><span class="mu">Password</span><b>${esc(S.wifi.pass)}</b></div><div class="bar" style="margin:10px 0 0"><button class="btn" data-act="copy" data-v="${esc(S.wifi.pass)}">Copy password</button><button class="btn g" data-act="copy" data-v="${esc(S.wifi.name)}">Copy name</button></div></section>
 <section class="card rv" id="menu"><h2>🍛 Menu</h2><div class="tools"><input id="q" type="search" placeholder="Search dishes…" value="${esc(q)}"><label class="sw"><input type="checkbox" id="vg" ${vegOnly?'checked':''}>Veg only</label></div><div class="bar" style="justify-content:flex-start;gap:10px"><button class="btn" data-act="food">🛎️ Order food</button><button class="btn g" data-act="pick">आज काय खायचं? 🍛</button></div><div id="pick"></div><div id="mm">${menuBlock()}</div><button class="btn" style="width:100%;margin-top:16px" data-act="food">🛎️ Order food to your room</button></section>
 <section class="card rv" id="rules"><h2>📜 House rules</h2><ol>${S.rules.map(r=>`<li>${esc(r)}</li>`).join('')}</ol></section>
 ${rv?`<section class="card rv" id="review"><h2>Enjoyed your stay? 🧡</h2><p style="margin-top:0">A quick Google review means a lot to us.</p><a class="btn" href="${esc(rv)}" target="_blank" rel="noopener">⭐ Leave a review</a></section>`:''}
 <div class="zig"></div><p class="foot">धन्यवाद! Thank you for staying with ${esc(S.hotel.name)}</p></div>
 <nav class="dock"><button data-act="go" data-t="top"><i>🏠</i>Home</button><button data-act="go" data-t="menu"><i>🍛</i>Menu</button><button data-act="food"><i>🛎️</i>Order</button><button data-act="go" data-t="wifi"><i>📶</i>WiFi</button><button data-act="go" data-t="rules"><i>📜</i>Rules</button></nav>
 ${foodPage()}${orderUI()}${chatUI()}${login?loginModal():''}`;
}
function inp(k,v,ph,cls){return `<input ${cls?`class="${cls}" `:''}data-k="${k}" value="${esc(v)}" placeholder="${ph}">`}
function adminView(){
 let b='';
 if(tab==='notices'){b=`<div class="card"><h2>Broadcast a notice</h2><textarea id="nt" rows="3" placeholder="Message for all guests, e.g. Power cut 2-4 PM, generator on."></textarea><button class="btn" data-act="addnotice">Broadcast now</button></div><div class="card"><h2>Live notices</h2>${S.notices.map((n,i)=>`<div class="row"><p style="margin:0 0 6px">${esc(n.t)}</p><small class="mu">${esc(n.time)}</small> <button class="btn d" data-act="delnotice" data-i="${i}">Remove</button></div>`).join('')||'<p class="mu">No notices.</p>'}</div>`}
 if(tab==='menu'){const c=S.menu[ci];b=`<div class="card"><div class="pills">${S.menu.map((x,i)=>`<button class="pill ${i===ci?'on':''}" data-act="acat" data-i="${i}">${esc(x.cat)}</button>`).join('')}<button class="pill" data-act="addcat">+ Category</button></div>${c?`${inp(`menu.${ci}.cat`,c.cat,'Category name')}${c.items.map((it,j)=>{const p=`menu.${ci}.items.${j}.`;return `<div class="row">${inp(p+'n',it.n,'Dish name')}${inp(p+'p',it.p,'Price ₹')}${inp(p+'d',it.d,'Description')}<label><input type="checkbox" data-k="${p}v" ${it.v?'checked':''}>Veg</label><label><input type="checkbox" data-k="${p}a" ${it.a?'checked':''}>Available</label> <button class="btn d" data-act="delitem" data-j="${j}">Delete</button></div>`}).join('')}<div class="bar"><button class="btn g" data-act="additem">+ Add item</button><button class="btn d" data-act="delcat">${delArm===ci?'Tap again to delete':'Delete category'}</button></div>`:'<p class="mu">Add a category to start.</p>'}</div>`}
 if(tab==='order'){const dn=(k,t)=>`<div class="card"><h2>${t}</h2><label>WhatsApp number (with country code)</label>${inp('order.'+k+'.wa',S.order[k].wa,'919876543210')}<label>SMS number (blank = same as WhatsApp)</label>${inp('order.'+k+'.sms',S.order[k].sms,'919876543210')}</div>`;b=`<div class="card"><h2>Ordering</h2><label class="sw"><input type="checkbox" data-k="order.on" ${S.order.on?'checked':''}>Accept orders</label>${[S.order.food,S.order.desk].some(d=>num(d.wa)||num(d.sms))?'':'<p class="st">No number is set yet. Guests can pick items but can only copy the order until you add a number below.</p>'}<p class="mu" style="font-size:.9rem">Food orders and toiletries/messages are sent separately, each to its own number. Guests press Send in their own WhatsApp or SMS app. Orders are not stored on this site.</p></div>${dn('food','Kitchen (food orders)')}${dn('desk','Front desk (toiletries and messages)')}<div class="card"><h2>Toiletries</h2>${S.toil.map((x,i)=>`<div class="row">${inp('toil.'+i+'.n',x.n,'Item name')}${inp('toil.'+i+'.p',x.p,'Price Rs (optional)')}<label><input type="checkbox" data-k="toil.${i}.a" ${x.a?'checked':''}>Available</label> <button class="btn d" data-act="deltoil" data-i="${i}">Delete</button></div>`).join('')}<button class="btn g" data-act="addtoil">+ Add item</button></div>`}
 if(tab==='info'){b=`<div class="card"><h2>Details</h2><label>Hotel name</label>${inp('hotel.name',S.hotel.name,'')}<label>Tagline</label>${inp('hotel.tagline',S.hotel.tagline,'')}<label>Reception phone</label>${inp('hotel.phone',S.hotel.phone,'+91…')}<label>WiFi name</label>${inp('wifi.name',S.wifi.name,'')}<label>WiFi password</label>${inp('wifi.pass',S.wifi.pass,'')}<label>Google review link</label>${inp('review',S.review,'https://…')}</div><div class="card"><h2>House rules</h2>${S.rules.map((r,i)=>`<div class="row">${inp('rules.'+i,r,'Rule')}<button class="btn d" data-act="delrule" data-i="${i}">Delete</button></div>`).join('')}<button class="btn g" data-act="addrule">+ Add rule</button></div><div class="card"><h2>Admin password</h2><input id="opw" type="password" placeholder="Current password" autocomplete="current-password"><input id="npw" type="password" placeholder="New password (min 6 chars)" autocomplete="new-password"><button class="btn g" data-act="setpw">Change password</button></div>`}
 return `<div class="wrap"><div class="bar"><h2 style="margin:0">Admin</h2><div><button class="btn g" data-act="logout">Exit</button> <button class="btn" data-act="save">Save changes</button></div></div><div class="st" id="st"></div><div class="pills">${[['notices','Notices'],['menu','Menu'],['info','Info & rules'],['order','Ordering']].map(t=>`<button class="pill ${tab===t[0]?'on':''}" data-act="tab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>${b}</div>`;
}
function reveal(){const e=document.querySelectorAll('.rv');if(!('IntersectionObserver' in window))return e.forEach(x=>x.classList.add('in'));const o=new IntersectionObserver(r=>r.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');o.unobserve(x.target)}}),{threshold:.08});e.forEach(x=>o.observe(x))}
function toast(m){const d=document.createElement('div');d.className='toast';d.textContent=m;document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}
const mm=()=>{const e=$('#mm');if(e)e.innerHTML=menuBlock()};
document.addEventListener('input',e=>{if(e.target.id==='q'){q=e.target.value;mm()}if(e.target.id==='vg'){vegOnly=e.target.checked;mm()}});
function render(){$('#app').innerHTML=admin?adminView():guest();reveal();const p=$('#pw');if(p)p.focus()}
const st=m=>{const e=$('#st');if(e)e.textContent=m};
async function save(){st('Saving…');try{const {data,error}=await SB.from('site_config').update({data:S,updated_at:new Date().toISOString()}).eq('id',1);if(error)throw error;st('Saved. Guests see changes when they open or refresh the page.')}catch(e){st('Could not save: '+((e&&e.message)||'unknown error'))}}
function setPath(path,v){const k=path.split('.');let o=S;for(let i=0;i<k.length-1;i++)o=o[k[i]];o[k[k.length-1]]=v}
document.addEventListener('input',e=>{const k=e.target.dataset&&e.target.dataset.k;if(k)setPath(k,e.target.type==='checkbox'?e.target.checked:e.target.value)});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='pw')act('dologin',e.target)});
document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(t)act(t.dataset.act,t)});
async function act(a,t){const i=+t.dataset.i,j=+t.dataset.j;
 if(a==='cat'){mcat=i;mm()}
 else if(a==='owl'){owl()}
 else if(a==='order'){if(!S.order.on)return toast('Ordering is switched off right now. Please call reception.');ord.open=true;ord.view='browse';ord.sent='';ord.err='';if(ord.tab==='food')ord.tab='toil';const o=$('#osheet');if(o){o.classList.add('open');paintOrder()}}
 else if(a==='oclose'){ord.open=false;const o=$('#osheet');if(o)o.classList.remove('open')}
 else if(a==='otab'){ord.tab=t.dataset.t;ord.err='';paintOrder()}
 else if(a==='qq'){const k=t.dataset.k,n=Math.max(0,Math.min(9,qty(k)+(+t.dataset.d)));if(n)ord.cart[k]=n;else delete ord.cart[k];afterQty(k,t)}
 else if(a==='owa')sendOrder('wa',ord.tab);else if(a==='osms')sendOrder('sms',ord.tab);else if(a==='ocopy')sendOrder('copy',ord.tab)
 else if(a==='oback'){ord.sent='';paintOrder()}
 else if(a==='onew'){const k=ord.sentTab||ord.tab;if(k==='msg')ord.msg='';else Object.keys(ord.cart).forEach(x=>{if(x[0]==='t')delete ord.cart[x]});ord.note='';ord.sent='';ord.view='browse';paintOrder()}
 else if(a==='oview'){if(ord.tab==='toil'&&!cnt('toil'))return;if(ord.tab==='msg'&&!ord.msg.trim())return;ord.view='checkout';ord.err='';paintOrder();const d=$('#odyn');if(d)d.scrollTo(0,0)}
 else if(a==='obackbrowse'){ord.view='browse';paintOrder()}
 else if(a==='food'){if(!S.order.on)return toast('Ordering is switched off right now. Please call reception.');fp.open=true;fp.view='menu';ord.err='';const f=$('#fpage');if(f){f.classList.add('open');paintFood()}}
 else if(a==='fback'){if(fp.view!=='menu'){fp.view='menu';paintFood()}else{fp.open=false;const f=$('#fpage');if(f)f.classList.remove('open')}}
 else if(a==='fcat'){fp.cat=i;paintFood()}
 else if(a==='freview'){fp.view='checkout';ord.err='';paintFood();const f=$('#fpage');if(f)f.scrollTo(0,0)}
 else if(a==='fwa')sendOrder('wa','food');else if(a==='fsms')sendOrder('sms','food');else if(a==='fcopy')sendOrder('copy','food')
 else if(a==='fcheckback'){fp.view='checkout';paintFood()}
 else if(a==='fnew'){Object.keys(ord.cart).forEach(x=>{if(x[0]==='f')delete ord.cart[x]});ord.note='';fp.view='menu';paintFood()}
 else if(a==='addtoil'){S.toil.push({id:uid(),n:'',p:'',a:true});render()}
 else if(a==='deltoil'){S.toil.splice(i,1);render()}
 else if(a==='chat'){chatToggle()}
 else if(a==='send'){chatSend()}
 else if(a==='chip'){chatSend(t.dataset.q)}
 else if(a==='pick'){pick(t)}
 else if(a==='go'){const d=t.dataset.t;d==='top'?scrollTo({top:0,behavior:'smooth'}):document.getElementById(d).scrollIntoView({behavior:'smooth'})}
 else if(a==='copy'){try{await navigator.clipboard.writeText(t.dataset.v);toast('Copied ✓');say('Copied! वायफाय तयार 📶');boom(t)}catch(e){t.textContent='Select & copy manually'}}
 else if(a==='login'){login=true;render()}
 else if(a==='closelogin'){login=false;render()}
 else if(a==='dologin'){
   const inputPw=($('#pw')||{}).value||'';
   const inputHash=await sha(inputPw);
   const currentHash=S.pw||'f549436ca88326a9ab1dd189c8f26e20ee3e357cdcc5a8138a0d38af222f5d7e';
   if(inputHash===currentHash){
     admin=true;login=false;
     try{sessionStorage.setItem('sh_admin','1')}catch(e){}
     render();
   } else {
     $('#lst').textContent='Wrong password.';
   }
 }
 else if(a==='logout'){admin=false;try{sessionStorage.removeItem('sh_admin')}catch(e){}render()}
 else if(a==='tab'){tab=t.dataset.t;render()}
 else if(a==='acat'){ci=i;render()}
 else if(a==='addcat'){S.menu.push({cat:'New category',items:[]});ci=S.menu.length-1;render()}
 else if(a==='delcat'){if(delArm===ci){delArm=-1;S.menu.splice(ci,1);ci=0;mcat=0;fp.cat=0;render()}else{const c0=ci;delArm=ci;render();setTimeout(()=>{if(delArm===c0){delArm=-1;if(admin)render()}},4000)}}
 else if(a==='additem'){S.menu[ci].items.push({id:uid(),n:'',p:'',d:'',v:true,a:true});render()}
 else if(a==='delitem'){S.menu[ci].items.splice(j,1);render()}
 else if(a==='addrule'){S.rules.push('');render()}
 else if(a==='delrule'){S.rules.splice(i,1);render()}
 else if(a==='addnotice'){const v=$('#nt').value.trim();if(v){S.notices.push({id:uid(),t:v,time:new Date().toLocaleString()});save()}}
 else if(a==='delnotice'){S.notices.splice(i,1);save()}
 else if(a==='setpw'){
   const o=($('#opw')||{}).value||'',v=($('#npw')||{}).value||'';
   const currentHash=S.pw||'f549436ca88326a9ab1dd189c8f26e20ee3e357cdcc5a8138a0d38af222f5d7e';
   if(await sha(o)!==currentHash)return st('Current password is wrong.');
   if(v.length<6)return st('Use at least 6 characters.');
   S.pw=await sha(v);
   $('#opw').value='';$('#npw').value='';
   await save();
   st('Password changed and saved.');
 }
 else if(a==='save')save();
}
const dancer=i=>`<svg class="dn" style="--i:${i}" viewBox="0 0 40 64"><circle cx="20" cy="8" r="6"/><path d="M8 16h24L20 34zM20 34L8 56h24z"/><path d="${i%2?'M8 17L0 27M32 17l8 10':'M8 17L3 5M32 17l5-12'}M14 56l-3 8M26 56l3 8" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`;
const hi=()=>{const h=new Date().getHours();return h<5||h>=21?['शुभ रात्री','Quiet night in the hills. Ask us if you need anything.']:h<12?['शुभ प्रभात','Good morning! Fresh chai is waiting ☕']:h<17?['शुभ दुपार','Good afternoon! Time for a good meal 🍛']:['शुभ संध्या','Good evening! Enjoy the cool breeze 🌄']};
const TIPS=['Tap the WiFi tile, the password is ready 📶','आज काय खायचं? Ask us on the menu 🍛','House rules are just below 📜','Enjoyed your stay? A review means a lot ⭐','Tap again for more tips!'];let ti=0;
function say(m){const b=$('#say');if(!b)return;b.textContent=m;b.style.animation='none';void b.offsetWidth;b.style.animation=''}
function owl(){const c=$('#car');if(c){c.classList.add('fast');setTimeout(()=>c.classList.remove('fast'),2200)}say(TIPS[ti++%TIPS.length]);boom($('.sunc'))}
function boom(el){const r=(el||document.body).getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,c=['#f0b23e','#fff7ea','#86e0a3','#ffd2c2','#2a140b'];for(let i=0;i<22;i++){const d=document.createElement('i');d.className='cf';d.style.cssText=`left:${x}px;top:${y}px;background:${c[i%5]};--dx:${(Math.random()-.5)*260}px;--dy:${-80-Math.random()*160}px;--r:${Math.random()*720}deg`;document.body.appendChild(d);setTimeout(()=>d.remove(),1100)}}
function pick(t){const all=S.menu.flatMap(c=>c.items).filter(i=>i.a&&(!vegOnly||i.v)),e=$('#pick');if(!all.length){e.innerHTML='<p class="mu">Nothing to pick right now 🙈</p>';return}const it=all[Math.floor(Math.random()*all.length)];e.innerHTML=`<div class="pickc"><small>🍛 आजचं सुचवणं</small><b>${esc(it.n)}</b><span>${it.p?'₹'+esc(it.p)+' · ':''}${esc(it.d)}</span></div>`;say('Try the '+it.n+'! 🤤');boom(t)}
let AI=true,chat=[],chatOpen=false,busy=false;

const GREET=()=>'नमस्कार! 🙏 I am Saathi, your helper at '+S.hotel.name+'. Ask me about the menu, WiFi, house rules or anything about your stay.';
const CHIPS=['WiFi password?','What is veg on the menu?','House rules?','Suggest a dish'];
function msgs(){return '<div class="bb a">'+esc(GREET())+'</div>'+chat.map(m=>`<div class="bb ${m.role==='user'?'u':'a'}">${m.content?esc(m.content):'…'}</div>`).join('')}
function paint(){const m=$('#cm');if(m){m.innerHTML=msgs();m.scrollTop=m.scrollHeight}}
function chatUI(){if(!AI)return'';return `<button class="fab" data-act="chat" aria-label="Chat with us">💬 Ask us</button><div class="cp ${chatOpen?'open':''}" id="cp"><div class="ch"><b>🪔 Shyadri Saathi</b><button data-act="chat" aria-label="Close chat">✕</button></div><div class="cm" id="cm">${msgs()}</div><div class="chips">${CHIPS.map(c=>`<button data-act="chip" data-q="${esc(c)}">${esc(c)}</button>`).join('')}</div><div class="crow"><input id="cin" placeholder="Ask about the hotel…" maxlength="400" autocomplete="off"><button class="btn" data-act="send">Send</button></div></div>`}
function chatToggle(){chatOpen=!chatOpen;const c=$('#cp');if(c)c.classList.toggle('open',chatOpen);if(chatOpen){const i=$('#cin');if(i)setTimeout(()=>i.focus(),300);paint()}}

function smartReply(q){
 const text=q.toLowerCase();
 if(text.includes('wifi')||text.includes('wi-fi')||text.includes('वायफाय')||text.includes('password')||text.includes('इंटरनेट')){
   return `📶 WiFi Details:\nNetwork: ${S.wifi.name || 'Shyadri_Guest'}\nPassword: ${S.wifi.pass || 'welcome123'}`;
 }
 if(text.includes('rule')||text.includes('नियम')||text.includes('timing')||text.includes('check-out')||text.includes('checkout')){
   return `📜 House Rules:\n${(S.rules||[]).map((r,idx)=>`${idx+1}. ${r}`).join('\n')}`;
 }
 if(text.includes('veg')||text.includes('शाकाहारी')){
   const vegDishes=S.menu.flatMap(c=>c.items).filter(i=>i.v&&i.a);
   const names=vegDishes.map(d=>d.n+(d.p?` (₹${d.p})`:'')).slice(0,6).join(', ');
   return `🥗 Vegetarian options include: ${names}. You can order directly using the 'Order Food' button!`;
 }
 if(text.includes('non-veg')||text.includes('chicken')||text.includes('fish')||text.includes('मटण')||text.includes('मांसाहारी')){
   const nonVeg=S.menu.flatMap(c=>c.items).filter(i=>!i.v&&i.a);
   const names=nonVeg.map(d=>d.n+(d.p?` (₹${d.p})`:'')).slice(0,6).join(', ');
   return `🍗 Non-veg favorites: ${names || 'Available in our menu'}. Check the Menu section to order!`;
 }
 if(text.includes('suggest')||text.includes('recommend')||text.includes('special')||text.includes('काय खा')||text.includes('dish')||text.includes('खायचं')){
   const all=S.menu.flatMap(c=>c.items).filter(i=>i.a);
   if(all.length){
     const pick=all[Math.floor(Math.random()*all.length)];
     return `🍛 How about trying our ${pick.n}${pick.p?` (₹${pick.p})`:''}? ${pick.d || 'A guest favorite!'}`;
   }
 }
 if(text.includes('order')||text.includes('food')||text.includes('ऑर्डर')||text.includes('जेवण')){
   return `🛎️ You can order food directly to your room! Tap the 'Order Food' button on the screen to choose your dishes and send via WhatsApp.`;
 }
 if(text.includes('towel')||text.includes('soap')||text.includes('blanket')||text.includes('toiletr')||text.includes('मदत')||text.includes('room service')){
   return `🧴 Need room amenities? Tap the 'Request' button on the home screen to request towels, soap, extra blankets, or send a message to front desk.`;
 }
 if(text.includes('phone')||text.includes('call')||text.includes('contact')||text.includes('reception')||text.includes('नंबर')||text.includes('संपर्क')){
   return `📞 Reception Phone: ${S.hotel.phone || '+91 8956364864'}. Feel free to contact us anytime!`;
 }
 if(text.includes('hi')||text.includes('hello')||text.includes('hey')||text.includes('नमस्कार')||text.includes('namaste')){
   return `नमस्कार! Welcome to ${S.hotel.name}. How may I help you today? Ask me about WiFi, food menu, rules or room requests.`;
 }
 return `I'm here to help with WiFi, food menu, house rules, and amenities. For special assistance, please reach out to reception${S.hotel.phone ? ' at ' + S.hotel.phone : ''} 🙏`;
}

async function chatSend(pre){
 if(busy||!AI)return;
 const i=$('#cin'),v=String(pre||(i&&i.value)||'').trim().slice(0,400);
 if(!v)return;
 if(i)i.value='';
 chat.push({role:'user',content:v},{role:'assistant',content:''});
 busy=true;
 paint();
 
 let h=chat.slice(0,-1).filter(m=>m.content).slice(-10);
 while(h.length&&h[0].role!=='user')h.shift();

 try{
   const {data,error}=await SB.functions.invoke('ai-chat',{body:{messages:h}});
   if(error||!data||!data.reply)throw error||new Error('Edge function unavailable');
   chat[chat.length-1].content=data.reply;
 }catch(e){
   // Smart Instant Knowledge Fallback
   chat[chat.length-1].content=smartReply(v);
 }
 busy=false;
 paint();
}
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='cin')chatSend()});
let ord={open:false,view:'browse',tab:'toil',cart:{},msg:'',name:'',room:'',note:'',sent:'',sentTab:'',err:''};
let fp={open:false,cat:0,q:'',veg:false,view:'menu',sent:''};
try{const g=JSON.parse(localStorage.getItem('sh_guest')||'{}');ord.name=g.name||'';ord.room=g.room||''}catch(e){}
const num=s=>{let d=String(s||'').replace(/\D/g,'');if(d.length===10)d='91'+d;return d.length>=11?d:''};
const dest=t=>t==='food'?S.order.food:S.order.desk;
const canOrder=()=>!!(S.order.on&&[S.order.food,S.order.desk].some(d=>num(d.wa)||num(d.sms)));
const qty=k=>ord.cart[k]||0,rs=v=>{const n=parseFloat(v);return isNaN(n)?0:n};
function lines(){const f=[],t=[];S.menu.forEach(c=>c.items.forEach(i=>{const q=qty('f:'+i.id);if(q&&i.a)f.push({q,n:i.n,p:i.p,k:'f:'+i.id})}));S.toil.forEach(i=>{const q=qty('t:'+i.id);if(q&&i.a)t.push({q,n:i.n,p:i.p,k:'t:'+i.id})});return{f,t}}
const items=k=>{const l=lines();return k==='food'?l.f:k==='toil'?l.t:[]};
const cnt=k=>items(k).reduce((s,x)=>s+x.q,0),tot=k=>items(k).reduce((s,x)=>s+x.q*rs(x.p),0);
const sumText=k=>{if(k==='msg')return ord.msg.trim()?'Message ready':'Write your message';const c=cnt(k),t=tot(k);return c?`${c} item${c>1?'s':''}${t?` · Rs ${t}`:''}`:'Nothing added yet'};
const TL={food:'Goes to: Kitchen',toil:'Goes to: Front desk (toiletries)',msg:'Goes to: Front desk (message)'};
function buildMsg(bold,k){const B=x=>bold?'*'+x+'*':x,ln=x=>`- ${x.q} x ${x.n}${rs(x.p)?` (Rs ${rs(x.p)})`:''}`,ti={food:'New Food Order',toil:'New Toiletries Request',msg:'New Message'}[k],L=[B(S.hotel.name+' - '+ti),'Room: '+ord.room.trim(),'Name: '+ord.name.trim()];
 if(k==='msg')L.push('',B('MESSAGE'),ord.msg.trim());else L.push('',B(k==='food'?'FOOD':'TOILETRIES'),...items(k).map(ln));
 if(ord.note.trim())L.push('',B('NOTE'),ord.note.trim());const tt=tot(k);if(tt)L.push('','Total: Rs '+tt);L.push('',new Date().toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}));return L.join('\n')}
const stepper=(k,q)=>`<div class="qty"><button data-act="qq" data-k="${k}" data-d="-1" aria-label="Remove one">-</button><span>${q}</span><button class="p" data-act="qq" data-k="${k}" data-d="1" aria-label="Add one">+</button></div>`;
const fCtl=k=>qty(k)?stepper(k,qty(k)):`<button class="btn add" data-act="qq" data-k="${k}" data-d="1">Add</button>`;
const fCard=i=>{const k='f:'+i.id;return `<div class="fc ${i.a?'':'off'}"><span class="vd ${i.v?'v':'n'}"></span><div class="im"><b>${esc(i.n)}</b>${i.d?`<small>${esc(i.d)}</small>`:''}<span class="fprice">${i.p?'Rs '+esc(i.p):''}</span></div>${i.a?`<div class="fctl">${fCtl(k)}</div>`:'<span class="sold">Sold out</span>'}</div>`};
function fList(){const n=fp.q.toLowerCase(),src=fp.q?S.menu.flatMap(x=>x.items):(S.menu[fp.cat]||{items:[]}).items;
 const it=src.filter(i=>(!fp.veg||i.v)&&(!n||(i.n+' '+i.d).toLowerCase().includes(n))).map(fCard).join('')||'<p class="mu" style="padding:14px 0">No dishes match.</p>';
 return (fp.q?'':`<div class="pills sticky">${S.menu.map((x,i)=>`<button class="pill ${i===fp.cat?'on':''}" data-act="fcat" data-i="${i}">${esc(x.cat)}</button>`).join('')}</div>`)+it}
function fBar(){const c=cnt('food'),t=tot('food');return c?`<button class="btn" data-act="freview">View order · ${c} item${c>1?'s':''}${t?' · Rs '+t:''}</button>`:''}
function formHtml(tab){const f=tab==='food',p=f?'f':'o',d=dest(tab),wa=num(d.wa),sm=num(d.sms)||wa;
 return `<div class="oform"><div class="two"><input id="${p}n" placeholder="Your name *" maxlength="60" value="${esc(ord.name)}" autocomplete="name"><input id="${p}r" placeholder="Room no. *" maxlength="10" value="${esc(ord.room)}"></div><input id="${p}x" placeholder="Extra note (optional)" maxlength="300" value="${esc(ord.note)}"><div class="odest">${TL[tab]}</div>${f?'':`<div class="osum" id="osum">${sumText(tab)}</div>`}<div class="oerr" id="${f?'ferr':'oerr'}">${esc(ord.err)}</div>${wa||sm?'':'<p class="mu" style="font-size:.9rem;margin:4px 0 8px">Reception has not set up the ordering number yet. Tap Copy order and show it at reception, or call.</p>'}<div class="osend">${wa?`<button class="btn" data-act="${p}wa">Send on WhatsApp</button>`:''}${sm?`<button class="btn g" data-act="${p}sms">Send as SMS</button>`:''}<button class="btn g" data-act="${p}copy">Copy order</button></div></div>`}
function fCheck(){
 if(fp.view==='sent')return `<div class="ocnf"><h2>Almost done!</h2><p>${fp.sent==='wa'?'WhatsApp':'Your messaging app'} has opened with your food order. <b>Press Send there to place it.</b> If nothing opened, go back and tap Copy order, then show it at reception.</p><div class="osend"><button class="btn g" data-act="fcheckback">Back</button><button class="btn" data-act="fnew">New order</button></div></div>`;
 const l=items('food'),t=tot('food');
 return `<h2 style="margin:14px 0 4px">Your order</h2>${l.map(x=>`<div class="oi"><div class="im"><b>${esc(x.n)}</b>${rs(x.p)?`<small>Rs ${rs(x.p)} each</small>`:''}</div>${stepper(x.k,x.q)}</div>`).join('')||'<p class="mu">Your order is empty. Go back and add dishes.</p>'}${t?`<div class="osum" style="margin:10px 0">Total: Rs ${t}</div>`:''}${l.length?formHtml('food'):''}`}
function foodPage(){const m=fp.view==='menu';return `<div class="fpage ${fp.open?'open':''}" id="fpage"><div class="fh"><button data-act="fback" aria-label="Back">←</button><b>Order Food</b></div><div id="ftools" class="ftools ${m?'':'hidden'}"><input id="fs" type="search" placeholder="Search dishes…" value="${esc(fp.q)}"><label class="sw"><input type="checkbox" id="fv" ${fp.veg?'checked':''}>Veg only</label></div><div id="flist">${m?fList():''}</div><div id="fcheck" class="fcheck">${m?'':fCheck()}</div><div class="fbar" id="fbar">${m?fBar():''}</div></div>`}
function paintFood(){const m=fp.view==='menu',l=$('#flist'),c=$('#fcheck'),b=$('#fbar'),t=$('#ftools');if(l)l.innerHTML=m?fList():'';if(c)c.innerHTML=m?'':fCheck();if(b)b.innerHTML=m?fBar():'';if(t)t.classList.toggle('hidden',!m)}
const oRow=(k,n,p)=>`<div class="oi"><div class="im"><b>${esc(n)}</b>${p?`<small>Rs ${esc(p)}</small>`:''}</div>${stepper(k,qty(k))}</div>`;
function odyn(){
 if(!S.order.on)return '<p class="mu" style="padding:20px 4px">Ordering is switched off right now. Please call reception.</p>';
 if(ord.sent){const w={toil:'toiletries request',msg:'message'}[ord.sentTab]||'request';return `<div class="ocnf"><h2>Almost done!</h2><p>${ord.sent==='wa'?'WhatsApp':'Your messaging app'} has opened with your ${w}. <b>Press Send there to place it.</b> If nothing opened, go back and tap Copy order, then send it to reception.</p><div class="osend"><button class="btn g" data-act="oback">Back</button><button class="btn" data-act="onew">New ${ord.sentTab==='msg'?'message':'request'}</button></div></div>`}
 if(ord.view==='checkout')return checkoutHtml();
 const tabs=[['toil','🧴 Toiletries'],['msg','💬 Message']].map(t=>{const n=t[0]==='toil'?cnt('toil'):0;return `<button class="pill ${ord.tab===t[0]?'on':''}" data-act="otab" data-t="${t[0]}">${t[1]}${n?` (${n})`:''}</button>`}).join('');
 const b=ord.tab==='toil'?(S.toil.filter(i=>i.a&&i.n).map(i=>oRow('t:'+i.id,i.n,i.p)).join('')||'<p class="mu">No items available right now.</p>'):`<label>Message to staff</label><textarea id="omsg" rows="5" maxlength="500" placeholder="e.g. Please send someone to fix the AC, or a wake-up call at 6 AM">${esc(ord.msg)}</textarea>`;
 return `<div class="otabs">${tabs}</div>${b}`}
function checkoutHtml(){const t=ord.tab;let b;
 if(t==='msg')b=`<h2 style="margin:10px 0 6px">Your message</h2><div class="pickc" style="white-space:pre-wrap;margin-top:0">${esc(ord.msg)}</div>`;
 else{const l=items('toil');b=`<h2 style="margin:10px 0 4px">Your cart</h2>`+(l.map(x=>`<div class="oi"><div class="im"><b>${esc(x.n)}</b>${rs(x.p)?`<small>Rs ${rs(x.p)} each</small>`:''}</div>${stepper(x.k,x.q)}</div>`).join('')||'<p class="mu">Your cart is empty. Go back and add items.</p>')}
 return b+formHtml(t)+`<div class="osend" style="margin:0 0 14px"><button class="btn g" data-act="obackbrowse">← Back</button></div>`}
function obar(){if(!S.order.on||ord.sent||ord.view==='checkout')return '';if(ord.tab==='toil'){const c=cnt('toil'),t=tot('toil');return `<div class="obar">${c?`<button class="btn" data-act="oview">View cart · ${c} item${c>1?'s':''}${t?' · Rs '+t:''}</button>`:'<span class="mu">Add items to see your cart</span>'}</div>`}return ord.msg.trim()?'<div class="obar"><button class="btn" data-act="oview">Continue</button></div>':''}
function orderUI(){return `<div class="osheet ${ord.open?'open':''}" id="osheet"><div class="oh"><b>Room help: toiletries and messages</b><button data-act="oclose" aria-label="Close">✕</button></div><div id="odyn">${odyn()}</div><div id="ofw">${obar()}</div></div>`}
function paintOrder(){const d=$('#odyn');if(d)d.innerHTML=odyn();const f=$('#ofw');if(f)f.innerHTML=obar()}
function afterQty(k,t){if(k[0]==='f'){if(fp.view==='checkout')return paintFood();const c=t.closest('.fctl');if(c)c.innerHTML=fCtl(k);const b=$('#fbar');if(b)b.innerHTML=fBar()}else{const sp=t.parentElement.querySelector('span');if(sp)sp.textContent=qty(k);const sm=$('#osum');if(sm)sm.textContent=sumText(ord.tab);const tb=document.querySelector('.otabs .pill.on');if(tb&&ord.tab==='toil'){const c=cnt('toil');tb.textContent='🧴 Toiletries'+(c?` (${c})`:'')}const o=$('#ofw');if(o)o.innerHTML=obar()}}
function validate(tab){if(ord.name.trim().length<2)return 'Please enter your name.';if(!ord.room.trim())return 'Please enter your room number.';if(tab==='msg'){if(!ord.msg.trim())return 'Please write your message.'}else if(!cnt(tab))return 'Add at least one item.';return ''}
function sendOrder(kind,tab){ord.err=validate(tab);const e=$(tab==='food'?'#ferr':'#oerr');if(e)e.textContent=ord.err;if(ord.err)return;
 try{localStorage.setItem('sh_guest',JSON.stringify({name:ord.name.trim(),room:ord.room.trim()}))}catch(x){}
 if(kind==='copy'){const m=buildMsg(false,tab);(navigator.clipboard?navigator.clipboard.writeText(m):Promise.reject()).then(()=>toast('Order copied')).catch(()=>toast('Copy not available'));return}
 const d=dest(tab),wa=num(d.wa),sm=num(d.sms)||wa,u=kind==='wa'?`https://wa.me/${wa}?text=${encodeURIComponent(buildMsg(true,tab))}`:`sms:+${sm}?&body=${encodeURIComponent(buildMsg(false,tab))}`;
 const a=document.createElement('a');a.href=u;if(kind==='wa'){a.target='_blank';a.rel='noopener'}document.body.appendChild(a);a.click();a.remove();
 if(tab==='food'){fp.view='sent';fp.sent=kind;paintFood()}else{ord.sent=kind;ord.sentTab=tab;paintOrder()}boom($(tab==='food'?'#fpage':'#osheet'))}
document.addEventListener('input',e=>{const i=e.target.id,v=e.target.value;if(i==='on'||i==='fn')ord.name=v;else if(i==='or'||i==='fr')ord.room=v;else if(i==='ox'||i==='fx')ord.note=v;else if(i==='omsg'){ord.msg=v;const f=$('#ofw');if(f)f.innerHTML=obar()}else if(i==='fs'){fp.q=v;const l=$('#flist');if(l)l.innerHTML=fList()}else if(i==='fv'){fp.veg=e.target.checked;const l=$('#flist');if(l)l.innerHTML=fList()}});
document.addEventListener('pointermove',e=>{const h=$('#hero');if(!h)return;const r=h.getBoundingClientRect();h.style.setProperty('--px',Math.max(-.5,Math.min(.5,(e.clientX-r.left)/r.width-.5)).toFixed(3))});

const CFG=window.APP_CONFIG||{};
const SB=(window.supabase&&CFG.SUPABASE_URL&&CFG.SUPABASE_ANON_KEY&&!/PASTE_/.test(CFG.SUPABASE_ANON_KEY))?window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY):null;

function loginModal(){
 return `<div class="modal"><div class="card"><h2>Admin login</h2><input id="pw" type="password" placeholder="Password" autocomplete="current-password"><div class="st" id="lst"></div><div class="bar"><button class="btn g" data-act="closelogin">Cancel</button><button class="btn" data-act="dologin">Unlock</button></div></div></div>`;
}

async function fetchConfig(){
 const {data,error}=await SB.from('site_config').select('data').eq('id',1).single();
 if(error||!data)throw (error||new Error('No site_config row found.'));
 S=data.data;
 normalize();
 document.title=S.hotel.name||document.title;
}

async function refresh(){
 try{
   await fetchConfig();
   if(!ord.open&&!fp.open&&!chatOpen&&!login&&!admin)render();
 }catch(e){}
}

function fail(t,m){
 document.getElementById('app').innerHTML='<div class="wrap"><div class="card"><h2>'+esc(t)+'</h2><p>'+esc(m)+'</p></div></div>';
}

async function boot(){
 if(!SB)return fail('Setup needed','Add your Supabase URL and anon key in public/config.js, then redeploy.');
 try{await fetchConfig()}catch(e){return fail('Could not load the site',(e&&e.message)||'Unknown error')}
 AI=true;
 render();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
}
boot();
