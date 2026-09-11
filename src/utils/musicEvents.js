const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const C = require('./colors');
const { EMBED_FOOTER } = require('../config');

const footer = { text: EMBED_FOOTER };

/**
 * Sets up all DisTube music events on the client.
 * @param {import('discord.js').Client} client
 */
function setupMusicEvents(client) {
  const { distube } = client;

  // ── Now Playing ───────────────────────────────────────────────────────────
  distube.on('playSong', (queue, song) => {
    const embed = new EmbedBuilder()
      .setColor(C.MUSIC)
      .setTitle('🎵  Now Playing')
      .setDescription(`**[${song.name}](${song.url})**`)
      .setThumbnail(song.thumbnail)
      .addFields(
        { name: '⏱️ Duration',      value: song.formattedDuration,               inline: true },
        { name: '👤 Requested by',  value: `${song.user}`,                        inline: true },
        { name: '🔊 Volume',        value: `${queue.volume}%`,                    inline: true },
        { name: '🔁 Loop',          value: queue.repeatMode ? `${['Off','Song','Queue'][queue.repeatMode]}` : 'Off', inline: true },
        { name: '🎶 In Queue',      value: `${queue.songs.length} song(s)`,       inline: true },
      )
      .setFooter(footer)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('music_pause').setEmoji('⏸️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music_skip').setEmoji('⏭️').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('music_stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('music_queue').setEmoji('🗒️').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('music_loop').setEmoji('🔁').setStyle(ButtonStyle.Secondary),
    );

    queue.textChannel?.send({ embeds: [embed], components: [row] });
  });

  // ── Song Added ────────────────────────────────────────────────────────────
  distube.on('addSong', (queue, song) => {
    const embed = new EmbedBuilder()
      .setColor(C.MUSIC)
      .setTitle('➕  Added to Queue')
      .setDescription(`**[${song.name}](${song.url})**`)
      .addFields(
        { name: '⏱️ Duration',     value: song.formattedDuration, inline: true },
        { name: '📌 Position',     value: `#${queue.songs.length}`,  inline: true },
        { name: '👤 Requested by', value: `${song.user}`,            inline: true },
      )
      .setThumbnail(song.thumbnail)
      .setFooter(footer)
      .setTimestamp();
    queue.textChannel?.send({ embeds: [embed] });
  });

  // ── Playlist Added ────────────────────────────────────────────────────────
  distube.on('addList', (queue, playlist) => {
    const embed = new EmbedBuilder()
      .setColor(C.MUSIC)
      .setTitle('📋  Playlist Added')
      .setDescription(`**${playlist.name}** — ${playlist.songs.length} songs`)
      .addFields(
        { name: '👤 Requested by', value: `${playlist.user}`, inline: true },
        { name: '🎶 Queue total',  value: `${queue.songs.length} songs`, inline: true },
      )
      .setFooter(footer)
      .setTimestamp();
    queue.textChannel?.send({ embeds: [embed] });
  });

  // ── Queue Finish ──────────────────────────────────────────────────────────
  distube.on('finish', (queue) => {
    const embed = new EmbedBuilder()
      .setColor(C.MUSIC)
      .setTitle('🎵  Queue Ended')
      .setDescription('The queue has ended. Add more songs with `/play`!')
      .setFooter(footer)
      .setTimestamp();
    queue.textChannel?.send({ embeds: [embed] });
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  distube.on('disconnect', (queue) => {
    const embed = new EmbedBuilder()
      .setColor(C.WARNING)
      .setTitle('🔌  Disconnected')
      .setDescription('Left the voice channel.')
      .setFooter(footer);
    queue.textChannel?.send({ embeds: [embed] });
  });

  // ── Error ─────────────────────────────────────────────────────────────────
  distube.on('error', (channel, error) => {
    console.error('[DisTube Error]', error);
    const embed = new EmbedBuilder()
      .setColor(C.ERROR)
      .setTitle('❌  Music Error')
      .setDescription(`\`\`\`${error.message?.slice(0, 500)}\`\`\``)
      .setFooter(footer);
    channel?.send({ embeds: [embed] });
  });

  // ── Music Button Handler ───────────────────────────────────────────────────
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    const { customId, guild, member } = interaction;
    if (!customId.startsWith('music_')) return;

    const queue = client.distube.getQueue(guild);
    if (!queue) {
      return interaction.reply({ content: '❌ No music is playing!', ephemeral: true });
    }
    if (member.voice.channelId !== queue.voiceChannel.id) {
      return interaction.reply({ content: '❌ You must be in the same voice channel!', ephemeral: true });
    }

    switch (customId) {
      case 'music_pause':
        if (queue.paused) {
          queue.resume();
          await interaction.reply({ content: '▶️ Resumed!', ephemeral: true });
        } else {
          queue.pause();
          await interaction.reply({ content: '⏸️ Paused!', ephemeral: true });
        }
        break;
      case 'music_skip':
        await queue.skip();
        await interaction.reply({ content: '⏭️ Skipped!', ephemeral: true });
        break;
      case 'music_stop':
        queue.stop();
        await interaction.reply({ content: '⏹️ Stopped the queue!', ephemeral: true });
        break;
      case 'music_queue': {
        const songs = queue.songs.slice(0, 10).map((s, i) =>
          `\`${i === 0 ? '▶' : i}\`. [${s.name}](${s.url}) — \`${s.formattedDuration}\``
        ).join('\n');
        const qEmbed = new EmbedBuilder()
          .setColor(C.MUSIC)
          .setTitle('🗒️  Queue')
          .setDescription(songs || 'Empty!')
          .setFooter(footer);
        await interaction.reply({ embeds: [qEmbed], ephemeral: true });
        break;
      }
      case 'music_loop':
        queue.setRepeatMode((queue.repeatMode + 1) % 3);
        await interaction.reply({ content: `🔁 Loop: **${['Off', 'Song', 'Queue'][queue.repeatMode]}**`, ephemeral: true });
        break;
    }
  });
}

module.exports = { setupMusicEvents };
