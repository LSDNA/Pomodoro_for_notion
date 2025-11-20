// DOM-Elemente
const timeDisplay = document.getElementById('time-display');
const statusDisplay = document.getElementById('status');
const sessionDisplay = document.getElementById('session-display');
const startPauseBtn = document.getElementById('start-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const modeSelect = document.getElementById('mode-select');
const sessionGoalInput = document.getElementById('session-goal');
const timerContainer = document.getElementById('timer-container');
const alertSound = document.getElementById('alert-sound');

// Timer-Einstellungen
const pomodoroSettings = {
    '25/5': { work: 25, break: 5 },
    '50/10': { work: 50, break: 10 }
};

// Zustandsvariablen
let timerInterval = null;
let totalSeconds = 0;
let isRunning = false;
let currentMode = 'work';
let sessionsCompleted = 0;
let sessionGoal = 4;

// --- NEUE FUNKTIONEN ZUM SPEICHERN UND LADEN ---

// Speichert den aktuellen Zustand des Timers im localStorage
function saveState() {
    if (totalSeconds <= 0 && !isRunning) return; // Nichts speichern, wenn der Timer zurückgesetzt wurde

    const state = {
        totalSeconds: totalSeconds,
        isRunning: isRunning,
        currentMode: currentMode,
        sessionsCompleted: sessionsCompleted,
        sessionGoal: sessionGoal,
        selectedMode: modeSelect.value,
        timestamp: Date.now() // Wichtig, um die vergangene Zeit zu berechnen
    };
    localStorage.setItem('pomodoroState', JSON.stringify(state));
}

// Lädt den Zustand aus dem localStorage
function loadState() {
    const savedStateJSON = localStorage.getItem('pomodoroState');
    if (!savedStateJSON) {
        resetTimer(); // Wenn kein Zustand gespeichert ist, normal starten
        return;
    }

    const savedState = JSON.parse(savedStateJSON);
    
    // UI-Elemente wiederherstellen
    modeSelect.value = savedState.selectedMode;
    sessionGoalInput.value = savedState.sessionGoal;
    
    sessionsCompleted = savedState.sessionsCompleted;
    currentMode = savedState.currentMode;
    sessionGoal = savedState.sessionGoal;
    totalSeconds = savedState.totalSeconds;
    isRunning = savedState.isRunning;

    // Vergangene Zeit berechnen, seit der Tab verlassen wurde
    if (isRunning) {
        const elapsedSeconds = Math.round((Date.now() - savedState.timestamp) / 1000);
        totalSeconds -= elapsedSeconds;
    }

    // Timer fortsetzen oder UI aktualisieren
    if (totalSeconds <= 0) {
        switchMode(); // Wenn die Zeit abgelaufen ist, während man weg war
    } else {
        updateUIFromState();
        if (isRunning) {
            startTimer(true); // Timer fortsetzen, ohne die UI erneut zu sperren
        }
    }
}

// --- ANGEPASSTE UND VORHANDENE FUNKTIONEN ---

// Aktualisiert die gesamte Benutzeroberfläche basierend auf dem aktuellen Zustand
function updateUIFromState() {
    statusDisplay.textContent = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
    timerContainer.className = currentMode === 'work' ? 'work-mode' : 'break-mode';
    updateDisplay();
    updateSessionDisplay();
    if (isRunning) {
        startPauseBtn.textContent = 'Pause';
        startPauseBtn.classList.add('running');
        modeSelect.disabled = true;
        sessionGoalInput.disabled = true;
    }
}

function updateDisplay() {
    if (totalSeconds < 0) totalSeconds = 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timeDisplay.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

function switchMode() {
    if (currentMode === 'work') {
        sessionsCompleted++;
        if (sessionsCompleted >= sessionGoal) {
            alert('All sessions complete! Great job!');
            resetTimer();
            return;
        }
        currentMode = 'break';
        totalSeconds = pomodoroSettings[modeSelect.value].break * 60;
    } else {
        currentMode = 'work';
        totalSeconds = pomodoroSettings[modeSelect.value].work * 60;
    }
    updateUIFromState();
    alertSound.play();
}

function countdown() {
    if (totalSeconds > 0) {
        totalSeconds--;
        updateDisplay();
    } else {
        clearInterval(timerInterval);
        switchMode();
        startTimer(); // Automatisch den nächsten Timer starten
    }
}

function startTimer(resuming = false) {
    if (isRunning && !resuming) return;
    isRunning = true;
    if (!resuming) { // Nur UI sperren, wenn es ein neuer Start ist
        modeSelect.disabled = true;
        sessionGoalInput.disabled = true;
    }
    startPauseBtn.textContent = 'Pause';
    startPauseBtn.classList.add('running');
    timerInterval = setInterval(countdown, 1000);
}

function pauseTimer() {
    if (!isRunning) return;
    isRunning = false;
    startPauseBtn.textContent = 'Start';
    startPauseBtn.classList.remove('running');
    clearInterval(timerInterval);
    saveState(); // Zustand speichern, wenn pausiert wird
}

function resetTimer() {
    pauseTimer();
    localStorage.removeItem('pomodoroState'); // Wichtig: Gespeicherten Zustand löschen
    sessionsCompleted = 0;
    currentMode = 'work';
    sessionGoal = sessionGoalInput.value;
    totalSeconds = pomodoroSettings[modeSelect.value].work * 60;
    
    modeSelect.disabled = false;
    sessionGoalInput.disabled = false;
    
    updateUIFromState();
}

function updateSessionDisplay() {
    const currentSession = currentMode === 'work' ? sessionsCompleted + 1 : sessionsCompleted;
    sessionDisplay.textContent = `Session ${Math.min(currentSession, sessionGoal)} of ${sessionGoal}`;
}

// --- Event-Listener ---

startPauseBtn.addEventListener('click', () => {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});

resetBtn.addEventListener('click', resetTimer);
modeSelect.addEventListener('change', resetTimer);
sessionGoalInput.addEventListener('change', () => { sessionGoal = sessionGoalInput.value; resetTimer(); });

// NEU: Zustand speichern, kurz bevor die Seite verlassen wird
window.addEventListener('beforeunload', () => {
    if (isRunning) {
        saveState();
    }
});

// --- Initialisierung ---
loadState(); // Timer mit dem gespeicherten Zustand starten, falls vorhanden 