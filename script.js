// DOM Elements
const startBtn = document.getElementById("startBtn");
const lapBtn = document.getElementById("lapBtn");
const resetBtn = document.getElementById("resetBtn");

const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const msEl = document.getElementById("milliseconds");

const lapList = document.getElementById("lapList");
const progressCircle = document.querySelector(".progress");
const modeButtons = document.querySelectorAll(".mode-btn");

// Audio
const beepStart = document.getElementById("beepStart");
const beepLap = document.getElementById("beepLap");
const beepReset = document.getElementById("beepReset");

// Variables
let startTime = 0;
let elapsed = 0;
let timer = null;
let running = false;
let laps = [];
let currentMode = "running";

// Mode Configuration
const modes = {
  running: { name: "Running", icon: "🏃", color: "#667eea" },
  cycling: { name: "Cycling", icon: "🚴", color: "#764ba2" },
  walking: { name: "Walking", icon: "🚶", color: "#43e97b" },
  jogging: { name: "Jogging", icon: "🏋️", color: "#f093fb" },
  swimming: { name: "Swimming", icon: "🏊", color: "#4facfe" }
};

// Constants
const CIRCUMFERENCE = 754;

// Format time
function formatTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = ms % 1000;

  return {
    h: String(hours).padStart(2, "0"),
    m: String(minutes).padStart(2, "0"),
    s: String(seconds).padStart(2, "0"),
    ms: String(milliseconds).padStart(3, "0")
  };
}

// Update UI
function updateDisplay(ms) {
  const t = formatTime(ms);
  hoursEl.textContent = t.h;
  minutesEl.textContent = t.m;
  secondsEl.textContent = t.s;
  msEl.textContent = t.ms;

  const progress = (ms % 60000) / 60000;
  progressCircle.style.strokeDashoffset =
    CIRCUMFERENCE - progress * CIRCUMFERENCE;
}

// Start / Pause
function toggleStart() {
  if (!running) {
    startTime = performance.now() - elapsed;
    timer = requestAnimationFrame(update);
    running = true;
    startBtn.textContent = "Pause";
    lapBtn.disabled = false;
    resetBtn.disabled = false;
    progressCircle.classList.add("running");
    beepStart.play();
  } else {
    running = false;
    startBtn.textContent = "Resume";
    progressCircle.classList.remove("running");
    cancelAnimationFrame(timer);
  }
}

// Update Loop
function update(timestamp) {
  if (!running) return;
  elapsed = Math.floor(timestamp - startTime);
  updateDisplay(elapsed);
  timer = requestAnimationFrame(update);
}

// Reset
function reset() {
  running = false;
  cancelAnimationFrame(timer);
  elapsed = 0;
  laps = [];
  lapList.innerHTML = "";
  updateDisplay(0);
  startBtn.textContent = "Start";
  lapBtn.disabled = true;
  resetBtn.disabled = true;
  progressCircle.classList.remove("running");
  progressCircle.style.strokeDashoffset = CIRCUMFERENCE;
  beepReset.play();
}

// Lap
function addLap() {
  const lapTime = elapsed - (laps[laps.length - 1] || 0);
  laps.push(elapsed);

  const li = document.createElement("li");
  const t = formatTime(lapTime);
  li.innerHTML = `<span>Lap ${laps.length}</span><span>${t.m}:${t.s}.${t.ms}</span>`;
  lapList.appendChild(li);
  beepLap.play();
  highlightLaps();
}

// Highlight fastest & slowest lap
function highlightLaps() {
  const items = [...lapList.children];
  items.forEach(item => item.classList.remove("fastest", "slowest"));

  if (items.length < 2) return;

  const lapTimes = laps.map((t, i) => i === 0 ? t : t - laps[i - 1]);
  const min = Math.min(...lapTimes);
  const max = Math.max(...lapTimes);

  items.forEach((item, i) => {
    if (lapTimes[i] === min) item.classList.add("fastest");
    if (lapTimes[i] === max) item.classList.add("slowest");
  });
}

// Events
startBtn.addEventListener("click", toggleStart);
resetBtn.addEventListener("click", reset);
lapBtn.addEventListener("click", addLap);

// Mode Selection
modeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // Remove active class from all buttons
    modeButtons.forEach(b => b.classList.remove("active"));
    
    // Add active class to clicked button
    btn.classList.add("active");
    
    // Update current mode
    const newMode = btn.dataset.mode;
    changeMode(newMode);
  });
});

function changeMode(mode) {
  // Can't change mode while timer is running
  if (running) {
    alert("Stop the timer to change modes!");
    return;
  }
  
  currentMode = mode;
  const modeConfig = modes[mode];
  
  // Reset the timer when changing modes
  reset();
  
  // Optional: Update gradient color based on mode (visual feedback)
  const progressGradient = document.querySelector("#gradientStroke");
  if (progressGradient) {
    // Change gradient colors based on mode
    const colors = {
      running: ["#667eea", "#764ba2", "#f093fb"],
      cycling: ["#764ba2", "#667eea", "#4facfe"],
      walking: ["#43e97b", "#38f9d7", "#81ecec"],
      jogging: ["#f093fb", "#667eea", "#764ba2"],
      swimming: ["#4facfe", "#00f2fe", "#43e97b"]
    };
    
    const modeColors = colors[mode];
    progressGradient.innerHTML = `
      <stop offset="0%" style="stop-color:${modeColors[0]};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${modeColors[1]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${modeColors[2]};stop-opacity:1" />
    `;
  }
  
  console.log(`Switched to ${modeConfig.name} mode`);
}

// Keyboard Shortcuts
document.addEventListener("keydown", e => {
  if (e.code === "Space") toggleStart();
  if (e.key.toLowerCase() === "l" && running) addLap();
  if (e.key.toLowerCase() === "r") reset();
});
