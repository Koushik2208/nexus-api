import { Router } from "express";
import * as notificationController from "./controller.js";
import { requireApiKey } from "../../middleware/apiKey.js";

const router = Router();

router.use(requireApiKey);

router.get("/", notificationController.list);
router.patch("/:id/read", notificationController.markRead);

export default router;
