
const Site = require("../../models/site.model");
const SensorType = require("../../models/sensorType.model");
const Room = require("../../models/room.model");
const utf8 = require("utf8");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

exports.sendMessage = async (roomId, sensor, malfunctionTypeId) => {
    try {
        const room = await Room.findById(roomId).exec();
        const site = await Site.findOne({ _id: room?.siteId }).exec();
        const sensorType = await SensorType.findOne({ _id: sensor?.sensorTypeId }).exec();
        // console.log("room = ",room);
        // console.log("site = ",site);
        // console.log("sensorType = ",sensorType);
        let message = `There is a malfunction at site ${site?.name} in room ${room?.name} at ${sensorType?.name}`;
        let endpoint = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage?chat_id=${process.env.CHAT_ID}&text=${message}`;

        let xhr = new XMLHttpRequest();
        xhr.open("GET", endpoint);
        xhr.send();
    } catch (error) {
        console.log(error);
    }
}