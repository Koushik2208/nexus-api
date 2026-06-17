import { Router } from "express";
import * as likeController from "./controller.js";
import { requireApiKey } from "../../middleware/apiKey.js";

const router = Router({ mergeParams: true });

router.use(requireApiKey);

router.post("/", likeController.like);
router.delete("/", likeController.unlike);

export default router;
