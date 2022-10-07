const ethers = require("ethers")
const fs = require("fs")
require("dotenv").config()
const {getFeeDistributorsToWithdraw} = require("./getFeeDistributorsToWithdraw")

async function main() {
    if (process.argv.length < 7) {
        if (!process.env.RPC_URL
            || !process.env.PRIVATE_KEY
            || !process.env.FEE_DISTRIBUTOR_FACTORY_ADDRESS
            || !process.env.ETHERSCAN_API_URL
            || !process.env.ETHERSCAN_API_KEY) {

            console.error('Args not provided')
            process.exit(1)
        }
    }

    const feeDistributorsToWithdraw = await getFeeDistributorsToWithdraw()

    const provider = new ethers.providers.JsonRpcProvider(process.argv[2] || process.env.RPC_URL)
    const wallet = new ethers.Wallet(process.argv[3] || process.env.PRIVATE_KEY, provider)
    const abi = fs.readFileSync("./FeeDistributor.abi", "utf8")

    const txReceiptPromises = []
    for (const feeDistributorAddress of feeDistributorsToWithdraw) {
        const feeDistributorContract = new ethers.Contract(feeDistributorAddress, abi, wallet)
        const txReceipt = await feeDistributorContract.withdraw({
            gasLimit: 100000
        })
        txReceiptPromises.push(txReceipt.wait(1))
    }

    await Promise.all(txReceiptPromises)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
