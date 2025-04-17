import Professional from "../models/Professional.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import Subcategory from "../models/Subcategoryp.js";
import Location from "../models/Location.js";
import { uploadImage, deleteImage, updateImage } from "../utils/cloudinary.js";
import fs from "fs";

// Create a new professional account
export const createProfessional = async (req, res) => {
  try {
    const {
      name,
      email,
      phone_number,
      description,
      owner,
      category,
      subcategory,
      address,
      capitalOwnership,
      companySize,
      legalForm,
      economicSector,
      operationScope,
      socialCapital,
      numberOfEstablishments,
      numberOfEmployees,
      nif,
      expedientNumber,
      certificateNumber,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !phone_number ||
      !description ||
      !owner ||
      !category ||
      !subcategory ||
      !address ||
      !capitalOwnership ||
      !companySize ||
      !legalForm ||
      !economicSector ||
      !operationScope ||
      !socialCapital ||
      !numberOfEstablishments ||
      !numberOfEmployees ||
      !nif ||
      !expedientNumber ||
      !certificateNumber
    ) {
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios" });
    }

    // Check if a professional account already exists for the owner
    const existingProfessional = await Professional.findOne({ owner });
    if (existingProfessional) {
      return res.status(400).json({
        message: "Ya existe una cuenta profesional para este usuario",
      });
    }

    // Validate references
    const userExists = await User.findById(owner);
    if (!userExists) {
      return res.status(400).json({ message: "ID de usuario inválido" });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: "ID de categoría inválido" });
    }

    const subcategoryExists = await Subcategory.findById(subcategory);
    if (!subcategoryExists) {
      return res.status(400).json({ message: "ID de subcategoría inválido" });
    }

    const locationExists = await Location.findById(address);
    if (!locationExists) {
      return res.status(400).json({ message: "ID de dirección inválido" });
    }

    // Handle avatar upload with Cloudinary
    let avatar = { url: null, public_id: null };
    if (req.file) {
      const avatarData = await uploadImage(
        req.file.path,
        "professional_avatars"
      );
      avatar = {
        url: avatarData.url,
        public_id: avatarData.public_id,
      };
      // Delete the temporary file from the server
      fs.unlinkSync(req.file.path);
    }

    // Create new professional account
    const professional = new Professional({
      name,
      email,
      phone_number,
      description,
      owner,
      category,
      subcategory,
      address,
      capitalOwnership,
      companySize,
      legalForm,
      economicSector,
      operationScope,
      socialCapital,
      numberOfEstablishments: Number(numberOfEstablishments),
      numberOfEmployees: Number(numberOfEmployees),
      nif,
      expedientNumber,
      certificateNumber: Number(certificateNumber),
      avatar,
    });

    await professional.save();

    // Populate references for response
    const populatedProfessional = await Professional.findById(professional._id)
      .populate("owner", "userName")
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("address", "street city state country postalCode");

    res.status(201).json({ professional: populatedProfessional });
  } catch (error) {
    console.error("Error al crear la cuenta profesional:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path); // Clean up temporary file on error
    }
    res.status(500).json({ message: "Error del servidor" });
  }
};

// Get professional account by owner ID
export const getProfessionalByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;

    const professional = await Professional.findOne({ owner: ownerId })
      .populate("owner", "userName")
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("address", "street city state country postalCode");

    if (!professional) {
      return res
        .status(404)
        .json({ message: "Cuenta profesional no encontrada" });
    }

    res.status(200).json(professional);
  } catch (error) {
    console.error("Error al obtener la cuenta profesional:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ message: "ID de propietario inválido" });
    }
    res.status(500).json({ message: "Error del servidor" });
  }
};

// Get professional account by ID
export const getProfessionalById = async (req, res) => {
  try {
    const { id } = req.params;

    const professional = await Professional.findById(id)
      .populate("owner", "userName")
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("address", "street city state country postalCode");

    if (!professional) {
      return res
        .status(404)
        .json({ message: "Cuenta profesional no encontrada" });
    }

    res.status(200).json(professional);
  } catch (error) {
    console.error("Error al obtener la cuenta profesional por ID:", error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ message: "ID de cuenta profesional inválido" });
    }
    res.status(500).json({ message: "Error del servidor" });
  }
};

