This is the [OUSD](https://ousd.com) decentralized governance stack.

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

## Gotchas

Here are some places you may come unstuck when setting up locally. If you find any yourself, please document them here to help your fellow engineers:

### 1. How do we populate the database with proposal data post- transaction submission?

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

