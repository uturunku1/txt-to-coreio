import { District, Choice, Contest } from './models2';
import {CoreIO} from './coreio';
import { parseCsvFile } from "./PapaWrapper";
import { write } from './fileprocess';
import * as Papa from 'papaparse';
const fs = require('fs');
const path = require('path');
let fileNameDistricts;
let fileNameCandidates;
let fileNameContests;

class Parser {
  papa: Papa;
  coreio: CoreIO;
  // files: string[]=[];
  constructor(private dir: string) {
    const errors = this.runChecks(this.dir);
    if (errors==true) {
      console.error('Missing one of the files needed to run this program.');
      return;
    }
  }

  runChecks(directory){
    let files = []
    fs.readdirSync(this.dir).forEach(file => {
        if(path.extname(file).toLowerCase() == '.txt'){
          files.push(file);
        } else{
          console.warn('invalid file format', file);
        }
    });
    fileNameDistricts= files.find(i=>i.includes('DistrictExtract'));
    fileNameCandidates= files.find(i=>i.includes('CandidateExtract'));
    fileNameContests= files.find(i=>i.includes('ContestExtract'));
    if(fileNameDistricts===undefined ||fileNameCandidates===undefined||fileNameContests===undefined){
      return true;
    }
  }

  async parse(accountId: string, electionId: string) {
    this.coreio = new CoreIO(accountId, electionId);

    const districts = await this.getDistricts();
    districts.forEach(district=>{
      try {
        this.coreio.addDistrict(district.id,district);
      } catch (error) {
            console.warn('This district id already exists:', district.id);
        }
    });
    const candidates = await this.getChoices();
    candidates.forEach(choice=>{
        try {
          // console.log(choice);
          this.coreio.addCandidate(choice.candidateID, choice);
        } catch (error) {
              console.warn('This choice id already exists:', choice.candidateID);
          }
      });
      this.coreio.createOptionsFromCandidates();
      const contests = await this.getContests();
      contests.forEach(contest => {
        try {
          this.coreio.addOffice(contest.id,contest);
        } catch (error) {
              console.warn('This contest id already exists:', contest.id);
          }
      });
      this.coreio.createBoxesFromOffices();
  }
  async getDistricts(){
    const papaDistricts = await this.callPapaAndNormalized(fileNameDistricts);
    return papaDistricts.map(district=>{
      return new District(district);
    })
  }
  async getChoices(){
    const papaChoices = await this.callPapaAndNormalized(fileNameCandidates);
//pass to models2 class choice
    return papaChoices.map(candidate => {
      return new Choice(candidate);
      // choice.setDisplayData(papaChoices);
    });
  }
  async getContests(){
    const papaContests = await this.callPapaAndNormalized(fileNameContests);

    return papaContests.map(contest => {
      return new Contest(contest);
    });
  }
  async callPapaAndNormalized(fileName): Promise<any[]> {
    this.papa = await parseCsvFile(this.dir+'/'+fileName);
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
