// Loaded by lab.html BEFORE the main inline chat script.
//
// This is the fallback path every Supabase error in lab.html calls
// into: bad URL/key, tables or RLS not set up, project paused, no
// channels configured, etc. Without this file present, lab.html was
// calling an undefined function on any of those errors and throwing
// instead of degrading gracefully — that was the actual chat bug.
//
// Keeps a stable per-browser identity in localStorage so a reload
// doesn't hand a returning offline user a brand-new random name.

function enableOfflineChat(reason) {

    if (offlineMode) {
        setConnection(false, `${reason} — local chat mode`);
        return;
    }

    offlineMode = true;

    let identity;

    try {
        identity = JSON.parse(localStorage.getItem("helixOfflineIdentity"));
    } catch (_error) {
        identity = null;
    }

    if (!identity || !identity.username) {
        const username = `Helix-${Math.floor(1000 + Math.random() * 9000)}`;
        identity = {
            id: `offline-${crypto.randomUUID()}`,
            username,
            avatar_seed: username
        };
        localStorage.setItem("helixOfflineIdentity", JSON.stringify(identity));
    }

    if (!currentUser) {
        currentUser = { id: identity.id, email: null };
    }

    if (!profile) {
        profile = {
            user_id: identity.id,
            username: identity.username,
            avatar_seed: identity.avatar_seed,
            is_moderator: true,
            is_premium: false
        };
    }

    currentChannel = { id: "offline", name: "general", icon: "💬" };
    channelsEl.innerHTML = '<button class="channel active" type="button"><span>💬</span><span># general</span></button>';
    channelName.textContent = "# general";
    messageInput.placeholder = "Message #general";
    setConnection(false, `${reason} — local chat mode`);

    // keep the account panel (sign in / sign out, premium badge) in
    // sync — defined later in lab.html's inline script, so guard in
    // case this ever fires before that script has run.
    if (typeof applyAccountUI === "function") applyAccountUI();

    loadMessages();
}
