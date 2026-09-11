const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['purge', 'prune', 'clear'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('🗑️ Bulk delete messages from this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((o) => o.setName('amount').setDescription('Number of messages to delete (1–100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption((o) => o.setName('user').setDescription('Only delete messages from this user')),

  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const filter = interaction.options.getUser('user');

    await interaction.deferReply({ ephemeral: true });

    let messages = await interaction.channel.messages.fetch({ limit: 100 });

    if (filter) messages = messages.filter((m) => m.author.id === filter.id);

    const toDelete = [...messages.values()].slice(0, amount);
    const deleted  = await interaction.channel.bulkDelete(toDelete, true).catch(() => null);

    const count = deleted?.size ?? toDelete.length;
    await interaction.editReply({
      embeds: [
        embeds.success('Messages Cleared', `Deleted **${count}** message(s)${filter ? ` from **${filter.tag}**` : ''}.`),
      ],
    });
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Manage Messages`.')] });

    const amount = Math.min(parseInt(args[0]) || 10, 100);
    await message.delete().catch(() => {});
    const deleted = await message.channel.bulkDelete(amount, true);
    const m = await message.channel.send({ embeds: [embeds.success('Cleared', `Deleted **${deleted.size}** message(s).`)] });
    setTimeout(() => m.delete().catch(() => {}), 3_000);
  },
};
