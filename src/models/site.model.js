const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const siteSchema = new Schema({
    name: String,
    status: String,
    imagePath: String
});
const Site = mongoose.model("Site", siteSchema);
module.exports = Site;