"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CoreIO = /** @class */ (function () {
    function CoreIO(accountId, electionId, throwOnError) {
        if (throwOnError === void 0) { throwOnError = true; }
        this.accountId = accountId;
        this.electionId = electionId;
        this.throwOnError = throwOnError;
        this.languages = new Map();
        this.districts = new Map();
        this.precincts = new Map();
        this.parties = new Map();
        this.offices = new Map();
        this.candidates = new Map();
        this.measures = new Map();
        this.boxes = new Map();
        this.options = new Map();
        this.styles = new Map();
        this.errors = new Set();
        this.warnings = new Set();
    }
    CoreIO.prototype.getData = function () {
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
        };
    };
    CoreIO.prototype.addLanguage = function (id, data) {
        if (this.languages.get(id)) {
            this.addError("Language " + id + " already exists.");
        }
        data.account_id = this.accountId;
        data.external_id = id;
        this.languages.set(id, new Language(data));
    };
    CoreIO.prototype.addDistrict = function (id, data) {
        if (this.districts.get(id)) {
            this.addError("District " + id + " already exists.");
        }
        data.account_id = this.accountId;
        data.external_id = id;
        this.districts.set(id, new District(data));
    };
    CoreIO.prototype.addPrecinct = function (id, data) {
        if (this.precincts.get(id)) {
            this.addError("Precinct " + id + " already exists.");
        }
        data.account_id = this.accountId;
        data.external_id = id;
        this.precincts.set(id, new Precinct(data));
    };
    CoreIO.prototype.mapPrecinctToDistrict = function (precinctId, districtId) {
        var district = this.districts.get(districtId);
        if (!district) {
            this.addError('Cannot map precinct ', precinctId, ' to district ', districtId, ' because the district does not exist.');
        }
        var precinct = this.precincts.get(precinctId);
        if (!precinct) {
            this.addError('Cannot map precinct ', precinctId, ' to district ', districtId, ' because the precinct does not exist.');
        }
        precinct.external_district_ids.push(districtId);
    };
    CoreIO.prototype.addParty = function (id, data) {
        if (this.parties.get(id)) {
            this.addError("Party " + id + " already exists.");
        }
        data.account_id = this.accountId;
        data.external_id = id;
        this.parties.set(id, new Party(data));
    };
    CoreIO.prototype.addCandidate = function (id, data) {
        if (this.candidates.get(id)) {
            this.addError("Candidate " + id + " already exists.");
        }
        data.account_id = this.accountId;
        data.external_id = id;
        this.candidates.set(id, new Candidate(data));
    };
    CoreIO.prototype.createOptionsFromCandidates = function () {
        var _this = this;
        this.candidates.forEach(function (candidate) {
            var option = candidate.getOption();
            _this.addOption(option.external_id, option);
        });
    };
    CoreIO.prototype.addOption = function (id, data) {
        if (this.options.get(id)) {
            this.addError("Option " + id + " already exists.");
        }
        data.account_id = this.accountId;
        data.external_id = id;
        if (this.electionId) {
            data.external_election_id = this.electionId;
        }
        this.options.set(id, new Option(data));
    };
    CoreIO.prototype.addOffice = function (id, data) {
        if (this.offices.get(id)) {
            this.addError("Office " + id + " already exists.");
        }
        data.account_id = this.accountId;
        data.external_id = id;
        this.offices.set(id, new Office(data));
    };
    CoreIO.prototype.createBoxesFromOffices = function () {
        var _this = this;
        this.offices.forEach(function (office) {
            var box = office.getBox();
            _this.addBox(box.external_id, box);
        });
    };
    CoreIO.prototype.addMeasure = function (id, data) {
        if (this.measures.get(id)) {
            this.addError("Measure " + id + " already exists.");
        }
        data.account_id = this.accountId;
        data.external_id = id;
        if (this.electionId) {
            data.external_election_id = this.electionId;
        }
        this.measures.set(id, new Measure(data));
    };
    CoreIO.prototype.createBoxesFromMeasures = function () {
        var _this = this;
        this.measures.forEach(function (measure) {
            var box = measure.getBox();
            _this.addBox(box.external_id, box);
        });
    };
    CoreIO.prototype.addBox = function (id, data) {
        if (this.boxes.get(id)) {
            this.addError("Box " + id + " already exists.");
        }
        data.account_id = this.accountId;
        data.external_id = id;
        if (this.electionId) {
            data.external_election_id = this.electionId;
        }
        this.boxes.set(id, new Box(data));
    };
    CoreIO.prototype.updateBox = function (id, data) {
        var box = this.boxes.get(id);
        if (!box) {
            this.addError('Unable to update box', id, 'because it does not exist.');
        }
        Object.assign(box, data);
    };
    CoreIO.prototype.mapOptionToBox = function (optionId, boxId) {
        var box = this.boxes.get(boxId);
        if (!box) {
            this.addError('Cannot map option ', optionId, ' to box ', boxId, ' because the box does not exist.');
        }
        var option = this.options.get(optionId);
        if (!option) {
            this.addError('Cannot map option ', optionId, ' to district ', boxId, ' because the option does not exist.');
        }
        box.external_option_ids.push(optionId);
    };
    CoreIO.prototype.addStyle = function (id, data) {
        if (this.styles.get(id)) {
            this.addError("Style " + id + " already exists.");
        }
        data.account_id = this.accountId;
        data.external_id = id;
        if (this.electionId) {
            data.external_election_id = this.electionId;
        }
        this.styles.set(id, new Style(data));
    };
    CoreIO.prototype.addError = function () {
        var message = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            message[_i] = arguments[_i];
        }
        var err = message.join(' ');
        if (this.throwOnError) {
            throw new Error(err);
        }
        else {
            this.errors.add(err);
        }
    };
    CoreIO.prototype.addWarning = function () {
        var message = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            message[_i] = arguments[_i];
        }
        var warning = message.join(' ');
        this.warnings.add(warning);
    };
    return CoreIO;
}());
exports.CoreIO = CoreIO;
var TranslatableText = /** @class */ (function () {
    function TranslatableText(value) {
        if (value === void 0) { value = ''; }
        this.value = '';
        this.format = 'style';
        this.style = 'default';
        this.translations = {};
        this.value = value;
    }
    TranslatableText.prototype.add = function (text, lang) {
        if (lang === 'en') {
            this.value = text;
        }
        else {
            this.translations[lang] = text;
        }
    };
    return TranslatableText;
}());
exports.TranslatableText = TranslatableText;
var Language = /** @class */ (function () {
    function Language(defaultValues) {
        if (defaultValues === void 0) { defaultValues = {}; }
        var _this = this;
        this.account_id = '';
        this.external_id = '';
        this.name = '';
        this.code = '';
        Object.keys(this).forEach(function (key) {
            if (defaultValues[key] !== undefined) {
                _this[key] = defaultValues[key];
            }
        });
    }
    return Language;
}());
exports.Language = Language;
var District = /** @class */ (function () {
    function District(defaultValues) {
        if (defaultValues === void 0) { defaultValues = {}; }
        var _this = this;
        this.account_id = '';
        this.external_id = '';
        this.name = '';
        this.type = '';
        this.districthndl = 0;
        Object.keys(this).forEach(function (key) {
            if (defaultValues[key] !== undefined) {
                _this[key] = defaultValues[key];
            }
        });
    }
    return District;
}());
exports.District = District;
var Precinct = /** @class */ (function () {
    function Precinct(defaultValues) {
        if (defaultValues === void 0) { defaultValues = {}; }
        var _this = this;
        this.account_id = '';
        this.external_id = '';
        this.pname = '';
        this.pid = '';
        this.sname = '';
        this.sid = '';
        this.external_district_ids = [];
        Object.keys(this).forEach(function (key) {
            if (defaultValues[key] !== undefined) {
                _this[key] = defaultValues[key];
            }
        });
    }
    return Precinct;
}());
exports.Precinct = Precinct;
var Party = /** @class */ (function () {
    function Party(defaultValues) {
        if (defaultValues === void 0) { defaultValues = {}; }
        var _this = this;
        this.account_id = '';
        this.external_id = '';
        this.name = new TranslatableText();
        this.code = '';
        this.non_partisan = false;
        Object.keys(this).forEach(function (key) {
            if (defaultValues[key] !== undefined) {
                _this[key] = defaultValues[key];
            }
        });
    }
    return Party;
}());
exports.Party = Party;
var Office = /** @class */ (function () {
    // titles: TranslatableText[] = [];
    // text: TranslatableText[] = [];
    // term_start: number = 0;
    // term: number = 0;
    // external_district_ids: string[] = [];
    function Office(defaultValues) {
        if (defaultValues === void 0) { defaultValues = {}; }
        var _this = this;
        this.account_id = '';
        this.external_id = '';
        this.num_selections = 1;
        this.num_writeins = 0;
        this.sequence = 0;
        this.id = '';
        this.name = '';
        this.ballothead = '';
        this.officemaster = 0;
        Object.keys(this).forEach(function (key) {
            if (defaultValues[key] !== undefined) {
                _this[key] = defaultValues[key];
            }
        });
    }
    Office.prototype.getBox = function () {
        var box = new Box(this);
        box.external_ref_id = this.external_id;
        box.type = 'contest';
        box.num_selections = this.num_selections;
        return box;
    };
    return Office;
}());
exports.Office = Office;
var Measure = /** @class */ (function () {
    function Measure(defaultValues) {
        if (defaultValues === void 0) { defaultValues = {}; }
        var _this = this;
        this.account_id = '';
        this.external_id = '';
        this.external_election_id = '';
        this.titles = [];
        this.text = [];
        this.num_selections = 1;
        this.num_writeins = 0;
        this.sequence = 0;
        this.external_district_ids = [];
        Object.keys(this).forEach(function (key) {
            if (defaultValues[key] !== undefined) {
                _this[key] = defaultValues[key];
            }
        });
    }
    Measure.prototype.getBox = function () {
        var box = new Box(this);
        box.external_election_id = this.external_election_id;
        box.external_ref_id = this.external_id;
        box.type = 'question';
        box.num_selections = this.num_selections;
        return box;
    };
    return Measure;
}());
exports.Measure = Measure;
var Box = /** @class */ (function () {
    function Box(defaultValues) {
        if (defaultValues === void 0) { defaultValues = {}; }
        var _this = this;
        this.account_id = '';
        this.external_id = '';
        this.external_election_id = '';
        this.external_ref_id = '';
        this.external_district_ids = [];
        this.external_option_ids = [];
        this.external_party_ids = [];
        this.type = '';
        this.titles = [];
        this.text = [];
        this.num_selections = 0;
        this.sequence = 0;
        Object.keys(this).forEach(function (key) {
            if (defaultValues[key] !== undefined) {
                _this[key] = defaultValues[key];
            }
        });
    }
    return Box;
}());
exports.Box = Box;
var Candidate = /** @class */ (function () {
    function Candidate(defaultValues) {
        if (defaultValues === void 0) { defaultValues = {}; }
        var _this = this;
        this.account_id = '';
        this.external_id = '';
        // candidate_id: string='';
        // designation: string='';
        this.party_name = '';
        this.contest_id = 0;
        this.party_hndl = 0;
        this.titles = [];
        this.sequence = 0;
        Object.keys(this).forEach(function (key) {
            if (defaultValues[key] !== undefined) {
                _this[key] = defaultValues[key];
            }
        });
    }
    Candidate.prototype.getOption = function () {
        var option = new Option(this);
        option.external_ref_id = this.external_id;
        option.type = 'default';
        return option;
    };
    return Candidate;
}());
exports.Candidate = Candidate;
var Option = /** @class */ (function () {
    function Option(defaultValues) {
        if (defaultValues === void 0) { defaultValues = {}; }
        var _this = this;
        this.account_id = '';
        this.external_id = '';
        this.external_election_id = '';
        this.external_ref_id = '';
        this.titles = [];
        this.sequence = 0;
        this.type = 'default';
        Object.keys(this).forEach(function (key) {
            if (defaultValues[key] !== undefined) {
                _this[key] = defaultValues[key];
            }
        });
    }
    return Option;
}());
exports.Option = Option;
var Style = /** @class */ (function () {
    function Style(defaultValues) {
        if (defaultValues === void 0) { defaultValues = {}; }
        var _this = this;
        this.account_id = '';
        this.external_id = '';
        this.external_election_id = '';
        this.name = '';
        this.code = '';
        this.external_box_ids = [];
        this.external_precinct_ids = [];
        Object.keys(this).forEach(function (key) {
            if (defaultValues[key] !== undefined) {
                _this[key] = defaultValues[key];
            }
        });
    }
    return Style;
}());
exports.Style = Style;
//# sourceMappingURL=coreio.js.map