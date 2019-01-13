from typing import List

from server.lib.model.models import UserModel, MessageModel
from server.lib.repository import message_repository
from server.lib.service import playthrough_service


def get_messages(playthrough_id: int, user: UserModel) -> (str, List[MessageModel]):
    """
    Returns all messages for a specific playthrough ID.

    :param playthrough_id:
    :param user:
    :return: A tuple (Error message, List with messages)
    """
    playthrough = playthrough_service.find_playthrough_with_id(playthrough_id)
    if playthrough is None:
        return "This playthrough does not exist.", []

    if playthrough.user_id != user.id:
        return "This is not your playthrough.", []

    return "", message_repository.get_messages(playthrough_id)


def create_message(playthrough_code: str, user: UserModel, message: str):
    playthrough = playthrough_service.find_playthrough_with_code(playthrough_code)
    if playthrough is None:
        return "This playthrough does not exist."

    message_model = MessageModel.from_playthrough_sender_msg(playthrough, user, message)

    message_repository.create_message(message_model)
    return ""
