const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();
const app = express();
app.use(
  cors({
    origin: "https://ico-pond.vercel.app", //https://ico-pond.vercel.app
  })
);
app.use(express.json({ limit: "10mb" }));

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
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

app.post("/new-image", (req, res) => {
  const { url, timestamp } = req.body;

  if (!url || !timestamp) {
    return res.status(400).json({ message: "url dan timestamp wajib ada" });
  }

  console.log("Gambar deteksi hama burung baru:", { url, timestamp });
  io.emit("newImageUrl", { url, timestamp });

  res.status(200).json({ message: "Gambar baru dikirim ke client" });
});

// Endpoint ambil semua gambar dari Cloudinary
app.get("/", async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: "upload",
      prefix: "",
      max_results: 100,
      direction: "desc",
    });

    const imageUrls = result.resources.map((img) => ({
      url: img.secure_url,
      timestamp: img.created_at,
    }));

    res.status(200).json({ imageUrls });
  } catch (error) {
    console.error("Gagal mengambil gambar:", error);
    res.status(500).send("Terjadi kesalahan saat mengambil gambar.");
  }
});

// Jalankan server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
