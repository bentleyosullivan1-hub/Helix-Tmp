const cursor = document.getElementById("cursor");
const cursorGlow = document.getElementById("cursorGlow");
const starsCanvas = document.getElementById("stars");
const starsContext = starsCanvas?.getContext("2d");

function toggleTheme() {
  document.documentElement.classList.toggle("light");
}

addEventListener("mousemove", event => {
  if (cursor) { cursor.style.left = `${event.clientX}px`; cursor.style.top = `${event.clientY}px`; }
  if (cursorGlow) { cursorGlow.style.left = `${event.clientX}px`; cursorGlow.style.top = `${event.clientY}px`; }
});

const stars = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), speed: Math.random() * 0.45 + 0.08 }));
function drawStars() {
  if (!starsCanvas || !starsContext) return;
  starsCanvas.width = innerWidth; starsCanvas.height = innerHeight;
  starsContext.clearRect(0, 0, innerWidth, innerHeight); starsContext.fillStyle = "#b9d8ff";
  for (const star of stars) { star.y = (star.y + star.speed / innerHeight) % 1; starsContext.globalAlpha = 0.2 + star.speed; starsContext.fillRect(star.x * innerWidth, star.y * innerHeight, 1.5, 1.5); }
  requestAnimationFrame(drawStars);
}
drawStars();
