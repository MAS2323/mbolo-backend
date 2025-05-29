import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "..", "public", "Uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(UploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
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
    "image/webp", // Added WebP support
    "application/pdf",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // console.log(
    //   `Invalid file upload attempt: MIME type=${file.mimetype}, filename=${file.originalname}`
    // );
    cb(
      new Error(
        `Solo se permiten imágenes (jpg, png, gif, webp), PDFs y videos (mp4, mpeg, mov). Tipo recibido: ${file.mimetype}`
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 40 * 1024 * 1024, // 40MB
  },
});

const uploadMiddleware = upload.fields([
  { name: "images", maxCount: 10 },
  { name: "videos", maxCount: 5 },
  { name: "logo", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

const multerErrorHandling = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "El archivo es demasiado grande. Máximo 40MB.",
      });
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "Número de archivos excede el límite permitido.",
      });
    } else {
      return res.status(400).json({ error: err.message });
    }
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

export { uploadMiddleware, multerErrorHandling };
export default upload;
