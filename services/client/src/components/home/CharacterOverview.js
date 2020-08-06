import React from "react";
import {characterServices} from "../services/characterServices";
import {Checkbox, TextField} from "@material-ui/core";
import "../../styles/profile.scss";
import {BsDiamond, BsDiamondFill, FaTrash, MdSave} from "react-icons/all";
import IconButton from "@material-ui/core/IconButton";
import {campaignService} from "../services/campaignService";
import DoubleCheckbox from "./DoubleCheckbox";

export default function CharacterOverview(props) {
    const character = props.character;
    const [characterInfo, setCharacterInfo] = React.useState(null);
    const [notEditing, setNotEditing] = React.useState(false);

    React.useEffect(() => {
        characterServices.getCharacterInfo(character.id).then(r => {
            setCharacterInfo(r);
        });
    }, [character]);



    function deleteCharacter() {
        if (prompt("Are you sure you want to delete this character? Type the name of the character to continue deleting.") === character.name) {
            characterServices.del(character.id).then(r => {
                // props.setCampaigns(r);
                // setSelectedCampaign(null);
                // getPlayers();
                props.reset();
                console.log(r)
            })
        }
    }

    function getBonus(value) {
        return Math.floor((value - 10) / 2);
    }

    function getProficiencyBonus(stat) {
        if (characterInfo === null) return 0;
        let bonus;
        if (stat === "int") bonus = getBonus(characterInfo.info.intelligence);
        if (stat === "cha") bonus = getBonus(characterInfo.info.charisma);
        if (stat === "str") bonus = getBonus(characterInfo.info.strength);
        if (stat === "dex") bonus = getBonus(characterInfo.info.dexterity);
        if (stat === "con") bonus = getBonus(characterInfo.info.constitution);
        if (stat === "wis") bonus = getBonus(characterInfo.info.wisdom);

        return bonus + Math.round((characterInfo.info.level - 1) / 4) + 2;
    }

    return <div className={"main-content"}>
        <div className={"icon-bar"} style={{top: "8px", right: "8px", position: "absolute"}}>
            {/*<IconButton*/}
            {/*    onClick={saveChanges}*/}
            {/*>*/}
            {/*    <MdSave/>*/}
            {/*</IconButton>*/}
            <IconButton
                onClick={deleteCharacter}
            >
                <FaTrash/>
            </IconButton>
        </div>
        {characterInfo === null ? null :
            <>
                <div className={"stats-column"}>
                    <div>Strength</div>
                    <div className={"stats-duo"}>
                        <TextField
                            disabled={notEditing}
                            value={characterInfo.info.strength}
                            onChange={(e) => setCharacterInfo({
                                ...characterInfo,
                                info: {
                                    ...characterInfo.info,
                                    strength: e.target.value
                                }
                            })}
                        />
                        <Checkbox
                            disabled={notEditing}
                            value={characterInfo.saving_throws_str}
                            size={"small"}
                            icon={<BsDiamond/>}
                            checkedIcon={<BsDiamondFill/>}
                            onChange={(e) => setCharacterInfo({
                                ...characterInfo,
                                info: {
                                    ...characterInfo.info,
                                    saving_throws_str: e.target.value
                                }
                            })}
                        />
                    </div>
                    <div>Dexterity</div>
                    <div className={"stats-duo"}>
                        <TextField
                            disabled={notEditing}
                            value={characterInfo.info.dexterity}
                            onChange={(e) => setCharacterInfo({
                                ...characterInfo,
                                info: {
                                    ...characterInfo.info,
                                    dexterity: e.target.value
                                }
                            })}
                        />
                        <Checkbox
                            disabled={notEditing}
                            value={characterInfo.saving_throws_dex}
                            size={"small"}
                            icon={<BsDiamond/>}
                            checkedIcon={<BsDiamondFill/>}
                            onChange={(e) => setCharacterInfo({
                                ...characterInfo,
                                info: {
                                    ...characterInfo.info,
                                    saving_throws_dex: e.target.value
                                }
                            })}
                        />
                    </div>
                    <div>Constitution</div>
                    <div className={"stats-duo"}>
                        <TextField
                            disabled={notEditing}
                            value={characterInfo.info.constitution}
                            onChange={(e) => setCharacterInfo({
                                ...characterInfo,
                                info: {
                                    ...characterInfo.info,
                                    constitution: e.target.value
                                }
                            })}
                        />
                        <Checkbox
                            disabled={notEditing}
                            value={characterInfo.saving_throws_con}
                            size={"small"}
                            icon={<BsDiamond/>}
                            checkedIcon={<BsDiamondFill/>}
                            onChange={(e) => setCharacterInfo({
                                ...characterInfo,
                                info: {
                                    ...characterInfo.info,
                                    saving_throws_con: e.target.value
                                }
                            })}
                        />
                    </div>
                    <div>Intelligence</div>
                    <div className={"stats-duo"}>
                        <TextField
                            disabled={notEditing}
                            value={characterInfo.info.intelligence}
                            onChange={(e) => setCharacterInfo({
                                ...characterInfo,
                                info: {
                                    ...characterInfo.info,
                                    intelligence: e.target.value
                                }
                            })}
                        />
                        <Checkbox
                            disabled={notEditing}
                            value={characterInfo.saving_throws_int}
                            size={"small"}
                            icon={<BsDiamond/>}
                            checkedIcon={<BsDiamondFill/>}
                            onChange={(e) => setCharacterInfo({
                                ...characterInfo,
                                info: {
                                    ...characterInfo.info,
                                    saving_throws_int: e.target.value
                                }
                            })}
                        />
                    </div>
                    <div>Wisdom</div>
                    <div className={"stats-duo"}>
                        <TextField
                            disabled={notEditing}
                            value={characterInfo.info.wisdom}
                            onChange={(e) => setCharacterInfo({
                                ...characterInfo,
                                info: {
                                    ...characterInfo.info,
                                    wisdom: e.target.value
                                }
                            })}
                        />
                        <Checkbox
                            disabled={notEditing}
                            value={characterInfo.saving_throws_wis}
                            size={"small"}
                            icon={<BsDiamond/>}
                            checkedIcon={<BsDiamondFill/>}
                            onChange={(e) => setCharacterInfo({
                                ...characterInfo,
                                info: {
                                    ...characterInfo.info,
                                    saving_throws_wis: e.target.value
                                }
                            })}
                        />
                    </div>
                    <div>Charisma</div>
                    <div className={"stats-duo"}>
                        <TextField
                            disabled={notEditing}
                            value={characterInfo.info.charisma}
                            onChange={(e) => setCharacterInfo({
                                ...characterInfo,
                                info: {
                                    ...characterInfo.info,
                                    charisma: e.target.value
                                }
                            })}
                        />
                        <Checkbox
                            disabled={notEditing}
                            value={characterInfo.saving_throws_cha}
                            size={"small"}
                            icon={<BsDiamond/>}
                            checkedIcon={<BsDiamondFill/>}
                            onChange={(e) => setCharacterInfo({
                                ...characterInfo,
                                info: {
                                    ...characterInfo.info,
                                    saving_throws_cha: e.target.value
                                }
                            })}
                        />
                    </div>
                </div>
                <div className={"proficiencies-column"}>
                    <div className={"stats-duo"}>
                        <span title={"Dexterity"}>Acrobatics ({getProficiencyBonus("dex")})</span>
                        <DoubleCheckbox
                            value={characterInfo.proficiencies.acrobatics}
                            onClick={(e) => {
                                setCharacterInfo({
                                    ...characterInfo,
                                    proficiencies: {
                                        ...characterInfo.proficiencies,
                                        acrobatics: e.target.value
                                    }
                                })
                            }}
                        />
                    </div>
                    <div className={"stats-duo"}>
                        <span title={"Wisdom"}>Animal Handling ({getProficiencyBonus("wis")})</span>
                        <DoubleCheckbox
                            value={characterInfo.proficiencies.animal_handling}
                            onClick={(e) => {
                                setCharacterInfo({
                                    ...characterInfo,
                                    proficiencies: {
                                        ...characterInfo.proficiencies,
                                        animal_handling: e.target.value
                                    }
                                })
                            }}
                        />
                    </div>
                    <div className={"stats-duo"}>
                        <span title={"Intelligence"}>Arcana ({getProficiencyBonus("int")})</span>
                        <DoubleCheckbox
                            value={characterInfo.proficiencies.arcana}
                            onClick={(e) => {
                                setCharacterInfo({
                                    ...characterInfo,
                                    proficiencies: {
                                        ...characterInfo.proficiencies,
                                        arcana: e.target.value
                                    }
                                })
                            }}
                        />
                    </div>
                    <div className={"stats-duo"}>
                        <span title={"Strength"}>Athletics ({getProficiencyBonus("str")})</span>
                        <DoubleCheckbox
                            value={characterInfo.proficiencies.athletics}
                            onClick={(e) => {
                                setCharacterInfo({
                                    ...characterInfo,
                                    proficiencies: {
                                        ...characterInfo.proficiencies,
                                        athletics: e.target.value
                                    }
                                })
                            }}
                        />
                    </div>
                    <div className={"stats-duo"}>
                        <span title={"Charisma"}>Deception ({getProficiencyBonus("cha")})</span>
                        <DoubleCheckbox
                            value={characterInfo.proficiencies.deception}
                            onClick={(e) => {
                                setCharacterInfo({
                                    ...characterInfo,
                                    proficiencies: {
                                        ...characterInfo.proficiencies,
                                        deception: e.target.value
                                    }
                                })
                            }}
                        />
                    </div>
                    <div className={"stats-duo"}>
                        <span title={"Intelligence"}>History ({getProficiencyBonus("int")})</span>
                        <DoubleCheckbox
                            value={characterInfo.proficiencies.history}
                            onClick={(e) => {
                                setCharacterInfo({
                                    ...characterInfo,
                                    proficiencies: {
                                        ...characterInfo.proficiencies,
                                        history: e.target.value
                                    }
                                })
                            }}
                        />
                    </div>
                    <div className={"stats-duo"}>
                        <span title={"Intelligence"}>Insight ({getProficiencyBonus("int")})</span>
                        <DoubleCheckbox
                            value={characterInfo.proficiencies.history}
                            onClick={(e) => {
                                setCharacterInfo({
                                    ...characterInfo,
                                    proficiencies: {
                                        ...characterInfo.proficiencies,
                                        history: e.target.value
                                    }
                                })
                            }}
                        />
                    </div>
                </div>
            </>
        }
    </div>
}