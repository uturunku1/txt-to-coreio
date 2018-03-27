export class TranslatableTextManager {
  items: TranslatableText[] = [];

  add(i: number, text: string, lang: string, style: TranslatableStyle = 'default') {
    if (this.items[i] === undefined) {
      this.items[i] = new TranslatableText();
      this.items[i].style = style;
    }
    this.items[i].add(text, lang.toLowerCase());
  }

  getText(languages: Language[]): TranslatableText {
    return this.setLangCodes(this.items[0], languages);
  }

  getTextArray(languages: Language[]): TranslatableText[] {
    return this.items.filter(item => {
      return item.value != '' || Object.keys(item.translations).length > 0;
    }).map(item => {
      return this.setLangCodes(item, languages);
    });
  }

  // Convert language names to codes
  setLangCodes(text: TranslatableText, langs: Language[]): TranslatableText {
    langs.forEach(lang => {
      const partyName = lang.name.toLowerCase();
      if (text.translations[partyName]) {
        // @assumption - English is always defined like this
        if (partyName === 'english') {
          text.value = text.translations[partyName];
        } else {
          text.translations[lang.code] = text.translations[partyName];
        }
        delete text.translations[partyName];
      }
    });
    return text;
  }
}

export type TranslatableStyle = 'default'|'title'|'subtitle';
export type TranslatableFormat = 'default'|'text'|'style'|'html';

export class TranslatableText {
  value = '';
  format: TranslatableFormat = 'style';
  style: TranslatableStyle = 'default';
  translations: { [key: string]: string } = {};

  constructor(value: string = '') {
    this.value = value;
  }
  add(text: string, lang: string) {
    this.translations[lang] = text;
  }
}

export class Language {
  id: string;
  name: string;
  code: string;

  include: boolean;

  constructor(data: LanguageData) {
    this.id = data.id;
    this.name = data.name;
    this.include = data.purpose.toLowerCase() === 'audio';
    switch (this.name.toLowerCase()) {
      case 'english':
        this.code = 'en';
        break;
      case 'spanish':
        this.code = 'es';
        break;
      case 'chinese':
      case 'mandarin':
        this.code = 'zh-hant';
        break;
      default:
        this.code = this.name.toLowerCase();
        console.warn('Unknown language code for', this.name);
    }
  }
}

export class District {
  id: string;
  name: string;
  type: string;
  districthndl: number;

  constructor(data: DistrictData) {
    this.id = data.selecdistrictid;
    this.type = data.szdistricttypeofficialdesc;
    this.name = data.szelecdistrictname;
    this.districthndl = data.ldistricthndl;
  }
}

export class Precinct {
  id: string;
  pname: string;
  pid: string;
  sname: string;
  sid: string;

  external_district_ids: string[] = [];

  districtNames: string[] = [];

  constructor(data: PrecinctData) {
    this.id = data.id;
    this.pname = data.name;
    // @assumption - Using this value to map to VR. Not sure if this is correct
    this.pid = data.keyinid;

    for (const key in data) {
      if (key.substr(0,2) === 'dt') {
        this.districtNames.push(data[key]);
      }
    }
  }
}

export class Party {
  id: string;
  name: string;
  abbreviation: string;
  nonPartisan: boolean;

  titleManager: TranslatableTextManager;

  constructor(data: PartyData) {
    this.id = data.externalid;
    this.name = data.name;
    this.abbreviation = data.abbreviation;
    this.nonPartisan = data.independent === '1';

    this.titleManager = new TranslatableTextManager();
  }

  setDisplayData(data: PartyDisplayData[]) {
    data.filter(item => {
      return item.partyname === this.name // Match the party
        && item.purpose === 'Audio' // Audio is the field that holds translations
    }).forEach(item => {
      const tus = +item.numoftu;
      for (let i = 0; i < tus; i++) {
        this.titleManager.add(i, item[`tu${i+1}`], item.language);
      }

      // @todo: tus/rtf - Sometimes it's possible to have only rtf defined.
      // We can't/don't want to rely on rtf because it has special formatting.
      const appearance = item.appearance.toLowerCase();
      if (tus === 0 && appearance === 'rtf' && item.rtftext) {
        this.titleManager.add(0, item.rtftext, item.language);
      }
    });

    // @todo: English not included on display data for sample
    this.titleManager.add(0, this.name, 'english');
  }
}

