const fs = require("fs")
const path = require("path")

const solFiles = [
  "./contracts/WrappedElon.sol",
  "@openzeppelin/contracts/token/ERC20/ERC20.sol",
  "@openzeppelin/contracts/token/ERC20/IERC20.sol",
  "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol",
  "@openzeppelin/contracts/utils/Context.sol",
]

async function main() {
  const etherscanData = { "language": "Solidity", sources: {} }
  for (const solFilePath of solFiles) {
    let content
    let key = solFilePath
    if (solFilePath.startsWith('./')) {
      content = fs.readFileSync(solFilePath).toString()
      key = solFilePath.slice(2)
    } else {
      content = fs.readFileSync(path.join('./node_modules/', solFilePath)).toString()
    }
    etherscanData.sources[key] = { content }
  }
  fs.writeFileSync('./etherscanVerify.json', JSON.stringify(etherscanData, null, 2))
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
