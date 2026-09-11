const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['ban'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🔨 Ban a member from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName('user').setDescription('Member to ban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Reason for the ban'))
    .addIntegerOption((o) => o.setName('days').setDescription('Messages to delete (0-7)').setMinValue(0).setMaxValue(7)),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    const days   = interaction.options.getInteger('days') ?? 0;

    if (!target)          return reply(interaction, embeds.error('Not Found', 'That user is not in this server.'));
    if (target.id === interaction.user.id)
                          return reply(interaction, embeds.error('Invalid', "You can't ban yourself."));
    if (!target.bannable) return reply(interaction, embeds.error('Missing Permissions', 'I cannot ban that user — they may outrank me.'));

    await target.send({ embeds: [embeds.error('You Were Banned', `Banned from **${interaction.guild.name}**.\n**Reason:** ${reason}`)] }).catch(() => {});
    await target.ban({ reason, deleteMessageSeconds: days * 86400 });

    await interaction.reply({
      embeds: [
        embeds.mod('Member Banned', `**${target.user.tag}** has been banned.`)
          .addFields(
            { name: '👤 User',       value: `${target.user.tag} \`(${target.id})\``, inline: true  },
            { name: '🔨 Moderator', value: `${interaction.user.tag}`,                 inline: true  },
            { name: '🗑️ Msg Delete', value: `${days} day(s)`,                         inline: true  },
            { name: '📝 Reason',     value: reason,                                   inline: false },
          ),
      ],
    });
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Ban Members`.')] });

    const target = message.mentions.members.first() ?? message.guild.members.cache.get(args[0]);
    const reason = args.slice(1).join(' ') || 'No reason provided';
    if (!target)          return message.reply({ embeds: [embeds.error('Not Found', 'Mention a valid member.')] });
    if (!target.bannable) return message.reply({ embeds: [embeds.error('Failed', 'Cannot ban that user.')] });

    await target.ban({ reason });
    message.reply({ embeds: [embeds.mod('Banned', `**${target.user.tag}** — ${reason}`)] });
  },
};

function reply(i, embed) { return i.reply({ embeds: [embed], ephemeral: true }); }
