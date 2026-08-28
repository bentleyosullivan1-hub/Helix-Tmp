(() => {
  "use strict";

  const form = document.getElementById("urlForm");
  const input = document.getElementById("urlInput");
  const host = document.getElementById("webFrame");
  const note = document.getElementById("viewerNote");

  const { ScramjetController } = $scramjetLoadController();

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

  function normaliseUrl(value) {
    value = value.trim();
    if (!value) return "https://example.com";

    try {
      return new URL(value.includes("://") ? value : `https://${value}`).href;
    } catch {
      return `https://www.google.com/search?q=${encodeURIComponent(value)}`;
    }
  }

  async function openUrl(value) {
    const url = normaliseUrl(value);

    try {
      await ready;

      const wisp =
        (location.protocol === "https:" ? "wss" : "ws") +
        `://${location.host}/wisp/`;

      if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
        await connection.setTransport("/libcurl/index.mjs", [
          { websocket: wisp }
        ]);
      }

      host.replaceChildren();

      const frame = scramjet.createFrame();
      frame.frame.style.cssText =
        "width:200%;height:200%;border:0;display:block;background:#05060b;";
      frame.frame.title = "Helix Scramjet browser";
      host.appendChild(frame.frame);

      frame.go(url);
      input.value = url;
      note.textContent = `ROUTED // ${new URL(url).hostname}`;
    } catch (error) {
      console.error(error);
      note.textContent = `SCRAMJET ERROR // ${error.message || error}`;
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    openUrl(input.value);
  });

  openUrl(input.value);
})();
