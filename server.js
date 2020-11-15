const express = require('express');
const app = express();
const fs = require('fs');

const options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem')
};

var PeerServer = require('peer').PeerServer;
var pserver = new PeerServer({host:'/',port: 3001,
ssl: {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
}

});

const server = require('https').Server(options, app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req,res)=>{
    
    fs.readFile('index.html', (error,data)=>{
        if(error){
            res.writeHead(404);
            res.write('Error: File not found: '+ error);
        }else {
            res.writeHead(200, {'Content-Type':'text/html'});
            res.write(data);
        }
        res.end();
    });
});

app.get('/video/', (req, res) => {
    res.redirect(`/${uuidV4()}`);
});

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
  });
  
  io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId);
      socket.to(roomId).broadcast.emit('user-connected', userId);
  
      socket.on('disconnect', () => {
        socket.to(roomId).broadcast.emit('user-disconnected', userId);
      });
    });
  });
  
  server.listen(3000);