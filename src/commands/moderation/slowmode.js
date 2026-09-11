const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['slowmode', 'slow'],
  cooldown: 4,

  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('🐢 Set slowmode for a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((o) => o.setName('seconds').setDescription('Seconds between messages (0 to disable)').setRequired(true).setMinValue(0).setMaxValue(21600))
    .addChannelOption((o) => o.setName('channel').setDescription('Target channel (defaults to current)')),

  async execute(interaction) {
    const seconds = interaction.options.getInteger('seconds');
    const channel = interaction.options.getChannel('channel') ?? interaction.channel;

    await channel.setRateLimitPerUser(seconds);

    const msg = seconds === 0
      ? `Slowmode disabled in ${channel}.`
      : `Slowmode set to **${seconds}s** in ${channel}.`;

    await interaction.reply({ embeds: [embeds.mod('Slowmode Updated', msg)] });
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Manage Channels`.')] });

    const seconds = parseInt(args[0]);
    if (isNaN(seconds) || seconds < 0 || seconds > 21600)
      return message.reply({ embeds: [embeds.error('Invalid', 'Provide seconds between 0 and 21600.')] });

    await message.channel.setRateLimitPerUser(seconds);
    message.reply({ embeds: [embeds.mod('Slowmode', seconds === 0 ? 'Slowmode disabled.' : `Set to **${seconds}s**.`)] });
  },
};
