
function loadDummyUsers(users) {
    for (i = 0; i < 10; i++) {
        users.push(new User(`${i}`, `${i}`, `Full${i} Name${i}`))
    }
}

function User(username, password, fullname) {
    this.username = username;
    this.password = password;
    this.fullname = fullname;
    this.balance = 0;
    this.imageURL = `https://picsum.photos/seed/${this.username}/100/100`
}

function Bank(users) {
    this.users = users;
    this.get_user = function (username, password) {
        let user = this.users.find((current) => { return current.username === username && current.password === password });
        if (user) {
            return user;
        }
        else {  
            throw new Error(`You have entered an invalid username and/or password.`);
        }
    };
    this.create_user = function (username, password, fullname) {
        let user = this.users.find((current) => { return current.username === username });
        if (user) {
            throw new Error(`Username already exists.`);
        }
        else {
            let newUser = new User(username, password, fullname);
            users.push(newUser);
            return newUser;
        }
    }
    this.edit_user = function (user, neWPassword, newImage, newFullName) {
        user.fullname = newFullName;
        user.password = neWPassword;
        user.imageURL = newImage;
        return `Successfully updated profile.`
    }
    this.deposit = function (user, amount) {
        let currentBalance = parseFloat(user.balance);
        user.balance = currentBalance + amount;
        return `Successfully deposited ${amount}.\nNew balance is ${user.balance}.`;
    }
    this.withdraw = function (user, amount) {
        let currentBalance = parseFloat(user.balance);
        if (amount > currentBalance) {
            throw new Error("You do not have enough balance.");
        }
        user.balance = currentBalance - amount;
        return `Successfully withdrew ${amount}.\nNew balance is ${user.balance}.`;
    }
    this.send = function (user, dest, amount) {
        let errorMessage = "";
        if (user.username === dest) {
            errorMessage = `Cannot send to own account.<br/>`;
        }

        let destUser = this.users.find((current) => { return current.username === dest });
        if (!destUser) {
            errorMessage = (`${errorMessage}User ${dest} does not exist.<br/>`);
        }

        let currentBalance = parseFloat(user.balance);
        if (amount > currentBalance) {
            errorMessage = (`${errorMessage}You do not have enough balance.`);
        }
        if (errorMessage) {
            throw new Error(errorMessage)
        }

        user.balance = currentBalance - amount;
        destUser.balance = parseFloat(destUser.balance) + amount;
        return `Successfully sent ${amount} to user ${dest}.\nNew balance is ${user.balance}.`;
    }
}

