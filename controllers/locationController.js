import Location from "../models/Location.js";

// Obtener todas las ubicaciones con distinción entre City y Province
export const getLocations = async (req, res) => {
  try {
    const { type } = req.query; // Capturar el parámetro de consulta 'type' (opcional)

    let filter = {};
    if (type) {
      filter.type = type; // Filtrar por tipo si se proporciona
    }

    const locations = await Location.find(filter).populate("parentId", "name");
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener ubicaciones", error });
  }
};

// Obtener todas las provincias
export const getProvinces = async (req, res) => {
  try {
    const provinces = await Location.find({ type: "Province" });
    res.status(200).json(provinces);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener provincias", error });
  }
};

// Obtener todas las ciudades
export const getCities = async (req, res) => {
  try {
    const cities = await Location.find({ type: "City" });
    res.status(200).json(cities);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las ciudades", error });
  }
};

// Obtener todas las ciudades de una provincia específica
export const getCitiesByProvince = async (req, res) => {
  try {
    const { provinceId } = req.params;

    // Buscar todas las ciudades que pertenezcan a la provincia
    const cities = await Location.find({ type: "City", parentId: provinceId });
    res.status(200).json(cities);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las ciudades", error });
  }
};

// Crear una nueva ubicación (Provincia o Ciudad)
export const createLocation = async (req, res) => {
  try {
    const { name, type, parentId } = req.body;

    // Validar que el tipo sea correcto
    if (!["City", "Province"].includes(type)) {
      return res
        .status(400)
        .json({ message: "El tipo debe ser City o Province" });
    }

    // Si es una ciudad, verificar que la provincia (parentId) exista
    if (type === "City" && parentId) {
      const provinceExists = await Location.findById(parentId);
      if (!provinceExists) {
        return res
          .status(400)
          .json({ message: "La provincia seleccionada no existe" });
      }
    }

    const newLocation = new Location({
      name,
      type,
      parentId: parentId || null,
    });
    await newLocation.save();

    res.status(201).json(newLocation);
  } catch (error) {
    res.status(500).json({ message: "Error al crear la ubicación", error });
  }
};
