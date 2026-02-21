const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const music = document.getElementById("bgMusic");
const startOverlay = document.getElementById("startOverlay");
const startButton = document.getElementById("startButton");

// Menyesuaikan ukuran layar
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- STATE GAME ---
let isGameRunning = false;
let score = 0;
let highScore = localStorage.getItem("ninjaHighScore") || 0;
let gameSpeed = 6;
let isGameOver = false;
let obstacles = [];
let trees = []; 
let frames = 0;

// --- LOAD ASSETS ---
const playerImg = new Image(); playerImg.src = "player.png";
const treeImg = new Image(); treeImg.src = "tree.png";

// --- OBJEK PLAYER ---
const player = {
    x: 50,
    y: canvas.height - 150,
    width: 70,
    height: 80,
    dy: 0,
    jumpForce: 15,
    gravity: 0.8,
    grounded: false
};

// --- LOGIKA START ---
startButton.addEventListener("click", () => {
    startOverlay.style.display = "none";
    isGameRunning = true;
    if(music) {
        music.play().catch(e => console.log("Audio Aktif"));
    }
    update();
});

// --- LOGIKA POHON ---
function spawnTree() {
    if (frames % 120 === 0) {
        trees.push({ x: canvas.width, y: canvas.height - 170, width: 100, height: 120 });
    }
}

function handleBackground() {
    for (let i = 0; i < trees.length; i++) {
        trees[i].x -= gameSpeed * 0.5; 
        ctx.drawImage(treeImg, trees[i].x, trees[i].y, trees[i].width, trees[i].height);
        if (trees[i].x + trees[i].width < 0) { trees.splice(i, 1); i--; }
    }
}

// --- LOGIKA RINTANGAN ---
function spawnObstacle() {
    let spawnRate = Math.max(40, 90 - Math.floor(gameSpeed * 2));
    if (frames % spawnRate === 0) {
        obstacles.push({ x: canvas.width, y: canvas.height - 70, width: 40, height: 40 });
    }
}

function handleObstacles() {
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].x -= gameSpeed;
        ctx.fillStyle = "#ff4500"; // Warna bola api
        ctx.beginPath();
        ctx.arc(obstacles[i].x + 20, obstacles[i].y + 20, 20, 0, Math.PI * 2);
        ctx.fill();

        // Deteksi Tabrakan
        if (player.x + player.width - 20 > obstacles[i].x && 
            player.x + 20 < obstacles[i].x + obstacles[i].width &&
            player.y + player.height > obstacles[i].y) {
            
            isGameOver = true;
            if(music) music.pause();
            
            let currentScore = Math.floor(frames / 5);
            if (currentScore > highScore) {
                highScore = currentScore;
                localStorage.setItem("ninjaHighScore", highScore);
            }
        }
        if (obstacles[i].x + obstacles[i].width < 0) { obstacles.splice(i, 1); i--; }
    }
}

// --- INPUT ---
window.addEventListener("touchstart", () => {
    if (isGameRunning && player.grounded && !isGameOver) {
        player.dy = -player.jumpForce;
        player.grounded = false;
    }
    if (isGameOver) location.reload();
});

// --- LOOP UTAMA ---
function update() {
    if (!isGameRunning) return;

    if (isGameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "bold 40px Courier";
        ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2 - 40);
        ctx.font = "20px Courier";
        ctx.fillText("SKOR: " + Math.floor(frames/5), canvas.width/2, canvas.height/2 + 20);
        ctx.fillStyle = "#FFD700";
        ctx.fillText("TERTINGGI: " + highScore, canvas.width/2, canvas.height/2 + 55);
        ctx.fillStyle = "white";
        ctx.fillText("Ketuk untuk Restart", canvas.width/2, canvas.height/2 + 110);
        return;
    }

    // --- LOGIKA PERUBAHAN BACKGROUND ---
    let skyColor = "#a8c0ff"; // Siang (Default)
    if (gameSpeed >= 9 && gameSpeed < 12) {
        skyColor = "#ff7e5f"; // Sore
    } else if (gameSpeed >= 12) {
        skyColor = "#2c3e50"; // Malam
    }
    document.body.style.background = skyColor;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frames++;

    // Tambah kecepatan tiap 500 frame
    if (frames % 500 === 0) gameSpeed += 0.5;

    // Fisika Player
    player.y += player.dy;
    player.dy += player.gravity;
    if (player.y + player.height > canvas.height - 50) {
        player.y = canvas.height - 50 - player.height;
        player.dy = 0; player.grounded = true;
    }

    // Gambar Semuanya
    spawnTree(); 
    handleBackground();
    
    ctx.fillStyle = "white"; // Tanah salju
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    
    spawnObstacle(); 
    handleObstacles();

    // UI Skor (Teks jadi putih kalau sudah malam)
    ctx.fillStyle = (gameSpeed >= 12) ? "white" : "#333";
    ctx.textAlign = "left"; 
    ctx.font = "bold 20px Courier";
    ctx.fillText("SCORE: " + Math.floor(frames/5), 20, 50);
    ctx.font = "14px Courier";
    ctx.fillText("HIGH: " + highScore, 20, 75);
    ctx.fillText("SPEED: " + gameSpeed.toFixed(1), 20, 100);

    requestAnimationFrame(update);
}

// Mendaftarkan Service Worker agar Chrome mengenali sebagai PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log("Service Worker Terdaftar"));
}