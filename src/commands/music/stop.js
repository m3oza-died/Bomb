const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['stop', 'leave', 'disconnect', 'dc'],
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('⏹️ Stop music and clear the queue'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guild);
    if (!queue) return interaction.reply({ embeds: [embeds.error('No Queue', 'Nothing is playing!')], ephemeral: true });

    queue.stop();
    await interaction.reply({ embeds: [embeds.music('Stopped', 'Queue cleared and disconnected from voice.')] });
  },

  async prefixExecute(message, args, client) {
    const queue = client.distube.getQueue(message.guild);
    if (!queue) return message.reply({ embeds: [embeds.error('No Queue', 'Nothing is playing!')] });
    queue.stop();
    message.reply({ embeds: [embeds.music('Stopped', 'Queue cleared and left the voice channel.')] });
  },
};
