import { Router } from "express";
import multer from "multer";
import * as workspaceController from "./controller.js";
import { importData } from "../import/controller.js";
import { requireApiKey } from "../../middleware/apiKey.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.post("/", workspaceController.create);
router.use(requireApiKey);
router.get("/", workspaceController.list);
router.get("/:id", workspaceController.getById);
router.post("/:id/reset", workspaceController.reset);
router.post("/:id/import", upload.single("file"), importData);

export default router;
