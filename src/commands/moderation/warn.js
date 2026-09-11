const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const db     = require('../../utils/database');

module.exports = {
  aliases : ['warn'],
  cooldown: 4,

  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('⚠️ Warn a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('user').setDescription('Member to warn').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the warning').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason');

    if (!target) return interaction.reply({ embeds: [embeds.error('Not Found', 'That user is not in this server.')], ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ embeds: [embeds.error('Invalid', "You can't warn yourself.")], ephemeral: true });

    const warning = {
      reason,
      moderator  : interaction.user.tag,
      moderatorId: interaction.user.id,
      timestamp  : Date.now(),
    };
    db.addWarning(interaction.guild.id, target.id, warning);

    const allWarns = db.getWarnings(interaction.guild.id, target.id);

    await target.send({
      embeds: [
        embeds.warn('You Were Warned', `You received a warning in **${interaction.guild.name}**.\n**Reason:** ${reason}\n**Total warnings:** ${allWarns.length}`),
      ],
    }).catch(() => {});

    await interaction.reply({
      embeds: [
        embeds.warn('Member Warned', `**${target.user.tag}** has been warned.`)
          .addFields(
            { name: '👤 User',         value: `${target.user.tag}`,                 inline: true  },
            { name: '⚠️ Total Warns',  value: `${allWarns.length}`,                 inline: true  },
            { name: '🛡️ Moderator',   value: `${interaction.user.tag}`,             inline: true  },
            { name: '📝 Reason',       value: reason,                               inline: false },
          ),
      ],
    });
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Moderate Members`.')] });

    const target = message.mentions.members.first() ?? message.guild.members.cache.get(args[0]);
    const reason = args.slice(1).join(' ') || 'No reason provided';
    if (!target) return message.reply({ embeds: [embeds.error('Not Found', 'Mention a valid member.')] });

    db.addWarning(message.guild.id, target.id, { reason, moderator: message.author.tag, timestamp: Date.now() });
    const total = db.getWarnings(message.guild.id, target.id).length;
    message.reply({ embeds: [embeds.warn('Warned', `**${target.user.tag}** warned. Total: **${total}**. Reason: ${reason}`)] });
  },
};
