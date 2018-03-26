import { District, Choice, Contest, Language } from './models2';
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

  async parse(accountId: string, electionId: string) {
    this.coreio = new CoreIO(accountId, electionId);

    const languages = [{ id: '2', name: 'English', include: true, code: 'en' }, { id: '3', name: 'Spanish', include: true, code: 'es' }, { id: '8', name: 'Mandarin', include: true, code: 'zh-hant' }, { id: '9', name: 'Cantonese', include: true, code: 'cantonese' }, { id: '14', name: 'Taiwanese', include: true, code: 'taiwanese' } ];
    languages.forEach(lang => this.coreio.addLanguage(lang.id, lang));

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
          console.log('party name:',choice.party_hndl)
          this.coreio.addCandidate(choice.candidate_id, {
          party_name: choice.party_name,
          contest_id: choice.contest_id,
          party_hndl: choice.party_hndl,
          titles: choice.titleManager.getTextArray(languages),
          sequence: choice.sequence,
        });
        } catch (error) {
              console.warn('This choice id already exists:', choice.candidate_id);
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

  async parseAndSave(accountId: string, electionId: string): Promise<void> {
      const parseResults = await this.parse(accountId, electionId);
      const serializedData = JSON.stringify(this.coreio.getData(), null, ' ');
      await write('./output/more.json', serializedData);
      console.log("Done Writing to JSON file");
  }

}

let p = new Parser('./input');
// p.parse('dev', '1');
p.parseAndSave('dev', '1');
