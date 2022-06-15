import { ContextMenuCommandBuilder } from '@discordjs/builders'
import { ApplicationCommandType } from 'discord-api-types/v10';
import { CommandInteraction } from 'discord.js'
import App from '..';
import prisma from '../prisma';

export default {
	data: new ContextMenuCommandBuilder()
		.setName('Blacklist Scammer')
    .setType(ApplicationCommandType.Message)
    .setDefaultMemberPermissions(8)
    .setDMPermission(false),
	async execute(app: App, interaction: CommandInteraction) {
    if (!interaction.isMessageContextMenu()) return interaction.reply('This command can only be used in a context menu.')

    const urls = interaction.targetMessage.content.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g)
    const domains = urls?.map(url => [...url.matchAll(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img)][0][1])
    const blacklist = await prisma.blacklist.findFirst({
      where: {
        controllers: { has: interaction.guildId }
      }
    })
    if (!blacklist) return interaction.reply({ephemeral: true, content: 'This guild is not a controller of a blacklist. No blacklist to add to.'})

    prisma.blacklist.update({
      where: {
        id: blacklist.id
      },
      data: {
        users: {
          connectOrCreate: {
            where: {
              id: interaction.targetMessage.author.id
            },
            create: {
              id: interaction.targetMessage.author.id,
              reporter: interaction.member?.user.id || 'Unknown',
              type: 'SCAMMER',
            }
          }
        },
        domains: {
          connectOrCreate: domains?.map(domain => ({
            where: {
              value: domain
            },
            create: {
              value: domain,
              message: interaction.targetMessage.content,
              reporter: interaction.member?.user.id || 'Unknown',
            }
          }))
        }
      }
    }).then(() => {
      interaction.reply({ephemeral: true, content: 'Blacklisted.'})
      app.blacklisted(interaction.targetMessage.author.id)
    })
    .catch(err => {
      interaction.reply({ephemeral: true, content: 'Failed to blacklist.'})
      console.error(err)
    })
  },
};
