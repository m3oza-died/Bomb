const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['shuffle'],
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('🔀 Shuffle the current queue'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guild);
    if (!queue || queue.songs.length < 2)
      return interaction.reply({ embeds: [embeds.error('Not Enough Songs', 'Need at least 2 songs in the queue to shuffle.')], ephemeral: true });

    await queue.shuffle();
    await interaction.reply({
      embeds: [embeds.music('Queue Shuffled 🔀', `**${queue.songs.length}** songs have been shuffled!`)],
    });
  },

  async prefixExecute(message, args, client) {
    const queue = client.distube.getQueue(message.guild);
    if (!queue || queue.songs.length < 2) return message.reply({ embeds: [embeds.error('Not Enough Songs', 'Need 2+ songs.')] });
    await queue.shuffle();
    message.reply({ embeds: [embeds.music('Shuffled 🔀', `${queue.songs.length} songs shuffled!`)] });
  },
};
