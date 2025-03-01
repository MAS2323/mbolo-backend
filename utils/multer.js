import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Obtener __dirname compatible con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear la carpeta 'public/uploads' si no existe
const uploadsDir = path.join(__dirname, "public", "uploads");

// Crear la carpeta y los directorios intermedios si no existen
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Guardar en la carpeta uploads
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `image-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage: storage });

export default upload;
