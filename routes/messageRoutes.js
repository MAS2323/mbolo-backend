import express from "express";
const router = express.Router();
import messageController from "../controllers/messageController.js";

router.post("/send", messageController.sendMessage);
router.get("/:userId1/:userId2", messageController.getMessages);
router.post("/messages", messageController.postMessageStore);
router.get("/messages/:senderId/:recepientId", messageController.fetchMessage);
export default router;
