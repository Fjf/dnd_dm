function buttonAddPlayer(){
    refreshPlayers()
    hideAll()
    document.getElementById("content_expanded_player").style.display = "block";
}

function addPlayer(){
    e = document.getElementById("content_selected_player")
    player = e.options[e.selectedIndex].value;

    addTableRow(player, "-", prompt("What did " + player + " roll for initiative?"))
}

function refreshPlayers(){
    let func = function(data) {
        console.log(data)
        str = "";
        for (player of data){
            str += "<option value='" + player.name + "'>" + player.name + " (" + player.class + ")</option>"
        }
        document.getElementById("content_selected_player").innerHTML = str;
    }

    response = requestApiJsonData("api/getplayers", "POST", {playthrough_id: PLAYTHROUGH_ID}, func)
}

function addNewPlayer(){
    let naam = document.getElementById("new_player_name").value;
    let klasse = document.getElementById("new_player_class").value;
    let rest = document.getElementById("new_player_rest").value;

    let data = {
        name: naam,
        class: klasse,
    }
    response = requestApiJsonData("api/createplayer", "POST", data, refreshPlayers)
}

function addNewEnemy(){
    let naam = document.getElementById("new_enemy_name").value;
    let maxhp = document.getElementById("new_enemy_maxhp").value;

    let data = {
        name: naam,
        maxhp: maxhp,
    }

    response = requestApiJsonData("api/createenemy", "POST", data, refreshEnemies)
}

var enemyObj = []
function refreshEnemies(){
    let func = function(data) {
        console.log(data)
        str = "";
        for (enemy of data){
            // Add enemies to a dictionary with their name as key.
            enemyObj[enemy.name] = {
                hp: enemy.hp
            }
            str += "<option value='" + enemy.name + "'>" + enemy.name + "</option>"
        }
        document.getElementById("content_selected_enemy").innerHTML = str;
    }

    response = requestApiJsonData("api/getenemies", "GET", {}, func)
}

function addTableRow(name, hp, initiative) {
    let rows = document.getElementById("encounter_list").getElementsByTagName("tr");
    let lastId = rows[rows.length - 1].id
    let id = lastId + 1
    if (!isInt(id))
        id = 0

    document.getElementById("encounter_list").insertRow(-1).innerHTML = "<tr><td>" + name +
        "</td><td>" + hp + "</td><td>" + initiative +
        "</td><td><input type='text' value='" + hp + "'</td><td><button onclick='removeTableRow(this)'>Del</button></td></tr>"
}

function removeTableRow(n) {
    var i = n.parentNode.parentNode.rowIndex;
    document.getElementById("encounter_list").deleteRow(i);
}

function buttonAddEnemy(){
    refreshEnemies();
    hideAll();
    document.getElementById("content_expanded_enemy").style.display = "block";
}

function hideAll(){
    for (div of document.getElementById("encounter_expanded").getElementsByTagName("div")) {
        div.style.display = "none";
    }
}

function addEnemy(){
    e = document.getElementById("content_selected_enemy")
    enemyName = e.options[e.selectedIndex].value;
    enemyHp = enemyObj[enemyName].hp
    addTableRow(enemyName, enemyHp, Math.floor(Math.random() * 20 + 1))
}

function clearEncounter(){
    document.getElementById("encounter_list").innerHTML = "<tr><td>Name</td>" +
    "<td>Max HP</td><td>Initiative</td><td>Current HP</td></tr>"
}

function sortInitiative(){
    //Function from W3Schools
    //Sorts the table on the n-th element.
    //Converts the string to a number first.
    n = 2;

    var table, rows, switching, i, x, y, shouldSwitch;
    table = document.getElementById("encounter_list");
    switching = true;
    while (switching) {
        switching = false;
        rows = table.getElementsByTagName("TR");
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            if (x.innerHTML.toLowerCase() - 0 < y.innerHTML.toLowerCase() - 0) {
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}


clearEncounter()