export class Contest {
  static sequence = 10;
  id: string;
  text: TranslatableText[];
  selections: number;
  num_writeins: number;
  sequence: number;
  external_district_ids: string[] = [];
  name: string;
  titleManager: TranslatableTextManager;
  textManager: TranslatableTextManager;
  district: string;
  districthndl: number;
  ballothead: string;
  termlength: number;
  grouphdg: string;
  // officemaster: number;
  // type: 'contest'|'measure'|'text';
  // boxSelections: number;
  // boxWriteins: number;
  headerNames: string[] = [];
  constructor(data: ContestData) {
    this.id = String(data.icontestid);
    this.selections = +data.inumtovotefor;
    this.num_writeins = +data.iwriteins;
    this.sequence = Contest.sequence;
    this.name = data.szofficetitle;
    this.grouphdg = data.szgrouphdg;
    // this.officemaster = data.lofficemasterhndl;
    this.ballothead = data.szballotheading;
    // this.boxSelections = data.overridevotefor === '1' ? +data.votefor : +data.officevotefor;
    // this.boxWriteins = data.overridewriteins === '1' ? +data.writeins : +data.officewriteins;
    // this.type = 'contest';
    // if (data.type === 'Candidacy') {
    //   this.type = 'contest';
    // } else if(data.type === 'Measure') {
    //   this.type = 'measure'
    // } else if(data.type === 'Instructional') {
    //   this.type = 'text';
    // } else {
    //   console.warn('Unsupported type' + data.type);
    // }
    // @todo: Do we get sequence from order exported, id, or reporting order?
    // @assumption - Getting contest order from order appearing in file
    this.titleManager = new TranslatableTextManager();
    this.textManager = new TranslatableTextManager();
    this.district = data.sdistrictid;
    this.districthndl = data.ldistricthndl;
    Contest.sequence += 10;
    //Assign headers so we can map them later
    for (const key of Object.keys(data)) {
      if (key.substr(0, 2) === 'ch') {
        this.headerNames.push(data[key]);
      }
    }
    this.titleManager.add(0, this.name, 'English');
    this.titleManager.add(1, this.ballothead, 'English');
  }
  // setDisplayData(data: ContestDisplayData[]) {
  //   data.filter(item => {
  //     return item.name === this.name // Match the contest
  //       && item.purpose === 'Audio' // Audio is the field that holds translations
  //   }).forEach(item => {
  //     // @todo: How to deal with proposition text?
  //     const tus = +item.numoftu;
  //     if (this.type === 'contest') {
  //       for (let i = 0; i < tus; i++) {
  //         // @assumption - All TUs after the first are subtitles
  //         // @todo - Potentially make import templates so we can define TU# to style mapping
  //         const style: TranslatableStyle = i === 0 ? 'default' : 'subtitle';
  //         this.titleManager.add(i, item[`tu${i+1}`], item.language, style);
  //       }
  //     } else if (this.type === 'measure') {
  //       // @assumption - First TU is title and all following are text
  //       // Pull the first text unit as the title
  //       if (tus > 0) {
  //         this.titleManager.add(0, item['tu1'], item.language);
  //       }
  //
  //       // The rest of them fall under text
  //       for (let i = 1; i < tus; i++) {
  //         this.textManager.add(i-1, item[`tu${i + 1}`], item.language);
  //       }
  //     }

      // @todo: tus/rtf - Sometimes it's possible to have only rtf defined.
      // We can't/don't want to rely on rtf because it has special formatting.
//       const appearance = item.appearance.toLowerCase();
//       if (tus === 0 && appearance === 'rtf' && item.rtftext) {
//         this.titleManager.add(0, item.rtftext, item.language);
//       }
//     })
  // }
}

