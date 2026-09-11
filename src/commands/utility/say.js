const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  aliases : ['say', 'echo'],
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('📢 Make the bot send a message')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption((o) => o.setName('message').setDescription('The message to send').setRequired(true))
    .addChannelOption((o) => o.setName('channel').setDescription('Target channel (defaults to current)').addChannelTypes(ChannelType.GuildText)),

  async execute(interaction) {
    const message = interaction.options.getString('message');
    const channel = interaction.options.getChannel('channel') ?? interaction.channel;

    await channel.send(message);
    await interaction.reply({ embeds: [embeds.success('Sent!', `Message delivered to ${channel}.`)], ephemeral: true });
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Manage Messages`.')] });

    const content = args.join(' ');
    if (!content) return message.reply({ embeds: [embeds.error('Missing', 'Provide a message to send.')] });

    await message.delete().catch(() => {});
    await message.channel.send(content);
  },
};
