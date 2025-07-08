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
    console.log(`Saving file to: ${uploadsDir}`);
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
    "image/webp",
    "application/pdf",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
  ];
  console.log(
    `File upload attempt: MIME type=${file.mimetype}, filename=${file.originalname}, fieldname=${file.fieldname}`
  );
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
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

// Middleware for store uploads (logo, banner, document)
const uploadMiddleware = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "banner", maxCount: 1 },
  { name: "document", maxCount: 1 },
]);

// Middleware for general uploads (images, videos)
const uploadGeneralMiddleware = upload.fields([
  { name: "images", maxCount: 10 },
  { name: "videos", maxCount: 5 },
]);

// Middleware specifically for orders (paymentReceipt)
const uploadOrderMiddleware = upload.single("paymentReceipt");

const multerErrorHandling = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error(
      `Multer error: ${err.message}, code: ${err.code}, field: ${err.field}`
    );
    // Log all received fields (file and non-file) for debugging
    console.log("Campos de archivo recibidos:", Object.keys(req.files || {}));
    console.log("Campos de FormData recibidos:", Object.keys(req.body || {}));
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "El archivo es demasiado grande. Máximo 40MB.",
      });
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: `Campo de archivo inesperado: ${err.field || "Desconocido"}`,
        receivedFileFields: Object.keys(req.files || {}),
        receivedFormDataFields: Object.keys(req.body || {}),
      });
    } else {
      return res.status(400).json({
        error: `Multer error: ${err.message}`,
        field: err.field || "Desconocido",
      });
    }
  } else if (err) {
    console.error(`File filter error: ${err.message}`);
    return res.status(400).json({ error: err.message });
  }
  next();
};

export {
  uploadMiddleware,
  uploadGeneralMiddleware,
  uploadOrderMiddleware,
  multerErrorHandling,
};
export default upload;
