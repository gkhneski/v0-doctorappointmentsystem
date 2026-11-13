// Testler için bellek içi, çok küçük bir Supabase taklidi.
// Yalnızca lib/ işlevlerinin kullandığı zincirleri destekler.
type Row = Record<string, any>

export function createFakeSupabase(
  tables: Record<string, Row[]>,
  // true: genel hata; nesne: o hata (ör. { code: "23505" } tekillik çakışması).
  failOn: (table: string, op: string) => boolean | Record<string, unknown> = () => false,
) {
  let seq = 0

  function from(table: string) {
    let op: "select" | "insert" | "update" | "delete" = "select"
    let payload: any
    const filters: ((r: Row) => boolean)[] = []
    let orderKey: string | undefined
    let ascending = true
    let max: number | undefined

    const run = (): { data: any; error: any } => {
      const failure = failOn(table, op)
      if (failure) return { data: null, error: typeof failure === "object" ? failure : { message: "simulated failure" } }
      const rows = (tables[table] ??= [])
      if (op === "insert") {
        const items = (Array.isArray(payload) ? payload : [payload]).map((p) => ({
          id: `new-${++seq}`,
          created_at: new Date().toISOString(),
          ...p,
        }))
        rows.push(...items)
        return { data: items, error: null }
      }
      let matched = rows.filter((r) => filters.every((f) => f(r)))
      if (op === "update") {
        matched.forEach((r) => Object.assign(r, payload))
        return { data: matched, error: null }
      }
      if (op === "delete") {
        tables[table] = rows.filter((r) => !matched.includes(r))
        return { data: matched, error: null }
      }
      if (orderKey) {
        const k = orderKey
        matched = [...matched].sort((a, b) => (a[k] < b[k] ? -1 : a[k] > b[k] ? 1 : 0) * (ascending ? 1 : -1))
      }
      if (max !== undefined) matched = matched.slice(0, max)
      return { data: matched, error: null }
    }

    const api: any = {
      select: () => api,
      insert: (p: any) => ((op = "insert"), (payload = p), api),
      update: (p: any) => ((op = "update"), (payload = p), api),
      delete: () => ((op = "delete"), api),
      eq: (k: string, v: any) => (filters.push((r) => r[k] === v), api),
      is: (k: string, v: any) => (filters.push((r) => (r[k] ?? null) === v), api),
      in: (k: string, vs: any[]) => (filters.push((r) => vs.includes(r[k])), api),
      lt: (k: string, v: any) => (filters.push((r) => r[k] < v), api),
      gte: (k: string, v: any) => (filters.push((r) => r[k] >= v), api),
      lte: (k: string, v: any) => (filters.push((r) => r[k] <= v), api),
      neq: (k: string, v: any) => (filters.push((r) => r[k] !== v), api),
      order: (k: string, o?: { ascending?: boolean }) => ((orderKey = k), (ascending = o?.ascending ?? true), api),
      limit: (n: number) => ((max = n), api),
      single: async () => {
        const r = run()
        if (r.error) return r
        return r.data.length ? { data: r.data[0], error: null } : { data: null, error: { message: "no rows" } }
      },
      maybeSingle: async () => {
        const r = run()
        return r.error ? r : { data: r.data[0] ?? null, error: null }
      },
      then: (resolve: any, reject: any) => Promise.resolve(run()).then(resolve, reject),
    }
    return api
  }

  return {
    from,
    get tables() {
      return tables
    },
  } as any
}
