# AugurSets

DISCLAIMER: This README is outdated, up-to-date version will be uploaded by next week

A protocol build atop of Augur that allows for the creation and trading of indexes of positions in Augur markets. 

## Getting Started

These intstructions will get a copy of AugurSets running on your machine and will allow you to run the tests.

### Prerequisites

We need to make sure we have [ganache-cli](https://github.com/trufflesuite/ganache-cli) & [Truffle](https://www.trufflesuite.com/) installed.

```
npm i -g ganache-cli
```
```
npm i -g truffle
```

### Installing

Start by cloning AugurSets in your prefered directory if you haven't already.

```
git clone https://github.com/jasperdg/AugurSets.git
```

Then enter the directory and install all dependencies.

```
cd AugurSets && npm install
```

## Running the tests

Run Ganache-cli.

```
ganache-cli
```

Run the test.

```
truffle test
```
