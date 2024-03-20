import 'dotenv/config'
import {Web3} from "web3";
import {GoogleSpreadSheetPlugin} from "web3-plugin-workshop-test-google-spreadsheet";

(async () => {
    const web3 = new Web3(`wss://mainnet.infura.io/ws/v3/${process.env.INFURA_API_KEY as string}`);
    web3.registerPlugin(new GoogleSpreadSheetPlugin());
    web3.googleSheet.setGoogleConfig({
        privateKey: process.env.GOOGLE_PRIVATE_KEY as string,
        clientEmail: process.env.GOOGLE_CLIENT_EMAIL as string,
        range: 'Sheet2',
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID as string
    })
    web3.googleSheet.init()

    // usdt contract address
    let count = 0
    await web3.googleSheet.startRecording('0xdac17f958d2ee523a2206206994597c13d831ec7', () => {
        console.log('add event to sheet', count)
        count++
        if (count > 10) {
            web3.googleSheet.stopRecording()
            console.log('finished')
            setTimeout(()=>{
                web3.provider!.disconnect()
            },1000)
        }
    })

    // web3.eth.getBlock('latest').then(console.log).catch(console.error)
})()
