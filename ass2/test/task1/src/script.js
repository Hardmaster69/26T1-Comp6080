console.log("Hello world - view me in the Console of developer tools");

const preferredNameInput = document.getElementById('preferredName');
const familyNameInput = document.getElementById('familyName');
const emailInput = document.getElementById('unswEmail');
const wamInput = document.getElementById('wam');
const specialisationSelect = document.getElementById('specialisation');
const selectAllCheckbox = document.getElementById('selectAll');
const locationCheckboxes = [
    document.getElementById('mainLibrary'),
    document.getElementById('lawLibrary'),
    document.getElementById('scienceEngineeringBuilding')
];

const resetButton = document.getElementById('resetButton');
const outputText = document.getElementById('outputText');
const form = document.querySelector('form');


resetButton.addEventListener('click', () => {
    form.reset();
    outputText.value = "";
});

selectAllCheckbox.addEventListener('change', (e) => {
    const isChecked = selectAllCheckbox.checked;
    locationCheckboxes.forEach(cb => {
        cb.checked = isChecked;
    });
});

locationCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        const allAreChecked = locationCheckboxes.every(item => item.checked);
        selectAllCheckbox.checked = allAreChecked;

    });
});

// when to update
document.getElementById('preferredName').addEventListener('blur', () => { render(); });
document.getElementById('familyName').addEventListener('blur', () => { render(); });
document.getElementById('unswEmail').addEventListener('blur', () => { render(); });
document.getElementById('wam').addEventListener('blur', () => { render(); });
document.getElementById('specialisation').addEventListener('change', () => { render(); });
document.getElementById('selectAll').addEventListener('change', () => { render(); });
document.getElementById('mainLibrary').addEventListener('change', () => { render(); });
document.getElementById('lawLibrary').addEventListener('change', () => { render(); });
document.getElementById('scienceEngineeringBuilding').addEventListener('change', () => { render(); });

// test name
function isValidName(name) {
    return /^[a-zA-Z]{3,50}$/.test(name);
}

// test email
function isValidEmail(email, prefName, famName) {
    const zIdRegex = /^z[0-9]{7}@unsw\.edu\.au$/;
    const nameEmail = `${prefName}.${famName}@unsw.edu.au`; 
    
    return zIdRegex.test(email) || email === nameEmail;
}

// test wam
function isValidWam(wam) {
    if (!/^\d+(\.\d{1,2})?$/.test(wam)) return false;
    const num = parseFloat(wam);
    return num >= 0 && num <= 100;
}

// change wam into grade
function getWamStanding(wamValue) {
    const score = parseFloat(wamValue);

    if (score >= 0 && score < 50) {
        return "Fail";
    } else if (score >= 50 && score < 65) {
        return "Pass";
    } else if (score >= 65 && score < 75) {
        return "Credit";
    } else if (score >= 75 && score < 85) {
        return "Distinction";
    } else if (score >= 85 && score <= 100) {
        return "High Distinction";
    }
}

// change the checkbox into text
function formatLocations() {
    const selectedLocations = [];
    
    // in locationCheckboxes[] turns
    locationCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedLocations.push(checkbox.name); 
        }
    });

    const count = selectedLocations.length;

    if (count === 0) {
        return "I have no favourite study location";
    } else if (count === 1) {
        return `my favourite study location is ${selectedLocations[0]}`;
    } else if (count === 2) {
        return `my favourite study locations are ${selectedLocations[0]}, and ${selectedLocations[1]}`;
    } else if (count === 3) {
        return `my favourite study locations are ${selectedLocations[0]}, ${selectedLocations[1]}, and ${selectedLocations[2]}`;
    }
}

// update the textarea
function render() {
    const prefName = document.getElementById('preferredName').value.trim();
    const famName = document.getElementById('familyName').value.trim();
    const email = document.getElementById('unswEmail').value.trim();
    const wam = document.getElementById('wam').value.trim();
    const specialisation = document.getElementById('specialisation').value;
    const standing = getWamStanding(wam);
    const locationsText = formatLocations();
    const outputText = document.getElementById('outputText');

    if (!prefName || !isValidName(prefName)) {
        outputText.value = "Please input a valid preferred name";
        return; 
    }

    if (!famName || !isValidName(famName)) {
        outputText.value = "Please input a valid family name";
        return;
    }

    if (!email || !isValidEmail(email, prefName, famName)) {
        outputText.value = "Please input a valid UNSW email";
        return;
    }

    if (!wam || !isValidWam(wam)) {
        outputText.value = "Please input a valid WAM";
        return;
    }

    let nameSection = "";
    const zIdRegex = /^z[0-9]{7}@unsw\.edu\.au$/;

    // choose the namesection by email format
    if (zIdRegex.test(email)) {
        const extractedZid = email.split('@')[0]; 
        nameSection = `${prefName} ${famName} (${extractedZid})`;
    } else {
        nameSection = `${prefName} ${famName}`;
    }

    outputText.value = `My name is ${nameSection}, my academic standing is ${standing}. I specialise in ${specialisation}, and ${locationsText}.`;
}