const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
} = require('discord.js');
const C      = require('../../utils/colors');
const { EMBED_FOOTER, BOT_NAME, VERSION, CREDIT, SUPPORT_URL, STATUS } = require('../../config');

// Category metadata
const CATEGORIES = {
  moderation : { emoji: '🛡️',  label: 'Moderation',    color: C.PRIMARY },
  music      : { emoji: '🎵',  label: 'Music',          color: C.MUSIC   },
  greeting   : { emoji: '👋',  label: 'Greeting',       color: C.SUCCESS },
  tickets    : { emoji: '🎫',  label: 'Tickets',        color: C.TICKET  },
  utility    : { emoji: '🔧',  label: 'Utility',        color: C.INFO    },
  jtc        : { emoji: '🎙️', label: 'Join-To-Create', color: C.JTC     },
};

module.exports = {
  aliases : ['help', 'h', 'commands', 'cmds'],
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📋 Browse all Devmux commands')
    .addStringOption((o) =>
      o.setName('command')
        .setDescription('Get info on a specific command')
    ),

  async execute(interaction, client) {
    const specificCmd = interaction.options.getString('command');

    // ── Specific command lookup ────────────────────────────────────────────
    if (specificCmd) {
      const cmd = client.commands.get(specificCmd.toLowerCase());
      if (!cmd)
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(C.ERROR)
              .setTitle('❌  Command Not Found')
              .setDescription(`No command called \`${specificCmd}\` exists.`)
              .setFooter({ text: EMBED_FOOTER }),
          ],
          ephemeral: true,
        });

      const cat  = CATEGORIES[cmd.category] ?? { emoji: '❓', label: cmd.category ?? 'Unknown', color: C.PRIMARY };
      const desc = cmd.data.description;

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(cat.color)
            .setTitle(`${cat.emoji}  /${cmd.data.name}`)
            .setDescription(desc)
            .addFields(
              { name: '📁 Category',  value: cat.label,                                               inline: true },
              { name: '⏳ Cooldown', value: `${cmd.cooldown ?? 3}s`,                                  inline: true },
              { name: '🔤 Aliases',  value: cmd.aliases?.map((a) => `\`${a}\``).join(', ') ?? 'None', inline: false },
            )
            .setFooter({ text: EMBED_FOOTER }),
        ],
        ephemeral: true,
      });
    }

    // ── Main help menu ─────────────────────────────────────────────────────
    const homeEmbed = buildHomeEmbed(client);

    const select = new StringSelectMenuBuilder()
      .setCustomId('help_category')
      .setPlaceholder('📂  Browse a category…')
      .addOptions(
        Object.entries(CATEGORIES).map(([key, cat]) => ({
          label      : cat.label,
          value      : key,
          emoji      : cat.emoji,
          description: `Commands in ${cat.label}`,
        }))
      );

    const row = new ActionRowBuilder().addComponents(select);

    const msg = await interaction.reply({ embeds: [homeEmbed], components: [row], fetchReply: true });

    const collector = msg.createMessageComponentCollector({
      componentType : ComponentType.StringSelect,
      filter        : (i) => i.user.id === interaction.user.id && i.customId === 'help_category',
      time          : 3 * 60_000,
    });

    collector.on('collect', async (i) => {
      const key      = i.values[0];
      const cat      = CATEGORIES[key];
      const cmdsInCat = [...client.commands.values()].filter((c) => c.category === key);

      const catEmbed = new EmbedBuilder()
        .setColor(cat.color)
        .setTitle(`${cat.emoji}  ${cat.label} Commands`)
        .setDescription(
          cmdsInCat.length
            ? cmdsInCat.map((c) => `\`/${c.data.name}\` — ${c.data.description}`).join('\n')
            : 'No commands in this category.'
        )
        .addFields({ name: '💡 Tip', value: `Use \`/help [command]\` for detailed info on any command.` })
        .setFooter({ text: `${cat.label}  •  ${EMBED_FOOTER}` })
        .setTimestamp();

      await i.update({ embeds: [catEmbed], components: [row] });
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => {});
    });
  },

  async prefixExecute(message, args, client) {
    const homeEmbed = buildHomeEmbed(client);
    message.reply({ embeds: [homeEmbed] });
  },
};

function buildHomeEmbed(client) {
  const totalCmds = client.commands.size;

  const categoryLines = Object.entries(CATEGORIES).map(([key, cat]) => {
    const count = [...client.commands.values()].filter((c) => c.category === key).length;
    return `${cat.emoji} **${cat.label}** — ${count} command${count !== 1 ? 's' : ''}`;
  }).join('\n');

  return new EmbedBuilder()
    .setColor(C.PRIMARY)
    .setTitle(`⚡  ${BOT_NAME} Help — v${VERSION}`)
    .setDescription(
      `Premium all-in-one Discord bot by **${CREDIT}**.\n` +
      `Use the dropdown below to browse commands, or \`/help [command]\` for details.\n\n` +
      `**Support Server:** [${STATUS}](${SUPPORT_URL})`
    )
    .addFields(
      { name: '📦 Categories', value: categoryLines, inline: false },
      { name: '📊 Stats',      value: `**${totalCmds}** total commands  •  \`/\` slash & \`$\` prefix`, inline: false },
    )
    .setFooter({ text: `${BOT_NAME}  •  ${STATUS}  •  by ${CREDIT}` })
    .setTimestamp();
}
