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

brownie pm install OpenZeppelin/openzeppelin-contracts-upgradeable@a16f26a063cd018c4c986832c3df332a131f53b9
brownie pm install OpenZeppelin/openzeppelin-contracts@02fcc75bb7f35376c22def91b0fb9bc7a50b9458
```

## Install hardhat

```bash
yarn install
```

## Running contract tests

```bash
cd contracts
brownie test --network hardhat
```

_If this command reverts with an error it may be an incompatability with python 3.10. Try python 3.9 instead ([pyenv](https://github.com/pyenv/pyenv) is a good solution for managing multiple python versions)._

## Running a local node

```bash
npx hardhat node --port 8545
```

In another terminal:

```bash
brownie run deploy main client/networks/governance.localhost.json
```

## Running the DApp and listener

First, install the dependencies:

```bash
cd client
yarn install
```

Setup postgresql locally and create a database. Set `DATABASE_URL` in your environment.

_A typical postgres example looks like `postgres://user:secret@localhost:5432/ousdgovernance`._

Push the database and generate a client:

```bash
npx prisma db push
```

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
