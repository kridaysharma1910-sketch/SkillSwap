/**
 * notif-bell.js — Notification bell for all authenticated sidebar pages.
 * Injects a bell icon above the sidebar user pill, queries recent activity
 * (new match requests, accepted matches, unread messages) and shows a badge + dropdown.
 * No new DB table required — derived from existing tables.
 */
(function(){
  'use strict';

  const POLL_INTERVAL = 45000; // refresh every 45s
  let bellUserId = null;
  let bellDropdownOpen = false;
  let notifItems = [];

  // ── CSS ──────────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .notif-bell-wrap{position:relative;margin-bottom:8px;}
    .notif-bell-btn{width:100%;display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;background:none;border:1px solid transparent;color:rgba(255,255,255,0.42);font-family:'DM Sans',sans-serif;font-size:.875rem;cursor:none;transition:all .15s;}
    .notif-bell-btn:hover{color:#fff;background:rgba(255,255,255,0.04);}
    .notif-bell-btn svg{width:15px;height:15px;flex-shrink:0;opacity:.7;}
    .notif-bell-btn:hover svg{opacity:1;}
    .notif-badge{position:absolute;top:6px;left:22px;min-width:16px;height:16px;background:#ef4444;border-radius:100px;font-size:.6rem;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;padding:0 4px;border:2px solid #080808;pointer-events:none;animation:notifPop .25s ease;}
    @keyframes notifPop{from{transform:scale(0);}to{transform:scale(1);}}
    .notif-dropdown{position:fixed;bottom:auto;left:256px;width:300px;background:#141414;border:1px solid rgba(255,255,255,0.1);border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.6);z-index:500;overflow:hidden;animation:notifSlide .2s ease;}
    @keyframes notifSlide{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
    .notif-header{padding:14px 16px 10px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:space-between;}
    .notif-header-title{font-family:'Syne',sans-serif;font-weight:700;font-size:.88rem;}
    .notif-mark-read{background:none;border:none;color:rgba(255,255,255,0.3);font-size:.72rem;cursor:none;font-family:'DM Sans',sans-serif;transition:color .15s;}
    .notif-mark-read:hover{color:rgba(255,255,255,0.65);}
    .notif-list{max-height:320px;overflow-y:auto;}
    .notif-list::-webkit-scrollbar{width:3px;}
    .notif-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px;}
    .notif-item{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);text-decoration:none;transition:background .15s;cursor:none;}
    .notif-item:last-child{border-bottom:none;}
    .notif-item:hover{background:rgba(255,255,255,0.03);}
    .notif-dot{width:8px;height:8px;border-radius:50%;background:rgba(139,92,246,0.8);flex-shrink:0;margin-top:5px;}
    .notif-dot.read{background:transparent;border:1px solid rgba(255,255,255,0.15);}
    .notif-icon{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.72rem;font-weight:700;color:rgba(167,139,250,0.9);background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.2);overflow:hidden;}
    .notif-icon img{width:100%;height:100%;object-fit:cover;border-radius:50%;}
    .notif-body{flex:1;min-width:0;}
    .notif-text{font-size:.8rem;color:rgba(255,255,255,0.75);line-height:1.45;}
    .notif-text strong{color:#fff;}
    .notif-time{font-size:.7rem;color:rgba(255,255,255,0.28);margin-top:3px;}
    .notif-empty{padding:24px 16px;text-align:center;font-size:.82rem;color:rgba(255,255,255,0.25);}
    @media(max-width:900px){.notif-dropdown{left:16px;right:16px;width:auto;bottom:80px;}}
  `;
  document.head.appendChild(style);

  function timeAgo(iso){
    const diff=(Date.now()-new Date(iso))/1000;
    if(diff<60)return'just now';
    if(diff<3600)return Math.floor(diff/60)+'m ago';
    if(diff<86400)return Math.floor(diff/3600)+'h ago';
    return Math.floor(diff/86400)+'d ago';
  }

  function escHtml(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

  function avatarHtml(p){
    if(p?.avatar_url)return`<img src="${escHtml(p.avatar_url)}" alt="">`;
    const n=p?.full_name||p?.username||'?';
    return n.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2);
  }

  // Read IDs stored locally to track "seen" notifications
  const SEEN_KEY='ss_notif_seen';
  function getSeenIds(){try{return new Set(JSON.parse(localStorage.getItem(SEEN_KEY)||'[]'));}catch(e){return new Set();}}
  function markAllSeen(){const ids=notifItems.map(n=>n.id);try{localStorage.setItem(SEEN_KEY,JSON.stringify(ids));}catch(e){}renderBadge();}

  function renderBadge(){
    const seen=getSeenIds();
    const unseen=notifItems.filter(n=>!seen.has(n.id)).length;
    let badge=document.getElementById('notifBadge');
    if(unseen>0){
      if(!badge){badge=document.createElement('span');badge.id='notifBadge';badge.className='notif-badge';document.getElementById('notifBellWrap').appendChild(badge);}
      badge.textContent=unseen>9?'9+':unseen;
    } else {
      if(badge)badge.remove();
    }
  }

  function renderDropdown(){
    const seen=getSeenIds();
    const dd=document.getElementById('notifDropdown');
    if(!dd)return;
    if(!notifItems.length){dd.querySelector('.notif-list').innerHTML='<div class="notif-empty">You\'re all caught up!</div>';return;}
    dd.querySelector('.notif-list').innerHTML=notifItems.map(item=>{
      const isRead=seen.has(item.id);
      return`<a href="${item.href}" class="notif-item" onclick="window.__notifClose&&window.__notifClose()">
        <span class="notif-dot${isRead?' read':''}"></span>
        <span class="notif-icon">${avatarHtml(item.actor)}</span>
        <span class="notif-body">
          <span class="notif-text">${item.html}</span>
          <span class="notif-time">${timeAgo(item.time)}</span>
        </span>
      </a>`;
    }).join('');
  }

  function positionDropdown(){
    const btn=document.getElementById('notifBellBtn');
    const dd=document.getElementById('notifDropdown');
    if(!btn||!dd)return;
    if(window.innerWidth<=900){return;} // CSS handles mobile
    const rect=btn.getBoundingClientRect();
    dd.style.top=(rect.top)+'px';
  }

  function openDropdown(){
    bellDropdownOpen=true;
    let dd=document.getElementById('notifDropdown');
    if(!dd){
      dd=document.createElement('div');
      dd.id='notifDropdown';
      dd.className='notif-dropdown';
      dd.innerHTML=`<div class="notif-header"><span class="notif-header-title">Notifications</span><button class="notif-mark-read" onclick="window.__notifMarkRead&&window.__notifMarkRead()">Mark all read</button></div><div class="notif-list"></div>`;
      document.body.appendChild(dd);
    }
    renderDropdown();
    positionDropdown();
    dd.style.display='block';
    markAllSeen();
  }

  function closeDropdown(){
    bellDropdownOpen=false;
    const dd=document.getElementById('notifDropdown');
    if(dd)dd.style.display='none';
  }

  window.__notifClose=closeDropdown;
  window.__notifMarkRead=function(){markAllSeen();renderDropdown();};

  document.addEventListener('click',function(e){
    if(bellDropdownOpen&&!e.target.closest('#notifDropdown')&&!e.target.closest('#notifBellBtn')){
      closeDropdown();
    }
  });

  async function fetchNotifications(userId){
    const cutoff=new Date(Date.now()-7*24*60*60*1000).toISOString(); // last 7 days

    const[matchRes,msgRes]=await Promise.all([
      sb.from('matches')
        .select(`id,status,created_at,updated_at,skill_offered,skill_wanted,sender_id,receiver_id,end_requested_by,end_requested_at,
          sender:profiles!matches_sender_id_fkey(full_name,username,avatar_url),
          receiver:profiles!matches_receiver_id_fkey(full_name,username,avatar_url)`)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .gte('updated_at',cutoff)
        .order('updated_at',{ascending:false})
        .limit(20),
      sb.from('messages')
        .select(`id,content,created_at,sender_id,match_id,sender:profiles!messages_sender_id_fkey(full_name,username,avatar_url)`)
        .neq('sender_id',userId)
        .gte('created_at',cutoff)
        .order('created_at',{ascending:false})
        .limit(30)
    ]);

    const items=[];

    // Match notifications
    for(const m of (matchRes.data||[])){
      if(m.status==='pending'&&m.receiver_id===userId){
        const actor=m.sender;
        const name=actor?.full_name||actor?.username||'Someone';
        items.push({id:'match-req-'+m.id,href:'/matches',actor,html:`<strong>${escHtml(name)}</strong> sent you a swap request`,time:m.created_at});
      } else if(m.status==='accepted'&&m.sender_id===userId){
        const actor=m.receiver;
        const name=actor?.full_name||actor?.username||'Someone';
        items.push({id:'match-acc-'+m.id,href:'/matches',actor,html:`<strong>${escHtml(name)}</strong> accepted your swap request`,time:m.updated_at});
      } else if(m.status==='completed'){
        // Show to both parties
        const peer=m.sender_id===userId?m.receiver:m.sender;
        const name=peer?.full_name||peer?.username||'Someone';
        items.push({id:'match-done-'+m.id,href:'/matches',actor:peer,html:`Swap with <strong>${escHtml(name)}</strong> marked as completed`,time:m.updated_at});
      } else if(m.status==='accepted'&&m.end_requested_by&&m.end_requested_by!==userId){
        // Partner requested to end the match
        const peer=m.sender_id===userId?m.receiver:m.sender;
        const name=peer?.full_name||peer?.username||'Someone';
        items.push({id:'match-endreq-'+m.id,href:'/matches',actor:peer,html:`<strong>${escHtml(name)}</strong> wants to end your swap — go to Matches to respond`,time:m.end_requested_at||m.updated_at});
      }
    }

    // Message notifications — group by match_id, show only the latest per conversation
    const seenConvos=new Set();
    for(const msg of (msgRes.data||[])){
      if(seenConvos.has(msg.match_id))continue;
      // Skip call invite system messages
      if(msg.content&&(msg.content.startsWith('CALL_INVITE::'))||msg.content.startsWith('VOICE_INVITE::'))continue;
      seenConvos.add(msg.match_id);
      const actor=msg.sender;
      const name=actor?.full_name||actor?.username||'Someone';
      const preview=msg.content.slice(0,60)+(msg.content.length>60?'…':'');
      items.push({id:'msg-'+msg.id,href:`/messages?match=${msg.match_id}`,actor,html:`<strong>${escHtml(name)}</strong>: ${escHtml(preview)}`,time:msg.created_at});
    }

    // Sort by time desc, cap at 20
    items.sort((a,b)=>new Date(b.time)-new Date(a.time));
    notifItems=items.slice(0,20);
    renderBadge();
    if(bellDropdownOpen)renderDropdown();
  }

  function injectBell(userId){
    bellUserId=userId;
    const sidebarBottom=document.querySelector('.sidebar-bottom');
    if(!sidebarBottom)return;

    const wrap=document.createElement('div');
    wrap.id='notifBellWrap';
    wrap.className='notif-bell-wrap';
    wrap.innerHTML=`<button class="notif-bell-btn" id="notifBellBtn" onclick="(function(){const dd=document.getElementById('notifDropdown');if(dd&&dd.style.display!=='none'){window.__notifClose&&window.__notifClose();}else{window.__notifOpen&&window.__notifOpen();}})()">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      Notifications
    </button>`;
    sidebarBottom.insertBefore(wrap,sidebarBottom.firstChild);

    window.__notifOpen=openDropdown;
    fetchNotifications(userId);
    setInterval(()=>fetchNotifications(userId),POLL_INTERVAL);
  }

  // Wait for sb and currentUserId to be available
  function waitAndInit(){
    if(typeof sb!=='undefined'&&typeof currentUserId!=='undefined'&&currentUserId){
      injectBell(currentUserId);
    } else {
      setTimeout(waitAndInit,300);
    }
  }

  // Start after DOM is ready
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',waitAndInit);
  } else {
    setTimeout(waitAndInit,0);
  }
})();
