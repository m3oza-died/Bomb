const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['resume', 'unpause', 'r'],
  cooldown: 2,

  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('▶️ Resume the paused song'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guild);
    if (!queue)          return interaction.reply({ embeds: [embeds.error('No Queue', 'Nothing is playing!')], ephemeral: true });
    if (!queue.paused)   return interaction.reply({ embeds: [embeds.warn('Not Paused', 'Music is not paused.')], ephemeral: true });

    queue.resume();
    await interaction.reply({ embeds: [embeds.music('Resumed ▶️', `**${queue.songs[0].name}** is now playing.`)] });
  },

  async prefixExecute(message, args, client) {
    const queue = client.distube.getQueue(message.guild);
    if (!queue || !queue.paused) return message.reply({ embeds: [embeds.error('Not Paused', 'Nothing is paused.')] });
    queue.resume();
    message.reply({ embeds: [embeds.music('Resumed', `**${queue.songs[0].name}** resumed.`)] });
  },
};
