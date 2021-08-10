const replace = require ("file-firstline-replace")
const Discord = require("discord.js");
const tmi = require('tmi.js');
const fs = require ('fs');
const tmp = require('tmp');
require('dotenv').config()
const alasql = require('alasql');


const { TWITCH_TOKEN, DISCORD_TOKEN } = process.env;

const dclient = new Discord.Client();

const user1 = "eggfriedrenge";
const user2 = "nysdey";

// Define configuration options for twtich
const opts = {
  identity: {
    username: 'waterdud_bot',
    password: TWITCH_TOKEN,
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

//create inital table
alasql("CREATE TABLE twitch (id STRING, guess INT, point INT)");

//window
let guessWindow = false;

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

  else if(command[0] == "!add")
  {
    tclient.say(target, "adding to list");

    var user = command[1] + "\n";
    fs.appendFile('playerList.txt', user, function (err)
    {
      if(err) return console.log("rip");
    });
  }

  
  else if(command[0] == "!list")
  {
    fs.readFile('playerList.txt', (err, data) => {
      if(err) return console.log("rip");
      tclient.say(target, data);
    });
  }

  else if(command[0] == "!guess")
  {
    if(command.length == 1)
    {
      tclient.say(target, "please include a value: !guess [#TR]");
    }
    else if(command[1].match(/^[0-9]+$/) != null)
    {
      var userGuess = parseInt(command[1], 10);
      guess(context, userGuess);
    }
    else
    {
      tclient.say(target, "please use right command: !guess [#TR]");
    }
  }

  else if(command[0] == "!point")
  {
    const reply = context["display-name"] + " has " + score(context) + " points";
    tclient.say(target, reply);
  }

  else if(command[0] == "!submit" && context["display-name"] == "waterdud_")
  {
    if(command.length == 1)
    {
      tclient.say(target, "please include a value: !guess [#TR]");
    }
    if(command[1].match(/^[0-9]+$/) != null)
    {
      var actualTR = parseInt(command[1], 10);
      submit(actualTR);
    }
    else
    {
      tclient.say(target, "please use right command: !submit [#TR]");
    }
  }

  else if(command[0] == "!leaderboard")
  {
    tclient.say(target,leaderboard());
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

dclient.login(DISCORD_TOKEN);


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

//
function guess(user, TR)
{
  let check = "SELECT COUNT(*) from twitch WHERE id = '" + user["display-name"] + "';";
  check = alasql(check);
  let command = "";

  if(JSON.stringify(check).replace(/\D/g, "") == 0)
  {
    command = "INSERT INTO twitch VALUES ( '" + user["display-name"] + "', " + TR +" , 0)";
  }
  else
  {
    command = "UPDATE twitch SET guess = " + TR + " WHERE id = '" + user["display-name"] + "';";
  }


  alasql(command);

}

function score(user)
{
  const command = "SELECT point FROM twitch WHERE id = '" + user["display-name"] + "'";

  const ans = alasql(command);

  return JSON.stringify(ans).replace(/\D/g, "");
}


function submit(actualTR)
{

  const lowere = actualTR - 5;
  const uppere = actualTR + 5;

  const upper1 = actualTR + 1000;
  const lower1 = actualTR - 1000;

  const upper2 = actualTR + 100;
  const lower2 = actualTR - 100;

  const caseEqual = "WHEN guess >= " + lowere + " AND guess <= " + uppere + " THEN point + 5 ";
  const case1 = "WHEN guess >= " + lower2 + " AND guess <= " + upper2 + " THEN point + 2 ";
  const case2 = "WHEN guess >= " + lower1 + " AND guess <= " + upper1 + " THEN point + 1 "

  const command = "UPDATE twitch SET point = (CASE " + caseEqual + case1 + case2 + "ELSE point END);"; 

  alasql(command);

/*
  `update twitch SET point = (CASE  
                      WHEN guess equals1 AND guess <= equals2
                        THEN point + 5
                      WHEN guess >= lower2 AND guess <= upper2
                        THEN point + 2
                      WHEN guess >= lower1 AND guess <= upper1
                        THEN point + 1
                      ELSE point
                    END);`
*/
  guests();

}


function leaderboard()
{

  const command = "SELECT id, point FROM twitch ORDER BY point DESC LIMIT 3";

  const execute = alasql(command);
  console.log(execute);

  const leaderboardSting = `Leaderboard:\n1st: ${execute[0].id} (${execute[0].point})\n2nd: ${execute[1].id} (${execute[1].point})\n3rd: ${execute[2].id} (${execute[2].point})`;

  // return JSON.stringify(execute).replace(/[{}]/gi, ' ')
  return leaderboardSting;
}



function guests()
{
  let waterdud= "out/waterdud.txt";
  const command = "SELECT point FROM twitch WHERE id = 'waterdud_'";

  let update = JSON.stringify(alasql(command)).replace(/\D/g, "");
  console.log("waterdud new point is" + update);
  writepoint(waterdud,update);


  let guest1= "out/guest1.txt";
  const command1 = "SELECT point FROM twitch WHERE id = '" + user1 +"'";

  let update1 = JSON.stringify(alasql(command1)).replace(/\D/g, "");
  writepoint(guest1,update1);


  let guest2= "out/guest2.txt";

  const command2 = "SELECT point FROM twitch WHERE id = '" + user2 + "'";

  let update2 = JSON.stringify(alasql(command2)).replace(/\D/g, "");
  writepoint(guest2,update2);
  
}


function writepoint(file,newPoint)
{
  fs.open(file, 'w', function(err, fd) 
    {

      if(err) {
          console.log('Cant open file');
      }else {
          fs.write(fd, newPoint, 0, "utf-8", 
                  function(err,writtenbytes) {
              if(err) {
                  console.log('Cant write to file');
              }else {
                  console.log(writtenbytes + ' characters added to file');
              }
          })
      }
    })
}
