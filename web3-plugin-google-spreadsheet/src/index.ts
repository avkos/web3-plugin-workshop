import {Address, EventLog, Web3PluginBase} from 'web3'
import {LogsSubscription} from 'web3-eth-contract'
import {Erc20} from 'web3-plugin-workshop-test-erc20'
import {sheets, auth} from '@googleapis/sheets'


export type GoogleConfig = {
    clientEmail: string;
    privateKey: string;
    range: string
    spreadsheetId: string
}

export class GoogleSpreadSheetPlugin extends Web3PluginBase {
    public pluginNamespace = 'googleSheet';
    private event: LogsSubscription | undefined = undefined;
    private spreadsheets: any | undefined = undefined;
    private googleConfig: GoogleConfig | undefined = undefined;
    private _queue: EventLog[] = []
    private _isRunning: boolean = false
    private _isStart: boolean = false
    private cb?: (eventData: EventLog) => void

    init() {
        this.registerPlugin(new Erc20());
    }

    setGoogleConfig(config: GoogleConfig) {
        this.googleConfig = config
        const googleAuth = new auth.GoogleAuth({
            credentials: {
                private_key: config.privateKey,
                client_email: config.clientEmail
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        const {spreadsheets} = sheets({version: 'v4', auth: googleAuth});
        this.spreadsheets = spreadsheets
    }

    private _addToQueue(eventData: EventLog) {
        this._queue.push(eventData)
    }
    private async _runQueue() {
        if (this._queue.length === 0) {
            return
        }
        if(this._isRunning) {
            return
        }
        this._isRunning = true
        while (this._queue.length > 0) {
            const eventData = this._queue.shift()
            if(eventData) {
                await this._saveToSheet(eventData)
            }
        }
        this._isRunning=false
    }
    async startRecording(contractAddress: Address, cb?: (eventData: EventLog) => void) {
        if (typeof cb === 'function') {
            this.cb=cb
        }
        this._isStart = true
        const contract = this.erc20.getContract(contractAddress);
        const symbol = await contract.methods.symbol().call()
        console.log(`Subscribing to ${symbol}`);
        this.event = contract.events.Transfer()
        this.event.on('data', async (eventData) => {

            this._addToQueue(eventData as EventLog)

            await this._runQueue()

        })
        this.event.on('error', (error) => {
            console.error('error', error)
        })
    }

    async stopRecording() {
        this._isStart=false
        if (this.event) {
            await this.event.unsubscribe()
        }
    }

    public async _saveToSheet(eventData:EventLog){
        if (!this.googleConfig || !this._isStart) {
            return
        }
        if(this.cb) {
            this.cb(eventData)
        }
        try {
            const values = [
                [
                    eventData.returnValues.from,
                    eventData.returnValues.to,
                    String(eventData.returnValues.value),
                    new Date().toISOString(),
                ],
            ];

            // const response = await this.spreadsheets.create()
            await this.spreadsheets.values.append({
                range: this.googleConfig.range,
                spreadsheetId: this.googleConfig.spreadsheetId,
                valueInputOption: 'USER_ENTERED',
                requestBody: {values},
            });
        } catch (e) {
            console.error('transfer error', e)
        }
    }

}

declare module 'web3' {
    // Here is where you're adding your plugin inside Web3Context
    interface Web3Context {
        googleSheet: GoogleSpreadSheetPlugin;
    }
}
