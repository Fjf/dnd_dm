import re
from typing import List, Optional, Tuple

from werkzeug.exceptions import BadRequest

from server.lib.model.models import PlayerInfoModel, PlayerEquipmentModel, SpellModel, PlayerSpellModel, ItemModel, \
    WeaponModel, PlayerProficiencyModel
from server.lib.model.models import PlayerModel, UserModel, PlaythroughModel
from server.lib.repository import player_repository, repository
from server.lib.service import playthrough_service, item_service


def get_players(playthrough: PlaythroughModel) -> List[PlayerModel]:
    if playthrough.name == "test--":
        return player_repository.get_all_players()
    players = player_repository.get_players(playthrough.id)
    for player in players:
        player.backstory = striphtml(player.backstory)
    return players


def striphtml(data):
    p = re.compile(r'<.*?>')
    return p.sub('', data)


def create_player(playthrough: PlaythroughModel, name: str, race: str, class_name: str, backstory: str, user: UserModel):
    player = PlayerModel.from_name_playthrough_user(name, playthrough, user)

    player.race_name = race
    player.backstory = backstory
    player.class_name = class_name

    player_repository.add_and_commit(player)
    return ""


def find_player(pid: int) -> Optional[PlayerModel]:
    return player_repository.find_player(pid)


def delete_player(player: PlayerModel):
    player_repository.delete_player(player)


def update_player(player, name: str, race: str, class_name: str, backstory: str):
    player.backstory = backstory
    player.name = name
    player.race_name = race
    player.class_name = class_name

    player_repository.add_and_commit(player)


def get_player(user: UserModel):
    pass


def get_user_players(user: UserModel) -> List[PlayerModel]:
    return player_repository.get_user_players(user)


def get_user_players_by_id(user: UserModel, playthrough_id: int) -> List[PlayerModel]:
    players = player_repository.get_players(playthrough_id)
    user_players = []
    for player in players:
        if player.user == user:
            user_players.append(player)
    return user_players


def get_player_info(player: PlayerModel) -> PlayerInfoModel:
    result = player_repository.get_player_info(player)
    if result is None:
        player_info = PlayerInfoModel.from_player(player)

        player_info.strength = 1
        player_info.dexterity = 1
        player_info.constitution = 1
        player_info.intelligence = 1
        player_info.wisdom = 1
        player_info.charisma = 1

        player_info.saving_throws_str = False
        player_info.saving_throws_dex = False
        player_info.saving_throws_con = False
        player_info.saving_throws_int = False
        player_info.saving_throws_wis = False
        player_info.saving_throws_cha = False

        player_info.max_hp = 10
        player_info.armor_class = 10
        player_info.speed = 60
        player_info.level = 1

        player_repository.add_and_commit(player_info)

        result = player_repository.get_player_info(player)

    return result


def get_player_items(player: PlayerModel) -> List[Tuple[PlayerEquipmentModel, WeaponModel]]:
    return player_repository.get_player_items(player)


def check_backstory(backstory: str) -> bool:
    return True


def set_player_info(player, strength, dexterity, constitution, intelligence, wisdom, charisma,
                    saving_throws_str, saving_throws_dex, saving_throws_con, saving_throws_int,
                    saving_throws_wis, saving_throws_cha, max_hp, armor_class, speed, level):

    player_info = get_player_info(player)

    player_info.strength = strength or player_info.strength
    player_info.dexterity = dexterity or player_info.dexterity
    player_info.constitution = constitution or player_info.constitution
    player_info.intelligence = intelligence or player_info.intelligence
    player_info.wisdom = wisdom or player_info.wisdom
    player_info.charisma = charisma or player_info.charisma

    player_info.strength = min(player_info.strength, 30)
    player_info.dexterity = min(player_info.dexterity, 30)
    player_info.constitution = min(player_info.constitution, 30)
    player_info.intelligence = min(player_info.intelligence, 30)
    player_info.wisdom = min(player_info.wisdom, 30)
    player_info.charisma = min(player_info.charisma, 30)

    player_info.saving_throws_str = saving_throws_str or player_info.saving_throws_str
    player_info.saving_throws_dex = saving_throws_dex or player_info.saving_throws_dex
    player_info.saving_throws_con = saving_throws_con or player_info.saving_throws_con
    player_info.saving_throws_int = saving_throws_int or player_info.saving_throws_int
    player_info.saving_throws_wis = saving_throws_wis or player_info.saving_throws_wis
    player_info.saving_throws_cha = saving_throws_cha or player_info.saving_throws_cha

    player_info.max_hp = max_hp or player_info.max_hp
    player_info.armor_class = armor_class or player_info.armor_class
    player_info.speed = speed or player_info.speed
    player_info.level = level or player_info.level
    # Fix value within range 1..20
    player_info.level = max(min(player_info.level, 20), 1)

    player_repository.add_and_commit(player_info)

    return ""


