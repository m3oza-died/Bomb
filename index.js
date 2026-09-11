require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
} = require('discord.js');
const { DisTube } = require('distube');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { GiveawaysManager } = require('discord-giveaways');
const { loadCommands } = require('./src/handlers/commandHandler');
const { loadEvents } = require('./src/handlers/eventHandler');
const { setupMusicEvents } = require('./src/utils/musicEvents');
const colors = require('./src/utils/colors');
const chalk = require('chalk');

// ── Client ──────────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildPresences,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
    Partials.User,
  ],
});

// ── Collections ─────────────────────────────────────────────────────────────
client.commands  = new Collection();
client.cooldowns = new Collection();
client.prefix    = process.env.PREFIX || '$';

// ── DisTube (Music) ─────────────────────────────────────────────────────────
client.distube = new DisTube(client, {
  plugins: [new YtDlpPlugin({ update: false })],
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  emitAddListWhenCreatingQueue: false,
  nsfw: true,
  joinNewVoiceChannel: true,
  savePreviousSongs: true,
});
setupMusicEvents(client);

// ── Giveaways Manager ────────────────────────────────────────────────────────
client.giveawaysManager = new GiveawaysManager(client, {
  storage: './giveaways.json',
  default: {
    botsCanWin: false,
    embedColor: colors.PRIMARY,
    embedColorEnd: colors.ERROR,
    reaction: '🎉',
  },
});

// ── Load Handlers ────────────────────────────────────────────────────────────
loadCommands(client);
loadEvents(client);

// ── Crash Guard ──────────────────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error(chalk.red('[UNHANDLED REJECTION]'), err);
});
process.on('uncaughtException', (err) => {
  console.error(chalk.red('[UNCAUGHT EXCEPTION]'), err);
});

// ── Login ────────────────────────────────────────────────────────────────────
client.login(process.env.TOKEN).catch((err) => {
  console.error(chalk.red('[LOGIN FAILED]'), err.message);
  process.exit(1);
});
