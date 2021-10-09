const replace = require ("file-firstline-replace")
const tmi = require('tmi.js');
const fs = require ('fs');
const tmp = require('tmp');
require('dotenv').config()
const alasql = require('alasql');

const user1 = "FiresBZ";
const user2 = "Haogy";

// Define configuration options for twitch
const opts = {
  identity: {
    username: 'waterdud_bot',
    password: 'b3vgookpppxevqnpv7n2ozvhaf3pmt',
  },
  channels: ['waterdud_']
};

//twitch client
const tclient = new tmi.client(opts);

// Register our event handlers on twtich
tclient.on('message', onMessageHandler);


// Connect to Twitch:
tclient.connect();

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
  
  if(command[0] == "!list")
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

      let dup = "SELECT COUNT(1) FROM twitch WHERE guess = " + userGuess + ";"

      let x = alasql(dup)

      if(JSON.stringify(x)[13] == "1")
      {
        tclient.say(target, "This guess is already taken :3");
      }
      else
      {
        guess(context, userGuess);
      }
    }
    else
    {
      tclient.say(target, "please use right command: !guess [#TR]");
    }
  }

  else if(command[0] == "!point" || command[0] == "!points")
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

//xD
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
