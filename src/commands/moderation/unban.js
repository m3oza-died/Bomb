const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['unban'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('🔓 Unban a user by their ID')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((o) => o.setName('userid').setDescription('User ID to unban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason')),

  async execute(interaction) {
    const userId = interaction.options.getString('userid').trim();
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    const ban = await interaction.guild.bans.fetch(userId).catch(() => null);
    if (!ban) return interaction.reply({ embeds: [embeds.error('Not Banned', `No ban found for ID \`${userId}\`.`)], ephemeral: true });

    await interaction.guild.members.unban(userId, reason);

    await interaction.reply({
      embeds: [
        embeds.success('User Unbanned', `**${ban.user.tag}** has been unbanned.`)
          .addFields(
            { name: '👤 User',       value: `${ban.user.tag} \`(${userId})\``, inline: true },
            { name: '🛡️ Moderator', value: `${interaction.user.tag}`,           inline: true },
            { name: '📝 Reason',     value: reason,                             inline: false },
          ),
      ],
    });
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Ban Members`.')] });

    const userId = args[0];
    const reason = args.slice(1).join(' ') || 'No reason provided';
    if (!userId) return message.reply({ embeds: [embeds.error('Missing', 'Provide a user ID.')] });

    const ban = await message.guild.bans.fetch(userId).catch(() => null);
    if (!ban) return message.reply({ embeds: [embeds.error('Not Banned', `No ban found for \`${userId}\`.`)] });

    await message.guild.members.unban(userId, reason);
    message.reply({ embeds: [embeds.success('Unbanned', `**${ban.user.tag}** has been unbanned.`)] });
  },
};
