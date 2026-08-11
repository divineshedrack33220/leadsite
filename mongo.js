const { MongoClient } = require("mongodb");

let client = null;
let db = null;
let enabled = false;

function stripId(doc) {
  if (!doc) return doc;
  const copy = Object.assign({}, doc);
  delete copy._id;
  return copy;
}

async function connect(uri) {
  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
  });
  await client.connect();
  db = client.db(process.env.MONGO_DB || "leadsite");
  enabled = true;
  return db;
}

function isEnabled() {
  return enabled;
}

async function setSetting(key, value) {
  if (!enabled) return;
  try {
    await db.collection("settings").updateOne(
      { k: key },
      { $set: { k: key, v: value } },
      { upsert: true }
    );
  } catch (e) {
    console.log("[mongo] setSetting failed:", e.message);
  }
}

async function addVisit(visit) {
  if (!enabled) return;
  try {
    await db.collection("visits").insertOne(stripId(visit));
  } catch (e) {
    console.log("[mongo] addVisit failed:", e.message);
  }
}

async function addOrder(order) {
  if (!enabled) return;
  try {
    await db.collection("orders").insertOne(stripId(order));
  } catch (e) {
    console.log("[mongo] addOrder failed:", e.message);
  }
}

async function addSession(session) {
  if (!enabled) return;
  try {
    await db.collection("sessions").insertOne(stripId(session));
  } catch (e) {
    console.log("[mongo] addSession failed:", e.message);
  }
}

async function removeSession(token) {
  if (!enabled) return;
  try {
    await db.collection("sessions").deleteOne({ token });
  } catch (e) {
    console.log("[mongo] removeSession failed:", e.message);
  }
}

async function resetVisits() {
  if (!enabled) return;
  try {
    await db.collection("visits").deleteMany({});
  } catch (e) {
    console.log("[mongo] resetVisits failed:", e.message);
  }
}

async function registerImage(name, url) {
  if (!enabled) return;
  try {
    await db.collection("images").updateOne(
      { _id: name },
      { $set: { url, ts: Date.now() } },
      { upsert: true }
    );
  } catch (e) {
    console.log("[mongo] registerImage failed:", e.message);
  }
}

async function listImages() {
  if (!enabled) return [];
  try {
    const docs = await db.collection("images").find().toArray();
    return docs.map((d) => ({ name: d._id, url: d.url }));
  } catch (e) {
    return [];
  }
}

async function pullSettings() {
  if (!enabled) return null;
  try {
    const docs = await db.collection("settings").find().toArray();
    const settings = {};
    docs.forEach((d) => { settings[d.k] = d.v; });
    return settings;
  } catch (e) {
    return null;
  }
}

async function pullVisits() {
  if (!enabled) return [];
  try {
    return (await db.collection("visits").find().toArray()).map(stripId);
  } catch (e) {
    return [];
  }
}

async function pullOrders() {
  if (!enabled) return [];
  try {
    return (await db.collection("orders").find().toArray()).map(stripId);
  } catch (e) {
    return [];
  }
}

async function pullSessions() {
  if (!enabled) return [];
  try {
    return (await db.collection("sessions").find().toArray()).map(stripId);
  } catch (e) {
    return [];
  }
}

async function lastSyncTs() {
  if (!enabled) return 0;
  try {
    const m = await db.collection("meta").findOne({ _id: "sync" });
    return m && m.ts ? m.ts : 0;
  } catch (e) {
    return 0;
  }
}

async function pushState(state) {
  if (!enabled) return;
  const settings = (state && state.settings) || {};
  try {
    const ops = Object.keys(settings).map((k) => ({
      updateOne: { filter: { k }, update: { $set: { k, v: settings[k] } }, upsert: true }
    }));
    if (ops.length) await db.collection("settings").bulkWrite(ops);

    const replaceAll = async (coll, rows) => {
      await db.collection(coll).deleteMany({});
      if (rows && rows.length) {
        await db.collection(coll).insertMany(rows.map(stripId), { ordered: false });
      }
    };
    await replaceAll("visits", (state && state.visits) || []);
    await replaceAll("orders", (state && state.orders) || []);
    await replaceAll("sessions", (state && state.sessions) || []);

    await db.collection("meta").updateOne(
      { _id: "sync" },
      { $set: { ts: Date.now() } },
      { upsert: true }
    );
  } catch (e) {
    console.log("[mongo] pushState failed:", e.message);
  }
}

async function hasAnyData() {
  if (!enabled) return false;
  try {
    const s = await db.collection("settings").countDocuments();
    const v = await db.collection("visits").countDocuments();
    const o = await db.collection("orders").countDocuments();
    return s > 0 || v > 0 || o > 0;
  } catch (e) {
    return false;
  }
}

module.exports = {
  connect,
  isEnabled,
  setSetting,
  addVisit,
  addOrder,
  addSession,
  removeSession,
  registerImage,
  listImages,
  pullSettings,
  pullVisits,
  pullOrders,
  pullSessions,
  lastSyncTs,
  pushState,
  hasAnyData,
  resetVisits
};
