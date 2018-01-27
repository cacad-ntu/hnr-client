var attackingList = [];

function renderSideBar(playerId, hqList, hqMaxHP, towerList, towerMaxHP, points, players) {
	console.log(players);
	clear();
	renderLeaderboard(players);
	renderPlayer(playerId, points);
	renderStatusBar(playerId, hqList, hqMaxHP, towerList, towerMaxHP)
}

function renderLeaderboard(players) {
	var counter = 1;
	players.forEach(player => {
		var leaderboardNode = document.getElementById("leaderboard");
		var divNode = document.createElement("div")
		var playerNameNode = document.createElement("span");
		playerNameNode.textContent = counter + ". " + "Player #" + player.player_id;
		var	pointNode = document.createElement("span");
		pointNode.textContent = player.points;
		divNode.appendChild(playerNameNode);
		divNode.appendChild(pointNode);
		leaderboardNode.appendChild(divNode);
		counter++;
	})
}

function renderStatusBar(playerId, hqList, hqMaxHP, towerList, towerMaxHP) {

	hqList.forEach(hq => {
		renderHQ(playerId, hq, hqMaxHP);
	}, this)

	towerList.forEach(tower => {
		renderTower(playerId, tower, towerMaxHP);
	}, this)
	
	attackingList.forEach(item => {
		renderAttacking(playerId, item, item.maxHP);
	})
}

function renderPlayer(playerId, points) {
	var playerNode = document.getElementById("player");
	playerNode.innerHTML = "Player #" + player_id;
	var pointsNode = document.getElementById("points");
	pointsNode.innerHTML = "Points: " + points;
}

function renderHQ(playerId, hq, hqMaxHP) {
	if (playerId !== hq.playerId) {
		if (hq.isAttacked && hq.attacker === playerId) {
			hq["type"] = "hq";
			hq["maxHP"] = hqMaxHP;
			attackingList = [...attackingList, hq]
		}
		return;
	}
	
	generateProgressBar("hq", "hq", hq, hqMaxHP);
}

function renderTower(playerId, tower, towerMaxHP) {
	console.log(tower);
	if (playerId !== tower.playerId) {
		if (tower.isAttacked && tower.attacker === playerId) {
			tower["type"] = "tower";
			tower["maxHP"] = towerMaxHP;
			attackingList = [...attackingList, tower]
		}
		return;
	}

	generateProgressBar("tower", "tower", tower, towerMaxHP);
}

function renderAttacking(playerId, item, maxHP) {
	// console.log(item)
	generateProgressBar("attacking", item.type, item, maxHP);
}

function generateProgressBar(nodeId, type, item, maxHP) {
	var node = document.getElementById(nodeId);
	var divNode = document.createElement("div");
	var nameNode = document.createElement("span");
	var name = type === "hq" ? "HQ #" + item.id : "Tower #" + item.id;
	nameNode.textContent = name
	var progressNode = document.createElement("progress");
	progressNode.value = item.hp;
	progressNode.max = maxHP;
	divNode.appendChild(nameNode);

	if (nodeId !== "attacking" && item.isAttacked) {
		nameNode.textContent = "!!! " + name;
		nameNode.className = "alertRed"
	}

	divNode.appendChild(progressNode);
	node.appendChild(divNode)
}

function clear() {
	attackingList = [];
	var leaderboardNode = document.getElementById("leaderboard")
	var hqNode = document.getElementById("hq");
	var towerNode = document.getElementById("tower");
	var attackingNode = document.getElementById("attacking");
	clearStatus(leaderboardNode);
	clearStatus(hqNode);
	clearStatus(towerNode);
	clearStatus(attackingNode);
}

function clearStatus(node) {
	while(node.firstChild) {
		node.removeChild(node.firstChild);
	}
}
