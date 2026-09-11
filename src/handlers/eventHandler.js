const fs    = require('fs');
const path  = require('path');
const chalk = require('chalk');

function loadEvents(client) {
  const evDir = path.join(__dirname, '../events');
  const files = fs.readdirSync(evDir).filter((f) => f.endsWith('.js'));

  for (const file of files) {
    try {
      const event = require(path.join(evDir, file));
      const fn    = (...args) => event.execute(...args, client);
      event.once ? client.once(event.name, fn) : client.on(event.name, fn);
      console.log(chalk.cyan(`  [EVT] ✓ ${file} → ${event.name}`));
    } catch (err) {
      console.error(chalk.red(`  [EVT] ✗ ${file}`), err.message);
    }
  }
}

module.exports = { loadEvents };
