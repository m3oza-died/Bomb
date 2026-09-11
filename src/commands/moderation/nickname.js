const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['nick', 'nickname'],
  cooldown: 4,

  data: new SlashCommandBuilder()
    .setName('nickname')
    .setDescription('✏️ Change a member\'s nickname')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
    .addStringOption((o) => o.setName('nickname').setDescription('New nickname (leave empty to reset)')),

  async execute(interaction) {
    const target = interaction.options.getMember('user');
    const nick   = interaction.options.getString('nickname') ?? null;

    if (!target) return interaction.reply({ embeds: [embeds.error('Not Found', 'That user is not in this server.')], ephemeral: true });

    const old = target.displayName;
    await target.setNickname(nick);

    await interaction.reply({
      embeds: [
        embeds.success('Nickname Updated', nick ? `Set **${old}** → **${nick}**` : `Reset **${old}**'s nickname.`)
          .addFields(
            { name: '👤 User',    value: `${target.user.tag}`, inline: true },
            { name: '📛 Before', value: old,                    inline: true },
            { name: '✏️ After',  value: nick ?? '*reset*',      inline: true },
          ),
      ],
    });
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Manage Nicknames`.')] });

    const target = message.mentions.members.first() ?? message.guild.members.cache.get(args[0]);
    const nick   = args.slice(1).join(' ') || null;
    if (!target) return message.reply({ embeds: [embeds.error('Not Found', 'Mention a valid member.')] });

    await target.setNickname(nick);
    message.reply({ embeds: [embeds.success('Nickname', nick ? `Set to **${nick}**.` : 'Reset.')] });
  },
};
