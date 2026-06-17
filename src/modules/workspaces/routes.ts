import { Router } from "express";
import * as workspaceController from "./controller.js";
import { requireApiKey } from "../../middleware/apiKey.js";

const router = Router();

router.post("/", workspaceController.create);
router.use(requireApiKey);
router.get("/", workspaceController.list);
router.get("/:id", workspaceController.getById);
router.post("/:id/reset", workspaceController.reset);

export default router;
