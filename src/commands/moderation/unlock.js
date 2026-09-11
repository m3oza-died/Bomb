const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['unlock'],
  cooldown: 4,

  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('🔓 Unlock a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((o) => o.setName('channel').setDescription('Channel to unlock (defaults to current)'))
    .addStringOption((o) => o.setName('reason').setDescription('Reason')),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') ?? interaction.channel;
    const reason  = interaction.options.getString('reason') ?? 'No reason provided';

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null,
    });

    await interaction.reply({
      embeds: [
        embeds.success('Channel Unlocked', `${channel} has been unlocked.`)
          .addFields(
            { name: '🔓 Channel',    value: `${channel}`,              inline: true },
            { name: '🛡️ Moderator', value: `${interaction.user.tag}`, inline: true },
            { name: '📝 Reason',     value: reason,                    inline: false },
          ),
      ],
    });
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Manage Channels`.')] });

    const channel = message.mentions.channels.first() ?? message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
    message.reply({ embeds: [embeds.success('Unlocked', `${channel} has been unlocked.`)] });
  },
};
