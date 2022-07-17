import { ethers } from "ethers";
import "dotenv/config";
import * as customBallotJson from "../artifacts/contracts/CustomBallot.sol/CustomBallot.json";
import * as myTokenJson from "../artifacts/contracts/Token.sol/MyToken.json";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

function setupProvider() {
  const infuraOptions = process.env.INFURA_API_KEY
    ? process.env.INFURA_API_SECRET
      ? {
          projectId: process.env.INFURA_API_KEY,
          projectSecret: process.env.INFURA_API_SECRET,
        }
      : process.env.INFURA_API_KEY
    : "";
  const options = {
    alchemy: process.env.ALCHEMY_API_KEY,
    infura: infuraOptions,
    etherscan : process.env.ETHERSCAN_API_KEY,
  };
  const provider = ethers.providers.getDefaultProvider("ropsten", options);
  return provider;
}

async function main() {
  const wallet =
    process.env.MNEMONIC && process.env.MNEMONIC.length > 0
      ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
      : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);
  console.log(`Using address ${wallet.address}`);
  const provider = setupProvider();
  //const provider = ethers.providers.getDefaultProvider("ropsten");
  const signer = wallet.connect(provider);
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatEther(balanceBN));
  console.log(`Wallet balance ${balance}`);
  if (balance < 0.01) {
    throw new Error("Not enough ether");
  }
  
  console.log("Proposals: ");
  const proposals = process.argv.slice(2);
  if (proposals.length < 2) throw new Error("Not enough proposals provided");
  
  proposals.forEach((element, index) => {
    console.log(`Proposal N. ${index + 1}: ${element}`);
  });

console.log("Deploying myToken contract");
  const myTokenFactory = new ethers.ContractFactory(
    myTokenJson.abi,
    myTokenJson.bytecode,
    signer
  );
  const myTokenContract = await myTokenFactory.deploy();
  console.log("Awaiting confirmations");
  await myTokenContract.deployed();
  console.log("Completed");
  console.log(`Contract deployed at ${myTokenContract.address}`);



  const tokensMinted = 100;
  const chairpersonAddress= await signer.getAddress();
  console.log(`${tokensMinted} tokens minted for ${chairpersonAddress}`);
  const tx= await myTokenContract.mint(chairpersonAddress , ethers.utils.parseEther(tokensMinted.toFixed(18)));
  // wrong: const tx= await myTokenContract.mint(chairpersonAddress , tokensMinted);
  await tx.wait();
  console.log(`Self- Delegating to ${chairpersonAddress}`);
  const tx2= await myTokenContract.delegate(chairpersonAddress); 
  await tx2.wait();
  console.log ("Self-delegation succeeded. ")





console.log("Deploying CustomBallot contract");
  const customBallotFactory = new ethers.ContractFactory(
    customBallotJson.abi,
    customBallotJson.bytecode,
    signer
  );
  const customBallotContract = await customBallotFactory.deploy(
    convertStringArrayToBytes32(proposals),
    myTokenContract.address,
  );
  console.log("Awaiting confirmations");
  await customBallotContract.deployed();
  console.log("Completed");
  console.log(`Contract deployed at ${customBallotContract.address}`);







};


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
