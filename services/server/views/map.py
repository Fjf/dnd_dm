from flask import render_template
from werkzeug.exceptions import Unauthorized

from services.server import app
from lib.service import campaign_service
from lib.user_session import session_user
from endpoints import require_login


@app.route('/map_creator', methods=["GET"], defaults={"campaign_id": None})
@app.route('/map_creator/<campaign_id>', methods=["GET"])
@require_login()
def map_v2(campaign_id):
    user = session_user()

    # Select a campaign from the joined campaigns in the user, or the one passed by the url.
    if campaign_id is None:
        campaign = campaign_service.get_joined_campaigns(user)[0][0]
    else:
        campaign = campaign_service.get_campaign(campaign_id)

    # The user should get a notification it is not in the campaign it is trying to access.
    if not campaign_service.user_in_campaign(user, campaign):
        return Unauthorized()

    return render_template("map_v2.html", campaign_id=campaign.id)
