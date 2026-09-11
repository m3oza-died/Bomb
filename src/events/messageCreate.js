const embeds = require('../utils/embeds');

module.exports = {
  name: 'messageCreate',

  async execute(message, client) {
    if (message.author.bot)                           return;
    if (!message.content.startsWith(client.prefix))  return;

    const args        = message.content.slice(client.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName)
      || [...client.commands.values()].find((c) => c.aliases?.includes(commandName));

    if (!command || !command.prefixExecute) return;

    try {
      await command.prefixExecute(message, args, client);
    } catch (err) {
      console.error(`[PREFIX ERROR] ${commandName}:`, err);
      message.reply({ embeds: [embeds.error('Error', 'Something went wrong.')] }).catch(() => {});
    }
  },
};
