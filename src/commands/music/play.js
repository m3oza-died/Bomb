const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['play', 'p'],
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('🎵 Play a song or playlist (YouTube, SoundCloud, URL…)')
    .addStringOption((o) => o.setName('query').setDescription('Song name or URL').setRequired(true)),

  async execute(interaction, client) {
    const query  = interaction.options.getString('query');
    const vc     = interaction.member?.voice?.channel;

    if (!vc)
      return interaction.reply({ embeds: [embeds.error('Not in Voice', 'Join a voice channel first!')], ephemeral: true });

    await interaction.deferReply();

    try {
      await client.distube.play(vc, query, {
        textChannel: interaction.channel,
        member     : interaction.member,
      });
      await interaction.editReply({ embeds: [embeds.music('Loading…', `Searching for **${query}**…`)] });
    } catch (err) {
      await interaction.editReply({ embeds: [embeds.error('Playback Error', err.message?.slice(0, 300) ?? 'Could not play that.')] });
    }
  },

  async prefixExecute(message, args, client) {
    const query = args.join(' ');
    const vc    = message.member?.voice?.channel;
    if (!vc)    return message.reply({ embeds: [embeds.error('Not in Voice', 'Join a voice channel first!')] });
    if (!query) return message.reply({ embeds: [embeds.error('Missing Query', 'Provide a song name or URL.')] });

    try {
      await client.distube.play(vc, query, { textChannel: message.channel, member: message.member });
    } catch (err) {
      message.reply({ embeds: [embeds.error('Playback Error', err.message?.slice(0, 300) ?? 'Could not play that.')] });
    }
  },
};
