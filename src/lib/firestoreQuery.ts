import {
  collection,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  where,
  type Query,
  type QueryConstraint,
} from 'firebase/firestore';

/**
 * Firestore requires a composite index for `where` + `orderBy` on different
 * fields. On a fresh project those indexes may not be deployed yet, which
 * surfaces as `failed-precondition`.
 *
 * This helper runs the ordered query first (efficient once indexes exist) and
 * transparently falls back to an unordered query with an in-memory sort. The
 * fallback is bounded by `max`, so it never downloads an unbounded collection.
 */
export async function queryWithSortFallback<T>(
  buildQuery: (constraints: QueryConstraint[]) => Query,
  sortField: string,
  direction: 'asc' | 'desc',
  max: number,
  mapDoc: (id: string, data: Record<string, unknown>) => T,
): Promise<T[]> {
  const ordered = buildQuery([orderBy(sortField, direction), fsLimit(max)]);

  try {
    const snapshot = await getDocs(ordered);
    return snapshot.docs.map((entry) => mapDoc(entry.id, entry.data() as Record<string, unknown>));
  } catch (err) {
    const code = (err as { code?: string })?.code ?? '';
    if (code !== 'failed-precondition') throw err;

    // Index not deployed yet — fetch bounded, unordered, then sort locally.
    console.warn(
      `[firestore] Missing composite index for ${sortField}; falling back to client-side sort. ` +
        'Deploy firestore.indexes.json to remove this fallback.',
    );
    const fallback = buildQuery([fsLimit(max)]);
    const snapshot = await getDocs(fallback);
    const rows = snapshot.docs.map((entry) => mapDoc(entry.id, entry.data() as Record<string, unknown>));

    return rows.sort((a, b) => {
      const av = readSortValue(a, sortField);
      const bv = readSortValue(b, sortField);
      if (av === bv) return 0;
      const result = av < bv ? -1 : 1;
      return direction === 'asc' ? result : -result;
    });
  }
}

function readSortValue(row: unknown, field: string): number | string {
  const record = row as Record<string, unknown>;
  const raw = record[field];

  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') {
    const seconds = (raw as { seconds?: number }).seconds;
    if (typeof seconds === 'number') return seconds;
  }
  return 0;
}

export { collection, where, query, fsLimit as limit };
