(function () {
  document.getElementById("mergeForm").addEventListener("submit", submitHandler);

  function submitHandler (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const fromMap = new Map(formData);
    Promise.all([readFile(fromMap.get("firstFile")), readFile(fromMap.get("secondFile"))])
      .then(([firstFileJSON, secondFileJSON]) => {
        const mergeMap = new Map();
        const finalArray = [];

        const relatedFirstColumn = fromMap.get("relatedFirstColumn");
        const relatedSecondColumn = fromMap.get("relatedSecondColumn");
        addMappedItems(firstFileJSON, mergeMap, relatedFirstColumn, "first");
        addMappedItems(secondFileJSON, mergeMap, relatedSecondColumn, "second");

        [...mergeMap.values()].forEach(item => {
          let multiArrayKey = "first", singleArrayKey = "second";
          if(item.first.length <= 1){
            multiArrayKey = "second";
            singleArrayKey = "first";
          }

          item[multiArrayKey].forEach(el => {
            const obj = item?.[singleArrayKey]?.[0] || {};
            finalArray.push({...el, ...obj});
          })
        })

       const csvData = jsonToCsv(finalArray);
        downloadCsv(csvData, 'output.csv');
        console.log({finalArray, mergeMap, fromMap, firstFileJSON, secondFileJSON})
      }).catch(error => {
      console.error("Error reading files:", error);
    });

  }
  function downloadCsv(csvData, fileName) {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  function jsonToCsv(jsonData) {
    // Find the union of all keys
    const headers = jsonData.reduce((acc, obj) => {
      return [...new Set([...acc, ...Object.keys(obj)])];
    }, []);
    // Create CSV header
    let csv = headers.join(',') + '\n';

    // Convert each object to CSV row
    jsonData.forEach(obj => {
      const row = headers.map(header => {
        // Escape double quotes in values and wrap in double quotes
        let value = obj[header] !== undefined ? obj[header].toString().replace(/"/g, '""') : '';
        return `"${value}"`;
      }).join(',');
      csv += row + '\n';
    });

    return csv;
  }
  function addMappedItems (array, mergeMap, relatedColumn, key) {
    array.forEach(item => {
      if(!item[relatedColumn]) return;
      if(!mergeMap.has(item[relatedColumn])){
        mergeMap.set(item[relatedColumn], {
          first: [],
          second: [],
        });
      }
      const obj = mergeMap.get(item[relatedColumn]);
      obj[key].push(item);
    })
  }
  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(event) {
        Papa.parse(event.target.result, {
          header: true,
          complete: (results) => {
            resolve(results.data);
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
          }
        });
      };
      reader.onerror = function(event) {
        reject(event.target.error);
      };
      reader.readAsText(file);
    });
  }

  function filterAndSplitArray(array, filterFunction) {
    const matchedArray = [];
    const nonMatchedArray = [];

    array.forEach(item => {
      if (filterFunction(item)) {
        matchedArray.push(item);
      } else {
        nonMatchedArray.push(item);
      }
    });

    return [matchedArray, nonMatchedArray];
  }
})();
