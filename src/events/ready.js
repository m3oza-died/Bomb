const { ActivityType } = require('discord.js');
const chalk = require('chalk');
const { BOT_NAME, CREDIT, STATUS } = require('../config');

module.exports = {
  name : 'ready',
  once : true,

  execute(client) {
    console.log(chalk.magenta(`
╔════════════════════════════════════════╗
║                                        ║
║   ⚡  ${BOT_NAME} — Premium Discord Bot    ║
║   🔗  ${STATUS}                     ║
║   👑  Credit: ${CREDIT}                    ║
║                                        ║
╚════════════════════════════════════════╝`));

    console.log(chalk.green(`✅  Online as ${chalk.bold(client.user.tag)}`));
    console.log(chalk.blue(`📡  Guilds : ${client.guilds.cache.size}`));
    console.log(chalk.yellow(`🎮  Commands: ${client.commands.size}`));

    const statuses = [
      { name: STATUS,                                   type: ActivityType.Watching  },
      { name: `${client.guilds.cache.size} servers`,   type: ActivityType.Watching  },
      { name: `/help | ${STATUS}`,                      type: ActivityType.Playing   },
      { name: `${BOT_NAME} Bot ⚡`,                    type: ActivityType.Playing   },
      { name: 'your server 🛡️',                        type: ActivityType.Watching  },
    ];

    let i = 0;
    const rotate = () => {
      const s = statuses[i % statuses.length];
      client.user.setPresence({ activities: [s], status: 'online' });
      i++;
    };

    rotate();
    setInterval(rotate, 20_000);
  },
};
