const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} = require('discord.js');
const embeds = require('../../utils/embeds');
const db     = require('../../utils/database');
const { EMBED_FOOTER } = require('../../config');

// ─────────────────────────────────────────────────────────────────────────────
//  Slash Command
// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  aliases : ['setupjtc', 'jtcsetup', 'jointocreateset'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('setupjtc')
    .setDescription('🎙️ Configure the Join-To-Create voice channel system')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addSubcommand((sub) =>
      sub.setName('setup')
        .setDescription('Set up the JTC trigger channel')
        .addChannelOption((o) => o.setName('channel').setDescription('The "Join to Create" voice channel').setRequired(true).addChannelTypes(ChannelType.GuildVoice))
        .addIntegerOption((o) => o.setName('defaultlimit').setDescription('Default user limit (0 = unlimited)').setMinValue(0).setMaxValue(99))
        .addChannelOption((o) => o.setName('panelchannel').setDescription('Text channel to send the control panel (optional)').addChannelTypes(ChannelType.GuildText))
    )
    .addSubcommand((sub) => sub.setName('disable').setDescription('Disable the JTC system'))
    .addSubcommand((sub) => sub.setName('info').setDescription('Show current JTC configuration')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const channel      = interaction.options.getChannel('channel');
      const defaultLimit = interaction.options.getInteger('defaultlimit') ?? 0;
      const panelChannel = interaction.options.getChannel('panelchannel') ?? null;

      db.setJTC(interaction.guild.id, {
        channelId      : channel.id,
        defaultLimit,
        panelChannelId : panelChannel?.id ?? null,
      });

      await interaction.reply({
        embeds: [
          embeds.jtc('JTC System Ready', `Join **${channel.name}** to automatically create your own voice channel!`)
            .addFields(
              { name: '🎙️ Trigger Channel', value: `${channel}`,                                      inline: true },
              { name: '👥 Default Limit',   value: defaultLimit ? `${defaultLimit}` : 'Unlimited',    inline: true },
              { name: '📋 Panel Channel',   value: panelChannel ? `${panelChannel}` : 'DM (fallback)', inline: true },
            ),
        ],
      });
    }

    if (sub === 'disable') {
      db.setJTC(interaction.guild.id, { channelId: null });
      await interaction.reply({ embeds: [embeds.warn('JTC Disabled', 'Join-to-Create has been turned off.')] });
    }

    if (sub === 'info') {
      const cfg = db.getJTC(interaction.guild.id);
      if (!cfg?.channelId)
        return interaction.reply({ embeds: [embeds.info('Not Configured', 'Run `/setupjtc setup` to get started.')], ephemeral: true });

      const triggerCh = interaction.guild.channels.cache.get(cfg.channelId);
      const panelCh   = cfg.panelChannelId ? interaction.guild.channels.cache.get(cfg.panelChannelId) : null;
      const active    = cfg.active ? Object.keys(cfg.active).length : 0;

      await interaction.reply({
        embeds: [
          embeds.jtc('JTC Configuration', 'Current Join-To-Create setup for this server.')
            .addFields(
              { name: '🎙️ Trigger Channel', value: triggerCh ? `${triggerCh}` : '⚠️ Deleted', inline: true },
              { name: '👥 Default Limit',   value: cfg.defaultLimit ? `${cfg.defaultLimit}` : 'Unlimited', inline: true },
              { name: '📋 Panel Channel',   value: panelCh ? `${panelCh}` : 'DM',            inline: true },
              { name: '🔊 Active VCs',      value: `${active}`,                               inline: true },
            ),
        ],
        ephemeral: true,
      });
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  JTC Button Handler
// ─────────────────────────────────────────────────────────────────────────────
async function handleJTCButton(interaction, client) {
  const { customId, member, guild } = interaction;

  // Resolve which VC this user owns
  const cfg       = db.getJTC(guild.id);
  const allActive = cfg?.active ?? {};
  const ownedId   = Object.keys(allActive).find((id) => allActive[id].ownerId === member.id);
  const vc        = ownedId ? guild.channels.cache.get(ownedId) : null;

  // For claim — anyone can attempt
  if (customId === 'jtc_claim') {
    const userVC = member.voice?.channel;
    if (!userVC) return interaction.reply({ content: '❌ You must be in a voice channel to claim it.', ephemeral: true });

    const channelData = db.getJTCChannel(guild.id, userVC.id);
    if (!channelData)  return interaction.reply({ content: '❌ That is not a JTC channel.', ephemeral: true });

    // Check if owner is still in the VC
    const ownerInVC = userVC.members.has(channelData.ownerId);
    if (ownerInVC)     return interaction.reply({ content: '❌ The owner is still in the channel.', ephemeral: true });

    // Transfer ownership
    const { active } = db.getJTC(guild.id);
    active[userVC.id].ownerId = member.id;
    db.setJTC(guild.id, { active });

    await userVC.permissionOverwrites.edit(member.id, {
      ManageChannels: true,
      MoveMembers   : true,
      MuteMembers   : true,
    });

    return interaction.reply({ content: `👑 You now own **${userVC.name}**!`, ephemeral: true });
  }

  // All other actions require ownership
  if (!vc) {
    return interaction.reply({ content: '❌ You do not own a JTC channel right now. Join the trigger channel to create one.', ephemeral: true });
  }

  switch (customId) {
    case 'jtc_rename': {
      const modal = new ModalBuilder().setCustomId('jtc_modal_rename').setTitle('Rename Your Channel');
      modal.addComponents(new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('jtc_new_name')
          .setLabel('New channel name')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
          .setPlaceholder(vc.name),
      ));
      return interaction.showModal(modal);
    }

    case 'jtc_limit': {
      const modal = new ModalBuilder().setCustomId('jtc_modal_limit').setTitle('Set User Limit');
      modal.addComponents(new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('jtc_limit_val')
          .setLabel('User limit (0 = unlimited, max 99)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(2)
          .setPlaceholder('0'),
      ));
      return interaction.showModal(modal);
    }

    case 'jtc_lock':
      await vc.permissionOverwrites.edit(guild.roles.everyone, { Connect: false });
      return interaction.reply({ content: `🔒 **${vc.name}** is now locked.`, ephemeral: true });

    case 'jtc_unlock':
      await vc.permissionOverwrites.edit(guild.roles.everyone, { Connect: null });
      return interaction.reply({ content: `🔓 **${vc.name}** is now unlocked.`, ephemeral: true });

    case 'jtc_hide':
      await vc.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: false });
      return interaction.reply({ content: `👁️ **${vc.name}** is now hidden.`, ephemeral: true });

    case 'jtc_show':
      await vc.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: null });
      return interaction.reply({ content: `🔭 **${vc.name}** is now visible.`, ephemeral: true });

    case 'jtc_kick': {
      const modal = new ModalBuilder().setCustomId('jtc_modal_kick').setTitle('Kick User from VC');
      modal.addComponents(new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('jtc_kick_id')
          .setLabel('User ID to kick from the VC')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(20),
      ));
      return interaction.showModal(modal);
    }

    default:
      return interaction.reply({ content: '❓ Unknown action.', ephemeral: true });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  JTC Modal Handler
