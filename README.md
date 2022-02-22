# CoronaBot

> This project has been retired. It did its job back in 2020 when we got a flood of emails and had to jump into Zoom meetings non-stop, but we have since moved on.
>
> Thanks everyone for the feedback and good riddance.

CoronaBot is the bot doing a few things on a Discord server a friend set up to provide useful information (and comedy relief) during the COVID-19 pandemic of 2020 and beyond.

At the moment, it does the following things:

* ~~[Forward emails sent to student mailing lists to a Discord text channel](lib/announcements.js)~~ (borked and disabled)
* Pin items to channels but reacting with 📌 (with code lifted from [here][1])
* [Keep deadlines in mind and notifies you shortly before it's due](lib/class-times.js)
* [Sends out reminders with lecture times](lib/class-times.js)

You can suggest features by leaving an issue, or getting in touch with me via that certain Discord server I mentioned earlier.

At this stage, I want to rewrite it in [TypeScript], but don't have to time to do that right now.

## Gettin' It Going

To get this going, `nodejs` and `npm` need to be installed. After that, the usual:

```bash
$ git clone git@github.com:thegreatrazz/coronication.git
$ cd coronication
$ npm install
$ npm start
```

The Discord bot token and other info needs to be saved to `config.json`. To start the bot (as a daemon), run `npm start`.

The example config will always be incomplete. Have fun debugging that.

## Data Files

### `motd.json`

Literally a JSON file with [Discord.js activities].

### `deadlines.csv`

| Class   | Event Name   | Year | Month | Date | Hour | Minute |
|---------|--------------|------|-------|------|------|--------|
| COMP261 | Assignment 3 | 2020 |     5 |   17 |   23 |     59 |
| ...     | ...          | ...  | ...   | ...  | ...  | ...    |

### `lecture-times.csv`

| Class   | Event Name      | Cron syntax time | Place        |
|---------|-----------------|------------------|--------------|
| NWEN241 | Josh's Tutorial | `10 14 * * 5`    | NWEN241 Zoom |
| ...     | ...             | ...              | ...          |

### `birthdays.csv`

This data file is not stored in the Git repo since it contains personal information I'd much rather not leak.

There is an example file which has some example data, but it's not used at runtime. You need to add the path to a real file to `config.json`.

| Name   | Discord User ID | Cron syntax time | Birthday Message |
|--------|-----------------|------------------|------------------|
| Raresh | 69440080...     | `0 11 20 4 *`    | La Mulți Ani!    |

## License

This project uses the [FreeBSD License](LICENSE). Feel free to use the source for whatever you want.

[1]: https://github.com/alexsurelee/VicBot/blob/026b9ff1ca85f72f33da6947c65f66d58a663a1e/index.js#L378
[TypeScript]: https://www.typescriptlang.org/
[Discord.js Activities]: https://discord.js.org/#/docs/main/stable/typedef/PresenceData
