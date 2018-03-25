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
  writeins: number;
  sequence: number;
  termlength: number;
  type: 'contest'|'measure'|'text';

  external_district_ids: string[] = [];

  name: string;
  titleManager: TranslatableTextManager;
  textManager: TranslatableTextManager;
  district: string;
  boxSelections: number;
  boxWriteins: number;
  headerNames: string[] = [];

  constructor(data: ContestData) {
    this.id = data.name;
    this.selections = +data.officevotefor;
    this.writeins = +data.officewriteins;
    this.boxSelections = data.overridevotefor === '1' ? +data.votefor : +data.officevotefor;
    this.boxWriteins = data.overridewriteins === '1' ? +data.writeins : +data.officewriteins;
    this.termlength = +data.termlength;

    this.type = 'contest';
    if (data.type === 'Candidacy') {
      this.type = 'contest';
    } else if(data.type === 'Measure') {
      this.type = 'measure'
    } else if(data.type === 'Instructional') {
      this.type = 'text';
    } else {
      console.warn('Unsupported type' + data.type);
    }

    // Assign headers so we can map them later
    for (const key of Object.keys(data)) {
      if (key.substr(0, 2) === 'ch') {
        this.headerNames.push(data[key]);
      }
    }

    // @todo: Do we get sequence from order exported, id, or reporting order?
    // @assumption - Getting contest order from order appearing in file
    this.sequence = Contest.sequence;

    this.titleManager = new TranslatableTextManager();
    this.textManager = new TranslatableTextManager();
    this.name = data.name;
    this.district = data.district;

    Contest.sequence += 10;
  }

  setDisplayData(data: ContestDisplayData[]) {
    data.filter(item => {
      return item.name === this.name // Match the contest
        && item.purpose === 'Audio' // Audio is the field that holds translations
    }).forEach(item => {
      // @todo: How to deal with proposition text?
      const tus = +item.numoftu;
      if (this.type === 'contest') {
        for (let i = 0; i < tus; i++) {
          // @assumption - All TUs after the first are subtitles
          // @todo - Potentially make import templates so we can define TU# to style mapping
          const style: TranslatableStyle = i === 0 ? 'default' : 'subtitle';
          this.titleManager.add(i, item[`tu${i+1}`], item.language, style);
        }
      } else if (this.type === 'measure') {
        // @assumption - First TU is title and all following are text
        // Pull the first text unit as the title
        if (tus > 0) {
          this.titleManager.add(0, item['tu1'], item.language);
        }

        // The rest of them fall under text
        for (let i = 1; i < tus; i++) {
          this.textManager.add(i-1, item[`tu${i + 1}`], item.language);
        }
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

export class Choice {
  static sequence = 10;

  id: string;
  name: string;
  sequence: number;
  type: string;
  incumbent: boolean;

  partyName: string;
  contestName: string;

  titleManager: TranslatableTextManager;

  constructor(data: ChoiceData) {
    this.id = data.id;
    this.name = data.name;
    this.type = 'default';
    if (data.type === 'Write In') {
      this.type = 'writein';
    } else if (data.type === 'Qualified Writein') {
      // @assumption - Skip qualified writeins
      this.type = 'skip';
    }

    // @todo: Candidate order
    this.sequence = Choice.sequence;

    // @todo: Candidate party?
    this.partyName = data.party1;
    this.contestName = data.contest;
    this.incumbent = data.incumbent === '1';
    this.titleManager = new TranslatableTextManager();

    // @todo: Write ins aren't provided in display table
    this.titleManager.add(0, this.name, 'English');

    Choice.sequence += 10;
  }

  setDisplayData(displayData: ChoiceDisplayData[]) {
    displayData.filter(item => {
      return item.choicename === this.name // Match the choice name
        && item.contestname === this.contestName // Match the contest
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
  id: string;
  name: string;
  district: string;
  districttype: string;
  description: string;
  row: string;
  externalid: string;
  renderingtype: string;
  office: string;
  votefor: string;
  overridevotefor: string;
  officevotefor: string;
  writeins: string;
  overridewriteins: string;
  officewriteins: string;
  ballotmarkers: string;
  overrideballotmarkers: string;
  officeballotmarkers: string;
  paperindex: string;
  overridepaperindex: string;
  officepaperindex: string;
  type: string;
  major: string;
  termlength: string;
  acclamationtype: string;
  votingsystem: string;
  numberofofficeranks: string;
  numberofcontestranks: string;
  officepage: string;
  officecolumn: string;
  officecontestspan: string;
  officecandidatespan: string;
  officecontestposition: string;
  contestpage: string;
  contestcolumn: string;
  contestspan: string;
  candidatecolumnspan: string;
  contestposition: string;
  screenplacement: string;
  disablerotation: string;
  writeinlinecount: string;
  cannotbeduplicated: string;
  disabled: string;
  reportingorder: string;
  eg1: string;
  sp1: string;
  ch1: string;
  ch2: string;
  ch3: string;
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
  id: string;
  name: string;
  contest: string;
  choicegroup: string;
  crossovergroup: string;
  cellreference: string;
  firstname: string;
  lastname: string;
  gender: string;
  birthyear: string;
  birthmonth: string;
  birthday: string;
  incumbent: string;
  lineoverride: string;
  contestindex: string;
  type: string;
  nonrotatable: string;
  externalid: string;
  disabled: string;
  imagename: string;
  party1: string;
  cr1: string;
  pe1: string;
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
