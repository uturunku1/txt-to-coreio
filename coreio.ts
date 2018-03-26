export class CoreIO {
  languages = new Map<string, Language>();
  districts = new Map<string, District>();
  precincts = new Map<string, Precinct>();
  parties = new Map<string, Party>();
  offices = new Map<string, Office>();
  candidates = new Map<string, Candidate>();
  measures = new Map<string, Measure>();
  boxes = new Map<string, Box>();
  options = new Map<string, Option>();
  styles = new Map<string, Style>();

  errors = new Set<string>();
  warnings = new Set<string>();

  constructor(private accountId: string, private electionId: string, private throwOnError = true) { }

  getData() {
    return {
      languages: Array.from(this.languages.values()),
      districts: Array.from(this.districts.values()),
      precincts: Array.from(this.precincts.values()),
      parties: Array.from(this.parties.values()),
      offices: Array.from(this.offices.values()),
      candidates: Array.from(this.candidates.values()),
      measures: Array.from(this.measures.values()),
      boxes: Array.from(this.boxes.values()),
      options: Array.from(this.options.values()),
      styles: Array.from(this.styles.values()),
    }
  }

  addLanguage(id: string, data: Partial<Language>) {
    if (this.languages.get(id)) {
      this.addError(`Language ${id} already exists.`);
    }

    data.account_id = this.accountId;
    data.external_id = id;
    this.languages.set(id, new Language(data));
  }

  addDistrict(id: string, data: Partial<District>) {
    if (this.districts.get(id)) {
      this.addError(`District ${id} already exists.`);
    }

    data.account_id = this.accountId;
    data.external_id = id;
    this.districts.set(id, new District(data));
  }

  addPrecinct(id: string, data: Partial<Precinct>) {
    if (this.precincts.get(id)) {
      this.addError(`Precinct ${id} already exists.`);
    }

    data.account_id = this.accountId;
    data.external_id = id;
    this.precincts.set(id, new Precinct(data));
  }

  mapPrecinctToDistrict(precinctId: string, districtId: string) {
    const district = this.districts.get(districtId);
    if (!district) {
      this.addError('Cannot map precinct ', precinctId, ' to district ', districtId, ' because the district does not exist.');
    }

    const precinct = this.precincts.get(precinctId);
    if (!precinct) {
      this.addError('Cannot map precinct ', precinctId, ' to district ', districtId, ' because the precinct does not exist.');
    }

    precinct.external_district_ids.push(districtId);
  }

  addParty(id: string, data: Partial<Party>) {
    if (this.parties.get(id)) {
      this.addError(`Party ${id} already exists.`);
    }

    data.account_id = this.accountId;
    data.external_id = id;
    this.parties.set(id, new Party(data));
  }

  addCandidate(id: string, data: Partial<Candidate>) {
    if (this.candidates.get(id)) {
      this.addError(`Candidate ${id} already exists.`);
    }

    data.account_id = this.accountId;
    data.external_id = id;
    this.candidates.set(id, new Candidate(data));
  }

  createOptionsFromCandidates() {
    this.candidates.forEach(candidate => {
      const option = candidate.getOption();
      this.addOption(option.external_id, option)
    })
  }

  addOption(id: string, data: Partial<Option>) {
    if (this.options.get(id)) {
      this.addError(`Option ${id} already exists.`);
    }

    data.account_id = this.accountId;
    data.external_id = id;
    if (this.electionId) {
      data.external_election_id = this.electionId;
    }
    this.options.set(id, new Option(data));
  }

  addOffice(id: string, data: Partial<Office>) {
    if (this.offices.get(id)) {
      this.addError(`Office ${id} already exists.`);
    }

    data.account_id = this.accountId;
    data.external_id = id;
    this.offices.set(id, new Office(data));
  }

  createBoxesFromOffices() {
    this.offices.forEach(office => {
      const box = office.getBox();
      this.addBox(box.external_id, box)
    })
  }

  addMeasure(id: string, data: Partial<Measure>) {
    if (this.measures.get(id)) {
      this.addError(`Measure ${id} already exists.`);
    }

    data.account_id = this.accountId;
    data.external_id = id;
    if (this.electionId) {
      data.external_election_id = this.electionId;
    }
    this.measures.set(id, new Measure(data));
  }

  createBoxesFromMeasures() {
    this.measures.forEach(measure => {
      const box = measure.getBox();
      this.addBox(box.external_id, box)
    })
  }

  addBox(id: string, data: Partial<Box>) {
    if (this.boxes.get(id)) {
      this.addError(`Box ${id} already exists.`);
    }

    data.account_id = this.accountId;
    data.external_id = id;
    if (this.electionId) {
      data.external_election_id = this.electionId;
    }
    this.boxes.set(id, new Box(data));
  }

  updateBox(id: string, data: Partial<Box>) {
    const box = this.boxes.get(id);
    if (!box) {
      this.addError('Unable to update box', id, 'because it does not exist.');
    }

    Object.assign(box, data);
  }

  mapOptionToBox(optionId: string, boxId: string) {
    const box = this.boxes.get(boxId);
    if (!box) {
      this.addError('Cannot map option ', optionId, ' to box ', boxId, ' because the box does not exist.');
    }

    const option = this.options.get(optionId);
    if (!option) {
      this.addError('Cannot map option ', optionId, ' to district ', boxId, ' because the option does not exist.');
    }

    box.external_option_ids.push(optionId);
  }

  addStyle(id: string, data: Partial<Style>) {
    if (this.styles.get(id)) {
      this.addError(`Style ${id} already exists.`);
    }

    data.account_id = this.accountId;
    data.external_id = id;
    if (this.electionId) {
      data.external_election_id = this.electionId;
    }
    this.styles.set(id, new Style(data));
  }


  addError(...message: string[]) {
    const err = message.join(' ');
    if (this.throwOnError) {
      throw new Error(err);
    } else {
      this.errors.add(err);
    }
  }

  addWarning(...message: string[]) {
    const warning = message.join(' ');
    this.warnings.add(warning);
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
    if (lang === 'en') {
      this.value = text;
    } else {
      this.translations[lang] = text;
    }
  }
}


