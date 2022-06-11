import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction } from 'discord.js'

export default {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Ping the bot'),
	async execute(app, interaction: CommandInteraction) {
    interaction.reply('Pong!')
	},
};
