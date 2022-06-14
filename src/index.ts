import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v10"
import { Client, Collection, Intents } from "discord.js"
import glob from 'glob'
import type { Blacklist, User } from "@prisma/client"

import { config } from 'dotenv'
import prisma from "./prisma"
config()

export default class App {
  private token: string
  bot: Client

  commands: Collection<string, any> = new Collection()
  blacklists: Collection<string, Blacklist> = new Collection()

  constructor(token: string) {
    this.token = token
    this.bot = new Client({intents: [Intents.FLAGS.GUILDS]})
  }

  async start() {
    this.registerCommands()
    this.bot.on('ready', () => {
      console.log(`${this.bot.user?.tag} online serving ${this.bot.guilds.cache.size} guilds`)
    })

    this.bot.login(this.token)
  }

  async registerCommands(): Promise<unknown> {
    return new Promise((res, rej) => {
      const ext = __filename.endsWith("ts") ? "ts" : "js";
      const paths = __filename.split('/')
      paths.pop()
      const dir = paths.join('/')
      glob(`${dir}/commands/**/cmd.*.${ext}`, async (err, files) => {
        console.log(`Found ${files.length} commands`)
        const cmds: any[] = []
        files.map(f => {
          const imported = require(f);
          if (!(imported.default)) return;

          const cmd = imported.default;
          cmds.push(cmd.data.toJSON())
          this.commands.set(cmd.data.name, cmd);
        });
        const rest = new REST({ version: '9' }).setToken(this.token);

        // NOTE: global commands may take up to an hour to update
        (async () => {
          try {
            console.log('Started refreshing application (/) commands.');

            await rest.put(
              Routes.applicationCommands(process.env.CLIENT_ID!) as any,
              { body: cmds },
            );

            console.log('Successfully reloaded application (/) commands.');
          } catch (error) {
            console.error(error as string);
          }
        })()
      });

      this.bot.on('interactionCreate', interaction => {
        if (!interaction.isCommand() && !interaction.isContextMenu() && !interaction.isAutocomplete()) return
        
        if (this.commands.has(interaction.commandName)) {
          console.log(`Received ${interaction.commandName} from ${interaction.guild?.name}`)
          this.commands.get(interaction.commandName)?.execute(this, interaction)
        }
      })

      this.bot.on('guildMemberAdd', async m => {
        if (m.user.bot) return
        const blacklists = this.blacklists.filter(b => b.subscribers.includes(m.guild.id) || b.controllers.includes(m.guild.id))
        const blacklist = blacklists.first()
        if (blacklist) {
          // @ts-ignore type Blacklist is not up-to-date with the schema for some reason
          const user = blacklist.users.find(u => u.id === m.id) as User
          if (!user) return
          const settings = await prisma.guildSettings.findUnique({ where: { guild: m.guild.id } })
          const action = user.type === 'SCAMMER' ? settings?.scammer ?? 'BAN' : settings?.hacked ?? 'MUTE'
          const reason = { reason: `${user.type} account reported by ${user.reporter} at ${user.createdAt.toISOString()}` }

          if (action === 'BAN') m.ban(reason)
          if (action === 'KICK') m.kick(reason.reason)
          if (action === 'MUTE') return // TODO: mute
          // if (action === 'WARN') return // TODO: add warning option to settings
        }
      })

      res(0);
    });
  }

  async stop() {
    this.bot.destroy()
  }
}

const app = new App(process.env.TOKEN!);
app.start();

process.on('SIGTERM', () => {
  app.stop()
})
