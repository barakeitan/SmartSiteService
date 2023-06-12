const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const siteSchema = new Schema({
    name: { type: String },
    status: { type: String },
    imagePath: { type: String }
});
const Site = mongoose.model("Site", siteSchema);
module.exports = Site;