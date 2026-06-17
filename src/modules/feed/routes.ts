import { Router } from "express";
import * as feedController from "./controller.js";
import { requireApiKey } from "../../middleware/apiKey.js";

const router = Router();

router.use(requireApiKey);

router.get("/", feedController.list);

export default router;
