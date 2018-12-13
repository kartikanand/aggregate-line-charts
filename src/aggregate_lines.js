'use strict';

class AggregateLineCharts {
    /*
     * given a set of dataset
     * return a list of labels from this dataset
     * the function assumes all datasets will have the same labels
     * and thus picks the first one
     *
     **/
    static getLabels (datasets) {
        // get all line labels
        const lines = Object.keys(datasets);

        if (lines.length == 0) {
            return [];
        }

        // get any line from the dataset
        const anyLine = lines[0];

        // get any dataset
        const anyDataset = datasets[anyLine];
        const anyData = anyDataset.data;
        const dataLength = anyData.length;

        const labels = [];
        for (let i = 0; i < dataLength; ++i) {
            labels.push(i);
        }

        return labels;
    }

    constructor (chartId, rowId) {
        this.canvas = document.getElementById(chartId);
        this.rowId = rowId;
        this.ctx = this.canvas.getContext("2d");
        this.chart = null;
        this.cards = {};

        // get random datasets originally and save for reset
        this.origDatasets = getRandomDatasets(10, -100, 100, 50);
        this.currDatasets = {};

        // save drag drop list for further adding new groups
        this.dragdrop = dragula([], {
            invalid: function (el, handle) {
                return el.classList.contains("dummy-item");
            }
        });

        // bind functions
        this.drawAllLists = this.drawAllLists.bind(this);
        this.drawChart = this.drawChart.bind(this);
        this.addEventHandlers = this.addEventHandlers.bind(this);
        this.groupInputHandler = this.groupInputHandler.bind(this);
        this.dropHandler = this.dropHandler.bind(this);
        this.dragEndHandler = this.dragEndHandler.bind(this);

        // add event handlers
        this.addEventHandlers();

        // create card for individual labels
        this.addIndvCard();

        // draw initial chart
        this.drawAllLists();
    }

    addIndvCard () {
        // create a card for individual labels
        const indvCard = new List("Individual", false, this.dragdrop, this.drawAllLists);

        const row = document.getElementById(this.rowId);
        indvCard.render(row);

        indvCard.addDatasets(this.origDatasets);

        this.cards[indvCard.getId()] = indvCard;
    }

    /*
     * this function is responsible for generating the current data set
     * it uses all labels in individual list as is
     * at the same time, it merges labels in the group list and adds one
     * label to current data set
     */
    drawAllLists () {
        // reset current datasets
        this.currDatasets = {};

        Object.values(this.cards).forEach((card) => {
            this.currDatasets = Object.assign(card.getDatasets(), this.currDatasets);
        });

        // draw the chart now
        this.drawChart();
    }

    drawChart () {
        const config = {
            type: 'line',
            data: {
                labels: AggregateLineCharts.getLabels(this.currDatasets),
                datasets: Object.values(this.currDatasets)
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                },
                scales: {
                    xAxes: [{
                        display: true,
                    }],
                    yAxes: [{
                        display: true,
                    }]
                },
                animation: {
                    duration: 0
                },
                tooltips: {
                    enabled: false
                },
                hover: {
                    mode: null
                }
            }
        };

        // get current scroll position
        const currentPos = $(document).scrollTop();

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(this.ctx, config);

        // reset to current scroll position after chart update
        $(document).scrollTop(currentPos);
    }

    dropHandler (el, target, source, sibling) {
        const targetCard = this.cards[target.id];
        const sourceCard = this.cards[source.id];

        // move items in between lists
        const item = sourceCard.removeItem(el.id);
        targetCard.addItem(el.id, item);

        // remove dummy item from group
        targetCard.removeDummyItem();

        // add dummy item to group if needed
        sourceCard.addDummyItem();
    }

    dragEndHandler (el) {
        this.drawAllLists();
    }

    groupInputHandler (ev) {
        ev.preventDefault();

        // handle only enter key
        if (ev.keyCode != 13) {
            return;
        }

        // create a new group
        const groupName = ev.target.value;

        // don't do anything for empty names
        if (groupName == "") {
            return;
        }

        // reset input
        ev.target.value = "";

        // create a new card for this group
        const card = new List(groupName, true, this.dragdrop, this.drawAllLists);
        const row = document.getElementById("js-cardlist");

        card.render(row);

        this.cards[card.getId()] = card;

        // add a dummy item for start
        card.addDummyItem();
    }

    addEventHandlers () {
        // handler drag drop
        this.dragdrop.on("dragend", this.dragEndHandler);
        this.dragdrop.on("drop", this.dropHandler);

        const groupInput = document.getElementById("js-group-input");

        groupInput.addEventListener("keyup", this.groupInputHandler);
    }
}
