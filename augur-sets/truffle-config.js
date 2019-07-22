
const { PARITY_PORT } = require("./constants")

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: PARITY_PORT,            
      gas: 6500000,
      gasPrice: 10000000000,
      network_id: "*",       // Any network (default: none)
    },
    rinkeby: {
      provider: () => new HDWalletProvider(MNEMONIC, `https://rinkeby.infura.io/v3/${INFURA_KEY}`),
      network_id: 4,       // Ropsten's id
      gas: 6000000,        // Ropsten has a lower block limit than mainnet
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
  },
  compilers: {
    solc: {
      version: "0.4.22",    // Fetch exact version from solc-bin (default: truffle's version)
    }
  }
}
