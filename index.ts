import { District, Choice, Contest, Language, Precinct } from './models';
import {CoreIO} from './coreio';
import { parseCsvFile } from "./PapaWrapper";
import { write } from './fileprocess';
import * as Papa from 'papaparse';
const fs = require('fs');
const path = require('path');
let fileNameDistricts;
let fileNameCandidates;
let fileNameContests;
let fileNamePrecincts;

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

    const precincts = this.getPrecincts();
    precincts.forEach(precinct => {
      this.coreio.addPrecinct(precinct.id, precinct);

      precinct.districtNames.forEach(name => {
        const found = districts.find(district => district.combination === name);
        if (found) {
          return this.coreio.mapPrecinctToDistrict(precinct.id, found.id);
        } else {
          console.warn('Unable to find district with name', name, 'for precinct', precinct.pname);
          return null;
        }
      });
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
        const external_district_ids = [];
        // let district = districts.find(d=>d.name===contest.district);
        let district = districts.find(d=>d.id===contest.district)
        if (!district) {
        console.warn('Unable to find district', contest.district, 'for contest', contest.name);
        } else {
          external_district_ids.push(district.id);
        }
        try {
          this.coreio.addOffice(contest.id,{
          titles: contest.titleManager.getTextArray(languages),
          text: contest.textManager.getTextArray(languages),
          num_selections: contest.selections,
          num_writeins: contest.num_writeins,
          sequence: contest.sequence,
          // @assumption - It's ok to default the year to this year.
          term_start: new Date().getFullYear(),
          districthndl: contest.districthndl,
          term: contest.termlength,
          grouphdg: contest.grouphdg,
          // name: contest.name,
          // ballothead: contest.ballothead,
          external_district_ids,
        });
        } catch (error) {
              console.warn('This contest id already exists:', contest.id);
          }
      });
      this.coreio.createBoxesFromOffices();
      this.coreio.createBoxesFromMeasures();

  }
  async getDistricts(){
    const papaDistricts = await this.callPapaAndNormalized(fileNameDistricts);
    return papaDistricts.map(district=>{
      return new District(district);
    })
  }
  async getPrecincts(){
    const papaPrecincts = await this.callPapaAndNormalized(fileNamePrecincts);
    return papaPrecincts.map(precinct => {
      return new Precinct(precinct);
    });
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
    fileNamePrecincts= files.find(i=>i.includes('Precinct'))
    if(fileNameDistricts===undefined ||fileNameCandidates===undefined||fileNameContests===undefined||fileNamePrecincts===undefined){
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
