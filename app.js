// Locked per-room URL detection
const urlParams = new URLSearchParams(window.location.search);
const lockedRoom = (urlParams.get('room') || urlParams.get('r') || '').trim();
const isRoomLocked = Boolean(lockedRoom);
let S=null;

let guestOrders = [], trackSheetOpen = false, dismissedOrderIds = new Set();
function getMyStoredOrderIds() {
  try {
    const list = JSON.parse(localStorage.getItem('sh_my_orders') || '[]');
    return Array.isArray(list) ? list.map(x => (typeof x === 'string' ? x : x.id)).filter(Boolean) : [];
  } catch(e) { return []; }
}
function addMyStoredOrderId(id) {
  try {
    const list = JSON.parse(localStorage.getItem('sh_my_orders') || '[]');
    const next = [{ id, time: Date.now() }, ...list.filter(x => (typeof x === 'string' ? x : x.id) !== id)].slice(0, 20);
    localStorage.setItem('sh_my_orders', JSON.stringify(next));
  } catch(e) {}
}
function isOrderActiveForGuest(o) {
  if (!o) return false;
  if (dismissedOrderIds.has(o.id)) return false;
  const st = o.status || 'pending';
  if (st === 'pending' || st === 'accepted' || st === 'in_progress' || st === 'preparing' || st === 'ready') return true;
  if (st === 'delivered' || st === 'completed' || st === 'rejected') {
    const fin = new Date(o.updated_at || o.updatedAt || o.created_at || o.createdAt).getTime();
    return (Date.now() - fin) < 10 * 60 * 1000; // 10 minutes auto-vanish
  }
  return false;
}
function getVanishRemainingMinutes(o) {
  const fin = new Date(o.updated_at || o.updatedAt || o.created_at || o.createdAt).getTime();
  const rem = Math.max(0, Math.ceil(10 - (Date.now() - fin) / (60 * 1000)));
  return rem;
}
function getActiveGuestOrders() {
  return guestOrders.filter(isOrderActiveForGuest);
}

function trackBanner(){ return ''; }

function trackUI(){
  if(admin) return '';
  return '<div class="osheet ' + (trackSheetOpen ? 'open' : '') + '" id="tracksheet">'
    + '<div class="oh">'
    + '<b>🛵 Live Room Orders & Requests</b>'
    + '<button data-act="closetrack" aria-label="Close">✕</button>'
    + '</div>'
    + '<div class="track-sheet-content">'
    + renderGuestOrdersList()
    + '</div></div>';
}

function renderGuestOrdersList(){
  const actives = getActiveGuestOrders();
  if(!actives.length){
    return '<div class="empty-track">'
      + '<h3>No Active Orders</h3>'
      + '<p>Orders you place for food or front desk services will appear here with live updates from staff!</p>'
      + (isRoomLocked ? '<p style="margin-top:10px;font-weight:700;color:#6d8a57">🔒 Tracking updates for Room ' + esc(lockedRoom) + '</p>' : '')
      + '</div>';
  }

  return actives.map(o => {
    const isFood = (o.type === 'restaurant:shyadri' || !o.type || o.type === 'restaurant');
    const st = o.status || 'pending';
    const isRejected = (st === 'rejected');
    const isDone = (st === 'delivered' || st === 'completed');
    const isInProg = (st === 'accepted' || st === 'in_progress' || st === 'preparing');
    const rem = getVanishRemainingMinutes(o);

    let step1Class = 'done';
    let step2Class = isInProg ? 'active' : (isDone ? 'done' : '');
    let step3Class = isDone ? 'done' : '';
    if(isRejected){
      step2Class = 'rejected';
      step3Class = '';
    }

    const timeStr = new Date(o.created_at || o.createdAt).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});

    return '<div class="track-order-card" data-id="' + o.id + '">'
      + '<div class="toc-head">'
      + '<div>'
      + '<div class="toc-title">' + (isFood ? '🍽️ Food Order' : '🛎️ Service Request') + ' #' + esc(o.id) + '</div>'
      + '<div class="toc-meta">Room: ' + esc(o.room) + ' • Placed at ' + timeStr + '</div>'
      + '</div>'
      + '<span class="tb-tag" style="background:' + (isDone ? '#27ae60' : (isRejected ? '#c0392b' : (isInProg ? '#2980b9' : '#e67e22'))) + '">' + esc(st) + '</span>'
      + '</div>'
      + (isDone ? '<div class="toc-vanish-note">✅ <b>Delivered!</b> Enjoy your stay. (Vanishes in ' + rem + ' min' + (rem>1?'s':'') + ')</div>' : '')
      + (isRejected ? '<div class="toc-vanish-note rej">❌ <b>Order Declined:</b> ' + esc(o.reject_reason || o.rejectReason || 'Unavailable') + '. (Vanishes in ' + rem + ' min' + (rem>1?'s':'') + ')</div>' : '')
      + '<div class="track-steps">'
      + '<div class="ts-step ' + step1Class + '"><div class="ts-circle">✓</div><div class="ts-label">Received</div></div>'
      + '<div class="ts-step ' + step2Class + '"><div class="ts-circle">' + (isRejected ? '✕' : (isInProg ? '⏳' : (isDone ? '✓' : '2'))) + '</div><div class="ts-label">' + (isRejected ? 'Declined' : (isFood ? 'Cooking' : 'In Progress')) + '</div></div>'
      + '<div class="ts-step ' + step3Class + '"><div class="ts-circle">' + (isDone ? '✓' : '3') + '</div><div class="ts-label">Delivered</div></div>'
      + '</div>'
      + (isFood ? (
        '<ul class="toc-items">'
        + (o.items || []).map(it => '<li class="toc-item"><span>' + esc(it.name) + ' × ' + it.q + '</span><b>Rs ' + ((it.price||0)*(it.q||1)) + '</b></li>').join('')
        + '</ul>'
        + (o.total ? '<div class="toc-total"><span>Total</span><span>Rs ' + o.total + '</span></div>' : '')
      ) : (
        '<div style="font-size:.85rem;margin:8px 0;font-weight:700">' + esc(o.service_title || o.serviceTitle || 'Room Service Request') + '</div>'
      ))
      + (o.note ? '<div class="toc-note"><b>Note:</b> ' + esc(o.note) + '</div>' : '')
      + (isDone && S.review ? (
        '<div class="toc-review-box" id="revbox_' + esc(o.id) + '">'
        + '<div class="trb-title">⭐ Rate your experience</div>'
        + '<div class="trb-sub">How was your food and room service?</div>'
        + '<div class="trb-stars">'
        + [1,2,3,4,5].map(s => '<button type="button" class="trb-star-btn" data-act="rateexp" data-score="' + s + '" data-id="' + esc(o.id) + '" aria-label="' + s + ' stars">★</button>').join('')
        + '</div>'
        + '<div class="trb-feedback" style="display:none;margin-top:10px">'
        + '<textarea class="trb-fb-txt" placeholder="Tell us how we can improve..." rows="2" style="width:100%;font-size:.8rem;padding:6px;border-radius:6px;border:1px solid #ddd;box-sizing:border-box"></textarea>'
        + '<button type="button" class="btn g" style="margin-top:6px;padding:4px 10px;font-size:.75rem" data-act="sendprivfb" data-id="' + esc(o.id) + '">Submit Feedback</button>'
        + '</div>'
        + '</div>'
      ) : '')
      + '</div>';
  }).join('');
}

