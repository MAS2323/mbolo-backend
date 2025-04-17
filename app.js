import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import bannerRoutes from "./routes/banner.js";
import productRouter from "./routes/productsRoutes.js";
import userRouter from "./routes/user.js";
import cartRouter from "./routes/cart.js";
import orderRouter from "./routes/orderRoutes.js";
import categoriesRouter from "./routes/categories.js";
import favoritesRoutes from "./routes/favoritesRoutes.js";
import professionalRoutes from "./routes/professionalRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import subcategoriesRouter from "./routes/subCategoryPRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import tiendaRoutes from "./routes/tiendaRoutes.js";
import path from "path";
import adRoutes from "./routes/adRoutes.js";
import { fileURLToPath } from "url";

const app = express();
// Cargar configuraciones desde .env
dotenv.config();

// Conectar a la base de datos
mongoose
  .connect(process.env.MONGO_URL, {
    writeConcern: {
      w: "majority",
    },
  })
  .then(() => console.log("Base de Datos conectada"))
  .catch((err) => console.log(err));

// Configurar body-parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
// Obtener __dirname de manera compatible con ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos desde el directorio de "uploads"
app.use(express.static(path.join(__dirname, "public/uploads")));

// Limitar tamaño de JSON y URL
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Rutas de la aplicación
app.use("/cart", cartRouter);
app.use("/orders", orderRouter);
app.use("/favorites", favoritesRoutes);
app.use("/messages", messageRoutes);
app.use("/orders", orderRoutes);
app.use("/subcategories", subcategoriesRouter);
app.use("/categories", categoriesRouter);
app.use("/banners", bannerRoutes);
app.use("/products", productRouter);
app.use("/", userRouter);
app.use("/menus", menuRoutes);
app.use("/", authRoutes);
app.use("/locations", locationRoutes);
app.use("/tienda", tiendaRoutes);
app.use("/ads", adRoutes);
app.use("/professional", professionalRoutes);
app.use("/cities", cityRoutes);
// Iniciar el servidor
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Node js server started on port ${port}!`);
});
