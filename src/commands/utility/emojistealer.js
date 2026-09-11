const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../../utils/embeds');

const CUSTOM_EMOJI = /<a?:(\w{2,32}):(\d{17,20})>/;

module.exports = {
  aliases : ['emojistealer', 'steal', 'stealemoji', 'addemoji'],
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName('emojistealer')
    .setDescription('😄 Steal an emoji from another server and add it here')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers)
    .addStringOption((o) => o.setName('emoji').setDescription('The custom emoji to steal (paste it here)').setRequired(true))
    .addStringOption((o) => o.setName('name').setDescription('Custom name for the emoji (optional)')),

  async execute(interaction) {
    const input = interaction.options.getString('emoji');
    const match = input.match(CUSTOM_EMOJI);

    if (!match)
      return interaction.reply({ embeds: [embeds.error('Invalid Emoji', 'Provide a custom Discord emoji like `<:name:id>`.')], ephemeral: true });

    const [, emojiName, emojiId] = match;
    const animated  = input.startsWith('<a:');
    const finalName = interaction.options.getString('name') ?? emojiName;
    const url       = `https://cdn.discordapp.com/emojis/${emojiId}.${animated ? 'gif' : 'png'}?size=128&quality=lossless`;

    await interaction.deferReply();

    try {
      const created = await interaction.guild.emojis.create({
        attachment : url,
        name       : finalName.replace(/\s+/g, '_').slice(0, 32),
      });

      await interaction.editReply({
        embeds: [
          embeds.success('Emoji Stolen!', `${created} **\`${created.name}\`** has been added to this server!`)
            .setThumbnail(url)
            .addFields(
              { name: '🆔 ID',       value: created.id,           inline: true },
              { name: '📛 Name',     value: created.name,          inline: true },
              { name: '✨ Animated', value: animated ? 'Yes' : 'No', inline: true },
            ),
        ],
      });
    } catch (err) {
      await interaction.editReply({ embeds: [embeds.error('Failed', `Could not add the emoji: ${err.message}`)] });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers))
      return message.reply({ embeds: [embeds.error('No Permission', 'You need `Manage Emojis`.')] });

    const input = args[0];
    const match = input?.match(CUSTOM_EMOJI);
    if (!match) return message.reply({ embeds: [embeds.error('Invalid', 'Provide a custom emoji.')] });

    const [, emojiName, emojiId] = match;
    const animated = input.startsWith('<a:');
    const url      = `https://cdn.discordapp.com/emojis/${emojiId}.${animated ? 'gif' : 'png'}`;

    try {
      const created = await message.guild.emojis.create({ attachment: url, name: args[1] ?? emojiName });
      message.reply({ embeds: [embeds.success('Emoji Added', `${created} \`${created.name}\` added!`)] });
    } catch (err) {
      message.reply({ embeds: [embeds.error('Failed', err.message)] });
    }
  },
};
