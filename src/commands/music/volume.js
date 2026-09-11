const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['volume', 'vol'],
  cooldown: 2,

  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('🔊 Set the playback volume')
    .addIntegerOption((o) =>
      o.setName('level').setDescription('Volume level (1–150)').setRequired(true).setMinValue(1).setMaxValue(150)
    ),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guild);
    if (!queue) return interaction.reply({ embeds: [embeds.error('No Queue', 'Nothing is playing!')], ephemeral: true });

    const level = interaction.options.getInteger('level');
    queue.setVolume(level);

    const bar  = volumeBar(level);
    await interaction.reply({
      embeds: [embeds.music('Volume Set', `${bar}\n**${level}%**`)],
    });
  },

  async prefixExecute(message, args, client) {
    const queue = client.distube.getQueue(message.guild);
    if (!queue) return message.reply({ embeds: [embeds.error('No Queue', 'Nothing is playing!')] });

    const level = parseInt(args[0]);
    if (isNaN(level) || level < 1 || level > 150)
      return message.reply({ embeds: [embeds.error('Invalid', 'Provide a volume between 1 and 150.')] });

    queue.setVolume(level);
    message.reply({ embeds: [embeds.music('Volume', `Set to **${level}%**`)] });
  },
};

function volumeBar(level) {
  const filled = Math.round(level / 10);
  return '▓'.repeat(Math.min(filled, 15)) + '░'.repeat(Math.max(15 - filled, 0));
}
