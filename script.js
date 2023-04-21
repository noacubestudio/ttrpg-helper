const tabsContainer = document.getElementById("tabs");
const inputsContainer = document.getElementById("inputs");

let currentCategory = undefined;
let characterData = undefined;


// Load the data from example character
fetch("example.json")
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

  
    // Generate the inputs for each field in the category
    for (const field in categoryData) {
        const fieldData = categoryData[field];
        const labelType = (fieldData.view === "headline") ? "h2" : "label";
        const label = document.createElement(labelType);
        label.textContent = fieldData.label;
        label.setAttribute("for", field);
    
        let input;
        switch (fieldData.view) {
            case "textInput":
                input = document.createElement("textarea");
                input.setAttribute("type", "text");
                input.setAttribute("id", field);
                input.value = fieldData.input;
                const newLineCount = (fieldData.input.match(/\n/g) || []).length;
                input.style.height = `${(newLineCount+1.4)*30}px`;
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
                break;
            default:
                input = document.createElement("input");
                input.setAttribute("type", "text");
                input.setAttribute("id", field);
                input.value = fieldData.input;
                input.addEventListener("input", () => {
                    newValue = input.value;
                    updateField(fieldData, newValue);
                });
        }
    
        const container = document.createElement("div");
        if (label.textContent !== undefined && label.textContent.length > 0) {
            container.appendChild(label);
        }
        if (input !== undefined) {
            container.appendChild(input);
        }
        inputsContainer.appendChild(container);
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
    const fileName = (characterData.General !== undefined) ? String(
        characterData.General.characterName.input + 
        characterData.General.level.input
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

    // Generate the tabs
    for (const category in characterData) {
        const tab = document.createElement("button");
        tab.textContent = category;
        tab.addEventListener("click", () => {
            currentCategory = category;
            showInputs(category, characterData[category]);
            window.scrollTo(0, 0);
        });
        tabsContainer.appendChild(tab);
    }

    // Show the inputs for the first category by default
    const firstCategory = Object.keys(characterData)[0];
    currentCategory = firstCategory;
    showInputs(firstCategory, characterData[firstCategory]);
}