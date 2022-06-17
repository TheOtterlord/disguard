<div align="center">
  <h1>Disguard</h1>
  <img alt="Disguard Logo of a camera with a blue tint" src="logo.svg">
  <img alt="GitHub release (latest SemVer including pre-releases)" src="https://img.shields.io/github/v/release/TheOtterlord/disguard?include_prereleases">
  <img alt="GitHub" src="https://img.shields.io/github/license/TheOtterlord/disguard">
  <a href="https://discord.gg/sYj5cFJQmA">
    <img alt="Discord" src="https://img.shields.io/discord/986649203088449578?label=discord">
  </a>
</div>

> DISCLAIMER: Disguard is currently in it's early stages of development, and not all features may work as expected. If you encounter any problems please report them [here](https://github.com/Theotterlord/disguard/issues)

Disguard aims to solve the problem of Discord scamming by crowdsourcing scammer accounts and domains reported by users. Put simply, the more servers it joins, the safer Discord becomes. Disguard also considers hacked accounts, and allows users to report those seperately. Server owners are in full control of what to do when a scammer is detected in their server, and can configure Disguard to auto-ban/kick/mute or just warn a moderator.

## How it works

Disguard allows servers to subscribe to blacklists. Blacklists are lists of scammer accounts (and hacked accounts) a server or group of servers has collected. If a user in your server is also found to be in a blacklist you subscribe to, appropriate action will be taken. Using this model, you can choose to only subscribe to the blacklists you trust.

## How to use

Add Disguard to your server using the invite link. Once Disguard is in your server, you are automatically subscribed to the official, curated Disguard blacklist. You can then subscribe to other blacklists using `/blacklist sub`. Make sure you only subscribe to blacklists you trust.

### Quick Reference

- Use `/blacklist sub` to subscribe to a blacklist
- Use `/blacklist create` to create a blacklist
- Use `/blacklist add` in another guild to add them as a controller (allowing them to add to your blacklist)
- Use `/blacklist user` or the message and user context menus to add a user to your guild's blacklist
- Use `/set` commands to change your settings

## Todo list

- Remove guild as controller
- Add some sort of confirmation mechanism to adding guilds as a controller
- Implement warning as a responsive action to flagging
