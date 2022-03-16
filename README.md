This is the [OUSD](https://ousd.com) decentralized governance stack.

## Install brownie via pipx

[The recommended way to install Brownie](https://eth-brownie.readthedocs.io/en/stable/install.html) is via [pipx](https://github.com/pipxproject/pipx):

```bash
python3 -m pip install --user pipx
python3 -m pipx ensurepath
```

*You may need to restart your terminal after installing `pipx`.*

```bash
pipx install eth-brownie
```

## Install brownie dependencies

```bash
brownie pm install OpenZeppelin/openzeppelin-contracts@4.5.0
brownie pm install OpenZeppelin/openzeppelin-contracts-upgradeable@4.5.0
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

*If this command reverts with an error it may be an incompatability with python 3.10. Try python 3.9 instead ([pyenv](https://github.com/pyenv/pyenv) is a good solution for managing multiple python versions).*

## Running a local node

```bash
npx hardhat node --port 8545
```

In another terminal:

```bash
brownie run deploy main client/networks/governance.localhost.json
```

## Running the DApp

First, install the dependencies:

```bash
cd client
yarn install
```

Setup postgresql locally and create a database. Set `DATABASE_URL` in your environment. 

*A typical postgres example looks like `postgres://user:secret@localhost:5432/ousdgovernance`.*

Push the database and generate a client:

```bash
npx prisma db push
```

Set the `WEB3_PROVIDER` variable in your environment.

*The hardhat RPC default is `http://127.0.0.1:8545`.*

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```
