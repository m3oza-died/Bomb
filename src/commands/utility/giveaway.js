const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const embeds = require('../../utils/embeds');
const ms     = require('ms');

module.exports = {
  aliases : ['giveaway', 'gcreate', 'gstart'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('🎉 Start a giveaway')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName('start')
        .setDescription('Start a new giveaway')
        .addStringOption((o) => o.setName('prize').setDescription('What are you giving away?').setRequired(true))
        .addStringOption((o) => o.setName('duration').setDescription('Duration e.g. 1h 12h 1d 7d').setRequired(true))
        .addIntegerOption((o) => o.setName('winners').setDescription('Number of winners').setRequired(true).setMinValue(1).setMaxValue(20))
        .addChannelOption((o) => o.setName('channel').setDescription('Channel to host in (defaults to current)').addChannelTypes(ChannelType.GuildText))
        .addRoleOption((o) => o.setName('requirement').setDescription('Required role to enter'))
    )
    .addSubcommand((sub) =>
      sub.setName('end')
        .setDescription('Immediately end a giveaway')
        .addStringOption((o) => o.setName('messageid').setDescription('Giveaway message ID').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName('reroll')
        .setDescription('Reroll a giveaway winner')
        .addStringOption((o) => o.setName('messageid').setDescription('Giveaway message ID').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName('list')
        .setDescription('List all active giveaways in this server')
    ),

  async execute(interaction, client) {
    const sub = interaction.options.getSubcommand();

    // ── Start ──────────────────────────────────────────────────────────────
    if (sub === 'start') {
      const prize      = interaction.options.getString('prize');
      const durStr     = interaction.options.getString('duration');
      const winners    = interaction.options.getInteger('winners');
      const channel    = interaction.options.getChannel('channel') ?? interaction.channel;
      const reqRole    = interaction.options.getRole('requirement');
      const duration   = ms(durStr);

      if (!duration || duration < 5_000)
        return interaction.reply({ embeds: [embeds.error('Invalid Duration', 'Use a valid duration like `1h`, `1d`, `7d`.')], ephemeral: true });

      await interaction.deferReply({ ephemeral: true });

      try {
        await client.giveawaysManager.start(channel, {
          duration,
          winnerCount   : winners,
          prize,
          hostedBy      : interaction.user,
          exemptMembers : reqRole
            ? (member) => !member.roles.cache.has(reqRole.id)
            : undefined,
          messages: {
            giveaway         : `\n\n🎉 **GIVEAWAY** 🎉`,
            giveawayEnded    : `\n\n🎉 **GIVEAWAY ENDED** 🎉`,
            title            : prize,
            inviteToParticipate: 'React with 🎉 to enter!',
            drawing          : `Drawing in: {timestamp}`,
            dropMessage      : 'Hurry! This is a drop giveaway.',
            actionsMap       : { 'ENTER_GIVEAWAY': '🎉' },
            winMessage       : '🎉 Congratulations **{winners}**! You won **{prize}**!',
            embedFooter      : '⚡ Devmux Giveaways  •  .gg/m3oza',
          },
        });

        await interaction.editReply({
          embeds: [
            embeds.giveaway('Giveaway Started!', `A giveaway for **${prize}** has started in ${channel}!`)
              .addFields(
                { name: '🏆 Prize',    value: prize,             inline: true },
                { name: '⏱️ Duration', value: durStr,            inline: true },
                { name: '👥 Winners',  value: `${winners}`,      inline: true },
                { name: '📢 Channel',  value: `${channel}`,      inline: true },
                reqRole ? { name: '🎭 Required Role', value: `${reqRole}`, inline: true } : null,
              ).spliceFields(0, 0).addFields([
                { name: '🏆 Prize',    value: prize,        inline: true },
                { name: '⏱️ Duration', value: durStr,       inline: true },
                { name: '👥 Winners',  value: `${winners}`, inline: true },
                { name: '📢 Channel',  value: `${channel}`, inline: true },
              ]),
          ],
        });
      } catch (err) {
        await interaction.editReply({ embeds: [embeds.error('Failed', err.message)] });
      }
    }

    // ── End ────────────────────────────────────────────────────────────────
    if (sub === 'end') {
      const msgId = interaction.options.getString('messageid');
      try {
        await client.giveawaysManager.end(msgId);
        await interaction.reply({ embeds: [embeds.success('Giveaway Ended', `Giveaway \`${msgId}\` has been ended.`)] });
      } catch (err) {
        await interaction.reply({ embeds: [embeds.error('Error', err.message)], ephemeral: true });
      }
    }

    // ── Reroll ─────────────────────────────────────────────────────────────
    if (sub === 'reroll') {
      const msgId = interaction.options.getString('messageid');
      try {
        const winners = await client.giveawaysManager.reroll(msgId);
        await interaction.reply({
          embeds: [embeds.giveaway('Rerolled!', `New winner(s): ${winners.map((w) => `${w}`).join(', ')}`)],
        });
      } catch (err) {
        await interaction.reply({ embeds: [embeds.error('Error', err.message)], ephemeral: true });
      }
    }

    // ── List ───────────────────────────────────────────────────────────────
    if (sub === 'list') {
      const active = client.giveawaysManager.giveaways.filter(
        (g) => g.guildId === interaction.guild.id && !g.ended
      );
      if (!active.length)
        return interaction.reply({ embeds: [embeds.info('No Active Giveaways', 'There are no ongoing giveaways in this server.')], ephemeral: true });

      const list = active.map((g, i) =>
        `\`${i + 1}.\` **${g.prize}** — <t:${Math.floor(g.endAt / 1_000)}:R> — ${g.winnerCount} winner(s)`
      ).join('\n');

      await interaction.reply({ embeds: [embeds.giveaway(`Active Giveaways (${active.length})`, list)] });
    }
  },

  async prefixExecute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Manage Server`.')] });

    const [durStr, winnersStr, ...prizeArr] = args;
    const prize   = prizeArr.join(' ');
    const winners = parseInt(winnersStr);
    const dur     = ms(durStr);

    if (!dur || !winners || !prize)
      return message.reply({ embeds: [embeds.error('Usage', `\`${message.client.prefix}giveaway 1h 1 Cool Prize\``)] });

    await client.giveawaysManager.start(message.channel, {
      duration: dur, winnerCount: winners, prize, hostedBy: message.author,
    });
  },
};
