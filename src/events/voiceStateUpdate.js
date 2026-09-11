const {
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');
const db = require('../utils/database');
const C  = require('../utils/colors');
const { EMBED_FOOTER } = require('../config');

module.exports = {
  name: 'voiceStateUpdate',

  async execute(oldState, newState, client) {
    const guild = newState.guild ?? oldState.guild;
    const cfg   = db.getJTC(guild.id);
    if (!cfg?.channelId) return;

    // ── User joined the JTC "trigger" channel ─────────────────────────────
    if (newState.channelId === cfg.channelId) {
      const member   = newState.member;
      const parent   = newState.channel?.parentId ?? null;

      try {
        const vc = await guild.channels.create({
          name   : `${member.displayName}'s VC`,
          type   : ChannelType.GuildVoice,
          parent,
          userLimit  : cfg.defaultLimit ?? 0,
          permissionOverwrites: [
            {
              id   : member.id,
              allow: [
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.MoveMembers,
                PermissionFlagsBits.MuteMembers,
                PermissionFlagsBits.DeafenMembers,
              ],
            },
          ],
        });

        await member.voice.setChannel(vc);
        db.addJTCChannel(guild.id, vc.id, member.id);

        // ── Control panel embed ──────────────────────────────────────────
        const embed = new EmbedBuilder()
          .setColor(C.JTC)
          .setTitle('🎙️  Voice Channel Panel')
          .setDescription(`Your private VC is ready, **${member.displayName}**!\nCustomize it below.`)
          .addFields(
            { name: '🔊 Channel',  value: `${vc}`,                                       inline: true },
            { name: '👑 Owner',   value: `${member}`,                                    inline: true },
            { name: '👥 Limit',   value: cfg.defaultLimit ? `${cfg.defaultLimit}` : '∞', inline: true },
          )
          .setFooter({ text: EMBED_FOOTER })
          .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('jtc_rename').setLabel('Rename').setEmoji('✏️').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('jtc_limit').setLabel('Limit').setEmoji('👥').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('jtc_lock').setLabel('Lock').setEmoji('🔒').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId('jtc_unlock').setLabel('Unlock').setEmoji('🔓').setStyle(ButtonStyle.Success),
        );
        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('jtc_hide').setLabel('Hide').setEmoji('👁️').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('jtc_show').setLabel('Show').setEmoji('🔭').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('jtc_claim').setLabel('Claim').setEmoji('👑').setStyle(ButtonStyle.Warning),
          new ButtonBuilder().setCustomId('jtc_kick').setLabel('Kick User').setEmoji('👢').setStyle(ButtonStyle.Danger),
        );

        // Send panel to configured panel channel or DM owner
        if (cfg.panelChannelId) {
          const panelCh = guild.channels.cache.get(cfg.panelChannelId);
          if (panelCh) {
            const msg = await panelCh.send({ content: `${member}`, embeds: [embed], components: [row1, row2] });
            setTimeout(() => msg.delete().catch(() => {}), 5 * 60_000);
          }
        } else {
          await member.send({ embeds: [embed], components: [row1, row2] }).catch(() => {});
        }
      } catch (err) {
        console.error('[JTC] Create error:', err.message);
      }
    }

    // ── User left a JTC-managed channel ───────────────────────────────────
    if (oldState.channelId && db.isJTCChannel(guild.id, oldState.channelId)) {
      const ch = oldState.channel;
      if (ch && ch.members.size === 0) {
        await ch.delete().catch(() => {});
        db.removeJTCChannel(guild.id, oldState.channelId);
      }
    }
  },
};
