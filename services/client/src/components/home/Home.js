import {Link, Route} from "react-router-dom";
import React from "react";
import "../../styles/main.scss"
import {campaignService} from "../services/campaignService";
import CampaignOverview from "./CampaignOverview";
import EnemyCreation from "./EnemyCreation";

export default function Home(props) {
    const [campaigns, setCampaigns] = React.useState([]);
    const [selectedCampaign, setSelectedCampaign] = React.useState(null);

    React.useEffect(() => {
        // Load campaigns on initialization
        campaignService.get().then(r => {
            setCampaigns(r)
        });
    }, []);

    return <div className={"page-wrapper"}>
        <nav className={"title-bar"}>
            <Link to="/">
                <div>Home</div>
            </Link>
            <Link to="/enemies">
                <div>Enemies</div>
            </Link>
            <Link to="/login">
                <div>Login</div>
            </Link>
        </nav>
        <div className={"content-wrapper"}>
            <Route exact path={"/"}>
                <div className={"left-content-bar"}>
                    <h3>Campaigns</h3>
                    {
                        campaigns.map((campaign, i) => {
                            return <div key={i}
                                        className={"campaign-list-entry"}
                                        onClick={() => setSelectedCampaign(campaigns[i])}>
                                <div>{campaign.name}</div>
                                <div>{campaign.is_owner ? "You" : campaign.owner}</div>
                            </div>
                        })
                    }
                </div>
                {selectedCampaign === null ?
                    <div className={"main-content"}>Select a campaign to show information here.</div> :
                    <CampaignOverview campaign={selectedCampaign}/>
                }
            </Route>
            <Route exact path={"/enemies"}>
                <EnemyCreation campaign={selectedCampaign}/>
            </Route>
        </div>
    </div>
}