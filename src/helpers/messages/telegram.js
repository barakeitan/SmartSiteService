
const Site = require("../../models/site.model");
const SensorType = require("../../models/sensorType.model");
const Room = require("../../models/room.model");
const MalfunctionType = require("../../models/malfunctionType.model");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

exports.sendMessage = async (roomId, sensor, malfunctionTypeId,severity) => {
    try {
        const room = await Room.findById(roomId).exec();
        const site = await Site.findOne({ _id: room?.siteId }).exec();
        const sensorType = await SensorType.findOne({ _id: sensor?.sensorTypeId }).exec();
        const malfunctionType = await MalfunctionType.findById(malfunctionTypeId).exec();
        console.log("room = ",room);
        console.log("site = ",site);
        console.log("sensorType = ",sensorType);
        console.log("malfunctionType = ",malfunctionType);
        let message = `[${severity}]: There is a malfunction at site ${site?.name} in room ${room?.name} at ${sensorType?.name}. ${malfunctionType?.riskDescription}`;
        let endpoint = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage?chat_id=${process.env.CHAT_ID}&text=${message}`;

        let xhr = new XMLHttpRequest();
        xhr.open("GET", endpoint);
        xhr.send();
    } catch (error) {
        console.log(error);
    }
}