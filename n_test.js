
var SUPABASE_URL = "https://uvjqhfvxghtrvogdmzxz.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2anFoZnZ4Z2h0cnZvZ2Rtenh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4MDY4MTMsImV4cCI6MjEwNzM4MjgxM30.uMQChyviNzD074wWGcBYu77XdKosuJk6sMBMVWBAoa0";
function sbHeaders(){
  return {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": "Bearer " + SUPABASE_ANON_KEY,
    "Content-Type": "application/json"
  };
}

// Edit these details for your hotel.
var HOTEL={phone:"+91 00000 00000",email:"stay@hotelnajuka.example",address:"Add the hotel address here"};
var COPY={
 morning:{hi:"Good morning,",mr:"सुप्रभात",line:"Breakfast is ready when you are. Your room can wait."},
 afternoon:{hi:"Good afternoon,",mr:"शुभ दुपार",line:"Lunch is on the table and the lobby is cool."},
 evening:{hi:"Good evening,",mr:"शुभ संध्याकाळ",line:"Tea and snacks are out. Settle in, dinner follows."},
 night:{hi:"Good night,",mr:"शुभ रात्री",line:"Rest well. The front desk is a call away."}};
function periodFor(h){return h>=5&&h<12?"morning":h>=12&&h<17?"afternoon":h>=17&&h<21?"evening":"night"}
var mode="auto",shown=null;
var E={hi:document.getElementById("greeting"),mr:document.getElementById("marathi"),line:document.getElementById("line"),clock:document.getElementById("clock")};
function setCopy(p){var c=COPY[p];E.hi.textContent=c.hi;E.mr.textContent=c.mr;E.line.textContent=c.line;if(typeof TR!=="undefined"&&TR)applyLang()}
function render(){
 var now=new Date(),p=mode==="auto"?periodFor(now.getHours()):mode;
 E.clock.textContent=mode==="auto"?now.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})+" WHERE YOU ARE":"PREVIEW: "+p.toUpperCase();
 if(p!==shown){
  var first=shown===null;shown=p;document.documentElement.setAttribute("data-period",p);
  var f=[E.hi,E.mr,E.line];
  if(first)setCopy(p);else{f.forEach(function(e){e.classList.add("swap")});setTimeout(function(){setCopy(p);f.forEach(function(e){e.classList.remove("swap")})},350)}
  document.querySelectorAll("#day li,#meals .meal").forEach(function(li){li.dataset.p===p?li.setAttribute("data-on",""):li.removeAttribute("data-on")});
 }}
