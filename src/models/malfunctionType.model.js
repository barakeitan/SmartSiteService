const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const malfunction_typeSchema = new Schema({
    malfunctionTypeName: String,
    riskDescription: String,
});
const MalfunctionType = mongoose.model("MalfunctionType", malfunction_typeSchema);
module.exports = MalfunctionType;