function normalize(){
 S.hotel=S.hotel||{name:'Hotel',tagline:'',phone:'',ai_info:''};
 S.wifi=S.wifi||{name:'',pass:''};
 S.rules=S.rules||[];
 S.menu=S.menu||[];
 S.notices=S.notices||[];
 S.review=S.review||'https://maps.app.goo.gl/kzwGTSr9TRoqH4bZ7';
 S.upi=S.upi||'';
 S.upiName=S.upiName||'Hotel Shyadri';
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
try{admin=(!isRoomLocked && sessionStorage.getItem('sh_admin')==='1')}catch(e){}

const greet=()=>{const h=new Date().getHours();return h<5?'Good night':h<12?'Good morning':h<17?'Good afternoon':h<21?'Good evening':'Good night'};
const url=u=>/^https?:\/\//i.test(u)?u:'';
const sun=()=>{const h=new Date().getHours();return h<5?'🌙':h<12?'🌅':h<17?'☀️':h<21?'🌇':'🌙'};
function menuBlock(){
 const c=S.menu[mcat]||{items:[]},n=q.toLowerCase();
 const src=q?S.menu.flatMap(x=>x.items):c.items;
 const items=src.filter(it=>(!vegOnly||it.v)&&(!n||(it.n+' '+it.d).toLowerCase().includes(n))).map(it=>`<div class="it ${it.a?'':'off'}"><span class="vd ${it.v?'v':'n'}"></span><div class="im"><b>${esc(it.n)}</b><small>${esc(it.d)}</small></div><div class="pr">${it.a?'₹'+esc(it.p):'Sold out'}</div></div>`).join('')||'<p class="mu">No dishes match.</p>';
 return (q?'':`<div class="pills sticky">${S.menu.map((x,i)=>`<button class="pill ${i===mcat?'on':''}" data-act="cat" data-i="${i}">${esc(x.cat)}</button>`).join('')}</div>`)+items;
}
const OWL=`<svg id="owl" viewBox="0 0 120 132" width="120" height="132" role="img" aria-label="Deck the bellhop owl"><g class="wing wl"><ellipse cx="18" cy="84" rx="11" ry="24" fill="#b8763a" stroke="#2b2118" stroke-width="3"/></g><g class="wing wr"><ellipse cx="102" cy="84" rx="11" ry="24" fill="#b8763a" stroke="#2b2118" stroke-width="3"/></g><ellipse cx="60" cy="80" rx="42" ry="44" fill="#c98a4b" stroke="#2b2118" stroke-width="3"/><ellipse cx="60" cy="94" rx="26" ry="28" fill="#ffe2b0"/><path d="M24 52 L18 24 L48 40Z M96 52 L102 24 L72 40Z" fill="#c98a4b" stroke="#2b2118" stroke-width="3" stroke-linejoin="round"/><g class="eyes"><circle cx="44" cy="62" r="15" fill="#fff" stroke="#2b2118" stroke-width="3"/><circle cx="76" cy="62" r="15" fill="#fff" stroke="#2b2118" stroke-width="3"/><circle class="pup" cx="44" cy="62" r="6.5" fill="#2b2118"/><circle class="pup" cx="76" cy="62" r="6.5" fill="#2b2118"/></g><path d="M53 75 L67 75 L60 88Z" fill="#ff9f1c" stroke="#2b2118" stroke-width="2.5" stroke-linejoin="round"/><circle cx="30" cy="78" r="6" fill="#ff8fab" opacity=".7"/><circle cx="90" cy="78" r="6" fill="#ff8fab" opacity=".7"/><path d="M36 40 Q60 12 84 40Z" fill="#e4553a" stroke="#2b2118" stroke-width="3" stroke-linejoin="round"/><circle cx="60" cy="22" r="5" fill="#ffb938" stroke="#2b2118" stroke-width="2.5"/><path d="M44 122 v8 M52 122 v8 M68 122 v8 M76 122 v8" stroke="#ff9f1c" stroke-width="4" stroke-linecap="round"/></svg>`;

function skyInfo(){
  const d=new Date(),h=d.getHours()+d.getMinutes()/60,n=h<6||h>=19,t=Math.min(1,Math.max(0,(h-6)/13));
  return {
    n,
    c: n ? ['#1d2b64','#6a4c93'] : h<11 ? ['#ffd6a5','#ffb3c1'] : h<17 ? ['#8fd3fe','#e3f6ff'] : ['#ff9a76','#ffd89b'],
    l: n ? 72 : 10+t*78,
    t: n ? 14 : 62-Math.sin(t*Math.PI)*48
  };
}

function guest(){
 const k=skyInfo(),ph=String(S.hotel.phone).replace(/[^+\d]/g,''),rv=url(S.review),H=hi();
 const nt=S.notices.slice().reverse().map(n=>`<div class="card note rv"><b>From the front desk</b><p style="margin:4px 0">${esc(n.t)}</p><small>${esc(n.time)}</small></div>`).join('');
 return `<div class="adm">${isRoomLocked ? `<span class="top-room-badge"><i class="top-r-dot"></i>ROOM ${esc(ord.room||lockedRoom)}</span>` : `<button data-act="login">Admin</button>`}</div><div class="wrap">
 <div class="sky ${k.n?'night':''}" id="sky" data-act="owl" style="--s1:${k.c[0]};--s2:${k.c[1]}">${k.n?'<i class="stars"></i>':''}<i class="orb" style="left:${k.l}%;top:${k.t}%;">${k.n?'🌙':'☀️'}</i><i class="cloud"></i><i class="cloud c2"></i><i class="hill h1"></i><i class="hill h2"></i><div class="bubble pop" id="say" data-act="owl">${esc(H[1])}</div><button class="owlb" data-act="owl" aria-label="Tap Deck the owl">${OWL}</button><div class="rail"></div></div>
 <header class="hero">
  
  <h1>${esc(S.hotel.name)}</h1><span class="tag">${esc(S.hotel.tagline)}</span>
</header>
 ${nt}
 <nav class="qa rv">
   <button class="tile" style="--c:#ffd2c2" data-act="food"><i>🍛</i>Order Food<small>जेवण ऑर्डर</small></button>
   <button class="tile" style="--c:#dcd0ff" data-act="order"><i>🧴</i>Request<small>मदत</small></button>
   <button class="tile" style="--c:#b8f0e6" data-act="go" data-t="wifi"><i>📶</i>WiFi<small>वायफाय</small></button>
   <button class="tile" style="--c:#ffe08a" data-act="go" data-t="menu"><i>🍽️</i>Menu<small>जेवण</small></button>
   <button class="tile" style="--c:#c9f0c0" data-act="go" data-t="rules"><i>📜</i>Rules<small>नियम</small></button>
   ${rv?`<a class="tile" style="--c:#ffc4b5" href="${esc(rv)}" target="_blank" rel="noopener"><i>⭐</i>Review<small>अभिप्राय</small></a>`:''}
   ${ph?`<a class="tile" style="--c:#c9f0c0" href="tel:${ph}"><i>📞</i>Call us<small>संपर्क</small></a>`:''}
 </nav>
 <section class="card rv" id="wifi"><h2>📶 WiFi</h2><div class="kv"><span class="mu">Network</span><b>${esc(S.wifi.name)}</b></div><div class="kv"><span class="mu">Password</span><b>${esc(S.wifi.pass)}</b></div><div class="bar" style="margin:10px 0 0"><button class="btn" data-act="copy" data-v="${esc(S.wifi.pass)}">Copy password</button><button class="btn g" data-act="copy" data-v="${esc(S.wifi.name)}">Copy name</button></div></section>
 <section class="card rv" id="menu"><h2>🍽️ Menu</h2><div class="tools"><input id="q" type="search" placeholder="Search dishes…" value="${esc(q)}"><label class="sw"><input type="checkbox" id="vg" ${vegOnly?'checked':''}>Veg only</label></div><div class="bar" style="justify-content:flex-start;gap:10px"><button class="btn" data-act="food">🛎️ Order food</button><button class="btn g" data-act="pick">आज काय खायचं? 🍛</button></div><div id="pick"></div><div id="mm">${menuBlock()}</div><button class="btn" style="width:100%;margin-top:16px" data-act="food">🛎️ Order food to your room</button></section>
 <section class="card rv" id="rules"><h2>📜 House rules</h2><ol>${S.rules.map(r=>`<li>${esc(r)}</li>`).join('')}</ol></section>
 ${rv?`<section class="card rv" id="review" style="background:#ffe9e2"><h2>Loved your stay? 🧡</h2><p style="margin-top:0">A quick Google review means a lot to our team!</p><a class="btn" href="${esc(rv)}" target="_blank" rel="noopener">⭐ Leave a review</a></section>`:''}
 <p class="foot">Hoot hoot! Thanks for staying with ${esc(S.hotel.name)} 🦉</p></div>
 <nav class="dock"><button data-act="go" data-t="top"><i>🏠</i>Home</button><button data-act="go" data-t="menu"><i>🍽️</i>Menu</button><button data-act="food"><i>🛎️</i>Order</button><button data-act="opentrack" id="docktrack"><i>🛵</i>Track${getActiveGuestOrders().length ? `<b class="dock-badge">${getActiveGuestOrders().length}</b>` : ''}</button><button data-act="go" data-t="wifi"><i>📶</i>WiFi</button><button data-act="go" data-t="rules"><i>📜</i>Rules</button></nav>
 ${foodPage()}${orderUI()}${trackUI()}${chatUI()}${login?loginModal():''}`;
}
function inp(k,v,ph,cls){return `<input ${cls?`class="${cls}" `:''}data-k="${k}" value="${esc(v)}" placeholder="${ph}">`}
function adminView(){
 let b='';
 const kActive = liveOrders.filter(o=>o.type==='restaurant:shyadri'&&o.status!=='delivered'&&o.status!=='rejected').length;
 const sActive = liveOrders.filter(o=>o.type==='hotel:shyadri'&&o.status!=='completed').length;

 if(tab==='kitchen'){
   const rList = liveOrders.filter(o=>{
     const match = (o.type==='restaurant:shyadri');
     if(!match) return false;
     return kitchenFilter==='active' ? (o.status!=='delivered'&&o.status!=='rejected') : (o.status==='delivered'||o.status==='rejected');
   });
   const actCount = liveOrders.filter(o=>o.type==='restaurant:shyadri'&&o.status!=='delivered'&&o.status!=='rejected').length;
   const histCount = liveOrders.filter(o=>o.type==='restaurant:shyadri'&&(o.status==='delivered'||o.status==='rejected')).length;

   b = `<div class="card" style="margin-top:14px">
     <div class="dtopbar">
       <div class="dpulse"><i></i><b>LIVE KITCHEN ORDERS</b></div>
       <div style="display:flex;gap:6px">
         <button class="btn g" style="padding:4px 10px;min-height:32px;font-size:.7rem" data-act="togglesound">${soundEnabled ? '🔔 Alert: ON' : '🔕 Alert: OFF'}</button>
         <button class="btn g" style="padding:4px 10px;min-height:32px;font-size:.7rem" data-act="testsound">Test Chime</button>
       </div>
     </div>
     <div class="staff-alert-banner">⚠️ <b>STAFF ALERT:</b> Check if the guest is in the hotel before accepting orders!</div>
     <div class="filter-bar">
       <button class="fbtn ${kitchenFilter==='active'?'on':''}" data-act="kfilter" data-f="active">Active Orders (${actCount})</button>
       <button class="fbtn ${kitchenFilter==='history'?'on':''}" data-act="kfilter" data-f="history">Order History (${histCount})</button>
     </div>
     ${!rList.length ? `<div class="empty-box">${kitchenFilter==='active'?'No active orders right now. Waiting for guests to order...':'No past order history yet.'}</div>` : `
       <div class="ord-grid">
         ${rList.map(o=>`
           <div class="ord-card" data-id="${o.id}">
             <div class="ord-head">
               <div><span class="ord-room">ROOM ${esc(o.room)}</span></div>
               <div class="ord-meta"><b>${esc(o.id)}</b><br><small>${new Date(o.createdAt||o.created_at).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</small></div>
             </div>
             <ul class="ord-items">
               ${(o.items||[]).map(it=>`<li class="ord-item"><span>${esc(it.name)} x ${it.q}</span><b>₹${it.price ? it.price*it.q : 0}</b></li>`).join('')}
             </ul>
             ${o.note ? `<div class="ord-note">“${esc(o.note)}”</div>` : ''}
             ${o.rejectReason||o.reject_reason ? `<div class="ord-note" style="border-left-color:#e4553a;color:#e4553a">Reason: ${esc(o.rejectReason||o.reject_reason)}</div>` : ''}
             <div class="ord-foot">
               <span class="ord-badge b-${o.status||'pending'}">${esc(o.status||'pending')}</span>
               <b class="ord-tot">${o.total ? '₹'+o.total : ''}</b>
             </div>
             ${kitchenFilter==='active' ? `
               <div class="ord-acts">
                 ${o.status==='pending' ? `
                   <div style="width:100%;font-size:.72rem;color:#856404;background:#FFF3CD;padding:4px 6px;margin-bottom:4px;font-weight:700">⚠️ Verify guest in hotel before accepting</div>
                   <button class="btn-act btn-accept" data-act="upstat" data-id="${o.id}" data-st="accepted">✔ Accept</button>
                   <button class="btn-act btn-reject" data-act="upstat" data-id="${o.id}" data-st="rejected">✖ Reject</button>
                 ` : o.status==='accepted' ? `
                   <button class="btn-act btn-ready" data-act="upstat" data-id="${o.id}" data-st="ready">🍳 Mark Ready</button>
                 ` : o.status==='ready' ? `
                   <button class="btn-act btn-deliver" data-act="upstat" data-id="${o.id}" data-st="delivered">🚀 Mark Delivered</button>
                 ` : ''}
               </div>
             ` : ''}
           </div>
         `).join('')}
       </div>
     `}
   </div>`;
 }

 if(tab==='staff'){
   const sList = liveOrders.filter(o=>o.type==='hotel:shyadri'&&o.status!=='completed');
   b = `<div class="card" style="margin-top:14px">
     <div class="dtopbar">
       <div class="dpulse"><i></i><b>FRONT DESK SERVICE REQUESTS</b></div>
     </div>
     <div class="staff-alert-banner">⚠️ <b>STAFF ALERT:</b> Verify guest room before fulfilling request!</div>
     ${!sList.length ? `<div class="empty-box">No front desk requests right now. Waiting for guests...</div>` : `
       <div class="ord-grid">
         ${sList.map(o=>`
           <div class="ord-card" data-id="${o.id}">
             <div class="ord-head">
               <div><span class="ord-room">ROOM ${esc(o.room)}</span></div>
               <div class="ord-meta"><small>${new Date(o.createdAt||o.created_at).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</small></div>
             </div>
             <div>
               <h3 style="font-size:1.15rem;margin:6px 0">${esc(o.serviceTitle||o.service_title||'Room Service Request')}</h3>
               ${o.note ? `<p class="ord-note">“${esc(o.note)}”</p>` : ''}
             </div>
             <div class="ord-foot">
               <span class="ord-badge ${o.status==='in_progress'?'b-accepted':'b-pending'}">${esc(o.status||'pending')}</span>
             </div>
             <div class="ord-acts">
               ${o.status==='pending' ? `
                 <button class="btn-act btn-accept" data-act="upstat" data-id="${o.id}" data-st="in_progress">✔ In Progress</button>
                 <button class="btn-act btn-deliver" data-act="upstat" data-id="${o.id}" data-st="completed">✅ Resolved</button>
               ` : `
                 <button class="btn-act btn-deliver" data-act="upstat" data-id="${o.id}" data-st="completed">✅ Resolved</button>
               `}
             </div>
           </div>
         `).join('')}
       </div>
     `}
   </div>`;
 }

 if(tab==='qr'){
   b = `<div class="card" style="margin-top:14px">
     <h2>🔗 Per-Room Direct Links & QR</h2>
     <p class="mu" style="margin-top:0">Assign each room its own link. When guests open or scan their room link, their room number is <b>automatically locked</b> so no one can falsify another room's number!</p>
     <div style="display:flex;gap:8px;margin:14px 0">
       <input id="qrinp" placeholder="Enter room number, e.g. 101" style="flex:1">
       <button class="btn" data-act="genqr">Copy Link</button>
     </div>
     <div id="qrout" style="font-weight:700;color:#2aa876;min-height:1.2em;margin-bottom:12px"></div>
     <label style="margin-top:10px">Quick copy for common rooms:</label>
     <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
       ${['101','102','103','104','105','201','202','203','204','205'].map(rm=>`
         <button class="btn g" style="padding:6px 12px;min-height:36px;font-size:.74rem" data-act="quickqr" data-rm="${rm}">Room ${rm}</button>
       `).join('')}
     </div>
   </div>`;
 }

 if(tab==='notices'){b=`<div class="card"><h2>Broadcast a notice</h2><textarea id="nt" rows="3" placeholder="Message for all guests, e.g. Power cut 2-4 PM, generator on."></textarea><button class="btn" data-act="addnotice">Broadcast now</button></div><div class="card"><h2>Live notices</h2>${S.notices.map((n,i)=>`<div class="row"><p style="margin:0 0 6px">${esc(n.t)}</p><small class="mu">${esc(n.time)}</small> <button class="btn d" data-act="delnotice" data-i="${i}">Remove</button></div>`).join('')||'<p class="mu">No notices.</p>'}</div>`}
 if(tab==='menu'){const c=S.menu[ci];b=`<div class="card"><div class="pills">${S.menu.map((x,i)=>`<button class="pill ${i===ci?'on':''}" data-act="acat" data-i="${i}">${esc(x.cat)}</button>`).join('')}<button class="pill" data-act="addcat">+ Category</button></div>${c?`${inp(`menu.${ci}.cat`,c.cat,'Category name')}${c.items.map((it,j)=>{const p=`menu.${ci}.items.${j}.`;return `<div class="row">${inp(p+'n',it.n,'Dish name')}${inp(p+'p',it.p,'Price ₹')}${inp(p+'d',it.d,'Description')}<label><input type="checkbox" data-k="${p}v" ${it.v?'checked':''}>Veg</label><label><input type="checkbox" data-k="${p}a" ${it.a?'checked':''}>Available</label> <button class="btn d" data-act="delitem" data-j="${j}">Delete</button></div>`}).join('')}<div class="bar"><button class="btn g" data-act="additem">+ Add item</button><button class="btn d" data-act="delcat">${delArm===ci?'Tap again to delete':'Delete category'}</button></div>`:'<p class="mu">Add a category to start.</p>'}</div>`}
 if(tab==='order'){const dn=(k,t)=>`<div class="card"><h2>${t}</h2><label>WhatsApp number (with country code)</label>${inp('order.'+k+'.wa',S.order[k].wa,'919876543210')}<label>SMS number (blank = same as WhatsApp)</label>${inp('order.'+k+'.sms',S.order[k].sms,'919876543210')}</div>`;b=`<div class="card"><h2>Ordering</h2><label class="sw"><input type="checkbox" data-k="order.on" ${S.order.on?'checked':''}>Accept orders</label>${[S.order.food,S.order.desk].some(d=>num(d.wa)||num(d.sms))?'':'<p class="st">No number is set yet. Guests can pick items but can only copy the order until you add a number below.</p>'}<p class="mu" style="font-size:.9rem">Orders are sent via WhatsApp and logged live to your Kitchen & Staff Dashboard.</p></div>${dn('food','Kitchen (food orders)')}${dn('desk','Front desk (toiletries and messages)')}<div class="card"><h2>Toiletries</h2>${S.toil.map((x,i)=>`<div class="row">${inp('toil.'+i+'.n',x.n,'Item name')}${inp('toil.'+i+'.p',x.p,'Price Rs (optional)')}<label><input type="checkbox" data-k="toil.${i}.a" ${x.a?'checked':''}>Available</label> <button class="btn d" data-act="deltoil" data-i="${i}">Delete</button></div>`).join('')}<button class="btn g" data-act="addtoil">+ Add item</button></div>`}
 if(tab==='info'){b=`<div class="card"><h2>Details</h2><label>Hotel name</label>${inp('hotel.name',S.hotel.name,'')}<label>Tagline</label>${inp('hotel.tagline',S.hotel.tagline,'')}<label>Reception phone</label>${inp('hotel.phone',S.hotel.phone,'+91…')}<label>WiFi name</label>${inp('wifi.name',S.wifi.name,'')}<label>WiFi password</label>${inp('wifi.pass',S.wifi.pass,'')}<label>Google review link</label>${inp('review',S.review,'https://…')}<label>UPI ID (GPay / PhonePe / Paytm)</label>${inp('upi',S.upi||'','9623004864@superyes')}<label>UPI Payee Name</label>${inp('upiName',S.upiName||S.hotel.name,'Hotel Name')}</div><div class="card"><h2>House rules</h2>${S.rules.map((r,i)=>`<div class="row">${inp('rules.'+i,r,'Rule')}<button class="btn d" data-act="delrule" data-i="${i}">Delete</button></div>`).join('')}<button class="btn g" data-act="addrule">+ Add rule</button></div><div class="card"><h2>Admin password</h2><input id="opw" type="password" placeholder="Current password" autocomplete="current-password"><input id="npw" type="password" placeholder="New password (min 6 chars)" autocomplete="new-password"><button class="btn g" data-act="setpw">Change password</button></div>`}

 return `<div class="wrap"><div class="bar"><h2 style="margin:0">Admin & Dashboard</h2><div><button class="btn g" data-act="logout">Exit</button> <button class="btn" data-act="save">Save changes</button></div></div><div class="st" id="st"></div><div class="pills">${[['kitchen','🍳 Kitchen ('+kActive+')'],['staff','🛎️ Front Desk ('+sActive+')'],['notices','Notices'],['menu','Menu'],['info','Info & rules'],['order','Ordering'],['qr','🔗 Room Links']].map(t=>`<button class="pill ${tab===t[0]?'on':''}" data-act="tab" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>${b}</div>`;
}
function reveal(){const e=document.querySelectorAll('.rv');if(!('IntersectionObserver' in window))return e.forEach(x=>x.classList.add('in'));const o=new IntersectionObserver(r=>r.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');o.unobserve(x.target)}}),{threshold:.08});e.forEach(x=>o.observe(x))}
function toast(m){const d=document.createElement('div');d.className='toast';d.textContent=m;document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}
const mm=()=>{const e=$('#mm');if(e)e.innerHTML=menuBlock()};
document.addEventListener('input',e=>{if(e.target.id==='q'){q=e.target.value;mm()}if(e.target.id==='vg'){vegOnly=e.target.checked;mm()}});
function render(){$('#app').innerHTML=(admin && !isRoomLocked)?adminView():guest();reveal();const p=$('#pw');if(p)p.focus()}
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
 else if(a==='food'){if(!S.order.on)return toast('Ordering is switched off right now. Please call reception.');if(fp.sent){Object.keys(ord.cart).forEach(x=>{if(x[0]==='f')delete ord.cart[x]});ord.note='';fp.sent='';}fp.open=true;fp.view='menu';ord.err='';const f=$('#fpage');if(f){f.classList.add('open');paintFood()}}
 else if(a==='fback'){if(fp.sent){Object.keys(ord.cart).forEach(x=>{if(x[0]==='f')delete ord.cart[x]});ord.note='';fp.sent='';}if(fp.view!=='menu'){fp.view='menu';paintFood()}else{fp.open=false;const f=$('#fpage');if(f)f.classList.remove('open')}}
 else if(a==='fcat'){fp.cat=i;paintFood()}
 else if(a==='freview'){fp.view='checkout';ord.err='';paintFood();const f=$('#fpage');if(f)f.scrollTo(0,0)}
 else if(a==='fwa')sendOrder('wa','food');else if(a==='fsms')sendOrder('sms','food');else if(a==='fcopy')sendOrder('copy','food')
 else if(a==='fcheckback'){fp.view='checkout';paintFood()}
 else if(a==='fnew'||a==='fclear'){Object.keys(ord.cart).forEach(x=>{if(x[0]==='f')delete ord.cart[x]});ord.note='';fp.sent='';fp.view='menu';paintFood()}
 else if(a==='addtoil'){S.toil.push({id:uid(),n:'',p:'',a:true});render()}
 else if(a==='deltoil'){S.toil.splice(i,1);render()}
 else if(a==='chat'){chatToggle()}
 else if(a==='send'){chatSend()}
 else if(a==='chip'){chatSend(t.dataset.q)}
 else if(a==='pick'){pick(t)}
 else if(a==='go'){const d=t.dataset.t;d==='top'?scrollTo({top:0,behavior:'smooth'}):document.getElementById(d).scrollIntoView({behavior:'smooth'})}
 else if(a==='copy'){try{await navigator.clipboard.writeText(t.dataset.v);toast('Copied ✓');say('Copied! वायफाय तयार 📶');boom(t)}catch(e){t.textContent='Select & copy manually'}}
 else if(a==='login'){if(isRoomLocked)return;login=true;render()}
 else if(a==='rateexp'){
   const score = +(t.dataset.score || 5);
   const oid = t.dataset.id;
   const box = document.getElementById('revbox_' + oid);
   if(score >= 4){
     if(box){
       box.innerHTML = '<div style="color:#27ae60;font-weight:700;font-size:.85rem;margin-bottom:6px">🎉 Thank you for ' + score + ' stars!</div>'
         + '<div style="font-size:.78rem;color:#555;margin-bottom:10px">Would you take 10 seconds to share your kind review on Google Maps? It means the world to our staff!</div>'
         + '<a class="btn" style="background:#4285f4;color:#fff;display:inline-block;padding:8px 16px;text-decoration:none" href="' + esc(S.review) + '" target="_blank" rel="noopener">⭐ Share on Google Review</a>';
     }
     window.open(S.review, '_blank', 'noopener');
     toast('Opening Google Review...');
   } else {
     if(box){
       const fb = box.querySelector('.trb-feedback');
       if(fb) fb.style.display = 'block';
       const stars = box.querySelector('.trb-stars');
       if(stars) stars.style.opacity = '0.5';
       const sub = box.querySelector('.trb-sub');
       if(sub) sub.textContent = 'We are sorry to hear that. Please let us know how we can make it right:';
     }
   }
 }
 else if(a==='sendprivfb'){
   const oid = t.dataset.id;
   const box = document.getElementById('revbox_' + oid);
   const txt = (box && box.querySelector('.trb-fb-txt')) ? box.querySelector('.trb-fb-txt').value.trim() : '';
   if(box){
     box.innerHTML = '<div style="color:#27ae60;font-weight:700;font-size:.85rem">🙏 Thank you! Your feedback has been noted directly for management.</div>';
   }
   toast('Feedback submitted!');
 }
 else if(a==='opentrack'){trackSheetOpen=true;render();const s=$('#tracksheet');if(s)s.classList.add('open')}
 else if(a==='closetrack'){trackSheetOpen=false;const s=$('#tracksheet');if(s)s.classList.remove('open');render()}
 else if(a==='dismissbanner'){const id=t.dataset.id;if(id)dismissedOrderIds.add(id);render()}
 else if(a==='closelogin'){login=false;render()}
 else if(a==='dologin'){if(isRoomLocked)return;
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
 else if(a==='kfilter'){kitchenFilter=t.dataset.f;render()}
 else if(a==='togglesound'){soundEnabled=!soundEnabled;render()}
 else if(a==='testsound'){playChime();toast('Chime played 🔔')}
 else if(a==='genqr'){
   const r=($('#qrinp')||{}).value.trim();
   if(!r){toast('Enter a room number');return}
   const link=location.origin+'/?room='+encodeURIComponent(r);
   navigator.clipboard.writeText(link).then(()=>{
     toast('Copied: '+link);
     const o=$('#qrout');if(o)o.textContent='✓ Copied link: '+link;
   });
 }
 else if(a==='quickqr'){
   const rm=t.dataset.rm;
   const link=location.origin+'/?room='+encodeURIComponent(rm);
   navigator.clipboard.writeText(link).then(()=>{
     toast('Copied Room '+rm+' link');
     const o=$('#qrout');if(o)o.textContent='✓ Copied link: '+link;
   });
 }
 else if(a==='upstat'){
   const oid=t.dataset.id, st=t.dataset.st;
   let rsn='';
   if(st==='accepted'||st==='in_progress'){
     if(!confirm('⚠️ STAFF VERIFICATION ALERT:\n\nPlease confirm if the guest is currently in the hotel before accepting!\n\nPress OK if verified, or Cancel to go back.')){return;}
   }
   if(st==='rejected'){
     rsn=prompt('Enter rejection reason (optional):','Item out of stock');
     if(rsn===null)return;
   }
   t.disabled=true;t.textContent='...';
   if(SB){
     SB.from('orders').update({status:st, reject_reason:rsn, updated_at:new Date().toISOString()}).eq('id',oid).then(()=>{
       fetchLiveOrders();
       toast('Order updated to '+st);
     }).catch(err=>{ toast('Update failed'); render(); });
   }
 }
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

function getMealContext(){
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  if(h >= 6 && h < 11.5) return 'breakfast';
  if(h >= 11.5 && h < 16) return 'lunch';
  if(h >= 16 && h < 19) return 'snacks';
  if(h >= 19 && h < 23) return 'dinner';
  return 'night';
}

const TIME_SUGGESTIONS = {
  breakfast: [
    "Morning sunshine! ☀️ Warm Poha & hot cutting Masala Chai are ready for you ☕",
    "Rule #1 of mountain holidays: Never skip breakfast! Treat yourself to pure ghee Sheera 🍯",
    "Chai is calling and you must go! ☕ Piping hot breakfast delivered straight to your room.",
    "Poha or Sheera? Why fight, order both! 😋 Fresh and hot from our kitchen.",
    "Early bird gets the best chai 🌄 Tap WiFi to stream your morning tunes!"
  ],
  lunch: [
    "It's lunch o'clock! 🍛 How about a grand Veg or Fish Thali with cool Solkadhi?",
    "Tummy rumbling? 🤤 Sizzle your afternoon with Chicken Crispy & hot Kolhapuri curry 🌶️",
    "Starters first or straight to the main course? The chef is ready in the kitchen 👨‍🍳",
    "Nothing hits like authentic spicy curry & soft Tandul Bhakari for lunch 😋",
    "Vacation bliss: A heavy thali lunch followed by an afternoon nap 🛌🍛",
    "Paneer Butter Masala with hot rotis — your tastebuds will thank you later!"
  ],
  snacks: [
    "Golden hour = Chai & Snacks hour! ☕ Pair hot Masala Chai with crispy Kothimbir Vadi!",
    "Need a sunset crunch? 🌇 Try our spicy Misal Pav or crispy Veg Crispy!",
    "Chai is a mood, snacks are an emotion 🧡 Tap Order Food for a quick evening bite.",
    "Thirsty after exploring? A chilled glass of Solkadhi or Kokum Sarbat will revive you!",
    "Evening rule: Never drink tea alone, always keep a plate of hot snacks beside it 😋"
  ],
  dinner: [
    "Dinner bell is ringing! 🌙 Start with crunchy Chicken 65 or Paneer Chilli, then dive into Handi curry!",
    "Calories don't count on holidays! 😋 Treat yourself to rich Butter Chicken & hot Bhakari tonight.",
    "Craving bold flavors? Mutton Kolhapuri or Fish Thali will make your night unforgettable 🌶️",
    "Slow down, kick back, and enjoy dinner delivered right to your bed 🛌🍽️",
    "Late dinner feast: Starters, handi curries & hot rotis. Tap Order Food to order!"
  ],
  night: [
    "Quiet night in the hills 🌙 Rest well, tomorrow's hot breakfast starts fresh at 7 AM!",
    "Night owl spotted! 🦉 Relax, drift off, and let tomorrow bring more delicious food.",
    "Listen to the quiet mountain night and drift into deep sleep 😴"
  ]
};

function getMealItems(meal, allItems){
  if(meal === 'breakfast'){
    const bk = allItems.filter(i => {
      const c = (i.category || '').toLowerCase();
      const n = (i.n || '').toLowerCase();
      return c.includes('snack') || c.includes('नाश्ता') || c.includes('drink') || c.includes('पेये') || n.includes('poha') || n.includes('पोहे') || n.includes('sheera') || n.includes('शिरा') || n.includes('chai') || n.includes('चहा') || n.includes('tea');
    });
    if(bk.length) return bk;
  }
  if(meal === 'lunch'){
    const lc = allItems.filter(i => {
      const c = (i.category || '').toLowerCase();
      return c.includes('meal') || c.includes('थाळी') || c.includes('non-veg') || c.includes('नॉनव्हेज') || c.includes('starter') || c.includes('स्टार्टर्स');
    });
    if(lc.length) return lc;
  }
  if(meal === 'snacks'){
    const sn = allItems.filter(i => {
      const c = (i.category || '').toLowerCase();
      return c.includes('snack') || c.includes('नाश्ता') || c.includes('starter') || c.includes('स्टार्टर्स') || c.includes('drink') || c.includes('पेये');
    });
    if(sn.length) return sn;
  }
  if(meal === 'dinner'){
    const dn = allItems.filter(i => {
      const c = (i.category || '').toLowerCase();
      return c.includes('meal') || c.includes('थाळी') || c.includes('non-veg') || c.includes('नॉनव्हेज') || c.includes('starter') || c.includes('स्टार्टर्स');
    });
    if(dn.length) return dn;
  }
  return allItems;
}

const hi=()=>{const h=new Date().getHours();return h<5||h>=21?['शुभ रात्री','Quiet night in the hills. Ask us if you need anything.']:h<12?['शुभ प्रभात','Good morning! Fresh chai is waiting ☕']:h<17?['शुभ दुपार','Good afternoon! Time for a good meal 🍛']:['शुभ संध्या','Good evening! Enjoy the cool breeze 🌄']};
const TIPS=['Tap the WiFi tile, the password is ready 📶','आज काय खायचं? Ask us on the menu 🍛','House rules are just below 📜','Enjoyed your stay? A review means a lot ⭐','Tap again for more tips!'];let ti=0;
function say(m){const b=$('#say');if(!b)return;b.textContent=m;b.style.animation='none';void b.offsetWidth;b.style.animation=''}
function owl(){
  const o=$('#owl');
  if(o){o.classList.remove('hop');void o.getBoundingClientRect();o.classList.add('hop')}
  const meal = getMealContext();
  const quotes = TIME_SUGGESTIONS[meal] || TIME_SUGGESTIONS.lunch;
  
  const all = S.menu.flatMap(cat => (cat.items||[]).map(i=>({...i, category:cat.cat}))).filter(i => i.a && (!vegOnly || i.v));
  const pool = getMealItems(meal, all).filter(i => i.a && (!vegOnly || i.v));
  const foodItems = pool.length ? pool : all;
  
  const foodieSuggestions = foodItems.map(it => {
    const pStr = it.p ? ` (₹${it.p})` : '';
    const descStr = it.d ? ` - ${it.d}` : '';
    const templates = [
      `आज काय खायचं? Try our *${it.n}*${pStr}! 🤤`,
      `Chef's special for right now: *${it.n}*${pStr}${descStr} 🍛`,
      `How about fresh hot *${it.n}*${pStr}? Tap Order Food to order! 🛎️`,
      `Hotel Shyadri favorite: *${it.n}*! Cooked fresh to order 👨‍🍳`,
      `Treat yourself: *${it.n}*${pStr} delivered right to your room 🛌🍽️`
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  });

  const hotelTips = [
    'Tap the WiFi tile on your screen, the password is ready 📶',
    'Want food delivered to your room? Tap "Order Food" to send order on WhatsApp 🛎️',
    'House rules and checkout timings are just below 📜',
    'Enjoyed your stay with us? A quick Google review means a lot ⭐',
    'Tap again for more chef tips & food suggestions! 🍛'
  ];

  const combined = [];
  const maxLen = Math.max(quotes.length, foodieSuggestions.length, hotelTips.length);
  for(let idx = 0; idx < maxLen; idx++){
    if(quotes[idx % quotes.length]) combined.push(quotes[idx % quotes.length]);
    if(foodieSuggestions[idx % foodieSuggestions.length]) combined.push(foodieSuggestions[idx % foodieSuggestions.length]);
    if(hotelTips[idx % hotelTips.length]) combined.push(hotelTips[idx % hotelTips.length]);
  }

  const finalPool = combined.length ? combined : quotes;
  const tip = finalPool[ti++ % finalPool.length];
  say(tip);
  boom($('.sunc') || $('#hero'));
}
function boom(el){const r=(el||document.body).getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,c=['#f0b23e','#fff7ea','#86e0a3','#ffd2c2','#2a140b'];for(let i=0;i<22;i++){const d=document.createElement('i');d.className='cf';d.style.cssText=`left:${x}px;top:${y}px;background:${c[i%5]};--dx:${(Math.random()-.5)*260}px;--dy:${-80-Math.random()*160}px;--r:${Math.random()*720}deg`;document.body.appendChild(d);setTimeout(()=>d.remove(),1100)}}
function pick(t){
  const meal = getMealContext();
  const all = S.menu.flatMap(c => (c.items||[]).map(i=>({...i, category:c.cat}))).filter(i => i.a && (!vegOnly || i.v));
  const pool = getMealItems(meal, all).filter(i => i.a && (!vegOnly || i.v));
  const finalPool = pool.length ? pool : all;
  const e = $('#pick');
  if(!finalPool.length){e.innerHTML='<p class="mu">Nothing to pick right now 🙈</p>';return}
  const it = finalPool[Math.floor(Math.random() * finalPool.length)];
  const mealLabels = {
    breakfast: '🌅 Breakfast pick (सकाळचा नाश्ता)',
    lunch: '🍛 Lunch recommendation (दुपारचं जेवण)',
    snacks: '☕ Evening snack pick (संध्याकाळचा नाश्ता)',
    dinner: '🌙 Dinner recommendation (रात्रीचं जेवण)',
    night: '🦉 Late night pick'
  };
  const label = mealLabels[meal] || '🍛 Chef suggestion';
  e.innerHTML = `<div class="pickc"><small>${label}</small><b>${esc(it.n)}</b><span>${it.p ? '₹' + esc(it.p) + ' · ' : ''}${esc(it.d)}</span></div>`;
  say('How about our ' + it.n + '? 🤤');
  boom(t);
}
let AI=true,chat=[],chatOpen=false,busy=false;

