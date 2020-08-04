from flask import request
from werkzeug.exceptions import BadRequest

from endpoints import api, json_api, require_login
from lib.service import player_service, user_service
from lib.user_session import session_user, session_user_set


@api.route('/register', methods=["POST"])
@json_api()
def register():
    data = request.get_json()

    required_fields = ["name", "password", "email"]

    if not data or (False in [x in data for x in required_fields]):
        raise BadRequest()

    name = data["name"]
    email = data["email"].lower().strip(" \n\t")
    pw = data["password"]
    error = user_service.create_user(name, pw, email)

    success = error == ""

    # Do this to set session to the registered user.
    if success == 1:
        error = user_service.login(name, pw)

    success = error == ""

    refer = "/"
    if "redirect" in data:
        refer += data["redirect"]

    user = session_user()
    return {
        "success": success,
        "error": error,
        "user": user.to_json() if user is not None else None,
        "refer": refer
    }


@api.route('/login', methods=["POST"])
def api_login():
    data = request.get_json()

    username = data.get("username", None)
    password = data.get("password", None)

    if username is None:
        raise BadRequest("No username specified.")
    if password is None:
        raise BadRequest("No password specified.")

    user = user_service.login(username, password)

    refer = "/"
    if "redirect" in data:
        refer += data["redirect"]

    return {
        "user": user.to_json() if user is not None else None,
        "refer": refer
    }


@api.route('/logout', methods=["POST"])
@json_api()
@require_login()
def logout():
    session_user_set(None)

    return {
        "success": True
    }


@api.route('/session', methods=["GET"])
@json_api()
def session():
    user = session_user()

    data = ""
    if user is not None:
        data = user.name

    return {
        "name": data
    }


@api.route('/forgot_password', methods=["POST"])
@json_api()
def forgot_password():
    data = request.get_json()

    required_fields = ["email"]

    if not data or (False in [x in data for x in required_fields]):
        raise BadRequest()

    error = user_service.reset_password(data["email"])

    success = error == ""

    return {
        "success": success,
        "error": error
    }


@api.route('/reset_password', methods=["POST"])
@json_api()
def reset_password():
    data = request.get_json()

    required_fields = ["password", "code"]

    if not data or (False in [x in data for x in required_fields]):
        raise BadRequest()

    error, user = user_service.find_usermodel_with_code(data["code"])

    success = error == ""
    if not success:
        return {
            "success": success,
            "error": error
        }

    error = user_service.set_password(user, data["password"])

    return {
        "success": success,
        "error": error
    }


@api.route('/user/players', methods=["GET"])
@json_api()
@require_login()
def get_user_players():
    user = session_user()

    data = []

    players = player_service.get_user_players(user)
    for player in players:
        class_ids = [cls.id for cls in player_service.get_classes(player)]

        data.append({
            "id": player.id,
            "user_name": player.user.name,
            "name": player.name,
            "race": player.race_name,
            "class_ids": class_ids,
            "backstory": player.backstory,
        })

    return {
        "success": True,
        "players": data
    }


@api.route('/user/classes', methods=["GET"])
@json_api()
@require_login()
def get_user_classes():
    user = session_user()

    class_models = player_service.get_visible_classes(user)

    classes = []
    for class_model in class_models:
        abilities = player_service.get_class_abilities(class_model)
        classes.append({
            "id": class_model.id,
            "name": class_model.name,
            "info": class_model.info,
            "table": class_model.table,
            "abilities": [ability.to_json() for ability in abilities]
        })

    return {
        "success": True,
        "classes": classes,
        "error": ""
    }


@api.route('/user/player', methods=["POST"])
@json_api()
@require_login()
def create_player():
    """
        Creates a player character

        Optional POST parameters:
         - name: The new name of your PC
         - race: The new race of your PC
         - class_ids: The new class ids (array) of your PC
         - backstory: The new backstory for your PC
        :return: A json object containing the updated player's id.
    """
    user = session_user()
    data = request.get_json()

    name = data.get("name", user.name)
    race = data.get("race", "Human")
    class_ids = data.get("class_ids", [])
    backstory = data.get("backstory", "")

    player, error = player_service.create_player(user, name, race, class_ids, backstory)

    return {
        "success": error is None,
        "player_id": player.id,
        "error": error
    }


print("Registered user api endpoints.")
