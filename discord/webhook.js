const Discord = require("discord.js");
const tmi = require('tmi.js');

const dclient = new Discord.Client();

// Define configuration options for twtich
const opts = {
  identity: {
    username: 'duddy_bot',
    password: 'oauth:tdvsc8j15xnizrlly1t4pvgsiud9x5'
  },
  channels: ['waterdud_']
};

//twitch client
const tclient = new tmi.client(opts);

// Register our event handlers on twtich
tclient.on('message', onMessageHandler);


// Connect to Twitch:
tclient.connect();

//discord connecting
dclient.on("ready", () => {
  console.log("I am ready!");
});


// Called every time a message comes in on twitch
function onMessageHandler (target, context, msg, self) 
{
  //ignore bot msgs
  if (self) 
  { 
    return; 
  }

  var command = msg.split(" ");

  if(command[0] == "!p")
  {

    tclient.say(target, "sending song to discord");

    sendDiscord("-p " + command[1]);
  }

  else if(command[0] == "!send")
  {
    tclient.say(target, "sending message to discord");

    var totalString = "";
    for(let i = 1; i < command.length; i++)
    {
      totalString = totalString + " " + command[i];
    }
    sendDiscord(totalString);
  }
}


//joining and leaving voice call
var connected = false;

dclient.on("message", (message) => {

  if (message.content.startsWith("-summon") && connected == false)
  {
  	join(message);
    connected = true;
  }

  if (message.content.startsWith("-leave") && connected == true)
  {
    message.guild.me.voice.channel.leave();
    connected = false;
  }

  if (message.content.startsWith("-p"))
  {
    var music = message.toString().split(" ");
    const toRythm = dclient.channels.cache.get('801689534035263509');
    toRythm.send("!p " + music[1]);
  }
});

dclient.login("ODU2MDgwOTAyNTU1MzAzOTM3.YM71eA.Bn7v9okvGh36uw9C3u-inXmQHW0");


//function to join voice call for discord bot
async function join(message)
{
  if (message.member.voice.channel) 
    {
      const connection = await message.member.voice.channel.join();
    } 
    else 
    {
      message.reply('You need to join a voice channel first!');
    }
}


//discord webhook
async function sendDiscord (request)
{
  const channel = dclient.channels.cache.get('801689534035263509');

  const webhooks = await channel.fetchWebhooks();
  const webhook = webhooks.first();

  await webhook.send(request);
  
}