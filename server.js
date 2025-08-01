const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
//dedem
const app = express();
app.use(
  cors({
    origin: "https://ico-pond.vercel.app", //https://ico-pond.vercel.app
  })
);
app.use(express.json({ limit: "10mb" }));

cloudinary.config({
  cloud_name: process.env._CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
}); 

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://ico-pond.vercel.app",
    methods: ["GET", "POST"],
  },
});
// Socket.IO: client terhubung
io.on("connection", (socket) => {
  console.log("backend terhubung:", socket.id);
});

// Endpoint pH dari ESP32
app.post("/ph", async (req, res) => {
  const { ph } = req.body;
  console.log("pH diterima dari ESP32 :", ph);

  // Kirim data pH ke client via Socket.IO
  io.emit("phUpdate", parseFloat(ph));

  // Tidak lagi mengirim POST ke frontend
  res.status(200).json({ message: "pH diterima" });
});



// Jalankan server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
