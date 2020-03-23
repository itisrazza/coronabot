# CoronaBot

CoronaBot is the bot doing a few things on a Discord server a friend set up to provide useful information (and comedy relief) during the COVID-19 pandemic of 2020.

At the moment, it does the following things:

* Forward emails send to student mailing lists to a Discord text channel
* Pin items to channels but reacting with 📌 (with code lifted from [here][1])

You can suggest features by leaving an issue, or getting in touch with me via that certain Discord server I mentioned earlier.

## Gettin' It Going

To get this going, `nodejs` and `npm` need to be installed. After that, the usual:

```bash
$ git clone git@github.com:thegreatrazz/coronication.git
$ cd coronication
$ npm install
$ npm start /path/to/config.json
```

The Discord bot token and other info needs to be saved to a text file and passed to `npm start`.

## LICENSE

This project uses the [FreeBSD License](LICENSE). Feel free to use the source for whatever you want.


[1]: https://github.com/alexsurelee/VicBot/blob/026b9ff1ca85f72f33da6947c65f66d58a663a1e/index.js#L378