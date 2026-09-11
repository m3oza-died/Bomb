const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const embeds = require('../../utils/embeds');
const db     = require('../../utils/database');

module.exports = {
  aliases : ['setleave', 'leaveset'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('setleave')
    .setDescription('🚪 Configure the leave message system')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName('set')
        .setDescription('Set up the leave channel and message')
        .addChannelOption((o) => o.setName('channel').setDescription('Leave message channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
        .addStringOption((o) => o.setName('message').setDescription('Leave message — use {user}, {username}, {server}, {count}'))
        .addStringOption((o) => o.setName('title').setDescription('Embed title'))
    )
    .addSubcommand((sub) => sub.setName('disable').setDescription('Disable the leave system'))
    .addSubcommand((sub) => sub.setName('test').setDescription('Send a test leave message')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const channel = interaction.options.getChannel('channel');
      const message = interaction.options.getString('message') ?? null;
      const title   = interaction.options.getString('title')   ?? null;

      db.setLeave(interaction.guild.id, { channelId: channel.id, message, title });

      await interaction.reply({
        embeds: [
          embeds.success('Leave System Configured', `Leave messages will be sent to ${channel}.`)
            .addFields(
              { name: '📢 Channel',   value: `${channel}`,                                         inline: true },
              { name: '📝 Variables', value: '`{user}` `{username}` `{server}` `{count}` `{tag}`', inline: false },
            ),
        ],
      });
    }

    if (sub === 'disable') {
      db.setLeave(interaction.guild.id, { channelId: null });
      await interaction.reply({ embeds: [embeds.warn('Leave Disabled', 'Leave messages have been turned off.')] });
    }

    if (sub === 'test') {
      const cfg = db.getLeave(interaction.guild.id);
      if (!cfg?.channelId) return interaction.reply({ embeds: [embeds.error('Not Configured', 'Run `/setleave set` first.')], ephemeral: true });
      interaction.client.emit('guildMemberRemove', interaction.member);
      await interaction.reply({ embeds: [embeds.info('Test Sent', 'A test leave message was triggered.')], ephemeral: true });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Manage Server`.')] });

    const channel = message.mentions.channels.first();
    const msg     = args.slice(1).join(' ') || null;
    if (!channel) return message.reply({ embeds: [embeds.error('Missing', 'Mention a channel.')] });

    db.setLeave(message.guild.id, { channelId: channel.id, message: msg });
    message.reply({ embeds: [embeds.success('Leave Set', `Leave messages → ${channel}`)] });
  },
};
