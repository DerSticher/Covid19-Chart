var _coronaChart = {};
var _confirmedPerCountry = {};
var _deathsPerCountry = {};
var _recoveredPerCountry = {};
var _increasePerCountry = {};
var _countries = [];
var _labels = [];
var _colors = ['rgba(255, 99, 132, 0.3)', 'rgba(132, 99, 255, 0.3)', 'rgba(132, 255, 99, 0.3)', 'rgba(255, 132, 99, 0.3)', 'rgba(255, 99, 132, 0.3)']
var _dataReceived = 0;

function StoreDataInObject(object, csvData) {
    for (let index = 0; index < csvData.length; index++) {
        const element = csvData[index];
        const name = element[1];

        if (name in object) {
            for (let i = 0; i < object[name].length; i++) {
                object[name][i] += element[4 + i];
            }
        } else {
            object[name] = element.slice(4);
        }
    }

}

function StoreLabels(csvData) {
    _labels = csvData[0].slice(4);
}

function StoreCountries(csvData) {
    _countries = [];
    let checkDups = {};

    for (let index = 1; index < csvData.length; index++) {
        const country = csvData[index][1];

        if (!(country in checkDups)) {
            _countries.push(country);
            checkDups[country] = true;
        }
    }
    _countries.sort();
}

function CalculateWorldData() {
    _confirmedPerCountry['World'] = [];
    _deathsPerCountry['World'] = [];
    _recoveredPerCountry['World'] = [];
    
    for (let index = 0; index < _countries.length; index++) {
        const country = _countries[index];
        for (let dayIndex = 0; dayIndex < _confirmedPerCountry[country].length; dayIndex++) {
            if (dayIndex in _confirmedPerCountry['World']) {
                _confirmedPerCountry['World'][dayIndex] += _confirmedPerCountry[country][dayIndex];
                _deathsPerCountry['World'][dayIndex] += _deathsPerCountry[country][dayIndex]; 
                _recoveredPerCountry['World'][dayIndex] += _recoveredPerCountry[country][dayIndex];
            } else {
                _confirmedPerCountry['World'][dayIndex] = _confirmedPerCountry[country][dayIndex];
                _deathsPerCountry['World'][dayIndex] = _deathsPerCountry[country][dayIndex]; 
                _recoveredPerCountry['World'][dayIndex] = _recoveredPerCountry[country][dayIndex];
            }
        }
    }

    _countries.unshift('World');
}

function StoreConfirmedPerCountry(csvData) {
    _confirmedPerCountry = {};
    StoreDataInObject(_confirmedPerCountry, csvData);
}

function StoreDeathsPerCountry(csvData) {
    _deathsPerCountry = {};
    StoreDataInObject(_deathsPerCountry, csvData);
}

function StoreRecoveredPerCountry(csvData) {
    _recoveredPerCountry = {};
    StoreDataInObject(_recoveredPerCountry, csvData);
}

function CalculateIncrease() {
    _increasePerCountry = {};

    for (let index = 0; index < _countries.length; index++) {
        const country = _countries[index];
        const confirmed = _confirmedPerCountry[country];
        let last = confirmed[0];
        _increasePerCountry[country] = [];
        
        for (let confirmedIndex = 1; confirmedIndex < confirmed.length; confirmedIndex++) {
            const element = confirmed[confirmedIndex];

            if (last > 0) {
                _increasePerCountry[country][confirmedIndex] = 100 * (element - last) / last;
            }
            last = element;
        }
    }
}

function UpdateCountrySelect(_countries) {
    let select = $("#country-select");
    select.contents().remove();

    for (let index = 0; index < _countries.length; index++) {
        const element = _countries[index];
        select.append("<option>" + element + "</option>");
    }

    select.selectpicker('refresh');
}

function GetChartDataForCountry(countryName) {
    return _confirmedPerCountry[countryName];
}

function UpdateChartColors() {
    for (let index = 0; index < _coronaChart.data.datasets.length; index++) {
        const element = _coronaChart.data.datasets[index];
        element.backgroundColor = _colors[index];
    }
    _coronaChart.update();
}

function CreatePeopleDataset(label, data, color) {
    return {
        label: label,
        data: data,
        borderWidth: 1,
        lineTension: 0,
        backgroundColor: color,
        yAxisID: 'left-y-axis'
    }
}

function CreatePercentageDataset(label, data, color) {
    return {
        label: label,
        data: data,
        borderWidth: 2,
        fill: false,
        lineTension: 0,
        borderColor: color,
        hidden: true,
        yAxisID: 'right-y-axis'
    }
}

