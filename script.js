const tabsContainer = document.getElementById("tabs");
const inputsContainer = document.getElementById("inputs");

let currentCategory = undefined;
let characterData = undefined;
let isTabletSized = window.matchMedia(`(min-width: ${768}px)`).matches;
let rowCount = (isTabletSized) ? 4 : 2;


// Load the data from empty 5e template
fetch("emptyTemplateDND5e.json")
.then(response => response.json())
.then(data => {
    loadCharacter(data);
});

// Generate the input fields for a given category
function showInputs(category, categoryData) {
    // Clear the inputs container
    inputsContainer.innerHTML = "";

    // Make the header
    // const header = document.createElement("h1");
    // header.textContent = category;
    // inputsContainer.appendChild(header);


    // Multiple items can share a row
    let currentRow = null;
    let remainingWidth = rowCount;

    let displayItems = Object.assign({}, categoryData);
    // Add empty full row at the end
    displayItems.endSpacer = {view: "info", width: 'full'};
  
    // Generate the inputs for each field in the category
    for (const field in displayItems) {
        const fieldData = displayItems[field];
        const labelType = (fieldData.view === "headline") ? "h2" : ((fieldData.view === "info") ? "p" : "label");
        const label = document.createElement(labelType);
        label.textContent = fieldData.label;
        label.setAttribute("for", field);
        if (fieldData.view === "info") label.classList.add('info');

        // Create a new row for full width elements
        const isFullWidth = (fieldData.width === 'full' 
            || fieldData.view === "headline" 
            || fieldData.view === "textInput"
            || fieldData.view === "info");

        if (isFullWidth) {
            // fill existing row with spacers
            if (currentRow != null && currentRow.childElementCount < rowCount && currentRow.querySelector('.full') === null) {
                for (let i = rowCount - currentRow.childElementCount; i > 0; i--) {
                    const spacer = document.createElement("div");
                    spacer.classList.add('spacer');
                    spacer.classList.add('field-container');
                    currentRow.appendChild(spacer);
                }
            }

            currentRow = document.createElement('div');
            currentRow.classList.add('row');
            inputsContainer.appendChild(currentRow);
            remainingWidth = rowCount;
        }

        // Create one element
        let input;

        switch (fieldData.view) {
            case "textInput":
                input = document.createElement("textarea");
                input.setAttribute("type", "text");
                input.setAttribute("id", field);
                input.setAttribute("rows", "1");
                input.setAttribute("autocorrect", "off");
                input.value = fieldData.input;
                input.addEventListener("input", () => {
                    newValue = input.value;
                    updateField(fieldData, newValue);

                    // reset the height to auto in case the user deletes text
                    input.style.height = 'auto';
                    // set the height to match the scroll height of the textarea
                    input.style.height = `${input.scrollHeight}px`;
                });
                break;
            case "intInput":
                input = document.createElement("input");
                input.setAttribute("type", "number");
                input.setAttribute("id", field);
                input.value = fieldData.input;
                input.addEventListener("input", () => {
                    newValue = parseInt(input.value);
                    updateField(fieldData, newValue);
                });
                break;
            case "stepper":
                input = document.createElement("div");
                input.classList.add("stepper-input");

                const numInput = document.createElement("input");
                numInput.setAttribute("type", "number");
                numInput.setAttribute("id", field);
                numInput.setAttribute("value", fieldData.input);
                numInput.setAttribute("min", fieldData.viewProperties.minValue);
                numInput.setAttribute("max", fieldData.viewProperties.maxValue);
                numInput.addEventListener("input", () => {
                    if (numInput.value.length > 0) {
                        if (numInput.value < fieldData.viewProperties.minValue) {
                            numInput.value = fieldData.viewProperties.minValue;
                        } else if (numInput.value > fieldData.viewProperties.maxValue) {
                            numInput.value = fieldData.viewProperties.maxValue;
                        }
                    }
                    // Update the JSON data
                    newValue = parseInt(numInput.value);
                    updateField(fieldData, newValue);
                });
                input.appendChild(numInput);
    
                const decButton = document.createElement("button");
                decButton.classList.add("stepper-button");
                decButton.textContent = "-";
                decButton.addEventListener("click", () => {
                    if (input.querySelector("input").value > fieldData.viewProperties.minValue) {
                        input.querySelector("input").value--;
                        // Update the JSON data
                        newValue = Number(input.querySelector("input").value);
                        updateField(fieldData, newValue);
                    }
                });
                input.appendChild(decButton);

                const incButton = document.createElement("button");
                incButton.classList.add("stepper-button");
                incButton.textContent = "+";
                incButton.addEventListener("click", () => {
                    if (input.querySelector("input").value < fieldData.viewProperties.maxValue) {
                        input.querySelector("input").value++;
                        // Update the JSON data
                        newValue = Number(input.querySelector("input").value);
                        updateField(fieldData, newValue);
                    }
                });
                input.appendChild(incButton);
                break;
            case "headline":
            case "info":
                break;
            default:
                input = document.createElement("input");
                input.setAttribute("type", "text");
                input.setAttribute("id", field);
                input.setAttribute("autocorrect", "off");
                input.value = fieldData.input;
                input.addEventListener("input", () => {
                    newValue = input.value;
                    updateField(fieldData, newValue);
                });
        }

        // add the container for one field to the row
        if (!isFullWidth) {
            // if the current one is full
            if (!currentRow || remainingWidth <= 0) {
                // Create a new row 
                currentRow = document.createElement('div');
                currentRow.classList.add('row');
                inputsContainer.appendChild(currentRow);
                remainingWidth = rowCount;
            }
        }
        // add to row
        // make the input and label in one element div
        const container = document.createElement("div");
        container.classList.add('field-container');
        if (label.textContent !== undefined && label.textContent.length > 0) {
            container.appendChild(label);
        }
        if (input !== undefined) {
            container.appendChild(input);
        }
        currentRow.appendChild(container);
        if (isFullWidth) {
            container.classList.add('full');
            remainingWidth-= rowCount;
        } else remainingWidth--;


        // modify height of text area based on lines
        if (input !== undefined && input.tagName === "TEXTAREA") {
            input.style.height = `${input.scrollHeight}px`;
        }
    }
}