document.querySelectorAll(".pv button").forEach(function(b){b.addEventListener("click",function(){
 mode=b.dataset.mode;document.querySelectorAll(".pv button").forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false")});render()})});

render();setInterval(render,30000);

// 3D: phones follow the pointer, rooms tilt on hover
var rig=document.getElementById("rig"),scene=document.getElementById("scene");
var calm=matchMedia("(prefers-reduced-motion:reduce)").matches;
if(!calm){
 document.addEventListener("pointermove",function(e){
  var x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;
  rig.style.setProperty("--ry",(-18+x*26)+"deg");rig.style.setProperty("--rx",(8-y*18)+"deg")});
 addEventListener("scroll",function(){var s=Math.min(scrollY/600,1);scene.style.transform="translateY("+(s*-40)+"px)"},{passive:true});
 document.querySelectorAll(".room").forEach(function(r){
  r.addEventListener("pointermove",function(e){var b=r.getBoundingClientRect(),x=(e.clientX-b.left)/b.width-.5,y=(e.clientY-b.top)/b.height-.5;
   r.style.transform="rotateY("+x*16+"deg) rotateX("+(-y*16)+"deg) translateZ(10px)"});
  r.addEventListener("pointerleave",function(){r.style.transform=""})})}

// In-page menu card
var menu=document.getElementById("menu"),lastFocus=null;
function openMenu(e){if(e)e.preventDefault();lastFocus=document.activeElement;menu.hidden=false;menu.scrollTop=0;document.body.style.overflow="hidden";document.getElementById("mclose").focus();
 applyLockedRoom();
 try{history.replaceState(null,"","#menu")}catch(x){}}
function closeMenu(){menu.hidden=true;document.body.style.overflow="";try{history.replaceState(null,"",location.pathname+location.search)}catch(x){}if(lastFocus)lastFocus.focus()}
document.querySelectorAll("[data-menu]").forEach(function(a){a.addEventListener("click",openMenu)});
document.getElementById("mclose").addEventListener("click",closeMenu);
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!menu.hidden)closeMenu()});
if(location.hash==="#menu")openMenu();
if(!calm){var mc=document.getElementById("mcard");
 menu.addEventListener("pointermove",function(e){mc.style.setProperty("--ry",((e.clientX/innerWidth-.5)*8)+"deg");mc.style.setProperty("--rx",(-(e.clientY/innerHeight-.5)*6)+"deg")})}

// Menu data, staff editing
var MENU=JSON.parse(document.getElementById("menu-data").textContent);var DEF={desk:"",kitchen:"",open:true,upi:"",upiName:"Hotel Najuka",review:"",map:"",wifiName:"",wifiPass:"",timings:"",emergency:"National emergency number | 112",guide:"",services:"Clean my room\nExtra pillow\nExtra towels\nWake-up call\nHot water not working\nLate check-out",phone:"",email:"",address:""};
Object.keys(DEF).forEach(function(k){if(MENU[k]===undefined||MENU[k]===null)MENU[k]=DEF[k]});var cart={};
function safeUrl(u){u=String(u||"").trim();return /^https?:\/\//i.test(u)?u:""}
MENU.review=safeUrl(MENU.review);MENU.map=safeUrl(MENU.map);if(!/^[\w.\-]{2,}@[\w.\-]{2,}$/.test(MENU.upi||""))MENU.upi="";
var MEALS=[["morning","Morning","Breakfast to start the day."],["afternoon","Afternoon","A full lunch, served fresh."],["evening","Evening","Tea and snacks before dinner."],["night","Night","Dinner, and food to your room if you prefer."]];
var CAN=false,view="view",mbody=document.getElementById("mbody");
var urlParams=new URLSearchParams(window.location.search);
var lockedRoom=(urlParams.get("room")||urlParams.get("r")||"").trim();
var isRoomLocked=Boolean(lockedRoom);

function applyLockedRoom(){
 if(!lockedRoom)return;
 var admTop=document.getElementById("admintop");
 if(admTop){
   admTop.textContent="ROOM "+lockedRoom;
   admTop.classList.add("top-room-badge");
   admTop.style.pointerEvents="none";
   admTop.removeAttribute("href");
 }
 var staffLink=document.getElementById("staff");
 if(staffLink) staffLink.style.display="none";
 var rb=document.getElementById("room-badge");
 if(rb) rb.hidden=true;
 var or=document.getElementById("oroom");
 if(or){or.value=lockedRoom;or.readOnly=true;or.style.background="#ece9dc";or.style.cursor="not-allowed";or.title="Room "+lockedRoom+" verified from link"}
 var sr=document.getElementById("sroom");
 if(sr){sr.value=lockedRoom;sr.readOnly=true;sr.style.background="#ece9dc";sr.style.cursor="not-allowed";sr.title="Room "+lockedRoom+" verified from link"}
}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function money(v){v=String(v||"").trim();return /^\d+(\.\d+)?$/.test(v)?"₹"+v:v}
function itemHtml(i,id){
 var on=MENU.kitchen&&MENU.open&&id&&!i.out;
 var q=on?'<span class="qty" data-id="'+id+'"><button type="button" class="qm" aria-label="Remove one '+esc(i.name)+'">\u2212</button><output>'+(cart[id]?cart[id].q:0)+'</output><button type="button" class="qp" aria-label="Add one '+esc(i.name)+'">+</button></span>':(i.out?'<em class="sold">Sold out</em>':"");
 return '<div class="item'+(i.out?' gone':'')+'"><span>'+esc(i.name)+'</span><i></i>'+(i.price?'<b>'+esc(money(i.price))+'</b>':'')+q+'</div>'}
function getItem(id){var m=/^([a-z]+?)(\d+)$/.exec(id),l=m[1]==="d"?MENU.drinks:MENU.meals[m[1]];return l[+m[2]]}
function nm(n){n=String(n||"").replace(/\D/g,"");return n.length===10?"91"+n:n}
function updateBar(){
 var bar=document.getElementById("obar"),ids=Object.keys(cart);
 bar.hidden=!ids.length||!MENU.kitchen||!MENU.open||view!=="view";if(bar.hidden)return;
 var tot=0,np=0,n=0,lines=ids.map(function(k){var c=cart[k],p=parseFloat(c.price);n+=c.q;if(isNaN(p))np++;else tot+=p*c.q;return "- "+c.q+" x "+c.name+(isNaN(p)?"":" (\u20b9"+p+" each)")});
 document.getElementById("osum").textContent=n+" "+T(n>1?"items":"item")+(tot?", \u20b9"+tot:"")+(np?" + "+T("priced on request"):"");
 var room=document.getElementById("oroom").value.trim(),guestName=(document.getElementById("oname")?document.getElementById("oname").value.trim():""),note=document.getElementById("onote").value.trim();
 var msg="Hotel Najuka room order\nRoom: "+(room||"?")+(guestName?"\nGuest: "+guestName:"")+"\n"+lines.join("\n")+(tot?"\nTotal: \u20b9"+tot:"")+(note?"\nNote: "+note:"");
 var ok=!!room&&!!guestName,up=document.getElementById("oupi"),showUpi=ok&&MENU.upi&&tot>0;
 var owa=document.getElementById("owa");if(owa)owa.href=ok?"https://wa.me/"+nm(MENU.kitchen)+"?text="+encodeURIComponent(msg):"#";
 var osms=document.getElementById("osms");if(osms)osms.href=ok?"sms:+"+nm(MENU.kitchen)+"?&body="+encodeURIComponent(msg):"#";
 if(up){up.hidden=!showUpi;if(showUpi)up.href="upi://pay?pa="+encodeURIComponent(MENU.upi)+"&pn="+encodeURIComponent(MENU.upiName||"Hotel Najuka")+"&am="+tot+"&cu=INR&tn="+encodeURIComponent("Room "+room+" order");}
 var ohint=document.getElementById("ohint");if(ohint)ohint.textContent=T(ok?"Tap Order via WhatsApp to send your order. The kitchen receives it instantly.":(!room?"Enter your room number to continue.":"Enter your name to continue."))+(showUpi?" "+T("Payment is not checked automatically. Show the payment screen to the staff."):"");}
function renderDining(){document.querySelectorAll("#day li").forEach(function(li){var l=MENU.meals[li.dataset.p]||[],el=li.querySelector(".dl");
 if(!el){el=document.createElement("div");el.className="dl";li.appendChild(el)}
 el.innerHTML=l.length?l.map(function(i){return '<span'+(i.out?' class="gone"':'')+'>'+esc(i.name)+(i.price?' <b>'+esc(money(i.price))+'</b>':'')+'</span>'}).join(""):'<em>Today\'s dishes will be added soon.</em>'})}
function viewHtml(){
 var u=MENU.updated?' Updated '+esc(new Date(MENU.updated).toLocaleString([],{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}))+'.':'';
 var h=(MENU.kitchen&&!MENU.open?'<p class="note paused">Room orders are paused right now. Please call the front desk.</p>':'')+'<h2>Drinks, <em>to your room.</em></h2><p class="note"><span>Prices in rupees.</span>'+u+'</p>'+MENU.drinks.map(function(i,n){return itemHtml(i,"d"+n)}).join("");
 h+='<div class="sec"><h2>Meals, <em>by the hour.</em></h2><p class="note">The highlighted meal is being served now.</p><div id="meals">';
 MEALS.forEach(function(m){var l=MENU.meals[m[0]]||[];h+='<div class="meal" data-p="'+m[0]+'"><b>'+m[1]+'</b><span>'+m[2]+'</span><span class="mono">NOW</span><div class="dishes">'+(l.length?l.map(function(i,n){return itemHtml(i,m[0]+n)}).join(""):'<p class="empty">Today\'s dishes will be added here.</p>')+'</div></div>'});
 return h+'</div></div>'}
function rowHtml(i){return '<div class="er"><input class="en" value="'+esc(i.name)+'" placeholder="Item name" aria-label="Item name"><input class="ep" value="'+esc(i.price)+'" placeholder="Price" inputmode="decimal" aria-label="Price in rupees"><label class="so"><input type="checkbox" class="eo"'+(i.out?' checked':'')+'> Sold out</label><button type="button" class="ex" aria-label="Remove item">×</button></div>'}
function groupHtml(k,t,l){return '<div class="eg" data-k="'+k+'"><h3>'+t+'</h3><div class="rows">'+l.map(rowHtml).join("")+'</div><button type="button" class="add">Add item</button></div>'}
function fld(id,label,v,ph,rows){return '<label class="fl"><span class="mono">'+label+'</span>'+(rows?'<textarea id="'+id+'" rows="'+rows+'" placeholder="'+esc(ph||"")+'">'+esc(v||"")+'</textarea>':'<input id="'+id+'" value="'+esc(v||"")+'" placeholder="'+esc(ph||"")+'">')+'</label>'}
function editHtml(){
 var h='<div class="eb"><h3>Message to all guests</h3><p class="note">Shown at the top of the site for every guest. Leave it empty to remove the message.</p><textarea id="enotice" rows="3" maxlength="280" aria-label="Message to all guests" placeholder="For example: Hot water will be off from 2 PM to 4 PM.">'+esc(MENU.notice?MENU.notice.text:"")+'</textarea></div>';
 h+=groupHtml("drinks","Drinks",MENU.drinks);
 MEALS.forEach(function(m){h+=groupHtml(m[0],m[1],MENU.meals[m[0]]||[])});
 h+='<div class="eb"><h3>Orders and requests</h3><label class="so" style="margin:6px 0"><input type="checkbox" id="eopen"'+(MENU.open?' checked':'')+'> Accept room orders (untick after hours)</label>'
  +fld("ekitchen","Kitchen WhatsApp number for orders (country code first, for example 919876543210)",MENU.kitchen,"919876543210")
  +fld("edesk","Front desk WhatsApp number for service requests",MENU.desk,"919876543210")
  '</div>';
 h+='<div class="eb"><h3>Service buttons</h3>'+fld("esvc","One request per line",MENU.services,"",6)+'</div>';
 h+='<div class="eb"><h3>Hotel info</h3>'+fld("ewn","Wi-Fi name",MENU.wifiName,"")+fld("ewp","Wi-Fi password",MENU.wifiPass,"")
  +fld("etm","Timings, one per line (for example: Breakfast 7 to 10 AM)",MENU.timings,"",3)
  +fld("eem","Emergency numbers, one per line: Name | number",MENU.emergency,"",3)
  +fld("egd","Nearby places, one per line: Name | Type | Phone (phone is optional)",MENU.guide,"Shiv Mandir | Temple",4)
  +fld("emap","Google Maps link to the hotel",MENU.map,"https://maps.google.com/...")
  +fld("erv","Google review link (the link that opens the review box)",MENU.review,"https://...")
  +fld("eph","Front desk phone shown to guests",MENU.phone,"")+fld("eml","Email shown to guests",MENU.email,"")+fld("ead","Address shown to guests",MENU.address,"")+'</div>';

 h+='<div class="eb"><h3>Room Direct Links (Per-Room Ordering)</h3><p class="note">Generate and copy direct links for each room QR code. When guests open their room link, their room number is locked so no one can falsify it!</p><div style="display:flex;gap:8px;align-items:center;margin-bottom:8px"><input id="qroominput" placeholder="Room number (e.g. 101)" style="flex:1"><button type="button" class="add" id="qgenlink">Copy Room Link</button></div><div id="qroommsg" class="mono" style="color:var(--hot);min-height:1.2em"></div></div>';
 h+='<div class="eb"><h3>Change admin password</h3><p class="note">Leave both empty to keep the current password.</p><input type="password" id="ecurpass" autocomplete="off" aria-label="Current admin password" placeholder="Current password" style="margin-bottom:8px"><input type="password" id="enewpass" autocomplete="new-password" aria-label="New admin password" placeholder="New password (at least 10 characters)"></div>';
 return h+'<div class="etool"><button type="button" class="mclose" id="esave">Save and publish</button><button type="button" class="ghost" id="ecancel">Cancel</button></div>'}
function authHtml(setup){return '<div class="key" aria-hidden="true"><b>Najuka</b><span class="mono">STAFF ACCESS</span></div><h2>'+(setup?'Create the <em>admin password.</em>':'Staff <em>sign in.</em>')+'</h2><p class="note">'+(setup?'Choose a password with at least 10 characters. Staff will need it to change the menu.':'Enter the admin password to change the menu or send a message to guests.')+'</p><div class="er"><input type="password" id="apass" class="en" autocomplete="'+(setup?'new-password':'current-password')+'" placeholder="Password" aria-label="Password"><button type="button" class="mclose" id="ago">'+(setup?'Set password':'Sign in')+'</button></div>'}
var adminTab="restaurant",kitchenFilter="active",liveOrders=[],soundEnabled=true,lastKnownOrderIds=new Set();
function isFoodOrder(o){
 if(!o) return false;
 return (!o.type || o.type === "restaurant" || o.type === "restaurant:najuka");
}
function isHotelOrder(o){
 if(!o) return false;
 return (o.type === "hotel" || o.type === "hotel:najuka");
}
function playChime(){
 if(!soundEnabled || !unlocked() || isRoomLocked || view !== "edit")return;
 try{
  var A=window.AudioContext||window.webkitAudioContext;if(!A)return;
  var c=new A(),o=c.createOscillator(),g=c.createGain();
  o.type="sine";o.frequency.setValueAtTime(587.33,c.currentTime);
  o.frequency.setValueAtTime(880,c.currentTime+0.12);
  g.gain.setValueAtTime(0.3,c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+0.6);
  o.connect(g);g.connect(c.destination);
  o.start();o.stop(c.currentTime+0.6);
 }catch(e){}
}
function adminDashboardHtml(){
 var restActive=liveOrders.filter(function(o){return isFoodOrder(o)&&o.status!=="delivered"&&o.status!=="rejected"}).length;
 var hotelActive=liveOrders.filter(function(o){return isHotelOrder(o)&&o.status!=="completed"}).length;
 var h='<div class="dnav" role="tablist">'
   +'<button type="button" class="dtab" data-tab="restaurant" aria-selected="'+(adminTab==="restaurant"?"true":"false")+'">🍳 Restaurant (Kitchen)'+(restActive?' <span style="background:var(--hot);color:#fff;border-radius:10px;padding:2px 7px;font-size:0.75rem;font-weight:700">'+restActive+'</span>':'')+'</button>'
   +'<button type="button" class="dtab" data-tab="hotel" aria-selected="'+(adminTab==="hotel"?"true":"false")+'">🛎️ Hotel (Front Desk)'+(hotelActive?' <span style="background:var(--sky);color:#14110F;border-radius:10px;padding:2px 7px;font-size:0.75rem;font-weight:700">'+hotelActive+'</span>':'')+'</button>'
   +'<button type="button" class="dtab" data-tab="settings" aria-selected="'+(adminTab==="settings"?"true":"false")+'">⚙️ Menu & Info Settings</button>'
   +'</div>';
 h+='<div class="dtopbar">'
   +'<div class="dpulse"><i></i><span>LIVE ORDERS & REQUESTS</span></div>'
   +'<div class="dctrls">'
   +'<button type="button" class="sound-btn" id="togglenotif">'+(soundEnabled?'🔔 Alert: ON':'🔕 Alert: OFF')+'</button>'
   +'<button type="button" class="sound-btn" id="testchime">Test Alert Sound</button>'
   +'<button type="button" class="sound-btn" id="stafflogout" style="border-color:#e05252;color:#e05252">Sign Out</button>'
   +'</div></div>';
  if(adminTab!=="settings"){
    h+='<div class="staff-alert-banner" style="background:#FFF3CD;border:2px solid #856404;color:#856404;padding:10px 14px;margin-bottom:14px;font-size:0.85rem;font-weight:600;display:flex;align-items:center;gap:10px"><span style="font-size:1.4rem;line-height:1">⚠️</span><div><b>STAFF ALERT:</b> Check if the guest is in the hotel or not before accepting any order or request!</div></div>';
  }
  if(adminTab==="settings")return h+editHtml();
 if(adminTab==="restaurant"){
  var actCount=liveOrders.filter(function(o){return isFoodOrder(o)&&o.status!=="delivered"&&o.status!=="rejected"}).length;
  var histCount=liveOrders.filter(function(o){return isFoodOrder(o)&&(o.status==="delivered"||o.status==="rejected")}).length;
  h+='<div class="filter-bar">'
    +'<button type="button" class="fbtn" data-f="active" data-active="'+(kitchenFilter==="active"?"true":"false")+'">Active Orders ('+actCount+')</button>'
    +'<button type="button" class="fbtn" data-f="history" data-active="'+(kitchenFilter==="history"?"true":"false")+'">Order History ('+histCount+')</button>'
    +'</div>';
  var rList=liveOrders.filter(function(o){
   if(!isFoodOrder(o))return false;
   return kitchenFilter==="active"?(o.status!=="delivered"&&o.status!=="rejected"):(o.status==="delivered"||o.status==="rejected");
  });
  if(!rList.length){
   h+='<div class="empty-box">'+(kitchenFilter==="active"?'No active orders right now. Waiting for guests to order...':'No past order history yet.')+'</div>';
  }else{
   h+='<div class="ord-grid">';
   rList.forEach(function(o){
    var bClass="b-"+(o.status||"pending");
    var timeStr=new Date(o.createdAt).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
    h+='<div class="ord-card" data-id="'+o.id+'">'
      +'<div class="ord-head"><div><span class="ord-room">ROOM '+esc(o.room)+'</span></div>'
      +'<div class="ord-meta"><b>'+esc(o.id)+'</b><br><span>'+timeStr+'</span></div></div>'
      +'<ul class="ord-items">'
      +o.items.map(function(it){return '<li class="ord-item"><span>'+esc(it.name)+' x '+it.q+'</span><b>'+esc(money(it.price?(it.price*it.q):0))+'</b></li>'}).join('')
      +'</ul>';
    if(o.note)h+='<div class="ord-note">“'+esc(o.note)+'”</div>';
    if(o.rejectReason)h+='<div class="ord-note" style="border-left-color:#c00;color:#c00">Reason: '+esc(o.rejectReason)+'</div>';
    h+='<div class="ord-foot"><span class="ord-badge '+bClass+'">'+esc(o.status)+'</span><b class="ord-tot">'+(o.total?money(o.total):'')+'</b></div>';
    if(kitchenFilter==="active"){
     h+='<div class="ord-acts">';
     if(o.status==="pending"){
      h+='<div style="width:100%;font-size:0.75rem;color:#856404;background:#FFF3CD;padding:4px 6px;border:1px solid #ffeeba;margin-bottom:6px;font-weight:600">⚠️ Check if guest is in hotel before accepting</div><button type="button" class="btn-act btn-accept" data-act="accepted">✔ Accept</button>'
        +'<button type="button" class="btn-act btn-reject" data-act="rejected">✖ Reject</button>';
     }else if(o.status==="accepted"){
      h+='<button type="button" class="btn-act btn-ready" data-act="ready">🍳 Mark Ready</button>';
     }else if(o.status==="ready"){
      h+='<button type="button" class="btn-act btn-deliver" data-act="delivered">🚀 Mark Delivered</button>';
     }
     h+='</div>';
    }
    h+='</div>';
   });
   h+='</div>';
  }
  return h;
 }
 if(adminTab==="hotel"){
  var hList=liveOrders.filter(function(o){return isHotelOrder(o)&&o.status!=="completed"});
  if(!hList.length){
   h+='<div class="empty-box">No front desk service requests right now. Waiting for guests...</div>';
  }else{
   h+='<div class="ord-grid">';
   hList.forEach(function(o){
    var bClass=o.status==="completed"?"b-delivered":(o.status==="in_progress"?"b-accepted":"b-pending");
    var timeStr=new Date(o.createdAt).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
    h+='<div class="ord-card" data-id="'+o.id+'">'
      +'<div class="ord-head"><div><span class="ord-room">ROOM '+esc(o.room)+'</span></div>'
      +'<div class="ord-meta"><span>'+timeStr+'</span></div></div>'
      +'<div><h3 style="font-size:1.15rem;margin:4px 0">'+esc(o.serviceTitle||"Room Service Request")+'</h3>'
      +(o.note?'<p class="ord-note">“'+esc(o.note)+'”</p>':'')+'</div>'
      +'<div class="ord-foot"><span class="ord-badge '+bClass+'">'+esc(o.status)+'</span></div>'
      +'<div class="ord-acts">';
    if(o.status==="pending"){
     h+='<div style="width:100%;font-size:0.75rem;color:#856404;background:#FFF3CD;padding:4px 6px;border:1px solid #ffeeba;margin-bottom:6px;font-weight:600">⚠️ Check if guest is in hotel before accepting</div><button type="button" class="btn-act btn-accept" data-act="in_progress">✔ In Progress</button>'
       +'<button type="button" class="btn-act btn-deliver" data-act="completed">✅ Resolved</button>';
    }else if(o.status==="in_progress"){
     h+='<button type="button" class="btn-act btn-deliver" data-act="completed">✅ Resolved</button>';
    }
    h+='</div></div>';
   });
   h+='</div>';
  }
  return h;
 }
}
var tt2;function toast(t,ok){var el=document.getElementById("toast");el.textContent=t;el.className="toast"+(ok?" ok":"");el.hidden=false;clearTimeout(tt2);tt2=setTimeout(function(){el.hidden=true},ok?5000:9000)}
function stat(t){document.getElementById("mstat").textContent=t;if(t)toast(t,/^(Saved|Updated)/.test(t))}
function markNow(){document.querySelectorAll("#day li,#meals .meal").forEach(function(li){li.dataset.p===shown?li.setAttribute("data-on",""):li.removeAttribute("data-on")})}
function renderNotice(){var n=MENU.notice,h=n&&n.text?'<span class="tag mono">NOTICE</span><span>'+esc(n.text)+'</span>':"";
 ["notice","mnotice"].forEach(function(id){var el=document.getElementById(id);el.innerHTML=h;el.hidden=!h})}
function renderMenu(){
 document.getElementById("mt").innerHTML = view==="view" ? 'The <em>menu card.</em>' : 'Staff <em>access.</em>';
 var mcBtn=document.getElementById("mclose");if(mcBtn)mcBtn.textContent=(view==="edit"||view==="login"||view==="setup")?"Close staff access":"Close menu";
 mbody.innerHTML=view==="edit"?adminDashboardHtml():(view==="login"||view==="setup")?authHtml(view==="setup"):viewHtml();
 document.getElementById("stay-drinks").innerHTML=MENU.drinks.map(function(i){return '<div class="price"><span>'+esc(i.name)+(i.out?' <em class="sold">Sold out</em>':'')+'</span><b>'+esc(money(i.price))+'</b></div>'}).join("");
 renderNotice();renderDining();
 var ol=document.querySelector("#menu .line");
 if(ol){
  if(view==="edit")ol.textContent="Manage live restaurant orders, front desk requests & menu settings.";
  else if(view==="login"||view==="setup")ol.textContent="Restricted area for Hotel Najuka staff members.";
  else ol.textContent=!MENU.kitchen?"Call the front desk to order. We bring it to your room.":MENU.open?"Choose what you want, add your room number and send. The kitchen gets it on WhatsApp.":"Room orders are paused right now. Please call the front desk.";
 }
 updateBar();renderServices();renderInfo();renderContact();markNow();applyLang()}
function go(v,msg){view=v;stat(msg||"");renderMenu()}
function hex(d){return Array.from(new Uint8Array(d)).map(function(x){return x.toString(16).padStart(2,"0")}).join("")}
function sha(t){return crypto.subtle.digest("SHA-256",new TextEncoder().encode(t)).then(hex)}
function pbk(pw,saltHex,it){var salt=new Uint8Array(saltHex.match(/../g).map(function(x){return parseInt(x,16)}));
 return crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveBits"]).then(function(k){return crypto.subtle.deriveBits({name:"PBKDF2",salt:salt,iterations:it,hash:"SHA-256"},k,256)}).then(hex)}
function checkPw(pw){var a=MENU.admin;return(a.alg==="pbkdf2"?pbk(pw,a.salt,a.it):sha(a.salt+pw)).then(function(h){return h===a.hash})}
function mkAdmin(pw){var salt=hex(crypto.getRandomValues(new Uint8Array(16))),it=310000;return pbk(pw,salt,it).then(function(h){return{alg:"pbkdf2",it:it,salt:salt,hash:h}})}
var legacyPw="";
function lockLeft(){try{return Math.max(0,Math.ceil((+sessionStorage.getItem("najukaLock")-Date.now())/1000))}catch(e){return 0}}
function failed(){try{var n=+(sessionStorage.getItem("najukaFails")||0)+1;sessionStorage.setItem("najukaFails",n);if(n>=5)sessionStorage.setItem("najukaLock",Date.now()+Math.min(900,30*Math.pow(2,n-5))*1000)}catch(e){}stat("Wrong password.")}
function remember(h){
 try{
  localStorage.setItem("najukaAdmin",h);
  localStorage.setItem("najukaStaffActive","1");
  sessionStorage.setItem("najukaAdmin",h);
 }catch(e){}
}
function unlocked(){
 try{
  var h=localStorage.getItem("najukaAdmin")||sessionStorage.getItem("najukaAdmin");
  return !!h&&!!MENU.admin&&h===MENU.admin.hash;
 }catch(e){return false}
}
function enterEdit(){
 try{
  localStorage.setItem("najukaStaffActive","1");
  localStorage.setItem("najukaAdminTab",adminTab);
 }catch(e){}
 try{history.replaceState(null,"","#admin")}catch(e){}
 go("edit");
}
function staffLogout(){
 try{
  localStorage.removeItem("najukaStaffActive");
  localStorage.removeItem("najukaAdmin");
  sessionStorage.removeItem("najukaAdmin");
 }catch(e){}
 try{history.replaceState(null,"",location.pathname)}catch(e){}
 go("view","Signed out of staff access.");
}
function authGo(){
 var pw=document.getElementById("apass").value;
 if(!window.crypto||!crypto.subtle){stat("Password check is not available in this browser.");return}
 if(view==="setup"){
  if(pw.length<10){stat("Use at least 10 characters.");return}
  mkAdmin(pw).then(function(a){MENU.admin=a;remember(a.hash);go("edit","Password set. It is saved when you tap Save and publish.")})}
 else{var lk=lockLeft();if(lk){stat("Too many wrong attempts. Try again in "+lk+" seconds.");return}
  checkPw(pw).then(function(ok){if(ok){legacyPw=pw;try{sessionStorage.removeItem("najukaFails")}catch(e){}remember(MENU.admin.hash);enterEdit()}else failed()})}}
function buildPage(state){
 var base=SRC.replace(/(<script id="menu-data" type="application\/json">)[\s\S]*?(<\/script>)/,function(m,a,b){return a+JSON.stringify(state).replace(/</g,"\\u003c")+b});
 var tag="</"+"body>",at=base.lastIndexOf(tag);
 return base.slice(0,at)+"<script>var SRC="+JSON.stringify(base).replace(/</g,"\\u003c")+";<"+"/script>\n"+base.slice(at)}
function save(){
 var next={drinks:[],meals:{},updated:new Date().toISOString(),notice:null,admin:MENU.admin,kitchen:""};
 document.querySelectorAll("#mbody .eg").forEach(function(g){var k=g.dataset.k,list=[];
  g.querySelectorAll(".er").forEach(function(r){var n=r.querySelector(".en").value.trim(),p=r.querySelector(".ep").value.trim();if(n){var it={name:n,price:p};if(r.querySelector(".eo").checked)it.out=true;list.push(it)}});
  if(k==="drinks")next.drinks=list;else next.meals[k]=list});
 var V=function(id){return document.getElementById(id).value.trim()},good=true;
 next.open=document.getElementById("eopen").checked;
 [["kitchen","ekitchen"],["desk","edesk"]].forEach(function(p){var dg=V(p[1]).replace(/\D/g,"");if(dg&&(dg.length<10||dg.length>15)){stat("Enter a valid "+p[0]+" number, 10 to 15 digits.");good=false}next[p[0]]=dg});
 [["review","erv"],["map","emap"]].forEach(function(p){var u=V(p[1]);if(u&&!/^https?:\/\//i.test(u)){stat("The "+p[0]+" link must start with https://");good=false}next[p[0]]=u});
 next.upi='';next.upiName='';next.services=document.getElementById("esvc").value;next.wifiName=V("ewn");next.wifiPass=V("ewp");
 next.timings=document.getElementById("etm").value;next.emergency=document.getElementById("eem").value;next.guide=document.getElementById("egd").value;
 next.phone=V("eph");next.email=V("eml");next.address=V("ead");
 var nt=document.getElementById("enotice").value.trim();if(nt)next.notice={text:nt,at:new Date().toISOString()};
 var np=document.getElementById("enewpass").value,cp=document.getElementById("ecurpass").value;
 if(np&&np.length<10){stat("The new password needs at least 10 characters.");return}
 if(np&&!cp){stat("Enter the current password to change it.");return}
 var btn=document.getElementById("esave");btn.disabled=true;stat("Saving...");
 var origHash = MENU.admin ? MENU.admin.hash : "";
 (np?checkPw(cp).then(function(ok){if(!ok)throw{code:"badpass"};return mkAdmin(np)}).then(function(a){next.admin=a;remember(a.hash)}):(legacyPw&&MENU.admin&&MENU.admin.alg!=="pbkdf2"?mkAdmin(legacyPw).then(function(a){next.admin=a;remember(a.hash)}):Promise.resolve()))
 .then(function(){
   var authHash = origHash;
   // Direct write to Supabase MENU-CONFIG so eopen and all settings are guaranteed saved!
   fetch(SUPABASE_URL + '/rest/v1/orders?id=eq.MENU-CONFIG', {
     method: 'PATCH',
     headers: sbHeaders(),
     body: JSON.stringify({ items: next, updated_at: new Date().toISOString() })
   }).catch(function(e){ console.warn("Direct MENU-CONFIG sync:", e); });

   return fetch('/api/menu', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ data: next, hash: authHash })
   });
 })
 .then(function(r){
   if(!r.ok) return r.json().then(function(e){ throw e; });
   return r.json();
 })
 .then(function(res){
   btn.disabled=false;
   MENU = next;
   renderMenu();
   toast("Saved. The site is updated live!", true);
 })
 .catch(function(err){
   btn.disabled=false;
   var c=err&&(err.error||err.code);
   stat(c==="badpass"?"The current password is wrong.":"The changes could not be saved. Try again.");
 });
}
mbody.addEventListener("click",function(e){var t=e.target;
 var tb=t.closest(".dtab");if(tb){adminTab=tb.dataset.tab;try{localStorage.setItem("najukaAdminTab",adminTab)}catch(e){}renderMenu();return}
 var fb=t.closest(".fbtn");if(fb){kitchenFilter=fb.dataset.f;renderMenu();return}
 if(t.id==="togglenotif"){soundEnabled=!soundEnabled;renderMenu();return}
 if(t.id==="testchime"){playChime();toast("Audio alert chime played!",true);return}
 if(t.id==="stafflogout"){staffLogout();return}
 if(t.id==="qgenlink"){var r=(document.getElementById("qroominput").value||"").trim();if(!r){toast("Enter a room number first");return}var link=location.origin+"/?room="+encodeURIComponent(r);navigator.clipboard.writeText(link).then(function(){toast("Copied room link!",true);document.getElementById("qroommsg").textContent="✓ Copied: "+link}).catch(function(){document.getElementById("qroommsg").textContent=link});return;}
 
 var ab=t.closest(".btn-act");
 if(ab){
  var card=ab.closest(".ord-card"),oid=card.dataset.id,act=ab.dataset.act,rsn="";
  if(act==="accepted"||act==="in_progress"){
    if(!confirm("⚠️ Staff Verification Alert:\n\nPlease check if the guest is currently in the hotel before accepting!\n\nPress OK if verified, or Cancel to go back.")){return;}
   }
   if(act==="rejected"){rsn=prompt("Enter rejection reason (optional):","Item out of stock");if(rsn===null)return}
  ab.disabled=true;ab.textContent="...";
  fetch(SUPABASE_URL + '/rest/v1/orders?id=eq.' + encodeURIComponent(oid), {
    method: 'PATCH',
    headers: sbHeaders(),
    body: JSON.stringify({ status: act, reject_reason: rsn, updated_at: new Date().toISOString() })
  })
  .then(function(){
    fetchLiveOrders();
    toast("Order updated to "+act, true);
  })
  .catch(function(err){
    console.error("Direct update error:", err);
    toast("Update failed.");
  });
  return;
 }
 if(t.classList.contains("ex"))t.parentNode.remove();
 else if(t.classList.contains("add")){var rows=t.parentNode.querySelector(".rows");rows.insertAdjacentHTML("beforeend",rowHtml({name:"",price:""}));rows.lastChild.querySelector("input").focus()}
 else if(t.id==="ecancel")go("view");
 else if(t.id==="esave")save();
 else if(t.classList.contains("qp")||t.classList.contains("qm")){var box=t.parentNode,id=box.dataset.id,it=getItem(id),c=cart[id]||(cart[id]={name:it.name,price:it.price,q:0});
  c.q=Math.max(0,c.q+(t.classList.contains("qp")?1:-1));box.querySelector("output").textContent=c.q;if(!c.q)delete cart[id];updateBar()}
 else if(t.id==="ago")authGo()});
document.addEventListener("click",function(e){if(e.target&&e.target.id==="gtdismiss"){try{localStorage.removeItem("najuka_my_order")}catch(x){}var el=document.getElementById("guesttracker");if(el)el.hidden=true;}});
document.addEventListener("click", function(e){
  var starBtn = e.target.closest(".nstar");
  if(starBtn){
    var sc = +(starBtn.dataset.score || 5);
    var rBox = document.getElementById("gtreview");
    if(sc >= 4){
      if(rBox){
        rBox.innerHTML = '<div style="color:#27ae60;font-weight:700;font-size:.85rem;margin-bottom:4px">🎉 Thank you for ' + sc + ' stars!</div>'
          + '<div style="font-size:.75rem;color:#555;margin-bottom:8px">Would you take a moment to leave a review on Google Maps? It means a lot to our team!</div>'
          + '<a class="btn" style="display:inline-block;padding:6px 14px;text-decoration:none" href="' + esc(MENU.review) + '" target="_blank" rel="noopener noreferrer">⭐ Share on Google Review</a>';
      }
      window.open(MENU.review, "_blank", "noopener,noreferrer");
      toast("Opening Google Review...", true);
    } else {
      if(rBox){
        var fb = document.getElementById("gtrfb");
        if(fb) fb.style.display = "block";
        var stars = document.getElementById("gtrstars");
        if(stars) stars.style.opacity = "0.4";
        var sub = document.getElementById("gtrsub");
        if(sub) sub.textContent = "We are sorry! Please let us know how we can make it right:";
      }
    }
    return;
  }
  if(e.target && e.target.id === "gtrfbsubmit"){
    var rBox = document.getElementById("gtreview");
    if(rBox){
      rBox.innerHTML = '<div style="color:#27ae60;font-weight:700;font-size:.85rem">🙏 Thank you! Your feedback has been noted directly for management.</div>';
    }
    toast("Thank you for your feedback!", true);
  }
});
document.getElementById("obar").addEventListener("input",updateBar);
document.getElementById("obar").addEventListener("click",function(e){if(e.target.closest("a")&&!document.getElementById("oroom").value.trim()){e.preventDefault();document.getElementById("oroom").focus()}});
// ── Silently sends order to kitchen dashboard in the background ──
function submitOrderDirect(rm,items,tot,note,cb){
  if(!MENU.open){
    toast("Room ordering is currently paused by hotel staff. Please call the front desk.");
    if(cb) cb(false);
    return;
  }
  var orderId = 'ORD-' + Date.now().toString().slice(-4) + '-' + Math.floor(100 + Math.random() * 900);
  var now = new Date().toISOString();
  var newRow = {
    id: orderId,
    type: 'restaurant:najuka',
    room: rm,
    items: items,
    total: tot,
    note: note,
    status: 'pending',
    reject_reason: '',
    created_at: now,
    updated_at: now
  };
  fetch(SUPABASE_URL + '/rest/v1/orders', {
    method: 'POST',
    headers: {
      ...sbHeaders(),
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(newRow)
  })
  .then(function(r){ return r.json(); })
  .then(function(inserted){
    try{localStorage.setItem("najuka_my_order", orderId)}catch(e){}
    fetchLiveOrders();
    if(cb) cb(true, orderId);
  })
  .catch(function(err){
    console.error("Direct order creation error:", err);
    if(cb) cb(false);
  });
}

// ── Shared: build WhatsApp URL from current cart ──
function buildWaUrl(rm,nm){
 var ids=Object.keys(cart);
 if(!ids.length)return null;
 var items=ids.map(function(k){var c=cart[k];return {name:c.name,price:parseFloat(c.price)||0,q:c.q}});
 var tot=items.reduce(function(s,i){return s+(i.price*i.q)},0);
 var lines=items.map(function(i){return "- "+i.q+" x "+i.name+(i.price?" (₹"+i.price+" each)":"")});
 var note=document.getElementById("onote").value.trim();
 var msg="Hotel Najuka room order\nRoom: "+rm+"\nGuest: "+nm+"\n"+lines.join("\n")+(tot?"\nTotal: ₹"+tot:"")+(note?"\nNote: "+note:"");
 return "https://wa.me/"+nm_clean(MENU.kitchen)+"?text="+encodeURIComponent(msg);
}
function nm_clean(n){n=String(n||"").replace(/\D/g,"");return n.length===10?"91"+n:n}

var waBtn=document.getElementById("owa");
if(waBtn){
 waBtn.addEventListener("click",function(e){
  var rm=document.getElementById("oroom").value.trim();
  var gn=document.getElementById("oname")?document.getElementById("oname").value.trim():"";
  if(!rm){e.preventDefault();document.getElementById("oroom").focus();toast("Please enter your room number first.");return}
  if(!gn){e.preventDefault();document.getElementById("oname").focus();toast("Please enter your name.");return}
  var ids=Object.keys(cart);
  if(!ids.length){e.preventDefault();toast("Add items to your order first.");return}

  var rmFull=rm+" ("+gn+")";
  var items=ids.map(function(k){var c=cart[k];return {name:c.name,price:parseFloat(c.price)||0,q:c.q}});
  var tot=items.reduce(function(s,i){return s+(i.price*i.q)},0);
  var note=document.getElementById("onote").value.trim();

  // Send to kitchen dashboard silently in the background
  submitOrderDirect(rmFull,items,tot,note,function(ok,ordId){
   if(ok){
    cart={};updateBar();
    toast("Order "+ordId+" sent to kitchen!",true);
   }
  });
 });
}
function updateGuestTracker(){
 var el=document.getElementById("guesttracker");
 if(!el)return;
 if(view!=="view"){el.hidden=true;return}
 var myId=localStorage.getItem("najuka_my_order");
 var ord=null;
 if(myId){
   ord=liveOrders.find(function(o){return o.id===myId});
 }
 if(!ord && isRoomLocked){
   ord=liveOrders.find(function(o){
     var r=(o.room||"").trim();
     return r===lockedRoom || r.indexOf(lockedRoom+" ")===0 || r.indexOf(lockedRoom+"(")==0;
   });
 }
 if(!ord){el.hidden=true;return}

 var st=ord.status||"pending";
 var rem=10;
 if(st==="delivered"||st==="completed"||st==="rejected"){
   var fin=new Date(ord.updatedAt||ord.updated_at||ord.createdAt||ord.created_at).getTime();
   var elapsed=Date.now()-fin;
   if(elapsed >= 10 * 60 * 1000){ // 10 minutes auto-vanish
     el.hidden=true;
     return;
   }
   rem=Math.max(0, Math.ceil(10 - elapsed / 60000));
 }

 el.hidden=false;
 var isFood=isFoodOrder(ord);
 document.getElementById("gtnum").textContent=(isFood?"🍽️ #":"🛎️ #")+ord.id+" (Room "+ord.room+")";
 var msg="Waiting for staff confirmation...";
 if(st==="accepted"||st==="in_progress") msg=isFood?"👨‍🍳 Accepted! Cooking your order.":"🛎️ In Progress! Staff is on it.";
 else if(st==="ready") msg="🍳 Ready! On its way to your room.";
 else if(st==="delivered"||st==="completed") msg="✅ Delivered to room! (Vanishes in "+rem+"m)";
 else if(st==="rejected") msg="❌ Declined ("+(ord.rejectReason||ord.reject_reason||"Unavailable")+"). (Vanishes in "+rem+"m)";
 document.getElementById("gtstat").textContent=msg;
 var tVal=ord.updatedAt||ord.updated_at||ord.createdAt||ord.created_at;
 document.getElementById("gttime").textContent=tVal?new Date(tVal).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):"Live";
 var rBox = document.getElementById("gtreview");
 if(rBox){
   var isDelivered = (st === "delivered" || st === "completed");
   rBox.hidden = !isDelivered || !MENU.review;
 }
}
function fetchLiveOrders(){
  var ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  var url = SUPABASE_URL + '/rest/v1/orders?type=in.(restaurant:najuka,hotel:najuka)&created_at=gte.' + ninetyDaysAgo + '&select=*&order=created_at.desc&limit=200';
  
  return fetch(url, {
    headers: sbHeaders(),
    cache: 'no-store'
  })
  .then(function(r){ return r.ok ? r.json() : null })
  .then(function(rows){
    if(!Array.isArray(rows)) return;
    var orders = rows.map(function(row){
      var isFood = (!row.type || row.type === 'restaurant:najuka' || row.type === 'restaurant');
      return {
        id: row.id,
        type: isFood ? 'restaurant' : 'hotel',
        rawType: row.type,
        room: String(row.room || ''),
        items: Array.isArray(row.items) ? row.items : [],
        total: Number(row.total || 0),
        note: row.note || '',
        serviceTitle: row.service_title || '',
        service_title: row.service_title || '',
        status: row.status || 'pending',
        rejectReason: row.reject_reason || '',
        reject_reason: row.reject_reason || '',
        createdAt: row.created_at || new Date().toISOString(),
        created_at: row.created_at || new Date().toISOString(),
        updatedAt: row.updated_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString()
      };
    });

    var hasNew = false;
    orders.forEach(function(o){
      if(!lastKnownOrderIds.has(o.id)){
        if(lastKnownOrderIds.size > 0 && o.status === "pending") hasNew = true;
        lastKnownOrderIds.add(o.id);
      }
    });
    liveOrders = orders;
    if(hasNew && unlocked() && !isRoomLocked && view === "edit" && soundEnabled) playChime();
    
    if(view === "edit"){
      if(adminTab === "settings"){
        var rPend = liveOrders.filter(function(o){return isFoodOrder(o) && o.status === 'pending'}).length;
        var hPend = liveOrders.filter(function(o){return isHotelOrder(o) && o.status === 'pending'}).length;
        var rBadge = document.querySelector('.dtab[data-tab="restaurant"] .dcount');
        if(rBadge){rBadge.textContent = rPend; rBadge.style.display = rPend > 0 ? '' : 'none'}
        var hBadge = document.querySelector('.dtab[data-tab="hotel"] .dcount');
        if(hBadge){hBadge.textContent = hPend; hBadge.style.display = hPend > 0 ? '' : 'none'}
      } else {
        var actEl = document.activeElement;
        if(!actEl || !mbody.contains(actEl)) renderMenu();
      }
    }
    updateGuestTracker();
  })
  .catch(function(err){ console.error("Direct Supabase poll error:", err); });
}
fetchLiveOrders();
setInterval(fetchLiveOrders,5000);
mbody.addEventListener("keydown",function(e){if(e.key==="Enter"&&e.target.id==="apass")authGo()});
document.getElementById("mclose").addEventListener("click",function(){go("view")});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&view!=="view")go("view")});
document.getElementById("admintop").addEventListener("click",function(e){e.preventDefault();if(isRoomLocked)return;document.getElementById("staff").click()});
document.getElementById("staff").addEventListener("click",function(e){if(isRoomLocked){e.preventDefault();return;}openMenu(e);
 if(!MENU.admin){if(CAN)go("setup");else go("view","No admin password has been set yet. The page owner must set it first.")}
 else if(unlocked())enterEdit();
 else go("login")});

