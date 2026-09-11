const { EmbedBuilder } = require('discord.js');
const db      = require('../utils/database');
const C       = require('../utils/colors');
const { EMBED_FOOTER } = require('../config');

module.exports = {
  name: 'guildMemberAdd',

  async execute(member, client) {
    const cfg = db.getWelcome(member.guild.id);
    if (!cfg?.channelId) return;

    const channel = member.guild.channels.cache.get(cfg.channelId);
    if (!channel) return;

    const parse = (str) =>
      (str || '👋 Welcome {user} to **{server}**! You are member **#{count}**.')
        .replace(/{user}/g,     `<@${member.id}>`)
        .replace(/{username}/g, member.user.username)
        .replace(/{tag}/g,      member.user.tag)
        .replace(/{server}/g,   member.guild.name)
        .replace(/{count}/g,    member.guild.memberCount.toLocaleString());

    const embed = new EmbedBuilder()
      .setColor(cfg.color ?? C.SUCCESS)
      .setTitle(cfg.title ?? `👋  Welcome to ${member.guild.name}!`)
      .setDescription(parse(cfg.message))
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '📅 Account Age', value: `<t:${Math.floor(member.user.createdTimestamp / 1_000)}:R>`, inline: true },
        { name: '👥 Member #',   value: `${member.guild.memberCount.toLocaleString()}`,               inline: true },
      )
      .setFooter({ text: EMBED_FOOTER })
      .setTimestamp();

    if (cfg.bannerUrl) embed.setImage(cfg.bannerUrl);

    await channel.send({ embeds: [embed] });

    // Auto role
    if (cfg.roleId) {
      const role = member.guild.roles.cache.get(cfg.roleId);
      if (role) await member.roles.add(role).catch(() => {});
    }
  },
};
