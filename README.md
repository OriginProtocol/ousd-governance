This is the [OUSD](https://ousd.com) decentralized governance stack.

## Running the DApp

First, install the depepdencies:

```
cd client
yarn install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Running contract tests

```bash
cd contracts
brownie test --network hardhat
```

## Running a local node

```bash
npx hardhat node --port 8545
```

In aonther terminal:

```bash
brownie run deploy
```
