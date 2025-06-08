'use strict';

let timerInterval;
let duration = 300; // Default duration in seconds
let endDate;
let isTimerRunning = false;

let stopText, startButton, stopButton, timerElement, qrCodeElement, progressBarElement, endElement;

function initializeElements() {
    stopText = document.getElementById('stop-button');
    startButton = document.getElementById('start-button');
    stopButton = document.getElementById('stop-button');
    timerElement = document.getElementById('timer');
    qrCodeElement = document.getElementById('qr-code');
    progressBarElement = document.getElementById('progress-bar');
    endElement = document.getElementById('end');

    updateTimeButtons();
}

let lastTime = -1;
function updateTimeButtons() {

    let time = Math.floor((Math.floor(Date.now() / 1000 / 60) % 60) / 5) + 1;

    if (time == lastTime)
        return;
    lastTime = time;

    document.getElementById('start-buttons-up-to').style.setProperty('--currentDeg', (time * 30) + 'deg');

    const now = Date.now();

    document.querySelectorAll('[id^="up-to-"]').forEach(el => {
        const match = el.id.match(/(?<=^up-to-)\d+(?=$)/);
        const targetMinute = parseInt(match[0], 10) + time * 5;

        // Find the next occurrence of this minute value
        let target = new Date(now);
        target.setSeconds(0, 0);
        if (target.getMinutes() >= targetMinute) {
            target.setHours(target.getHours() + 1);
        }
        target.setMinutes(targetMinute);

        el.dataset.targetTime = target.getTime();
        if (match[0] == "0")
            endDate = el.dataset.targetTime / 1000;
        duration = 5 * 60;

        el.removeEventListener('click', el._upToClickHandler);
        el._upToClickHandler = () => {
            startTimer(null, Number(el.dataset.targetTime));
        };
        el.addEventListener('click', el._upToClickHandler);

        el.textContent = target.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: false,
        });
    });
}

function updateUrlParams() {
    const targetUrlParams = new URLSearchParams(window.location.search);
    targetUrlParams.set('endtime', endDate);
    targetUrlParams.set('duration', duration);

    const targetUrl = new URL(window.location.href);
    targetUrl.search = targetUrlParams.toString();
    window.history.replaceState(null, '', targetUrl.toString());

    return targetUrl.toString();
}

function generateQRCode(url) {
    QRCode.toDataURL(url, (err, qrUrl) => {
        qrCodeElement.src = qrUrl;
    });
}

function setTimerState(value) {
    isTimerRunning = value;
    document.body.classList.toggle('setup', !isTimerRunning);
}

window.startTimer = function startTimer(durationInSeconds, targetEnd) {
    endDate = targetEnd ?? (Date.now() + durationInSeconds * 1000)
    duration = durationInSeconds ?? (endDate - Date.now()) / 1000;

    console.log(`Starting timer for ${duration} seconds, ending at ${new Date(endDate).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })}`);
    console.log(`Target end time: ${targetEnd}`);
    console.log(`endDate: ${endDate}`);

    endElement.textContent = new Date(endDate).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });

    const targetUrl = updateUrlParams();
    generateQRCode(targetUrl);

    endDate = endDate / 1000;

    setTimerState(true);
};

let lastCurrentTime = 0;
function updateTimer() {
    let currentTime = Date.now() / 1000;
    let plsUpdate = false;
    if (currentTime - lastCurrentTime > 0.5) {
        lastCurrentTime = currentTime;
        plsUpdate = true;
    }

    let timeLeft = endDate - currentTime;

    if (isTimerRunning)
        progressBarElement.style.strokeDashoffset = Math.max(0, 565 - (timeLeft / duration) * 565);
    else
        progressBarElement.style.strokeDashoffset = Math.max(0, (timeLeft / duration) * 565);

    if (plsUpdate) {
        if (isTimerRunning)
            timerElement.textContent = formatTime(timeLeft);
        else {
            timerElement.textContent = new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: false,
            });

            updateTimeButtons();
        }
    }
}

function formatTime(seconds) {
    const isNegative = seconds < 0;
    const minutes = isNegative ? -Math.ceil(seconds / 60) : Math.floor(seconds / 60);
    const remainingSeconds = isNegative ? -Math.ceil(seconds % 60) : Math.floor(seconds % 60);

    return `${isNegative ? '-' : ''}${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

window.stopTimer = function stopTimer() {
    window.history.replaceState(null, '', window.location.pathname);
    lastTime = -1;
    updateTimeButtons();
    setTimerState(false);
};

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
        const end = parseInt(endtime, 10);

        if (!isNaN(durationInSeconds) && durationInSeconds > 0) {
            startTimer(durationInSeconds, end);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    parseUrlParameters();

    timerInterval = setInterval(updateTimer, 10);
});