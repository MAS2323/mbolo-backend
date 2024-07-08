const router = require("express").Router();
const cartController = require('../controllers/cartControllers');

router.get('/find/:id', cartController.getCart);
router.post("/add/:userId/:productId", cartController.addToCart);
router.post("/quantity", cartController.decrementCartItem);

router.delete("/:userId/:productId", cartController.deleteCartItem);



module.exports = router;