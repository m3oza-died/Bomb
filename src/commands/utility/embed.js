const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  ComponentType,
} = require('discord.js');
const embeds = require('../../utils/embeds');
const C      = require('../../utils/colors');
const { EMBED_FOOTER } = require('../../config');

module.exports = {
  aliases : ['embed', 'embedbuilder'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('🎨 Build and send a custom embed')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addChannelOption((o) =>
      o.setName('channel')
        .setDescription('Channel to send the embed to (defaults to current)')
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('channel') ?? interaction.channel;

    // Open modal for basic embed fields
    const modal = new ModalBuilder()
      .setCustomId('embed_builder_modal')
      .setTitle('⚡ Devmux Embed Builder');

    const titleInput = new TextInputBuilder()
      .setCustomId('embed_title')
      .setLabel('Title')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(256);

    const descInput = new TextInputBuilder()
      .setCustomId('embed_description')
      .setLabel('Description')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setMaxLength(4000);

    const colorInput = new TextInputBuilder()
      .setCustomId('embed_color')
      .setLabel('Color (hex, e.g. #7C3AED)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(7)
      .setPlaceholder('#7C3AED');

    const imageInput = new TextInputBuilder()
      .setCustomId('embed_image')
      .setLabel('Image URL (optional)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const footerInput = new TextInputBuilder()
      .setCustomId('embed_footer')
      .setLabel('Footer text (optional)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(2048);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descInput),
      new ActionRowBuilder().addComponents(colorInput),
      new ActionRowBuilder().addComponents(imageInput),
      new ActionRowBuilder().addComponents(footerInput),
    );

    await interaction.showModal(modal);

    // Await the modal submission
    const submitted = await interaction.awaitModalSubmit({
      filter : (i) => i.customId === 'embed_builder_modal' && i.user.id === interaction.user.id,
      time   : 5 * 60_000,
    }).catch(() => null);

    if (!submitted) return;

    const title       = submitted.fields.getTextInputValue('embed_title')       || null;
    const description = submitted.fields.getTextInputValue('embed_description') || null;
    const colorStr    = submitted.fields.getTextInputValue('embed_color')       || '#7C3AED';
    const imageUrl    = submitted.fields.getTextInputValue('embed_image')       || null;
    const footerText  = submitted.fields.getTextInputValue('embed_footer')      || null;

    const color = colorStr.startsWith('#')
      ? parseInt(colorStr.replace('#', ''), 16)
      : C.PRIMARY;

    const builtEmbed = new EmbedBuilder().setColor(isNaN(color) ? C.PRIMARY : color).setTimestamp();
    if (title)       builtEmbed.setTitle(title);
    if (description) builtEmbed.setDescription(description);
    if (imageUrl)    builtEmbed.setImage(imageUrl);
    if (footerText)  builtEmbed.setFooter({ text: footerText });
    else             builtEmbed.setFooter({ text: EMBED_FOOTER });

    // Preview
    const previewRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('embed_send').setLabel('✅ Send').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('embed_cancel').setLabel('❌ Cancel').setStyle(ButtonStyle.Danger),
    );

    await submitted.reply({
      content   : `**Preview** — sending to ${targetChannel}:`,
      embeds    : [builtEmbed],
      components: [previewRow],
      ephemeral : true,
    });

    const collector = submitted.channel?.createMessageComponentCollector({
      componentType : ComponentType.Button,
      filter        : (i) => ['embed_send', 'embed_cancel'].includes(i.customId) && i.user.id === interaction.user.id,
      time          : 60_000,
      max           : 1,
    });

    collector?.on('collect', async (btnInt) => {
      if (btnInt.customId === 'embed_send') {
        await targetChannel.send({ embeds: [builtEmbed] });
        await btnInt.update({ content: `✅ Embed sent to ${targetChannel}!`, embeds: [], components: [] });
      } else {
        await btnInt.update({ content: '❌ Cancelled.', embeds: [], components: [] });
      }
    });
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Manage Messages`.')] });
    message.reply({ embeds: [embeds.info('Use Slash Command', 'The embed builder requires `/embed` (slash command) for the interactive modal.')] });
  },
};
