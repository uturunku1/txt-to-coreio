"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TranslatableTextManager = /** @class */ (function () {
    function TranslatableTextManager() {
        this.items = [];
    }
    TranslatableTextManager.prototype.add = function (i, text, lang, style) {
        if (style === void 0) { style = 'default'; }
        if (this.items[i] === undefined) {
            this.items[i] = new TranslatableText();
            this.items[i].style = style;
        }
        this.items[i].add(text, lang.toLowerCase());
    };
    TranslatableTextManager.prototype.getText = function (languages) {
        return this.setLangCodes(this.items[0], languages);
    };
    TranslatableTextManager.prototype.getTextArray = function (languages) {
        var _this = this;
        return this.items.filter(function (item) {
            return item.value != '' || Object.keys(item.translations).length > 0;
        }).map(function (item) {
            return _this.setLangCodes(item, languages);
        });
    };
    // Convert language names to codes
    TranslatableTextManager.prototype.setLangCodes = function (text, langs) {
        langs.forEach(function (lang) {
            var partyName = lang.name.toLowerCase();
            if (text.translations[partyName]) {
                // @assumption - English is always defined like this
                if (partyName === 'english') {
                    text.value = text.translations[partyName];
                }
                else {
                    text.translations[lang.code] = text.translations[partyName];
                }
                delete text.translations[partyName];
            }
        });
        return text;
    };
    return TranslatableTextManager;
}());
exports.TranslatableTextManager = TranslatableTextManager;
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
        this.translations[lang] = text;
    };
    return TranslatableText;
}());
exports.TranslatableText = TranslatableText;
var Language = /** @class */ (function () {
    function Language(data) {
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
    return Language;
}());
exports.Language = Language;
var District = /** @class */ (function () {
    function District(data) {
        this.id = data.selecdistrictid;
        this.type = data.szdistricttypeofficialdesc;
        this.name = data.szelecdistrictname;
        this.districthndl = data.ldistricthndl;
    }
    return District;
}());
exports.District = District;
var Precinct = /** @class */ (function () {
    function Precinct(data) {
        this.external_district_ids = [];
        this.districtNames = [];
        this.id = data.id;
        this.pname = data.name;
        // @assumption - Using this value to map to VR. Not sure if this is correct
        this.pid = data.keyinid;
        for (var key in data) {
            if (key.substr(0, 2) === 'dt') {
                this.districtNames.push(data[key]);
            }
        }
    }
    return Precinct;
}());
exports.Precinct = Precinct;
var Party = /** @class */ (function () {
    function Party(data) {
        this.id = data.externalid;
        this.name = data.name;
        this.abbreviation = data.abbreviation;
        this.nonPartisan = data.independent === '1';
        this.titleManager = new TranslatableTextManager();
    }
    Party.prototype.setDisplayData = function (data) {
        var _this = this;
        data.filter(function (item) {
            return item.partyname === _this.name // Match the party
                && item.purpose === 'Audio'; // Audio is the field that holds translations
        }).forEach(function (item) {
            var tus = +item.numoftu;
            for (var i = 0; i < tus; i++) {
                _this.titleManager.add(i, item["tu" + (i + 1)], item.language);
            }
            // @todo: tus/rtf - Sometimes it's possible to have only rtf defined.
            // We can't/don't want to rely on rtf because it has special formatting.
            var appearance = item.appearance.toLowerCase();
            if (tus === 0 && appearance === 'rtf' && item.rtftext) {
                _this.titleManager.add(0, item.rtftext, item.language);
            }
        });
        // @todo: English not included on display data for sample
        this.titleManager.add(0, this.name, 'english');
    };
    return Party;
}());
exports.Party = Party;
var Contest = /** @class */ (function () {
    function Contest(data) {
        this.external_district_ids = [];
        this.headerNames = [];
        this.id = data.name;
        this.selections = +data.officevotefor;
        this.writeins = +data.officewriteins;
        this.boxSelections = data.overridevotefor === '1' ? +data.votefor : +data.officevotefor;
        this.boxWriteins = data.overridewriteins === '1' ? +data.writeins : +data.officewriteins;
        this.termlength = +data.termlength;
        this.type = 'contest';
        if (data.type === 'Candidacy') {
            this.type = 'contest';
        }
        else if (data.type === 'Measure') {
            this.type = 'measure';
        }
        else if (data.type === 'Instructional') {
            this.type = 'text';
        }
        else {
            console.warn('Unsupported type' + data.type);
        }
        // Assign headers so we can map them later
        for (var _i = 0, _a = Object.keys(data); _i < _a.length; _i++) {
            var key = _a[_i];
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
    Contest.prototype.setDisplayData = function (data) {
        var _this = this;
        data.filter(function (item) {
            return item.name === _this.name // Match the contest
                && item.purpose === 'Audio'; // Audio is the field that holds translations
        }).forEach(function (item) {
            // @todo: How to deal with proposition text?
            var tus = +item.numoftu;
            if (_this.type === 'contest') {
                for (var i = 0; i < tus; i++) {
                    // @assumption - All TUs after the first are subtitles
                    // @todo - Potentially make import templates so we can define TU# to style mapping
                    var style = i === 0 ? 'default' : 'subtitle';
                    _this.titleManager.add(i, item["tu" + (i + 1)], item.language, style);
                }
            }
            else if (_this.type === 'measure') {
                // @assumption - First TU is title and all following are text
                // Pull the first text unit as the title
                if (tus > 0) {
                    _this.titleManager.add(0, item['tu1'], item.language);
                }
                // The rest of them fall under text
                for (var i = 1; i < tus; i++) {
                    _this.textManager.add(i - 1, item["tu" + (i + 1)], item.language);
                }
            }
            // @todo: tus/rtf - Sometimes it's possible to have only rtf defined.
            // We can't/don't want to rely on rtf because it has special formatting.
            var appearance = item.appearance.toLowerCase();
            if (tus === 0 && appearance === 'rtf' && item.rtftext) {
                _this.titleManager.add(0, item.rtftext, item.language);
            }
        });
    };
    Contest.sequence = 10;
    return Contest;
}());
exports.Contest = Contest;
var Choice = /** @class */ (function () {
    function Choice(data) {
        this.id = data.id;
        this.name = data.name;
        this.type = 'default';
        if (data.type === 'Write In') {
            this.type = 'writein';
        }
        else if (data.type === 'Qualified Writein') {
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
    Choice.prototype.setDisplayData = function (displayData) {
        var _this = this;
        displayData.filter(function (item) {
            return item.choicename === _this.name // Match the choice name
                && item.contestname === _this.contestName // Match the contest
                && item.purpose === 'Audio'; // Audio is the field that holds translations
        }).forEach(function (item) {
            var tus = +item.numoftu;
            for (var i = 0; i < tus; i++) {
                _this.titleManager.add(i, item["tu" + (i + 1)], item.language);
            }
            // @todo: tus/rtf - Sometimes it's possible to have only rtf defined.
            // We can't/don't want to rely on rtf because it has special formatting.
            var appearance = item.appearance.toLowerCase();
            if (tus === 0 && appearance === 'rtf' && item.rtftext) {
                _this.titleManager.add(0, item.rtftext, item.language);
            }
        });
    };
    Choice.sequence = 10;
    return Choice;
}());
exports.Choice = Choice;
var Header = /** @class */ (function () {
    function Header(data) {
        this.id = data.name;
        this.name = data.name;
        // @assumption - Only importing data defined as paper ballot
        var purpose = data.purpose.toLowerCase();
        this.include = (purpose === 'paper ballot' || purpose === 'both');
        this.titleManager = new TranslatableTextManager();
    }
    Header.prototype.setDisplayData = function (displayData) {
        var _this = this;
        displayData.filter(function (item) {
            return item.contestheadingname === _this.name // Match the name
                && item.purpose === 'Audio'; // Audio is the field that holds translations
        }).forEach(function (item) {
            var tus = +item.numoftu;
            for (var i = 0; i < tus; i++) {
                _this.titleManager.add(i, item["tu" + (i + 1)], item.language);
            }
            // @todo: tus/rtf - Sometimes it's possible to have only rtf defined.
            // We can't/don't want to rely on rtf because it has special formatting.
            var appearance = item.appearance.toLowerCase();
            if (tus === 0 && appearance === 'rtf' && item.rtftext) {
                _this.titleManager.add(0, item.rtftext, item.language);
            }
        });
    };
    return Header;
}());
exports.Header = Header;
var BallotType = /** @class */ (function () {
    function BallotType(data) {
        this.external_box_ids = [];
        this.external_precinct_ids = [];
        this.id = data.externalid ? data.externalid : data.id;
        this.code = data.abbreviation ? data.abbreviation : data.id;
        this.name = data.name;
    }
    return BallotType;
}());
exports.BallotType = BallotType;
var BallotTypeContestMapper = /** @class */ (function () {
    function BallotTypeContestMapper(data) {
        var _this = this;
        this.styles = new Map();
        data.forEach(function (item) {
            var contests = _this.styles.get(item.ballottypename);
            if (!contests) {
                contests = new Set();
                _this.styles.set(item.ballottypename, contests);
            }
            contests.add(item.contestname);
        });
    }
    BallotTypeContestMapper.prototype.get = function (styleName) {
        return this.styles.get(styleName);
    };
    return BallotTypeContestMapper;
}());
exports.BallotTypeContestMapper = BallotTypeContestMapper;
var BallotTypePrecinctMapper = /** @class */ (function () {
    function BallotTypePrecinctMapper(data) {
        var _this = this;
        this.styles = new Map();
        data.forEach(function (item) {
            var precincts = _this.styles.get(item.ballottypename);
            if (!precincts) {
                precincts = new Set();
                _this.styles.set(item.ballottypename, precincts);
            }
            precincts.add(item.precinctid);
        });
    }
    BallotTypePrecinctMapper.prototype.get = function (styleName) {
        return this.styles.get(styleName);
    };
    return BallotTypePrecinctMapper;
}());
exports.BallotTypePrecinctMapper = BallotTypePrecinctMapper;
//# sourceMappingURL=models2.js.map