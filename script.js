console.log("--- POMODORO SCRIPT VERSION 3.0 RUNNING ---"); // DAS IST UNSERE BEWEIS-ZEILE

(function() {
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
    let currentMode = 'work';
    let sessionsCompleted = 0;
    let sessionGoal = 4;

    function saveState() {
        try {
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
        } catch (e) {
            console.error("Error saving state:", e);
        }
    }

    function loadState() {
        try {
            const savedStateJSON = localStorage.getItem('pomodoroState');
            if (!savedStateJSON) {
                setupTimer();
                return;
            }

            const savedState = JSON.parse(savedStateJSON);
            
            modeSelect.value = savedState.selectedMode;
            sessionGoalInput.value = savedState.sessionGoal;
            
            sessionsCompleted = savedState.sessionsCompleted;
            currentMode = savedState.currentMode;
            sessionGoal = savedState.sessionGoal;
            totalSeconds = savedState.totalSeconds;
            let wasRunning = savedState.isRunning;
            isRunning = false; 

            if (wasRunning) {
                const elapsedSeconds = Math.round((Date.now() - savedState.timestamp) / 1000);
                totalSeconds -= elapsedSeconds;
            }

            if (totalSeconds < 0) totalSeconds = 0;

            updateUIFromState();
            
            if (wasRunning && totalSeconds > 0) {
                startTimer();
            } else if (wasRunning && totalSeconds <= 0) {
                switchModeAndContinue();
            }
        } catch (e) {
            console.error("Error loading state:", e);
            setupTimer();
        }
    }

    function setupTimer() {
        clearInterval(timerInterval);
        isRunning = false;
        sessionsCompleted = 0;
        currentMode = 'work';
        sessionGoal = parseInt(sessionGoalInput.value, 10);
        totalSeconds = pomodoroSettings[modeSelect.value].work * 60;
        updateUIFromState();
    }

    function resetAndClear() {
        try {
            localStorage.removeItem('pomodoroState');
        } catch(e) {
            console.error("Error clearing state:", e);
        }
        setupTimer();
    }
    
    function updateSessionDisplay() {
        const currentSession = currentMode === 'work' ? sessionsCompleted + 1 : sessionsCompleted;
        sessionDisplay.textContent = `Session ${Math.min(currentSession, sessionGoal)} of ${sessionGoal}`;
    }

    function updateUIFromState() {
        statusDisplay.textContent = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
        timerContainer.className = currentMode === 'work' ? 'work-mode' : 'break-mode';
        updateDisplay();
        updateSessionDisplay();
        
        const settingsDisabled = isRunning;
        modeSelect.disabled = settingsDisabled;
        sessionGoalInput.disabled = settingsDisabled;
        startPauseBtn.textContent = isRunning ? 'Pause' : 'Start';
        startPauseBtn.classList.toggle('running', isRunning);
    }

    function updateDisplay() {
        if (totalSeconds < 0) totalSeconds = 0;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timeDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function switchMode() {
        if (currentMode === 'work') {
            sessionsCompleted++;
            if (sessionsCompleted >= sessionGoal) {
                alert('All sessions complete! Great job!');
                resetAndClear();
                return false;
            }
            currentMode = 'break';
            totalSeconds = pomodoroSettings[modeSelect.value].break * 60;
        } else {
            currentMode = 'work';
            totalSeconds = pomodoroSettings[modeSelect.value].work * 60;
        }
        updateUIFromState();
        if(alertSound) alertSound.play();
        return true;
    }
    
    function switchModeAndContinue() {
        const shouldContinue = switchMode();
        if (shouldContinue) {
            startTimer();
        }
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

    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        updateUIFromState();
        timerInterval = setInterval(countdown, 1000);
    }

    function pauseTimer() {
        if (!isRunning) return;
        isRunning = false;
        clearInterval(timerInterval);
        saveState();
        updateUIFromState();
    }
    
    // Event Listeners
    startPauseBtn.addEventListener('click', () => {
        if (isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    });

    resetBtn.addEventListener('click', resetAndClear);
    modeSelect.addEventListener('change', resetAndClear);
    sessionGoalInput.addEventListener('change', resetAndClear);

    window.addEventListener('beforeunload', () => {
        if (isRunning) {
            saveState();
        }
    });

    // Initialization
    loadState();
})();