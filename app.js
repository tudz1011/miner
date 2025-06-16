// app.js
// DUCO Web Miner UI + backend runner cho Termux, Render, VPS

const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");
const stripAnsi = require("strip-ansi"); // 👈 Thư viện lọc mã ANSI

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Giao diện tĩnh (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, "public")));

// Trang chính
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Đường dẫn tới miner
const minerPath = path.join(__dirname, "miner", "index.js");

// Bộ đệm log trong RAM
let logBuffer = "";

// Gửi log + lưu lại
function broadcastLog(msg) {
  const clean = stripAnsi(msg); // 🧼 Bỏ mã ANSI
  io.emit("miner-log", clean);
  logBuffer += clean;
  if (logBuffer.length > 10000) logBuffer = logBuffer.slice(-10000);
}

// Khi có user truy cập, gửi log cũ
io.on("connection", (socket) => {
  socket.emit("miner-log", logBuffer);
});

// Chạy tiến trình miner
const miner = spawn("node", [minerPath]);

miner.stdout.on("data", (data) => {
  const msg = data.toString();
  broadcastLog(msg);
  process.stdout.write("[MINER] " + msg);
});

miner.stderr.on("data", (data) => {
  const msg = data.toString();
  broadcastLog(msg);
  process.stderr.write("[MINER-ERR] " + msg);
});

miner.on("exit", (code) => {
  const msg = `Miner exited with code ${code}\n`;
  broadcastLog(msg);
  console.log("[EXIT]", msg);
});

// Lắng nghe cổng
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Web UI đang chạy tại http://localhost:${PORT}`);
});
