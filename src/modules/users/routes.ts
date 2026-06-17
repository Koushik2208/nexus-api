import { Router } from "express";
import * as userController from "./controller.js";
import { requireApiKey } from "../../middleware/apiKey.js";

const router = Router();

router.use(requireApiKey);

router.post("/", userController.create);
router.get("/", userController.list);
router.get("/:id", userController.getById);
router.get("/:id/posts", userController.posts);
router.get("/:id/stats", userController.stats);
router.get("/:id/followers", userController.followers);
router.get("/:id/following", userController.following);

export default router;
