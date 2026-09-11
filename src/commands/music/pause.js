const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['pause'],
  cooldown: 2,

  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('⏸️ Pause the current song'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guild);
    if (!queue)         return interaction.reply({ embeds: [embeds.error('No Queue', 'Nothing is playing!')], ephemeral: true });
    if (queue.paused)   return interaction.reply({ embeds: [embeds.warn('Already Paused', 'Music is already paused. Use `/resume`.')], ephemeral: true });

    queue.pause();
    await interaction.reply({ embeds: [embeds.music('Paused ⏸️', `**${queue.songs[0].name}** has been paused.`)] });
  },

  async prefixExecute(message, args, client) {
    const queue = client.distube.getQueue(message.guild);
    if (!queue || queue.paused) return message.reply({ embeds: [embeds.error('Cannot Pause', 'Nothing to pause.')] });
    queue.pause();
    message.reply({ embeds: [embeds.music('Paused', `**${queue.songs[0].name}** paused.`)] });
  },
};