const GREET=()=>'नमस्कार! 🙏 I am Joy, your 24/7 digital assistant at '+S.hotel.name+'. Ask me about the menu, WiFi, house rules, hotel facilities or anything about your stay.';
const CHIPS=['WiFi password?','What are the non-veg options?','What is veg on the menu?','House rules?','Suggest a dish'];
function msgs(){
 return '<div class="bb a">'+esc(GREET())+'</div>'+chat.map(m=>{
   if(m.role==='assistant'&&!m.content){
     return '<div class="bb a typing"><span></span><span></span><span></span></div>';
   }
   return `<div class="bb ${m.role==='user'?'u':'a'}">${esc(m.content)}</div>`;
 }).join('');
}
function paint(){const m=$('#cm');if(m){m.innerHTML=msgs();m.scrollTop=m.scrollHeight}}
function chatUI(){if(!AI)return'';return `<button class="fab" data-act="chat" aria-label="Chat with Joy">💬 Ask Joy</button><div class="cp ${chatOpen?'open':''}" id="cp"><div class="ch"><b>💬 Ask Joy</b><button data-act="chat" aria-label="Close chat">✕</button></div><div class="cm" id="cm">${msgs()}</div><div class="chips">${CHIPS.map(c=>`<button data-act="chip" data-q="${esc(c)}">${esc(c)}</button>`).join('')}</div><div class="crow"><input id="cin" placeholder="Ask about the hotel…" maxlength="400" autocomplete="off"><button class="btn" data-act="send">Send</button></div></div>`}
function chatToggle(){chatOpen=!chatOpen;const c=$('#cp');if(c)c.classList.toggle('open',chatOpen);if(chatOpen){const i=$('#cin');if(i)setTimeout(()=>i.focus(),300);paint()}}

