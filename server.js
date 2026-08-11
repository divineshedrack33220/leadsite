require("dotenv").config();

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const geoip = require("geoip-lite");
const multer = require("multer");

const store = require("./store");
const mongo = require("./mongo");
const cloud = require("./cloudinary");
const { seed } = require("./seed");

store.load();
cloud.configure();

const app = express();
const PORT = process.env.PORT || 3000;
const IMAGES_DIR = path.join(__dirname, "public", "images");

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, "public")));
app.use("/admin", express.static(path.join(__dirname, "admin")));

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "admin.html"));
});

app.get("/admin/", (req, res) => {
  res.sendFile(path.join(__dirname, "admin", "admin.html"));
});

function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return req.ip || "0.0.0.0";
}

function geolocate(ip) {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return { country: "Local", city: "Localhost" };
  }
  const geo = geoip.lookup(ip);
  if (!geo) return { country: "Unknown", city: "Unknown" };
  return { country: geo.country, city: geo.city || "Unknown" };
}

function trackVisit(req, page) {
  const ip = getClientIp(req);
  const loc = geolocate(ip);
  const q = req.query;
  store.addVisit({
    page,
    path: req.originalUrl,
    ip,
    country: loc.country,
    city: loc.city,
    referrer: req.body && req.body.referrer ? String(req.body.referrer).slice(0, 500) : "",
    utm_source: q.utm_source ? String(q.utm_source).slice(0, 200) : "",
    utm_medium: q.utm_medium ? String(q.utm_medium).slice(0, 200) : "",
    utm_campaign: q.utm_campaign ? String(q.utm_campaign).slice(0, 200) : "",
    fbclid: q.fbclid ? String(q.fbclid).slice(0, 200) : "",
    ua: req.headers["user-agent"] ? String(req.headers["user-agent"]).slice(0, 500) : ""
  });
}

function requireAuth(req, res, next) {
  const token = req.cookiesToken || req.get("Authorization") || "";
  if (token && store.isValidSession(token)) return next();
  res.status(401).json({ error: "unauthorized" });
}

function cookieToken(req) {
  const raw = req.headers.cookie || "";
  const m = raw.match(/(?:^|;\s*)ls_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

/* ------------------------- PUBLIC ------------------------- */

app.get("/api/content/:page", (req, res) => {
  const page = req.params.page;
  if (page !== "index" && page !== "sales") return res.status(404).json({ error: "not found" });
  res.json({ content: store.getSetting("content:" + page, "") });
});

app.post("/api/track", (req, res) => {
  const page = (req.body && req.body.page) || "index";
  trackVisit(req, page);
  res.json({ ok: true });
});

app.post("/api/order", (req, res) => {
  const b = req.body || {};
  const required = ["name", "phone", "address", "quantity"];
  const missing = required.filter((k) => !b[k]);
  if (missing.length) return res.status(400).json({ error: "missing fields: " + missing.join(", ") });

  const ip = getClientIp(req);
  const loc = geolocate(ip);

  const order = store.addOrder({
    name: String(b.name).slice(0, 200),
    phone: String(b.phone).slice(0, 50),
    altphone: b.altphone ? String(b.altphone).slice(0, 50) : "",
    number: b.number ? String(b.number).slice(0, 50) : "",
    address: String(b.address).slice(0, 500),
    quantity: String(b.quantity).slice(0, 50),
    country: loc.country,
    city: loc.city,
    ip,
    referrer: b.referrer ? String(b.referrer).slice(0, 500) : "",
    utm_source: b.utm_source ? String(b.utm_source).slice(0, 200) : ""
  });

  res.json({ ok: true, id: order.id });
});

/* ------------------------- ADMIN ------------------------- */

app.post("/api/admin/login", (req, res) => {
  const u = store.getSetting("admin:user", "");
  const h = store.getSetting("admin:hash", "");
  const body = req.body || {};
  if (!u || !h) return res.status(500).json({ error: "admin not configured" });
  if (body.username === u && bcrypt.compareSync(String(body.password || ""), h)) {
    const token = crypto.randomBytes(32).toString("hex");
    store.addSession(token);
    res.setHeader("Set-Cookie", "ls_token=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800");
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "invalid credentials" });
});

app.post("/api/admin/logout", (req, res) => {
  const token = cookieToken(req);
  if (token) store.removeSession(token);
  res.setHeader("Set-Cookie", "ls_token=; Path=/; HttpOnly; Max-Age=0");
  res.json({ ok: true });
});

app.get("/api/admin/me", (req, res, next) => {
  req.cookiesToken = cookieToken(req);
  requireAuth(req, res, () => res.json({ ok: true, user: store.getSetting("admin:user", "") }));
});

app.use("/api/admin", (req, res, next) => {
  req.cookiesToken = cookieToken(req);
  requireAuth(req, res, next);
});

app.get("/api/admin/content/:page", (req, res) => {
  const page = req.params.page;
  if (page !== "index" && page !== "sales") return res.status(404).json({ error: "not found" });
  res.json({ content: store.getSetting("content:" + page, "") });
});

app.get("/api/admin/images", (req, res) => {
  const dir = path.join(__dirname, "public", "images");
  let files = [];
  try {
    files = fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(f))
      .sort();
  } catch (e) {
    files = [];
  }
  res.json({ images: files });
});