function BankApp(bank, main) {
    this.mainElement = main;
    this.bank = bank;
    this.start = function () { this.loadLanding(); }
    this.loadLanding = function () {
        this.currentUser = {};
        loadHtml("landing", this.mainElement).then(() => {
            let forms = document.querySelectorAll("form");
            this.addFormListners(forms);
        });
    };
    this.loadUser = function (user) {
        this.currentUser = user;
        loadHtml("user", this.mainElement).then(() => {

            this.updateProfileDisplay();
            this.updateBalanceDisplay();

            this.mainElement.querySelector(".logout").addEventListener("click", () => {
                this.loadLanding();
            });

            let mainTabs = this.mainElement.querySelectorAll(".main-tab-link");

            mainTabs.forEach(currentTab => {
                currentTab.addEventListener("click", e => {
                    let previousTab = this.mainElement.querySelector(".main-tab-link.active");
                    this.updateCurrentTab(previousTab, currentTab);
                })
            })

            let forms = document.querySelectorAll("form");
            this.addFormListners(forms);
        });
    }
    this.addFormListners = function (forms) {
        forms.forEach((current) => {
            //passwordtoggler
            let password = current.querySelector(".input-password");
            if(password){
                let passwordToggler = current.querySelector(".password-toggler");
                passwordToggler.addEventListener("click", e =>{
                    const type = password.type === 'password' ? 'text' : 'password';
                    const currentIcon = password.type === 'password' ? 'fa-eye-slash' : 'fa-eye';
                    const previousIcon = password.type === 'password' ?  'fa-eye' : 'fa-eye-slash';                    
                    password.type = type;
                    passwordToggler.classList.remove(previousIcon);
                    passwordToggler.classList.add(currentIcon);
                });
            }
            current.addEventListener("submit", e => {
                let action = current.dataset.action;
                try {
                    this[action](current);
                }
                catch (err) {
                    addValidationMessage(current, err);
                }
                e.preventDefault();
            })
        
        });

    }
    this.updateCurrentTab = function (previousTab, currentTab) {
        let currentAction = currentTab.dataset.action;
        //return if same tab
        if (currentAction === previousTab.dataset.action) {
            return;
        }

        let previousTabContent = this.mainElement.querySelector(".main-tabcontent.shown");

        //toggle active tabs
        previousTab.classList.remove("active");
        currentTab.classList.add("active");
        previousTabContent.classList.remove("shown");

        let currentTabContent = this.mainElement.querySelector(`.main-tabcontent#${currentAction}`);
        currentTabContent.classList.add("shown");
    }
    this.updateBankingDisplay = function (form, message) {
        this.updateBalanceDisplay();
        resetForm(form);
        showCustomAlert(message);
    }
    this.updateBalanceDisplay = function(){
        this.mainElement.querySelector("#current-balance").innerHTML = this.currentUser.balance;
    }
    this.updateProfileDisplay = function () {

        this.mainElement.querySelector("#current-user").innerHTML = this.currentUser.fullname;

        let profileEle = this.mainElement.querySelector('#profile');

        profileEle.querySelector(".input-fullname").value = this.currentUser.fullname;
        profileEle.querySelector(".input-password").value = this.currentUser.password;
        profileEle.querySelector(".input-imageURL").value = this.currentUser.imageURL;

        let profilePrev = profileEle.querySelector(".profile-preview");
        profilePrev.querySelector(".img").style.backgroundImage = `url(${this.currentUser.imageURL})`;
        profilePrev.querySelector("p").innerHTML = this.currentUser.fullname;
    }


    //actions
    this.login = function (form) {
        let username = form.querySelector("input.input-username");
        let password = form.querySelector("input.input-password");
        let user = this.bank.get_user(username.value, password.value);
        this.loadUser(user);
    }

    this.register = function (form) {
        let username = form.querySelector("input.input-username");
        let password = form.querySelector("input.input-password");
        let fullname = form.querySelector("input.input-fullname");
        this.loadUser(this.bank.create_user(username.value, password.value, fullname.value));
    }

    this.withdraw = function (form) {
        let amount = form.querySelector("input.input-amount");
        let message = this.bank.withdraw(this.currentUser, parseFloat(amount.value));
        this.updateBankingDisplay(form, message)
    }

    this.deposit = function (form) {
        let amount = form.querySelector("input.input-amount");
        let message = this.bank.deposit(this.currentUser, parseFloat(amount.value));
        this.updateBankingDisplay(form, message)
    }

    this.send = function (form) {
        let username = form.querySelector("input.input-username");
        let amount = form.querySelector("input.input-amount");
        let message = this.bank.send(this.currentUser, username.value, parseFloat(amount.value));
        this.updateBankingDisplay(form, message)
    }

    this.saveProfile = function (form) {
        let fullName = form.querySelector(".input-fullname").value;
        let password = form.querySelector(".input-password").value;
        let imageURL = form.querySelector(".input-imageURL").value;

        let message = this.bank.edit_user(this.currentUser, password, imageURL, fullName);
        showCustomAlert(message);
        this.updateProfileDisplay();
    }
    //////

}

//utilities
function loadHtml(req, ele) {
    return fetch(`${req}.html`).then(res => {
        return res.text();
    }).then(data => {
        ele.innerHTML = data;
    });
}

function addValidationMessage(form, err) {
    let validation = form.querySelector(".validation");
    validation.innerHTML = err.message;
    console.error(err);
    setTimeout(() => { validation.innerHTML = "" }, 10000);
}

function resetForm(form) {
    let inputs = form.querySelectorAll("input");
    inputs.forEach(input => {
        input.value = "";
    })
}


//custom alert
function showCustomAlert(message) {
    let customAlert = document.querySelector(".custom-alert");
    customAlert.style.display = "flex";
    customAlert.querySelector(".message").innerHTML = message;
    document.querySelector(".container").classList.add("disabled");
}
document.querySelector(".custom-alert button").addEventListener("click", e => {
    document.querySelector(".container").classList.remove("disabled");
    let customAlert = document.querySelector(".custom-alert");
    customAlert.style.display = "none";
});



//main
const main = document.querySelector(".main");
const users = [];
const bank = new Bank(users);
loadDummyUsers(bank.users);
const bankApp = new BankApp(bank, main);
bankApp.start();




