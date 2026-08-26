function enableOfflineChat(reason) {
    if (offlineMode) return;

    offlineMode = true;

    if (!currentUser) {
        currentUser = { id: `offline-${crypto.randomUUID()}` };
    }

    if (!profile) {
        const username = `Helix-${Math.floor(1000 + Math.random() * 9000)}`;
        profile = { username, avatar_seed: username, is_moderator: true };
    }

    currentChannel = { id: "offline", name: "general", icon: "💬" };
    channelsEl.innerHTML = '<button class="channel active" type="button"><span>💬</span><span># general</span></button>';
    channelName.textContent = "# general";
    messageInput.placeholder = "Message #general";
    setConnection(false, `${reason} — local chat mode`);
    loadMessages();
}
