const fs = require("fs");
const path = require("path");
const mongo = require("./mongo");

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const DEFAULT_DB = {
  settings: {},
  visits: [],
  orders: [],
  sessions: []
};

let db = null;
let fresh = false;

function load() {
  fresh = false;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    } catch (e) {
      db = null;
    }
  }
  if (!db) {
    db = JSON.parse(JSON.stringify(DEFAULT_DB));
    fresh = true;
    save();
  }
}

function isFresh() {
  return fresh;
}

function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function getSetting(key, fallback) {
  return Object.prototype.hasOwnProperty.call(db.settings, key) ? db.settings[key] : fallback;
}

function setSetting(key, value) {
  db.settings[key] = value;
  save();
  mongo.setSetting(key, value);
}

function addVisit(visit) {
  visit.id = (db.visits[db.visits.length - 1] || { id: 0 }).id + 1;
  visit.ts = visit.ts || Date.now();
  db.visits.push(visit);
  save();
  mongo.addVisit(visit);
}

function addOrder(order) {
  order.id = (db.orders[db.orders.length - 1] || { id: 0 }).id + 1;
  order.ts = order.ts || Date.now();
  db.orders.push(order);
  save();
  mongo.addOrder(order);
  return order;
}

function addSession(token) {
  const session = { token, created: Date.now() };
  db.sessions.push(session);
  save();
  mongo.addSession(session);
}

function isValidSession(token) {
  const found = db.sessions.find((s) => s.token === token);
  if (!found) return false;
  if (Date.now() - found.created > 7 * 24 * 60 * 60 * 1000) {
    db.sessions = db.sessions.filter((s) => s.token !== token);
    save();
    mongo.removeSession(token);
    return false;
  }
  return true;
}

function removeSession(token) {
  db.sessions = db.sessions.filter((s) => s.token !== token);
  save();
  mongo.removeSession(token);
}

function resetVisits() {
  db.visits = [];
  save();
  mongo.resetVisits();
}

function setState(state) {
  db = {
    settings: (state && state.settings) || {},
    visits: (state && state.visits) || [],
    orders: (state && state.orders) || [],
    sessions: (state && state.sessions) || []
  };
  save();
}

function all() {
  return db;
}

module.exports = { load, isFresh, save, getSetting, setSetting, addVisit, addOrder, addSession, isValidSession, removeSession, resetVisits, all, setState };
