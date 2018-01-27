const RADIUS=25;
const ROWS=50;
const COLS=50;
const OFFSET=10;
const DESCRIPTION = {
	1: "HQ",
	2: "T",
	3: "U"
}

const COLOR = {
	'-1': "#333",
	0: "#333",
	1: "#123123",
	2: "#125634",
	3: "#456789",
	4: "#873423",
	5: "#151242"
}

/* Websocket Connection */
var ws = new WebSocket("ws://localhost:8888/ws");

$(document).ready(function() {
	var hexagonGrid = new HexagonGrid("HexCanvas", RADIUS);

	ws.onopen = function() {
		initialize();
	}

	ws.onmessage = function(e) {
		var {type, payload} = JSON.parse(e.data);

		switch(type) {
			case 1:
				var {map, player_map} = payload;
				drawUnits(map, player_map);
		}
	}


	/* Game */
	//TODO

	function initialize() {
		var htmlCanvas = document.getElementById("HexCanvas");
		var context = htmlCanvas.getContext('2d');
		htmlCanvas.width = hexagonGrid.side * (COLS + 1) + OFFSET;
		htmlCanvas.height = hexagonGrid.height * (ROWS + 1) + OFFSET;
		hexagonGrid.drawHexGrid(ROWS, COLS, OFFSET, OFFSET, false);
	}

	function drawUnits(map, player_map) {
		for (var c=0; c < map.length; c++) {
			for (var r = 0; r < map[c].length; r++) {
				var [buildingType, owner, uid] = map[c][r];
				if (player_map[c][r] && buildingType !== 0) {
					hexagonGrid.drawHexAtColRow(c, r, COLOR[owner], DESCRIPTION[buildingType])
				}
			}
		}
	}
})

/* Game Functions */
function move() {
	//TODO
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
    
    this.canvas.addEventListener("click", this.clickEvent.bind(this), false);
		this.canvas.addEventListener("contextmenu", this.rightClickEvent.bind(this), false);
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
        this.context.font = "8px";
        this.context.fillStyle = "#999";
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
    var mouseX = e.pageX;
    var mouseY = e.pageY;

    var localX = mouseX - this.canvasOriginX;
    var localY = mouseY - this.canvasOriginY;

    var tile = this.getSelectedTile(localX, localY);
    if (tile.column >= 0 && tile.row >= 0) {
				//TODO: Handle Left Click
				ws.send(tile)
        // var drawy = tile.column % 2 == 0 ? (tile.row * this.height) + this.canvasOriginY + 6 : (tile.row * this.height) + this.canvasOriginY + 6 + (this.height / 2);
        // var drawx = (tile.column * this.side) + this.canvasOriginX;
        // this.drawHex(drawx, drawy - 6, "rgba(110,110,70,0.3)", "");
    } 
};

HexagonGrid.prototype.rightClickEvent = function(e) {
		e.preventDefault();
		console.log(e)
		
		var mouseX = e.pageX;
		var mouseY = e.pageY;

		var localX = mouseX - this.canvasOriginX;
		var localY = mouseY - this.canvasOriginX;
		
		var tile = this.getSelectedTile(localX, localY);
		return tile;
		if (tile.column >= 0 && tile.row >= 0) {
			ws.send(tile)
			//TODO: Handle Right Click
		}
}
