import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube una imagen a Cloudinary en una carpeta específica.
 * @param {string} filePath - Ruta del archivo de imagen.
 * @param {string} folderName - Nombre de la carpeta en Cloudinary.
 * @returns {Promise<{url: string, public_id: string}>} - URL y public_id de la imagen subida.
 */
export async function uploadImage(filePath, folderName) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folderName,
    });
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Error al subir la imagen a Cloudinary:", error);
    throw error;
  }
}

/**
 * Elimina una imagen de Cloudinary.
 * @param {string} public_id - ID público de la imagen en Cloudinary.
 * @returns {Promise<any>} - Resultado de la operación.
 */
export async function deleteImage(public_id) {
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    return result;
  } catch (error) {
    console.error("Error al eliminar la imagen de Cloudinary:", error);
    throw error;
  }
}

/**
 * Actualiza una imagen en Cloudinary.
 * @param {string} public_id - ID público de la imagen antigua.
 * @param {string} filePath - Ruta del archivo de la nueva imagen.
 * @param {string} folderName - Nombre de la carpeta en Cloudinary.
 * @returns {Promise<{url: string, public_id: string}>} - URL y public_id de la nueva imagen.
 */
export async function updateImage(public_id, filePath, folderName) {
  try {
    // Eliminar la imagen antigua de Cloudinary
    await cloudinary.uploader.destroy(public_id);

    // Subir la nueva imagen con el mismo public_id y en la carpeta especificada
    const result = await cloudinary.uploader.upload(filePath, {
      public_id, // Usar el mismo public_id para mantener la referencia
      folder: folderName, // Usar el nombre de la carpeta proporcionado
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Error al actualizar la imagen en Cloudinary:", error);
    throw error;
  }
}

export default cloudinary;
