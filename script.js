
let current_text = 
`@ title Example

/ Default Tab / A Title
- Description
- Field 1
- Field 2
- Field :3
- Field 4
- Field 5

/ Another Tab / Another Title
- Field 4
- Field 5

Description
- You can use this tool to use and edit interactive forms.
- Edit the text file (editor tab) or upload one (file button).
- The text file should contain:
- Paths (Tab and Header Title) with a list linking to fields.
- Fields with a list of lines of text and properties.
- Supported properties are min, max, and step.
- 
- Type in the fields to update the text.
- Type in the text to update the fields.
- Currently, changes take effect on blur.
-
- There are some bugs and missing features.
- I personally will use this to keep track of D&D character sheets!

Field 1
- max 10
- 1

Field 2
- min 0
- step 2
- 2

Field :3
- :3

Field 4
- 4
- some
-
- text

Field 5
- Some text
- More text
- Even more text
`;

// wip, potential syntax:
// color red
// tab Another Tab 
// # Another Title
// 
// / Field 4
// - 4
// - some
// -
// - text
// 
// = Some Formula
// set field Field 1
// add 2


let current_tab_index = 0;
const BUILTIN_WORDS = ["min", "max", "step", "color"];
//const BUILTIN_GROUPS = ["title", "tab", "h"];

// initial setup
loadText();

document.getElementById("filePicker").addEventListener("change", handleFile);
document.getElementById("editor").addEventListener("blur", modifiedText);

function handleFile(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function () {
      current_text = reader.result;
      loadText();
    };
    reader.readAsText(file);
  }
}

