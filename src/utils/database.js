/**
 * Devmux - Lightweight JSON database
 * Credit: m3oza | .gg/m3oza
 */
const fs   = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '../../data');

const FILES = {
  welcome  : path.join(DIR, 'welcome.json'),
  leave    : path.join(DIR, 'leave.json'),
  warnings : path.join(DIR, 'warnings.json'),
  tickets  : path.join(DIR, 'tickets.json'),
  jtc      : path.join(DIR, 'jtc.json'),
};

// Ensure data dir + files exist
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
Object.values(FILES).forEach((f) => {
  if (!fs.existsSync(f)) fs.writeFileSync(f, '{}', 'utf8');
});

const read  = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return {}; } };
const write = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2), 'utf8');

// ── Welcome ────────────────────────────────────────────────────────────────
const getWelcome = (guildId) => read(FILES.welcome)[guildId] ?? null;
const setWelcome = (guildId, data) => {
  const all = read(FILES.welcome);
  all[guildId] = { ...all[guildId], ...data };
  write(FILES.welcome, all);
};

// ── Leave ──────────────────────────────────────────────────────────────────
const getLeave = (guildId) => read(FILES.leave)[guildId] ?? null;
const setLeave = (guildId, data) => {
  const all = read(FILES.leave);
  all[guildId] = { ...all[guildId], ...data };
  write(FILES.leave, all);
};

// ── Warnings ───────────────────────────────────────────────────────────────
const getWarnings = (guildId, userId) => {
  const all = read(FILES.warnings);
  return all?.[guildId]?.[userId] ?? [];
};
const addWarning = (guildId, userId, warn) => {
  const all = read(FILES.warnings);
  if (!all[guildId]) all[guildId] = {};
  if (!all[guildId][userId]) all[guildId][userId] = [];
  all[guildId][userId].push(warn);
  write(FILES.warnings, all);
};
const clearWarnings = (guildId, userId) => {
  const all = read(FILES.warnings);
  if (all[guildId]) all[guildId][userId] = [];
  write(FILES.warnings, all);
};

// ── Tickets ────────────────────────────────────────────────────────────────
const getTicketConfig = (guildId) => read(FILES.tickets)[guildId] ?? null;
const setTicketConfig = (guildId, data) => {
  const all = read(FILES.tickets);
  all[guildId] = { ...all[guildId], ...data };
  write(FILES.tickets, all);
};
const nextTicketNum = (guildId) => {
  const all = read(FILES.tickets);
  if (!all[guildId]) all[guildId] = {};
  all[guildId].counter = (all[guildId].counter ?? 0) + 1;
  write(FILES.tickets, all);
  return all[guildId].counter;
};
const addOpenTicket = (guildId, channelId, userId) => {
  const all = read(FILES.tickets);
  if (!all[guildId]) all[guildId] = {};
  if (!all[guildId].open) all[guildId].open = {};
  all[guildId].open[channelId] = { userId, createdAt: Date.now() };
  write(FILES.tickets, all);
};
const removeOpenTicket = (guildId, channelId) => {
  const all = read(FILES.tickets);
  if (all[guildId]?.open) delete all[guildId].open[channelId];
  write(FILES.tickets, all);
};
const getOpenTicket = (guildId, channelId) =>
  read(FILES.tickets)?.[guildId]?.open?.[channelId] ?? null;

// ── Join-To-Create ─────────────────────────────────────────────────────────
const getJTC = (guildId) => read(FILES.jtc)[guildId] ?? null;
const setJTC = (guildId, data) => {
  const all = read(FILES.jtc);
  all[guildId] = { ...all[guildId], ...data };
  write(FILES.jtc, all);
};
const addJTCChannel = (guildId, channelId, ownerId) => {
  const all = read(FILES.jtc);
  if (!all[guildId]) all[guildId] = {};
  if (!all[guildId].active) all[guildId].active = {};
  all[guildId].active[channelId] = { ownerId, createdAt: Date.now() };
  write(FILES.jtc, all);
};
const removeJTCChannel = (guildId, channelId) => {
  const all = read(FILES.jtc);
  if (all[guildId]?.active) delete all[guildId].active[channelId];
  write(FILES.jtc, all);
};
const getJTCChannel = (guildId, channelId) =>
  read(FILES.jtc)?.[guildId]?.active?.[channelId] ?? null;
const isJTCChannel = (guildId, channelId) =>
  !!read(FILES.jtc)?.[guildId]?.active?.[channelId];

module.exports = {
  getWelcome, setWelcome,
  getLeave, setLeave,
  getWarnings, addWarning, clearWarnings,
  getTicketConfig, setTicketConfig, nextTicketNum,
  addOpenTicket, removeOpenTicket, getOpenTicket,
  getJTC, setJTC, addJTCChannel, removeJTCChannel, getJTCChannel, isJTCChannel,
};