function SetCDRGraph(countryName) {
    console.log(_confirmedPerCountry[countryName]);
    _coronaChart.data.datasets = [
        CreatePeopleDataset('Confirmed', _confirmedPerCountry[countryName], 'rgba(40, 40, 255, 0.3)'),
        CreatePeopleDataset('Deaths', _deathsPerCountry[countryName], 'rgba(255, 0, 0, 0.3)'),
        CreatePeopleDataset('Recovered', _recoveredPerCountry[countryName], 'rgba(0, 255, 0, 0.3)'),
        CreatePercentageDataset('Increase in %', _increasePerCountry[countryName], 'rgb(42, 128, 42)')
    ];
    _coronaChart.update();
}

function AddCountryData(countryName) {
    _coronaChart.data.datasets.push({
        label: countryName,
        data: _confirmedPerCountry[countryName],
        borderWidth: 1
    });

    UpdateChartColors();
}

function RemoveCountryData(countryName) {
    let datasets = _coronaChart.data.datasets;
    for (let index = datasets.length - 1; index >= 0; index--) {
        const element = datasets[index];
        if (element.label == countryName) {
            _coronaChart.data.datasets.splice(index, 1);
            break;
        }
    }
    UpdateChartColors();
}

function CreateChart(labels) {
    let ctx = document.getElementById('coronaChart');

    _coronaChart = new Chart(ctx, {
        type: 'line',
        fill: true,
        data: {
            labels: labels,
            datasets: [] 
        },
        options: {
            scales: {
                yAxes: [
                {
                    id: 'left-y-axis',
                    scaleLabel: {
                        display: true,
                        labelString: '# of people'
                    },
                    ticks: {
                        beginAtZero: true
                    },
                    type: 'linear',
                    position: 'left'
                },
                {
                    id: 'right-y-axis',
                    scaleLabel: {
                        display: true,
                        labelString: '%'
                    },
                    ticks: {
                        min: 0
                    },
                    type: 'linear',
                    position: 'right'
                }
            ]
            }
        }
    });
}

function GetCountryFromGET() {
    const url = new URL(window.location);
    return url.searchParams.get("country");
}

function CheckStartCountry() {
    if (_dataReceived < 3) {
        return;
    }

    CalculateWorldData();
    CalculateIncrease();
    UpdateCountrySelect(_countries);

    let country = GetCountryFromGET();

    if (!country) {
        country = 'World';
    }

    $('#country-select').selectpicker('val', country);
    SetCDRGraph(country);
}

function UpdateURL(country) {
    let url = window.location.href.split('?')[0];
    window.history.replaceState({}, document.title, url + "?country=" + country);
}

$(document).ready(function() {
    $('#country-select').selectpicker();
    $('#country-select').on('changed.bs.select', function(e, clickedIndex, isSelected, previousValue) {
        let multiselect = $('#country-select')[0].hasAttribute('multiple');
        let index = multiselect ? clickedIndex : clickedIndex - 1;
        let country = _countries[index];

        if (isSelected) {
            if (!multiselect) {
                // RemoveCountryData(previousValue);
            }

            UpdateURL(country);
            SetCDRGraph(country);
            // AddCountryData(country);
        } else {
            // RemoveCountryData(country);
        }
    });

    $('#logarithmic-toggle').bootstrapToggle({
        on: 'Logarithmic',
        off: 'Linear',
        offstyle: 'info'
    });

    $('#logarithmic-toggle').change(function() {
        if ($('#logarithmic-toggle').prop('checked')) {
            _coronaChart.options.scales.yAxes[0].type = 'logarithmic';
        } else {
            _coronaChart.options.scales.yAxes[0].type = 'linear';
        }
        _coronaChart.update();
    });

    Papa.parse("https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv", 
        {
            download: true,
            dynamicTyping: true,
            complete: function(results) {
                console.log("Retrieved confirmed cases");
                const data = results.data;
                StoreLabels(data);
                StoreCountries(data);
                StoreConfirmedPerCountry(data);
                CreateChart(_labels);
                _dataReceived++;
                CheckStartCountry();
            }
        }
    );

    Papa.parse("https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv", 
        {
            download: true,
            dynamicTyping: true,
            complete: function(results) {
                console.log("Retrieved deaths");
                StoreDeathsPerCountry(results.data);
                _dataReceived++;
                CheckStartCountry();
            }
        }
    );

    Papa.parse("https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv", 
        {
            download: true,
            dynamicTyping: true,
            complete: function(results) {
                console.log("Retrieved recovered");
                StoreRecoveredPerCountry(results.data);
                _dataReceived++;
                CheckStartCountry();
            }
        }
    );
});
