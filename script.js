// Default configuration with real-time dynamic date & 1:30:00 countdown
const UK_MONTHS = [
  "січня", "лютого", "березня", "квітня", "травня", "червня",
  "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
];

const TICKET_DURATION_SECONDS = 5400; // 1 hour 30 min 00 sec
const STORAGE_KEY = "monobank_ticket_state_v1";

const DEFAULT_CONFIG = {
  carrier: "Миколаївелектротранс",
  purchased: "", // dynamically generated
  count: "1 квиток",
  secondsRemaining: TICKET_DURATION_SECONDS,
  serial: "164 142",
  ticker: "Життя — цікаве, і мотивація то є сильна: філософія, психологія. Найголовніше — залишайтеся людьми і кричіть, що ви живі. Я живий!",
  gearVisible: true,
  startTime: null
};

let currentConfig = { ...DEFAULT_CONFIG };
let timerInterval = null;
let currentRemaining = TICKET_DURATION_SECONDS;

// Helper: Format any date into Ukrainian string "Придбано 13 жовтня о 20:09"
function formatUkPurchased(dateObj) {
  const day = dateObj.getDate();
  const month = UK_MONTHS[dateObj.getMonth()];
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  return `Придбано ${day} ${month} о ${hours}:${minutes}`;
}

// Helper: Format current timestamp in Ukrainian
function getCurrentUkTime() {
  return formatUkPurchased(new Date());
}

// Format seconds into H:MM:SS (e.g. 1:30:00, 1:29:59)
function formatTime(totalSeconds) {
  if (totalSeconds <= 0) return "0:00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(seconds).padStart(2, "0");

  return `${hours}:${paddedMinutes}:${paddedSeconds}`;
}

// Save ticket state to localStorage
function saveTicketState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      carrier: currentConfig.carrier,
      purchased: currentConfig.purchased,
      count: currentConfig.count,
      serial: currentConfig.serial,
      ticker: currentConfig.ticker,
      gearVisible: currentConfig.gearVisible,
      startTime: currentConfig.startTime,
      duration: TICKET_DURATION_SECONDS
    }));
  } catch (e) {
    console.warn("Storage save failed", e);
  }
}

// Load or synchronize ticket on page open
function initSynchronizedTicket() {
  const now = Date.now();
  let saved = null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saved = JSON.parse(raw);
  } catch (e) {
    console.warn("Storage load failed", e);
  }

  // If saved ticket exists and hasn't expired (< 1:30:00)
  if (saved && saved.startTime && (now - saved.startTime < TICKET_DURATION_SECONDS * 1000)) {
    const elapsedSeconds = Math.floor((now - saved.startTime) / 1000);
    currentRemaining = Math.max(0, TICKET_DURATION_SECONDS - elapsedSeconds);
    currentConfig = {
      ...DEFAULT_CONFIG,
      ...saved,
      secondsRemaining: currentRemaining
    };
  } else {
    // Brand new ticket timestamped right now
    const nowTimestamp = Date.now();
    currentRemaining = TICKET_DURATION_SECONDS;
    currentConfig = {
      ...DEFAULT_CONFIG,
      purchased: formatUkPurchased(new Date(nowTimestamp)),
      secondsRemaining: currentRemaining,
      startTime: nowTimestamp
    };
    saveTicketState();
  }
}

// Update DOM elements with current config
function updateUI() {
  document.getElementById("display-carrier").textContent = currentConfig.carrier;
  document.getElementById("display-purchased").textContent = currentConfig.purchased;
  document.getElementById("display-count").textContent = currentConfig.count;
  document.getElementById("display-serial").textContent = currentConfig.serial;
  document.querySelectorAll(".ticker-text").forEach(el => {
    el.textContent = currentConfig.ticker;
  });
  document.getElementById("display-timer").textContent = formatTime(currentRemaining);

  // Update info modal items
  document.getElementById("info-carrier").textContent = currentConfig.carrier;
  document.getElementById("info-serial").textContent = currentConfig.serial;
  document.getElementById("info-count").textContent = currentConfig.count;

  // Toggle gear visibility
  const gearBtn = document.getElementById("open-settings-btn");
  if (gearBtn) {
    gearBtn.style.display = currentConfig.gearVisible ? "flex" : "none";
  }
}

