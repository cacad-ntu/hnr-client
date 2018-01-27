var attackingList = [];

function renderStatusBar(playerId, hqList, hqMaxHP, towerList, towerMaxHP) {
	clear();
	renderPlayer(playerId);
	// renderScore(score);

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

function renderPlayer(playerId) {
	var playerNode = document.getElementById("player");
	playerNode.innerHTML = "Player #" + player_id;
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
	divNode.appendChild(progressNode);

	if (nodeId !== "attacking") {
		var attackedNode = document.createElement("span");
		attackedNode.textContent = item.isAttacked ? "attacked!" : "";
		divNode.appendChild(attackedNode);
	}

	node.appendChild(divNode)
}

function clear() {
	attackingList = [];
	var hqNode = document.getElementById("hq");
	var towerNode = document.getElementById("tower");
	var attackingNode = document.getElementById("attacking");
	clearStatus(hqNode);
	clearStatus(towerNode);
	clearStatus(attackingNode);
}

function clearStatus(node) {
	while(node.firstChild) {
		node.removeChild(node.firstChild);
	}
}
