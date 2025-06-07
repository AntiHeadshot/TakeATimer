let timerInterval;
let duration = 300; // Default duration in seconds
let timeLeft = 300; // Default timer duration in seconds
let endDate;

let stopText, startButton, stopButton, timerElement, qrCodeElement, progressBarElement;

function initializeElements() {
    stopText = document.getElementById('stop-button');
    startButton = document.getElementById('start-button');
    stopButton = document.getElementById('stop-button');
    timerElement = document.getElementById('timer');
    qrCodeElement = document.getElementById('qr-code');
    progressBarElement = document.getElementById('progress-bar');
}

function updateUrlParams(endDate, duration) {
    const targetUrlParams = new URLSearchParams(window.location.search);
    targetUrlParams.set('endtime', endDate.getTime());
    targetUrlParams.set('duration', duration);

    const targetUrl = new URL(window.location.href);
    targetUrl.search = targetUrlParams.toString();
    window.history.replaceState(null, '', targetUrl.toString());

    return targetUrl.toString();
}

function generateQRCode(url) {
    QRCode.toDataURL(url, (err, qrUrl) => {
        qrCodeElement.src = qrUrl;
        qrCodeElement.style.display = 'block';
    });
}

function toggleButtonVisibility(isTimerRunning) {
    startButton.style.display = isTimerRunning ? 'none' : 'block';
    stopButton.style.display = isTimerRunning ? 'block' : 'none';
}

function startTimer(durationInSeconds, targetEnd) {
    clearInterval(timerInterval);

    endDate = targetEnd ?? new Date(Date.now() + durationInSeconds * 1000);
    timeLeft = (endDate.getTime() - Date.now()) / 1000;
    duration = durationInSeconds ?? timeLeft;

    document.getElementById('end').textContent = endDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const targetUrl = updateUrlParams(endDate, duration);
    generateQRCode(targetUrl);

    timerInterval = setInterval(updateTimer, 10);
    toggleButtonVisibility(true);
}
window.startTimer = startTimer;

let lastTimeLeft = Number.MAX_SAFE_INTEGER;
function updateTimer() {
    timeLeft = (endDate.getTime() - Date.now()) / 1000;

    if (timeLeft <= 0) {
        qrCodeElement.style.display = 'none';
    }

    if (Math.abs(timeLeft - lastTimeLeft) > 0.5) {
        lastTimeLeft = timeLeft;
        timerElement.textContent = formatTime(timeLeft);
    }

    progressBarElement.style.strokeDashoffset = Math.max(0, 565 - (timeLeft / duration) * 565);
}

function formatTime(seconds) {
    const isNegative = seconds < 0;
    const minutes = isNegative ? -Math.ceil(seconds / 60) : Math.floor(seconds / 60);
    const remainingSeconds = isNegative ? -Math.ceil(seconds % 60) : Math.floor(seconds % 60);

    return `${isNegative ? '-' : ''}${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function stopTimer() {
    clearInterval(timerInterval);
    timerElement.textContent = 'stopped';
    qrCodeElement.style.display = 'none';

    window.history.replaceState(null, '', window.location.pathname); // Clear the URL parameters
    toggleButtonVisibility(false);
}
window.stopTimer = stopTimer;

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}
window.toggleFullScreen = toggleFullScreen;

function parseUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const endtime = params.get('endtime');
    const duration = params.get('duration');

    if (endtime && duration) {
        const durationInSeconds = parseInt(duration, 10);
        const end = new Date(parseInt(endtime, 10));

        if (!isNaN(durationInSeconds) && durationInSeconds > 0) {
            startTimer(durationInSeconds, end);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    parseUrlParameters();
});