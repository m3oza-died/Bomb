const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

const MODES = { off: 0, song: 1, queue: 2 };
const LABELS = ['Off', 'Song', 'Queue'];
const EMOJIS = ['❌', '🔂', '🔁'];

module.exports = {
  aliases : ['loop', 'repeat'],
  cooldown: 2,

  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('🔁 Set loop mode for the queue')
    .addStringOption((o) =>
      o.setName('mode')
        .setDescription('Loop mode')
        .setRequired(true)
        .addChoices(
          { name: '❌ Off',   value: 'off'   },
          { name: '🔂 Song',  value: 'song'  },
          { name: '🔁 Queue', value: 'queue' },
        )
    ),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guild);
    if (!queue) return interaction.reply({ embeds: [embeds.error('No Queue', 'Nothing is playing!')], ephemeral: true });

    const mode = MODES[interaction.options.getString('mode')];
    queue.setRepeatMode(mode);

    await interaction.reply({
      embeds: [embeds.music('Loop Updated', `Loop mode set to **${EMOJIS[mode]} ${LABELS[mode]}**.`)],
    });
  },

  async prefixExecute(message, args, client) {
    const queue = client.distube.getQueue(message.guild);
    if (!queue) return message.reply({ embeds: [embeds.error('No Queue', 'Nothing is playing!')] });

    const next = (queue.repeatMode + 1) % 3;
    queue.setRepeatMode(next);
    message.reply({ embeds: [embeds.music('Loop', `Loop mode: **${EMOJIS[next]} ${LABELS[next]}**`)] });
  },
};
