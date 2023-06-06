
const Site = require("../../models/site.model");
const SensorType = require("../../models/sensorType.model");
const utf8 = require("utf8");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

exports.sendMessage = async (room, sensor, malfunctionTypeId) => {
    try {
        let endpoint = "https://api.telegram.org/bot%token/sendMessage?chat_id=%chatId&text=%message";
        let message = "url% :קישור לחדר החיישן .sensor% בחיישן room&בחדר site% ישנה תקלה באתר";

        const site = await Site.findById({ _id: room.siteId }).exec();
        const sensorType = await SensorType.findById({ _id: sensor.sensorTypeId }).exec();
        let fullMessage = message
            .replace("%site", site.name)
            .replace("&room", room.name)
            .replace("%sensor", sensorType.name)
            .replace("%url",
                `http://localhost:3000/root/room/${room._id}`);
        let endpointUrl = endpoint
            .replace("%token", process.env.BOT_TOKEN)
            .replace("%chatId", process.env.CHAT_ID)
            .replace("%message", utf8.encode(fullMessage));
        let xhr = new XMLHttpRequest();
        xhr.open("GET", endpointUrl);
        xhr.send();
    } catch (error) {
        console.log(error);
    }
}