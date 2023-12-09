const hre = require("hardhat")
const fs = require("fs")


async function main() {
  const WrappedElon = await hre.ethers.getContractFactory("WrappedElon")
  const wrappedElon = await (await WrappedElon.deploy()).deployed()
  console.info("Deployed WrappedElon:", wrappedElon.address)
  const addressFile = `./deployedAddresses/WrappedElon.${hre.network.name}`
  fs.mkdirSync('./deployedAddresses/', { recursive: true })
  fs.writeFileSync(addressFile, wrappedElon.address)
  console.info(`Saved address file to: ${addressFile}`)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