export class Choice {
  static sequence = 10;
  candidate_id: string;
  name: string;
  titleManager: TranslatableTextManager;
  sequence: number;
  contest_id: number;
  designation: string;
  party_name: string;
  party_hndl: number;
  type: string;

  constructor(data: ChoiceData) {
    this.name = data.szcandidateballotname;
    this.sequence = Choice.sequence;
    this.candidate_id = String(data.icandidateid);
    this.designation = data.szballotdesignation;
    this.party_name = data.spartyabbr;
    this.contest_id = data.icontestid;
    this.party_hndl = data.lpartyhndl;
    this.type = 'default';

    this.titleManager = new TranslatableTextManager();
    // @todo: Write ins aren't provided in display table
    this.titleManager.add(0, this.name, 'English');
    this.titleManager.add(1, this.designation, 'English');
    Choice.sequence += 10;
  }
  // setDisplayData(displayData: ChoiceDisplayData[]) {
  //   displayData.filter(item => {
  //     return item.choicename === this.name // Match the choice name
  //       && item.contestname === this.contestName // Match the contest
  //       && item.purpose === 'Audio' // Audio is the field that holds translations
  //   }).forEach(item => {
  //     const tus = +item.numoftu;
  //     for (let i = 0; i < tus; i++) {
  //       this.titleManager.add(i, item[`tu${i+1}`], item.language);
  //     }
  //
  //     // @todo: tus/rtf - Sometimes it's possible to have only rtf defined.
  //     // We can't/don't want to rely on rtf because it has special formatting.
  //     const appearance = item.appearance.toLowerCase();
  //     if (tus === 0 && appearance === 'rtf' && item.rtftext) {
  //       this.titleManager.add(0, item.rtftext, item.language);
  //     }
  //   })
  // }
}


export class Header {
  id: string;
  name: string;
  include: boolean;

  titleManager: TranslatableTextManager;

  constructor(data: HeaderData) {
    this.id = data.name;
    this.name = data.name;

    // @assumption - Only importing data defined as paper ballot
    const purpose = data.purpose.toLowerCase();
    this.include = (purpose === 'paper ballot' || purpose === 'both');
    this.titleManager = new TranslatableTextManager();
  }

  setDisplayData(displayData: HeaderDisplayData[]) {
    displayData.filter(item => {
      return item.contestheadingname === this.name // Match the name
        && item.purpose === 'Audio' // Audio is the field that holds translations
    }).forEach(item => {
      const tus = +item.numoftu;
      for (let i = 0; i < tus; i++) {
        this.titleManager.add(i, item[`tu${i+1}`], item.language);
      }

      // @todo: tus/rtf - Sometimes it's possible to have only rtf defined.
      // We can't/don't want to rely on rtf because it has special formatting.
      const appearance = item.appearance.toLowerCase();
      if (tus === 0 && appearance === 'rtf' && item.rtftext) {
        this.titleManager.add(0, item.rtftext, item.language);
      }
    })
  }
}

export class BallotType {
  id: string;
  name: string;
  code: string;
  external_box_ids: string[] = [];
  external_precinct_ids: string[] = [];

  constructor(data: BallotTypeData) {
    this.id = data.externalid ? data.externalid : data.id;
    this.code = data.abbreviation ? data.abbreviation : data.id;
    this.name = data.name;
  }
}

export class BallotTypeContestMapper {
  styles = new Map<string, Set<string>>();

  constructor(data: BallotTypeContestData[]) {
    data.forEach(item => {
      let contests = this.styles.get(item.ballottypename);
      if (!contests) {
        contests = new Set();
        this.styles.set(item.ballottypename, contests);
      }
      contests.add(item.contestname);
    });
  }

  get(styleName: string) {
    return this.styles.get(styleName);
  }
}

export class BallotTypePrecinctMapper {
  styles = new Map<string, Set<string>>();