// ---- Languages, services, info, contact
var TR={"Admin":["अ‍ॅडमिन","एडमिन"],"Rooms": ["खोल्या", "कमरे"], "Stay info": ["मुक्काम माहिती", "ठहरने की जानकारी"], "Menu": ["मेनू", "मेन्यू"], "Menu and room orders": ["मेनू आणि रूम ऑर्डर", "मेन्यू और रूम ऑर्डर"], "Good morning,": ["सुप्रभात,", "सुप्रभात,"], "Good afternoon,": ["शुभ दुपार,", "शुभ दोपहर,"], "Good evening,": ["शुभ संध्याकाळ,", "शुभ संध्या,"], "Good night,": ["शुभ रात्री,", "शुभ रात्रि,"], "Breakfast is ready when you are. Your room can wait.": ["तुम्ही तयार असाल तेव्हा नाश्ता तयार आहे. खोली थांबू शकते.", "आप जब चाहें, नाश्ता तैयार है। कमरा इंतज़ार कर सकता है।"], "Lunch is on the table and the lobby is cool.": ["दुपारचे जेवण तयार आहे आणि लॉबीमध्ये गारवा आहे.", "दोपहर का खाना तैयार है और लॉबी में ठंडक है।"], "Tea and snacks are out. Settle in, dinner follows.": ["चहा आणि नाश्ता तयार आहे. निवांत बसा, मग रात्रीचे जेवण.", "चाय और नाश्ता तैयार है। आराम से बैठिए, फिर रात का खाना।"], "Rest well. The front desk is a call away.": ["छान विश्रांती घ्या. फ्रंट डेस्क एका फोनवर आहे.", "आराम से सोइए। फ्रंट डेस्क बस एक कॉल दूर है।"], "Your room, <em>your rest.</em>": ["तुमची खोली, <em>तुमची विश्रांती.</em>", "आपका कमरा, <em>आपका आराम।</em>"], "Clean, quiet rooms with everything a good night's sleep needs.": ["स्वच्छ, शांत खोल्या, चांगल्या झोपेसाठी जे हवे ते सगळे.", "साफ़, शांत कमरे, अच्छी नींद के लिए ज़रूरी हर चीज़ के साथ।"], "1–2 GUESTS": ["१–२ पाहुणे", "१–२ मेहमान"], "LONGER STAYS": ["जास्त मुक्कामासाठी", "लंबे ठहराव के लिए"], "GROUPS": ["गटांसाठी", "समूहों के लिए"], "Standard": ["स्टँडर्ड", "स्टैंडर्ड"], "Deluxe": ["डिलक्स", "डीलक्स"], "Family": ["फॅमिली", "फैमिली"], "A comfortable bed, air conditioning, a private bathroom and hot water.": ["आरामदायक बिछाना, एअर कंडिशनिंग, स्वतंत्र बाथरूम आणि गरम पाणी.", "आरामदायक बिस्तर, एयर कंडीशनिंग, निजी बाथरूम और गर्म पानी।"], "More space, a seating corner and a work desk. Suited to business travel.": ["जास्त जागा, बसण्याची सोय आणि वर्क डेस्क. कामानिमित्त प्रवासासाठी योग्य.", "ज़्यादा जगह, बैठने का कोना और वर्क डेस्क। कारोबारी यात्रा के लिए उपयुक्त।"], "Extra beds and room to spread out, so everyone travels together.": ["जास्तीचे बेड आणि भरपूर जागा, म्हणजे सगळे एकत्र राहू शकतात.", "अतिरिक्त बिस्तर और खुली जगह, ताकि सब साथ ठहर सकें।"], "The restaurant keeps pace <em>with the day.</em>": ["रेस्टॉरंट दिवसाच्या <em>गतीने चालते.</em>", "रेस्टोरेंट दिन की रफ़्तार के <em>साथ चलता है।</em>"], "The meal highlighted is the one being served where you are.": ["हायलाइट केलेले जेवण सध्या दिले जात आहे.", "जो भोजन हाइलाइट है, वही अभी परोसा जा रहा है।"], "Morning": ["सकाळ", "सुबह"], "Afternoon": ["दुपार", "दोपहर"], "Evening": ["संध्याकाळ", "शाम"], "Night": ["रात्र", "रात"], "Breakfast to start the day.": ["दिवसाची सुरुवात नाश्त्याने.", "दिन की शुरुआत नाश्ते से।"], "A full lunch, served fresh.": ["ताजे बनवलेले पूर्ण दुपारचे जेवण.", "ताज़ा बना पूरा दोपहर का खाना।"], "Tea and snacks before dinner.": ["रात्रीच्या जेवणाआधी चहा आणि नाश्ता.", "रात के खाने से पहले चाय और नाश्ता।"], "Dinner, and food to your room if you prefer.": ["रात्रीचे जेवण, हवे असल्यास खोलीत.", "रात का खाना, चाहें तो कमरे में।"], "Order from your room": ["खोलीतून ऑर्डर करा", "अपने कमरे से ऑर्डर करें"], "Ask the <em>front desk.</em>": ["फ्रंट डेस्कला <em>सांगा.</em>", "फ्रंट डेस्क से <em>कहें।</em>"], "Enter your room number, then tap what you need. A WhatsApp message opens, ready to send.": ["खोली क्रमांक टाका, मग हवे ते निवडा. WhatsApp संदेश तयार उघडेल.", "कमरा नंबर डालें, फिर ज़रूरत चुनें। WhatsApp संदेश तैयार खुलेगा।"], "Clean my room": ["माझी खोली स्वच्छ करा", "मेरा कमरा साफ़ करें"], "Extra pillow": ["जास्तीची उशी", "अतिरिक्त तकिया"], "Extra towels": ["जास्तीचे टॉवेल", "अतिरिक्त तौलिए"], "Wake-up call": ["वेक-अप कॉल", "वेक-अप कॉल"], "Hot water not working": ["गरम पाणी येत नाही", "गर्म पानी नहीं आ रहा"], "Late check-out": ["उशिरा चेक-आउट", "देर से चेक-आउट"], "Room number": ["खोली क्रमांक", "कमरा नंबर"], "Details (for example, wake-up at 6:30 AM)": ["तपशील (उदा. सकाळी ६:३० ला उठवा)", "विवरण (जैसे सुबह 6:30 बजे उठाना)"], "Note for the kitchen (optional)": ["किचनसाठी सूचना (ऐच्छिक)", "किचन के लिए नोट (वैकल्पिक)"], "While you <em>stay.</em>": ["तुमच्या <em>मुक्कामात.</em>", "आपके <em>ठहराव में।</em>"], "Everything you may need, in one place.": ["तुम्हाला लागणारे सर्व काही, एकाच ठिकाणी.", "जो कुछ भी चाहिए, एक ही जगह।"], "TO YOUR ROOM, PAID": ["खोलीत, सशुल्क", "कमरे में, सशुल्क"], "Drinks": ["पेये", "पेय"], "FREE, JUST ASK": ["मोफत, फक्त सांगा", "मुफ़्त, बस कहिए"], "Complimentary": ["मोफत सेवा", "निःशुल्क सेवाएँ"], "Extra towels, soap and other toiletries. Call the front desk and we will send them up.": ["जास्तीचे टॉवेल, साबण आणि इतर प्रसाधने. फ्रंट डेस्कला फोन करा, आम्ही पाठवू.", "अतिरिक्त तौलिए, साबुन और अन्य प्रसाधन। फ्रंट डेस्क को कॉल करें, हम भिजवा देंगे।"], "CHECK-OUT": ["चेक-आउट", "चेक-आउट"], "Please vacate your room and hand the key to the front desk by noon.": ["कृपया दुपारी १२ पर्यंत खोली रिकामी करा आणि चावी फ्रंट डेस्कला द्या.", "कृपया दोपहर 12 बजे तक कमरा खाली करें और चाबी फ्रंट डेस्क को दें।"], "Open the full menu card": ["पूर्ण मेनू कार्ड उघडा", "पूरा मेन्यू कार्ड खोलें"], "House rules": ["हॉटेलचे नियम", "होटल के नियम"], "Quiet hours are 10 PM to 6 AM. Please keep voices low in the corridors.": ["शांततेची वेळ रात्री १० ते सकाळी ६. कृपया पॅसेजमध्ये हळू बोला.", "शांति का समय रात 10 से सुबह 6 बजे तक है। कृपया गलियारों में धीरे बोलें।"], "No smoking inside rooms or corridors.": ["खोल्या आणि पॅसेजमध्ये धूम्रपान करू नये.", "कमरों और गलियारों में धूम्रपान न करें।"], "Visitors are welcome in the lobby only. Please do not take them to rooms.": ["पाहुण्यांना फक्त लॉबीमध्ये भेटता येईल. कृपया त्यांना खोलीत नेऊ नका.", "मिलने वाले केवल लॉबी में आ सकते हैं। कृपया उन्हें कमरों में न ले जाएँ।"], "Keep your key with you and switch off lights, fans and AC when you leave.": ["चावी स्वतःजवळ ठेवा आणि बाहेर जाताना दिवे, पंखे आणि एसी बंद करा.", "चाबी अपने पास रखें और बाहर जाते समय बत्ती, पंखे और एसी बंद करें।"], "Tell the front desk about any damage or missing item before check-out.": ["चेक-आउटपूर्वी कोणतेही नुकसान किंवा हरवलेली वस्तू फ्रंट डेस्कला कळवा.", "चेक-आउट से पहले किसी भी नुकसान या गुम वस्तु की जानकारी फ्रंट डेस्क को दें।"], "The hotel is not responsible for valuables left in rooms.": ["खोलीत ठेवलेल्या मौल्यवान वस्तूंसाठी हॉटेल जबाबदार नाही.", "कमरे में रखी कीमती चीज़ों की ज़िम्मेदारी होटल की नहीं है।"], "Good <em>to know.</em>": ["जाणून <em>घ्या.</em>", "जानने <em>योग्य।</em>"], "Wi-Fi": ["वाय-फाय", "वाई-फ़ाई"], "Network": ["नेटवर्क", "नेटवर्क"], "Password": ["पासवर्ड", "पासवर्ड"], "Copy": ["कॉपी", "कॉपी"], "Copied": ["कॉपी केले", "कॉपी हो गया"], "Timings": ["वेळा", "समय"], "Emergency": ["आणीबाणी", "आपातकाल"], "Nearby": ["जवळपास", "आसपास"], "Call": ["कॉल", "कॉल"], "National emergency number": ["राष्ट्रीय आणीबाणी क्रमांक", "राष्ट्रीय आपातकालीन नंबर"], "Leave a Google review": ["Google वर रिव्ह्यू द्या", "Google पर रिव्यू दें"], "Open hotel on map": ["नकाशावर हॉटेल उघडा", "नक्शे पर होटल खोलें"], "Need <em>anything?</em>": ["काही <em>हवे आहे?</em>", "कुछ <em>चाहिए?</em>"], "Call the front desk at any hour during your stay.": ["मुक्कामात कधीही फ्रंट डेस्कला फोन करा.", "ठहराव के दौरान किसी भी समय फ्रंट डेस्क को कॉल करें।"], "FRONT DESK": ["फ्रंट डेस्क", "फ्रंट डेस्क"], "EMAIL": ["ईमेल", "ईमेल"], "ADDRESS": ["पत्ता", "पता"], "Ask at the front desk.": ["फ्रंट डेस्कवर विचारा.", "फ्रंट डेस्क पर पूछें।"], "The <em>menu card.</em>": ["<em>मेनू</em> कार्ड.", "<em>मेन्यू</em> कार्ड।"], "Close menu": ["मेनू बंद करा", "मेन्यू बंद करें"], "Choose what you want, add your room number and send. The kitchen gets it on WhatsApp.": ["हवे ते निवडा, खोली क्रमांक टाका आणि पाठवा. किचनला WhatsApp वर मिळेल.", "जो चाहिए चुनें, कमरा नंबर डालें और भेजें। किचन को WhatsApp पर मिलेगा।"], "Call the front desk to order. We bring it to your room.": ["ऑर्डरसाठी फ्रंट डेस्कला फोन करा. आम्ही खोलीत आणून देतो.", "ऑर्डर के लिए फ्रंट डेस्क को कॉल करें। हम कमरे में पहुँचा देंगे।"], "Room orders are paused right now. Please call the front desk.": ["खोलीतील ऑर्डर सध्या बंद आहेत. कृपया फ्रंट डेस्कला फोन करा.", "रूम ऑर्डर अभी बंद हैं। कृपया फ्रंट डेस्क को कॉल करें।"], "Drinks, <em>to your room.</em>": ["पेये, <em>खोलीत.</em>", "पेय, <em>कमरे में।</em>"], "Prices in rupees.": ["किंमती रुपयांत.", "कीमतें रुपयों में।"], "Meals, <em>by the hour.</em>": ["जेवण, <em>वेळेनुसार.</em>", "भोजन, <em>समय के अनुसार।</em>"], "The highlighted meal is being served now.": ["हायलाइट केलेले जेवण आता दिले जात आहे.", "हाइलाइट किया भोजन अभी परोसा जा रहा है।"], "NOW": ["आता", "अभी"], "Today's dishes will be added here.": ["आजचे पदार्थ येथे जोडले जातील.", "आज के व्यंजन यहाँ जोड़े जाएँगे।"], "Today's dishes will be added soon.": ["आजचे पदार्थ लवकरच जोडले जातील.", "आज के व्यंजन जल्द जोड़े जाएँगे।"], "Sold out": ["संपले", "समाप्त"], "<b>Free, just ask</b>Extra towels, soap and other toiletries cost nothing.": ["<b>मोफत, फक्त सांगा</b>जास्तीचे टॉवेल, साबण आणि इतर प्रसाधने मोफत आहेत.", "<b>मुफ़्त, बस कहिए</b>अतिरिक्त तौलिए, साबुन और अन्य प्रसाधन बिल्कुल मुफ़्त हैं।"], "Send order on WhatsApp": ["WhatsApp वर ऑर्डर पाठवा", "WhatsApp पर ऑर्डर भेजें"], "Send as SMS": ["SMS म्हणून पाठवा", "SMS से भेजें"], "Pay with UPI": ["UPI ने पैसे द्या", "UPI से भुगतान करें"], "The message opens ready to send. Tap send in the app to place your order.": ["संदेश तयार उघडेल. ऑर्डर देण्यासाठी अ‍ॅपमध्ये पाठवा दाबा.", "संदेश तैयार खुलेगा। ऑर्डर देने के लिए ऐप में भेजें दबाएँ।"], "Enter your room number to continue.": ["पुढे जाण्यासाठी खोली क्रमांक टाका.", "आगे बढ़ने के लिए कमरा नंबर डालें।"], "Payment is not checked automatically. Show the payment screen to the staff.": ["पेमेंट आपोआप तपासले जात नाही. पेमेंट स्क्रीन स्टाफला दाखवा.", "भुगतान अपने-आप सत्यापित नहीं होता। भुगतान स्क्रीन स्टाफ को दिखाएँ।"], "item": ["वस्तू", "आइटम"], "items": ["वस्तू", "आइटम"], "priced on request": ["किंमत विचारून", "कीमत पूछकर"], "NOTICE": ["सूचना", "सूचना"], "Water bottle": ["पाण्याची बाटली", "पानी की बोतल"], "Tea": ["चहा", "चाय"], "Coffee": ["कॉफी", "कॉफ़ी"]};
var lang="en";try{lang=localStorage.getItem("najukaLang")||""}catch(e){}
if(!/^(en|mr|hi)$/.test(lang)){var nl=(navigator.language||"").slice(0,2);lang=nl==="mr"||nl==="hi"?nl:"en"}
function T(en){var v=TR[en];return lang==="en"||!v?en:v[lang==="mr"?0:1]}
function applyLang(){
 document.documentElement.lang=lang;
 document.querySelectorAll("[data-l]").forEach(function(b){b.setAttribute("aria-pressed",b.dataset.l===lang?"true":"false")});
 document.getElementById("marathi").style.display=lang==="en"?"":"none";
 document.querySelectorAll("body *").forEach(function(el){
  if(el.tagName==="SCRIPT"||el.tagName==="STYLE"||el.closest("#mbody .eg,#mbody .eb,#mbody .etool"))return;
  var cur=el.innerHTML.trim(),src=cur;
  if(el.dataset.out!==undefined&&cur===el.dataset.out)src=el.dataset.src;
  if(TR[src]){var out=T(src);if(out!==cur)el.innerHTML=out;el.dataset.src=src;el.dataset.out=out}
  else if(el.dataset.src!==undefined){delete el.dataset.src;delete el.dataset.out}});
 document.querySelectorAll("[placeholder]").forEach(function(el){if(el.closest("#mbody .eg,#mbody .eb"))return;
  var src=el.dataset.ph||el.getAttribute("placeholder");if(TR[src]){el.dataset.ph=src;el.setAttribute("placeholder",T(src))}})}
