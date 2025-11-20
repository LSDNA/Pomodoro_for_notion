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

// --- FUNKTIONEN ZUM SPEICHERN UND LADEN ---

function saveState() {
    if (totalSeconds <= 0 && !isRunning && sessionsCompleted === 0) return;

    const state = {
        totalSeconds: totalSeconds,
        isRunning: isRunning,
        currentMode: currentMode,
        sessionsCompleted: sessionsCompleted,
        sessionGoal: parseInt(sessionGoalInput.value, 10),
        selectedMode: modeSelect.value,
        timestamp: Date.now()
    };
    localStorage.setItem('pomodoroState', JSON.stringify(state));
}

function loadState() {
    const savedStateJSON = localStorage.getItem('pomodoroState');
    if (!savedStateJSON) {
        resetTimer(true); // Initialer Reset ohne Löschen des Speichers
        return;
    }

    const savedState = JSON.parse(savedStateJSON);
    
    modeSelect.value = savedState.selectedMode;
    sessionGoalInput.value = savedState.sessionGoal;
    
    sessionsCompleted = savedState.sessionsCompleted;
    currentMode = savedState.currentMode;
    sessionGoal = savedState.sessionGoal;
    totalSeconds = savedState.totalSeconds;
    isRunning = savedState.isRunning;

    if (isRunning) {
        const elapsedSeconds = Math.round((Date.now() - savedState.timestamp) / 1000);
        totalSeconds -= elapsedSeconds;
    }

    if (totalSeconds < 0) totalSeconds = 0;

    updateUIFromState();
    
    if (isRunning && totalSeconds > 0) {
        startTimer(true);
    } else if (isRunning && totalSeconds <= 0) {
        clearInterval(timerInterval);
        switchModeAndContinue();
    }
}

function switchModeAndContinue() {
    const shouldContinue = switchMode();
    if (shouldContinue) {
        startTimer();
    }
}

// --- ANGEPASSTE UND VORHANDENE FUNKTIONEN ---

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
    } else {
        startPauseBtn.textContent = 'Start';
        startPauseBtn.classList.remove('running');
        modeSelect.disabled = false;
        sessionGoalInput.disabled = false;
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
            return false;
        }
        currentMode = 'break';
        totalSeconds = pomodoroSettings[modeSelect.value].break * 60;
    } else {
        currentMode = 'work';
        totalSeconds = pomodoroSettings[modeSelect.value].work * 60;
    }
    updateUIFromState();
    alertSound.play();
    return true;
}

function countdown() {
    if (totalSeconds > 0) {
        totalSeconds--;
        updateDisplay();
    } else {
        clearInterval(timerInterval);
        switchModeAndContinue();
    }
}

function startTimer(resuming = false) {
    if (isRunning && !resuming) return;
    isRunning = true;
    updateUIFromState();
    timerInterval = setInterval(countdown, 1000);
}

function pauseTimer() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(timerInterval);
    updateUIFromState();
    saveState();
}

function resetTimer(isInitial = false) {
    clearInterval(timerInterval);
    isRunning = false;
    if (!isInitial) {
        localStorage.removeItem('pomodoroState');
    }
    
    sessionsCompleted = 0;
    currentMode = 'work';
    sessionGoal = parseInt(sessionGoalInput.value, 10);
    totalSeconds = pomodoroSettings[modeSelect.value].work * 60;
    
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

resetBtn.addEventListener('click', () => resetTimer(false));
modeSelect.addEventListener('change', () => resetTimer(false));
sessionGoalInput.addEventListener('change', () => resetTimer(false));

window.addEventListener('beforeunload', () => {
    if (isRunning) {
        saveState();
    }
});

// --- Initialisierung ---
loadState();