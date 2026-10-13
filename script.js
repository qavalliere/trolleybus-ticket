// Default configuration matching the original screenshot with 1:30:00 countdown
const DEFAULT_CONFIG = {
  carrier: "Миколаївелектротранс",
  purchased: "Придбано 13 жовтня о 20:09",
  count: "1 квиток",
  secondsRemaining: 5400, // 1 hour 30 min 00 sec
  serial: "164 142",
  ticker: "Життя — цікаве, і мотивація то є сильна: філософія, психологія. Найголовніше — залишайтеся людьми і кричіть, що ви живі. Я живий!",
  gearVisible: true
};

let currentConfig = { ...DEFAULT_CONFIG };
let timerInterval = null;
let currentRemaining = currentConfig.secondsRemaining;

const UK_MONTHS = [
  "січня", "лютого", "березня", "квітня", "травня", "червня",
  "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"
];

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

// Start live countdown timer
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (currentRemaining > 0) {
      currentRemaining--;
      document.getElementById("display-timer").textContent = formatTime(currentRemaining);
    } else {
      clearInterval(timerInterval);
      document.getElementById("display-timer").textContent = "0:00:00";
    }
  }, 1000);
}

// Helper: Format current timestamp in Ukrainian
function getCurrentUkTime() {
  const now = new Date();
  const day = now.getDate();
  const month = UK_MONTHS[now.getMonth()];
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `Придбано ${day} ${month} о ${hours}:${minutes}`;
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
  });

  // Save Settings
  document.getElementById("btn-save-settings").addEventListener("click", () => {
    currentConfig.carrier = document.getElementById("input-carrier").value.trim() || DEFAULT_CONFIG.carrier;
    currentConfig.count = document.getElementById("input-count").value.trim() || DEFAULT_CONFIG.count;
    currentConfig.purchased = document.getElementById("input-purchased").value.trim() || DEFAULT_CONFIG.purchased;
    
    const secInput = parseInt(document.getElementById("input-timer-seconds").value, 10);
    currentRemaining = !isNaN(secInput) && secInput >= 0 ? secInput : currentConfig.secondsRemaining;
    currentConfig.secondsRemaining = currentRemaining;

    currentConfig.serial = document.getElementById("input-serial").value.trim() || DEFAULT_CONFIG.serial;
    currentConfig.ticker = document.getElementById("input-ticker").value.trim() || DEFAULT_CONFIG.ticker;

    updateUI();
    startTimer();

    settingsModal.classList.remove("active");
  });

  // Reset to Defaults (1:30:00)
  document.getElementById("btn-reset-defaults").addEventListener("click", () => {
    currentConfig = { ...DEFAULT_CONFIG };
    currentRemaining = DEFAULT_CONFIG.secondsRemaining;
    updateUI();
    startTimer();
    settingsModal.classList.remove("active");
  });

  // Hide Gear Button
  document.getElementById("btn-hide-gear").addEventListener("click", () => {
    currentConfig.gearVisible = false;
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
        updateUI();
        logoClickCount = 0;
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === "KeyS") {
      currentConfig.gearVisible = !currentConfig.gearVisible;
      updateUI();
    }
  });
}

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  updateUI();
  startTimer();
  initModals();
});
