const toTxHash = (value) => {
  if (typeof value === "string") {
    // this is probably a tx hash already
    return value;
  } else if (typeof value.receipt === "object") {
    // this is probably a tx object
    return value.receipt.transactionHash;
  } else {
    throw "Unsupported tx type: " + value;
  }
}

const mineTx = (promiseOrTx, interval) => {
  return Promise.resolve(promiseOrTx)
    .then(tx => {
      const txHash = toTxHash(tx);

      return new Promise((resolve, reject) => {
        const getReceipt = () => {
          web3.eth.getTransactionReceipt(txHash, (error, receipt) => {
            if (error) {
              reject(error);
            } else if (receipt) {
              // console.log(receipt);
              resolve(receipt);
            } else {
              setTimeout(getReceipt, interval || 500);
            }
          })
        }

        getReceipt();
      })
    });
}

module.exports = mineTx;