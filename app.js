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

// Khởi tạo log buffer (lưu log tạm thời trong RAM)
let logBuffer = "";

// Gửi log mới và lưu lại vào logBuffer (giới hạn 10000 ký tự)
function broadcastLog(msg) {
  io.emit("miner-log", msg);
  logBuffer += msg;
  if (logBuffer.length > 10000) {
    logBuffer = logBuffer.slice(-10000);
  }
}

// Khi client mới kết nối -> gửi lại log cũ
io.on("connection", (socket) => {
  socket.emit("miner-log", logBuffer);
});

// Spawn tiến trình DUCO miner
const miner = spawn("node", [minerPath]);

// Gửi log từ stdout về Web UI
miner.stdout.on("data", (data) => {
  const msg = data.toString();
  broadcastLog(msg);
  process.stdout.write("[MINER] " + msg);
});

// Gửi lỗi từ stderr về Web UI
miner.stderr.on("data", (data) => {
  const msg = data.toString();
  broadcastLog(msg);
  process.stderr.write("[MINER-ERR] " + msg);
});

// Khi miner dừng
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
