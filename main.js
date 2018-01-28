/* Constants and Global Variable */
const OFFSET=10;

const DESCRIPTION = {
	1: "H",
	2: "T",
	3: "u"
}

const COLOR = {
	'FOW': "#333333",
	'-1': "#5A3A31",
	0: "#B71C1C",
	1: "#4A148C",
	2: "#0D47A1",
	3: "#1B5E20",
	4: "#F57F17",
	5: "#827717",
	6: "#00E5FF",
	7: "#880E4F",
	8: "#00796B",
	9: "#76FF03",

}

var player_id, dest;
var units = [];

var rect = {};
var drag = false;

var mouseDownTileColumn;
var mouseDownTileRow;
var mouseUpTileColumn;
var mouseUpTileRow;

/* Websocket Connection */
var ws = new WebSocket("ws://localhost:8888/ws");
var hexagonGrid;

ws.onopen = function() {
	console.log("Socket opened")
}

ws.onmessage = function(e) {
	var {type, payload} = JSON.parse(e.data);
	// console.log(type)

	switch(type) {
			case 0:
			$(document).ready(function() {
				var {row, col} = payload;
				player_id = payload.player_id;
				var radius = getRadius(row, col);
				hexagonGrid = new HexagonGrid("HexCanvas", radius);
				initialize(row, col);
			})
			break;
		case 1:
			var {
				map, 
				player_map, 
				towers, 
				hqs, 
				tower_max_hp, 
				hq_max_hp, 
				points, 
				players,
				population,
				capacity
			} = payload;
			currentMap = map;
			drawUnits(player_id, map, player_map);
			renderSideBar(player_id, hqs, hq_max_hp, towers, tower_max_hp, points, players, population, capacity);
			break;
		case 2:
			alert("DEAD");
	}
}


/* Game */
//TODO

function initialize(rows, cols) {
	var htmlCanvas = document.getElementById("HexCanvas");
	var context = htmlCanvas.getContext('2d');
	htmlCanvas.width = hexagonGrid.side * (cols + 1) + OFFSET;
	htmlCanvas.height = hexagonGrid.height * (rows + 1) + OFFSET;
	hexagonGrid.drawHexGrid(rows, cols, OFFSET, OFFSET, false);
}

function getRadius(rows, cols) {
	var h = window.innerHeight - 5*OFFSET;
	var w = window.innerWidth - 5*OFFSET;
	var r1 = h / (Math.sqrt(3) * rows);
	var r2 = w / (2 * cols);
	return Math.min(r1, r2);
}

function drawUnits(player_id, map, player_map) {
    // console.log("DRAW UNITS", player_map)
	for (var c=0; c < map.length; c++) {
		for (var r = 0; r < map[c].length; r++) {
					if(!player_map[c][r]){
							hexagonGrid.drawHexAtColRow(c, r, "#FFF");
							hexagonGrid.drawHexAtColRow(c, r, convertColor(COLOR['FOW'], 0.7));
							continue;
					}
			var [buildingType, owner, uid] = map[c][r];
			if (buildingType !== 0) {
				hexagonGrid.drawHexAtColRow(c, r, "#FFF");
				var alpha = 0.3;
				if (buildingType === 3 && units.indexOf(uid) > -1 && owner === player_id) {
					alpha = 0.8;
				}
				hexagonGrid.drawHexAtColRow(c, r, convertColor(COLOR[owner%Object.keys(COLOR).length], alpha), DESCRIPTION[buildingType])
			}
			else {
				hexagonGrid.drawHexAtColRow(c, r, "#FFF");
			}
		}
	}
}

/* Game Functions */
function hexToRGB(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
							r: parseInt(result[1], 16),
							g: parseInt(result[2], 16),
							b: parseInt(result[3], 16)
					} : null;
}

function convertColor(hex, alpha) {
	var rgb = hexToRGB(hex);
	return "rgba(" + rgb.r + ", " + rgb.g + ", " + rgb.b + ", " + alpha + ")"
}

/* Hexagrid */
// Hex math defined here: http://blog.ruslans.com/2011/02/hexagonal-grid-math.html
function HexagonGrid(canvasId, radius) {
    this.radius = radius;

    this.height = Math.sqrt(3) * radius;
    this.width = 2 * radius;
    this.side = (3 / 2) * radius;

    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext('2d');

    this.canvasOriginX = 0;
    this.canvasOriginY = 0;

    // this.canvas.addEventListener("click", this.clickEvent.bind(this), false);
    this.canvas.addEventListener("contextmenu", this.rightClickEvent.bind(this), false);
    this.canvas.addEventListener("mousedown", this.mouseDownEvent.bind(this), false);
    this.canvas.addEventListener("mouseup", this.mouseUpEvent.bind(this), false);
    this.canvas.addEventListener("mousemove", this.mouseMoveEvent.bind(this), false);
};

