const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['nowplaying', 'np', 'current'],
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('🎵 Show the currently playing song'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guild);
    if (!queue) return interaction.reply({ embeds: [embeds.error('No Queue', 'Nothing is playing!')], ephemeral: true });

    const song     = queue.songs[0];
    const elapsed  = queue.currentTime;
    const total    = song.duration;
    const bar      = progressBar(elapsed, total);

    await interaction.reply({
      embeds: [
        embeds.music('Now Playing', `**[${song.name}](${song.url})**\n\n${bar}\n\`${fmt(elapsed)} / ${song.formattedDuration}\``)
          .setThumbnail(song.thumbnail)
          .addFields(
            { name: '👤 Requested by', value: `${song.user}`,                                                          inline: true },
            { name: '🔊 Volume',       value: `${queue.volume}%`,                                                       inline: true },
            { name: '🔁 Loop',         value: ['Off', '🔂 Song', '🔁 Queue'][queue.repeatMode],                         inline: true },
            { name: '⏸️ Status',      value: queue.paused ? 'Paused' : '▶️ Playing',                                   inline: true },
            { name: '🎶 In Queue',     value: `${queue.songs.length} song(s)`,                                          inline: true },
            { name: '🔀 Shuffled',     value: queue.shuffled ? 'Yes' : 'No',                                            inline: true },
          ),
      ],
    });
  },

  async prefixExecute(message, args, client) {
    const queue = client.distube.getQueue(message.guild);
    if (!queue) return message.reply({ embeds: [embeds.error('No Queue', 'Nothing is playing!')] });

    const song = queue.songs[0];
    message.reply({
      embeds: [
        embeds.music('Now Playing', `**${song.name}**\n\`${fmt(queue.currentTime)} / ${song.formattedDuration}\``)
          .setThumbnail(song.thumbnail),
      ],
    });
  },
};

function progressBar(current, total, length = 20) {
  if (!total) return '░'.repeat(length);
  const filled = Math.round((current / total) * length);
  return '▓'.repeat(filled) + '░'.repeat(length - filled);
}

function fmt(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