function updateField(fieldData, newValue) {
    fieldData.input = newValue;
    console.log(fieldData.label, fieldData.input, fieldData.view);
    console.log(characterData);
}


const fileInput = document.getElementById("file-input");
fileInput.addEventListener("change", (event) => {
    const selectedFile = event.target.files[0];
    const reader = new FileReader();

    // Add an event listener for when the file is loaded
    reader.addEventListener("load", () => {
        // Get the file contents as a string and parse as JSON
        const fileContents = reader.result;
        const jsonData = JSON.parse(fileContents);

        // Do something with the JSON data
        loadCharacter(jsonData);
    });

    // Read the file as text
    reader.readAsText(selectedFile);
});


const saveButton = document.getElementById("save-button");
saveButton.addEventListener("click", () => {
    const fileName = (characterData.BASE !== undefined) ? String(
        characterData.BASE.characterName.input + 
        characterData.BASE.level.input
    ) : "character";

    const data = characterData;
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName + ".json";
    a.click();
    URL.revokeObjectURL(url);
});


function loadCharacter(data) {
    // set new
    characterData = data;
    console.log("Loaded character from JSON!");
    console.log(characterData);

    // Cleat the tabs container
    tabsContainer.innerHTML = "";

    // Calculate tab width based on number
    const tabCount = Object.keys(characterData).length;
    const tabWidth = 100 / tabCount;

    // Generate the tabs
    for (const category in characterData) {
        const tab = document.createElement("button");
        tab.style.width = `${tabWidth}%`;
        tab.textContent = category;
        tab.setAttribute("class", "tab");
        tab.setAttribute("id", category);
        tab.addEventListener("click", () => {
            currentCategory = category;
            showInputs(category, characterData[category]);
            setActiveTab(category);
            window.scrollTo(0, 0);
        });
        tabsContainer.appendChild(tab);
    }

    // Show the inputs for the first category by default
    const firstCategory = Object.keys(characterData)[0];
    currentCategory = firstCategory;
    showInputs(firstCategory, characterData[firstCategory]);
    setActiveTab(firstCategory);
}

function setActiveTab(tabId) {
    // Get all tab elements
    const tabs = document.querySelectorAll('.tab');
  
    // Remove active class from all tabs
    tabs.forEach(tab => tab.classList.remove('active'));
  
    // Add active class to selected tab
    const selectedTab = document.getElementById(tabId);
    selectedTab.classList.add('active');
}