const tmi = require('tmi.js');
const tetrio = require('tetrio-node')


// Define configuration options
const opts = {
  identity: {
    username: 'duddy_bot',
    password: 'oauth:tdvsc8j15xnizrlly1t4pvgsiud9x5'
  },
  channels: ['waterdud_']
};

const userToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZTgxNWIzMzU2MjBlZTIzYWIxMjQ4NzMiLCJjeWNsZSI6MSwiaWF0IjoxNjI0MDkyMTkyfQ.KvqckWT02youh_LDIz9MIQPOxlj6pTbhHs0wwl43aLA"
const tetrioApi = new tetrio.Api(userToken, {
  notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
});

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) 
{
  if (self) { return; } // Ignore messages from the bot

  var command = msg.split(" ");
  // If the command is known, let's execute it

  if(command[0] == "!blitz")
  {
    var player = command[1].toLowerCase().replace(/[^a-z_0-9]/g, "");
    tetrioApi.getTopScores({ user: player, gameType: "blitz" }).then((records) => 
    {
      if(records[0] == null)
      {
        client.say(target, "0");
      }
      else
      {
        console.log(records[0].score);

        client.say(target, records[0].score.toString());
      }
    });

  }

}

  

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}