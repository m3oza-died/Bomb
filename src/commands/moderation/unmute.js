const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['untimeout', 'unmute'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('🔊 Remove a timeout from a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('user').setDescription('Member to unmute').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason')),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    if (!target)                 return interaction.reply({ embeds: [embeds.error('Not Found', 'That user is not in this server.')], ephemeral: true });
    if (!target.communicationDisabledUntil)
                                 return interaction.reply({ embeds: [embeds.warn('Not Muted', 'That user is not currently timed out.')], ephemeral: true });
    if (!target.moderatable)     return interaction.reply({ embeds: [embeds.error('Missing Permissions', 'I cannot modify that user.')], ephemeral: true });

    await target.timeout(null, reason);

    await interaction.reply({
      embeds: [
        embeds.success('Member Unmuted', `**${target.user.tag}**'s timeout has been removed.`)
          .addFields(
            { name: '👤 User',       value: `${target.user.tag}`,     inline: true },
            { name: '🛡️ Moderator', value: `${interaction.user.tag}`, inline: true },
            { name: '📝 Reason',     value: reason,                    inline: false },
          ),
      ],
    });
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Moderate Members`.')] });

    const target = message.mentions.members.first() ?? message.guild.members.cache.get(args[0]);
    if (!target) return message.reply({ embeds: [embeds.error('Not Found', 'Mention a valid member.')] });

    await target.timeout(null);
    message.reply({ embeds: [embeds.success('Unmuted', `**${target.user.tag}** timeout removed.`)] });
  },
};