const upload = multer({
  storage: multer.diskStorage({
    destination: IMAGES_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const safe = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg"].includes(ext) ? ext : ".jpg";
      cb(null, "upload-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6) + safe);
    }
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype || "")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  }
});

app.post("/api/admin/images/upload", (req, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message || "Upload failed" });
    if (!req.file) return res.status(400).json({ error: "No file selected" });
    res.json({ ok: true, name: req.file.filename });
    await backupImage(req.file.filename);
  });
});

app.post("/api/admin/images/import", async (req, res) => {
  const url = req.body && req.body.url;
  if (!url) return res.status(400).json({ error: "URL is required" });
  try {
    const u = new URL(String(url));
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return res.status(400).json({ error: "Only http(s) URLs are allowed" });
    }
    const resp = await fetch(u.href, { redirect: "follow", signal: AbortSignal.timeout(20000) });
    if (!resp.ok) return res.status(400).json({ error: "Download failed (" + resp.status + ")" });
    const type = (resp.headers.get("content-type") || "").split(";")[0].trim();
    if (!/^image\//.test(type)) return res.status(400).json({ error: "URL is not an image (" + type + ")" });
    const ext = type.replace("image/", "").split("+")[0].toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"].includes(ext) ? ext : "jpg";
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length > 8 * 1024 * 1024) return res.status(400).json({ error: "Image too large (max 8MB)" });
    const name = "import-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6) + "." + safeExt;
    fs.writeFileSync(path.join(IMAGES_DIR, name), buf);
    res.json({ ok: true, name });
    await backupImage(name);
  } catch (e) {
    res.status(400).json({ error: "Download failed" });
  }
});

async function backupImage(name) {
  if (!cloud.isEnabled()) return;
  try {
    const url = await cloud.uploadFile(path.join(IMAGES_DIR, name), name);
    await mongo.registerImage(name, url);
    console.log("[cloud] backed up image:", name);
  } catch (e) {
    console.log("[cloud] image backup failed for", name, e.message);
  }
}

async function syncAllImages() {
  if (!cloud.isEnabled()) return;
  let registered = new Set();
  try {
    registered = new Set((await mongo.listImages()).map((r) => r.name));
  } catch (e) {
    return;
  }
  let dir = [];
  try {
    dir = fs.readdirSync(IMAGES_DIR).filter((f) => /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(f));
  } catch (e) {
    dir = [];
  }
  for (const f of dir) {
    if (registered.has(f)) continue;
    await backupImage(f);
  }
}

app.put("/api/admin/content/:page", (req, res) => {
  const page = req.params.page;
  if (page !== "index" && page !== "sales") return res.status(404).json({ error: "not found" });
  const content = req.body && req.body.content;
  if (typeof content !== "string") return res.status(400).json({ error: "content must be a string" });
  store.setSetting("content:" + page, content);
  res.json({ ok: true });
});

app.get("/api/admin/orders", (req, res) => {
  const orders = store
    .all()
    .orders.slice()
    .sort((a, b) => b.ts - a.ts);
  res.json({ orders });
});

app.get("/api/admin/visits", (req, res) => {
  const visits = store
    .all()
    .visits.slice()
    .sort((a, b) => b.ts - a.ts);
  res.json({ visits });
});

