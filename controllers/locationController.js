import Location from "../models/Location.js";
import City from "../models/City.js";

// Obtener todas las ubicaciones
export const getLocations = async (req, res) => {
  try {
    const locations = await Location.find().populate("ciudad", "name");
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener ubicaciones", error });
  }
};

// Crear una nueva ubicación
export const createLocation = async (req, res) => {
  try {
    const { name, direccion, ciudad } = req.body;

    // Verificar si la ciudad existe en la base de datos
    const cityExists = await City.findById(ciudad);
    if (!cityExists) {
      return res
        .status(400)
        .json({ message: "La ciudad seleccionada no existe" });
    }

    const newLocation = new Location({ name, direccion, ciudad });
    await newLocation.save();
    res.status(201).json(newLocation);
  } catch (error) {
    res.status(500).json({ message: "Error al crear la ubicación", error });
  }
};

export const getCities = async (req, res) => {
  try {
    const cities = await City.find(); // Obtiene todas las ciudades
    res.status(200).json(cities);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las ciudades", error });
  }
};
