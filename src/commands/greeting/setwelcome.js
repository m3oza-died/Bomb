const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const embeds = require('../../utils/embeds');
const db     = require('../../utils/database');

module.exports = {
  aliases : ['setwelcome', 'welcomeset'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('👋 Configure the welcome message system')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName('set')
        .setDescription('Set up the welcome channel and message')
        .addChannelOption((o) => o.setName('channel').setDescription('Welcome channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
        .addStringOption((o) => o.setName('message').setDescription('Welcome message — use {user}, {username}, {server}, {count}'))
        .addStringOption((o) => o.setName('title').setDescription('Embed title'))
        .addRoleOption((o) => o.setName('autorole').setDescription('Role to give on join'))
        .addStringOption((o) => o.setName('banner').setDescription('Banner image URL'))
    )
    .addSubcommand((sub) =>
      sub.setName('disable')
        .setDescription('Disable the welcome system')
    )
    .addSubcommand((sub) =>
      sub.setName('test')
        .setDescription('Send a test welcome message')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'set') {
      const channel = interaction.options.getChannel('channel');
      const message = interaction.options.getString('message') ?? null;
      const title   = interaction.options.getString('title')   ?? null;
      const role    = interaction.options.getRole('autorole')  ?? null;
      const banner  = interaction.options.getString('banner')  ?? null;

      db.setWelcome(interaction.guild.id, {
        channelId : channel.id,
        message,
        title,
        roleId    : role?.id ?? null,
        bannerUrl : banner,
      });

      await interaction.reply({
        embeds: [
          embeds.success('Welcome System Configured', `Welcome messages will be sent to ${channel}.`)
            .addFields(
              { name: '📢 Channel',   value: `${channel}`,                            inline: true },
              { name: '🎭 Auto Role', value: role ? `${role}` : 'None',              inline: true },
              { name: '🖼️ Banner',   value: banner ? '[Set]' : 'None',              inline: true },
              { name: '📝 Variables', value: '`{user}` `{username}` `{server}` `{count}` `{tag}`', inline: false },
            ),
        ],
      });
    }

    if (sub === 'disable') {
      db.setWelcome(interaction.guild.id, { channelId: null });
      await interaction.reply({ embeds: [embeds.warn('Welcome Disabled', 'Welcome messages have been turned off.')] });
    }

    if (sub === 'test') {
      const cfg = db.getWelcome(interaction.guild.id);
      if (!cfg?.channelId) return interaction.reply({ embeds: [embeds.error('Not Configured', 'Run `/setwelcome set` first.')], ephemeral: true });

      // Trigger the event manually
      interaction.client.emit('guildMemberAdd', interaction.member);
      await interaction.reply({ embeds: [embeds.info('Test Sent', 'A test welcome message was triggered.')], ephemeral: true });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Manage Server`.')] });

    const channel = message.mentions.channels.first();
    const msg     = args.slice(1).join(' ') || null;
    if (!channel) return message.reply({ embeds: [embeds.error('Missing', 'Mention a channel.')] });

    db.setWelcome(message.guild.id, { channelId: channel.id, message: msg });
    message.reply({ embeds: [embeds.success('Welcome Set', `Welcome messages → ${channel}`)] });
  },
};
