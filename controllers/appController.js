import App from "../models/App.js";

// Datos iniciales para poblar la base de datos

// // Poblar la base de datos con datos iniciales (solo se ejecuta si la colección está vacía)
// export const populateApps = async () => {
//   try {
//     const count = await App.countDocuments();
//     if (count === 0) {
//       await App.insertMany(initialApps);
//       console.log("Base de datos poblada con datos iniciales");
//     }
//   } catch (error) {
//     console.error("Error al poblar la base de datos:", error);
//   }
// };

// Controlador para crear una nueva app
export const createApp = async (req, res) => {
  try {
    const { name, icon, url, logo, category, webViewData } = req.body;

    // Validar los campos requeridos
    if (!name || !icon || !url || !logo || !category) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }

    // Crear la nueva app
    const newApp = new App({
      name,
      icon,
      url,
      logo,
      category,
      webViewData: webViewData || {},
    });

    // Guardar en la base de datos
    await newApp.save();

    res.status(201).json({ message: "App creada con éxito", app: newApp });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al crear la app", error: error.message });
  }
};

// Controlador para obtener apps por categoría
export const getAppsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const apps = await App.find({ category });
    if (!apps || apps.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron apps para esta categoría" });
    }
    res.status(200).json(apps);
  } catch (error) {
    console.error("Error al obtener las apps:", error.message);
    res
      .status(500)
      .json({ message: "Error al obtener las apps", error: error.message });
  }
};

// Controlador para eliminar una app por ID
export const deleteApp = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await App.findByIdAndDelete(id);

    if (!app) {
      return res.status(404).json({ message: "App no encontrada" });
    }

    res.status(200).json({ message: "App eliminada con éxito" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al eliminar la app", error: error.message });
  }
};

// Controlador para actualizar una app por ID
export const updateApp = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, url, logo, category, webViewData } = req.body;

    const updatedApp = await App.findByIdAndUpdate(
      id,
      { name, icon, url, logo, category, webViewData },
      { new: true, runValidators: true }
    );

    if (!updatedApp) {
      return res.status(404).json({ message: "App no encontrada" });
    }

    res
      .status(200)
      .json({ message: "App actualizada con éxito", app: updatedApp });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al actualizar la app", error: error.message });
  }
};

// Controlador para inicializar la base de datos (opcional, para pruebas)
export const initializeDatabase = async (req, res) => {
  try {
    await App.deleteMany(); // Limpiar la colección
    await App.insertMany(initialApps);
    res.status(200).json({ message: "Base de datos inicializada con éxito" });
  } catch (error) {
    res.status(500).json({
      message: "Error al inicializar la base de datos",
      error: error.message,
    });
  }
};
