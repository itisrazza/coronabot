---
title: Coronabot Operator Manual
subtitle: An introduction to working with Coronabot 1.0
author: Raresh Nistor, Joel Freeman
fontfamily: mathpazo
numbersections: true
geometry:
 - margin=1in
---

This document is to explain how to use CoronaBot to manage your Discord guild.

# Introduction

CoronaBot is a Discord bot which assists the CoronaClub Discord guild, but since it's open source, anyone can use it. At the time of writing it has the following features:

* Storing courses, deadlines and lecture times;
* Notifies users with certain roles of when these events occur;
* Wishes members happy birthday;
* Keeps a humorous message in the sidebar;
* And more...

# Guild Moderation

## Bot Setup

Discuss with the person administering the server to generate the right configuration file for CoronaBot. This file includes important parameters such as the roles and channels the bot is going to interact with.

It is recommended (massively because the bot is horribly written with little type checks and unit testing) to allow it the Administrator permission. (It doesn't do what it doesn't advertise, feel free to read the source code to verify.)

## Memory Model

CoronaBot keeps runtime information in memory as opposed to a database. This is to reduce code complexity and enable rollback in case of a mistake.

Each storage bank has a temporary "memory" state, and a more permanent "disk" state. The disk state is loaded into memory at start-up and then the storage can be "commited" to copy from memory to disk, or "reloaded" to copy from disk to memory.

# Server Administation

## Via Docker (Recommended)

To set up Coronabot as a Docker container, you will only need a Linux server running Docker and Docker Compose.

You can then create a container with:

```sh
# TK: add cmd options for docker
$ docker run -d --restart=always thegreatrazz/coronabot /data/config.json
```

After to stop the bot, run:

```sh
$ docker stop $CONTAINER_ID
```

## Manual Setup

To set up Coronabot manually, you will need a Linux server running Git, Node.js 14 or newer, and npm 6.14 or newer.

First download the bot software from Git:

```sh
$ git clone https://github.com/thegreatrazz/coronabot.git
```

The download and install the dependencies:

```sh
$ npm install
```

After they're installed, you need to create a configuration file. More details in [Configuration File](#configuration-file).

After the configuration file is created, you can go ahead and start the server by running:

```sh
$ npm start
```

And can be stopped by running:

```sh
$ npm stop
```

To update the bot, reset unstaged changes and pull for the Git repo again.

```sh
$ git reset HEAD --hard
$ git pull
```

## Configuration File

## Additional Suggestions

The CoronaBot software is always available from GitHub. But the data tied to your instance definetly isn't. For running this in a production environment, it's recommended to make a backup of the configuration file and data folder.

# Appendix {-}

## Glossary {-}

The reduce ambiguity, here are a bunch'a definitions.

| Name | Definition |
|------|-------|
| **Guild** | Discord Server. This term is from developer documentation. |
| **Server** | The host computer running the CoronaBot software. |

## Cron Syntax {-}

Cron syntax is used for setting up events which commonly re-occur, such as lecture times. Cron strings take the form of a number or `*`, separated by spaces.

>>> `20 16 20 4 *`

Above is a recurring event on April (4) 20th at 16:20 on any day of the week. Numbers are sorted in the following order:

* minutes
* hours
* day (of the month)
* month
* day (of the week)

Each of the numbers above correspond with these values.

| Number | Value          | Meaning                   |
|-------:|----------------|---------------------------|
| `20`   | minutes        | when minute is "20"       |
| `16`   | hours          | when hour is "16"         |
| `20`   | day (of month) | when day is "20"          |
| `4`    | month          | when month is April ("4") |
| `*`    | day (of week)  | ignored                   | 

It can also be thought over as an if statement.

```js
if (now.minute == 20 && now.hours == 16 && now.dayOfMonth == 20 && now.month == 4) {
    // notice the ommition of now.dayOfWeek
```

Another example, this time for a lecture.

>>> `0 9 * * 1`

The above cron string is a recurring event on every Monday at 9:00 AM.

| Number | Value          | Meaning                   |
|-------:|----------------|---------------------------|
| `0`    | minutes        | when minute is "0"        |
| `9`    | hours          | when hour is "9"          |
| `*`    | day (of month) | ignored                   |
| `*`    | month          | ignored                   |
| `1`    | day (of week)  | when day is Monday ("1")  |

If you're still having trouble understanding these, try the following websites:

* https://crontab.guru/
* https://bit.ly/2Z0X9MY
