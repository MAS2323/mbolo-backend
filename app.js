const express = require("express");
const app = express();
const mongoose = require("mongoose");
const passport = require("passport");
const localStrategy = require('passport-local').Strategy;

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const bannerRoutes = require("./routes/banner");
const bodyParser = require("body-parser");
const productRouter = require("./routes/products.routes");
const userRouter = require("./routes/user");
const cartRouter = require("./routes/cart");
const orderRouter = require("./routes/orderRoutes");
const categoriesRouter = require("./routes/categories");
const favoritesRoutes = require("./routes/favoritesRoutes");
const messageRoutes = require("./routes/messageRoutes");
const orderRoutes = require("./routes/orderRoutes");
const subcategoriesRouter = require("./routes/subcategories");
// const authenticateToken = require("./middleware/auth");
const dotenv = require("dotenv");


const port = 3000;
const cors = require('cors');
app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(passport.initialize());
dotenv.config();



mongoose
  .connect(process.env.MONGO_URL, {
    writeConcern: {
      w: "majority",
    },
  })
  .then(() => console.log("Base de Datos conectada"))
  .catch((err) => console.log(err));

// app.get('/', (req, res) => res.send('Furniture Word'))

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));



app.use("/cart", cartRouter);
app.use("/orders", orderRouter);

app.use("/favorites", favoritesRoutes);
app.use("/messages", messageRoutes);
app.use("/orders", orderRoutes);
app.use("/subcategories", subcategoriesRouter);
app.use("/categories", categoriesRouter);


//Banner
app.use("/banners", bannerRoutes);


// Middlewares
app.use(express.json()); 
app.use("/products", productRouter);
app.use("/uploads", express.static("uploads"));
app.use("/", userRouter);

app.listen(process.env.PORT || port, () => {
  console.log(`Node js server started. ${process.env.PORT || port}!`);
});
