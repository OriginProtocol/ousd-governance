import fs from "fs";
import { ethers, BigNumber } from "ethers";
import EthereumEvents from "ethereum-events";
import Web3 from "web3";

const OUSD_POOL_ADDRESS = "0x87650d7bbfc3a9f10587d7778206671719d9910d";
const OUSD_POOL_DEPLOY_BLOCK = 12860905;
const OUSD_POOL_ABI = JSON.parse(
  '[{"name":"Transfer","inputs":[{"type":"address","name":"sender","indexed":true},{"type":"address","name":"receiver","indexed":true},{"type":"uint256","name":"value","indexed":false}],"anonymous":false,"type":"event"},{"name":"Approval","inputs":[{"type":"address","name":"owner","indexed":true},{"type":"address","name":"spender","indexed":true},{"type":"uint256","name":"value","indexed":false}],"anonymous":false,"type":"event"},{"name":"TokenExchange","inputs":[{"type":"address","name":"buyer","indexed":true},{"type":"int128","name":"sold_id","indexed":false},{"type":"uint256","name":"tokens_sold","indexed":false},{"type":"int128","name":"bought_id","indexed":false},{"type":"uint256","name":"tokens_bought","indexed":false}],"anonymous":false,"type":"event"},{"name":"TokenExchangeUnderlying","inputs":[{"type":"address","name":"buyer","indexed":true},{"type":"int128","name":"sold_id","indexed":false},{"type":"uint256","name":"tokens_sold","indexed":false},{"type":"int128","name":"bought_id","indexed":false},{"type":"uint256","name":"tokens_bought","indexed":false}],"anonymous":false,"type":"event"},{"name":"AddLiquidity","inputs":[{"type":"address","name":"provider","indexed":true},{"type":"uint256[2]","name":"token_amounts","indexed":false},{"type":"uint256[2]","name":"fees","indexed":false},{"type":"uint256","name":"invariant","indexed":false},{"type":"uint256","name":"token_supply","indexed":false}],"anonymous":false,"type":"event"},{"name":"RemoveLiquidity","inputs":[{"type":"address","name":"provider","indexed":true},{"type":"uint256[2]","name":"token_amounts","indexed":false},{"type":"uint256[2]","name":"fees","indexed":false},{"type":"uint256","name":"token_supply","indexed":false}],"anonymous":false,"type":"event"},{"name":"RemoveLiquidityOne","inputs":[{"type":"address","name":"provider","indexed":true},{"type":"uint256","name":"token_amount","indexed":false},{"type":"uint256","name":"coin_amount","indexed":false},{"type":"uint256","name":"token_supply","indexed":false}],"anonymous":false,"type":"event"},{"name":"RemoveLiquidityImbalance","inputs":[{"type":"address","name":"provider","indexed":true},{"type":"uint256[2]","name":"token_amounts","indexed":false},{"type":"uint256[2]","name":"fees","indexed":false},{"type":"uint256","name":"invariant","indexed":false},{"type":"uint256","name":"token_supply","indexed":false}],"anonymous":false,"type":"event"},{"name":"CommitNewAdmin","inputs":[{"type":"uint256","name":"deadline","indexed":true},{"type":"address","name":"admin","indexed":true}],"anonymous":false,"type":"event"},{"name":"NewAdmin","inputs":[{"type":"address","name":"admin","indexed":true}],"anonymous":false,"type":"event"},{"name":"CommitNewFee","inputs":[{"type":"uint256","name":"deadline","indexed":true},{"type":"uint256","name":"fee","indexed":false},{"type":"uint256","name":"admin_fee","indexed":false}],"anonymous":false,"type":"event"},{"name":"NewFee","inputs":[{"type":"uint256","name":"fee","indexed":false},{"type":"uint256","name":"admin_fee","indexed":false}],"anonymous":false,"type":"event"},{"name":"RampA","inputs":[{"type":"uint256","name":"old_A","indexed":false},{"type":"uint256","name":"new_A","indexed":false},{"type":"uint256","name":"initial_time","indexed":false},{"type":"uint256","name":"future_time","indexed":false}],"anonymous":false,"type":"event"},{"name":"StopRampA","inputs":[{"type":"uint256","name":"A","indexed":false},{"type":"uint256","name":"t","indexed":false}],"anonymous":false,"type":"event"},{"outputs":[],"inputs":[],"savedProgressMutability":"nonpayable","type":"constructor"},{"name":"initialize","outputs":[],"inputs":[{"type":"string","name":"_name"},{"type":"string","name":"_symbol"},{"type":"address","name":"_coin"},{"type":"uint256","name":"_decimals"},{"type":"uint256","name":"_A"},{"type":"uint256","name":"_fee"},{"type":"address","name":"_admin"}],"savedProgressMutability":"nonpayable","type":"function","gas":470049},{"name":"decimals","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":291},{"name":"transfer","outputs":[{"type":"bool","name":""}],"inputs":[{"type":"address","name":"_to"},{"type":"uint256","name":"_value"}],"savedProgressMutability":"nonpayable","type":"function","gas":75402},{"name":"transferFrom","outputs":[{"type":"bool","name":""}],"inputs":[{"type":"address","name":"_from"},{"type":"address","name":"_to"},{"type":"uint256","name":"_value"}],"savedProgressMutability":"nonpayable","type":"function","gas":112037},{"name":"approve","outputs":[{"type":"bool","name":""}],"inputs":[{"type":"address","name":"_spender"},{"type":"uint256","name":"_value"}],"savedProgressMutability":"nonpayable","type":"function","gas":37854},{"name":"get_previous_balances","outputs":[{"type":"uint256[2]","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2254},{"name":"get_balances","outputs":[{"type":"uint256[2]","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2284},{"name":"get_twap_balances","outputs":[{"type":"uint256[2]","name":""}],"inputs":[{"type":"uint256[2]","name":"_first_balances"},{"type":"uint256[2]","name":"_last_balances"},{"type":"uint256","name":"_time_elapsed"}],"savedProgressMutability":"view","type":"function","gas":1522},{"name":"get_price_cumulative_last","outputs":[{"type":"uint256[2]","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2344},{"name":"admin_fee","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":621},{"name":"A","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":5859},{"name":"A_precise","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":5821},{"name":"get_virtual_price","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":1011891},{"name":"calc_token_amount","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256[2]","name":"_amounts"},{"type":"bool","name":"_is_deposit"}],"savedProgressMutability":"view","type":"function"},{"name":"calc_token_amount","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256[2]","name":"_amounts"},{"type":"bool","name":"_is_deposit"},{"type":"bool","name":"_previous"}],"savedProgressMutability":"view","type":"function"},{"name":"add_liquidity","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256[2]","name":"_amounts"},{"type":"uint256","name":"_min_mint_amount"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"add_liquidity","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256[2]","name":"_amounts"},{"type":"uint256","name":"_min_mint_amount"},{"type":"address","name":"_receiver"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"get_dy","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"}],"savedProgressMutability":"view","type":"function"},{"name":"get_dy","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"},{"type":"uint256[2]","name":"_balances"}],"savedProgressMutability":"view","type":"function"},{"name":"get_dy_underlying","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"}],"savedProgressMutability":"view","type":"function"},{"name":"get_dy_underlying","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"},{"type":"uint256[2]","name":"_balances"}],"savedProgressMutability":"view","type":"function"},{"name":"exchange","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"},{"type":"uint256","name":"min_dy"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"exchange","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"},{"type":"uint256","name":"min_dy"},{"type":"address","name":"_receiver"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"exchange_underlying","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"},{"type":"uint256","name":"min_dy"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"exchange_underlying","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"int128","name":"i"},{"type":"int128","name":"j"},{"type":"uint256","name":"dx"},{"type":"uint256","name":"min_dy"},{"type":"address","name":"_receiver"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"remove_liquidity","outputs":[{"type":"uint256[2]","name":""}],"inputs":[{"type":"uint256","name":"_burn_amount"},{"type":"uint256[2]","name":"_min_amounts"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"remove_liquidity","outputs":[{"type":"uint256[2]","name":""}],"inputs":[{"type":"uint256","name":"_burn_amount"},{"type":"uint256[2]","name":"_min_amounts"},{"type":"address","name":"_receiver"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"remove_liquidity_imbalance","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256[2]","name":"_amounts"},{"type":"uint256","name":"_max_burn_amount"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"remove_liquidity_imbalance","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256[2]","name":"_amounts"},{"type":"uint256","name":"_max_burn_amount"},{"type":"address","name":"_receiver"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"calc_withdraw_one_coin","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256","name":"_burn_amount"},{"type":"int128","name":"i"}],"savedProgressMutability":"view","type":"function"},{"name":"calc_withdraw_one_coin","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256","name":"_burn_amount"},{"type":"int128","name":"i"},{"type":"bool","name":"_previous"}],"savedProgressMutability":"view","type":"function"},{"name":"remove_liquidity_one_coin","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256","name":"_burn_amount"},{"type":"int128","name":"i"},{"type":"uint256","name":"_min_received"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"remove_liquidity_one_coin","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256","name":"_burn_amount"},{"type":"int128","name":"i"},{"type":"uint256","name":"_min_received"},{"type":"address","name":"_receiver"}],"savedProgressMutability":"nonpayable","type":"function"},{"name":"ramp_A","outputs":[],"inputs":[{"type":"uint256","name":"_future_A"},{"type":"uint256","name":"_future_time"}],"savedProgressMutability":"nonpayable","type":"function","gas":152464},{"name":"stop_ramp_A","outputs":[],"inputs":[],"savedProgressMutability":"nonpayable","type":"function","gas":149225},{"name":"admin_balances","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256","name":"i"}],"savedProgressMutability":"view","type":"function","gas":3601},{"name":"withdraw_admin_fees","outputs":[],"inputs":[],"savedProgressMutability":"nonpayable","type":"function","gas":11347},{"name":"admin","outputs":[{"type":"address","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2141},{"name":"coins","outputs":[{"type":"address","name":""}],"inputs":[{"type":"uint256","name":"arg0"}],"savedProgressMutability":"view","type":"function","gas":2280},{"name":"balances","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"uint256","name":"arg0"}],"savedProgressMutability":"view","type":"function","gas":2310},{"name":"fee","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2231},{"name":"block_timestamp_last","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2261},{"name":"initial_A","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2291},{"name":"future_A","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2321},{"name":"initial_A_time","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2351},{"name":"future_A_time","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2381},{"name":"name","outputs":[{"type":"string","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":8813},{"name":"symbol","outputs":[{"type":"string","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":7866},{"name":"balanceOf","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"arg0"}],"savedProgressMutability":"view","type":"function","gas":2686},{"name":"allowance","outputs":[{"type":"uint256","name":""}],"inputs":[{"type":"address","name":"arg0"},{"type":"address","name":"arg1"}],"savedProgressMutability":"view","type":"function","gas":2931},{"name":"totalSupply","outputs":[{"type":"uint256","name":""}],"inputs":[],"savedProgressMutability":"view","type":"function","gas":2531}]'
);
const STOP_BLOCK = 14592991;
const PROGRESS_FILE = "progress.json";