def player_add_item(player, item_id, amount: int):
    item = item_service.get_item(item_id)

    if item is None:
        raise BadRequest("This item does not exist.")

    try:
        amount = int(amount)
    except:
        amount = 1

    player_item = PlayerEquipmentModel.from_player(player, item)
    player_item.amount = amount

    player_repository.add_and_commit(player_item)


def get_player_spells(player: PlayerModel) -> List[SpellModel]:
    return player_repository.get_player_spells(player)


def get_spells(playthrough):
    return player_repository.get_spells(playthrough)


def get_spell(player: PlayerModel, spell_id: int):
    return player_repository.get_spell(player, spell_id)


def get_item(player: PlayerModel, item_id: int):
    return player_repository.player_get_item(player, item_id)


def player_add_spell(player: PlayerModel, spell_id: int):
    spell = get_spell(player, spell_id)
    if spell is None:
        raise BadRequest("This spell does not exist.")

    player_spell = PlayerSpellModel.from_player_spell(player, spell)
    repository.add_and_commit(player_spell)

    return ""


def delete_player_spell(user: UserModel, player: PlayerModel, spell_id: int):
    if player.user is not user:
        return "This player does not belong to you."

    spell = get_spell(player, spell_id)
    if spell is None:
        return "This spell does not exist."

    player_repository.delete_spell(player, spell)

    return ""


def delete_player_item(user, player, item_id):
    if player.user is not user:
        return "This player does not belong to you."

    item = get_item(player, item_id)
    if item is None:
        return "This item does not exist."

    player_repository.delete_item(player, item)

    return ""


def update_player_playthrough(player: PlayerModel, playthrough: PlaythroughModel):
    player.playthrough_id = playthrough.id
    repository.add_and_commit(player)


def get_player_proficiencies(player: PlayerModel) -> PlayerProficiencyModel:
    proficiencies = player_repository.get_player_proficiencies(player)

    if proficiencies is None:
        proficiencies = PlayerProficiencyModel.from_player(player)
        repository.add_and_commit(proficiencies)

    return proficiencies


def update_proficiencies(player, data):
    pp: PlayerProficiencyModel = get_player_proficiencies(player)

    pp.acrobatics = data.get("acrobatics", pp.acrobatics)
    pp.animal_handling = data.get("animal_handling", pp.animal_handling)
    pp.arcana = data.get("arcana", pp.arcana)
    pp.athletics = data.get("athletics", pp.athletics)
    pp.deception = data.get("deception", pp.deception)
    pp.history = data.get("history", pp.history)
    pp.insight = data.get("insight", pp.insight)
    pp.intimidation = data.get("intimidation", pp.intimidation)
    pp.investigation = data.get("investigation", pp.investigation)
    pp.medicine = data.get("medicine", pp.medicine)
    pp.nature = data.get("nature", pp.nature)
    pp.perception = data.get("perception", pp.perception)
    pp.performance = data.get("performance", pp.performance)
    pp.persuasion = data.get("persuasion", pp.persuasion)
    pp.religion = data.get("religion", pp.religion)
    pp.sleight_of_hand = data.get("sleight_of_hand", pp.sleight_of_hand)
    pp.stealth = data.get("stealth", pp.stealth)
    pp.survival = data.get("survival", pp.survival)

    repository.add_and_commit(pp)
    return ""