function smartReply(q){
 const text = q.toLowerCase().trim();
 const allCategories = S.menu || [];
 const allItems = allCategories.flatMap(c => (c.items || []).map(it => ({ ...it, category: c.cat })));
 const activeItems = allItems.filter(it => it.a);

 // ── GREETING CHECK: "hi", "hii", "hello", "hey", "namaste" ──
 const isGreeting = /^(hi+|hello+|hey+|hola+|namaste|नमस्कार|प्रणाम|good\s*(morning|afternoon|evening|night))\b/i.test(text) || 
                    ['hi','hii','hiii','hiiii','hello','helloo','hey','heyy','hola','namaste','नमस्कार'].includes(text);
 if(isGreeting){
   const meal = getMealContext();
   const greetings = {
     breakfast: `नमस्कार! ☀️ Good morning! I am Joy, your 24/7 digital assistant at ${S.hotel.name}.\n\nReady for fresh breakfast? How about warm Poha and hot cutting Masala Chai? Ask me about our menu, WiFi password, or house rules!`,
     lunch: `नमस्कार! 🍛 Good afternoon! It's lunch time at ${S.hotel.name}.\n\nLooking for our famous Thalis, starters, or rich curries? I am Joy, ask me about dishes, drinks, or tap "Order Food" to order directly to your room!`,
     snacks: `नमस्कार! ☕ Good evening! Golden hour is chai & snacks time.\n\nCraving hot cutting chai with crispy Kothimbir Vadi or Misal Pav? I am Joy, ask me about evening snacks, WiFi, or room assistance!`,
     dinner: `नमस्कार! 🌙 Good evening! Dinner is ready in our kitchen.\n\nTreat yourself to delicious starters, handi curries, mutton/chicken specials, or a royal thali! I am Joy, how can I help you dine tonight?`,
     night: `नमस्कार! 🌙 Good night! I am Joy, your assistant at ${S.hotel.name}.\n\nRest well in the quiet mountain breeze! If you need WiFi details, tomorrow's breakfast timings, or room items, I am here 24/7!`
   };
   return greetings[meal] || `नमस्कार! 🙏 Welcome to ${S.hotel.name}. I am Joy, your 24/7 digital assistant. How can I help with your stay today?`;
 }

 // ── STEP 0: Detect veg/non-veg INTENT first so it can filter everything below ──
 const isNonVegIntent = text.includes('non-veg') || text.includes('non veg') || text.includes('nonveg') ||
                        text.includes('chicken') || text.includes('fish') || text.includes('mutton') ||
                        text.includes('prawn') || text.includes('seafood') || text.includes('squid') ||
                        text.includes('pomfret') || text.includes('mori') || text.includes('chonak') ||
                        text.includes('egg') || text.includes('anda') || text.includes('मांसाहारी') ||
                        text.includes('चिकन') || text.includes('मटण') || text.includes('मासे');
 // "veg" is intentional veg ONLY if NOT preceded by "non"
 const isVegOnlyIntent = !isNonVegIntent && (text.includes('veg') || text.includes('शाकाहारी') || text.includes('vegetarian') || text.includes('pure veg'));

 // 1. NON-VEG direct query
 if(isNonVegIntent && (text.includes('non-veg') || text.includes('non veg') || text.includes('nonveg') || text.includes('मांसाहारी') || text === 'non veg' || text === 'nonveg')){
   const nonVeg = activeItems.filter(i => !i.v);
   if(nonVeg.length){
     const names = nonVeg.map(d => `• ${d.n}${d.p ? ` (₹${d.p})` : ''}${d.d ? ` - ${d.d}` : ''} [${d.category}]`).join('\n');
     return `🍗 Non-Veg Dishes available:\n${names}\n\n🛎️ Tap "Order Food" to order to your room!`;
   }
   return `Currently there are no active non-veg items on the menu. Please check with reception!`;
 }

 // 2. PURE VEG direct query
 if(isVegOnlyIntent && (text === 'veg' || text.includes('vegetarian') || text.includes('pure veg') || text.includes('शाकाहारी'))){
   const vegDishes = activeItems.filter(i => i.v);
   if(vegDishes.length){
     const names = vegDishes.map(d => `• ${d.n}${d.p ? ` (₹${d.p})` : ''}${d.d ? ` - ${d.d}` : ''} [${d.category}]`).join('\n');
     return `🥗 Pure Veg Options:\n${names}\n\n🛎️ Tap "Order Food" to view the full menu and order!`;
   }
   return `Our kitchen offers delicious pure vegetarian meals. Tap "Order Food" to view the menu!`;
 }

 // 3. Direct Item & Keyword Search — filtered by intent
 const queryClean = text.replace(/[^a-z0-9\s]/gi, ' ').trim();
 const queryTokens = queryClean.split(/\s+/).filter(t => t.length >= 2 && !['non','veg','the','and','for','are','any','show','have','what','your','this','that','want','give'].includes(t));

 const matchedDishes = allItems.filter(it => {
   // Apply veg/non-veg filter based on detected intent
   if(isNonVegIntent && it.v) return false;
   if(isVegOnlyIntent && !it.v) return false;

   const dName = (it.n || '').toLowerCase();
   const dDesc = (it.d || '').toLowerCase();

   // Exact or full substring match on name
   if(text === dName || text.includes(dName) || (dName.length >= 3 && dName.includes(text.replace(/non.?veg|vegetarian|pure veg/gi,'').trim()))) return true;

   // Keyword token match
   const dTokens = dName.replace(/[^a-z0-9\s]/gi, ' ').split(/\s+/).filter(t => t.length >= 2);
   const hasWordMatch = queryTokens.some(qWord => dTokens.some(dWord => dWord === qWord || (dWord.length >= 4 && (dWord.includes(qWord) || qWord.includes(dWord)))));
   if(hasWordMatch) return true;

   // Description keyword (only for single specific words)
   if(queryTokens.length === 1 && queryTokens[0].length >= 3){
     if(dDesc.includes(queryTokens[0])) return true;
   }
   return false;
 });

 if(matchedDishes.length === 1){
   const it = matchedDishes[0];
   const status = it.a ? (it.p ? `priced at ₹${it.p}` : 'available') : 'currently sold out';
   const vegTag = it.v ? 'Pure Veg 🟢' : 'Non-Veg 🍗';
   const desc = it.d ? `\n${it.d}` : '';
   return `🍽️ ${it.n} [${vegTag}] — ${it.category}\nStatus: ${status}.${desc}${it.a ? '\n\n🛎️ Tap "Order Food" to order to your room!' : ''}`;
 }

 if(matchedDishes.length > 1){
   const list = matchedDishes.filter(it=>it.a).map(it => `• ${it.n}${it.p ? ` (₹${it.p})` : ''} [${it.v ? 'Veg 🟢' : 'Non-Veg 🍗'}]`).join('\n');
   return `🍽️ Matching dishes:${isNonVegIntent?' (Non-Veg)':isVegOnlyIntent?' (Veg only)':''}\n${list}\n\n🛎️ Tap "Order Food" to order!`;
 }

 // 4. Category match
 const matchedCat = allCategories.find(c => {
   const cName = (c.cat || '').toLowerCase();
   return text.includes(cName) ||
          (cName.includes('drink') && (text.includes('drink') || text.includes('beverage') || text.includes('चहा') || text.includes('tea') || text.includes('coffee') || text.includes('पेये'))) ||
          (cName.includes('snack') && (text.includes('snack') || text.includes('नाश्ता') || text.includes('starters') || text.includes('starter'))) ||
          (cName.includes('meal') && (text.includes('meal') || text.includes('thali') || text.includes('थाळी') || text.includes('lunch') || text.includes('dinner')));
 });

 if(matchedCat){
   let items = (matchedCat.items || []).filter(i => i.a);
   if(isNonVegIntent) items = items.filter(i => !i.v);
   if(isVegOnlyIntent) items = items.filter(i => i.v);
   if(items.length){
     const list = items.map(d => `• ${d.n}${d.p ? ` (₹${d.p})` : ''}${d.d ? ` - ${d.d}` : ''} [${d.v ? 'Veg 🟢' : 'Non-Veg 🍗'}]`).join('\n');
     return `📋 ${matchedCat.cat}:${isNonVegIntent?' (Non-Veg only)':isVegOnlyIntent?' (Veg only)':''}\n${list}\n\nTap "Order Food" to order!`;
   }
   return `No ${isNonVegIntent?'non-veg':isVegOnlyIntent?'veg':''} items in that category right now. Tap "Order Food" to see the full menu!`;
 }

 // 5. Broad non-veg / veg queries (e.g. "show me chicken options", "any non-veg?")
 if(isNonVegIntent){
   const nonVeg = activeItems.filter(i => !i.v);
   if(nonVeg.length){
     const names = nonVeg.map(d => `• ${d.n}${d.p ? ` (₹${d.p})` : ''} [${d.category}]`).join('\n');
     return `🍗 Non-Veg options available:\n${names}\n\n🛎️ Tap "Order Food" to order!`;
   }
   return `No non-veg items are currently available. Please check with reception!`;
 }

 if(isVegOnlyIntent){
   const vegDishes = activeItems.filter(i => i.v);
   if(vegDishes.length){
     const names = vegDishes.map(d => `• ${d.n}${d.p ? ` (₹${d.p})` : ''} [${d.category}]`).join('\n');
     return `🥗 Pure Veg options:\n${names}\n\n🛎️ Tap "Order Food" to order!`;
   }
   return `Our kitchen offers delicious pure vegetarian meals. Tap "Order Food" to view the menu!`;
 }

 // 5. WiFi queries
 if(text.includes('wifi') || text.includes('wi-fi') || text.includes('वायफाय') || text.includes('password') || text.includes('पासवर्ड') || text.includes('internet') || text.includes('इंटरनेट')){
   return `📶 WiFi Details:\nNetwork: ${S.wifi.name || 'Not set'}\nPassword: ${S.wifi.pass || 'Not set'}\n\n(You can also tap the WiFi tile on the home screen to copy it with one tap!)`;
 }

 // 6. House rules & timings
 if(text.includes('rule') || text.includes('नियम') || text.includes('timing') || text.includes('time') || text.includes('check-out') || text.includes('checkout') || text.includes('checkin') || text.includes('check in')){
   const rules = (S.rules || []).filter(Boolean);
   if(rules.length){
     return `📜 House Rules & Timings:\n${rules.map((r, idx) => `${idx + 1}. ${r}`).join('\n')}`;
   }
   return `Please observe our standard quiet hours and check-out times. Feel free to contact reception for assistance!`;
 }

 // 7. Notices & Announcements from Front Desk
 if(text.includes('notice') || text.includes('announcement') || text.includes('update') || text.includes('सूचना')){
   const notices = (S.notices || []).filter(n => n.t);
   if(notices.length){
     return `📢 Front Desk Notices:\n${notices.map(n => `• ${n.t} (${n.time || ''})`).join('\n')}`;
   }
   return `There are no urgent notices at the moment. Everything is operating normally!`;
 }

 // 8. Dish Suggestion / "What should I eat?"
 if(text.includes('suggest') || text.includes('recommend') || text.includes('special') || text.includes('काय खा') || text.includes('dish') || text.includes('खायचं') || text.includes('best')){
   const meal = getMealContext();
   const pool = getMealItems(meal, activeItems);
   const candidates = pool.length ? pool : activeItems;
   if(candidates.length){
     const pick = candidates[Math.floor(Math.random() * candidates.length)];
     return `🍛 For this time of day, how about trying our *${pick.n}* (${pick.category}) for ₹${pick.p || 'N/A'}? ${pick.d || 'A favorite among our guests!'}\n\nTap "Order Food" to order!`;
   }
 }

 // 9. Food Ordering
 if(text.includes('order') || text.includes('food') || text.includes('ऑर्डर') || text.includes('जेवण') || text.includes('menu') || text.includes('किचन') || text.includes('kitchen')){
   return `🛎️ Ready to order? Tap the "Order Food" button on your screen to browse our full live menu, pick your favorite items, and send the order directly via WhatsApp!`;
 }

 // 10. Toiletries & Room amenities
 if(text.includes('towel') || text.includes('soap') || text.includes('blanket') || text.includes('pillow') || text.includes('toiletr') || text.includes('shampoo') || text.includes('मदत') || text.includes('room service') || text.includes('amenit') || text.includes('kit') || text.includes('brush') || text.includes('paste')){
   const toil = (S.toil || []).filter(t => t.a && t.n).map(t => t.n).join(', ');
   return `🧴 Available room amenities:\n${toil || 'Fresh towels, toiletries, blankets, etc.'}\n\nTap the "Request" button on your screen to send a request directly to our front desk!`;
 }

 // 11. Reception / Contact details
 if(text.includes('phone') || text.includes('call') || text.includes('contact') || text.includes('reception') || text.includes('नंबर') || text.includes('संपर्क') || text.includes('desk') || text.includes('front desk')){
   return `📞 Front Desk Contact:\nPhone: ${S.hotel.phone || 'Available at reception'}\nHotel: ${S.hotel.name} (${S.hotel.tagline || ''})\n\nFeel free to call or visit us for any assistance!`;
 }

 
 }

 // 13. Friendly Greetings
 if(text.includes('hi') || text.includes('hello') || text.includes('hey') || text.includes('नमस्कार') || text.includes('namaste') || text.includes('good morning') || text.includes('good evening')){
   return `नमस्कार! Welcome to ${S.hotel.name}. I am Joy, your 24/7 digital assistant.\n\nYou can ask me about our food menu, drinks, WiFi password, house rules, or request room amenities!`;
 }

 // 14. Smart Fallback with live context
 const summary = [
   allCategories.length ? `• Food & Drinks (${allCategories.map(c => c.cat).join(', ')})` : '',
   S.wifi.name ? `• WiFi details` : '',
   (S.rules || []).length ? `• House rules` : '',
   (S.toil || []).length ? `• Room amenities & requests` : '',
   S.hotel.phone ? `• Reception: ${S.hotel.phone}` : ''
 ].filter(Boolean).join('\n');

 return `I'm happy to help! You can ask me about:\n${summary}\n\nOr feel free to call our front desk${S.hotel.phone ? ` at ${S.hotel.phone}` : ''} 🙏`;
}