let savedProgress;
try {
  savedProgress = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf8"));
} catch (error) {
  console.log("No progress file, starting from deployment of pool");
  savedProgress = {
    blockNumber: OUSD_POOL_DEPLOY_BLOCK,
    liquidityProvision: {},
  };
}

const options = {
  pollInterval: 10000, // period between polls in milliseconds (default: 13000)
  // Confirmed as soon as we've got it. No real problem with reorgs.
  // Don't use an integer here because it is falsy
  confirmations: "0",
  chunkSize: 10000, // n° of blocks to fetch at a time (default: 10000)
  concurrency: 10, // maximum n° of concurrent web3 requests (default: 10)
  backoff: 1000, // retry backoff in milliseconds (default: 1000)
};
const web3 = new Web3(process.env.PROVIDER_URL);
const contracts = [
  {
    name: "OUSD3CRV-f",
    address: OUSD_POOL_ADDRESS,
    abi: OUSD_POOL_ABI,
    events: [
      "AddLiquidity",
      "RemoveLiquidity",
      "RemoveLiquidityOne",
      "RemoveLiquidityImbalance",
    ],
  },
];
const ethereumEvents = new EthereumEvents(web3, contracts, options);

const liquidityProvision = savedProgress.liquidityProvision;

const handleEvents = async (blockNumber, events, done) => {
  const addedThisBlock = [];
  for (const event of events) {
    if (event.name == "AddLiquidity") {
      // This only needs to be done once in add liquidity because it should
      // always be initialised before removing liquidity
      if (liquidityProvision[event.from] === undefined) {
        liquidityProvision[event.from] = BigNumber.from(0);
      }
      liquidityProvision[event.from] = liquidityProvision[event.from].add(
        BigNumber.from(event.values.token_amounts[0]).add(
          BigNumber.from(event.values.token_amounts[1])
        )
      );
      addedThisBlock.push(event.from);
    } else if (
      event.name == "RemoveLiquidity" ||
      event.name == "RemoveLiquidityImbalance"
    ) {
      liquidityProvision[event.from] = liquidityProvision[event.from].sub(
        BigNumber.from(event.values.token_amounts[0]).add(
          BigNumber.from(event.values.token_amounts[1])
        )
      );
    } else if (event.name == "RemoveLiquidityOne") {
      liquidityProvision[event.from] = liquidityProvision[event.from].sub(
        BigNumber.from(event.values.token_amount)
      );
    }
  }
  for (const address of Object.keys(liquidityProvision)) {
    if (!addedThisBlock.includes(address)) {
      // Track liquidity per block by adding to the previous value
      liquidityProvision[address] = liquidityProvision[address].add(
        liquidityProvision[address]
      );
    }
  }

  savedProgress = {
    blockNumber,
    liquidityProvision,
  };
};

ethereumEvents.on("block.confirmed", async (blockNumber, events, done) => {
  handleEvents(blockNumber, events, done);

  if (blockNumber) {
    process.stdout.write(
      `${blockNumber} - ${Object.keys(liquidityProvision).length} providers\r`
    );
  }
  if (blockNumber === STOP_BLOCK) {
    ethereumEvents.stop();
    fs.writeFileSync(
      "curve.csv",
      Object.keys(liquidityProvision)
        .map((provider) => `${provider},${liquidityProvision[provider]}`)
        .join("\n")
    );
    console.log("Liquidity provision saved to curve.csv");
  }
  done();
});

console.log("Listening for Curve.fi events...");

ethereumEvents.start(OUSD_POOL_DEPLOY_BLOCK);

function saveState(eventType) {
  console.log("Saving progress file");
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(savedProgress, null, 2));
  process.exit();
}

[`SIGINT`, `SIGUSR1`, `SIGUSR2`, `SIGTERM`].forEach((eventType) => {
  process.on(eventType, saveState.bind(null, eventType));
});
