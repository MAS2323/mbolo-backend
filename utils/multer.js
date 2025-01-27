import multer from "multer";
import path from "path";
import fs from "node:fs";
import express from "express";
const app = express();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/uploads");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `image-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage: storage });

app.post("/images/multi", upload.array("images", 6), (req, res) => {
  req.files.map(saveImage);
  res.send("Termina Multi");
});

function saveImage(file) {
  const newPath = path.join(__dirname, "./public/uploads", file.originalname);
  if (fs.existsSync(file.path)) {
    fs.renameSync(file.path, newPath); // Renombrar y mover archivo
  }

  return newPath;
}

export default upload;
