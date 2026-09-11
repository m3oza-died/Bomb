const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ms     = require('ms');
const embeds = require('../../utils/embeds');

const parseDuration = (str) => {
  const match = str?.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const map = { s: 1, m: 60, h: 3600, d: 86400 };
  return parseInt(match[1]) * map[match[2].toLowerCase()] * 1_000;
};

module.exports = {
  aliases : ['timeout', 'mute'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('🔇 Timeout a member (e.g. 10m, 1h, 1d)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('user').setDescription('Member to mute').setRequired(true))
    .addStringOption((o) => o.setName('duration').setDescription('Duration e.g. 10m 1h 1d (max 28d)').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason')),

  async execute(interaction) {
    const target   = interaction.options.getMember('user');
    const dStr     = interaction.options.getString('duration');
    const reason   = interaction.options.getString('reason') ?? 'No reason provided';
    const duration = parseDuration(dStr);

    if (!target)    return interaction.reply({ embeds: [embeds.error('Not Found', 'That user is not in this server.')], ephemeral: true });
    if (!duration || duration > 28 * 24 * 60 * 60 * 1_000)
                    return interaction.reply({ embeds: [embeds.error('Invalid Duration', 'Use format: `10m`, `1h`, `1d` (max 28d)')], ephemeral: true });
    if (!target.moderatable)
                    return interaction.reply({ embeds: [embeds.error('Missing Permissions', 'I cannot timeout that user.')], ephemeral: true });

    await target.timeout(duration, reason);

    const until = Math.floor((Date.now() + duration) / 1_000);
    await interaction.reply({
      embeds: [
        embeds.mod('Member Muted', `**${target.user.tag}** has been timed out.`)
          .addFields(
            { name: '👤 User',       value: `${target.user.tag}`,    inline: true  },
            { name: '⏳ Until',      value: `<t:${until}:R>`,        inline: true  },
            { name: '🛡️ Moderator', value: `${interaction.user.tag}`, inline: true  },
            { name: '📝 Reason',     value: reason,                   inline: false },
          ),
      ],
    });
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Moderate Members`.')] });

    const target   = message.mentions.members.first() ?? message.guild.members.cache.get(args[0]);
    const dStr     = args[1];
    const reason   = args.slice(2).join(' ') || 'No reason provided';
    const duration = parseDuration(dStr);

    if (!target)   return message.reply({ embeds: [embeds.error('Not Found', 'Mention a valid member.')] });
    if (!duration) return message.reply({ embeds: [embeds.error('Invalid Duration', 'e.g. `10m`, `1h`, `1d`')] });

    await target.timeout(duration, reason);
    message.reply({ embeds: [embeds.mod('Muted', `**${target.user.tag}** timed out for **${dStr}**. Reason: ${reason}`)] });
  },
};