  constructor(data: BallotTypePrecinctData[]) {
    data.forEach(item => {
      let precincts = this.styles.get(item.ballottypename);
      if (!precincts) {
        precincts = new Set();
        this.styles.set(item.ballottypename, precincts);
      }
      precincts.add(item.precinctid);
    });
  }
  get(styleName: string) {
    return this.styles.get(styleName);
  }
}

interface ContestData {
  selectionabbr: string;
  lofficemasterhndl: number;
  icontestid: number;
  lpartyhndl: string;
  spartyabbr: string;
  szofficeabbr1: string;
  szofficeabbr2: string;
  ldistricthndl: number;
  sdistrictid: string;
  lsubdistricthndl: string;
  isubdistrict: number;
  szgrouphdg: string;
  szballotheading: string;
  szsubheading: string;
  szofficetitle: string;
  llanguagehndl: number;
  slanguageabbr: string;
  inumtovotefor: number;
  iwriteins: number;
  scandidatesequence: string;
}
interface ContestDisplayData {
  id: string;
  name: string;
  language: string;
  purpose: string;
  contesttemplate: string;
  choicetemplate: string;
  choicegrouptemplate: string;
  propositionappearance: string;
  propositionrtftext: string;
  appearance: string;
  rtftext: string;
  numoftu: string;
  tu1: string;
  tu2: string;
  tu3: string;
}
interface ChoiceData {
  selectionabbr: string;
  icontestid: number;
  icandidateid: number;
  szcandnamelast: string;
  szcandnamefirst: string;
  szcandnamemiddle: string;
  scandnamesuffix: string;
  szcandidateballotname: string;
  szcandidateabbr: string;
  llanguagehndl: number;
  slanguageabbr: string;
  szballotdesignation: string;
  lpartyhndl: number;
  spartyabbr: string;
  ivotingposition: number;
}
interface ChoiceDisplayData {
  id: string;
  contestname: string;
  choicename: string;
  language: string;
  purpose: string;
  appearance: string;
  rtftext: string;
  numoftu: string;
  tu1: string;
  tu2: string;
}
interface HeaderData {
  id: string;
  name: string;
  purpose: string;
  paperappearance: string;
  screenappearance: string;
}
interface HeaderDisplayData {
  id: string;
  contestheadingname: string;
  language: string;
  purpose: string;
  appearance: string;
  rtftext: string;
  contestheadingtemplate: string;
  numoftu: string;
  tu1: string;
}
interface BallotTypeData {
  id: string;
  name: string;
  externalid: string;
  abbreviation: string;
  pollingdistrictlist: string;
  egc1: string;
}
interface BallotTypeContestData {
  id: string;
  ballottypename: string;
  contestname: string;
  rotationindex: string;
}
interface BallotTypePrecinctData {
  id: string;
  ballottypename: string;
  precinctname: string;
  precinctid: string;
}
interface ElectionData {
  id: string;
  name: string;
  purpose: string;
}
interface LanguageData {
  id: string;
  name: string;
  purpose: string;
}
interface PartyData {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  imagename: string;
  independent: string;
  externalid: string;
  line1: string;
}
interface PartyDisplayData {
  id: string;
  partyname: string;
  language: string;
  purpose: string;
  appearance: string;
  rtftext: string;
  politicalpartytemplate: string;
  numoftu: string;
  tu1: string;
}
interface DistrictData {
  selectionabbr: string;
  ldisttypehndl: number;
  szdistricttypeofficialdesc: string;
  ldistricthndl: number;
  lparentdisthndl: string;
  selecdistrictid: string;
  ielecsubdistrict: number;
  szelecdistrictname: string;
}
interface PrecinctData {
  id: string;
  name: string;
  parentid: string;
  eligiblevoters: string;
  abbreviation: string;
  description: string;
  keyinid: string;
  externalid: string;
  ec1: string;
  dtstate: string;
  dtsupedist: string;
  dtmunicipal: string;
  dtunifiedschool: string;
  tab1: string;
  tab2: string;
  tab3: string;
  tab4: string;
  tab5: string;
  tab6: string;
  tab7: string;
  tab8: string;
  tab9: string;
  tab10: string;
  tab11: string;
  lp1: string;
}
