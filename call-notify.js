/**
 * call-notify.js — Global incoming call overlay + persistent "Call in progress" pill
 * Include on every authenticated page (except videocall.html).
 *
 * Uses Supabase postgres_changes on call_invites table for reliable delivery.
 * When callee accepts/declines, broadcasts an event on the WebRTC signal channel
 * so the caller's ringing screen transitions immediately.
 *
 * Required Supabase table (run once in SQL editor):
 *
 *   create table if not exists call_invites (
 *     id uuid default gen_random_uuid() primary key,
 *     room_id text not null,
 *     match_id uuid references matches(id),
 *     caller_id uuid references profiles(id),
 *     callee_id uuid references profiles(id),
 *     caller_name text,
 *     caller_avatar text,
 *     status text default 'pending',
 *     created_at timestamptz default now()
 *   );
 *   alter table call_invites enable row level security;
 *   create policy "insert own" on call_invites for insert to authenticated
 *     with check (caller_id = auth.uid());
 *   create policy "read own" on call_invites for select to authenticated
 *     using (callee_id = auth.uid() or caller_id = auth.uid());
 *   create policy "update own" on call_invites for update to authenticated
 *     using (callee_id = auth.uid() or caller_id = auth.uid());
 */
(function () {
  if (window.__ssCallNotifyInit) return;
  window.__ssCallNotifyInit = true;

  const SUPABASE_URL = 'https://vgndpvkywvcnezvjuueq.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnbmRwdmt5d3ZjbmV6dmp1dWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDk5OTEsImV4cCI6MjA5MDA4NTk5MX0.GGwx_-W7pu485h3d6dgkhqSwiqxT3Hx02Ck9HW8nyE0';
  const ACTIVE_CALL_KEY = 'ss_active_call';

  let notifyClient, notifyChannel;
  let dismissTimer = null;
  let currentInviteId = null;
  let currentRoomId = null;
  let currentMatchId = null;
  let cancelSignalChannel = null; // listens for caller's 'cancelled' broadcast

  /* ── Inject global styles (once) ── */
  function injectStyles() {
    if (document.getElementById('__ssCallStyles')) return;
    const s = document.createElement('style');
    s.id = '__ssCallStyles';
    s.textContent = `
      @keyframes __ssCallPop{from{opacity:0;transform:scale(.9);}to{opacity:1;transform:scale(1);}}
      @keyframes __ssCallPillBlink{0%,100%{opacity:1;}50%{opacity:.3;}}
      #__ssCallDecline:active{background:rgba(239,68,68,0.2)!important;}
      #__ssCallAccept:active{opacity:.8;}
      #__ssActivePill:hover{opacity:.9;}
    `;
    document.head.appendChild(s);
  }

  /* ── Overlay HTML (injected once into body) ── */
  function injectOverlay() {
    if (document.getElementById('__ssCallOverlay')) return;
    const el = document.createElement('div');
    el.id = '__ssCallOverlay';
    el.style.cssText = [
      'display:none', 'position:fixed', 'inset:0', 'z-index:99999',
      'background:rgba(0,0,0,0.88)', 'backdrop-filter:blur(10px)',
      'align-items:center', 'justify-content:center',
      "font-family:'DM Sans',sans-serif"
    ].join(';');
    el.innerHTML = `
      <div style="background:#111;border:1px solid rgba(255,255,255,0.1);border-radius:20px;
                  padding:36px 28px;text-align:center;width:min(320px,90vw);
                  animation:__ssCallPop .25s ease;">
        <div id="__ssCallAvatar" style="width:72px;height:72px;border-radius:50%;
             background:rgba(139,92,246,0.15);border:2px solid rgba(139,92,246,0.4);
             margin:0 auto 14px;display:flex;align-items:center;justify-content:center;
             font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:700;
             color:rgba(167,139,250,0.9);overflow:hidden;"></div>
        <div id="__ssCallType" style="color:rgba(255,255,255,0.4);font-size:.75rem;letter-spacing:.06em;
                    text-transform:uppercase;margin-bottom:4px;">Incoming video call</div>
        <div id="__ssCallName" style="font-family:'Syne',sans-serif;font-weight:700;
             font-size:1.1rem;color:#fff;margin-bottom:18px;"></div>
        <div style="height:3px;background:rgba(255,255,255,0.07);border-radius:2px;
                    margin-bottom:20px;overflow:hidden;">
          <div id="__ssCallBar" style="height:100%;background:rgba(139,92,246,0.7);
               width:100%;transition:none;"></div>
        </div>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button id="__ssCallDecline"
            style="flex:1;padding:13px;border-radius:12px;background:rgba(239,68,68,0.1);
                   border:1px solid rgba(239,68,68,0.28);color:rgba(239,68,68,0.8);
                   font-size:.9rem;cursor:pointer;font-family:inherit;min-height:44px;">
            Decline
          </button>
          <button id="__ssCallAccept"
            style="flex:1;padding:13px;border-radius:12px;background:#fff;border:none;
                   color:#080808;font-size:.9rem;font-weight:700;cursor:pointer;
                   font-family:inherit;min-height:44px;">
            Accept
          </button>
        </div>
      </div>`;
    document.body.appendChild(el);
  }

  /* ── Broadcast a signal event on the WebRTC channel for this call ── */
  function broadcastSignal(roomId, event) {
    return new Promise(resolve => {
      const ch = notifyClient.channel(`call-${roomId}`, {config: {broadcast: {self: false}}});
      ch.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          ch.send({type: 'broadcast', event, payload: {}});
          // Small delay to let broadcast propagate before page navigates/cleans up
          setTimeout(() => { notifyClient.removeChannel(ch); resolve(); }, 300);
        }
      });
    });
  }

  /* ── Show overlay ── */
  function showOverlay(payload) {
    if (window.location.pathname.includes('videocall')) return;

    // Deduplicate: ignore same invite shown twice (e.g. page open in two tabs)
    const dedupKey = '__ssCall_' + payload.roomId;
    if (sessionStorage.getItem(dedupKey)) return;
    sessionStorage.setItem(dedupKey, '1');
    setTimeout(() => sessionStorage.removeItem(dedupKey), 120000);

    injectStyles();
    injectOverlay();
    const overlay = document.getElementById('__ssCallOverlay');
    const { callerName, callerAvatar, roomId, matchId, inviteId } = payload;
    currentInviteId = inviteId || null;
    currentRoomId = roomId || null;
    currentMatchId = matchId || null;
    const isVoice = roomId && roomId.startsWith('VOICE_');
    const typeEl = document.getElementById('__ssCallType');
    if (typeEl) typeEl.textContent = isVoice ? 'Incoming voice call' : 'Incoming video call';

    // Avatar
    const avatarEl = document.getElementById('__ssCallAvatar');
    if (callerAvatar) {
      const img = document.createElement('img');
      img.src = callerAvatar;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;border-radius:50%;';
      avatarEl.innerHTML = '';
      avatarEl.appendChild(img);
    } else {
      avatarEl.textContent = (callerName || '?')
        .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    document.getElementById('__ssCallName').textContent = callerName || 'Someone';

    // 30-second countdown bar
    const bar = document.getElementById('__ssCallBar');
    bar.style.transition = 'none';
    bar.style.width = '100%';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bar.style.transition = 'width 30s linear';
      bar.style.width = '0%';
    }));

    overlay.style.display = 'flex';

    // Subscribe to caller's signal channel to detect if they cancel while we're ringing
    if (cancelSignalChannel) {
      try { notifyClient.removeChannel(cancelSignalChannel); } catch(e) {}
      cancelSignalChannel = null;
    }
    cancelSignalChannel = notifyClient.channel(`call-${roomId}`, {config: {broadcast: {self: false}}});
    cancelSignalChannel.on('broadcast', {event: 'cancelled'}, () => {
      clearTimeout(dismissTimer);
      hideOverlay();
    });
    cancelSignalChannel.subscribe();

    // Accept
    document.getElementById('__ssCallAccept').onclick = async () => {
      clearTimeout(dismissTimer);
      // Broadcast 'accepted' on signal channel so caller's ringing screen transitions
      await broadcastSignal(roomId, 'accepted');
      // Update DB
      if (currentInviteId) {
        await notifyClient.from('call_invites')
          .update({ status: 'accepted' }).eq('id', currentInviteId);
      }
      hideOverlay();
      const voiceParam = isVoice ? '&voice=1' : '';
      window.location.href = 'videocall.html?room=' + encodeURIComponent(roomId)
        + (matchId ? '&match=' + matchId : '') + voiceParam;
    };

    // Decline
    document.getElementById('__ssCallDecline').onclick = async () => {
      clearTimeout(dismissTimer);
      // Broadcast 'declined' so caller's ringing screen shows "Call declined"
      broadcastSignal(roomId, 'declined'); // fire-and-forget, don't await
      if (currentInviteId) {
        await notifyClient.from('call_invites')
          .update({ status: 'declined' }).eq('id', currentInviteId);
      }
      hideOverlay();
    };

    // Auto-expire after 30s
    clearTimeout(dismissTimer);
    dismissTimer = setTimeout(async () => {
      broadcastSignal(roomId, 'declined'); // treat expire same as decline for caller
      if (currentInviteId) {
        await notifyClient.from('call_invites')
          .update({ status: 'expired' }).eq('id', currentInviteId);
      }
      hideOverlay();
    }, 30000);

    // Browser Notification API (handles tab in background)
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(perm => {
        if (perm !== 'granted') return;
        const n = new Notification('Incoming call from ' + (callerName || 'Someone'), {
          body: 'Tap to accept',
          icon: callerAvatar || undefined,
          tag: 'ss-incoming-call',
          requireInteraction: true,
        });
        n.onclick = () => {
          window.focus();
          n.close();
          document.getElementById('__ssCallAccept')?.click();
        };
      });
    }
  }

  function hideOverlay() {
    const el = document.getElementById('__ssCallOverlay');
    if (el) el.style.display = 'none';
    currentInviteId = null;
    currentRoomId = null;
    currentMatchId = null;
    if (cancelSignalChannel) {
      try { notifyClient.removeChannel(cancelSignalChannel); } catch(e) {}
      cancelSignalChannel = null;
    }
  }

  /* ── Floating "Call in progress" pill ── */
  function updateCallPill() {
    if (window.location.pathname.includes('videocall')) return;
    injectStyles();

    let pill = document.getElementById('__ssActivePill');
    try {
      const d = JSON.parse(localStorage.getItem(ACTIVE_CALL_KEY) || 'null');
      if (!d || Date.now() - d.timestamp > 4 * 60 * 60 * 1000) {
        if (pill) pill.remove();
        return;
      }
      if (!pill) {
        pill = document.createElement('div');
        pill.id = '__ssActivePill';
        pill.style.cssText = [
          'position:fixed', 'top:14px', 'right:14px', 'z-index:99990',
          'background:rgba(8,8,8,0.9)', 'border:1px solid rgba(34,197,94,0.35)',
          'border-radius:100px', 'padding:7px 14px 7px 10px',
          'display:flex', 'align-items:center', 'gap:8px',
          "font-family:'DM Sans',sans-serif", 'font-size:.78rem',
          'color:#86efac', 'cursor:pointer',
          'backdrop-filter:blur(12px)',
          'box-shadow:0 4px 20px rgba(0,0,0,0.55)',
          'transition:opacity .2s', 'user-select:none'
        ].join(';');
        document.body.appendChild(pill);
      }
      const voiceParam = d.voice ? '&voice=1' : '';
      const callerParam = d.isCaller ? '&caller=1' : '';
      const url = `videocall.html?room=${encodeURIComponent(d.roomId)}&match=${d.matchId || ''}${callerParam}${voiceParam}`;
      pill.onclick = () => { window.location.href = url; };
      pill.innerHTML = `<span style="width:7px;height:7px;background:#22c55e;border-radius:50%;flex-shrink:0;display:inline-block;animation:__ssCallPillBlink 1s infinite;"></span>Call in progress`;
    } catch(e) {
      if (pill) pill.remove();
    }
  }

  /* ── Bootstrap ── */
  async function start() {
    const client = (typeof supabase !== 'undefined')
      ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
      : null;
    if (!client) return;

    notifyClient = client;
    const { data: { session } } = await notifyClient.auth.getSession();
    if (!session) return;

    const userId = session.user.id;

    // Show pill for any ongoing call immediately
    updateCallPill();

    // Update pill whenever ss_active_call changes in another tab or this tab
    window.addEventListener('storage', e => {
      if (e.key === ACTIVE_CALL_KEY) updateCallPill();
    });

    // Subscribe to call_invites postgres_changes filtered to this callee.
    notifyChannel = notifyClient
      .channel('ss-call-invites-' + userId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'call_invites',
        filter: `callee_id=eq.${userId}`
      }, ({ payload }) => {
        const invite = payload.new;
        if (invite && invite.status === 'pending') {
          showOverlay({
            roomId: invite.room_id,
            matchId: invite.match_id,
            callerName: invite.caller_name,
            callerAvatar: invite.caller_avatar,
            inviteId: invite.id
          });
        }
      })
      .subscribe(async (status) => {
        console.log('[call-notify] channel status:', status);
        if (status !== 'SUBSCRIBED') return;

        // On subscribe, check for any pending invite inserted in the last 60s
        // that we may have missed if the page loaded just after the INSERT.
        const { data } = await notifyClient
          .from('call_invites')
          .select('*')
          .eq('callee_id', userId)
          .eq('status', 'pending')
          .gte('created_at', new Date(Date.now() - 60000).toISOString())
          .order('created_at', { ascending: false })
          .limit(1);
        if (data && data[0]) {
          showOverlay({
            roomId: data[0].room_id,
            matchId: data[0].match_id,
            callerName: data[0].caller_name,
            callerAvatar: data[0].caller_avatar,
            inviteId: data[0].id
          });
        }
      });
  }

  function boot() {
    if (typeof supabase !== 'undefined') {
      start();
    } else {
      setTimeout(boot, 150);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