// Start live countdown timer (immune to tab backgrounding / sleep)
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  function tick() {
    if (currentConfig.startTime) {
      const elapsed = Math.floor((Date.now() - currentConfig.startTime) / 1000);
      currentRemaining = Math.max(0, TICKET_DURATION_SECONDS - elapsed);
    } else if (currentRemaining > 0) {
      currentRemaining--;
    }

    document.getElementById("display-timer").textContent = formatTime(currentRemaining);

    if (currentRemaining <= 0) {
      clearInterval(timerInterval);
      document.getElementById("display-timer").textContent = "0:00:00";
    }
  }

  tick();
  timerInterval = setInterval(tick, 1000);
}

// Modals logic
function initModals() {
  const infoModal = document.getElementById("info-modal");
  const settingsModal = document.getElementById("settings-modal");

  // Open / Close Info
  document.getElementById("open-info-btn").addEventListener("click", () => {
    infoModal.classList.add("active");
  });
  document.getElementById("close-info-btn").addEventListener("click", () => {
    infoModal.classList.remove("active");
  });
  document.getElementById("btn-close-info-ok").addEventListener("click", () => {
    infoModal.classList.remove("active");
  });

  // Open / Close Settings
  document.getElementById("open-settings-btn").addEventListener("click", () => {
    // Populate form
    document.getElementById("input-carrier").value = currentConfig.carrier;
    document.getElementById("input-count").value = currentConfig.count;
    document.getElementById("input-purchased").value = currentConfig.purchased;
    document.getElementById("input-timer-seconds").value = currentRemaining;
    document.getElementById("input-serial").value = currentConfig.serial;
    document.getElementById("input-ticker").value = currentConfig.ticker;

    settingsModal.classList.add("active");
  });

  document.getElementById("close-settings-btn").addEventListener("click", () => {
    settingsModal.classList.remove("active");
  });

  // Close modals on overlay background click
  [infoModal, settingsModal].forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  });

  // Set current time button in settings
  document.getElementById("btn-set-current-time").addEventListener("click", () => {
    document.getElementById("input-purchased").value = getCurrentUkTime();
    document.getElementById("input-timer-seconds").value = TICKET_DURATION_SECONDS;
  });

  // Save Settings
  document.getElementById("btn-save-settings").addEventListener("click", () => {
    currentConfig.carrier = document.getElementById("input-carrier").value.trim() || DEFAULT_CONFIG.carrier;
    currentConfig.count = document.getElementById("input-count").value.trim() || DEFAULT_CONFIG.count;
    currentConfig.purchased = document.getElementById("input-purchased").value.trim() || getCurrentUkTime();

    const secInput = parseInt(document.getElementById("input-timer-seconds").value, 10);
    const newRemaining = !isNaN(secInput) && secInput >= 0 ? secInput : TICKET_DURATION_SECONDS;
    currentRemaining = newRemaining;
    currentConfig.secondsRemaining = newRemaining;
    // Align startTime to the new remaining seconds
    currentConfig.startTime = Date.now() - (TICKET_DURATION_SECONDS - newRemaining) * 1000;

    currentConfig.serial = document.getElementById("input-serial").value.trim() || DEFAULT_CONFIG.serial;
    currentConfig.ticker = document.getElementById("input-ticker").value.trim() || DEFAULT_CONFIG.ticker;

    saveTicketState();
    updateUI();
    startTimer();

    settingsModal.classList.remove("active");
  });

  // Reset to Defaults (Synchronized with Current Time)
  document.getElementById("btn-reset-defaults").addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}

    initSynchronizedTicket();
    updateUI();
    startTimer();
    settingsModal.classList.remove("active");
  });

  // Hide Gear Button
  document.getElementById("btn-hide-gear").addEventListener("click", () => {
    currentConfig.gearVisible = false;
    saveTicketState();
    updateUI();
    settingsModal.classList.remove("active");
  });

  // Secret shortcut: 3 clicks on logo badge or Ctrl+Shift+S restores the gear icon
  let logoClickCount = 0;
  let logoClickTimer = null;
  const logoBadge = document.querySelector(".logo-badge");
  if (logoBadge) {
    logoBadge.addEventListener("click", () => {
      logoClickCount++;
      clearTimeout(logoClickTimer);
      logoClickTimer = setTimeout(() => {
        logoClickCount = 0;
      }, 1000);

      if (logoClickCount >= 3) {
        currentConfig.gearVisible = !currentConfig.gearVisible;
        saveTicketState();
        updateUI();
        logoClickCount = 0;
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === "KeyS") {
      currentConfig.gearVisible = !currentConfig.gearVisible;
      saveTicketState();
      updateUI();
    }
  });
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  initSynchronizedTicket();
  updateUI();
  startTimer();
  initModals();
});
