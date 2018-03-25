import { District } from './models2';
import {CoreIO} from './coreio';
import { parseCsvFile } from "./PapaWrapper";
import { write } from './fileprocess';
import * as Papa from 'papaparse';
const fs = require('fs');
const path = require('path');
const fileNameDistricts = 'SequoiaDistrictExtract.TXT';

class Parser {
  papa: Papa; //define type class
  coreio: CoreIO;
  files: string[]=[];
  constructor(private dir: string) {
    console.log(this);//Parser { dir: './input' }
    fs.readdirSync(this.dir).forEach(file => {
        if(path.extname(file).toLowerCase() == '.txt'){
          if (file === fileNameDistricts) {
            //push key district and filename?
            (this.files).push(this.dir+'/'+fileNameDistricts);
          }
        } else{
          console.log('invalid file', file);
        }
        //and runChecks for contest file
    });
  }

  async parse(accountId: string, electionId: string) {
    this.coreio = new CoreIO(accountId, electionId);
    const districts = await this.getDistricts();
    // console.log('districtsmap:',districts);
    districts.forEach(district=>{
      try {
        this.coreio.addDistrict(district.id,district);
      } catch (error) {
            console.error('warning: This id already exists:', district.id);
        }
      // this.coreio.addDistrict(district.id,district);
    });
    //Error: District PK05 already exists,Error: District *520 already exists(5),Error: District PK01 already exists(4),Error: District PK09 already exists(6),Error: District SCC-2 already exists(3).
  }
  async getDistricts(){
    const districts = await this.callPapaAndNormalized();
    return districts.map(district=>{
      return new District(district);
    })
  }
  async callPapaAndNormalized(): Promise<any[]> {
    this.papa = await parseCsvFile(this.dir+'/'+fileNameDistricts);
    return (this.papa).data.map(row=>{
      const ret= {};
      for (let key in row) {
        const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        ret[normalized] = row[key]
      }
      return ret;
    });
  }

  async parseAndSave(accountId: string, electionId: string): Promise<void> {
      const parseResults = await this.parse(accountId, electionId);
      const serializedData = JSON.stringify(this.coreio.getData(), null, ' ');
      await write('./output/data.json', serializedData);
      console.log("Done Writing to JSON file");
  }

}

let p = new Parser('./input');
// p.parse('dev', '1');
p.parseAndSave('dev', '1');
