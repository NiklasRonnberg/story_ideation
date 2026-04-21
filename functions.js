let beings = [];
let places = [];
let objects = [];

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const COL_X = [100, 300, 500];
const REEL_SPACING = 40;
const REEL_HEIGHT = 120;

let columns = [];

/* ---------------- HANDLE TIMER ---------------- */
let timerInterval = null;
let timeLeft = 180; // 3 minutes in seconds


function startTimer() {
    if (timerInterval) return;

    const btn = document.getElementById("startBtn");

    btn.classList.add("pressed");

    timerInterval = setInterval(() => {
        timeLeft--;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            endSession();
        }

        let min = Math.floor(timeLeft / 60);
        let sec = timeLeft % 60;

        document.getElementById("timer").innerText =
            String(min).padStart(2, "0") +
            ":" +
            String(sec).padStart(2, "0");

    }, 1000);
}

function startSession() {
    const btn = document.getElementById("startBtn");
    const timer = document.getElementById("timer");

    timer.classList.add("active");

}

function endSession() {
    const btn = document.getElementById("startBtn");
    btn.classList.remove("pressed");

    const timer = document.getElementById("timer");
    timer.innerText = "01:00";

    timeLeft = 60;

}

/* ---------------- LOAD CSV ---------------- */

fetch("words.csv")
    .then(res => res.text())
    .then(data => {
        parseCSV(data);
        drawIdle();
    });

function parseCSV(data) {
    const lines = data.trim().split("\n");

    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",");
        if (parts.length < 3) continue;

        beings.push(parts[0].trim());
        places.push(parts[1].trim());
        objects.push(parts[2].trim());
    }
}

/* ---------------- DRAW ---------------- */

function drawIdle() {
    drawStatic("", "", "");
}

function drawStatic(a, b, c) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#00ffcc";
    ctx.shadowColor = "#00ffcc";
    ctx.shadowBlur = 8;

    ctx.fillText(a, COL_X[0], 80);
    ctx.fillText(b, COL_X[1], 80);
    ctx.fillText(c, COL_X[2], 80);

    ctx.shadowBlur = 0;
}

/* ---------------- REEL DRAW ---------------- */

function drawReel(list, index, offset, x, stopped) {
    ctx.save();

    ctx.beginPath();
    ctx.rect(x - 80, 20, 160, REEL_HEIGHT);
    ctx.clip();

    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#00ffcc";
    ctx.shadowColor = "#00ffcc";

    if (stopped) {
        ctx.shadowBlur = 12;
        ctx.fillText(list[index], x, 80);
        ctx.restore();
        return;
    }

    for (let i = -2; i <= 2; i++) {
        const wordIndex = (index + i + list.length) % list.length;
        const y = 80 + (i * REEL_SPACING) + offset;

        ctx.shadowBlur = Math.abs(i) === 0 ? 12 : 4;
        ctx.fillText(list[wordIndex], x, y);
    }

    ctx.restore();
}

/* ---------------- HELPERS ---------------- */

function rand(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function createColumn(list, finalWord) {
    return {
        list,
        index: Math.floor(Math.random() * list.length),
        offset: 0,
        speed: 25 + Math.random() * 10,
        slowing: false,
        stopped: false,
        finalWord
    };
}

/* ---------------- MAIN ---------------- */

function generateWords() {
    const startBtn = document.getElementById("startBtn");
    startBtn.disabled = false;

    timeLeft = 180;
    clearInterval(timerInterval);        
    timerInterval = null;
    const btn = document.getElementById("startBtn");
    btn.classList.remove("pressed");

    const timer = document.getElementById("timer");
    timer.innerText = "03:00";

    startSession();

    columns = [
        createColumn(beings, rand(beings)),
        createColumn(places, rand(places)),
        createColumn(objects, rand(objects))
    ];

    const start = performance.now();
    const duration = 1800;

    function animate(now) {

        const elapsed = now - start;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let allStopped = true;

        ctx.filter = columns.some(c => c.speed > 5) ? "blur(1.5px)" : "none";

        for (let i = 0; i < 3; i++) {

            let col = columns[i];

            if (elapsed > duration * 0.6) {
                col.speed *= 0.92;
                col.slowing = true;
            }

            col.offset += col.speed;

            if (col.offset >= REEL_SPACING) {
                col.offset = 0;
                col.index = (col.index + 1) % col.list.length;
            }

            if (elapsed >= duration && col.slowing) {
                col.speed = 0;
                col.stopped = true;

                while (col.list[col.index] !== col.finalWord) {
                    col.index = (col.index + 1) % col.list.length;
                }

                col.offset = 0;
            }

            drawReel(col.list, col.index, col.offset, COL_X[i], col.stopped);

            if (col.speed > 0) allStopped = false;
        }

        ctx.filter = "none";

        if (!allStopped) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}
