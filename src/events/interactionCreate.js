const { Collection } = require('discord.js');
const embeds = require('../utils/embeds');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    // ── Slash Commands ──────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      // Cooldown
      if (!client.cooldowns.has(command.data.name))
        client.cooldowns.set(command.data.name, new Collection());

      const now        = Date.now();
      const timestamps = client.cooldowns.get(command.data.name);
      const amount     = (command.cooldown ?? 3) * 1_000;

      if (timestamps.has(interaction.user.id)) {
        const expiry = timestamps.get(interaction.user.id) + amount;
        if (now < expiry) {
          const left = ((expiry - now) / 1_000).toFixed(1);
          return interaction.reply({
            embeds: [embeds.warn('Cooldown', `Wait **${left}s** before using \`/${command.data.name}\` again.`)],
            ephemeral: true,
          });
        }
      }

      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), amount);

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`[CMD ERROR] /${interaction.commandName}:`, err);
        const e = embeds.error('Error', 'Something went wrong running that command.');
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [e], ephemeral: true }).catch(() => {});
        } else {
          await interaction.reply({ embeds: [e], ephemeral: true }).catch(() => {});
        }
      }
      return;
    }

    // ── Buttons ─────────────────────────────────────────────────────────────
    if (interaction.isButton()) {
      const { customId } = interaction;

      // Ticket panel
      if (customId === 'devmux_ticket_open') {
        const { createTicket } = require('../commands/tickets/setupticket');
        return createTicket(interaction, client);
      }
      if (customId === 'devmux_ticket_close') {
        const { closeTicket } = require('../commands/tickets/closeticket');
        return closeTicket(interaction, client);
      }

      // JTC buttons
      if (customId.startsWith('jtc_')) {
        const { handleJTCButton } = require('../commands/jtc/setupjtc');
        return handleJTCButton(interaction, client);
      }
    }

    // ── Modals ───────────────────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      const { customId } = interaction;

      if (customId.startsWith('jtc_modal_')) {
        const { handleJTCModal } = require('../commands/jtc/setupjtc');
        return handleJTCModal(interaction, client);
      }
    }
  },
};
