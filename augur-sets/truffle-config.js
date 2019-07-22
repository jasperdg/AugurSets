
const { PARITY_PORT } = require("./constants")

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: PARITY_PORT,            
      gas: 6500000,
      gasPrice: 10000000000,
      network_id: "*",
    }
  },
  compilers: {
    solc: {
      version: "0.4.22",
    }
  }
}
