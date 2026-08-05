export type TableName = "users" | "orders";

export const PAGE_CAP = 2;
export const PAGE_SIZE = 8192;
export const FRAME_COUNT = 4;
export const DISK_SLOTS = 4;
/** BusTub TablePage header: next_page_id(4) + num_tuples(2) + num_deleted(2). */
export const HEADER_BYTES = 8;
/** BusTub TupleInfo is 24 bytes (offset, size, TupleMeta). */
export const SLOT_INFO_BYTES = 24;
/** Simplified tuple payload size for the page map. */
export const TUPLE_BYTES = 48;

export const SCHEMAS: Record<TableName, string> = {
  users: "id INT, name VARCHAR",
  orders: "oid INT, uid INT",
};

export const USER_ROWS = [
  { label: "(1,'ada')", hex: "01 00 00 00  03 61 64 61", name: "ada" },
  { label: "(2,'bob')", hex: "02 00 00 00  03 62 6f 62", name: "bob" },
  { label: "(3,'cam')", hex: "03 00 00 00  03 63 61 6d", name: "cam" },
  { label: "(4,'dan')", hex: "04 00 00 00  03 64 61 6e", name: "dan" },
  { label: "(5,'eve')", hex: "05 00 00 00  03 65 76 65", name: "eve" },
] as const;

export const ORDER_ROWS = [
  { label: "(10,1)", hex: "0a 00 00 00  01 00 00 00", name: "o10" },
  { label: "(11,2)", hex: "0b 00 00 00  02 00 00 00", name: "o11" },
  { label: "(12,1)", hex: "0c 00 00 00  01 00 00 00", name: "o12" },
  { label: "(13,2)", hex: "0d 00 00 00  02 00 00 00", name: "o13" },
] as const;

export type Rid = { pageId: number; slot: number };

export type Tuple = {
  label: string;
  hex: string;
  name: string;
  slot: number;
  offset: number;
  size: number;
};

export type HeapPage = {
  pageId: number;
  table: TableName;
  nextPageId: number | null;
  tuples: Tuple[];
};

export type CatalogRow = {
  name: TableName;
  oid: number;
  firstPageId: number;
  lastPageId: number;
  schema: string;
};

export type Frame = {
  frameId: number;
  pageId: number | null;
  pinned: boolean;
  dirty: boolean;
};

export type DiskExtent = {
  pageId: number;
  offset: number;
};

export type SchedulerReq = {
  kind: "read" | "write";
  pageId: number;
  status: "queued" | "io" | "done";
};

export type Engine = {
  nextOid: number;
  nextPageId: number;
  catalog: CatalogRow[];
  heaps: Record<number, HeapPage>;
  extents: DiskExtent[];
  frames: Frame[];
  usersInserted: number;
  ordersInserted: number;
  orphaned: boolean;
  lastRid: Rid | null;
};

export type Beat =
  | "idle"
  | "sql"
  | "catalog"
  | "allocate"
  | "scheduler"
  | "disk"
  | "bpm"
  | "done"
  | "error";

export type Command =
  | { kind: "create"; table: TableName }
  | { kind: "insert"; table: TableName }
  | { kind: "select"; table: TableName }
  | { kind: "restart" };

export type AnimStep = {
  beat: Beat;
  sql: string;
  note: string;
  packet: string;
  highlightTable?: TableName | null;
  highlightPageId?: number | null;
  scheduler: SchedulerReq[];
  engine: Engine;
  error?: string;
  rid?: Rid | null;
  cacheHit?: boolean;
  scanNames?: string[];
};

export function emptyEngine(): Engine {
  return {
    nextOid: 0,
    nextPageId: 0,
    catalog: [],
    heaps: {},
    extents: [],
    frames: Array.from({ length: FRAME_COUNT }, (_, i) => ({
      frameId: i,
      pageId: null,
      pinned: false,
      dirty: false,
    })),
    usersInserted: 0,
    ordersInserted: 0,
    orphaned: false,
    lastRid: null,
  };
}

export function formatRid(rid: Rid | null | undefined): string {
  if (!rid) return "—";
  return `(${rid.pageId}, ${rid.slot})`;
}

