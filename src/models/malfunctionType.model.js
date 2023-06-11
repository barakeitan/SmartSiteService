const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const malfunction_typeSchema = new Schema({
    malfunctionTypeName: { type: String },
    riskDescription: { type: String }
});
const MalfunctionType = mongoose.model("MalfunctionType", malfunction_typeSchema, "MalfunctionType");
module.exports = MalfunctionType;