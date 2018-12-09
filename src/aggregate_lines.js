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
        const anyDataset = datasets[0];
        const anyData = anyDataset.data;
        const dataLength = anyData.length;

        const labels = [];
        for (let i = 0; i < dataLength; ++i) {
            labels.push(i);
        }

        return labels;
    }

    static createCard (groupName, rowId) {
        // get actual DOM row from row id
        const row = document.getElementById(rowId);

        // create a card with a list inside
        // add it to row
        $(`<div class="col-3">
            <div class="card">
                <div class="card-header">${groupName}/div>
                <ul class="list-group list-group-flush" class="js-group-card"></ul>
            </div></div>`).appendTo(row);
    }

    static getDatasetLabels (datasets) {
        const labels = [];

        datasets.forEach((dataset) => {
            labels.push(dataset.label);
        });

        return labels;
    }

    static addLabelToCard(label, cardId) {
        // get the actual DOM card from its id
        const card = document.getElementById(cardId);

        // append new list item to card
        $(`<li class="list-group-item" data-label="${label}">${label}</li>`).appendTo(card);
    }

    static addLabelListToCard(labels, cardId) {
        labels.forEach((label) => {
            AggregateLineCharts.addLabelToCard(label, cardId);
        });
    }

    /*
     * the following function expects a list of datasets to merge
     * it calculates the average value at each point and constructs a new
     * line chart. It returns this newly created line chart
     *
     **/
    static mergeDatasets(datasets) {
        // get number of data points from any one dataset
        // all datasets should ideally have the same length
        const dataLength = datasets[0].data.length;

        const mergedData = [];

        // calculate a new data value for every data point
        for (let i = 0; i < dataLength; ++i) {
            const datasetLength = datasets.length;

            const dataSum = 0;
            for (let j = 0; j < datasetLength; ++j) {
                dataSum += datasets[j].data[i];
            }

            // calculate average value and push to new data
            mergedData.push(dataSum/datasetLength);
        }

        return  {
            label: '#merged',
            backgroundColor: color,
            borderColor: color,
            data: mergedData,
            fill: false,
            lineTension: 0
        };
    }

    constructor (chartId) {
        this.canvas = document.getElementById(chartId);
        this.ctx = this.canvas.getContext("2d");
        this.chart = null;

        // get random datasets originally and save for reset
        this.origDatasets = getRandomDatasets(10, -100, 100, 10);

        // we'll always draw current datasets
        this.currDatasets = this.origDatasets;

        // get labels from within the dataset
        const labels = AggregateLineCharts.getDatasetLabels(this.currDatasets);
        AggregateLineCharts.addLabelListToCard(labels, "js-indv");

        dragula([document.getElementById("js-indv"), document.getElementById("group1"), document.getElementById("group2"), document.getElementById("group3")]);

        // bind functions
        this.drawChart = this.drawChart.bind(this);
        this.addEventHandlers = this.addEventHandlers.bind(this);

        // add event handlers
        this.addEventHandlers();

        // draw initial chart
        this.drawChart();
    }

    drawChart () {
        // dont' do anything for no datasets
        if (this.currDatasets.length < 1) {
            return;
        }

        // get labels from within the dataset
        const labels = AggregateLineCharts.getLabels(this.currDatasets);

        const config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: this.currDatasets
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

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(this.ctx, config);
    }

    addEventHandlers () {

    }
}
