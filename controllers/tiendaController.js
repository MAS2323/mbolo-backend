import Tienda from "../models/Tienda.js"; // Importa el modelo Tienda
import User from "../models/User.js"; // Importa el modelo User (opcional, para validaciones)

// Crear una tienda
export const crearTienda = async (req, res) => {
  try {
    const {
      name,
      description,
      logo_url,
      banner_url,
      phone_number,
      address,
      owner,
    } = req.body;

    // Validar que el usuario (owner) exista
    const usuarioExistente = await User.findById(owner);
    if (!usuarioExistente) {
      return res
        .status(404)
        .json({ message: "El usuario propietario no existe." });
    }

    // Crear la tienda
    const nuevaTienda = new Tienda({
      name,
      description,
      logo_url,
      banner_url,
      phone_number,
      address,
      owner,
    });

    // Guardar la tienda en la base de datos
    await nuevaTienda.save();

    // Actualizar el campo `tienda` del usuario
    usuarioExistente.tienda = nuevaTienda._id;
    await usuarioExistente.save();

    res
      .status(201)
      .json({ message: "Tienda creada exitosamente", tienda: nuevaTienda });
  } catch (error) {
    console.error("Error al crear la tienda:", error);
    res.status(500).json({ message: "Hubo un error al crear la tienda." });
  }
};

// Obtener una tienda por su ID
export const obtenerTienda = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar la tienda por ID y poblar los productos y el propietario
    const tienda = await Tienda.findById(id)
      .populate("owner", "userName email") // Poblar datos del propietario
      .populate("products", "title price"); // Poblar datos de los productos

    if (!tienda) {
      return res.status(404).json({ message: "Tienda no encontrada." });
    }

    res.status(200).json(tienda);
  } catch (error) {
    console.error("Error al obtener la tienda:", error);
    res.status(500).json({ message: "Hubo un error al obtener la tienda." });
  }
};

// Actualizar una tienda
export const actualizarTienda = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, logo_url, banner_url, phone_number, address } =
      req.body;

    // Buscar la tienda por ID
    const tienda = await Tienda.findById(id);
    if (!tienda) {
      return res.status(404).json({ message: "Tienda no encontrada." });
    }

    // Actualizar los campos de la tienda
    tienda.name = name || tienda.name;
    tienda.description = description || tienda.description;
    tienda.logo_url = logo_url || tienda.logo_url;
    tienda.banner_url = banner_url || tienda.banner_url;
    tienda.phone_number = phone_number || tienda.phone_number;
    tienda.address = address || tienda.address;

    // Guardar los cambios
    await tienda.save();

    res
      .status(200)
      .json({ message: "Tienda actualizada exitosamente", tienda });
  } catch (error) {
    console.error("Error al actualizar la tienda:", error);
    res.status(500).json({ message: "Hubo un error al actualizar la tienda." });
  }
};

// Eliminar una tienda
export const eliminarTienda = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar la tienda por ID
    const tienda = await Tienda.findById(id);
    if (!tienda) {
      return res.status(404).json({ message: "Tienda no encontrada." });
    }

    // Eliminar la tienda
    await Tienda.findByIdAndDelete(id);

    // Opcional: Eliminar la referencia de la tienda en el usuario propietario
    await User.findByIdAndUpdate(tienda.owner, { $unset: { tienda: "" } });

    res.status(200).json({ message: "Tienda eliminada exitosamente." });
  } catch (error) {
    console.error("Error al eliminar la tienda:", error);
    res.status(500).json({ message: "Hubo un error al eliminar la tienda." });
  }
};

export const obtenerTiendaPorUsuario = async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar la tienda asociada al ID del usuario
    const tienda = await Tienda.findOne({ owner: userId })
      .populate("owner", "userName email") // Poblar datos del propietario
      .populate("products", "title price"); // Poblar datos de los productos

    if (!tienda) {
      return res.status(404).json({
        message: "Tienda no encontrada para el usuario proporcionado.",
      });
    }

    res.status(200).json(tienda);
  } catch (error) {
    console.error("Error al obtener la tienda por ID de usuario:", error);
    res.status(500).json({
      message: "Hubo un error al obtener la tienda por ID de usuario.",
    });
  }
};