export class Language {
  account_id = '';
  external_id = '';
  name: string = '';
  code: string = '';

  constructor(defaultValues: Object = {}) {
    Object.keys(this).forEach(key => {
      if (defaultValues[key] !== undefined) {
        this[key] = defaultValues[key];
      }
    });
  }
}

export class District {
  account_id = '';
  external_id = '';
  name: string = '';
  type: string = '';
  districthndl: number=0;

  constructor(defaultValues: Object = {}) {
    Object.keys(this).forEach(key => {
      if (defaultValues[key] !== undefined) {
        this[key] = defaultValues[key];
      }
    });
  }
}

export class Precinct {
  account_id = '';
  external_id = '';
  pname: string = '';
  pid: string = '';
  sname: string = '';
  sid: string = '';

  external_district_ids: string[] = [];

  constructor(defaultValues: Object = {}) {
    Object.keys(this).forEach(key => {
      if (defaultValues[key] !== undefined) {
        this[key] = defaultValues[key];
      }
    });
  }
}

export class Party {
  account_id = '';
  external_id = '';
  name: TranslatableText = new TranslatableText();
  code: string = '';
  non_partisan: boolean = false;

  constructor(defaultValues: Object = {}) {
    Object.keys(this).forEach(key => {
      if (defaultValues[key] !== undefined) {
        this[key] = defaultValues[key];
      }
    });
  }
}


export class Office {
  account_id = '';
  external_id = '';
  num_selections: number = 1;
  num_writeins: number = 0;
  sequence: number = 0;
  id: string='';
  name: string = '';
  ballothead: string='';
  officemaster:number=0;

  // titles: TranslatableText[] = [];
  // text: TranslatableText[] = [];
  // term_start: number = 0;
  // term: number = 0;
  // external_district_ids: string[] = [];
  constructor(defaultValues: Object = {}) {
    Object.keys(this).forEach(key => {
      if (defaultValues[key] !== undefined) {
        this[key] = defaultValues[key];
      }
    });
  }

  getBox() {
    const box = new Box(this);
    box.external_ref_id = this.external_id;
    box.type = 'contest';
    box.num_selections = this.num_selections;
    return box;
  }
}

export class Measure {
  account_id = '';
  external_id = '';
  external_election_id: string = '';
  titles: TranslatableText[] = [];
  text: TranslatableText[] = [];
  num_selections: number = 1;
  num_writeins: number = 0;
  sequence: number = 0;

  external_district_ids: string[] = [];

  constructor(defaultValues: Object = {}) {
    Object.keys(this).forEach(key => {
      if (defaultValues[key] !== undefined) {
        this[key] = defaultValues[key];
      }
    });
  }

  getBox() {
    const box = new Box(this);
    box.external_election_id = this.external_election_id;
    box.external_ref_id = this.external_id;
    box.type = 'question';
    box.num_selections = this.num_selections;
    return box;
  }
}

export class Box {
  account_id = '';
  external_id = '';
  external_election_id = '';
  external_ref_id: string = '';
  external_district_ids: string[] = [];
  external_option_ids: string[] = [];
  external_party_ids: string[] = [];
  type: string = '';
  titles: TranslatableText[] = [];
  text: TranslatableText[] = [];
  num_selections: number = 0;
  sequence: number = 0;

  constructor(defaultValues: Object = {}) {
    Object.keys(this).forEach(key => {
      if (defaultValues[key] !== undefined) {
        this[key] = defaultValues[key];
      }
    });
  }
}

export class Candidate {
  account_id = '';
  external_id = '';
  // candidate_id: string='';
  // designation: string='';
  party_name: string='';
  contest_id: number = 0;
  party_hndl: number=0;
  titles: TranslatableText[] = [];
  sequence: number = 0;
  constructor(defaultValues: Object = {}) {
    Object.keys(this).forEach(key => {
      if (defaultValues[key] !== undefined) {
        this[key] = defaultValues[key];
      }
    });
  }

  getOption(): Option {
    const option = new Option(this);
    option.external_ref_id = this.external_id;
    option.type = 'default';
    return option;
  }
}

export class Option {
  account_id = '';
  external_id = '';
  external_election_id = '';
  external_ref_id = '';
  titles: TranslatableText[] = [];
  sequence = 0;
  type = 'default';

  constructor(defaultValues: Object = {}) {
    Object.keys(this).forEach(key => {
      if (defaultValues[key] !== undefined) {
        this[key] = defaultValues[key];
      }
    });
  }
}

export class Style {
  account_id = '';
  external_id = '';
  external_election_id: string = '';
  name: string = '';
  code: string = '';

  external_box_ids: string[] = [];
  external_precinct_ids: string[] = [];

  constructor(defaultValues: Object = {}) {
    Object.keys(this).forEach(key => {
      if (defaultValues[key] !== undefined) {
        this[key] = defaultValues[key];
      }
    });
  }
}
