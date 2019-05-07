class bullet {
	constructor(id, x, y, rot) {
		this.bullet = createSprite(x, y, 15, 10);
		this.bullet.id = id;
		bullets.add(this.bullet);
		this.bullet.rotation = rot;
		this.bullet.life = 180;
	}
	shoot() {
		this.bullet.shapeColor = color(50);
		// this.bullet.attractionPoint(-50, cos(this.bullet.rotation), sin(this.bullet.rotation));
		this.bullet.setSpeed(-5, this.bullet.rotation);
	}
}

var debug = 0;
var socket;

var width;
var height;

var Player = [];
var PlayerID = 0;
var tankImg;
var players;
var walls;
var bullets;
var grid;
var w = 120;
var setups = 1;

function preload() {
	tankImg = loadImage("tank.png");
}

function ChangeColor(group, r, g, b) {
	for (var i = 0; i < group.length; i++) {
		group[i].shapeColor = color(r, g, b);
	}
}

function addPlayer(PlayerID, x, y, rot) {
	Player[PlayerID] = createSprite();
	Player[PlayerID].id = PlayerID;
	players.add(Player[PlayerID]);
	Player[PlayerID].addImage(tankImg);
	Player[PlayerID].position.x = x;
	Player[PlayerID].position.y = y;
	Player[PlayerID].rotation = rot;
	Player[PlayerID].i = 0;
}

function setup() {
	frameRate(60);
	socket = io.connect(":80");
	socket.on("setup", function(data) {
		players = new Group();
		bullets = new Group();
		walls = new Group();

		grid = data[1];
		width = data[0].width;
		height = data[0].height;
		createCanvas(width, height);

		PlayerID = data[0].id;
		addPlayer(PlayerID, data[0].x, data[0].y, data[0].rot);

		console.log("Got: setup", data);

		for (var y = 0; y < grid.length; y++) {
			for (var x = 0; x < grid[y].length; x++) {
				if (grid[y][x][0] == 0) {
					var wall = createSprite(x * w + w / 2, y * w, w, 3); //oben
					wall.shapeColor = color(0);
					walls.add(wall);
				}
				if (grid[y][x][1] == 0) {
					// var wall = createSprite(x * w + w, y * w + w / 2, 3, w); //rechts
					// wall.shapeColor = color(0);
					// walls.add(wall);
				}
				if (grid[y][x][2] == 0) {
					var wall = createSprite(x * w + w / 2, y * w + w, w, 3); //unten
					wall.shapeColor = color(0);
					walls.add(wall);
				}
				if (grid[y][x][3] == 0) {
					var wall = createSprite(x * w, y * w + w / 2, 3, w); //links
					wall.shapeColor = color(0);
					walls.add(wall);
				}
			}
		}
		var wall = createSprite(
			(grid[0].length - 1) * w + w,
			(w * grid.length) / 2,
			3,
			w * grid.length
		);
		wall.shapeColor = color(0);
		walls.add(wall);
		setup = 0;
	});
	socket.on("action", function(data) {
		try {
			console.log("Received action:", data);
			Player[data["id"]].position.x = data["pos"].x;
			Player[data["id"]].position.y = data["pos"].y;
			Player[data["id"]].rotation = data["pos"].rot;
		} catch (e) {}
	});
	socket.on("add", function(data) {
		console.log("Received add:", data);
		addPlayer(data.id, data.x, data.y, data.rot);
	});
	socket.on("shoot", function(PlayerID) {
		new bullet(
			PlayerID,
			Player[PlayerID].position.x,
			Player[PlayerID].position.y,
			Player[PlayerID].rotation
		).shoot();
	});
	socket.on("remove", function(data) {
		console.log("received remove:", data);
		Player[data].remove();
		delete Player[data];
	});
	socket.emit("setup", {});
}

function hit(a, b) {
	if (a.id != b.id) {
		a.remove();
		b.remove();
	}
}

function send() {
	socket.emit("action", {
		x: Player[PlayerID].position.x,
		y: Player[PlayerID].position.y,
		rot: Player[PlayerID].rotation
	});
}

function draw() {
	if (setup == 0) {
		background(200);
		players.displace(bullets, hit);
		walls.displace(bullets);
		walls.displace(players);
		Player[PlayerID].setSpeed(0, 0);
		Player[PlayerID].i--;

		if (debug == 1) {
			Player[PlayerID].position.x = mouseX;
			Player[PlayerID].position.y = mouseY;
			send();
		}

		if (keyIsDown(UP_ARROW)) {
			Player[PlayerID].setSpeed(-3, Player[PlayerID].rotation);
			send();
		}
		if (keyIsDown(DOWN_ARROW)) {
			Player[PlayerID].setSpeed(3, Player[PlayerID].rotation);
			send();
		}
		if (keyIsDown(LEFT_ARROW)) {
			Player[PlayerID].rotation -= 5;
			send();
		}
		if (keyIsDown(RIGHT_ARROW)) {
			Player[PlayerID].rotation += 5;
			send();
		}
		if (keyDown("m")) {
			if (Player[PlayerID].i <= 0) {
				Player[PlayerID].i = 50;
				new bullet(
					PlayerID,
					Player[PlayerID].position.x,
					Player[PlayerID].position.y,
					Player[PlayerID].rotation
				).shoot();
				socket.emit("shoot", 0);
			}
		}

		translate(-width / 2.3, -height / 2.3);
		drawSprites();
	}
}
