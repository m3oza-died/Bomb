// Offline sanity check: loads every command/event and validates the slash command JSON. Run: npm run check
const { Collection } = require('discord.js');
process.env.DATA_DIR = require('os').tmpdir() + '/devmux-check';
const { loadCommands, loadEvents } = require('../src/handlers/loader');

const fake = new Collection();
const client = { on() {}, once() {} };
loadCommands(client);
loadEvents(client);
for (const c of client.commands.values()) {
  const json = c.data.toJSON();
  if (!json.description) throw new Error(`/${json.name} has no description`);
}
console.log(`✅ OK — ${client.commands.size} commands validated`);
process.exit(0);
