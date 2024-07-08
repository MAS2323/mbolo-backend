const express = require("express");
const router = express.Router();
const subcategoriesController = require("../controllers/subcategoriesController");

router.get(
  "/category/:categoryId",
  subcategoriesController.getSubcategoriesByCategory
);
router.post("/category/:categoryId", subcategoriesController.createSubcategory);
router.get("/:subcategoryId", subcategoriesController.getSubcategoryById);
router.put("/:subcategoryId", subcategoriesController.updateSubcategoryById);
router.delete("/:subcategoryId", subcategoriesController.deleteSubcategoryById);
router.get("/", subcategoriesController.getAllSubcategories);
router.get("/search/:key", subcategoriesController.searchSubcategories);
module.exports = router;


//---------------------------------------------------------------------

// const express = require("express");
// const router = express.Router();
// const subcategoriesController = require("../controllers/subcategoriesController");
// const { upload } = subcategoriesController;

// router.get(
//   "/category/:categoryId/subcategories",
//   subcategoriesController.getSubcategoriesByCategory
// );

// router.post(
//   "/category/:categoryId",
//   upload.single("pdf"), // Captura el archivo PDF enviado como 'pdf'
//   subcategoriesController.createSubcategory
// );

// router.get(
//   "/subcategory/:subcategoryId",
//   subcategoriesController.getSubcategoryById
// );

// router.get("/subcategories", subcategoriesController.getAllSubcategories);

// router.put(
//   "/subcategory/:subcategoryId",
//   subcategoriesController.updateSubcategoryById
// );

// router.delete(
//   "/subcategory/:subcategoryId",
//   subcategoriesController.deleteSubcategoryById
// );

// router.get("/search/:key", subcategoriesController.searchSubcategories);

// module.exports = router;
