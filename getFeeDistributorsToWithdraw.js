require("dotenv").config()
const https = require('node:https')

const getFeeDistributorsToWithdraw = async function() {
    return new Promise((resolve, reject) => {
        const factoryAddress = process.argv[4] || process.env.FEE_DISTRIBUTOR_FACTORY_ADDRESS;
        const etherScanApiUrl = process.argv[5] || process.env.ETHERSCAN_API_URL;
        const etherScanApiKey = process.argv[6] || process.env.ETHERSCAN_API_KEY;

        const etherScanQuery = `${etherScanApiUrl}/api?module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=${factoryAddress}&topic0=0x34469c8d875ab6f5aea69ea2ea02f9b280c664cc16dce2f7c0473ade0f650efd&apikey=${etherScanApiKey}`

        https.get(etherScanQuery, (res) => {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];

            let error;
            if (statusCode !== 200) {
                error = new Error('Request Failed.\n' +
                    `Status Code: ${statusCode}`);
            } else if (!/^application\/json/.test(contentType)) {
                error = new Error('Invalid content-type.\n' +
                    `Expected application/json but received ${contentType}`);
            }
            if (error) {
                console.error(error.message)
                // Consume response data to free up memory
                res.resume()
                reject(error.message)
                return
            }

            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const etherScanResData = JSON.parse(rawData)
                    const feeDistributorContractAddresses = etherScanResData.result.map(log => '0x' + log.data.slice(26))
                    resolve(feeDistributorContractAddresses)
                } catch (e) {
                    console.error(e.message);
                }
            });
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`)
            reject(`Got error: ${e.message}`)
        })
    })
}

module.exports = {
    getFeeDistributorsToWithdraw
}



