# AugurSets

A protocol for tokenized indexes of positions in Augur markets.

## Getting Started

These intstructions will get a copy of AugurSets running on your machine and will allow you to run the tests.

### Prerequisites
To run this version of AugurSets you requires you to have [docker](https://www.docker.com/), [nodejs](https://nodejs.org/en/) and [truffle](https://www.trufflesuite.com/).

### Installing
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

Open a new tab in your terminal, enter the AugurSets directory and install all of the dependencies:
```
cd ../augur-sets
npm i
```

## Setup AugurSets
Create a file called `.pvt.js`
```
touch .pvt.js
```

Open your prefered text editor and paste the following code into `.pvt.js`
(NOTE: this is just a generic address hardcoded in our POA parity chain to own all of the premined Ether)
```
module.exports = {
	PUB_KEY: "0x913dA4198E6bE1D5f5E4a40D0667f70C0B5430Eb",
	PVT_KEY: "fae42052f82bed612a724fec3632f325f377120592c75bb78adfcceae6470c5a",
}
```

The final step before the tests will run is to copy the contract addresses logged by the parity node into `constants.js`. 

The logs should look something like this (but with different addresses):
![a screenshot showing how the addresses should look](https://github.com/jasperdg/AugurSets/blob/master/docs/assets/addresses-example.png "screenshot of addressses")

### Running the tests
Make sure you're in the `augur-sets` directory and run:
```
truffle test
```