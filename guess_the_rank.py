import os
import json
import urllib.request
from urllib.request import Request
from random import choice
import sys

import dotenv
dotenv.load_dotenv()

help = """
To use:
python guess_the_rank.py
    displays this message
python guess_the_rank.py everyone
    downloads and processes a random TL game
python guess_the_rank.py list
    downloads and processes a random TL game from a user in "playerList.txt"
python guess_the_rank.py replay {replay URL}
    downloads specific TL game and processes it
python guess_the_rank.py file {filename}
    processes pre-downloaded file
python guess_the_rank.py username {username}
    downloads and processes a random TL game from the given user

"processing" entails
    censoring the names of the players from the replay
    reducing the game to a FT3
    storing the censored replay in "guess_the_rank.ttrm"
    storing usernames and TR in "guess_the_rank.txt"
"""

TETRIO_TOKEN = os.getenv('TETRIO_TOKEN')

def get_data(url):
    req = Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Authorization':'Bearer '+ TETRIO_TOKEN})
    with urllib.request.urlopen(req) as response:
        html = response.read()
    dict_str = html.decode("UTF-8")
    data = json.loads(dict_str)
    return data

def player_list():
    data = get_data("https://ch.tetr.io/api/users/lists/league/all")["data"]["users"]
    players = [(i["username"], i["_id"]) for i in data]
    return players

def get_player_id(username):
    user_data = get_data(f"https://ch.tetr.io/api/users/{username}")
    if "error" in user_data:
        return -1
    if "league" in user_data["data"]["user"]:
        return user_data["data"]["user"]["_id"]

def download_player_game(player_id):
    replay_id = choice(get_data(f"https://ch.tetr.io/api/streams/league_userrecent_{player_id}")['data']['records'])['replayid']
    return get_data(f"https://tetr.io/api/games/{replay_id}")["game"]

def download_random_and_censor():
    player = choice(player_list())
    replay = download_player_game(player[1])
    censor(replay)

def random_from_file_and_censor(filename = "playerList.txt"):
    with open(filename) as file:
        players = file.readlines()
    player = choice(players)
    players.remove(player)
    with open(filename, "w") as file:
        [file.write(player_name) for player_name in players]
        file.truncate()
    player_id = get_player_id(player)
    if player_id != -1:
        censor(download_player_game(player_id))

def download_and_censor(url):
    x = url.find("#R:")
    if x == -1:
        print("invalid replay url")
        exit()
    replay_id = url[x+len("#R:"):]
    replay = get_data(f"https://tetr.io/api/games/{replay_id}/short")["game"]
    censor(replay)

def download_from_user_and_censor(username):
    player_id = get_player_id(username)
    censor(download_player_game(player_id))

def censor_file(filename):
    if ".ttrm" not in filename:
        filename += (".ttrm")
    with open(filename) as file:
        replay = json.load(file)
    censor(replay)

def censor(replay):
    
    with open("out/uncensored.ttrm", "w") as file:
        file.write(json.dumps(replay))
        file.truncate()
    
    replay = convert_to_ft3(replay)
    censor_names_and_output(replay)

def censor_names_and_output(replay):
    board = replay["data"][0]["board"]
    u1, u2 = (board[i]["user"]["username"] for i in range(2))
    string= json.dumps(replay, indent=2)

    tr1 = get_data(f"https://ch.tetr.io/api/users/{u1}")['data']['user']['league']['rating']
    tr2 = get_data(f"https://ch.tetr.io/api/users/{u2}")['data']['user']['league']['rating']

    u1_quote = f': "{u1}"'
    u2_quote = f': "{u2}"'

    while u1_quote in string and u1 != "xxx":
        string = string.replace(u1_quote, ': "xxx"')
    while u2_quote in string and u2 != "yyy":
        string = string.replace(u2_quote, ': "yyy"')
    

    with open("out/guess_the_rank.ttrm","w") as file:
        file.write(string)
        file.truncate()
    with open("out/guess_the_rank.txt", "w") as file:
        file.write(f"{u1} (xxx): {tr1}\n")
        file.write(f"{u2} (yyy): {tr2}")
        file.truncate()

def convert_to_ft3(replay):
    board = replay["data"][0]["board"]
    u1, u2 = (board[i]["user"]["username"] for i in range(2))

    num_games = 0
    wins1, wins2 = 0, 0

    for game in replay["data"]:
        for user in game["board"]:
            if user["user"]["username"] == u1 and user["success"]:
                wins1 += 1
            elif user["user"]["username"] == u2 and user["success"]:
                wins2 += 1
        num_games += 1
        if wins1 == 3 or wins2 == 3:
            break

    replay["data"] = replay["data"][:num_games]
    return replay

if __name__ == "__main__":
    os.makedirs('out', exist_ok=True) # Make the output directory if it doesn't exist
    argc = len(sys.argv)
    if argc > 1:
        if sys.argv[1] == "everyone":
            download_random_and_censor()
        if sys.argv[1] == "list":
            if argc > 2:
                random_from_file_and_censor(sys.argv[2])
            random_from_file_and_censor()
        if sys.argv[1] == "replay":
            if argc > 2:
                download_and_censor(sys.argv[2])
        if sys.argv[1] == "username":
            if argc > 2:
                download_from_user_and_censor(sys.argv[2])
        if sys.argv[1] == "file":
            if argc > 2:
                censor_file(sys.argv[2])
    else:
        print(help)
