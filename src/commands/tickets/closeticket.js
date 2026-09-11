const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  AttachmentBuilder,
} = require('discord.js');
const embeds = require('../../utils/embeds');
const db     = require('../../utils/database');
const { EMBED_FOOTER } = require('../../config');

module.exports = {
  aliases : ['closeticket', 'close'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('closeticket')
    .setDescription('🔒 Close the current support ticket')
    .addStringOption((o) => o.setName('reason').setDescription('Reason for closing')),

  async execute(interaction) {
    const ticket = db.getOpenTicket(interaction.guild.id, interaction.channel.id);
    if (!ticket)
      return interaction.reply({ embeds: [embeds.error('Not a Ticket', 'This command can only be used inside a ticket channel.')], ephemeral: true });

    const reason = interaction.options.getString('reason') ?? 'No reason provided';
    await closeTicketChannel(interaction, reason);
  },

  async prefixExecute(message, args) {
    const ticket = db.getOpenTicket(message.guild.id, message.channel.id);
    if (!ticket) return message.reply({ embeds: [embeds.error('Not a Ticket', 'This is not a ticket channel.')] });
    await closeTicketChannel(message, args.join(' ') || 'No reason provided');
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  Shared close logic — used by slash, prefix, AND button
// ─────────────────────────────────────────────────────────────────────────────
async function closeTicket(interaction, client) {
  const guildId   = interaction.guild.id;
  const channelId = interaction.channel.id;
  const ticket    = db.getOpenTicket(guildId, channelId);

  if (!ticket)
    return interaction.reply({ embeds: [embeds.error('Not a Ticket', 'This is not a ticket channel.')], ephemeral: true });

  await closeTicketChannel(interaction, 'Closed via button');
}

async function closeTicketChannel(ctx, reason) {
  const isInteraction = !!ctx.deferReply;
  const guild   = ctx.guild;
  const channel = ctx.channel;
  const closer  = isInteraction ? ctx.user : ctx.author;

  // Build transcript
  const messages = await channel.messages.fetch({ limit: 100 });
  const transcript = [...messages.values()]
    .reverse()
    .map((m) => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author.tag}: ${m.content || '[embed/attachment]'}`)
    .join('\n');

  const buffer  = Buffer.from(transcript, 'utf8');
  const attach  = new AttachmentBuilder(buffer, { name: `transcript-${channel.name}.txt` });

  const cfg         = db.getTicketConfig(guild.id);
  const openedById  = db.getOpenTicket(guild.id, channel.id)?.userId;
  const opener      = openedById ? await guild.members.fetch(openedById).catch(() => null) : null;

  // DM transcript to ticket opener
  if (opener) {
    await opener.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x6366F1)
          .setTitle('🎫  Your Ticket Was Closed')
          .addFields(
            { name: '📝 Reason', value: reason },
            { name: '🔒 Closed by', value: closer.tag },
          )
          .setFooter({ text: EMBED_FOOTER }),
      ],
      files: [attach],
    }).catch(() => {});
  }

  // Notify in channel then delete
  const closeEmbed = new EmbedBuilder()
    .setColor(0xEF4444)
    .setTitle('🔒  Ticket Closed')
    .setDescription(`This ticket is being closed.\n**Reason:** ${reason}`)
    .addFields({ name: '🔒 Closed by', value: closer.tag, inline: true })
    .setFooter({ text: EMBED_FOOTER })
    .setTimestamp();

  if (isInteraction) {
    await ctx.reply({ embeds: [closeEmbed] }).catch(() => {});
  } else {
    await channel.send({ embeds: [closeEmbed] }).catch(() => {});
  }

  db.removeOpenTicket(guild.id, channel.id);

  setTimeout(() => channel.delete().catch(() => {}), 5_000);
}

module.exports.closeTicket       = closeTicket;
module.exports.closeTicketChannel = closeTicketChannel;