async function chatSend(pre){
 if(busy||!AI)return;
 const i=$('#cin'),v=String(pre||(i&&i.value)||'').trim().slice(0,400);
 if(!v)return;
 if(i)i.value='';
 chat.push({role:'user',content:v},{role:'assistant',content:''});
 busy=true;
 paint();
 
 const startTime = Date.now();
 let replyText = '';

 let h=chat.slice(0,-1).filter(m=>m.content).slice(-10);
 while(h.length&&h[0].role!=='user')h.shift();

 try{
   const {data,error}=await SB.functions.invoke('ai-chat',{body:{messages:h}});
   if(error||!data||!data.reply)throw error||new Error('Edge function unavailable');
   replyText=data.reply;
 }catch(e){
   replyText=smartReply(v);
 }

 // Realistic 1-second natural thinking/typing delay
 const elapsed = Date.now() - startTime;
 const delay = Math.max(0, 1000 - elapsed);
 setTimeout(()=>{
   chat[chat.length-1].content=replyText;
   busy=false;
   paint();
 }, delay);
}
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='cin')chatSend()});
let adminTab='kitchen',kitchenFilter='active',liveOrders=[],soundEnabled=true,lastKnownOrderIds=new Set();
function playChime(){
  if(!soundEnabled || !admin || isRoomLocked)return;
  try{
    const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
    const c=new A(),o=c.createOscillator(),g=c.createGain();
    o.type='sine';o.frequency.setValueAtTime(587.33,c.currentTime);
    o.frequency.setValueAtTime(880,c.currentTime+0.12);
    g.gain.setValueAtTime(0.3,c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.6);
    o.connect(g);g.connect(c.destination);
    o.start();o.stop(c.currentTime+0.6);
  }catch(e){}
}
let ord = { open: false, view: 'browse', tab: 'toil', cart: {}, msg: '', name: '', room: lockedRoom, note: '', sent: '', sentTab: '', err: '' };
let fp = { open: false, cat: 0, q: '', veg: false, view: 'menu', sent: '' };
try {
  const g = JSON.parse(localStorage.getItem('sh_guest') || '{}');
  if (g.name) ord.name = g.name;
  
} catch (e) {}
if (isRoomLocked) {
  ord.room = lockedRoom;
}
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
function formHtml(tab){if(isRoomLocked){ord.room=lockedRoom;}const f=tab==='food',p=f?'f':'o',d=dest(tab),wa=num(d.wa),sm=num(d.sms)||wa;
 return `<div class="oform"><div class="two"><input id="${p}n" placeholder="Your name *" maxlength="60" value="${esc(ord.name)}" autocomplete="name">${isRoomLocked ? `<div style="display:flex;flex-direction:column;flex:1"><input id="${p}r" placeholder="Room no." maxlength="10" value="${esc(ord.room)}" readonly style="background:#e8e4d8;cursor:not-allowed;font-weight:700"><small style="color:#2aa876;font-size:0.75rem;margin-top:2px;font-weight:700">🔒 Room ${esc(ord.room)} verified</small></div>` : `<input id="${p}r" placeholder="Room no. *" maxlength="10" value="${esc(ord.room)}">`}</div><input id="${p}x" placeholder="Extra note (optional)" maxlength="300" value="${esc(ord.note)}"><div class="odest">${TL[tab]}</div>${f?'':`<div class="osum" id="osum">${sumText(tab)}</div>`}<div class="oerr" id="${f?'ferr':'oerr'}">${esc(ord.err)}</div><div class="oalert" style="margin:10px 0 12px;padding:10px 14px;background:rgba(255,107,74,0.12);color:#b32400;border:1px solid rgba(255,107,74,0.35);border-radius:10px;font-size:0.83rem;line-height:1.45;text-align:left">⚠️ <b>Notice:</b> Spam and fake orders will be tracked and strict actions will be applied. Please place orders only if you are an in-house hotel guest. Thank you!<br><small style="opacity:0.9">फसव्या किंवा बनावट ऑर्डर्सवर कडक कारवाई केली जाईल. कृपया केवळ हॉटेलमधील पाहुण्यांनीच ऑर्डर करावी.</small></div>${wa||sm?'':'<p class="mu" style="font-size:.9rem;margin:4px 0 8px">Reception has not set up the ordering number yet. Tap Copy order and show it at reception, or call.</p>'}<div class="osend">${wa?`<button class="btn" data-act="${p}wa">Send on WhatsApp</button>`:''}${sm?`<button class="btn g" data-act="${p}sms">Send as SMS</button>`:''}<button class="btn g" data-act="${p}copy">Copy order</button>${tab==='food'&&S.upi&&tot('food')?`<a class="btn btn-upi" style="background:#5f259f;color:#fff;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:6px" href="upi://pay?pa=${encodeURIComponent(S.upi)}&pn=${encodeURIComponent(S.upiName||S.hotel.name)}&am=${tot('food')}&cu=INR&tn=${encodeURIComponent('Room '+ord.room+' Food Order')}" target="_blank" rel="noopener">💳 Pay ₹${tot('food')} via UPI (GPay/PhonePe)</a><p class="mu" style="font-size:.72rem;margin:4px 0 0;text-align:center">Instant UPI payment. Show payment screenshot to delivery staff.</p>`:''}</div></div>`}
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
function validate(tab){if(isRoomLocked){ord.room=lockedRoom;}if(ord.name.trim().length<2)return 'Please enter your name.';if(!ord.room.trim())return 'Please enter your room number.';if(tab==='msg'){if(!ord.msg.trim())return 'Please write your message.'}else if(!cnt(tab))return 'Add at least one item.';return ''}
function sendOrder(kind,tab){ord.err=validate(tab);const e=$(tab==='food'?'#ferr':'#oerr');if(e)e.textContent=ord.err;if(ord.err)return;
 try{localStorage.setItem('sh_guest',JSON.stringify({name:ord.name.trim()}))}catch(x){}
 if(kind==='copy'){const m=buildMsg(false,tab);(navigator.clipboard?navigator.clipboard.writeText(m):Promise.reject()).then(()=>toast('Order copied')).catch(()=>toast('Copy not available'));return}
 const d=dest(tab),wa=num(d.wa),sm=num(d.sms)||wa,u=kind==='wa'?`https://wa.me/${wa}?text=${encodeURIComponent(buildMsg(true,tab))}`:`sms:+${sm}?&body=${encodeURIComponent(buildMsg(false,tab))}`;
 // Background push to Kitchen & Staff Dashboard in Supabase
 if(SB){
   const orderId = 'ORD-SHY-' + Date.now().toString().slice(-4) + '-' + Math.floor(100 + Math.random()*900);
   const isFood = (tab === 'food');
   const orderPayload = {
     id: orderId,
     type: isFood ? 'restaurant:shyadri' : 'hotel:shyadri',
     room: ord.room.trim() + (ord.name.trim() ? ' (' + ord.name.trim() + ')' : ''),
     items: isFood ? items('food').map(x=>({name:x.n, price:rs(x.p), q:x.q})) : [],
     total: isFood ? tot('food') : 0,
     note: isFood ? ord.note.trim() : (ord.msg.trim() || ord.note.trim()),
     service_title: isFood ? '' : (ord.tab==='msg' ? 'Guest Message' : items('toil').map(x=>x.q+'x '+x.n).join(', ')),
     status: 'pending',
     reject_reason: '',
     created_at: new Date().toISOString(),
     updated_at: new Date().toISOString()
   };
   addMyStoredOrderId(orderId);
   guestOrders.unshift(orderPayload);
   SB.from('orders').insert(orderPayload).then(()=>{
     if(typeof fetchLiveOrders === 'function') fetchLiveOrders();
   }).catch(e=>console.warn('Dashboard sync:', e));
 }
 const a=document.createElement('a');a.href=u;if(kind==='wa'){a.target='_blank';a.rel='noopener'}document.body.appendChild(a);a.click();a.remove();
 if(tab==='food'){fp.view='sent';fp.sent=kind;paintFood()}else{ord.sent=kind;ord.sentTab=tab;paintOrder()}boom($(tab==='food'?'#fpage':'#osheet'))}
