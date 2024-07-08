const router = require("express").Router();
const orderController = require("../controllers/orderController");

router.post("/", orderController.createOrder);
router.get("/:id", orderController.getUserOrders);
router.get("/order/:orderId", orderController.getOrderById);

module.exports = router;
