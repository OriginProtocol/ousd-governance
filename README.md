This is the [OUSD](https://ousd.com) decentralized governance stack.

## Install brownie dependencies

```bash
brownie pm install OpenZeppelin/openzeppelin-contracts@4.5.0
```

## Running contract tests

```bash
cd contracts
brownie test --network hardhat
```

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

Setup postgresql locally and create a database. Set DATABASE_URL in your environment.

Push the database and generate a client:

```bash
npx prisma db push
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```