// ─────────────────────────────────────────────────────────────────────────────
async function handleJTCModal(interaction, client) {
  const { customId, member, guild } = interaction;

  const cfg       = db.getJTC(guild.id);
  const allActive = cfg?.active ?? {};
  const ownedId   = Object.keys(allActive).find((id) => allActive[id].ownerId === member.id);
  const vc        = ownedId ? guild.channels.cache.get(ownedId) : null;

  if (!vc) return interaction.reply({ content: '❌ Could not find your VC.', ephemeral: true });

  if (customId === 'jtc_modal_rename') {
    const newName = interaction.fields.getTextInputValue('jtc_new_name');
    await vc.setName(newName);
    return interaction.reply({ content: `✏️ Channel renamed to **${newName}**.`, ephemeral: true });
  }

  if (customId === 'jtc_modal_limit') {
    const limit = parseInt(interaction.fields.getTextInputValue('jtc_limit_val'));
    if (isNaN(limit) || limit < 0 || limit > 99)
      return interaction.reply({ content: '❌ Invalid limit. Must be 0–99.', ephemeral: true });
    await vc.setUserLimit(limit);
    return interaction.reply({ content: `👥 Limit set to **${limit || 'Unlimited'}**.`, ephemeral: true });
  }

  if (customId === 'jtc_modal_kick') {
    const userId = interaction.fields.getTextInputValue('jtc_kick_id').trim();
    const target = vc.members.get(userId);
    if (!target) return interaction.reply({ content: '❌ That user is not in your channel.', ephemeral: true });
    await target.voice.disconnect();
    return interaction.reply({ content: `👢 **${target.user.tag}** has been kicked from the VC.`, ephemeral: true });
  }
}

module.exports.handleJTCButton = handleJTCButton;
module.exports.handleJTCModal  = handleJTCModal;
