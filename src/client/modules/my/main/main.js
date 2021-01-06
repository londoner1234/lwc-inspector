import { LightningElement, track } from 'lwc';
import { getLoggedInUser, setSessionInformation } from 'data/authService';
import { LABELS } from 'data/labelService';

export default class Main extends LightningElement {
    @track loggedInUser = undefined;
    @track state;
    loading = true;
    displayInputs = false;
    LABEL = LABELS;
    lightningComponentBundles = [];
    connectedCallback() {
        getLoggedInUser().then((response) => {
            if (response.user_id === undefined) {
                this.loggedInUser = undefined;
                this.state = 'login';
            } else {
                this.loggedInUser = response;
                this.state = 'list';
                //    this.getLightningComponents() ;
            }
            this.loading = false;
        });
    }
    get isLoading() {
        return this.loading;
    }
    get isLoggedIn() {
        return this.loggedInUser;
    }

    get getName() {
        return this.loggedInUser.display_name;
    }
    get getIsLoggedIn() {
        return !!this.loggedInUser;
    }
    get getUsername() {
        return this.loggedInUser.username;
    }

    setDisplayInputs() {
        this.displayInputs = !this.displayInputs;
    }

    setSessionInfo() {
        //read inputs then post to server to cache it.
        /*  
       under construction*/
        let elements = this.template.querySelectorAll('lightning-input');
        let inputs = {
            sessionId: elements[0].value,
            myDomainURL: elements[1].value
        };

        //first pos = sessionId, second pos = myDomainURL
        setSessionInformation(inputs).then((res) => {
            console.log(res);
            this.loading = false;
            window.location.reload(); //reload
        });
    }
    toggleLoading(event) {
        //        this.dispatchEvent(new CustomEvent('selected', { detail: { loading: true } }));
        event.stopPropagation();
        this.loading = event.detail.loading;
    }
}
