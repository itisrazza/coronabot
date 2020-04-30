# CoronaBot

CoronaBot is the bot doing a few things on a Discord server a friend set up to provide useful information (and comedy relief) during the COVID-19 pandemic of 2020.

At the moment, it does the following things:

* Forward emails sent to student mailing lists to a Discord text channel
* Pin items to channels but reacting with 📌 (with code lifted from [here][1])
* Keep deadlines in mind and notifies you shortly before it's due
* Sends out reminders with lecture times

You can suggest features by leaving an issue, or getting in touch with me via that certain Discord server I mentioned earlier.

## Gettin' It Going

To get this going, `nodejs` and `npm` need to be installed. After that, the usual:

```bash
$ git clone git@github.com:thegreatrazz/coronication.git
$ cd coronication
$ npm install
$ npm start /path/to/config.json
```

The Discord bot token and other info needs to be saved to `config.json`. To start the bot (as a daemon), run `npm start`.

The example config will always be incomplete. Have fun debugging that.

## Data Files

### `motd.json`

Literally a JSON file with Discord.js activities. Look it up.

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

## LICENSE

This project uses the [FreeBSD License](LICENSE). Feel free to use the source for whatever you want.

[1]: https://github.com/alexsurelee/VicBot/blob/026b9ff1ca85f72f33da6947c65f66d58a663a1e/index.js#L378