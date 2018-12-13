function removeWhiteSpace (str) {
    return str.replace(/\s+/g, '-');
}

class ListItem {
    constructor (label, group, dataset, draw) {
        this.label = label;
        this.group = group;
        this.dataset = dataset;
        this.active = true;
        this.draw = draw;
        this.shouldDraw = true;

        this.strippedLabel = removeWhiteSpace(this.label);
        this.itemId = `js-item-${this.group}-${this.strippedLabel}`;
        this.checkboxId = `js-check-${this.group}-${this.strippedLabel}`;

        // bind functions
        this.checkBoxHandler = this.checkBoxHandler.bind(this);
    }

    getLabel () {
        return this.label;
    }

    isActive () {
        return this.active;
    }

    setShouldDraw (shouldDraw) {
        this.shouldDraw = shouldDraw;
    }

    setActive (active) {
        const domCheckbox = document.getElementById(this.checkboxId);
        domCheckbox.checked = active;
        this.active = active;
    }

    getId () {
        return this.itemId;
    }

    getDataset () {
        return this.dataset;
    }

    addEventListeners () {
        const domCheckbox = document.getElementById(this.checkboxId);

        domCheckbox.addEventListener("click", this.checkBoxHandler);
    }

    checkBoxHandler (ev) {
        const domCheckbox = document.getElementById(this.checkboxId);

        if (domCheckbox.checked) {
            this.active = true;
        } else {
            this.active = false;
        }

        // draw chart again
        if (this.shouldDraw) {
            this.draw();
        }
    }

    render (domList) {
        const listItem =
        $(`
            <li class="list-group-item" id=${this.itemId}>
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="checkbox" id="${this.checkboxId}" checked=${this.active}>
                <label class="form-check-label" for="${this.checkboxId}">
                    ${this.strippedLabel}
                </label>
              </div>
            </li>
        `).appendTo(domList);

        this.addEventListeners();

        return listItem;
    }
}

class List {
    constructor (name, isGroup, drag, draw) {
        this.name = name;
        this.isGroup = isGroup;
        this.active = true;
        this.items = {};
        this.drag = drag;
        this.draw = draw;

        this.strippedName = removeWhiteSpace(this.name);
        this.listId = "js-card-list-" + this.strippedName;
        this.checkboxId = "js-check-" + this.strippedName;

        // bind functions
        this.checkBoxHandler = this.checkBoxHandler.bind(this);
    }

    addEventListeners () {
        const domList = document.getElementById(this.listId);
        const domCheckbox = document.getElementById(this.checkboxId);

        // for drag and drop support
        this.drag.containers.push(domList);

        // checkbox handler
        domCheckbox.addEventListener("click", this.checkBoxHandler);
    }

    addDataset (label, dataset) {
        // get the actual DOM card from its id
        const domList = document.getElementById(this.listId);
        const listItem = new ListItem(label, this.strippedName, dataset, this.draw);

        // create dom for this list item
        listItem.render(domList);

        this.items[listItem.getId()] = listItem;
    }

    addDatasets (datasets) {
        const labels = Object.keys(datasets);

        for (const label of labels) {
            const dataset = datasets[label];

            this.addDataset(label, dataset);
        }
    }

    getId () {
        return this.listId;
    }

    getDatasets () {
        const datasetMap = {};
        if (!this.isGroup) {
            Object.values(this.items).forEach((item) => {
                if (item.isActive()) {
                    datasetMap[item.getLabel()] = item.getDataset();
                }
            });
        } else {
            // if it's a group, we need all or none
            if (!this.isActive()) {
                return {};
            }

            const datasets = [];
            Object.values(this.items).forEach((item) => {
                if (item.isActive()) {
                    datasets.push(item.getDataset());
                }
            });

            if (datasets.length > 0) {
                const mergedDataset = this.mergeDatasets(datasets, this.strippedName);
                datasetMap[this.strippedName] = mergedDataset;
            }
        }

        return datasetMap;
    }

    isActive () {
        return this.active;
    }

    addItem (itemId, item) {
        this.items[itemId] = item;
    }

    removeItem (itemId) {
        // get item for returning
        const item = this.items[itemId];

        // delete from object
        delete this.items[itemId];

        return item;
    }

    addDummyItem () {
        // get the actual DOM card from its id
        const domList = document.getElementById(this.listId);

        const listLength = $(domList).find("li").length;

        // add dummy item to group if length of group is 1
        if (listLength < 1) {
            $(`<li class="list-group-item dummy-item">Add items here</li>`).appendTo(domList);
        }
    }

    removeDummyItem () {
        // get the actual DOM card from its id
        const domList = document.getElementById(this.listId);

        $(domList).find(".dummy-item").remove();
    }

    render (row) {
        const card =
        $(`
            <div class="col-2 mb-3">
                <div class="card">
                    <div class="card-header">
                        <div class="form-check form-check-inline">
                          <input class="form-check-input" type="checkbox" id="${this.checkboxId}" checked=${this.active}>
                          <label class="form-check-label" for="${this.checkboxId}">
                            ${this.name}
                          </label>
                        </div>
                    </div>
                    <ul class="list-group list-group-flush js-group-card"
                        id="${this.listId}">
                    </ul>
                </div>
            </div>
        `).appendTo(row);

        // add listeners on input boxes and for dragula
        this.addEventListeners();
    }

    checkBoxHandler (ev) {
        const domCheckbox = document.getElementById(this.checkboxId);

        if (domCheckbox.checked) {
            this.active = true;
        } else {
            this.active = false;
        }

        Object.values(this.items).forEach((item) => {
            // don't draw for every list item
            item.setShouldDraw(false);
            item.setActive(this.active);
            item.setShouldDraw(true);
        });

        // draw charts again
        this.draw();
    }

    /*
     * the following function expects a list of datasets to merge
     * it calculates the average value at each point and constructs a new
     * line chart. It returns this newly created line chart
     *
     **/
    mergeDatasets (datasets, label) {
        // get number of data points from any one dataset
        // all datasets should ideally have the same length
        const dataLength = datasets[0].data.length;

        const mergedData = [];

        // calculate a new data value for every data point
        for (let i = 0; i < dataLength; ++i) {
            const datasetLength = datasets.length;

            let dataSum = 0;
            for (let j = 0; j < datasetLength; ++j) {
                dataSum += datasets[j].data[i];
            }

            // calculate average value and push to new data
            mergedData.push(dataSum/datasetLength);
        }

        // get a random color
        const color = randomColor(220);

        return  {
            label: label,
            backgroundColor: color,
            borderColor: color,
            data: mergedData,
            fill: false,
            lineTension: 0
        };
    }
}