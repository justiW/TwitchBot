const Discord = require("discord.js");
const client = new Discord.Client();

client.on("ready", () => {
  console.log("I am ready!");
});

var connected = false;

client.on("message", (message) => {

  if (message.content.startsWith("summon") && connected == false)
  {
  	if (message.member.voice.channel) 
  	{
      const connection = await message.member.voice.channel.join();
      connected = true;
    } 
    else 
    {
      message.reply('You need to join a voice channel first!');
    }
  }
});

client.login("ODU2MDgwOTAyNTU1MzAzOTM3.YM71eA.O_JefgGPVh9f_7ZzIm-8v2cfEpk");