(() => {
  "use strict";

  const form = document.getElementById("urlForm");
  const input = document.getElementById("urlInput");
  const host = document.getElementById("webFrame");
  const shell = document.getElementById("viewerShell");
  const note = document.getElementById("viewerNote");
  const mode = document.getElementById("viewerMode");
  const status = document.getElementById("viewerStatus");
  const fullscreen = document.getElementById("viewerFullscreen");

  function setStatus(label, detail) {
    mode.textContent = label;
    status.textContent = detail;
  }

  function setNote(message) {
    note.lastChild.textContent = message;
  }

  function normaliseUrl(value) {
    const trimmed = value.trim();
    if (!trimmed) return "https://www.google.com";

    try {
      return new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`).href;
    } catch {
      return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
    }
  }

  function openPreview(value) {
    const url = normaliseUrl(value);
    host.replaceChildren();
    const frame = document.createElement("iframe");
    frame.title = "Helix web preview";
    frame.sandbox = "allow-forms allow-modals allow-popups allow-presentation allow-scripts";
    frame.src = url;
    host.appendChild(frame);
    input.value = url;
    setStatus("PREVIEW MODE", "Preview session active");
    setNote("Preview mode: some destinations prevent iframe embedding.");
  }

  const proxyAvailable =
    typeof window.$scramjetLoadController === "function" &&
    typeof window.BareMux !== "undefined";

  if (!proxyAvailable) {
    setStatus("PREVIEW MODE", "Proxy transport unavailable here");
    form.addEventListener("submit", event => {
      event.preventDefault();
      openPreview(input.value);
    });
    openPreview(input.value);
    return;
  }

  const { ScramjetController } = window.$scramjetLoadController();
  const scramjet = new ScramjetController({
    files: {
      wasm: "/scram/scramjet.wasm.wasm",
      all: "/scram/scramjet.all.js",
      sync: "/scram/scramjet.sync.js"
    }
  });
  const ready = (async () => {
    await scramjet.init();
    await registerSW();
  })();
  const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

  async function openProxy(value) {
    const url = normaliseUrl(value);
    try {
      setStatus("CONNECTING", "Establishing route transport");
      setNote("Opening your routed session…");
      await ready;
      const wisp = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/wisp/`;
      if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
        await connection.setTransport("/libcurl/index.mjs", [{ websocket: wisp }]);
      }
      host.replaceChildren();
      const frame = scramjet.createFrame();
      frame.frame.style.cssText = "width:100%;height:100%;border:0;display:block;background:#05060b;";
      frame.frame.title = "Helix browser";
      host.appendChild(frame.frame);
      frame.go(url);
      input.value = url;
      setStatus("ROUTED", new URL(url).hostname);
      setNote(`Routed securely to ${new URL(url).hostname}`);
    } catch (error) {
      console.error(error);
      setStatus("ROUTE ERROR", "Unable to establish proxy transport");
      setNote(`Viewer error: ${error.message || error}`);
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    openProxy(input.value);
  });

  document.querySelectorAll("[data-route]").forEach(button => {
    button.addEventListener("click", () => {
      input.value = button.dataset.route;
      if (proxyAvailable) openProxy(input.value);
      else openPreview(input.value);
    });
  });

  fullscreen.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await shell.requestFullscreen();
    } catch (error) {
      console.error(error);
      setNote("Full-screen mode is unavailable in this browser.");
    }
  });
  openProxy(input.value);
})();
