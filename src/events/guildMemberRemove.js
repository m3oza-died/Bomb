const { EmbedBuilder } = require('discord.js');
const db      = require('../utils/database');
const C       = require('../utils/colors');
const { EMBED_FOOTER } = require('../config');

module.exports = {
  name: 'guildMemberRemove',

  async execute(member, client) {
    const cfg = db.getLeave(member.guild.id);
    if (!cfg?.channelId) return;

    const channel = member.guild.channels.cache.get(cfg.channelId);
    if (!channel) return;

    const parse = (str) =>
      (str || '👋 **{username}** has left the server. We now have **{count}** members.')
        .replace(/{user}/g,     `<@${member.id}>`)
        .replace(/{username}/g, member.user.username)
        .replace(/{tag}/g,      member.user.tag)
        .replace(/{server}/g,   member.guild.name)
        .replace(/{count}/g,    member.guild.memberCount.toLocaleString());

    const embed = new EmbedBuilder()
      .setColor(cfg.color ?? C.ERROR)
      .setTitle(cfg.title ?? '👋  Goodbye!')
      .setDescription(parse(cfg.message))
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '📅 Joined',    value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1_000)}:R>` : 'Unknown', inline: true },
        { name: '👥 Now at',   value: `${member.guild.memberCount.toLocaleString()} members`,                                 inline: true },
      )
      .setFooter({ text: EMBED_FOOTER })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  },
};
