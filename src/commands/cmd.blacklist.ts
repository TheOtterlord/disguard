import { SlashCommandBuilder } from '@discordjs/builders'
import { UserType } from '@prisma/client'
import { AutocompleteInteraction, CommandInteraction, Interaction, Message } from 'discord.js'
import App from '..'
import prisma from '../prisma'

export default {
	data: new SlashCommandBuilder()
		.setName('blacklist')
		.setDescription('Manage blacklists')
    .setDefaultMemberPermissions(8)
    .setDMPermission(false)
		.addSubcommand(subcommand => subcommand
			.setName('sub')
			.setDescription('Subscribe this guild to a blacklist')
      .addStringOption((op) => op.setName('id').setDescription('Id of the blacklist').setAutocomplete(true).setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('unsub')
			.setDescription('Unsubscribe this guild from a blacklist')
      .addStringOption((op) => op.setName('id').setDescription('Id of the blacklist').setAutocomplete(true).setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('create')
      .setDescription('Create a blacklist with the current guild as the controller')
      .addStringOption((op) => op.setName('name').setDescription('The name of the blacklist').setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('add')
      .setDescription('Add this guild to a blacklist as a controller')
      .addStringOption((op) => op.setName('blacklist').setDescription('The name of the blacklist').setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('user')
      .setDescription('Blacklist a user from this guild\'s blacklist')
      .addUserOption((op) => op.setName('user').setDescription('The user to blacklist').setRequired(true))
      .addStringOption((op) => op.setName('type').setDescription('The type of user (scammer or hacked account)').setChoices({name: 'Scam Account', value: 'SCAMMER'}, {name: 'Hacked Account', value: 'HACKED'}).setRequired(false)))
    , async execute(app: App, interaction: CommandInteraction) {
		try {
      if (!interaction.guild) return interaction.reply('You must be in a server to use this command.')
      if (!interaction.memberPermissions?.has('ADMINISTRATOR')) return interaction.reply('You must be an administrator to use this command.')

			if (interaction.options.getSubcommand() === 'sub') {
        if (interaction.isAutocomplete()) {
          const search = (interaction as AutocompleteInteraction).options.getFocused().toString().toLowerCase()
          return (interaction as AutocompleteInteraction).respond(app.blacklists.map(b => b).filter(b => b.name.toLowerCase().includes(search)).map(b => {return {name: `${b.name} (${b.id})`, value: b.id}}))
        }

        const blacklistId = interaction.options.getString('id')!
        const blacklist = await prisma.blacklist.findUnique({ where: { id: blacklistId } })
        if (!blacklist) return interaction.reply('Blacklist not found.')
        if (blacklist.subscribers.includes(interaction.guild?.id)) return interaction.reply('You are already subscribed to this blacklist.')

        prisma.blacklist.update({
          where: { id: blacklistId },
          data: {
            subscribers: {
              push: interaction.guild?.id,
            },
          },
        }).then(() => {
          interaction.reply(`Subscribed to ${blacklist.name}.`)
          app.log(interaction.guild!, `<@${interaction.user.id}> subscribed this guild to ${blacklist.name}`)
        }).catch(err => {
          interaction.reply(`Error subscribing to ${blacklist.name}`)
          console.error(err)
        })
			} else if (interaction.options.getSubcommand() === 'unsub') {
        const blacklists = await prisma.blacklist.findMany({ where: { subscribers: { has: (interaction as Interaction).guild?.id } } })
        if (interaction.isAutocomplete()) {

          const search = (interaction as AutocompleteInteraction).options.getFocused()
          return (interaction as AutocompleteInteraction).respond(app.blacklists.map(b => b).filter(b => b.name.toLowerCase().includes(search.toString())).map(b => {return {name: `${b.name} (${b.id})`, value: b.id}}))
        }
        
        const blacklistId = interaction.options.getString('id')!
        prisma.blacklist.update({
          where: { id: blacklistId },
          data: {
            subscribers: {
              set: blacklists.find(b => b.id === blacklistId)?.subscribers.filter(s => s !== interaction.guild?.id),
            },
          },
        }).then(() => {
          interaction.reply(`Unsubscribed from ${blacklistId}.`)
          app.log(interaction.guild!, `<@${interaction.user.id}> unsubscribed this guild from ${blacklistId}`)
        }).catch(err => {
          interaction.reply(`Error unsubscribing from ${blacklistId}`)
          console.error(err)
        })
      } else if (interaction.options.getSubcommand() === 'create') {
        const name = interaction.options.getString('name')!

        if (await prisma.blacklist.findFirst({ where: { controllers: { has: interaction.guildId } } })) return interaction.reply('This guild is already a controller of a blacklist.')
        if (await prisma.blacklist.findFirst({ where: { name } })) return interaction.reply('A blacklist with this name already exists.')

        prisma.blacklist.create({
          data: {
            name,
            owner: interaction.member?.user.id!,
            controllers: [interaction.guildId!],
            subscribers: [interaction.guildId!],
          }
        }).then(blacklist => {
          interaction.reply(`Created blacklist ${blacklist.name} (${blacklist.id})`)
          app.blacklists.set(blacklist.id, blacklist)
          app.log(interaction.guild!, `<@${interaction.user.id}> created blacklist ${blacklist.name} (${blacklist.id})`)
        }).catch(err => {
          interaction.reply(`Error creating blacklist`)
          console.error(err)
        })
      } else if (interaction.options.getSubcommand() === 'add') {
        const blacklists = await prisma.blacklist.findMany({ where: { owner: (interaction as Interaction).member?.user.id } })

        if (interaction.isAutocomplete()) {
          const search = (interaction as AutocompleteInteraction).options.getFocused().toString().toLowerCase()
          return (interaction as AutocompleteInteraction).respond(app.blacklists.map(b => b).filter(b => b.name.toLowerCase().includes(search)).map(b => {return {name: `${b.name} (${b.id})`, value: b.id}}))
        }

        const blacklistId = interaction.options.getString('blacklist')!
        const blacklist = blacklists.find(b => b.id === blacklistId)
        if (!blacklist || blacklist.owner !== interaction.member?.user.id) return interaction.reply('You do not own this blacklist.')

        if (await prisma.blacklist.findFirst({ where: { controllers: { has: interaction.guildId } } })) return interaction.reply('This guild is already a controller of a blacklist.')

        prisma.blacklist.update({
          where: { id: blacklistId },
          data: {
            controllers: {
              push: interaction.guildId!,
            },
          }
        }).then(() => {
          interaction.reply(`Added ${interaction.guild?.name} to ${blacklist.name} (${blacklist.id})`)
          app.log(interaction.guild!, `<@${interaction.user.id}> promoted this guild to a controller of ${blacklist.name}`)
        }).catch(err => {
          interaction.reply(`Error adding ${interaction.guild?.name} to ${blacklist.name} (${blacklist.id})`)
          console.error(err)
        })
      } else if (interaction.options.getSubcommand() === 'user') {
        const userType = (interaction.options.getString('type') ?? 'SCAMMER') as UserType
        const blacklist = await prisma.blacklist.findFirst({ where: { controllers: { has: (interaction as Interaction).member?.user.id } } })
        if (!blacklist) return interaction.reply('No blacklist found.')
        const user = interaction.options.getUser('user')
        if (!user) return interaction.reply('No user found.')
        prisma.blacklist.update({
          where: { id: blacklist.id },
          data: {
            users: {
              create: {
                id: user.id,
                reporter: interaction.member?.user.id!,
                type: userType,
              }
            }
          }
        }).then(() => {
          interaction.reply(`Added ${user.username} to ${blacklist.name} (${blacklist.id})`)
          app.blacklisted(user.id)
        }).catch(err => {
          interaction.reply(`Error adding ${user.username} to ${blacklist.name} (${blacklist.id})`)
          console.error(err)
        })
      }
		} catch (err: any) {
      console.error(`${err.name}: ${err.message}\n${err.stack}`)
      interaction.reply('Something went wrong! This problem has been reported to the bot developer(s). If this problem persists, please open an issue at https://github.com/TheOtterlord/Disguard/issues')
		}
	}
}