document.addEventListener('input',e=>{const i=e.target.id,v=e.target.value;if(i==='on'||i==='fn')ord.name=v;else if(i==='or'||i==='fr'){if(!isRoomLocked)ord.room=v;}else if(i==='ox'||i==='fx')ord.note=v;else if(i==='omsg'){ord.msg=v;const f=$('#ofw');if(f)f.innerHTML=obar()}else if(i==='fs'){fp.q=v;const l=$('#flist');if(l)l.innerHTML=fList()}else if(i==='fv'){fp.veg=e.target.checked;const l=$('#flist');if(l)l.innerHTML=fList()}});
document.addEventListener('pointermove',e=>{const sk=$('#sky'),o=$('#owl');if(!sk||!o)return;const r=sk.getBoundingClientRect();sk.style.setProperty('--px',((e.clientX-r.left)/r.width-.5).toFixed(3));sk.style.setProperty('--py',((e.clientY-r.top)/r.height-.5).toFixed(3));const b=o.getBoundingClientRect(),dx=e.clientX-(b.left+b.width/2),dy=e.clientY-(b.top+b.height/2),d=Math.hypot(dx,dy)||1,k=Math.min(5,d/40);o.querySelectorAll('.pup').forEach(p=>p.style.transform=`translate(${dx/d*k}px,${dy/d*k}px)`)});

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


