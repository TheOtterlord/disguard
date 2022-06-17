import { SlashCommandBuilder } from '@discordjs/builders'
import { ChannelType } from 'discord-api-types/v10'
import { CommandInteraction } from 'discord.js'
import App from '..'
import prisma from '../prisma'

export default {
	data: new SlashCommandBuilder()
		.setName('set')
		.setDescription('Change a setting')
    .setDMPermission(false)
    .setDefaultMemberPermissions(8)
    .addSubcommand(s => s
      .setName('scammer')
      .setDescription('Set the action to take when a scammer is detected')
      .addStringOption((op) => op
        .setName('action')
        .setDescription('The action to take')
        .setChoices({name: 'Ban', value: 'BAN'}, {name: 'Mute', value: 'MUTE'}, {name: 'Kick', value: 'KICK'}, {name: 'Nothing', value: 'NONE'})
        .setRequired(true)
      )
    )
    .addSubcommand(s => s
      .setName('hacked')
      .setDescription('Set the action to take when a hacked/compromised account is detected')
      .addStringOption((op) => op
        .setName('action')
        .setDescription('The action to take')
        .setChoices({name: 'Ban', value: 'BAN'}, {name: 'Mute', value: 'MUTE'}, {name: 'Kick', value: 'KICK'}, {name: 'Nothing', value: 'NONE'})
        .setRequired(true)
      )
    )
    .addSubcommand(s => s
      .setName('logs')
      .setDescription('Set the channel to output logs to. Leave blank to disable logging (not recommended)')
      .addChannelOption((op) => op
        .setName('channel')
        .setDescription('The channel to output logs to')
        .addChannelTypes(ChannelType.GuildText)
      )
    )
    .addSubcommand(s => s
      .setName('muteRole')
      .setDescription('Set the mute role to use on muted users')
      .addRoleOption((op) => op
        .setName('role')
        .setDescription('The role to use to mute users')
      )
    )

  ,	async execute(app: App, interaction: CommandInteraction) {
    const subcommand = interaction.options.getSubcommand()
    if (!subcommand) return interaction.reply('You must specify a subcommand.')
    if (subcommand === 'scammer' || subcommand === 'hacked') {
      const action = interaction.options.getString('action')
      if (!action) return interaction.reply('You must specify an action.')
      await prisma.guildSettings.upsert({
        where: {
          guild: interaction.guild?.id
        },
        update: {
          [subcommand]: action
        },
        create: {
          guild: interaction.guild?.id!,
          scammer: 'BAN',
          hacked: 'MUTE',
        }
      })
      return interaction.reply(`Set ${subcommand} action to ${action}`)
    } else if (subcommand === 'logs') {
      const channel = interaction.options.getChannel('channel')
      if (!channel) return interaction.reply('You must specify a channel.')
      await prisma.guildSettings.upsert({
        where: {
          guild: interaction.guild?.id
        },
        update: {
          logChannel: channel.id
        },
        create: {
          guild: interaction.guild?.id!,
          logChannel: channel.id,
        }
      })
      return interaction.reply(`Set logs channel to ${channel.name}`)
    }
	},
};