export function pageLayout(page: HeapPage) {
  const n = page.tuples.length;
  const lower = HEADER_BYTES + n * SLOT_INFO_BYTES;
  const upper = PAGE_SIZE - n * TUPLE_BYTES;
  return {
    header: HEADER_BYTES,
    lower,
    upper,
    free: Math.max(0, upper - lower),
    slots: n * SLOT_INFO_BYTES,
    tuples: n * TUPLE_BYTES,
  };
}

export function fileBytes(engine: Engine): number {
  return engine.extents.length * PAGE_SIZE;
}

export function cloneEngine(engine: Engine): Engine {
  return structuredClone(engine);
}

function le32(n: number): string {
  const u = n >>> 0;
  return [u, u >>> 8, u >>> 16, u >>> 24]
    .map((b) => (b & 0xff).toString(16).padStart(2, "0"))
    .join(" ");
}

function le16(n: number): string {
  const u = n & 0xffff;
  return [u & 0xff, (u >>> 8) & 0xff]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

export function pageHeaderHex(page: HeapPage): string {
  const next = page.nextPageId == null ? "ff ff ff ff" : le32(page.nextPageId);
  return `${next}  ${le16(page.tuples.length)} ${le16(0)}`;
}

export function pageHexLines(page: HeapPage | undefined): string[] {
  if (!page) {
    return ["00 00 00 00  00 00 00 00  00 00 00 00  00 00 00 00"];
  }
  return [pageHeaderHex(page), ...page.tuples.map((t) => t.hex)];
}

function unpinAll(engine: Engine) {
  for (const f of engine.frames) f.pinned = false;
}

function placeInFrame(engine: Engine, pageId: number, dirty: boolean, pin: boolean) {
  unpinAll(engine);
  const existing = engine.frames.find((f) => f.pageId === pageId);
  if (existing) {
    existing.dirty = existing.dirty || dirty;
    existing.pinned = pin;
    return existing.frameId;
  }
  const empty = engine.frames.find((f) => f.pageId == null);
  const frame = empty ?? engine.frames[0]!;
  frame.pageId = pageId;
  frame.dirty = dirty;
  frame.pinned = pin;
  return frame.frameId;
}

function getTable(engine: Engine, name: TableName): CatalogRow | undefined {
  return engine.catalog.find((r) => r.name === name);
}

function allocatePage(engine: Engine, table: TableName): HeapPage {
  const pageId = engine.nextPageId++;
  const offset = engine.extents.length * PAGE_SIZE;
  const page: HeapPage = {
    pageId,
    table,
    nextPageId: null,
    tuples: [],
  };
  engine.heaps[pageId] = page;
  engine.extents.push({ pageId, offset });
  return page;
}

function attachSlot(
  base: { label: string; hex: string; name: string },
  slot: number,
): Tuple {
  return {
    ...base,
    slot,
    offset: PAGE_SIZE - (slot + 1) * TUPLE_BYTES,
    size: TUPLE_BYTES,
  };
}

function nextUserTuple(engine: Engine, slot: number): Tuple | null {
  const row = USER_ROWS[engine.usersInserted];
  if (!row) return null;
  return attachSlot(row, slot);
}

function nextOrderTuple(engine: Engine, slot: number): Tuple | null {
  const row = ORDER_ROWS[engine.ordersInserted];
  if (!row) return null;
  return attachSlot(row, slot);
}

function isCached(engine: Engine, pageId: number): boolean {
  return engine.frames.some((f) => f.pageId === pageId);
}

function chainPages(engine: Engine, firstPageId: number): number[] {
  const out: number[] = [];
  const seen = new Set<number>();
  let pid: number | null = firstPageId;
  while (pid != null && !seen.has(pid) && engine.heaps[pid]) {
    seen.add(pid);
    out.push(pid);
    pid = engine.heaps[pid]!.nextPageId;
  }
  return out;
}

export function runCommand(start: Engine, cmd: Command): AnimStep[] {
  if (cmd.kind === "restart") {
    const after = cloneEngine(start);
    after.catalog = [];
    after.frames = emptyEngine().frames;
    after.nextOid = 0;
    after.nextPageId = 0;
    after.usersInserted = 0;
    after.ordersInserted = 0;
    after.lastRid = null;
    after.orphaned = after.extents.length > 0;
    return [
      {
        beat: "sql",
        sql: "-- process restart --",
        note: "Process dies. RAM is wiped. The file on disk is untouched.",
        packet: "kill → catalog / pages_ / BPM gone",
        scheduler: [],
        engine: cloneEngine(start),
        highlightTable: null,
        highlightPageId: null,
      },
      {
        beat: "catalog",
        sql: "-- process restart --",
        note: "Catalog was only in RAM. Names like users / orders are forgotten.",
        packet: "table_names_.clear()",
        scheduler: [],
        engine: after,
        highlightTable: null,
        highlightPageId: null,
      },
      {
        beat: "disk",
        sql: "-- process restart --",
        note: "datadb.db still holds 8 KB slots. Without the catalog, they are orphan bytes.",
        packet: "file bytes remain · pages_ map lost",
        scheduler: [],
        engine: after,
        highlightTable: null,
        highlightPageId: null,
      },
      {
        beat: "done",
        sql: "-- process restart --",
        note: "Postgres survives this: pg_class + relfilenode live under PGDATA. BusTub’s catalog is homework-simple RAM.",
        packet: "SELECT users would fail — name unknown",
        scheduler: [],
        engine: after,
      },
    ];
  }

  if (cmd.kind === "create") {
    const table = cmd.table;
    if (getTable(start, table)) {
      return [
        {
          beat: "error",
          sql: `CREATE TABLE ${table} (...);`,
          note: `${table} is already in the catalog.`,
          packet: "no-op",
          scheduler: [],
          engine: cloneEngine(start),
          error: "already exists",
          highlightTable: table,
        },
      ];
    }

    const sql =
      table === "users"
        ? "CREATE TABLE users (id INT, name VARCHAR);"
        : "CREATE TABLE orders (oid INT, uid INT);";

    const e0 = cloneEngine(start);
    if (e0.orphaned) {
      e0.heaps = {};
      e0.extents = [];
      e0.orphaned = false;
      e0.nextPageId = 0;
    }

    const eCatalog = cloneEngine(e0);
    const oid = eCatalog.nextOid++;
    eCatalog.catalog.push({
      name: table,
      oid,
      firstPageId: -1,
      lastPageId: -1,
      schema: SCHEMAS[table],
    });

    const eAlloc = cloneEngine(eCatalog);
    const page = allocatePage(eAlloc, table);
    const row = getTable(eAlloc, table)!;
    row.firstPageId = page.pageId;
    row.lastPageId = page.pageId;

    const eSched = cloneEngine(eAlloc);
    const eDisk = cloneEngine(eSched);
    const eBpm = cloneEngine(eDisk);
    placeInFrame(eBpm, page.pageId, true, true);
    const createdOffset = eAlloc.extents.find((x) => x.pageId === page.pageId)?.offset ?? 0;

    return [
      {
        beat: "sql",
        sql,
        note: `Parser / binder / planner accept CREATE ${table}. Executor asks the catalog to register a new heap.`,
        packet: `CREATE ${table}`,
        scheduler: [],
        engine: e0,
        highlightTable: table,
      },
      {
        beat: "catalog",
        sql,
        note: `Catalog row appears in RAM: name → oid ${oid}. first_page_id is not known yet.`,
        packet: `table_names_["${table}"] = oid ${oid}`,
        scheduler: [],
        engine: eCatalog,
        highlightTable: table,
      },
      {
        beat: "allocate",
        sql,
        note: `TableHeap constructor calls bpm.NewPage(). DiskManager hands out page_id ${page.pageId}.`,
        packet: `NewPage() → P${page.pageId}`,
        scheduler: [],
        engine: eAlloc,
        highlightTable: table,
        highlightPageId: page.pageId,
      },
      {
        beat: "scheduler",
        sql,
        note: "Empty TablePage (8 KB of header + free space) is scheduled as a WRITE.",
        packet: `Schedule(WRITE P${page.pageId})`,
        scheduler: [{ kind: "write", pageId: page.pageId, status: "io" }],
        engine: eSched,
        highlightTable: table,
        highlightPageId: page.pageId,
      },
      {
        beat: "disk",
        sql,
        note: `DiskManager maps P${page.pageId} → offset ${createdOffset} in datadb.db and writes 8192 bytes.`,
        packet: `pages_[${page.pageId}] = ${createdOffset} · write 8 KB`,
        scheduler: [{ kind: "write", pageId: page.pageId, status: "done" }],
        engine: eDisk,
        highlightTable: table,
        highlightPageId: page.pageId,
      },
      {
        beat: "bpm",
        sql,
        note: `Frame keeps P${page.pageId} pinned + dirty. Catalog stores first_page_id = ${page.pageId}.`,
        packet: `catalog[${table}].first_page_id = ${page.pageId}`,
        scheduler: [],
        engine: eBpm,
        highlightTable: table,
        highlightPageId: page.pageId,
      },
      {
        beat: "done",
        sql,
        note: `${table} is ready. Later INSERT / SELECT will look up this name — they will not scan the file for the word “${table}”.`,
        packet: "CREATE complete",
        scheduler: [],
        engine: eBpm,
        highlightTable: table,
        highlightPageId: page.pageId,
      },
    ];
  }

  if (cmd.kind === "select") {
    const table = cmd.table;
    const sql = `SELECT * FROM ${table};`;
    const startRow = getTable(start, table);
    if (!startRow || startRow.firstPageId < 0) {
      return [
        {
          beat: "error",
          sql,
          note: `GetTable("${table}") failed. Without a catalog row there is no first_page_id to start the scan.`,
          packet: `GetTable("${table}") → nullptr`,
          scheduler: [],
          engine: cloneEngine(start),
          error: "missing table",
          highlightTable: table,
        },
      ];
    }

    const steps: AnimStep[] = [
      {
        beat: "sql",
        sql,
        note: "SeqScan does not open datadb.db by table name. It asks the catalog where the heap starts.",
        packet: sql,
        scheduler: [],
        engine: cloneEngine(start),
        highlightTable: table,
      },
    ];

    const eCat = cloneEngine(start);
    steps.push({
      beat: "catalog",
      sql,
      note: `catalog.GetTable("${table}") → first_page_id = P${startRow.firstPageId}. Iterator starts at RID (${startRow.firstPageId}, 0).`,
      packet: `first_page_id = ${startRow.firstPageId}`,
      scheduler: [],
      engine: eCat,
      highlightTable: table,
      highlightPageId: startRow.firstPageId,
    });

    let working = cloneEngine(eCat);
    const pages = chainPages(working, startRow.firstPageId);
    const scanNames: string[] = [];

    for (const pid of pages) {
      const hit = isCached(working, pid);
      if (!hit) {
        const eSched = cloneEngine(working);
        steps.push({
          beat: "scheduler",
          sql,
          note: `P${pid} is not in BPM. DiskScheduler enqueues READ P${pid} (FIFO).`,
          packet: `Schedule(READ P${pid})`,
          scheduler: [{ kind: "read", pageId: pid, status: "io" }],
          engine: eSched,
          highlightTable: table,
          highlightPageId: pid,
          cacheHit: false,
        });
        const eDisk = cloneEngine(eSched);
        const off = eDisk.extents.find((x) => x.pageId === pid)?.offset ?? 0;
        steps.push({
          beat: "disk",
          sql,
          note: `DiskManager seeks to offset ${off} and copies 8192 bytes into a frame.`,
          packet: `dm.ReadPage(${pid}) @ ${off}`,
          scheduler: [{ kind: "read", pageId: pid, status: "done" }],
          engine: eDisk,
          highlightTable: table,
          highlightPageId: pid,
          cacheHit: false,
        });
        working = eDisk;
      }
      const eBpm = cloneEngine(working);
      placeInFrame(eBpm, pid, false, true);
      const page = eBpm.heaps[pid]!;
      scanNames.push(...page.tuples.map((t) => t.name));
      steps.push({
        beat: "bpm",
        sql,
        note: hit
          ? `HIT — P${pid} already attached. SeqScan reads slots without disk I/O.`
          : `P${pid} installed. SeqScan walks the slot directory and yields tuples.`,
        packet: hit
          ? `HIT P${pid} · ${page.tuples.map((t) => formatRid({ pageId: pid, slot: t.slot })).join(" ")}`
          : `load P${pid} · slots ${page.tuples.map((t) => t.slot).join(",")}`,
        scheduler: [],
        engine: eBpm,
        highlightTable: table,
        highlightPageId: pid,
        cacheHit: hit,
        scanNames: [...scanNames],
      });
      working = eBpm;
    }

    steps.push({
      beat: "done",
      sql,
      note:
        scanNames.length === 0
          ? `${table} scan returned 0 rows. Empty heap page still exists.`
          : `Scan result: ${scanNames.join(", ")}. Follow next_page_id until INVALID.`,
      packet: scanNames.length ? `rows: ${scanNames.join(", ")}` : "0 rows",
      scheduler: [],
      engine: working,
      highlightTable: table,
      highlightPageId: startRow.firstPageId,
      scanNames,
    });
    return steps;
  }

  const table = cmd.table;
  const sqlPrefix = table === "users" ? "INSERT INTO users VALUES " : "INSERT INTO orders VALUES ";
  const startRow = getTable(start, table);
  if (!startRow) {
    return [
      {
        beat: "error",
        sql: `${sqlPrefix}(...);`,
        note: `No catalog row for ${table}. Create the table first — the engine cannot guess a page id from the .db file.`,
        packet: `GetTable("${table}") → nullptr`,
        scheduler: [],
        engine: cloneEngine(start),
        error: "missing table",
        highlightTable: table,
      },
    ];
  }

  const tentativeSlot = start.heaps[startRow.lastPageId]?.tuples.length ?? 0;
  const slotForTuple = tentativeSlot >= PAGE_CAP ? 0 : tentativeSlot;
  const tuple =
    table === "users"
      ? nextUserTuple(start, slotForTuple)
      : nextOrderTuple(start, slotForTuple);
  if (!tuple) {
    return [
      {
        beat: "error",
        sql: `${sqlPrefix}(...);`,
        note: `Demo pool for ${table} is empty. Reset to insert again.`,
        packet: "no more sample rows",
        scheduler: [],
        engine: cloneEngine(start),
        error: "exhausted",
        highlightTable: table,
      },
    ];
  }

  const sql = `${sqlPrefix}${tuple.label};`;
  const steps: AnimStep[] = [];

  const eSql = cloneEngine(start);
  steps.push({
    beat: "sql",
    sql,
    note: `Executor will insert one tuple. First question: which page does ${table} live on?`,
    packet: sql,
    scheduler: [],
    engine: eSql,
    highlightTable: table,
  });

  const eCat = cloneEngine(eSql);
  const cat = getTable(eCat, table)!;
  steps.push({
    beat: "catalog",
    sql,
    note: `catalog.GetTable("${table}") → oid ${cat.oid}, first_page_id = P${cat.firstPageId}, last_page_id = P${cat.lastPageId}.`,
    packet: `GetTable("${table}") → P${cat.lastPageId}`,
    scheduler: [],
    engine: eCat,
    highlightTable: table,
    highlightPageId: cat.lastPageId,
  });

  let working = cloneEngine(eCat);
  let last = getTable(working, table)!;
  let page = working.heaps[last.lastPageId]!;
  let allocatedNew = false;
  let newPageId: number | null = null;

  if (page.tuples.length >= PAGE_CAP) {
    const prevId = page.pageId;
    const eAlloc = cloneEngine(working);
    const fresh = allocatePage(eAlloc, table);
    eAlloc.heaps[prevId]!.nextPageId = fresh.pageId;
    const crow = getTable(eAlloc, table)!;
    crow.lastPageId = fresh.pageId;

    steps.push({
      beat: "allocate",
      sql,
      note: `P${prevId} is full (${PAGE_CAP}/${PAGE_CAP}). NewPage() → P${fresh.pageId}. Link P${prevId}.next_page_id = ${fresh.pageId}. first_page_id stays ${crow.firstPageId}.`,
      packet: `P${prevId} full → NewPage()=P${fresh.pageId}`,
      scheduler: [],
      engine: eAlloc,
      highlightTable: table,
      highlightPageId: fresh.pageId,
    });

    working = eAlloc;
    last = getTable(working, table)!;
    page = working.heaps[last.lastPageId]!;
    allocatedNew = true;
    newPageId = fresh.pageId;

    const eLinkSched = cloneEngine(working);
    steps.push({
      beat: "scheduler",
      sql,
      note: `WRITE the new empty page and the updated next_page_id on P${prevId}.`,
      packet: `Schedule(WRITE P${prevId}) · Schedule(WRITE P${fresh.pageId})`,
      scheduler: [
        { kind: "write", pageId: prevId, status: "done" },
        { kind: "write", pageId: fresh.pageId, status: "io" },
      ],
      engine: eLinkSched,
      highlightTable: table,
      highlightPageId: fresh.pageId,
    });
    working = eLinkSched;
  }

  const eIns = cloneEngine(working);
  const dest = eIns.heaps[getTable(eIns, table)!.lastPageId]!;
  const placed = attachSlot(tuple, dest.tuples.length);
  dest.tuples.push(placed);
  const rid: Rid = { pageId: dest.pageId, slot: placed.slot };
  eIns.lastRid = rid;
  if (table === "users") eIns.usersInserted += 1;
  else eIns.ordersInserted += 1;
  const fid = placeInFrame(eIns, dest.pageId, true, true);

  steps.push({
    beat: allocatedNew ? "disk" : "scheduler",
    sql,
    note: allocatedNew
      ? `Tuple ${tuple.label} lands on new page P${dest.pageId} as RID ${formatRid(rid)}.`
      : `P${dest.pageId} has room. InsertTuple writes a slot directory entry + tuple bytes. Returns RID ${formatRid(rid)}.`,
    packet: `InsertTuple → RID ${formatRid(rid)}`,
    scheduler: [{ kind: "write", pageId: dest.pageId, status: "io" }],
    engine: eIns,
    highlightTable: table,
    highlightPageId: dest.pageId,
    rid,
  });

  const eDisk = cloneEngine(eIns);
  const extent = eDisk.extents.find((x) => x.pageId === dest.pageId)!;
  steps.push({
    beat: "disk",
    sql,
    note: `Worker calls DiskManager.WritePage(P${dest.pageId}). Seek to offset ${extent.offset} in datadb.db and dump 8192 bytes — including ${tuple.name}.`,
    packet: `dm.WritePage(${dest.pageId}) @ ${extent.offset}`,
    scheduler: [{ kind: "write", pageId: dest.pageId, status: "done" }],
    engine: eDisk,
    highlightTable: table,
    highlightPageId: dest.pageId,
    rid,
  });

  const eBpm = cloneEngine(eDisk);
  placeInFrame(eBpm, dest.pageId, true, true);
  steps.push({
    beat: "bpm",
    sql,
    note: `Frame F${fid} holds P${dest.pageId} (dirty). Indexes would store RID ${formatRid(rid)}, not the row bytes.`,
    packet: `F${fid} = P${dest.pageId} · dirty · RID ${formatRid(rid)}`,
    scheduler: [],
    engine: eBpm,
    highlightTable: table,
    highlightPageId: dest.pageId,
    rid,
  });

  steps.push({
    beat: "done",
    sql,
    note: newPageId != null
      ? `Heap grew. Scans still start at first_page_id and follow next_page_id. New RID is ${formatRid(rid)}.`
      : `Insert path: catalog → last page → slotted slot → scheduler WRITE → datadb.db. RID ${formatRid(rid)}.`,
    packet: `INSERT complete · RID ${formatRid(rid)}`,
    scheduler: [],
    engine: eBpm,
    highlightTable: table,
    highlightPageId: dest.pageId,
    rid,
  });

  return steps;
}

export const TOUR: Command[] = [
  { kind: "create", table: "users" },
  { kind: "create", table: "orders" },
  { kind: "insert", table: "users" },
  { kind: "insert", table: "users" },
  { kind: "insert", table: "users" },
  { kind: "insert", table: "orders" },
  { kind: "select", table: "users" },
  { kind: "select", table: "orders" },
  { kind: "restart" },
];