document.getElementById("download").addEventListener("click", download);
function download() {
  // get filename from metadata field if available
  const metadata = structureFromText(current_text).meta;
  const title = metadata.title ?? "data";
  // always append date to filename
  const date = new Date();
  const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const filename = `${title}-${dateString}.txt`;

  // download the file
  const element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(current_text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}



// text -> structure -> elements

function loadText() {
  const editor = document.getElementById("editor");
  editor.innerHTML = current_text;
  elsFromText();
}
function modifiedText(event) {
  current_text = event.target.innerHTML;
  current_text = current_text.replace(/\n<div>/g, "\n");
  current_text = current_text.replace(/<div>/g, "\n");
  current_text = current_text.trim();
  current_text = current_text.replace(/<\/div>/g, "");
  current_text = current_text.replace(/<br>/g, "");
  elsFromText();
}

function structureFromText(text) {

  // WIP

  // // split by lines and then by ; ... a line not starting with - is a new group
  // const groups = [];
  // text.split("\n").forEach(line => {
  //   line = line.trim();
  //   if (line.startsWith("-")) {
  //     line = line.slice(1); // remove leading dash
  //     //groups[groups.length - 1].push('__NEWLINE__');
  //     if (line.length == 0) {
  //       groups[groups.length - 1].push('');
  //     }
  //   } else {
  //     groups.push([]); // start a new group
  //   }
  //   line.split(";").forEach((item, index) => {
  //     item = item.trim();
  //     if (index > 0) {
  //       groups[groups.length - 1].push(';');
  //     }
  //     if (item.length > 0) {
  //       const propertyName = item.split("=")[0].trim();
  //       const propertyValue = item.split("=")[1]?.trim();
  //       if ((BUILTIN_WORDS.includes(propertyName) || BUILTIN_GROUPS.includes(propertyName)) && propertyValue) {
  //         groups[groups.length - 1].push({[propertyName]: propertyValue});
  //       } else {
  //         groups[groups.length - 1].push(item);
  //       } 
  //     }
  //   });
  // });

  // console.log(JSON.stringify(groups, null, 2));
  // return groups;

  // // data now looks like this:
  // // [ [group1], [group2], [group3], ... ] 
  // // where each group is a list of statements
  // // the initial statement is either a field name or some kind of special builtin
  // // builtins can also show up later and usually require a follow up statement that is the corresponding value

  // // turn it into a structure:
  // // [ {type: 'field', name: 'Field', contents: [
  // //     {type: 'step', value: 2},
  // // ] } ]

  function parseLines(text) {
    const groups = [];
  
    text.split("\n").forEach(line => {
      if (line.startsWith("-")) {
        groups[groups.length - 1].push(line.slice(2));
      } else {
        groups.push([line]);
      }
    });
    return groups;
  }
  
  function parseStructure(groups) {
    const paths = [];
    const fields = {};
    const meta = {};
  
    groups.forEach(group => {
      const firstLine = group[0].trim();
  
      if (firstLine.startsWith("/ ")) {
        // is a path, rest of the items are fields
        // remove any "/ " or " / " in the string
        paths.push({path: firstLine.split("/ ").filter(item => item.length > 0), fields: []});
        group.slice(1).forEach(line => {
          paths[paths.length - 1].fields.push(line.trim());
        });

      } else if (firstLine.startsWith("@ ")) {
        // is meta data
        const [key, ...value] = firstLine.slice(2).split(" ");
        meta[key] = value.join(" ");
  
      } else {
        // is a field, rest of the items are content or meta data
        fields[firstLine] = {content: []};
        group.slice(1).forEach(line => {
          line = line.trim();
          const firstWord = line.split(" ")[0];
          if (BUILTIN_WORDS.includes(firstWord)) {
            fields[firstLine][firstWord] = line.slice(firstWord.length + 1);
          } else {
            fields[firstLine].content.push(line);
          }
        });
      }
    });
    //console.log("paths", paths);
    //console.log("fields", fields);
    return { paths, fields, meta };
  }

  const lines = parseLines(text);
  const structure = parseStructure(lines);
  return structure;
}


function elsFromText() {
  const div = document.getElementById("generated");
  const structure = structureFromText(current_text);

  // clear out existing elements
  while (div.firstChild) {
    div.removeChild(div.firstChild);
  }

  // go through the structure and find all tabs. tabs are top level paths. each is [0]
  const tabs = [...new Set(structure.paths.map(path => path.path[0])), "Editor"];
  const tabDiv = document.getElementById("tabs");
  while (tabDiv.firstChild) {
    tabDiv.removeChild(tabDiv.firstChild);
  }

  if (tabs.length > 1) {
    // show tab selector
    tabs.forEach((tabName, tabIndex) => {
      const tabButton = document.createElement("button");
      tabButton.innerText = tabName;
      if (tabIndex == current_tab_index) {
        tabButton.classList.add("active");
      }
      tabButton.onclick = function(e) {
        e.preventDefault();
        current_tab_index = tabIndex;
        window.scrollTo(0, 0);
        elsFromText();
      };
      tabDiv.appendChild(tabButton);
    });
  } else {
    // Go to editor
    current_tab_index = tabs.indexOf("Editor");
  }


  // filter paths to only include the current tab
  const currentTab = tabs[current_tab_index];
  if (currentTab == "Editor") {
    const editor = document.getElementById("editor-container");
    editor.style.display = "block";
    div.style.display = "none";
    return;
  } else {
    const editor = document.getElementById("editor-container");
    editor.style.display = "none";
    div.style.display = "block";
  }
  const currentPaths = structure.paths.filter(path => path.path[0] == currentTab);

  // name site title based on current tab and file title
  const title = structure.meta.title ?? "Untitled";
  document.title = `${currentTab} - ${title}`;

  currentPaths.forEach(path => {
    // header for the path
    const header = document.createElement("h2");
    header.innerText = path.path[path.path.length - 1];
    div.appendChild(header);

    // section for the path
    const section = document.createElement("section");
    div.appendChild(section);

    // add generic input elements
    // edited later by the specific contents and metadata updating, without removing or adding new elements
    // this way, states are preserved and the html still works as expected

    path.fields.forEach(field => {
      const fieldDiv = document.createElement("div");

      const editDiv = document.createElement("div");
      editDiv.contentEditable = true;
      editDiv.classList.add("editable");
      editDiv.addEventListener("blur", () => {
        handleFieldSubmit(fieldDiv, field);
      });

      const decButton = document.createElement("button");
      decButton.onclick = function() { };
      decButton.classList.add("dec");
      decButton.addEventListener("click", (e) => {
        e.preventDefault();
        const fieldData = structure.fields[field];
        console.log("fieldData", fieldData);
        const step = Number(fieldData.step ?? 1);
        applyOperation(fieldDiv, fieldData, "subtract", step);
        handleFieldSubmit(fieldDiv, field);
      });

      const incButton = document.createElement("button");
      incButton.onclick = function() { };
      incButton.classList.add("inc");
      incButton.addEventListener("click", (e) => {
        e.preventDefault();
        const fieldData = structure.fields[field];
        const step = Number(fieldData.step ?? 1);
        applyOperation(fieldDiv, fieldData, "add", step);
        handleFieldSubmit(fieldDiv, field);
      });

      // input div contains the above elements
      const inputDiv = document.createElement("div");
      inputDiv.classList.add("input-div");

      inputDiv.appendChild(editDiv);
      inputDiv.appendChild(decButton);
      inputDiv.appendChild(incButton);
      decButton.style.display = "none";
      incButton.style.display = "none";

      // label
      const labelDiv = document.createElement("label");
      labelDiv.classList.add("field-label");
      labelDiv.innerText = field;

      // field div contains all of the above
      fieldDiv.classList.add("field");

      fieldDiv.appendChild(labelDiv);
      fieldDiv.appendChild(inputDiv);

      // field div needs to be identified by the field name
      fieldDiv.name = field;
      section.appendChild(fieldDiv);

      // match the element to the field data
      // later, this is done to *other* elements as one is updated
      // as well as to the element itself when no longer focused
      matchElementToField(fieldDiv, structure.fields[field], field);
    });
  });
}

/**
 * 
 * flow explanation: ( data is temporary conversion medium)
 * 
 * reload txt -> regenerate data -> replace elements
 *                               element change -> change field in txt -> regenerate data -> match elements to data
 * apply operation to element -> element change -> change field in txt -> regenerate data -> match elements to data
 */

function applyOperation(element, fieldData, operation, value) {
  //console.log("min", fieldData.min, "max", fieldData.max);
  const min = parseInt(fieldData.min ?? -99999990);
  const max = parseInt(fieldData.max ?? 99999990);
  const editDiv = element.querySelector(".editable");
  const currentValue = parseInt(editDiv.innerText);
  const newValue = operation == "add" ? currentValue + value : currentValue - value;
  const clampedValue = Math.min(Math.max(newValue, min), max);
  editDiv.innerText = clampedValue.toString();
}

function handleFieldSubmit(element, field) {
  const editDiv = element.querySelector(".editable");
  // const fieldData = structureFromText(current_text).fields[field];
  // const lines = editDiv.innerHTML.split("\n");

  // // clamp the value to the min and max
  // if (lines.length === 1 && !isNaN(parseInt(lines[0]))) {
  //   const value = parseInt(lines[0]);
  //   editDiv.innerHTML = Math.min(Math.max(value, fieldData.min ?? -99999990), fieldData.max ?? 99999990);
  // }

  const value = editDiv.innerHTML;
  //console.log("submit", field, JSON.stringify(value), structureFromText(current_text).fields);
  updateText(current_text, field, value);
  matchElementToField(element, structureFromText(current_text).fields[field], field);
}

function matchElementToField(element, fieldData, name) {
  // get the divs inside the field div
  const inputDiv = element.querySelector(".input-div");
  const editDiv = inputDiv.querySelector(".editable");
  const decButton = inputDiv.querySelector(".dec");
  const incButton = inputDiv.querySelector(".inc");

  if (!fieldData) {
    console.warn(`Field data missing for ${name}`);
    editDiv.setAttribute("data-ph", "(add field in editor!)");
    return;
  }
  const content = fieldData.content;
  //console.log("match", editDiv.innerHTML, content);
  if (content == editDiv.innerHTML) {
    return;
  }

  decButton.style.display = "none";
  incButton.style.display = "none";
  element.style.gridColumn = "span 1";

  if (content.length == 0) {
    // no content
    editDiv.setAttribute("data-ph", "(enter text here)");
    editDiv.innerHTML = "";
  } else if (content.length == 1) {
    editDiv.innerHTML = content[0];
    if (!isNaN(Number(content[0]))) {
      // single number content
      editDiv.min = fieldData.min ?? 0;
      editDiv.max = fieldData.max ?? 99999990;
      editDiv.step = fieldData.step ?? 1;
      // show buttons
      decButton.style.display = "inline";
      incButton.style.display = "inline";
      editDiv.style.borderRadius = "8px 0 0 8px";
      decButton.style.borderRadius = "0";
      incButton.style.borderRadius = "0 8px 8px 0";
      element.style.gridColumn = "span 1";
      // show step
      if (fieldData.step > 1) {
        decButton.innerText = "-" + fieldData.step;
        incButton.innerText = "+" + fieldData.step;
      } else {
        decButton.innerText = "-";
        incButton.innerText = "+";
      }
      // show min and max
      if (fieldData.min) {
        decButton.disabled = Number(content[0]) <= parseInt(fieldData.min);
      }
      if (fieldData.max) {
        incButton.disabled = Number(content[0]) >= parseInt(fieldData.max);
      }
    }
    // depending on line length/ label length, adjust the element size
    if (content[0].length > 35 || name.length > 50) {
      element.style.gridColumn = "1 / -1";
    } else if (content[0].length > 15 || name.length > 30 || (content[0].length > 1 && fieldData.step > 9)) {
      element.style.gridColumn = "span 2";
    }
  } else {
    // multiline content
    editDiv.innerHTML = content.join("\n");
    element.style.gridColumn = "1 / -1";
  }
}

// element -> structure -> text

function updateText(text, fieldname, value) {
  
  // newline in between adjacent divs
  value = value.replace(/\n<div>/g, "\n");
  value = value.replace(/<div>/g, "\n");
  value = value.trim();
  value = value.replace(/<\/div>/g, "");
  value = value.replace(/<br>/g, "");
  
  //console.log("pre   ", fieldname, JSON.stringify(value));
  // add dashes to the beginning of each line
  let newContent = value.split("\n");
  newContent = newContent.map((line) => {
    return "- " + line;
  });
  //console.log("set lines:", fieldname, newContent);

  const previousLines = text.split("\n");
  const newLines = [];

  // find the right line in the text to modify.
  // go through the actual text and find the change to make. then use textToStructure to update the structure.
  let inField = false;
  previousLines.forEach((line, index) => {
    const isNested = line.startsWith("-") || line == "-";
    const isFinalLine = index == previousLines.length - 1;
    const isProperty = BUILTIN_WORDS.includes(line.split(" ")[1]);

    if (!isNested && line.trim() == fieldname) {
      // found the field to update
      inField = true;
    } else if (inField && (!isNested || isFinalLine)) {
      // done with the field, add the new content
      inField = false;
      newContent.forEach((newLine) => {
        newLines.push(newLine);
      });
    }

    if (isProperty || !isNested || !inField) {
      // push as is
      newLines.push(line);
    }
  });

  // update view based on changes
  current_text = newLines.join("\n");
  loadText();
}