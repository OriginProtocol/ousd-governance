"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var web3_1 = __importDefault(require("web3"));
var ethereum_events_1 = __importDefault(require("ethereum-events"));
var governance_localhost_json_1 = __importDefault(require("ousd-governance-client/networks/governance.localhost.json"));
var WEB3_PROVIDER = process.env.WEB3_PROVIDER || "http://localhost:8545";
var contracts = [
    {
        name: "Governance",
        address: governance_localhost_json_1["default"].Governance.address,
        abi: governance_localhost_json_1["default"].Governance.abi,
        events: ["ProposalCreated"]
    },
    {
        name: "VoteLockerCurve",
        address: governance_localhost_json_1["default"].VoteLockerCurve.address,
        abi: governance_localhost_json_1["default"].VoteLockerCurve.abi,
        events: ["Lockup"]
    },
];
var options = {
    pollInterval: 13000,
    confirmations: 12,
    chunkSize: 10000,
    concurrency: 10,
    backoff: 1000
};
var web3 = new web3_1["default"](WEB3_PROVIDER);
var ethereumEvents = new ethereum_events_1["default"](web3, contracts, options);
ethereumEvents.on("block.confirmed", function (blockNumber, events, done) {
    console.log(events);
});
ethereumEvents.start(0);
