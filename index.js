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

class PlayerObject {
    constructor (id, x, y, rot) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.rot = rot;
        this.width = width;
        this.height = height;
    }
}

var express = require('express');
var app = express();

app.use(express.static('files'));
app.get('/api', function(req, res){
   res.send("Hello World!");
});

var width = 1000;
var height = 800;
var grid = newMaze(6, 6);
var Player = [];

var server = app.listen(80, "0.0.0.0");
var socket = require('socket.io')
var io = socket.listen(server);

function findIndexOf(id) {
    for (var i = 0; i < Player.length; i++) {
        if (Player[i].id == id) {
            return i;
        }
    }
}

io.sockets.on('connection', function (socket) {
  
    console.log("We have a new client: " + socket.id);

    socket.on('setup', function(data) {
        // Data comes in as whatever was sent, including objects
        console.log("Received: 'setup'");
      
        // Send it to all other clients
        // socket.broadcast.emit('tank', data);
        Player.push(new PlayerObject(socket.id, width/2, height/2, 0));
        socket.emit("setup", [Player[Player.length - 1], grid]);

        console.log(Player.length);

        for (var i = 0; i < Player.length - 1; i++) {
            socket.emit("add", Player[i]);
        }

        socket.broadcast.emit('add', Player[Player.length - 1]);
        // This is a way to send to everyone including sender
        // io.sockets.emit('message', "this goes to everyone");

      }
    );

    socket.on('shoot', function(data) {
        socket.broadcast.emit('shoot', socket.id);
    });

    socket.on('action', function(data) {
        i = findIndexOf(socket.id);
        Player[i].x = data.x;
        Player[i].x = data.x;
        Player[i].rot = data.rot;
        socket.broadcast.emit('action', {"pos":data, "id":socket.id});
    });

    socket.on('disconnect', function() {
        console.log("Client has disconnected");
        socket.broadcast.emit("remove", socket.id);
        Player.splice(findIndexOf(socket.id),1);
    });
  }
);