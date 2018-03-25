'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require('fs');
var path = require('path');
// const pp = require('papaparse');
var fileNameDistricts = 'SequoiaDistrictExtract.TXT';
var Parser = (function () {
    function Parser(dir) {
        this.dir = dir;
        this.dirPath = dir;
        fs.readdirSync(this).forEach(function (file) {
            if (path.extname(file).toLowerCase() !== '.txt') {
                console.log('invalid file', file);
            }
            //and another conditional for contest file
        });
    }
    Parser.prototype.parse = function (accountId, electionId) {
        // this.coreio = new CoreIO(accountId, electionId);
        // const districts = this.getDistricts();
        fs.readdirSync(this.dirPath).forEach(function (file) {
            console.log('file name:', file);
            // if(file === fileNameDistricts){
            //   const data = parseCsvFile(file);
            // }
            //and another conditional for contest file
        });
        // districts.forEach(district => this.coreio.addDistrict(district.id, district));
        // console.log("Done Parsing");
    };
    Parser.prototype.output = function (outputPath) {
        fs.writeFileSync(outputPath, JSON.stringify(this.coreio.getData(), null, '  '));
        console.log("Done Writing");
    };
    return Parser;
}());
var p = new Parser(path.dirname('./input'));
p.parse('dev', '1');
//# sourceMappingURL=luces.js.map