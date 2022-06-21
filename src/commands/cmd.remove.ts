import { SlashCommandBuilder } from '@discordjs/builders'
import { ChannelType } from 'discord-api-types/v10'
import { CommandInteraction } from 'discord.js'
import App from '..'
import prisma from '../prisma'

export default {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove from blacklist')
    .setDMPermission(false)
    .setDefaultMemberPermissions(8)
    .addSubcommand(s => s
      .setName('user')
      .setDescription('Remove a user from a blacklist')
      .addStringOption((op) => op
        .setName('id')
        .setDescription('The user\'s snowflake ID')
        .setRequired(true)
      )
    )

  ,	async execute(app: App, interaction: CommandInteraction) {
    const subcommand = interaction.options.getSubcommand()
    if (!subcommand) return interaction.reply('You must specify a subcommand.')
    if (subcommand === 'user') {
      const id = interaction.options.getString('id')
      if (!id) return interaction.reply('You must specify a user ID.')
      const blacklist = await prisma.blacklist.findFirst({
        where: {
          controllers: {
            has: interaction.guildId
          }
        }
      })
      await prisma.user.delete({
        where: {
          id_blacklistId: {
            blacklistId: blacklist?.id!,
            id
          }
        }
      })
      return interaction.reply(`Set ${subcommand} action to ${id}`)
    }
	},
};
