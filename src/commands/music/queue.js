const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['queue', 'q'],
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('🗒️ Show the current music queue')
    .addIntegerOption((o) => o.setName('page').setDescription('Page number').setMinValue(1)),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guild);
    if (!queue?.songs?.length) return interaction.reply({ embeds: [embeds.error('Empty Queue', 'Nothing is in the queue!')], ephemeral: true });

    const page     = interaction.options.getInteger('page') ?? 1;
    const perPage  = 10;
    const pages    = Math.ceil(queue.songs.length / perPage);
    const start    = (page - 1) * perPage;
    const slice    = queue.songs.slice(start, start + perPage);

    const list = slice.map((s, i) => {
      const idx = start + i;
      return idx === 0
        ? `▶️ **[${s.name}](${s.url})** \`${s.formattedDuration}\` — ${s.user}`
        : `\`${idx}.\` [${s.name}](${s.url}) \`${s.formattedDuration}\` — ${s.user}`;
    }).join('\n');

    const totalDur = queue.formattedDuration;

    await interaction.reply({
      embeds: [
        embeds.music(`Queue — Page ${page}/${pages}`, list)
          .addFields(
            { name: '🎶 Total Songs', value: `${queue.songs.length}`, inline: true },
            { name: '⏱️ Total Time',  value: totalDur,                 inline: true },
            { name: '🔁 Loop',        value: ['Off', 'Song', 'Queue'][queue.repeatMode], inline: true },
          ),
      ],
    });
  },

  async prefixExecute(message, args, client) {
    const queue = client.distube.getQueue(message.guild);
    if (!queue?.songs?.length) return message.reply({ embeds: [embeds.error('Empty Queue', 'Nothing in the queue!')] });

    const list = queue.songs.slice(0, 10).map((s, i) =>
      i === 0 ? `▶️ **${s.name}** \`${s.formattedDuration}\`` : `\`${i}.\` ${s.name} \`${s.formattedDuration}\``
    ).join('\n');

    message.reply({ embeds: [embeds.music(`Queue (${queue.songs.length})`, list)] });
  },
};
