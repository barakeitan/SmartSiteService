var webSocketServer = require('websocket').server;
const wsServerPort = process.env.WS_PORT || 6835;
var server = require('http').createServer().listen(wsServerPort);
var wsServer = new webSocketServer({httpServer: server});
console.log(`wss is listening on port ${wsServerPort}`);

const clients = {};

wsServer.on('request', (request) => {
    var userID = getUniqueID();
    const connection = request.accept(null, request.origin);
    clients[userID] = connection;
    console.log(`user ${userID} connected`);

    connection.on('message', (message) =>     {
        console.log(`server accepted new message: ${message.utf8Data}`);
        alert(`server accepted new message: ${message.utf8Data}`)
      // let user = findOne()
    });
    
    connection.on('close', (connection) => {
        let userID = getByValue(connection);
        console.log(`client ${userID} disconnected`);
        delete clients[userID];
    });
});

function broadcast(msg) {
    for (let [key, value] of Object.entries(clients)) {
        value.sendUTF(msg);
      }
 };

 const getByValue = (searchValue) => {
    for (let [key, value] of Object.entries(clients)) {
      if (value === searchValue)
        return key;
    }
  }

  // This code generates unique userid for everyuser.
const getUniqueID = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + '-' + s4();
  };

module.exports = { clients: clients, broadcast };






// const { WebSocketServer, WebSocket } = require('ws');
// const { v4: uuidv4 } = require('uuid');
// const http = require('http');
// const { getAuth } = require('firebase-admin/auth');

// const clients = {};
// let loggedInClients = 0;

// const webSocketServer = () => {
//   const server = http.createServer();
//   const wsServer = new WebSocketServer({ server });

//   wsServer.on('connection', (connection) => {
//     console.log('New Client connected');
    // const clientId = uuidv4();
//     clients[clientId] = { connection, clientId };

//     connection.on('close', () => {
//       if (clients[clientId]) {
//         loggedInClients--;
//         delete clients[clientId];
//         console.log('Client Disconnected!');
//         broadcastUserCount();
//       }
//     });

//     connection.on('message', async (data, isBinary) => {
//       console.log('Message Incoming');
//       const message = isBinary ? data : data.toString();
//       try {
//         const messageJSON = JSON.parse(message);
//         if (messageJSON.type === 'SIGN_IN') {
//           notifySignIn(clientId, messageJSON);
//         }
//         if (messageJSON.type === 'SIGN_OUT') {
//           notifySignOut(clientId);
//         }
//         if (messageJSON.type === 'ADMIN_READY') {
//           connectToAdmin(clientId);
//         }
//       } catch (ex) {
//         console.error(ex);
//       }
//     });
//   });

//   server.listen(2309, () => {
//     console.log('WebSocket server is up!');
//   });
// };

// const broadcastUserCount = async () => {
//   const currentLoggedInUsers = Object.values(clients).map((client) => {
//     const { user } = client;
//     if (!user) {
//       return;
//     }
//     const { email, photoUrl, displayName } = user;
//     return {
//       email,
//       displayName,
//       photoUrl
//     };
//   });

//   for (let client of Object.values(clients)) {
//     if (client.user) {
//       try {
//         const user = await getAuth().verifyIdToken(client.user.idToken);
//         if (user.isAdmin && client.connection.readyState === WebSocket.OPEN) {
//           console.log(`Notifying ${user.email} About Current User Count`);
//           client.connection.send(
//             JSON.stringify({
//               currentLoggedInUsers
//             })
//           );
//         }
//       } catch (ex) {
//         if (ex.errorInfo && ex.errorInfo.code === 'auth/id-token-expired') {
//           console.log('Sending refresh token request');
//           client.connection.send(JSON.stringify({ type: 'REFRESH_TOKEN' }));
//           client.connection.terminate();
//           delete clients[client.clientId];
//         }
//         console.error(ex);
//       }
//     }
//   }
// };

// const notifySignOut = (clientId) => {
//   clients[clientId].connection.terminate();
// };

// const notifySignIn = (clientId, messageJSON) => {
//   clients[clientId] = {
//     ...clients[clientId],
//     ...{ isLoggedIn: true, user: messageJSON.user }
//   };
//   loggedInClients++;
//   broadcastUserCount();
// };

// const connectToAdmin = async (clientId) => {
//   // const user = clients[clientId].user;
//   // if (user) {
//   //   const { isAdmin } = await getAuth().verifyIdToken(user.idToken);
//   //   if (isAdmin) {
//   //     clients[clientId].connection.send(JSON.stringify({ loggedInClients }));
//   //   }
//   // }

//   broadcastUserCount();
// };

// module.exports = webSocketServer;
