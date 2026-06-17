import { Router } from "express";
import * as searchController from "./controller.js";
import { requireApiKey } from "../../middleware/apiKey.js";

const router = Router();

router.use(requireApiKey);

router.get("/", searchController.search);

export default router;
