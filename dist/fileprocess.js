"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var util = require("util");
function read(fileName) {
    var readFile = util.promisify(fs.readFile);
    return readFile(fileName, { encoding: "UTF-8" });
}
exports.read = read;
function write(fileName, data) {
    var writeFile = util.promisify(fs.writeFile);
    return writeFile(fileName, data);
}
exports.write = write;
//# sourceMappingURL=fileprocess.js.map