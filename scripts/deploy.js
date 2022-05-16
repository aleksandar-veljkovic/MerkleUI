
const { poseidonContract } = require("circomlibjs");

async function main () {
  const PoseidonT3 = await ethers.getContractFactory(
    poseidonContract.generateABI(2),
    poseidonContract.createCode(2)
  )
  
  console.log("Deploying Poseidon...")
  const poseidonT3 = await PoseidonT3.deploy();
  await poseidonT3.deployed();

  const MerkleTree = await ethers.getContractFactory("MerkleTree", {
    libraries: {
        PoseidonT3: poseidonT3.address
    },
  });
  console.log('Deploying MerkleTree...');
  const merkleTree = await MerkleTree.deploy();
  await merkleTree.deployed();
  console.log('MerkleTree deployed to:', merkleTree.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });