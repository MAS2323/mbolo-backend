import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "..", "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    if (file.mimetype.startsWith("image")) {
      cb(null, `img-${Date.now()}${ext}`);
    } else if (file.mimetype.startsWith("video")) {
      cb(null, `vid-${Date.now()}${ext}`);
    } else if (file.mimetype === "application/pdf") {
      cb(null, `pdf-${Date.now()}${ext}`);
    } else {
      cb(new Error("Tipo de archivo no soportado"), false);
    }
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "video/mp4",
    "video/mpeg",
    "video/quicktime", // .mov
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Solo se permiten imágenes, PDFs y videos (mp4, mpeg, mov)"),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 40 * 1024 * 1024, // 40MB to match desired video size limit
  },
});

const uploadMiddleware = upload.fields([
  { name: "images", maxCount: 10 }, // Permitir hasta 10 imágenes
  { name: "videos", maxCount: 5 }, // Permitir hasta 5 videos
  { name: "logo", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

// Custom error handling middleware
const multerErrorHandling = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error:
          "El archivo es demasiado grande. El tamaño máximo permitido es 40MB.",
      });
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res
        .status(400)
        .json({ error: "Número de archivos excede el límite permitido." });
    } else {
      return res.status(400).json({ error: err.message });
    }
  } else {
    next(err);
  }
};

export { uploadMiddleware, multerErrorHandling };
export default upload;