document.addEventListener("click",function(e){var b=e.target.closest("[data-l]");if(b){lang=b.dataset.l;try{localStorage.setItem("najukaLang",lang)}catch(x){}applyLang();updateBar()}});
function lines(t){return String(t||"").split("\n").map(function(x){return x.trim()}).filter(Boolean)}
var SVC=[];
function renderServices(){
 applyLockedRoom();
 var sec=document.getElementById("services"),d=nm(MENU.desk),list=lines(MENU.services);
 sec.hidden=!d||!list.length;if(sec.hidden)return;
 SVC=list;var box=document.getElementById("svc");
 if(box.dataset.k!==list.join("|")){box.dataset.k=list.join("|");box.innerHTML=list.map(function(x,i){return '<a class="sv" data-i="'+i+'" href="#" target="_blank" rel="noopener noreferrer">'+esc(x)+'</a>'}).join("")}
 updateSvc()}
function updateSvc(){
 var room=document.getElementById("sroom").value.trim(),det=document.getElementById("sdetail").value.trim(),d=nm(MENU.desk);
 document.querySelectorAll("#svc .sv").forEach(function(a){var msg="Hotel Najuka request\nRoom: "+room+"\nRequest: "+SVC[+a.dataset.i]+(det?"\nDetails: "+det:"");a.href=room?"https://wa.me/"+d+"?text="+encodeURIComponent(msg):"#"})}
