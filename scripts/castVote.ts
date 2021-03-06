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
    etherscan: process.env.ETHERSCAN_API_KEY,
  };
  const provider = ethers.providers.getDefaultProvider("ropsten", options);
  return provider;
}


async function main() {
  const wallet =
    process.env.MNEMONIC && process.env.MNEMONIC.length > 0
      ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
      : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);
  //: new ethers.Wallet(process.env.PRIVATE_KEY_2 ?? EXPOSED_KEY);
  console.log(`Using address ${wallet.address}`);
  const provider = setupProvider();
  // const provider = ethers.providers.getDefaultProvider("ropsten");
  const signer = wallet.connect(provider);
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatEther(balanceBN));
  console.log(`Wallet balance ${balance}`);
  if (balance < 0.01) {
    throw new Error("Not enough ether");
  }
  if (process.argv.length < 3) throw new Error("Ballot address missing");
  const customBallotAddress = process.argv[2];
  if (process.argv.length < 4) throw new Error("Proposal missing");
  const proposal = process.argv[3];
  if (process.argv.length < 5) throw new Error("Amount missing");
  const amount = process.argv[4];

  console.log(
    `Attaching ballot contract interface to address ${customBallotAddress}`
  );
  const customBallotContract: CustomBallot = new Contract(
    customBallotAddress,
    customBallotJson.abi,
    signer
  ) as CustomBallot;


  function setListeners(
    ballotContract: ethers.Contract,
    provider: ethers.providers.BaseProvider
  ) {
    console.log("Setting listeners on");
    const eventFilter = ballotContract.filters.Voted();
    provider.on(eventFilter, (log: any) => {
      console.log("Voted");
      console.log({ log });
    });
  }

  setListeners(customBallotContract, provider);


  if (proposal === "")
    throw new Error("The proposal is empty");

  if (amount === "")
    throw new Error("The amount is empty");

  console.log("Casting a vote");
  //wrong (compared to test scripts): const transaction = await customBallotContract.vote(proposal, ethers.utils.parseEther(parseInt(amount).toFixed(18)));
  const transaction = await customBallotContract.vote(proposal, amount);
  console.log("Awaiting confirmations");
  await transaction.wait();


  console.log(`Transaction completed. Hash: ${transaction.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
