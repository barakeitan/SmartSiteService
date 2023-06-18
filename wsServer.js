var webSocketServer = require('websocket').server;
const wsServerPort = process.env.WS_PORT || 6835;
var server = require('http').createServer().listen(wsServerPort);
var wsServer = new webSocketServer({httpServer: server});
console.log(`wss is listening on port ${wsServerPort}`);

const connectionsMap = new Map(); //<connectionId, connection>
const idMap = new Map(); // <connection, connectionId>

wsServer.on('request', (request) => {
    var connectionId = getUniqueID();
    const connection = request.accept(null, request.origin);
    connectionsMap.set(connectionId, connection);
    idMap.set(connection, connectionId);
    console.log(`user ${connectionId} connected`);
    //eco msg for tests
    connection.send(JSON.stringify({msg: "asdvasdv"}));

    connection.on('message', (message) =>     {
        console.log(`server accepted new message: ${message.utf8Data}`);
        alert(`server accepted new message: ${message.utf8Data}`)
    });
    
    connection.on('close', () => {
        connectionId = idMap.get(connection);
        connectionsMap.delete(connectionId);
        idMap.delete(connection);
        console.log(`client ${connectionId} disconnected`);
    });
});

function broadcast(msg) {
    for (const webSocket of connectionsMap.values()) {
      webSocket.send(JSON.stringify((msg)));
    }
 };


  // This code generates unique userid for everyuser.
const getUniqueID = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + '-' + s4();
  };

module.exports = { broadcast };