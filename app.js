// app.js
// DUCO Web Miner UI + backend runner cho Termux, Render, VPS

const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");

// Khởi tạo express + http + socket.io
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Dùng thư mục public chứa giao diện web tĩnh
app.use(express.static(path.join(__dirname, "public")));

// Route chính (UI)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Đường dẫn tới NodeJS Miner
const minerPath = path.join(__dirname, "miner", "index.js");

// Spawn tiến trình DUCO miner
const miner = spawn("node", [minerPath]);

// Gửi log từ stdout về Web UI
miner.stdout.on("data", (data) => {
  const msg = data.toString();
  io.emit("miner-log", msg);
  process.stdout.write("[MINER] " + msg);
});

// Gửi lỗi từ stderr về Web UI
miner.stderr.on("data", (data) => {
  const msg = data.toString();
  io.emit("miner-log", "[ERR] " + msg);
  process.stderr.write("[MINER-ERR] " + msg);
});

// Khi miner dừng
miner.on("exit", (code) => {
  const msg = `Miner exited with code ${code}`;
  io.emit("miner-log", "[EXIT] " + msg);
  console.log(msg);
});

// Lắng nghe cổng
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Web UI đang chạy tại http://localhost:${PORT}`);
});
