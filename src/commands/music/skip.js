const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['skip', 's'],
  cooldown: 2,

  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('⏭️ Skip the current song'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guild);
    if (!queue) return interaction.reply({ embeds: [embeds.error('No Queue', 'Nothing is playing!')], ephemeral: true });
    if (!inVC(interaction, queue)) return interaction.reply({ embeds: [embeds.error('Not in VC', 'Join the bot\'s voice channel.')], ephemeral: true });

    const song = queue.songs[0];
    await queue.skip();
    await interaction.reply({ embeds: [embeds.music('Skipped', `Skipped **${song.name}**.`)] });
  },

  async prefixExecute(message, args, client) {
    const queue = client.distube.getQueue(message.guild);
    if (!queue) return message.reply({ embeds: [embeds.error('No Queue', 'Nothing is playing!')] });
    const song = queue.songs[0];
    await queue.skip();
    message.reply({ embeds: [embeds.music('Skipped', `Skipped **${song.name}**.`)] });
  },
};

function inVC(interaction, queue) {
  return interaction.member?.voice?.channelId === queue.voiceChannel?.id;
}
