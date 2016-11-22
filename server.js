'use strict'

const express = require('express')
const Slapp = require('slapp')
const ConvoStore = require('slapp-convo-beepboop')
const Context = require('slapp-context-beepboop')

const querystring = require('querystring');
const http = require('http');
const fs = require('fs');

var usr = 0;
var pswd = 0;

// use `PORT` env var on Beep Boop - default to 3000 locally
var port = process.env.PORT || 3000
var token =process.env.SLACK_VERIFY_TOKEN

var slapp = Slapp({
  // Beep Boop sets the SLACK_VERIFY_TOKEN env var
  verify_token: process.env.SLACK_VERIFY_TOKEN,
  convo_store: ConvoStore(),
  context: Context()
})


var HELP_TEXT = `
I will respond to the following messages:
\`help\` - to see this message.
\`hi\` - to demonstrate a conversation that tracks state.
\`thanks\` - to demonstrate a simple response.
\`<type-any-other-text>\` - to demonstrate a random emoticon response, some of the time :wink:.
\`attachment\` - to see a Slack attachment message.
`

//*********************************************
// Setup different handlers for messages
//*********************************************

// response to the user typing "help"
slapp.message('help', ['mention', 'direct_message'], (msg) => {
  msg.say(HELP_TEXT)
})

slapp.event('team_join', (msg) => {
  var str = JSON.stringify(msg);
  str = JSON.stringify(msg, null, 4); // (Optional) beautiful indented output.
  console.log(str);
  slapp.client.im.open({ token: msg.meta.bot_token,  user: msg.body.event.user.id }, (err, data) => {


    if (err) {
      return console.error(err)
    }
    let channel = data.channel.id
    var strdata = JSON.stringify(data);
    strdata = JSON.stringify(data, null, 4); // (Optional) beautiful indented output.
    console.log(strdata);
    msg.say({ channel: data.channel.id, text: 'Please visite www.neurotechedu.com' })

    })

})

slapp.command('/wordpress', 'auth (.*)', (msg, text, api) => {
  // if "/wordpress auth key secret"
  // text = auth key secret
  // api = key secret
  var strings = api.split('');
  usr = strings[0];
  pswd  = strings[1];
  console.log("user " + usr + " pswd " + pswd);
})
slapp.command('/send', 'send (.*)', (msg, text, api) => {

  var data = querystring.stringify({
      'source' : 'John',
      'content': 'test'
  });
  console.log("msg " + msg);
  console.log("data "+ data);
  // An object of options to indicate where to post to
  var post_options = {
      host: 'www.neurotechedu.com',
      port: '80',
      path: '/wp-json/wp/v2/analytic',
      method: 'POST',
      headers: {
          'Authorization':  "Basic " + btoa(usr + ":" + pswd)
      }
  };

  var post_req = http.request(post_options, function(res) {
     res.setEncoding('utf8');
     res.on('data', function (chunk) {
         console.log('Response: ' + chunk);
     });
 });
 post_req.write(data);
 post_req.end();

})

// "Conversation" flow that tracks state - kicks off when user says hi, hello or hey
slapp
  .message('^(hi|hello|hey)$', ['direct_mention', 'direct_message'], (msg, text) => {
    msg
      .say(`${text}, how are you?`)
      // sends next event from user to this route, passing along state
      .route('how-are-you', { greeting: text })
  })
  .route('how-are-you', (msg, state) => {
    var text = (msg.body.event && msg.body.event.text) || ''

    // user may not have typed text as their next action, ask again and re-route
    if (!text) {
      return msg
        .say("Whoops, I'm still waiting to hear how you're doing.")
        .say('How are you?')
        .route('how-are-you', state)
    }

    // add their response to state
    state.status = text

    msg
      .say(`Ok then. What's your favorite color?`)
      .route('color', state)
  })
  .route('color', (msg, state) => {
    var text = (msg.body.event && msg.body.event.text) || ''

    // user may not have typed text as their next action, ask again and re-route
    if (!text) {
      return msg
        .say("I'm eagerly awaiting to hear your favorite color.")
        .route('color', state)
    }

    // add their response to state
    state.color = text

    msg
      .say('Thanks for sharing.')
      .say(`Here's what you've told me so far: \`\`\`${JSON.stringify(state)}\`\`\``)
    // At this point, since we don't route anywhere, the "conversation" is over
  })

// Can use a regex as well
slapp.message(/^(thanks|thank you)/i, ['mention', 'direct_message'], (msg) => {
  // You can provide a list of responses, and a random one will be chosen
  // You can also include slack emoji in your responses
  msg.say([
    "You're welcome :smile:",
    'You bet',
    ':+1: Of course',
    'Anytime :sun_with_face: :full_moon_with_face:'
  ])
})

// demonstrate returning an attachment...
slapp.message('attachment', ['mention', 'direct_message'], (msg) => {
  msg.say({
    text: 'Check out this amazing attachment! :confetti_ball: ',
    attachments: [{
      text: 'Slapp is a robust open source library that sits on top of the Slack APIs',
      title: 'Slapp Library - Open Source',
      image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
      title_link: 'https://beepboophq.com/',
      color: '#7CD197'
    }]
  })
})

// Catch-all for any other responses not handled above
slapp.message('.*', ['direct_mention', 'direct_message'], (msg) => {
  // respond only 40% of the time
  if (Math.random() < 0.4) {
    msg.say([':wave:', ':pray:', ':raised_hands:'])
  }
})

// attach Slapp to express server
var server = slapp.attachToExpress(express())

// start http server
server.listen(port, (err) => {
  if (err) {
    return console.error(err)
  }
  console.log(`Listening on port ${port}`)
})

function sendAnalytics(){
  var options = {
    host: url,
    port: 80,
    path: '/resource?id=foo&bar=baz',
    method: 'POST'
  };

  http.request(options, function(res) {
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
    });
  }).end();
}
