const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['lock'],
  cooldown: 4,

  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('🔒 Lock a channel (prevents @everyone from sending messages)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addChannelOption((o) => o.setName('channel').setDescription('Channel to lock (defaults to current)'))
    .addStringOption((o) => o.setName('reason').setDescription('Reason')),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel') ?? interaction.channel;
    const reason  = interaction.options.getString('reason') ?? 'No reason provided';

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false,
    });

    await interaction.reply({
      embeds: [
        embeds.mod('Channel Locked', `${channel} has been locked.`)
          .addFields(
            { name: '🔒 Channel',    value: `${channel}`,              inline: true },
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
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
    message.reply({ embeds: [embeds.mod('Locked', `${channel} is now locked.`)] });
  },
};
