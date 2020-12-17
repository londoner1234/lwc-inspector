import { LightningElement, api } from 'lwc';

export default class App extends LightningElement {
    @api lightningComponentBundles = [] ; 
    get isComponents(){
        return (this.lightningComponentBundles.length > 0 ) ; 
    }
}
