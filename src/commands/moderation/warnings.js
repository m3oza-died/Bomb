const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');
const db     = require('../../utils/database');

module.exports = {
  aliases : ['warns', 'infractions'],
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('📋 View or clear warnings for a member')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('user').setDescription('Member to check').setRequired(true))
    .addBooleanOption((o) => o.setName('clear').setDescription('Clear all warnings for this user')),

  async execute(interaction) {
    const target    = interaction.options.getMember('user') ?? interaction.options.getUser('user');
    const doClear   = interaction.options.getBoolean('clear') ?? false;
    const guildId   = interaction.guild.id;
    const userId    = target?.id ?? target?.user?.id;

    if (!userId) return interaction.reply({ embeds: [embeds.error('Not Found', 'Could not find that user.')], ephemeral: true });

    if (doClear) {
      db.clearWarnings(guildId, userId);
      return interaction.reply({ embeds: [embeds.success('Cleared', `All warnings for **${target.user?.tag ?? target.tag}** have been removed.`)] });
    }

    const warns = db.getWarnings(guildId, userId);
    if (!warns.length)
      return interaction.reply({ embeds: [embeds.info('No Warnings', `**${target.user?.tag ?? target.tag}** has no warnings.`)], ephemeral: true });

    const list = warns.map((w, i) =>
      `\`${i + 1}.\` **${w.reason}**\n└ By ${w.moderator} — <t:${Math.floor(w.timestamp / 1_000)}:R>`
    ).join('\n\n');

    await interaction.reply({
      embeds: [
        embeds.warn('Warnings', list)
          .setTitle(`⚠️  Warnings — ${target.user?.tag ?? target.tag}`)
          .setFooter({ text: `Total: ${warns.length}  •  ⚡ Devmux  •  .gg/m3oza` }),
      ],
    });
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Moderate Members`.')] });

    const target = message.mentions.members.first() ?? message.guild.members.cache.get(args[0]);
    if (!target) return message.reply({ embeds: [embeds.error('Not Found', 'Mention a valid member.')] });

    const warns = db.getWarnings(message.guild.id, target.id);
    if (!warns.length) return message.reply({ embeds: [embeds.info('No Warnings', `${target.user.tag} has no warnings.`)] });

    const list = warns.map((w, i) => `\`${i + 1}.\` ${w.reason} — by ${w.moderator}`).join('\n');
    message.reply({ embeds: [embeds.warn(`Warnings (${warns.length})`, list)] });
  },
};
