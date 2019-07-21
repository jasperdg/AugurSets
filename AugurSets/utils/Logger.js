const Web3 = require("web3");
const { 
	WRAPPED_YES_TOKEN,
	WRAPPED_NO_TOKEN,
	YES_TOKEN,
	NO_TOKEN,
} = require("./../constants");
const WASAbi = require("./../build/contracts/WrappedAugurShares").abi;
const ERC20Abi = require("./../build/contracts/ERC20").abi;
const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/991d53babdd44abea2329bb8db54a425"))
const YesToken = new web3.eth.Contract(ERC20Abi, YES_TOKEN);
const NoToken = new web3.eth.Contract(ERC20Abi, NO_TOKEN);
const WrappedYesToken = new web3.eth.Contract(WASAbi, WRAPPED_YES_TOKEN);
const WrappedNoToken = new web3.eth.Contract(WASAbi, WRAPPED_NO_TOKEN);

class Logger { 

	logWrappedTokenBalances(address) {
		return new Promise( async (resolve, reject) => {
			const yesTokenBalance = await WrappedYesToken.methods.balanceOf(address).call();
			const noTokenBalance = await WrappedNoToken.methods.balanceOf(address).call();
			console.log("Balance before:")
			console.log("WrappedYesTokens: ", yesTokenBalance)
			console.log("WrappedNoTokens: ", noTokenBalance)
			resolve();
		});
		
	}

	logYesNoTokenBalances(address) {
		return new Promise( async (resolve, reject) => {
			const yesTokenBalance = await YesToken.methods.balanceOf(address).call();
			const noTokenBalance = await NoToken.methods.balanceOf(address).call();
			console.log("Balance before:")
			console.log("YesTokens: ", yesTokenBalance)
			console.log("NoTokens: ", noTokenBalance)
			resolve();
		});
	}


}

module.exports = Logger;