// DOM Elements
const timeDisplay = document.getElementById('time-display');
const statusDisplay = document.getElementById('status');
const sessionDisplay = document.getElementById('session-display');
const startPauseBtn = document.getElementById('start-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const modeSelect = document.getElementById('mode-select');
const sessionGoalInput = document.getElementById('session-goal');
const timerContainer = document.getElementById('timer-container');
const alertSound = document.getElementById('alert-sound');

// Timer Settings
const pomodoroSettings = {
    '25/5': { work: 25, break: 5 },
    '50/10': { work: 50, break: 10 }
};

// State Variables
let timerInterval = null;
let totalSeconds = 0;
let isRunning = false;
let currentMode = 'work'; // 'work' or 'break'
let sessionsCompleted = 0;
let sessionGoal = 4;

// --- Functions ---

function updateDisplay() {
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
        statusDisplay.textContent = 'Break';
        timerContainer.className = 'break-mode';
        totalSeconds = pomodoroSettings[modeSelect.value].break * 60;
    } else {
        currentMode = 'work';
        statusDisplay.textContent = 'Work';
        timerContainer.className = 'work-mode';
        totalSeconds = pomodoroSettings[modeSelect.value].work * 60;
    }
    updateSessionDisplay();
    updateDisplay();
    alertSound.play();
}

function countdown() {
    if (totalSeconds > 0) {
        totalSeconds--;
        updateDisplay();
    } else {
        switchMode();
    }
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startPauseBtn.textContent = 'Pause';
    startPauseBtn.classList.add('running');
    modeSelect.disabled = true;
    sessionGoalInput.disabled = true;
    timerInterval = setInterval(countdown, 1000);
}

function pauseTimer() {
    if (!isRunning) return;
    isRunning = false;
    startPauseBtn.textContent = 'Start';
    startPauseBtn.classList.remove('running');
    clearInterval(timerInterval);
}

function resetTimer() {
    pauseTimer();
    sessionsCompleted = 0;
    currentMode = 'work';
    sessionGoal = sessionGoalInput.value;
    totalSeconds = pomodoroSettings[modeSelect.value].work * 60;
    
    statusDisplay.textContent = 'Work';
    timerContainer.className = 'work-mode';
    modeSelect.disabled = false;
    sessionGoalInput.disabled = false;
    
    updateDisplay();
    updateSessionDisplay();
}

function updateSessionDisplay() {
    const currentSession = currentMode === 'work' ? sessionsCompleted + 1 : sessionsCompleted;
    sessionDisplay.textContent = `Session ${Math.min(currentSession, sessionGoal)} of ${sessionGoal}`;
}

// --- Event Listeners ---

startPauseBtn.addEventListener('click', () => {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});

resetBtn.addEventListener('click', resetTimer);
modeSelect.addEventListener('change', resetTimer);
sessionGoalInput.addEventListener('change', resetTimer);

// Initialize
resetTimer();