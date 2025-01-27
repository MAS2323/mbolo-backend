// // config/multer.js
// const multer = require('multer');
// const path = require('path');

// // Configuración de almacenamiento
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/'); // Directorio donde se almacenan las imágenes
//   },
//   filename: function (req, file, cb) {
//     cb(null, `${Date.now()}_${path.extname(file.originalname)}`); // Nombre único para cada archivo
//   },
// });

// const upload = multer({ storage });

// module.exports = upload;