document.getElementById("services").addEventListener("input",updateSvc);
document.getElementById("services").addEventListener("click",function(e){
 var a=e.target.closest("a.sv");
 if(!a)return;
 e.preventDefault();
 var room=document.getElementById("sroom").value.trim();
 var sname=document.getElementById("sname")?document.getElementById("sname").value.trim():"";
 if(!room){document.getElementById("sroom").focus();toast("Enter your room number above first.");return}
 if(!sname){document.getElementById("sname").focus();toast("Enter your name above first.");return}
 var roomFull = room + " (" + sname + ")";
 var title=SVC[+a.dataset.i]||a.textContent.trim();
 var det=document.getElementById("sdetail").value.trim();

 // 1. Open WhatsApp immediately to desk with the service request
 var d=nm(MENU.desk);
 if(d){
  var msg="Hotel Najuka request\nRoom: "+roomFull+"\nRequest: "+title+(det?"\nDetails: "+det:"");
  var waUrl="https://wa.me/"+d+"?text="+encodeURIComponent(msg);
  var waLink=document.createElement("a");waLink.href=waUrl;waLink.target="_blank";waLink.rel="noopener noreferrer";
  document.body.appendChild(waLink);waLink.click();waLink.remove();
 }

 // 2. Silently send to Staff / Front Desk dashboard in the background
 a.style.opacity="0.4";
 var orderId = 'ORD-' + Date.now().toString().slice(-4) + '-' + Math.floor(100 + Math.random() * 900);
 fetch(SUPABASE_URL + '/rest/v1/orders', {
   method: 'POST',
   headers: { ...sbHeaders(), 'Prefer': 'return=representation' },
   body: JSON.stringify({
     id: orderId,
     type: 'hotel:najuka',
     room: roomFull,
     service_title: title,
     note: det,
     status: 'pending',
     reject_reason: '',
     created_at: new Date().toISOString(),
     updated_at: new Date().toISOString()
   })
 })
 .then(function(r){ return r.json(); })
 .then(function(){
   a.style.opacity="";
   try{localStorage.setItem("najuka_my_order", orderId)}catch(e){}
   toast("Request for '"+title+"' sent to WhatsApp & Front Desk!",true);
   fetchLiveOrders();
 })
 .catch(function(err){
   console.warn("Direct service push notice:", err);
   a.style.opacity="";
   toast("Request sent via WhatsApp!");
 });
});
function tel(n){return esc(String(n).replace(/[^+\d]/g,""))}
function renderInfo(){
 var c="",tm=lines(MENU.timings),em=lines(MENU.emergency),gd=lines(MENU.guide);
 if(MENU.wifiName||MENU.wifiPass)c+='<article class="room"><span class="mono">WI-FI</span><div><h3>Wi-Fi</h3>'+(MENU.wifiName?'<div class="price"><span>Network</span><b>'+esc(MENU.wifiName)+'</b></div>':'')+(MENU.wifiPass?'<div class="price"><span>Password</span><b>'+esc(MENU.wifiPass)+'</b></div><button type="button" class="copy" data-copy="'+esc(MENU.wifiPass)+'">Copy</button>':'')+'</div></article>';
 if(tm.length)c+='<article class="room"><span class="mono">TIMINGS</span><div><h3>Timings</h3>'+tm.map(function(x){return '<p>'+esc(x)+'</p>'}).join("")+'</div></article>';
 if(em.length)c+='<article class="room"><span class="mono">EMERGENCY</span><div><h3>Emergency</h3>'+em.map(function(x){var p=x.split("|"),nmv=p[0].trim(),n=(p[1]||"").trim();return '<div class="price"><span>'+esc(nmv)+'</span>'+(n?'<a href="tel:'+tel(n)+'"><b>'+esc(n)+'</b></a>':'')+'</div>'}).join("")+'</div></article>';
 var g=gd.length?'<h3 class="rh">Nearby</h3>'+gd.map(function(x){var p=x.split("|"),n=(p[0]||"").trim(),ty=(p[1]||"").trim(),ph=(p[2]||"").trim();return '<div class="near"><span class="mono">'+esc(ty.toUpperCase())+'</span><span>'+esc(n)+'</span>'+(ph?'<a class="ghost" href="tel:'+tel(ph)+'">Call</a>':'')+'</div>'}).join(""):"";
 var b=(MENU.review?'<a class="btn" href="'+esc(MENU.review)+'" target="_blank" rel="noopener noreferrer">Leave a Google review</a>':'')+(MENU.map?'<a class="ghost" href="'+esc(MENU.map)+'" target="_blank" rel="noopener noreferrer">Open hotel on map</a>':'');
 document.getElementById("infogrid").innerHTML=c;document.getElementById("infogrid").hidden=!c;
 document.getElementById("nearby").innerHTML=g;document.getElementById("infobtns").innerHTML=b;document.getElementById("infobtns").hidden=!b;
 document.getElementById("info").hidden=!(c||g||b)}
