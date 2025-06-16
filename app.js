// app.js
// DUCO Web Miner UI + backend runner cho Termux, Render, VPS

const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Giao diện tĩnh (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, "public")));

// Trang chính
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Đường dẫn tới DUCO miner
const minerPath = path.join(__dirname, "miner", "index.js");

// Chạy miner dưới dạng tiến trình con
const miner = spawn("node", [minerPath]);

// Nhận log stdout (log bình thường)
miner.stdout.on("data", (data) => {
  const msg = data.toString();
  io.emit("miner-log", msg); // Gửi sạch log lên UI
  process.stdout.write("[MINER] " + msg); // Ghi log terminal kèm prefix
});

// Nhận log lỗi stderr
miner.stderr.on("data", (data) => {
  const msg = data.toString();
  io.emit("miner-log", msg); // Cũng gửi log lỗi về UI (ko prefix)
  process.stderr.write("[MINER-ERR] " + msg);
});

// Khi miner dừng
miner.on("exit", (code) => {
  const msg = `Miner exited with code ${code}`;
  io.emit("miner-log", msg);
  console.log("[EXIT]", msg);
});

// Mở cổng web UI
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Web UI đang chạy tại http://localhost:${PORT}`);
});
