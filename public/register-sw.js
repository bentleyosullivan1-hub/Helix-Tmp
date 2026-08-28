async function registerSW() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support service workers.");
  }

  const registration = await navigator.serviceWorker.register("/sw.js", {
    scope: "/"
  });

  if (!navigator.serviceWorker.controller) {
    await new Promise(resolve => {
      navigator.serviceWorker.addEventListener("controllerchange", resolve, {
        once: true
      });
    });
  }

  return registration;
}