function copyText(t,btn){
 function done(){btn.textContent=T("Copied");setTimeout(function(){btn.textContent=T("Copy")},1500)}
 function fb(){var a=document.createElement("textarea");a.value=t;a.style.cssText="position:fixed;opacity:0";document.body.appendChild(a);a.select();try{document.execCommand("copy");done()}catch(e){}document.body.removeChild(a)}
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(done,fb);else fb()}
document.getElementById("infogrid").addEventListener("click",function(e){var b=e.target.closest(".copy");if(b)copyText(b.dataset.copy,b)});
function renderContact(){
 var h="",p=MENU.phone,e=MENU.email,a=MENU.address;
 if(p)h+='<dt>FRONT DESK</dt><dd><a href="tel:'+tel(p)+'">'+esc(p)+'</a></dd>';
 if(e)h+='<dt>EMAIL</dt><dd><a href="mailto:'+esc(e)+'">'+esc(e)+'</a></dd>';
 if(a)h+='<dt>ADDRESS</dt><dd>'+esc(a)+'</dd>';
 document.getElementById("cdl").innerHTML=h||'<dd>Ask at the front desk.</dd>'}
var pend=null,afterLoad=null;try{pend=JSON.parse(sessionStorage.getItem("najukaPending")||"null");sessionStorage.removeItem("najukaPending")}catch(e){}
if(pend){if(pend.updated===MENU.updated)afterLoad=function(){toast("Saved. The site is updated.",true)};
 else{Object.keys(pend).forEach(function(k){if(k!=="admin")MENU[k]=pend[k]});afterLoad=function(){openMenu();go("edit","The page was updated by someone else while you were saving. Your changes are shown again. Check them, then tap Save and publish.")}}}