HexagonGrid.prototype.drawHexGrid = function (rows, cols, originX, originY, isDebug) {
    this.canvasOriginX = originX;
    this.canvasOriginY = originY;

    var currentHexX;
    var currentHexY;
    var debugText = "";

    var offsetColumn = false;

    for (var col = 0; col < cols; col++) {
        for (var row = 0; row < rows; row++) {

            if (!offsetColumn) {
                currentHexX = (col * this.side) + originX;
                currentHexY = (row * this.height) + originY;
            } else {
                currentHexX = col * this.side + originX;
                currentHexY = (row * this.height) + originY + (this.height * 0.5);
            }

            if (isDebug) {
                debugText = col + "," + row;
            }

            this.drawHex(currentHexX, currentHexY, "#fff", debugText);
        }
        offsetColumn = !offsetColumn;
    }
};

HexagonGrid.prototype.drawHexAtColRow = function(column, row, color, text="") {
    var drawy = column % 2 == 0 ? (row * this.height) + this.canvasOriginY : (row * this.height) + this.canvasOriginY + (this.height / 2);
    var drawx = (column * this.side) + this.canvasOriginX;

    this.drawHex(drawx, drawy, color, text);
};

HexagonGrid.prototype.drawHex = function(x0, y0, fillColor, debugText) {
    this.context.strokeStyle = "#000";
    this.context.beginPath();
    this.context.moveTo(x0 + this.width - this.side, y0);
    this.context.lineTo(x0 + this.side, y0);
    this.context.lineTo(x0 + this.width, y0 + (this.height / 2));
    this.context.lineTo(x0 + this.side, y0 + this.height);
    this.context.lineTo(x0 + this.width - this.side, y0 + this.height);
    this.context.lineTo(x0, y0 + (this.height / 2));

    if (fillColor) {
        this.context.fillStyle = fillColor;
        this.context.fill();
    }

    this.context.closePath();
    this.context.stroke();

    if (debugText) {
        this.context.font = "16px";
        this.context.fillStyle = "#000";
        this.context.fillText(debugText, x0 + (this.width / 2) - (this.width/4), y0 + (this.height - 5));
    }
};

//Recusivly step up to the body to calculate canvas offset.
HexagonGrid.prototype.getRelativeCanvasOffset = function() {
	var x = 0, y = 0;
	var layoutElement = this.canvas;
    if (layoutElement.offsetParent) {
        do {
            x += layoutElement.offsetLeft;
            y += layoutElement.offsetTop;
        } while (layoutElement = layoutElement.offsetParent);

        return { x: x, y: y };
    }
}

//Uses a grid overlay algorithm to determine hexagon location
//Left edge of grid has a test to acuratly determin correct hex
HexagonGrid.prototype.getSelectedTile = function(mouseX, mouseY) {

	var offSet = this.getRelativeCanvasOffset();

    mouseX -= offSet.x;
    mouseY -= offSet.y;

    var column = Math.floor((mouseX) / this.side);
    var row = Math.floor(
        column % 2 == 0
            ? Math.floor((mouseY) / this.height)
            : Math.floor(((mouseY + (this.height * 0.5)) / this.height)) - 1);


    //Test if on left side of frame
    if (mouseX > (column * this.side) && mouseX < (column * this.side) + this.width - this.side) {


        //Now test which of the two triangles we are in
        //Top left triangle points
        var p1 = new Object();
        p1.x = column * this.side;
        p1.y = column % 2 == 0
            ? row * this.height
            : (row * this.height) + (this.height / 2);

        var p2 = new Object();
        p2.x = p1.x;
        p2.y = p1.y + (this.height / 2);

        var p3 = new Object();
        p3.x = p1.x + this.width - this.side;
        p3.y = p1.y;

        var mousePoint = new Object();
        mousePoint.x = mouseX;
        mousePoint.y = mouseY;

        if (this.isPointInTriangle(mousePoint, p1, p2, p3)) {
            column--;

            if (column % 2 != 0) {
                row--;
            }
        }

        //Bottom left triangle points
        var p4 = new Object();
        p4 = p2;

        var p5 = new Object();
        p5.x = p4.x;
        p5.y = p4.y + (this.height / 2);

        var p6 = new Object();
        p6.x = p5.x + (this.width - this.side);
        p6.y = p5.y;

        if (this.isPointInTriangle(mousePoint, p4, p5, p6)) {
            column--;

            if (column % 2 == 0) {
                row++;
            }
        }
    }

    return  { row: row, column: column };
};


