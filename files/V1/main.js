function newMaze(x, y) {

    // Establish variables and starting grid
    var totalCells = x * y;
    var cells = new Array();
    var unvis = new Array();
    for (var i = 0; i < y; i++) {
        cells[i] = new Array();
        unvis[i] = new Array();
        for (var j = 0; j < x; j++) {
            cells[i][j] = [0, 0, 0, 0];
            unvis[i][j] = true;
        }
    }

    // Set a random position to start from
    var currentCell = [Math.floor(Math.random() * y), Math.floor(Math.random() * x)];
    var path = [currentCell];
    unvis[currentCell[0]][currentCell[1]] = false;
    var visited = 1;

    // Loop through all available cell positions
    while (visited < totalCells) {
        // Determine neighboring cells
        var pot = [[currentCell[0] - 1, currentCell[1], 0, 2], [currentCell[0], currentCell[1] + 1, 1, 3], [currentCell[0] + 1, currentCell[1], 2, 0], [currentCell[0], currentCell[1] - 1, 3, 1]];
        var neighbors = new Array();

        // Determine if each neighboring cell is in game grid, and whether it has already been checked
        for (var l = 0; l < 4; l++) {
            if (pot[l][0] > -1 && pot[l][0] < y && pot[l][1] > -1 && pot[l][1] < x && unvis[pot[l][0]][pot[l][1]]) {
                neighbors.push(pot[l]);
            }
        }

        // If at least one active neighboring cell has been found
        if (neighbors.length) {
            // Choose one of the neighbors at random
            next = neighbors[Math.floor(Math.random() * neighbors.length)];

            // Remove the wall between the current cell and the chosen neighboring cell
            cells[currentCell[0]][currentCell[1]][next[2]] = 1;
            cells[next[0]][next[1]][next[3]] = 1;

            // Mark the neighbor as visited, and set it as the current cell
            unvis[next[0]][next[1]] = false;
            visited++;
            currentCell = [next[0], next[1]];
            path.push(currentCell);
        }// Otherwise go back up a step and keep going
        else {
            currentCell = path.pop();
        }
    }
    return cells;
}

class bullet {
    constructor(id, x, y, rot) {
        this.id = id;
		this.bullet = createSprite(x, y, 15, 10);
		bullets.add(this.bullet);
        this.bullet.rotation = rot;
        this.bullet.life = 180;
    }
    shoot() {
        this.bullet.shapeColor = color(50);
        this.bullet.attractionPoint(0, sin(this.rot), cos(this.rot));
        this.bullet.setSpeed(-5, this.bullet.rotation);
    }
}

var socket;

var width;
var height;

var Player = [];
var tankImg;
var PlayerCount = 2;
var players;
var walls;
var bullets;
var grid;
var w = 120;

function preload() {
    tankImg = loadImage('tank.png');
}

function ChangeColor(group, r, g, b) {
    for (var i = 0; i < group.length; i++) {
        group[i].shapeColor = color(r, g, b);
    }
}

function setup() {
    socket = io.connect("http://localhost/api");
	width = window.windowWidth;
	height = window.windowHeight;
    createCanvas(width, height);
    frameRate(60);
    players = new Group();
    bullets = new Group();
    walls = new Group();
    
	grid = newMaze(Math.trunc(width / w), Math.trunc(height / w));
	
	for (var y = 0; y < grid.length; y++) {
        for (var x = 0; x < grid[y].length; x++) {
            if (grid[y][x][0] == 0) {
				var wall = createSprite(x * w +w / 2, y * w, w, 3);//oben
				wall.shapeColor = color(0); 
				walls.add(wall);
            } if (grid[y][x][1] == 0) {
				// var wall = createSprite(x * w + w, y * w + w / 2, 3, w); //rechts
				// wall.shapeColor = color(0); 
				// walls.add(wall);
            } if (grid[y][x][2] == 0) {
				var wall = createSprite(x * w + w / 2, y * w + w, w, 3); //unten
				wall.shapeColor = color(0); 
				walls.add(wall);
            } if (grid[y][x][3] == 0) {
				var wall = createSprite(x * w, y * w + w / 2, 3, w); //links
				wall.shapeColor = color(0); 
				walls.add(wall);
            }
        }
    }

    var wall = createSprite((grid[0].length-1) * w + w, w*grid.length / 2, 3, w*grid.length);
    wall.shapeColor = color(0); 
    walls.add(wall);

    for (var i = 0; i < PlayerCount; i++) {
        Player[i] = createSprite();
        players.add(Player[i]);
        Player[i].addImage(tankImg);
        Player[i].position.x = width / 2;
        Player[i].position.y = height / 2;
        Player[i].i = 0;
    }
}

function hit(a, b) {
}

function draw() {
    background(200);
    for (var y = 0; y < grid.length; y++) {
        for (var x = 0; x < grid[y].length; x++) {
			// if (grid[y][x][0] == 0) {line(x*w, y*w, x*w + w, y*w);} //top
			// if (grid[y][x][1] == 0) {line(x*w + w, y*w, x*w + w, y*w + w);} //right
			// if (grid[y][x][2] == 0) {line(x*w, y*w + w, x*w + w, y*w + w);} //bottom
			// if (grid[y][x][3] == 0) {line(x*w, y*w, x*w, y*w + w);} //left
        }
    }
    for (var i = 0; i < PlayerCount; i++) {
        if (Player[i].i > 0) {
            Player[i].i--;
        }
        players.displace(bullets, hit);
        walls.displace(bullets);
        walls.displace(players);
        Player[i].setSpeed(0, 0);
        switch (i) {
        case 0:
            if (keyIsDown(UP_ARROW)) {
                Player[i].setSpeed(-3, Player[i].rotation);
            }
            if (keyIsDown(DOWN_ARROW)) {
                Player[i].setSpeed(3, Player[i].rotation);
            }
            if (keyIsDown(LEFT_ARROW)) {
                Player[i].rotation -= 5;
            }
            if (keyIsDown(RIGHT_ARROW)) {
                Player[i].rotation += 5;
            }
            if (keyDown("m")) {
                if (Player[i].i == 0) {
                    Player[i].i = 50;
                    new bullet(i,Player[i].position.x,Player[i].position.y,Player[i].rotation).shoot();
                }
            }
            break;
        case 1:
            if (keyDown("w")) {
                Player[i].setSpeed(-3, Player[i].rotation);
            }
            if (keyDown("s")) {
                Player[i].setSpeed(3, Player[i].rotation);
            }
            if (keyDown("a")) {
				Player[i].rotation -= 5;
            }
            if (keyDown("d")) {
				Player[i].rotation += 5;
            }
            if (keyDown("q")) {
                if (Player[i].i == 0) {
                    Player[i].i = 50;
                    new bullet(i,Player[i].position.x,Player[i].position.y,Player[i].rotation).shoot();
                }
            }
            break;
        }
    }
    drawSprites();
}
