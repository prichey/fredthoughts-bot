var Twitter = require('twitter');
var Botkit = require('botkit');
var controller = Botkit.slackbot({
  debug: false
});

var MIN_THUMBS_UP = 3;
var YAY_EMOJI = '+1';
var NAY_EMOJI = '-1';

require('dotenv').config();

var bot = controller.spawn({
  token: process.env.SLACKBOT_TOKEN
});

var twitter = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

function stripLeadingAndTrailingQuotes(text) {
  // TODO: write a badass regex
  var strippedText = text.trim();
  strippedText = strippedText.replace(/^"(.*)"$/, '$1'); // trim leading and trailing '"'
  strippedText = strippedText.replace(/^'(.*)'$/, '$1'); // trim leading and trailing "'"
  return text;
}

bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

controller.on('reaction_added', function(bot, ev) {
  // copycat (mimics reaction)
  // bot.api.reactions.add({
  //   name: ev.reaction,
  //   channel: ev.item.channel,
  //   timestamp: ev.item.ts,
  // });

  // bot.reply(message, {
  //   text: "Test",
  //   username: Date.now(),
  //   icon_emoji: ":yes:"
  // })

  bot.api.reactions.get({
    timestamp: ev.item.ts,
    channel: ev.item.channel,
  }, function(_, json) {
    if (!!!json[json.type] || !!!json[json.type].reactions || !!!json[json.type].text) return;

    var reactions = json[json.type].reactions,
        text = json[json.type].text,
        enoughYays = false,
        noNays = true;

    if (text === undefined) return;

    text = stripLeadingAndTrailingQuotes(text);

    for (var i = 0; i < reactions.length; i++) {
      if (reactions[i].name == YAY_EMOJI) {
        if (reactions[i].count == MIN_THUMBS_UP) {
          enoughYays = true;
        }
      }

      if (reactions[i].name == NAY_EMOJI) {
        if (reactions[i].count > 0) {
          noNays = false;
        }
      }
    }

    if (enoughYays && noNays) {
      if (text.length > 140) {
        console.log('too long, cannot tweet');
        bot.reply(message, 'Sorry, cannot tweet (too long): "' + text + '"');
      } else {
        bot.reply(message, 'Attempting to tweet: "' + text + '"');
        console.log('attempting to tweet:', text);
        twitter.post('statuses/update', {status: text},  function(error, tweet, response){
          if(error) throw error;
          console.log(tweet);  // Tweet body.
          console.log(response);  // Raw response object.
        });
      }
    }
  });
});

controller.on('direct_message', function(bot, message) {
  if (message.text.length > 140) {
    console.log('too long, cannot tweet');
  } else {
    // only preston ;)
    if (message.user == 'U02QLHEUB') {
      twitter.post('statuses/update', {status: message.text},  function(error, tweet, response){
        if(error) throw error;
        console.log(tweet);  // Tweet body.
        console.log(response);  // Raw response object.
      });
    } else {
      bot.reply(message, "How the bloody hell is that a fred thought?");
    }
  }
});

controller.on('direct_mention', function(bot, message) {
  bot.reply(message, "Less work? \n(In peon voice)");
});

// shhh when debug is on
// controller.on('tick', function() { return; });
