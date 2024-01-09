import {APIClient} from '@wharfkit/antelope'
import {RoborovskiClient} from '@wharfkit/roborovski'
import {Name, Serializer} from '@wharfkit/session'

// Setup an APIClient
const client = new APIClient({
    url: 'https://jungle4.greymass.com',
})

// Setup the API
const robo = new RoborovskiClient(client)
let pos = -1
let offset = -100

let txids: string[][] = []

async function get(start = 1, limit = 100) {
    const results = await robo.get_actions('wharfkittest', {
        start,
        limit,
    })
    let lastAction = start
    results.actions.forEach((action) => {
        const {act, receipt} = action.action_trace
        const isTokenTransfer = Name.from(act.account).equals('eosio.token')
        const isReceiver = Name.from(receipt.receiver).equals('wharfkittest')
        if (isTokenTransfer && isReceiver) {
            const isToContract = Name.from(act.data.to).equals('testing.gm')
            if (isToContract) {
                txids.push([String(action.block_time), String(action.action_trace.trx_id)])
            }
        }
        lastAction = Number(action.account_action_seq)
    })
    try {
        await get(lastAction + 1)
    } catch (e) {
        await get2()
    }
}

async function get2() {
    for (const trx of txids) {
        const [time, txid] = trx
        const result = await robo.get_transaction(txid, {traces: false})
        console.log(
            [txid, String(result.block_time), String(result.trx.receipt.cpu_usage_us)].join(',')
        )
    }
}

await get()
