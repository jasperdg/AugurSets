const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/991d53babdd44abea2329bb8db54a425"))

const getEtherBalanceByAddress = (address) => {
	return new Promise( async (resolve, reject) => {
		const balance = await web3.eth.getBalance(address);
		resolve(balance);
	})
}
module.exports = {
	getEtherBalanceByAddress
}