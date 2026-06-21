import type { Request, Response } from "express";
import * as XLSX from "xlsx";
import { ValidationError, ForbiddenError } from "../../errors.js";
import { importUsers, importPosts, importComments, importLikes, importFollows } from "./service.js";

const VALID_TYPES = ["users", "posts", "comments", "likes", "follows"] as const;
type ImportType = (typeof VALID_TYPES)[number];

const importFns = { users: importUsers, posts: importPosts, comments: importComments, likes: importLikes, follows: importFollows };

export async function importData(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new ValidationError("id must be a number");
  if (id !== req.workspace_id) throw new ForbiddenError("cannot import into another workspace");

  const type = req.query.type as string;
  if (!VALID_TYPES.includes(type as ImportType)) {
    throw new ValidationError(`type must be one of: ${VALID_TYPES.join(", ")}`);
  }

  if (!req.file) throw new ValidationError("no file uploaded");

  const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new ValidationError("file has no sheets");
  const sheet = workbook.Sheets[sheetName]!;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  if (rows.length === 0) throw new ValidationError("file is empty or has no data rows");

  const result = await importFns[type as ImportType](rows, req.workspace_id!);
  res.status(200).json(result);
}