renderMenu();if(afterLoad)afterLoad();applyLockedRoom();
// Direct load from Supabase MENU-CONFIG with cache bypass
fetch(SUPABASE_URL + '/rest/v1/orders?id=eq.MENU-CONFIG&select=*', {
  headers: sbHeaders(),
  cache: 'no-store'
})
  .then(function(r){ return r.ok ? r.json() : null; })
  .then(function(rows){
    if(Array.isArray(rows) && rows.length && rows[0].items){
      MENU = rows[0].items;
      Object.keys(DEF).forEach(function(k){ if(MENU[k]===undefined||MENU[k]===null) MENU[k]=DEF[k]; });
      if(view!=="edit" || adminTab!=="settings") renderMenu();
    }
  })
  .catch(function(err){ console.log("Direct MENU-CONFIG fetch notice:", err); });
if(window.claude&&claude.use){claude.use("user").then(function(u){return u?u.canEdit():false}).then(function(ok){CAN=!!ok}).catch(function(){})}

// Hidden ways in: tap the logo 5 times, or open the page with #admin
var taps=0,tt;
document.querySelectorAll(".logo").forEach(function(l){l.addEventListener("click",function(e){
 taps++;clearTimeout(tt);tt=setTimeout(function(){taps=0},1200);
 if(taps>=5){taps=0;e.preventDefault();document.getElementById("staff").click()}})});
Promise.resolve().then(function(){
 try{
  var stActive=localStorage.getItem("najukaStaffActive")==="1";
  var isAdmHash=location.hash==="#admin"||location.hash==="#staff";
  if((stActive||isAdmHash)&&unlocked()){
   openMenu();
   enterEdit();
   return;
  }
 }catch(e){}
 if(location.hash==="#admin"||location.hash==="#staff")document.getElementById("staff").click();
});
