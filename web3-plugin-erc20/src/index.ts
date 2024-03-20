import {Web3PluginBase, Contract, Address, Numbers} from 'web3'
import {abi} from './artifacts'

export class Erc20 extends Web3PluginBase {
    public pluginNamespace = 'erc20';

    async getTokenBalance(contractAddress: string, ownerAddress: string) {
        const contract = this.getContract(contractAddress)
        return contract.methods.balanceOf(ownerAddress).call();
    }

    getContract(contractAddress: Address) {
        const contract = new Contract(abi, contractAddress);
        contract.link(this);
        return contract;
    }

    async transfer(contractAddress: Address, from: Address, to: Address, value: Numbers) {
        const contract = this.getContract(contractAddress)
        return contract.methods.transfer(to, value).send({
            from
        });
    }
}


declare module 'web3' {
    // Here is where you're adding your plugin inside Web3Context
    interface Web3Context {
        erc20: Erc20;
    }
}
