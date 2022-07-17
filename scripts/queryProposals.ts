import { Contract, ethers } from "ethers";
import "dotenv/config";
import * as customBallotJson from "../artifacts/contracts/CustomBallot.sol/CustomBallot.json";
// eslint-disable-next-line node/no-missing-import
import { CustomBallot } from "../typechain";

// This key is already public on Herong's Tutorial Examples - v1.03, by Dr. Herong Yang
// Do never expose your keys like this
const EXPOSED_KEY =
  "8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f";


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


  if (process.argv.length < 3) throw new Error("Ballot address missing");
  const customBallotAddress = process.argv[2];

  console.log(
    `Attaching ballot contract interface to address ${customBallotAddress}`
  );

  console.log("Here are the proposals associated with their number of votes : ");

  

  const customBallotContract: CustomBallot = new Contract(
    customBallotAddress,
    customBallotJson.abi,
    signer
  ) as CustomBallot;


 let index = 0;
 let endArray= 0
  while (endArray===0) {
    try {
    const proposal = await customBallotContract.proposals(index);
    const proposalName= ethers.utils.parseBytes32String(proposal.name);
    const proposalVotesNumber= proposal.voteCount;
    console.log (`The proposal number ${index} is ${proposalName} and it has ${proposalVotesNumber} votes in the ballot`);
    index ++;
  } catch (error)
  { endArray=1;
    console.log ("We have seen all the array values.");
}
  
};
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