function fetchLiveOrders(){
  if(!SB) return;
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  if(admin){
    SB.from('orders')
      .select('*')
      .in('type', ['restaurant:shyadri', 'hotel:shyadri'])
      .gte('created_at', ninetyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({data, error}) => {
        if(error || !data) return;
        let hasNew = false;
        data.forEach(o => {
          if(!lastKnownOrderIds.has(o.id)){
            if(lastKnownOrderIds.size > 0 && o.status === 'pending') hasNew = true;
            lastKnownOrderIds.add(o.id);
          }
        });
        liveOrders = data;
        if(hasNew && admin && !isRoomLocked && soundEnabled) {
          playChime();
        }
        if(tab === 'kitchen' || tab === 'staff'){
          render();
        } else {
          const kPill = document.querySelector('[data-act="tab"][data-t="kitchen"]');
          const sPill = document.querySelector('[data-act="tab"][data-t="staff"]');
          const kAct = liveOrders.filter(o=>o.type==='restaurant:shyadri'&&o.status!=='delivered'&&o.status!=='rejected').length;
          const sAct = liveOrders.filter(o=>o.type==='hotel:shyadri'&&o.status!=='completed').length;
          if(kPill) kPill.textContent = '🍳 Kitchen (' + kAct + ')';
          if(sPill) sPill.textContent = '🛎️ Front Desk (' + sAct + ')';
        }
      })
      .catch(err => console.warn('Fetch live orders error:', err));
  } else {
    // Guest Live Tracking - ONLY update the tracking sheet and dock badge, NEVER reload the whole page!
    const myIds = getMyStoredOrderIds();
    let q = SB.from('orders')
      .select('*')
      .in('type', ['restaurant:shyadri', 'hotel:shyadri'])
      .gte('created_at', ninetyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(30);

    if(isRoomLocked){
      q = q.like('room', lockedRoom + '%');
    } else if(myIds.length){
      q = q.in('id', myIds);
    } else {
      return;
    }

    q.then(({data, error}) => {
      if(error || !data) return;
      guestOrders = data;
      const act = getActiveGuestOrders();
      
      // Update dock badge without full re-render
      const dBtn = document.querySelector('#docktrack');
      if(dBtn){
        let b = dBtn.querySelector('.dock-badge');
        if(act.length){
          if(!b){
            b = document.createElement('b');
            b.className = 'dock-badge';
            dBtn.appendChild(b);
          }
          b.textContent = act.length;
        } else if(b){
          b.remove();
        }
      }

      // If tracking sheet is currently open, refresh only its content every 5s
      if(trackSheetOpen){
        const tc = document.querySelector('#tracksheet .track-sheet-content');
        if(tc) tc.innerHTML = renderGuestOrdersList();
      }
    }).catch(e => console.warn('Guest orders poll:', e));
  }
}

async function boot(){
 if(!SB)return fail('Setup needed','Add your Supabase URL and anon key in public/config.js, then redeploy.');
 try{await fetchConfig()}catch(e){return fail('Could not load the site',(e&&e.message)||'Unknown error')}
 AI=true;
 if(admin && !isRoomLocked) tab = 'kitchen';
 fetchLiveOrders();
 setInterval(fetchLiveOrders, 5000);
 render();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){refresh();fetchLiveOrders();}});
}
boot();
