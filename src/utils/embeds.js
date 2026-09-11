const { EmbedBuilder } = require('discord.js');
const C = require('./colors');
const { EMBED_FOOTER } = require('../config');

const footer = { text: EMBED_FOOTER };

const base = (color) =>
  new EmbedBuilder().setColor(color).setFooter(footer).setTimestamp();

module.exports = {
  // ── Status embeds ──────────────────────────────────────────────────────
  success: (title, desc) =>
    base(C.SUCCESS).setTitle(`✅  ${title}`).setDescription(desc),

  error: (title, desc) =>
    base(C.ERROR).setTitle(`❌  ${title}`).setDescription(desc),

  warn: (title, desc) =>
    base(C.WARNING).setTitle(`⚠️  ${title}`).setDescription(desc),

  info: (title, desc) =>
    base(C.INFO).setTitle(`ℹ️  ${title}`).setDescription(desc),

  // ── Domain embeds ─────────────────────────────────────────────────────
  primary: (title, desc) =>
    base(C.PRIMARY).setTitle(title).setDescription(desc),

  music: (title, desc) =>
    base(C.MUSIC).setTitle(`🎵  ${title}`).setDescription(desc),

  ticket: (title, desc) =>
    base(C.TICKET).setTitle(`🎫  ${title}`).setDescription(desc),

  jtc: (title, desc) =>
    base(C.JTC).setTitle(`🎙️  ${title}`).setDescription(desc),

  giveaway: (title, desc) =>
    base(C.GOLD).setTitle(`🎉  ${title}`).setDescription(desc),

  mod: (title, desc) =>
    base(C.PRIMARY).setTitle(`🛡️  ${title}`).setDescription(desc),

  // ── Raw builder ────────────────────────────────────────────────────────
  raw: (color = C.PRIMARY) => base(color),
};
