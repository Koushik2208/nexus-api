import { Router } from "express";
import * as followController from "./controller.js";
import { requireApiKey } from "../../middleware/apiKey.js";

const router = Router({ mergeParams: true });

router.use(requireApiKey);

router.post("/", followController.follow);
router.delete("/", followController.unfollow);

export default router;
