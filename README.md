# AugurSets

A protocol for tokenized indexes of positions in Augur markets.

## Getting Started

These intstructions will get a copy of AugurSets running on your machine and will allow you to run the tests.

### Prerequisites
To run this version of AugurSets you requires you to have [docker](https://www.docker.com/) [nodejs](https://nodejs.org/en/) and [truffle](https://www.trufflesuite.com/).

#### Installing
After installing all of the prerequisites we'll continue by getting a (very slightly) altered version of [augur-core](https://github.com/AugurProject/augur-core) running. This will run a local POA Ethereum blockchain with all the Augur contracts deployed and all contracts addresses needed logged.

Start by cloning this directory if you haven't already:

```
git clone https://github.com/jasperdg/AugurSets.git
```

Then checkout the augur-core directory:

```
cd AugurSets/augur-core
```

Then start the POA parity chain by entering the following command (this will take a couple minutes):

```
npm run docker:run:integration:parity
```

#### Setup AugurSets
Enter the AugurSets directory and install all of the dependencies:
```
cd ../augurSerts
npm i
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
