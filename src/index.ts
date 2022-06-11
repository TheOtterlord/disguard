import { REST } from "@discordjs/rest"
import { Routes } from "discord-api-types/v10"
import { Client, Collection, Intents } from "discord.js"
import glob from 'glob'

import { config } from 'dotenv'
config()

class App {
  private token: string
  bot: Client

  commands: Collection<string, any> = new Collection()

  constructor(token: string) {
    this.token = token
    this.bot = new Client({intents: [Intents.FLAGS.GUILDS]})
  }

  async start() {
    this.bot.on('ready', () => {
      console.log(`${this.bot.user?.tag} online serving ${this.bot.guilds.cache.size} guilds`)
    })

    this.bot.login(this.token)
  }

  async registerCommands(): Promise<unknown> {
    return new Promise((res, rej) => {
      const ext = __filename.endsWith("ts") ? "ts" : "js";
      glob(`commands/**/cmd.*.${ext}`, async (err, files) => {
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
              Routes.applicationCommands(this.bot.user?.id!) as any,
              { body: cmds },
            );

            console.log('Successfully reloaded application (/) commands.');
          } catch (error) {
            console.error(error as string);
          }
        })()
      });
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
