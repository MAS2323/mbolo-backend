const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

router.post("/send", messageController.sendMessage);
router.get("/:userId1/:userId2", messageController.getMessages);
router.post("/messages", messageController.postMessageStore);
router.get("/messages/:senderId/:recepientId", messageController.fetchMessage)
module.exports = router;
