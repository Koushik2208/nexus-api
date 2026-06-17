import { Router } from "express";
import * as commentController from "./controller.js";
import { requireApiKey } from "../../middleware/apiKey.js";

const router = Router({ mergeParams: true });

router.use(requireApiKey);

router.post("/", commentController.create);
router.get("/", commentController.list);

export default router;
