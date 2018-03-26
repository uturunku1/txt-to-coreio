"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var models2_1 = require("./models2");
var coreio_1 = require("./coreio");
var PapaWrapper_1 = require("./PapaWrapper");
var fileprocess_1 = require("./fileprocess");
var fs = require('fs');
var path = require('path');
var fileNameDistricts;
var fileNameCandidates;
var fileNameContests;
var Parser = /** @class */ (function () {
    // files: string[]=[];
    function Parser(dir) {
        this.dir = dir;
        var errors = this.runChecks(this.dir);
        if (errors == true) {
            console.error('Missing one of the files needed to run this program.');
            return;
        }
    }
    Parser.prototype.runChecks = function (directory) {
        var files = [];
        fs.readdirSync(this.dir).forEach(function (file) {
            if (path.extname(file).toLowerCase() == '.txt') {
                files.push(file);
            }
            else {
                console.warn('invalid file format', file);
            }
        });
        fileNameDistricts = files.find(function (i) { return i.includes('DistrictExtract'); });
        fileNameCandidates = files.find(function (i) { return i.includes('CandidateExtract'); });
        fileNameContests = files.find(function (i) { return i.includes('ContestExtract'); });
        if (fileNameDistricts === undefined || fileNameCandidates === undefined || fileNameContests === undefined) {
            return true;
        }
    };
    Parser.prototype.parse = function (accountId, electionId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var districts, candidates, contests;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.coreio = new coreio_1.CoreIO(accountId, electionId);
                        return [4 /*yield*/, this.getDistricts()];
                    case 1:
                        districts = _a.sent();
                        districts.forEach(function (district) {
                            try {
                                _this.coreio.addDistrict(district.id, district);
                            }
                            catch (error) {
                                console.warn('This district id already exists:', district.id);
                            }
                        });
                        return [4 /*yield*/, this.getChoices()];
                    case 2:
                        candidates = _a.sent();
                        candidates.forEach(function (choice) {
                            try {
                                // console.log(choice);
                                _this.coreio.addCandidate(choice.candidateID, choice);
                            }
                            catch (error) {
                                console.warn('This choice id already exists:', choice.candidateID);
                            }
                        });
                        this.coreio.createOptionsFromCandidates();
                        return [4 /*yield*/, this.getContests()];
                    case 3:
                        contests = _a.sent();
                        contests.forEach(function (contest) {
                            try {
                                _this.coreio.addOffice(contest.id, contest);
                            }
                            catch (error) {
                                console.warn('This contest id already exists:', contest.id);
                            }
                        });
                        this.coreio.createBoxesFromOffices();
                        return [2 /*return*/];
                }
            });
        });
    };
    Parser.prototype.getDistricts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var papaDistricts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.callPapaAndNormalized(fileNameDistricts)];
                    case 1:
                        papaDistricts = _a.sent();
                        return [2 /*return*/, papaDistricts.map(function (district) {
                                return new models2_1.District(district);
                            })];
                }
            });
        });
    };
    Parser.prototype.getChoices = function () {
        return __awaiter(this, void 0, void 0, function () {
            var papaChoices;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.callPapaAndNormalized(fileNameCandidates)];
                    case 1:
                        papaChoices = _a.sent();
                        //pass to models2 class choice
                        return [2 /*return*/, papaChoices.map(function (candidate) {
                                return new models2_1.Choice(candidate);
                                // choice.setDisplayData(papaChoices);
                            })];
                }
            });
        });
    };
    Parser.prototype.getContests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var papaContests;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.callPapaAndNormalized(fileNameContests)];
                    case 1:
                        papaContests = _a.sent();
                        return [2 /*return*/, papaContests.map(function (contest) {
                                return new models2_1.Contest(contest);
                            })];
                }
            });
        });
    };
    Parser.prototype.callPapaAndNormalized = function (fileName) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, PapaWrapper_1.parseCsvFile(this.dir + '/' + fileName)];
                    case 1:
                        _a.papa = _b.sent();
                        return [2 /*return*/, (this.papa).data.map(function (row) {
                                var ret = {};
                                for (var key in row) {
                                    var normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                                    ret[normalized] = row[key];
                                }
                                return ret;
                            })];
                }
            });
        });
    };
    Parser.prototype.parseAndSave = function (accountId, electionId) {
        return __awaiter(this, void 0, void 0, function () {
            var parseResults, serializedData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.parse(accountId, electionId)];
                    case 1:
                        parseResults = _a.sent();
                        serializedData = JSON.stringify(this.coreio.getData(), null, ' ');
                        return [4 /*yield*/, fileprocess_1.write('./output/data.json', serializedData)];
                    case 2:
                        _a.sent();
                        console.log("Done Writing to JSON file");
                        return [2 /*return*/];
                }
            });
        });
    };
    return Parser;
}());
var p = new Parser('./input');
// p.parse('dev', '1');
p.parseAndSave('dev', '1');
//# sourceMappingURL=index.js.map