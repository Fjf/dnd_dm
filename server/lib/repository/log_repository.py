from typing import List, Optional

from server.lib.database import request_session
from server.lib.model.models import MessageModel, LogModel


def get_logs(playthrough_id: int) -> List[LogModel]:
    db = request_session()

    return db.query(LogModel) \
        .filter(LogModel.playthrough_id == playthrough_id) \
        .all()


def create_log(log_model: LogModel):
    db = request_session()

    db.add(log_model)
    db.commit()


def get_log(log_id: int) -> Optional[LogModel]:
    db = request_session()

    return db.query(LogModel) \
        .filter(LogModel.id == log_id) \
        .one_or_none()


def delete_log(log: LogModel):
    db = request_session()

    db.delete(log)
    db.commit()