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
cd contracts
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

## Running the DApp and listener

First, install the dependencies:

```bash
cd client
yarn install
```

Copy `client/sample.env` to `client/.env`.

Setup postgresql locally and create a database and update the `DATABASE_URL` in your `client/.env`

_A typical postgres example looks like `postgres://user:secret@localhost:5432/ousdgovernance`._

Push the database and generate a client:

```bash
npx prisma db push
```

(these are already defaults in `client/sample.env`)
Set the `NETWORK_ID` env var to 31337.
Set the `WEB3_PROVIDER` variable in your environment.
_The hardhat RPC default is `http://127.0.0.1:8545`._

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```

This will start both the NextJS app and a listener script monitoring your local blockchain for changes.

# Deploying the dApp

This section details the playbook for deploying the dApp.

## Environments

Commits to the following branches will automatically deploying to the associated Heroku environments:

1. `stable` -> [Production](https://governance.ousd.com/claim)
2. `staging` -> [Staging](https://ousd-governance-goerli.herokuapp.com/)

The production environment references the mainnet contracts in this repo. The staging environment references contracts deployed to Goerli.

Note: You shouldn't commit to `stable` directly. Only merge from `master` (where new features are merged via approved pull request).

## Production Deployment Process

1. Take a database backup before you start: `heroku pg:backups:capture --app=ousd-governance-production`. Note: You must be authorised with Heroku to run this command. Contact Franck to be added if you're not already.

1. Take a note of the last commit hash that's confirmed as working in production. You can find this in the `stable` branch's [commit history](https://github.com/OriginProtocol/ousd-governance/commits/stable).

1. Merge from `master` to `stable` to initiate a deployment. You can check progress in the [Heroku Dashboard](https://dashboard.heroku.com/apps/ousd-governance-production) where you'll find error logs should your deployment fail.

1. Once deployed, check the [production environment](https://governance.ousd.com/) in your browser to make sure that things are working as expected. If yes, you're done!

1. If the release causes issues in production, don't be afraid to roll back while you diagnose the issue. Especially if users are impacted. You can do this by reverting your commit: `git revert [commit hash]` and pushing the resulting revert commit to `stable`. Or, if you want to keep a cleaner commit history, reset the `stable` branch to the last commit hash of the previous release: `git reset [commit hash] --hard` and push this to `stable` using `git push stable --force`. Note: You should only force push if you're 100% certain of the change.

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

## 1. How do we populate the database with proposal data post-transaction submission?

**Problem:**

You're adding proposals and the transactions are going through on-chain, but confirmed proposals aren't showing in the UI. You might experience [listener.ts](/client/listener.ts) outputting lots of `info: Got confirmed block` messages, but nothing to confirm the script is picking up `ProposalCreated` events.

**Explanation:**

Proposals aren't pushed to the database from the front-end submision handler. Instead, [listener.ts](/client/listener.ts) monitors your local node, detects when the `ProposalCreated` event is fired, then adds the proposal to the database. However, these events can't be picked up when the starting block number is off in your database.

**Solution:**

Because we [start from the last seen block saved in the database](/client/listener.ts#L121), you may experience issues if this number is out of sync. To quickly solve:

1. Comment out the database lookup function
2. Add `ethereumEvents.start(0)` beneath to ensure a start from the beginning
3. Run `yarn run dev`
4. Revert what you changed
5. Run `yarn run dev` again

You should now see proposals added to the database when you submit transactions.

## 2. M1 macs (ARM architecture)

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



