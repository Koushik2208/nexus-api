export interface Pagination {
  limit: number;
  cursor: number | undefined;
}

export function parsePagination(query: Record<string, unknown>): Pagination | { error: string } {
  const limitParam = Number(query.limit);
  const limit = Number.isNaN(limitParam) ? 20 : Math.min(Math.max(limitParam, 1), 100);

  if (query.cursor === undefined) {
    return { limit, cursor: undefined };
  }

  const cursor = Number(query.cursor);
  if (Number.isNaN(cursor)) {
    return { error: "cursor must be a number" };
  }

  return { limit, cursor };
}
