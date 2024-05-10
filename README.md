This is the [OUSD](https://ousd.com) decentralized governance stack.

# Getting Started

## Install brownie via pipx  

[The recommended way to install Brownie](https://eth-brownie.readthedocs.io/en/stable/install.html) is via [pipx](https://github.com/pipxproject/pipx):

```bash
python3 -m pip install --user pipx
python3 -m pipx ensurepath
```

_You may need to restart your terminal after installing `pipx`._

```bash
pipx install eth-brownie
```

## Install brownie dependencies

We require OpenZeppelin contract code that is in master and will be released after 4.5.0. Since the release
tag has not been created yet we need to import them by commit hash. Once newer version of 4.5.0 is released
we can default to that.

```bash

brownie pm install OpenZeppelin/openzeppelin-contracts-upgradeable@4.6.0
brownie pm install OpenZeppelin/openzeppelin-contracts@4.6.0
```

## Install hardhat

```bash
yarn install
```

## Running contract tests (brownie)

```bash
brownie test --network hardhat
```

_If this command reverts with an error it may be an incompatability with python 3.10. Try python 3.9 instead ([pyenv](https://github.com/pyenv/pyenv) is a good solution for managing multiple python versions)._

## Running contract tests (forge)

The OGV staking contracts use forge for tests. 

```bash
forge install
forge test
```

## Running a local node

Copy `dev.env` to `.env` and fill out the `PROVIDER_URL`

Node will be run in forked mode

```bash
yarn run node
```

In another terminal:

```bash
brownie run deploy main client/networks/governance.localhost.json
```

## Running brownie console in fork mode
Copy `dev.env` to `.env` and fill out the `PROVIDER_URL`

Node will be run in forked mode

```bash
yarn run node
```

In another terminal:
```bash
brownie console --network hardhat-fork
```

## Deploying contracts

Setup environment variables:
export WEB3_INFURA_PROJECT_ID=...
export ETHERSCAN_TOKEN=...
export DEPLOYER_KEY=...

The deployment needs to be done in 2 steps. First one executes the code deployed / altered on 
mainnet by the deployer account. The second step is able to build the transaction to make a proposal 
on the governor only when in mainnet-fork mode, so needs to be ran separately. 

### Step 1
Write a deployment file and then run `brownie run [DEPLOYMENT_FILE] --network mainnet`

Make sure that script outputs all of the addresses that need to be passed to potential governance
proposal.

### Step 2
Make sure you copy all the addresses to the governor proposal section of the deploy file.

To build a transaction for Governor `MODE=build_ogv_gov_proposal brownie run [DEPLOYMENT_FILE] --network mainnet-fork`

Copy the `To` and `Data` to transaction builder with an account that has enough veOGV to create
a governance proposal. 

### Optional
Set up virtual environment using python3. 

#### Setup Python environment
    # Let's create a new virtual environment
    python3 -m venv brownie-deploy
    source ./brownie-deploy/bin/activate
    pip install -r requirements.txt
#### To run
    source ./brownie-deploy/bin/activate


## Git Commands For Merging Branches

### Staging (Goerli)

```
git checkout master
git pull
git checkout staging
git merge --no-ff origin/master
git log --abbrev-commit --pretty=oneline | more
git push origin staging --no-verify
```

### Production (Mainnet)

```
git checkout master
git pull
git checkout stable
git merge --no-ff origin/staging
git log --abbrev-commit --pretty=oneline | more
git push origin stable --no-verify
```

## Backfilling Database Data

Because we rely on data from blockchain events that occur over time, some features require changes to `listener.ts`. 

The script listens from the latest mainnet block by default, however, when we need data from events in the past we need to reset the listener to an earlier block number.

If required, follow this process post deployment:

1. Update the `last_seen_block` entry in the `listener` table of the databse to the block number the `OGVStaking.sol` contract was deployed at, `15089597` (Note: The more blocks that are mined over time, the longer this process will take):
    1. Connect to the database via Heroku CLI: `heroku pg:psql postgresql-transparent-92815 --app ousd-governance-production`
    1. Update the block number: `INSERT INTO listener (last_seen_block) VALUES ('15089597');`


1. Restart all dynos in the production environment's [Heroku dashboard](https://dashboard.heroku.com/apps/ousd-governance-production):
    1. Click "More"
    1. Click "Restart all dynos" to restart `listener.ts`


1. Monitor the app logs from the [Heroku dashboard](https://dashboard.heroku.com/apps/ousd-governance-production) to ensure the listener has been properly reset:
    1. Click "More"
    1. Click "View logs"
    1. Look for continued output from the worker showing `Got confirmed block 15089597` and onwards.


1. Check that the database is being backfilled with blockchain data:
    1. Connect to the database: `heroku pg:psql postgresql-transparent-92815 --app ousd-governance-production`
    1. Bring up a table relevant to your new feature: `TABLE lockups;`
    1. Ensure historic data is being added to the database by `listener.ts`. If yes, you're good!


# Local Gotchas

Here are some places you may come unstuck when setting up locally. If you find any yourself, please document them here to help your fellow engineers:

## 1. M1 macs (ARM architecture)

**Problem:**

My ether wallet as a `wrtc` dependency that doesn't compile on the ARM macs. There is an alternative build of `wrtc available that circumvents the issue, but MEW hasn't incorporated that into their codebase yet. See [issue](https://github.com/MyEtherWallet/MEWconnect-web-client/issues/75)

**Solution:**

Switch architecture from arm to x64 and install node using x64. It is recommended to use nvm and have that "special" x64 node install aliased, so it is easy to switch anytime from native arm built node to x64 built node. 

Switch architecture from arm to x64
```
arch -x86_64 zsh

```

Confirm the "current" architure you're on by running
```
arch

```
This should return x64/i3/i9..


Install nodejs using nvm. We'll install nodev16 (not 18). This is because of incompatibility with the latest node with m1.

```
// install node
nvm install v16.16.0

// create nvm alias (just to remember which node has x86 build)
nvm alias x86_node_build v16.16.0

// confirm node has been built in x64
node -p process.arch
// should return x64

// wrtc error should no longer be a problem
yarn install
```



