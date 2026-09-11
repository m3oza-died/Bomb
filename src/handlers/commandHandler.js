const { REST, Routes } = require('discord.js');
const fs    = require('fs');
const path  = require('path');
const chalk = require('chalk');

async function loadCommands(client) {
  const slashPayload = [];
  const cmdDir       = path.join(__dirname, '../commands');
  const categories   = fs.readdirSync(cmdDir);

  for (const cat of categories) {
    const catPath = path.join(cmdDir, cat);
    if (!fs.statSync(catPath).isDirectory()) continue;

    const files = fs.readdirSync(catPath).filter((f) => f.endsWith('.js'));

    for (const file of files) {
      try {
        const command = require(path.join(catPath, file));
        if (!command.data || !command.execute) {
          console.warn(chalk.yellow(`  [WARN] ${cat}/${file} missing data/execute — skipped`));
          continue;
        }
        client.commands.set(command.data.name, { ...command, category: cat });
        slashPayload.push(command.data.toJSON());
        console.log(chalk.green(`  [CMD] ✓ ${cat}/${file} → /${command.data.name}`));
      } catch (err) {
        console.error(chalk.red(`  [CMD] ✗ ${cat}/${file}`), err.message);
      }
    }
  }

  // Register slash commands
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
  try {
    console.log(chalk.blue(`\n[REST] Registering ${slashPayload.length} slash commands…`));

    const target = process.env.GUILD_ID
      ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
      : Routes.applicationCommands(process.env.CLIENT_ID);

    await rest.put(target, { body: slashPayload });
    console.log(chalk.green(`[REST] ✓ Registered ${slashPayload.length} commands (${process.env.GUILD_ID ? 'guild' : 'global'})\n`));
  } catch (err) {
    console.error(chalk.red('[REST] Failed to register:'), err.message);
  }
}

module.exports = { loadCommands };
