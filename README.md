# ⚡ Devmux — Premium Discord Bot

> **Built by [m3oza](https://discord.gg/m3oza)** | `.gg/m3oza`

A fast, premium all-in-one Discord bot packed with moderation, music (24/7), tickets, giveaways, join-to-create VC, embed builder, and much more — all with slash (`/`) and prefix (`$`) support.

---

## 🚀 Features

| Category | Commands |
|---|---|
| 🛡️ Moderation | `ban` `kick` `mute` `unmute` `warn` `warnings` `clear` `lock` `unlock` `slowmode` `nickname` `unban` |
| 🎵 Music (24/7) | `play` `skip` `stop` `queue` `loop` `volume` `pause` `resume` `nowplaying` `shuffle` |
| 👋 Greeting | `setwelcome` `setleave` |
| 🎫 Tickets | `setupticket` `closeticket` |
| 🔧 Utility | `embed` `say` `emojistealer` `giveaway` `help` |
| 🎙️ Join-To-Create | `setupjtc` |

---

## ⚙️ Setup (Self-Hosted)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/devmux.git
cd devmux
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
TOKEN=your_bot_token
CLIENT_ID=your_application_id
PREFIX=$
```

### 3. Run

```bash
npm start
# or for development:
npm run dev
```

---

## 🚂 Deploy on Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Select your repo
4. Go to **Variables** and add:
   - `TOKEN` — your bot token
   - `CLIENT_ID` — your bot's application ID
   - `PREFIX` — `$` (or whatever you want)
5. Railway will auto-detect `railway.toml` and deploy with `node index.js`

> **Tip:** For persistent data on Railway, add a **Volume** mounted at `/app/data` (or update the `DB_PATH` in `src/utils/database.js`).

---

## 🎵 Music Notes

- Music is powered by **[DisTube](https://distube.js.org/)** with the **yt-dlp** plugin
- YouTube, SoundCloud, Spotify links, and direct URLs are supported
- yt-dlp binary is auto-downloaded on first run (requires internet access)
- For true 24/7 music: the bot stays in VC after the queue ends automatically

---

## 🎫 Ticket System

1. Run `/setupticket panel` in your server
2. Choose a channel for the panel, a support role, and optional category
3. Members click the **🎫 Open Ticket** button to create a private channel
4. Transcripts are auto-saved and DM'd to the user on close

---

## 🎙️ Join-To-Create

1. Create a **voice channel** called something like `➕ Join to Create`
2. Run `/setupjtc setup` and select that channel
3. When a user joins, a new private VC is created with a control panel (rename, limit, lock, kick, etc.)
4. The VC auto-deletes when empty

---

## 🛠️ Customization

All settings are stored per-server in `data/*.json` files. No database required.

| File | Purpose |
|---|---|
| `data/welcome.json` | Welcome system config |
| `data/leave.json` | Leave system config |
| `data/warnings.json` | Member warning records |
| `data/tickets.json` | Ticket system config + open tickets |
| `data/jtc.json` | JTC config + active VC tracking |
| `giveaways.json` | Active/ended giveaways |

---

## 📋 Command Reference

### Moderation
| Command | Description |
|---|---|
| `/ban [user] [reason] [days]` | Ban a member |
| `/kick [user] [reason]` | Kick a member |
| `/mute [user] [duration] [reason]` | Timeout a member (e.g. `10m`, `1h`, `1d`) |
| `/unmute [user]` | Remove a timeout |
| `/warn [user] [reason]` | Warn a member |
| `/warnings [user] [clear]` | View or clear warnings |
| `/clear [amount] [user]` | Bulk delete messages |
| `/lock [channel]` | Lock a channel |
| `/unlock [channel]` | Unlock a channel |
| `/slowmode [seconds]` | Set slowmode |
| `/nickname [user] [nickname]` | Change/reset nickname |
| `/unban [userid]` | Unban by user ID |

### Music
| Command | Description |
|---|---|
| `/play [query]` | Play a song or playlist |
| `/skip` | Skip current song |
| `/stop` | Stop music and clear queue |
| `/queue [page]` | Show the queue |
| `/loop [off/song/queue]` | Set loop mode |
| `/volume [1-150]` | Set volume |
| `/pause` | Pause playback |
| `/resume` | Resume playback |
| `/nowplaying` | Show current song with progress bar |
| `/shuffle` | Shuffle the queue |

### Greeting
| Command | Description |
|---|---|
| `/setwelcome set [channel]` | Set welcome channel & message |
| `/setwelcome disable` | Disable welcome messages |
| `/setwelcome test` | Test the welcome message |
| `/setleave set [channel]` | Set leave channel & message |
| `/setleave disable` | Disable leave messages |
| `/setleave test` | Test the leave message |

**Welcome/Leave variables:** `{user}` `{username}` `{tag}` `{server}` `{count}`

### Tickets
| Command | Description |
|---|---|
| `/setupticket panel [channel] [supportrole]` | Post ticket panel |
| `/setupticket disable` | Disable tickets |
| `/closeticket [reason]` | Close current ticket |

### Utility
| Command | Description |
|---|---|
| `/embed [channel]` | Interactive embed builder (modal) |
| `/say [message] [channel]` | Make the bot say something |
| `/emojistealer [emoji] [name]` | Steal an emoji from another server |
| `/giveaway start [prize] [duration] [winners]` | Start a giveaway |
| `/giveaway end [messageid]` | End a giveaway early |
| `/giveaway reroll [messageid]` | Reroll a giveaway |
| `/giveaway list` | List active giveaways |
| `/help [command]` | Show help menu or command info |

### Join-To-Create
| Command | Description |
|---|---|
| `/setupjtc setup [channel]` | Set JTC trigger channel |
| `/setupjtc disable` | Disable JTC |
| `/setupjtc info` | Show JTC config |

---

## 📁 Project Structure

```
devmux/
├── index.js                    # Entry point
├── package.json
├── railway.toml                # Railway deployment config
├── .env.example
├── data/                       # Auto-created JSON storage
└── src/
    ├── config.js
    ├── commands/
    │   ├── moderation/         # 12 moderation commands
    │   ├── music/              # 10 music commands
    │   ├── greeting/           # 2 greeting commands
    │   ├── tickets/            # 2 ticket commands
    │   ├── utility/            # 5 utility commands
    │   └── jtc/                # 1 JTC command
    ├── events/                 # Discord event listeners
    ├── handlers/               # Command & event loaders
    └── utils/                  # Embeds, colors, database, music events
```

---

## 🔑 Bot Permissions

When inviting Devmux, ensure it has:

- ✅ Manage Channels
- ✅ Manage Roles
- ✅ Manage Messages
- ✅ Manage Nicknames
- ✅ Kick Members
- ✅ Ban Members
- ✅ Moderate Members
- ✅ Read Message History
- ✅ Send Messages
- ✅ Embed Links
- ✅ Attach Files
- ✅ Add Reactions
- ✅ Connect (Voice)
- ✅ Speak (Voice)
- ✅ Move Members (Voice)

Or simply use **Administrator** for full functionality.

---

## 💜 Credits

Built with ❤️ by **m3oza** | Support: [discord.gg/m3oza](https://discord.gg/m3oza)

**Libraries used:**
- [discord.js](https://discord.js.org/) v14
- [DisTube](https://distube.js.org/) v4
- [@distube/yt-dlp](https://github.com/distubejs/yt-dlp)
- [discord-giveaways](https://github.com/Androz2091/discord-giveaways)
