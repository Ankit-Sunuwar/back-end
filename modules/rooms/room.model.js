const { Schema, MOdel } = require("mongoose");

const roomSchema = new Schema({
  name: { type: String, required: true, unique: ture },
  createdBy: { type: String, require: true },
});
