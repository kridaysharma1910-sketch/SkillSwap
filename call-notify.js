/**
 * call-notify.js — Global incoming call overlay for SkillSwap
 * Include on every authenticated page (except videocall.html).
 *
 * Uses Supabase postgres_changes on call_invites table.
 * This is persistent — the DB row exists even if the receiver's subscription
 * wasn't active yet when the caller triggered the invite.
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

  let notifyClient, notifyChannel;
  let dismissTimer = null;
  let currentInviteId = null;

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
        <div style="color:rgba(255,255,255,0.4);font-size:.75rem;letter-spacing:.06em;
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
      </div>
      <style>
        @keyframes __ssCallPop {
          from { opacity:0; transform:scale(.9); }
          to   { opacity:1; transform:scale(1); }
        }
        #__ssCallDecline:active { background:rgba(239,68,68,0.2) !important; }
        #__ssCallAccept:active  { opacity:.8; }
      </style>`;
    document.body.appendChild(el);
  }

  /* ── Show overlay ── */
  function showOverlay(payload) {
    if (window.location.pathname.includes('videocall')) return;

    // Deduplicate: ignore same invite shown twice (e.g. page open in two tabs)
    const dedupKey = '__ssCall_' + payload.roomId;
    if (sessionStorage.getItem(dedupKey)) return;
    sessionStorage.setItem(dedupKey, '1');
    setTimeout(() => sessionStorage.removeItem(dedupKey), 120000);

    injectOverlay();
    const overlay = document.getElementById('__ssCallOverlay');
    const { callerName, callerAvatar, roomId, matchId, inviteId } = payload;
    currentInviteId = inviteId || null;

    // Avatar
    const avatarEl = document.getElementById('__ssCallAvatar');
    if (callerAvatar) {
      avatarEl.innerHTML = `<img src="${callerAvatar}"
        style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
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

    // Accept
    document.getElementById('__ssCallAccept').onclick = async () => {
      clearTimeout(dismissTimer);
      if (currentInviteId) {
        await notifyClient.from('call_invites')
          .update({ status: 'accepted' }).eq('id', currentInviteId);
      }
      hideOverlay();
      window.location.href = 'videocall.html?room=' + encodeURIComponent(roomId)
        + (matchId ? '&match=' + matchId : '');
    };

    // Decline
    document.getElementById('__ssCallDecline').onclick = async () => {
      clearTimeout(dismissTimer);
      if (currentInviteId) {
        await notifyClient.from('call_invites')
          .update({ status: 'declined' }).eq('id', currentInviteId);
      }
      hideOverlay();
    };

    // Auto-expire after 30 s
    clearTimeout(dismissTimer);
    dismissTimer = setTimeout(async () => {
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

    // Subscribe to call_invites postgres_changes filtered to this callee.
    // Unlike broadcast, postgres_changes delivers the event from a persistent DB row,
    // so even if we subscribe shortly after the INSERT, Supabase will deliver it.
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
