const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const embeds = require('../../utils/embeds');
const db     = require('../../utils/database');
const C      = require('../../utils/colors');
const { EMBED_FOOTER } = require('../../config');

// ─────────────────────────────────────────────────────────────────────────────
//  Slash command: /setupticket
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  aliases : ['setupticket', 'ticketsetup'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('setupticket')
    .setDescription('🎫 Configure the ticket system')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName('panel')
        .setDescription('Post the ticket creation panel in a channel')
        .addChannelOption((o) => o.setName('channel').setDescription('Where to send the panel').setRequired(true).addChannelTypes(ChannelType.GuildText))
        .addRoleOption((o) => o.setName('supportrole').setDescription('Role that can see tickets').setRequired(true))
        .addChannelOption((o) => o.setName('category').setDescription('Category to create tickets in'))
        .addStringOption((o) => o.setName('title').setDescription('Panel embed title'))
        .addStringOption((o) => o.setName('description').setDescription('Panel embed description'))
    )
    .addSubcommand((sub) => sub.setName('disable').setDescription('Disable the ticket system')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'panel') {
      const channel     = interaction.options.getChannel('channel');
      const supportRole = interaction.options.getRole('supportrole');
      const category    = interaction.options.getChannel('category') ?? null;
      const title       = interaction.options.getString('title')       ?? '🎫  Support Tickets';
      const description = interaction.options.getString('description') ?? 'Click the button below to open a support ticket.\nOur team will assist you as soon as possible.';

      db.setTicketConfig(interaction.guild.id, {
        panelChannelId : channel.id,
        supportRoleId  : supportRole.id,
        categoryId     : category?.id ?? null,
      });

      const panelEmbed = new EmbedBuilder()
        .setColor(C.TICKET)
        .setTitle(title)
        .setDescription(description)
        .addFields(
          { name: '📋 How it works', value: '1. Click **Open Ticket** below\n2. Describe your issue in the new channel\n3. Wait for a staff member to respond' },
        )
        .setFooter({ text: EMBED_FOOTER })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('devmux_ticket_open')
          .setLabel('Open Ticket')
          .setEmoji('🎫')
          .setStyle(ButtonStyle.Primary),
      );

      await channel.send({ embeds: [panelEmbed], components: [row] });

      await interaction.reply({
        embeds: [
          embeds.success('Ticket System Ready', `Panel posted in ${channel}.`)
            .addFields(
              { name: '🎫 Panel',       value: `${channel}`,      inline: true },
              { name: '🛡️ Support Role', value: `${supportRole}`, inline: true },
              { name: '📁 Category',    value: category ? `${category}` : 'None (root)', inline: true },
            ),
        ],
        ephemeral: true,
      });
    }

    if (sub === 'disable') {
      db.setTicketConfig(interaction.guild.id, { panelChannelId: null });
      await interaction.reply({ embeds: [embeds.warn('Tickets Disabled', 'The ticket system has been turned off.')] });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  Button handler: "Open Ticket" button
// ─────────────────────────────────────────────────────────────────────────────
async function createTicket(interaction, client) {
  const cfg = db.getTicketConfig(interaction.guild.id);
  if (!cfg?.supportRoleId) {
    return interaction.reply({ embeds: [embeds.error('Not Configured', 'Ticket system is not set up. Ask an admin to run `/setupticket panel`.')], ephemeral: true });
  }

  // Check if user already has an open ticket
  const existing = [...interaction.guild.channels.cache.values()].find(
    (ch) => ch.name === `ticket-${interaction.user.username.toLowerCase().replace(/\s+/g, '-')}` ||
            db.getOpenTicket(interaction.guild.id, ch.id)?.userId === interaction.user.id
  );
  if (existing) {
    return interaction.reply({ embeds: [embeds.warn('Already Open', `You already have an open ticket: ${existing}`)], ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const ticketNum = db.nextTicketNum(interaction.guild.id);
  const chanName  = `ticket-${String(ticketNum).padStart(4, '0')}-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)}`;

  try {
    const ticketChannel = await interaction.guild.channels.create({
      name   : chanName,
      type   : ChannelType.GuildText,
      parent : cfg.categoryId ?? null,
      topic  : `Ticket #${ticketNum} — opened by ${interaction.user.tag}`,
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id,              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: cfg.supportRoleId,                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages] },
        { id: client.user.id,                   allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
      ],
    });

    db.addOpenTicket(interaction.guild.id, ticketChannel.id, interaction.user.id);

    const ticketEmbed = new EmbedBuilder()
      .setColor(C.TICKET)
      .setTitle(`🎫  Ticket #${ticketNum}`)
      .setDescription(`Welcome, ${interaction.user}!\nDescribe your issue and a staff member will be with you shortly.`)
      .addFields(
        { name: '👤 Opened by', value: `${interaction.user.tag}`, inline: true },
        { name: '📅 Opened at', value: `<t:${Math.floor(Date.now() / 1_000)}:F>`, inline: true },
      )
      .setFooter({ text: EMBED_FOOTER })
      .setTimestamp();

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('devmux_ticket_close')
        .setLabel('Close Ticket')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger),
    );

    await ticketChannel.send({
      content: `${interaction.user} | <@&${cfg.supportRoleId}>`,
      embeds : [ticketEmbed],
      components: [closeRow],
    });

    await interaction.editReply({
      embeds: [embeds.success('Ticket Created', `Your ticket has been opened: ${ticketChannel}`)],
    });
  } catch (err) {
    console.error('[TICKET] Create error:', err);
    await interaction.editReply({ embeds: [embeds.error('Error', 'Failed to create ticket channel.')] });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Export button handlers so interactionCreate can call them
// ─────────────────────────────────────────────────────────────────────────────
module.exports.createTicket = createTicket;
