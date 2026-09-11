const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['kick'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('👢 Kick a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((o) => o.setName('user').setDescription('Member to kick').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the kick')),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') ?? 'No reason provided';

    if (!target)          return interaction.reply({ embeds: [embeds.error('Not Found', 'That user is not in this server.')], ephemeral: true });
    if (target.id === interaction.user.id)
                          return interaction.reply({ embeds: [embeds.error('Invalid', "You can't kick yourself.")], ephemeral: true });
    if (!target.kickable) return interaction.reply({ embeds: [embeds.error('Missing Permissions', 'I cannot kick that user.')], ephemeral: true });

    await target.send({ embeds: [embeds.warn('You Were Kicked', `Kicked from **${interaction.guild.name}**.\n**Reason:** ${reason}`)] }).catch(() => {});
    await target.kick(reason);

    await interaction.reply({
      embeds: [
        embeds.mod('Member Kicked', `**${target.user.tag}** has been kicked.`)
          .addFields(
            { name: '👤 User',       value: `${target.user.tag} \`(${target.id})\``, inline: true },
            { name: '🛡️ Moderator', value: `${interaction.user.tag}`,                 inline: true },
            { name: '📝 Reason',     value: reason,                                   inline: false },
          ),
      ],
    });
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Kick Members`.')] });

    const target = message.mentions.members.first() ?? message.guild.members.cache.get(args[0]);
    const reason = args.slice(1).join(' ') || 'No reason provided';
    if (!target)          return message.reply({ embeds: [embeds.error('Not Found', 'Mention a valid member.')] });
    if (!target.kickable) return message.reply({ embeds: [embeds.error('Failed', 'Cannot kick that user.')] });

    await target.kick(reason);
    message.reply({ embeds: [embeds.mod('Kicked', `**${target.user.tag}** — ${reason}`)] });
  },
};
