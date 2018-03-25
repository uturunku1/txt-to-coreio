'use strict';
var fs = require('fs');
var Papa = require("papaparse");
var file = fs.readFileSync(__dirname + '/input/SequoiaDistrictExtract.TXT', 'utf8');

Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    delimiter: '\t',
    fastMode: false,
    error: error => {
        console.log(error);
    },
    complete: (res)=>{
       fs.writeFileSync('districts.json', JSON.stringify(res.data, null, ' '));
	   console.log('done writing');
   }
});

// fs.writeFileSync(outputPath, JSON.stringify(this.coreio.getData(), null, '  '));
// console.log("Done Writing");

// Papa.parse(fs.createReadStream(__dirname + '/long-sample.csv', 'utf8'), {
//     complete: function(parsedCsv) {
//         assertLongSampleParsedCorrectly(parsedCsv);
//         done();
//     },
// });