HexagonGrid.prototype.sign = function(p1, p2, p3) {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
};

//TODO: Replace with optimized barycentric coordinate method
HexagonGrid.prototype.isPointInTriangle = function isPointInTriangle(pt, v1, v2, v3) {
    var b1, b2, b3;

    b1 = this.sign(pt, v1, v2) < 0.0;
    b2 = this.sign(pt, v2, v3) < 0.0;
    b3 = this.sign(pt, v3, v1) < 0.0;

    return ((b1 == b2) && (b2 == b3));
};

HexagonGrid.prototype.clickEvent = function (e) {
		// console.log(e)
    var mouseX = e.pageX;
    var mouseY = e.pageY;

    var localX = mouseX - this.canvasOriginX;
    var localY = mouseY - this.canvasOriginY;

    var tile = this.getSelectedTile(localX, localY);
	var c = tile.column;
	var r = tile.row;
    if (c >= 0 && r >= 0) {
				var clicked = currentMap[c][r];
				if (clicked[1] === player_id) {
					if (units.indexOf(clicked[2]) === -1) {
						units = [...units, currentMap[c][r][2]];
					}
					else {
						units.splice(units.indexOf(clicked[2]), 1);
					}
				}

				// console.log(units);
    }
};

HexagonGrid.prototype.rightClickEvent = function(e) {
		e.preventDefault();
		var mouseX = e.pageX;
		var mouseY = e.pageY;

		var localX = mouseX - this.canvasOriginX;
		var localY = mouseY - this.canvasOriginX;

		var tile = this.getSelectedTile(localX, localY);
		if (tile.column >= 0 && tile.row >= 0) {
			dest = [tile.column, tile.row];
			// console.log({player_id, units, dest});
			ws.send(JSON.stringify({player_id, units, dest}))
			//TODO: Handle Right Click
		}
};

HexagonGrid.prototype.mouseDownEvent = function(e) {
    // console.log("Mouse Down Event", e);
    if(e.which != 1){
        return;
    }

    var mouseX = e.pageX;
    var mouseY = e.pageY;

    var localX = mouseX - this.canvasOriginX;
    var localY = mouseY - this.canvasOriginY;

    var tile = this.getSelectedTile(localX, localY);
    mouseDownTileColumn = tile.column;
    mouseDownTileRow = tile.row;

    rect.startX = e.pageX - this.offsetLeft;
    rect.startY = e.pageY - this.offsetTop;
    drag = true;
};

HexagonGrid.prototype.mouseUpEvent = function(e) {
    // console.log("Mouse Up Event:", e);
    if(e.which != 1){
        return;
    }

    if(!e.ctrlKey){
        units = [];
    }

    var mouseX = e.pageX;
    var mouseY = e.pageY;

    var localX = mouseX - this.canvasOriginX;
    var localY = mouseY - this.canvasOriginY;

    var tile = this.getSelectedTile(localX, localY);

    if (mouseDownTileColumn > tile.column){
        mouseUpTileColumn = mouseDownTileColumn;
        mouseDownTileColumn = tile.column;
    } else {
        mouseUpTileColumn = tile.column;
    }

    if (mouseDownTileRow > tile.row){
        mouseUpTileRow = mouseDownTileRow;
        mouseDownTileRow = tile.row;
    } else {
        mouseUpTileRow = tile.row;
    }

    for (var c = mouseDownTileColumn; c <= mouseUpTileColumn; c++){
        for (var r = mouseDownTileRow; r <= mouseUpTileRow; r++){
            if (currentMap[c][r][0] == 3 && currentMap[c][r][1] == player_id){
                if (units.indexOf(currentMap[c][r][2]) === -1) {
                    units = [...units, currentMap[c][r][2]];
                }
            }
        }
    }

    drag = false;
    // console.log("selected", units);
};

HexagonGrid.prototype.mouseMoveEvent = function(e) {
    if (drag) {
        rect.w = (e.pageX - this.offsetLeft) - rect.startX;
        rect.h = (e.pageY - this.offsetTop) - rect.startY ;
        // this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.draw();
    }
};

HexagonGrid.prototype.draw = function(e) {
    this.context.fillRect(rect.startX, rect.startY, rect.w, rect.h);
};
