import City from "../models/City.js";

// Obtener todas las ciudades
export const getCities = async (req, res) => {
  try {
    const cities = await City.find();
    res.json(cities);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las ciudades", error });
  }
};

// Obtener una ciudad por su ID
export const getCityById = async (req, res) => {
  try {
    const { id } = req.params;
    const city = await City.findById(id);

    if (!city) {
      return res.status(404).json({ message: "Ciudad no encontrada" });
    }

    res.json(city);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la ciudad", error });
  }
};

// Agregar una nueva ciudad
export const createCity = async (req, res) => {
  try {
    const { name } = req.body;

    // Verificar si la ciudad ya existe
    const existingCity = await City.findOne({ name });
    if (existingCity) {
      return res.status(400).json({ message: "La ciudad ya existe" });
    }

    const newCity = new City({ name });
    await newCity.save();
    res.status(201).json(newCity);
  } catch (error) {
    res.status(500).json({ message: "Error al agregar la ciudad", error });
  }
};
