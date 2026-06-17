import { Router } from "express";
import * as postController from "./controller.js";
import { requireApiKey } from "../../middleware/apiKey.js";

const router = Router();

router.use(requireApiKey);

router.post("/", postController.create);
router.get("/:id", postController.getById);
router.delete("/:id", postController.remove);

export default router;