app.get("/api/admin/stats", (req, res) => {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const all = store.all();
  const visits = all.visits;
  const orders = all.orders;

  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);

  const totals = {
    visits: visits.length,
    today: visits.filter((v) => v.ts >= startToday.getTime()).length,
    week: visits.filter((v) => v.ts >= now - 7 * day).length,
    uniqueIps: new Set(visits.map((v) => v.ip)).size,
    orders: orders.length,
    ordersToday: orders.filter((o) => o.ts >= startToday.getTime()).length,
    conversion: visits.length ? Math.round((orders.length / visits.length) * 1000) / 10 : 0
  };

  const lastDays = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * day);
    d.setHours(0, 0, 0, 0);
    const next = d.getTime() + day;
    const label = d.toISOString().slice(5, 10);
    lastDays.push({
      label,
      visits: visits.filter((v) => v.ts >= d.getTime() && v.ts < next).length,
      orders: orders.filter((o) => o.ts >= d.getTime() && o.ts < next).length
    });
  }

  function top(field, limit) {
    const counts = {};
    visits.forEach((v) => {
      const key = v[field] || "(none)";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.keys(counts)
      .map((k) => ({ name: k, count: counts[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit || 10);
  }

  function topLocations(limit) {
    const counts = {};
    visits.forEach((v) => {
      const key = v.city + ", " + v.country;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.keys(counts)
      .map((k) => ({ name: k, count: counts[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit || 10);
  }

  const pages = {};
  visits.forEach((v) => {
    pages[v.page] = (pages[v.page] || 0) + 1;
  });

  res.json({
    totals,
    lastDays,
    topLocations: topLocations(10),
    topReferrers: top("referrer", 10),
    topSources: top("utm_source", 10),
    topCampaigns: top("utm_campaign", 10),
    topMediums: top("utm_medium", 10),
    pages
  });
});

app.get("/api/admin/export/:kind", (req, res) => {
  const kind = req.params.kind;
  const all = store.all();
  let rows = [];
  let headers = [];

  if (kind === "visits") {
    headers = ["id", "ts", "page", "ip", "country", "city", "referrer", "utm_source", "utm_medium", "utm_campaign", "fbclid"];
    rows = all.visits
      .slice()
      .sort((a, b) => b.ts - a.ts)
      .map((v) => headers.map((h) => v[h] !== undefined ? v[h] : ""));
  } else if (kind === "orders") {
    headers = ["id", "ts", "name", "phone", "altphone", "number", "address", "quantity", "country", "city", "ip", "referrer", "utm_source"];
    rows = all.orders
      .slice()
      .sort((a, b) => b.ts - a.ts)
      .map((o) => headers.map((h) => o[h] !== undefined ? o[h] : ""));
  } else {
    return res.status(400).json({ error: "unknown export" });
  }

  const csv = [headers.join(",")]
    .concat(rows.map((r) => r.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(",")))
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=" + kind + ".csv");
  res.send(csv);
});

app.get("/api/admin/backup", (req, res) => {
  const all = store.all();
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=leadsite-backup-" + new Date().toISOString().slice(0, 10) + ".json"
  );
  res.send(JSON.stringify(all, null, 2));
});

app.post("/api/admin/backup/restore", (req, res) => {
  const data = req.body && req.body.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return res.status(400).json({ error: "Invalid backup file" });
  }
  if (!data.settings || typeof data.settings !== "object") {
    return res.status(400).json({ error: "Backup is missing settings" });
  }
  if (!Array.isArray(data.visits) || !Array.isArray(data.orders)) {
    return res.status(400).json({ error: "Backup is missing visits/orders" });
  }
  if (!data.settings["admin:user"] || !data.settings["admin:hash"]) {
    return res.status(400).json({ error: "Backup is missing admin account" });
  }
  const cleaned = {
    settings: data.settings,
    visits: data.visits,
    orders: data.orders,
    sessions: Array.isArray(data.sessions) ? data.sessions : []
  };
  fs.writeFileSync(path.join(__dirname, "data", "db.json"), JSON.stringify(cleaned, null, 2));
  store.load();
  res.json({ ok: true, counts: { visits: cleaned.visits.length, orders: cleaned.orders.length } });
});

/* ------------------------- PAGES ------------------------- */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/sales.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "sales.html"));
});

app.get("/sales", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "sales.html"));
});

async function restoreFromCloud() {
  const mHas = await mongo.hasAnyData();
  if (!mHas) {
    await mongo.pushState(store.all());
    console.log("[mongo] seeded cloud with local data");
  } else {
    const dbFile = path.join(__dirname, "data", "db.json");
    let localTs = 0;
    try { localTs = fs.statSync(dbFile).mtimeMs; } catch (e) {}
    const mts = await mongo.lastSyncTs();
    if (!store.isFresh() && localTs > mts) {
      await mongo.pushState(store.all());
      console.log("[mongo] local data newer, pushed to cloud");
    } else {
      const state = {
        settings: await mongo.pullSettings(),
        visits: await mongo.pullVisits(),
        orders: await mongo.pullOrders(),
        sessions: await mongo.pullSessions()
      };
      store.setState(state);
      console.log(
        "[mongo] restored data from cloud (" +
        state.visits.length + " visits, " + state.orders.length + " orders)" +
        (store.isFresh() ? " [local was wiped]" : "")
      );
    }
  }

  const imgs = await mongo.listImages();
  let restored = 0;
  for (const img of imgs) {
    const dest = path.join(IMAGES_DIR, img.name);
    if (fs.existsSync(dest)) continue;
    try {
      await cloud.downloadToFile(img.url, dest);
      restored++;
    } catch (e) {
      console.log("[cloud] restore failed for", img.name, e.message);
    }
  }
  if (restored) console.log("[cloud] restored " + restored + " images from Cloudinary");
}

async function bootstrap() {
  if (process.env.MONGODB_URI) {
    try {
      await mongo.connect(process.env.MONGODB_URI);
      console.log("[mongo] connected to MongoDB Atlas");
      await restoreFromCloud();
    } catch (e) {
      console.log("[mongo] MongoDB unavailable, running local-only:", e.message);
    }
  }
  seed();
  await syncAllImages();

  app.listen(PORT, () => {
    console.log(`leadsite server running on http://localhost:${PORT}`);
    console.log(`admin dashboard:      http://localhost:${PORT}/admin`);
    console.log(cloud.isEnabled()
      ? "[cloud] Cloudinary image backup active"
      : "[cloud] Cloudinary not configured (images local only)");
  });
}

bootstrap();