// Update a professional account
export const updateProfessional = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone_number,
      description,
      owner,
      category,
      subcategory,
      address,
      capitalOwnership,
      companySize,
      legalForm,
      economicSector,
      operationScope,
      socialCapital,
      numberOfEstablishments,
      numberOfEmployees,
      nif,
      expedientNumber,
      certificateNumber,
    } = req.body;

    // Find the existing professional account
    const professional = await Professional.findById(id);
    if (!professional) {
      return res
        .status(404)
        .json({ message: "Cuenta profesional no encontrada" });
    }

    // Validate references if provided
    if (owner) {
      const userExists = await User.findById(owner);
      if (!userExists) {
        return res.status(400).json({ message: "ID de usuario inválido" });
      }
    }

    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: "ID de categoría inválido" });
      }
    }

    if (subcategory) {
      const subcategoryExists = await Subcategory.findById(subcategory);
      if (!subcategoryExists) {
        return res.status(400).json({ message: "ID de subcategoría inválido" });
      }
    }

    if (address) {
      const locationExists = await Location.findById(address);
      if (!locationExists) {
        return res.status(400).json({ message: "ID de dirección inválido" });
      }
    }

    // Handle avatar update with Cloudinary
    let avatar = professional.avatar;
    if (req.file) {
      if (professional.avatar.public_id) {
        // Update existing avatar
        const updatedAvatar = await updateImage(
          professional.avatar.public_id,
          req.file.path,
          "professional_avatars"
        );
        avatar = {
          url: updatedAvatar.url,
          public_id: updatedAvatar.public_id,
        };
      } else {
        // Upload new avatar
        const newAvatar = await uploadImage(
          req.file.path,
          "professional_avatars"
        );
        avatar = {
          url: newAvatar.url,
          public_id: newAvatar.public_id,
        };
      }
      // Delete the temporary file from the server
      fs.unlinkSync(req.file.path);
    }

    // Update fields
    professional.name = name || professional.name;
    professional.email = email || professional.email;
    professional.phone_number = phone_number || professional.phone_number;
    professional.description = description || professional.description;
    professional.owner = owner || professional.owner;
    professional.category = category || professional.category;
    professional.subcategory = subcategory || professional.subcategory;
    professional.address = address || professional.address;
    professional.capitalOwnership =
      capitalOwnership || professional.capitalOwnership;
    professional.companySize = companySize || professional.companySize;
    professional.legalForm = legalForm || professional.legalForm;
    professional.economicSector = economicSector || professional.economicSector;
    professional.operationScope = operationScope || professional.operationScope;
    professional.socialCapital = socialCapital || professional.socialCapital;
    professional.numberOfEstablishments = numberOfEstablishments
      ? Number(numberOfEstablishments)
      : professional.numberOfEstablishments;
    professional.numberOfEmployees = numberOfEmployees
      ? Number(numberOfEmployees)
      : professional.numberOfEmployees;
    professional.nif = nif || professional.nif;
    professional.expedientNumber =
      expedientNumber || professional.expedientNumber;
    professional.certificateNumber = certificateNumber
      ? Number(certificateNumber)
      : professional.certificateNumber;
    professional.avatar = avatar;

    await professional.save();

    // Populate references for response
    const populatedProfessional = await Professional.findById(professional._id)
      .populate("owner", "userName")
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("address", "street city state country postalCode");

    res.status(200).json({ professional: populatedProfessional });
  } catch (error) {
    console.error("Error al actualizar la cuenta profesional:", error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path); // Clean up temporary file on error
    }
    res.status(500).json({ message: "Error del servidor" });
  }
};

// Delete a professional account
export const deleteProfessional = async (req, res) => {
  try {
    const { id } = req.params;

    const professional = await Professional.findById(id);
    if (!professional) {
      return res
        .status(404)
        .json({ message: "Cuenta profesional no encontrada" });
    }

    // Delete avatar from Cloudinary if it exists
    if (professional.avatar.public_id) {
      await deleteImage(professional.avatar.public_id);
    }

    // Delete the professional account
    await Professional.findByIdAndDelete(id);

    res
      .status(200)
      .json({ message: "Cuenta profesional eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar la cuenta profesional:", error);
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ message: "ID de cuenta profesional inválido" });
    }
    res.status(500).json({ message: "Error del servidor" });
  }
};
