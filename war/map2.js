/*
 * Code for rendering a Google Map with vaccine cold chain data.
 * Author: Melissa Winstanley
 */

// The map itself.
var map;

// All markers that are displayed on the map - one per facility.
// marker.info stores the raw data associated with the marker.
var markers = [];

// The pop-up window to be displayed on the map.
var infoWindow;

// User-selected display options. By default, display considering population.
var selections = { 'considerPop' : true };

var electricityCodes = [ [ 'None', 'images/red.png' ],
        [ 'Under 8 hours / day', 'images/orange.png' ],
        [ '8-16 hours / day', 'images/yellow.png' ],
        [ 'Over 16 hours / day', 'images/green.png' ] ];
var keroseneCodes = [ [ 'N/A', null ],
        [ 'Always Available', 'images/green.png' ],
        [ 'Sometimes Available', 'images/yellow.png' ],
        [ 'Not Available', 'images/red.png' ],
        [ 'Unknown', 'images/white.png' ] ];
var gasCodes = [ [ 'N/A', null ], [ 'Always Available', 'images/green.png' ],
        [ 'Sometimes Available', 'images/yellow.png' ],
        [ 'Not Available', 'images/red.png' ],
        [ 'Unknown', 'images/white.png' ] ];
var stockOutCodes = [ [ 'No', 'images/green.png' ], [ 'Yes', 'images/red.png' ] ];
var surplusCodes = [ [ 'Over 30% shortage', 'images/red.png' ],
                     [ '10-30% shortage', 'images/yellow.png' ],
                     [ '+- 10%', 'images/white.png' ],
                     [ '10-30% surplus', 'images/blue.png' ],
                     [ 'Over 30% surplus', 'images/green.png' ] ];

var schedules = [ 'base', 'pcv', 'rota' ];

var facilityTypeCodes = [ 'N/A', 'National vaccine store',
        'Regional vaccine store', 'District vaccine store',
        'District hospital - MoH', 'Central hospital - MoH',
        'Rural hospital - MoH', 'Hospital - CHAM', 'Community hospital - CHAM',
        'Hospital - private', 'Health centre - MoH', 'Health centre - CHAM',
        'Health centre - private', 'Maternity - local government',
        'Maternity - MoH', 'Dispensary - local government', 'Dispensary - MoH',
        'Health post - MoH' ];

var facilityTypes = {
        'all' : [],
        'national-regional' : [ 1, 2 ],
        'district' : [ 3 ],
        'health-center' : [ 10, 11 ],
        'health-post' : [ 16, 17 ],
        'other' : [ 4, 5, 6, 7, 8, 9, 12, 13, 14, 15 ]
    };

/*
 * Set up the initial map.
 */
$(document).ready(
        function() {
            getKeys();
            setRequestedFields();
            setUpUI();
            requestData();
            resize();
            alert(document.cookie);
            
            /*
            var index = 0;
            for (sched in schedule) {
                schedule[index] = csv2json(schedule[sched]);
                if (surplusKeys.length == 0) {
                    // to fix - why is last field name weird?
                    for (k in schedule[index][0]) {
                        if (k.indexOf('%') >= 0) {
                            if (k.indexOf('+') < 0) {
                                surplusKeys[k] = 2
                                        + (k.indexOf('Shortage') >= 0 ? 1 : -1)
                                        * (k.indexOf('>') >= 0 ? 2 : 1);
                            } else {
                                surplusKeys[k] = 2;
                            }
                        }
                    }
                    surplusKeys.length = 5;
                }
                index++;
            }
            selections.schedule = 'base';
*/
            infoWindow = new google.maps.InfoWindow({
                content : "hi there!"
            });
/*

            var vaccine_index = 0;
            var fridge_index = 0;
            var nextFridge = fridgeData[0];
            for ( var i = 0; i < points.length; i++) {
                if (schedule[0][vaccine_index]
                        && schedule[0][vaccine_index]['Facility Code'] == id) {
                    var vals = [];
                    for (j = 0; j < 3; j++) {
                        vals[j] = schedule[j][vaccine_index];
                    }
                    processVaccine(vals, i);
                    vaccine_index++;
                }
            }
            showCategory('fi_electricity');
            $('#selector').val('electricity');
            $('#region').val('all');
            $('#facility-type').val('all');
            $('#schedule').val('base');
            resize();
            // });
            // });*/
        });

/*
 * Sends a POST request to the server specifying which fields of the database are
 * of interest to the mapping process.
 */
function setRequestedFields() {
    var dataParams = "key=fn_latitude&key=fn_longitude&key=ft_facility_code&" +
                     "key=fridges&key=fi_electricity&key=fi_kerosene&key=fi_bottled_gas&" +
                     "key=ft_facility_type&key=ft_level2&key=fn_stock_outs&key=ft_facility_name&" +
                     "key=fi_tot_pop&key=base_schedule&key=pcv_schedule&key=rota_schedule";
    $.ajax({
        type: "POST",
        url: "/coldchain",
        data: dataParams,
        success: function(responseText) {
        }
    });
}

function requestData() {
    $.ajax({
        type: "GET",
        url: "/coldchain",
        data: "file=TBL_FACILITIES.csv",
        success: function(responseText) {
            data = JSON.parse(responseText);
            for (var i = 0; i < data.length; i++) {
                var lat = data[i]['fn_latitude'];
                var lon = data[i]['fn_longitude'];
                if (lat.length > 0 && lon.length > 0) {
                    addMarker(new google.maps.LatLng(parseFloat(lat), parseFloat(lon)), data[i]);
                }
            }
            showCategory('fi_electricity');
        }
    });
}

/*
 * Performs an AJAX request to get all keys of interest.
 */
function getKeys() {
    $.ajax({
        type: "GET",
        url: "/coldchain",
        data: "file=TBL_FACILITIES.csv&k=y",
        success: function(responseText) {
        }
    });
}

function addDropBoxOptions(box, options, func) {
    $.each(options, function(val, text) {
        $(box).append(
                $('<option></option>').val(val).html(text)
        );
    });
    $(box).change(function() {
        func($(box).val());
    });
}

function showCategory(category) {
    selections.category = category;
    if (markers) {
        for (m in markers) {
            var marker = markers[m];
            var thisMap = marker.getMap();
            if (category == 'pie') {
                setPie(marker);
            } else if (category == 'surplus') {
                setImage(marker, marker.info[category], category);
            } else {
                setImage(marker, parseInt(marker.info[category]), category);
            }
            marker.setMap(thisMap);
        }
    }
    showKey(category);
}

function mapData(category) {
    selections.category = category;
    if (markers) {
        for (m in markers) {
            var marker = markers[m];
            var thisMap = marker.getMap();
            if (category == 'pie') {
                setPie(marker);
            } else if (category == 'surplus') {
                setImage(marker, marker.info[category], category);
            } else {
                setImage(marker, parseInt(marker.info[category]), category);
            }
            marker.setMap(thisMap);
        }
    }
    showKey(category);
}

function showOneRegion(region) {
    selections.regions = region;
    if (markers) {
        for (m in markers) {
            var marker = markers[m];
            if ((region == 'ALL' || marker.info['ft_level2'] == region)
                    && (selections.facilityTypes == null
                            || selections.facilityTypes.length == 0 || marker.info['ft_facility_type'] in selections.facilityTypes)) {
                marker.setMap(map);
            } else {
                marker.setMap(null);
            }
        }
    }
}

function showTypes(intTypes) {
    types = [];
    var vals = facilityTypes[intTypes];
    for (i in vals) {
        types[vals[i]] = true;
        types.length++;
    }
    selections.facilityTypes = types;
    if (markers) {
        for (m in markers) {
            var marker = markers[m];
            if ((types.length == 0 || types[marker.info['ft_facility_type']])
                    && (selections.regions == 'ALL'
                            || marker.info['ft_level2'] == selections.regions)) {
                marker.setMap(map);
            } else {
                marker.setMap(null);
            }
        }
    }
}

function showSchedule(schedule) {
    selections.schedule = schedule;
    if (selections.category == 'surplus' || selections.category == 'pie') {
        showCategory(selections.category);
    }
}

/*
 * Sets up the UI, including the map itself, the buttons, and the markers.
 */
function setUpUI() {
    // Set up the map
    var latlng = new google.maps.LatLng(-13.15, 34.4);
    var myOptions = {
        zoom : 7,
        center : latlng,
        mapTypeId : google.maps.MapTypeId.ROADMAP
    };
    var mapDiv = document.getElementById('map-canvas');
    map = new google.maps.Map(mapDiv, myOptions);
    google.maps.event.addListener(map, 'zoom_changed', function() {
        showCategory(selections.category);
    });

    // Set up categories
    var categories = {
        'fi_electricity' : 'Electricity',
        'fi_bottled_gas' : 'Bottled gas',
        'fi_kerosene' : 'Kerosene',
        'fn_stock_outs' : 'Stock outs',
        'surplus' : 'Surplus',
        'pie' : 'Pie charts'
    };
    addDropBoxOptions('#selector', categories, function(category) {
        showCategory(category);
        showKey(category);
    });
    selections.category = 'fi_electricity';

    // Set up facility types
    var types2 = {
            'all' : 'All',
            'national-regional' : 'National/Regional',
            'district' : 'District',
            'health-center' : 'Health Center',
            'health-post' : 'Health Post',
            'other' : 'Other'
    };
    addDropBoxOptions('#facility-type', types2, showTypes);

    // Set up regions
    var regions = {
            'ALL' : 'All',
            'NORTH' : 'North',
            'CENTRAL' : 'Central',
            'SOUTH' : 'South',
    };
    selections.regions = 'ALL';
    addDropBoxOptions('#region', regions, showOneRegion);

    // Set up population-ignore button
    $('#ignore-size').click(function() {
        if (selections.considerPop) {
            $('#ignore-size').html('Consider population');
        } else {
            $('#ignore-size').html('Ignore population');
        }
        selections.considerPop = !selections.considerPop;
        showCategory(selections.category);
    });

    // Set up vaccine schedules
    var schedule = {
        'base_schedule' : 'Base',
        'pcv_schedule' : 'Pneumo.',
        'rota_schedule' : 'Pneumo. + Rota'
    };
    selections.schedule = 'base_schedule';
    addDropBoxOptions('#schedule', schedule, showSchedule);
}

// ------------------ KEY ----------------------------------------
/*
 * Display the key based on the current type of information being displayed.
 */
function showKey(type) {
    var panelText = '';
    var green = '<img src="images/green.png" width="15px" height="15px"/>';
    var orange = '<img src="images/orange.png" width="15px" height="15px"/>';
    var red = '<img src="images/red.png" width="15px" height="15px"/>';
    var yellow = '<img src="images/yellow.png" width="15px" height="15px"/>';
    var white = '<img src="images/white.png" width="15px" height="15px"/>';
    var blue = '<img src="images/blue.png" width="15px" height="15px"/>';
    if (type == 'fi_kerosene') {
        panelText = '<table><tr><td>(KEY) Kerosene:</td><td>' + green + ' '
                + keroseneCodes[1][0] + '</td><td>' + yellow + ' '
                + keroseneCodes[2][0] + '</td><td>' + red + ' '
                + keroseneCodes[3][0] + '</td><td>' + white + ' '
                + keroseneCodes[4][0] + '</td></tr></table>';
    } else if (type == 'fi_bottled_gas') {
        panelText = '<table><tr><td>(KEY) Gas:</td><td>' + green + ' '
                + gasCodes[1][0] + '</td><td>' + yellow + ' ' + gasCodes[2][0]
                + '</td><td>' + red + ' ' + gasCodes[3][0] + '</td><td>'
                + white + ' ' + gasCodes[4][0] + '</td></tr></table>';
    } else if (type == 'fi_electricity') {
        panelText = '<table><tr><td>(KEY) Electricity:</td><td>' + red + ' '
                + electricityCodes[0][0] + '</td><td>' + orange + ' '
                + electricityCodes[1][0] + '</td><td>' + yellow + ' '
                + electricityCodes[2][0] + '</td><td>' + green + ' '
                + electricityCodes[3][0] + '</td></tr></table>';
    } else if (type == 'fn_stock_outs') {
        panelText = '<table><tr><td>(KEY) Stock-outs:</td><td>' + green
                + ' No</td><td>' + red + ' Yes</td></tr></table>';
    } else if (type == 'surplus') {
        panelText = '<table><tr><td>(KEY) Base Vaccine Surplus:</td><td>'
                + green + ' ' + surplusCodes[0][0] + '</td><td>' + blue + ' '
                + surplusCodes[1][0] + '</td><td>' + white + ' '
                + surplusCodes[2][0] + '</td><td>' + yellow + ' '
                + surplusCodes[3][0] + '</td><td>' + red + ' '
                + surplusCodes[4][0] + '</td></tr></table>';
    } else if (type == 'pie') {
        panelText = '<table><tr><td>(KEY) Vaccine Requirements:</td><td>'
                + '<img src="images/green_0_100_0.png" width="20px" height="20px"/> >8hrs electricity</td><td>'
                + '<img src="images/blue_0_100_0.png" width="20px" height="20px"/> <8hrs electricity, gas</td><td>'
                + '<img src="images/black_0_100_0.png" width="20px" height="20px"/> <8hrs electricity, kerosene</td><td>'
                + '<img src="images/red_0_100_0.png" width="20px" height="20px"/> None of the above</td><td>'
                + '</td><td></td><td>'
                + '<img src="images/green_100_0_0.png" width="20px" height="20px"/> Requirements fully met</td><td>'
                + '<img src="images/green_0_100_0.png" width="20px" height="20px"/> Requirements fully unmet</td></tr></table>';
    } else {
        panelText = 'Whoops!';
    }

    $('#footer').html(panelText);
}

// ------------------ MARKERS ------------------------------------
/*
 * Add a new marker to the map corresponding with the given location and
 * representing the given data.
 */
function addMarker(location, data) {
    markers.push(makeMarker(location, data));
}

/*
 * Creates and returns a new marker corresponding with the given location
 * and representing the given information.
 */
function makeMarker(location, info) {
    var marker = new google.maps.Marker({
        position : location,
        map : map
    });
    marker.info = info;

    // Marker starts out displaying electrictiy information
    setImage(marker, parseInt(info['fi_electricity']), 'fi_electricity');

    var listener = makeInfoBoxListener(marker);
    google.maps.event.addListener(marker, 'click', listener);
    // google.maps.event.addListener(marker, 'mouseover', listener);
    return marker;
}

/*
 * Set the image of the given marker to represent the given category's value.
 */
function setImage(marker, value, category) {
    var imageName;
    if (category == 'fi_electricity') {
        value = value >= 0 ? value : 0;
        if (value < 0 || value > 3)
            alert(getString(marker.info));
        imageName = electricityCodes[value][1];
    } else if (category == 'fi_kerosene') {
        value = value >= 0 ? value : 4;
        imageName = keroseneCodes[value][1];
    } else if (category == 'fi_bottled_gas') {
        value = value >= 0 ? value : 4;
        imageName = gasCodes[value][1];
    } else if (category == 'fn_stock_outs') {
        value = value >= 0 ? value : 0;
        imageName = stockOutCodes[value][1];
    } else if (category == 'surplus') {
        var val = parseInt(marker.info[selections.schedule]["Surplus"]);
        val = val >= 0 ? val : 2;
        imageName = surplusCodes[val][1];
    } else {
        imageName = 'images/white.png';
    }
    var zoom = map.getZoom();
    var factor = 40000 / (zoom / 7) / (zoom / 7) / (zoom / 7);
    var scale = marker.info['fi_tot_pop'] / factor;
    if (!selections.considerPop) {
        scale = (zoom - 7) * 3 + 6;
    } else if (marker.info['fi_tot_pop'] < factor * ((zoom - 7) * 3 + 3)) {
        scale = (zoom - 7) * 3 + 3;
    } else if (marker.info['fi_tot_pop'] > factor * ((zoom - 7) * 8 + 15)) {
        scale = (zoom - 7) * 8 + 15;
    }

    var image = new google.maps.MarkerImage(imageName, new google.maps.Size(
            scale, scale),
    // The origin for this image is 0,0.
    new google.maps.Point(0, 0), new google.maps.Point(scale / 2, scale / 2),
            new google.maps.Size(scale, scale));
    marker.setIcon(image);
}

/*
 * Set the given marker's image to be a pie chart representing the
 * requirements and capacity of the facility represented by the marker.
 */
function setPie(marker) {
    var imageName = 'images/';
    var electricity = parseInt(marker.info['fi_electricity']);
    var gas = parseInt(marker.info['fi_bottled_gas']);
    var kerosene = parseInt(marker.info['fi_kerosene']);
    if (electricity > 1) {
        imageName += 'green';
    } else if (gas == 1 || gas == 2) {
        imageName += 'blue';
    } else if (kerosene == 1 || kerosene == 2) {
        imageName += 'black';
    } else {
        imageName += 'red';
    }
    var reqs = marker.info[selections.schedule];
    // TODO: Incorporate not just 4 degree schedules
    if (reqs) {
        var perCapacity = parseFloat(reqs['Net Storage (Litres): Actual'])
                / parseFloat(reqs['Net Storage (Litres): Required']);
        var percent = Math.floor(perCapacity * 10) / 10 * 100;
        if (perCapacity > 1) {
            percent = 100;
            perCapacity = 1;
        }
        var fridges = marker.info.fridges;
        var total = 0;
        var elec = 0;
        if (fridges) {
            for (f in fridges) {
                var nrg = fridges[f]['ft_power_source'];
                var capacity = parseFloat(fridges[f]['fn_net_volume_4deg']);
                if (nrg == 'E') {
                    elec += capacity;
                }
                total += capacity;
            }
        }
        var red = 0;
        var green = 0;
        if (total == 0) {
            green = percent;
        } else {
            green = Math.floor(perCapacity * (elec / total) * 10) / 10 * 100;
            if (green > 100) {
                alert('percapacity=' + perCapacity + ', elec=' + elec
                        + ', total=' + total + ', reqs1='
                        + reqs['Net Storage (Litres): Actual']
                        + ', reqs2='
                        + reqs['Net Storage (Litres: Required']);
            }
            red = percent - green;
        }

    } else {
        percent = 0;
    }
    if (isNaN(percent)) {
        // alert('NaN, code=' + marker.info[i_facility_code] + ',' +
        // reqs[reqsIndex][0] + ',' + reqs[reqsIndex][1]+','+marker.info);
        imageName += '_0_100_0.png';
    } else {
        // border_green_white_red.png
        imageName += '_' + Math.floor(green) + '_' + Math.floor(100 - percent)
                + '_' + Math.floor(red) + '.png';
    }
    var zoom = map.getZoom();
    var factor = 40000 / (zoom / 7) / (zoom / 7) / (zoom / 7);
    var scale = marker.info['fi_tot_pop'] / factor;
    if (!selections.considerPop) {
        scale = (zoom - 7) * 6 + 6;
    } else if (marker.info['fi_tot_pop'] < factor * ((zoom - 7) * 5 + 5)) {
        scale = (zoom - 7) * 5 + 5;
    } else if (marker.info['fi_tot_pop'] > factor * ((zoom - 7) * 10 + 20)) {
        scale = (zoom - 7) * 10 + 20;
    }

    var image = new google.maps.MarkerImage(imageName, new google.maps.Size(
            scale, scale),
    // The origin for this image is 0,0.
    new google.maps.Point(0, 0), new google.maps.Point(scale / 2, scale / 2),
            new google.maps.Size(scale, scale));
    marker.setIcon(image);
}

/*
 * Sets up the info box listener to show up for a particular marker.
 */
function makeInfoBoxListener(marker) {
    return function() {
        var info = marker.info;
        var location = marker.position;
        var fridges = 'None';
        if (info.fridges) {
            fridges = '';
            for (i in info.fridges) {
                fridges += info.fridges[i]['ft_model_name'] + ",  ";
            }
            fridges = fridges.substring(0, fridges.length - 3);
        }
        var contentString = '<div id="popup-content">'
                + '<div id="siteDescription">'
                + info['ft_facility_name']
                + '</div>'
                + '<table>'
                + '<tr><td>Facility type</td><td>'
                + facilityTypeCodes[parseInt(info['ft_facility_type'])]
                + '</td></tr>'
                + '<tr><td>Electricity level</td><td>'
                + electricityCodes[parseInt(info['fi_electricity'])][0]
                + '</td></tr>'
                + '<tr><td>Kerosene</td><td>'
                + keroseneCodes[parseInt(info['fi_kerosene'])][0]
                + '</td></tr>'
                + '<tr><td>Gas</td><td>'
                + gasCodes[parseInt(info['fi_bottled_gas'])][0]
                + '</td></tr>'
                + '<tr><td>Stock-outs</td><td>'
                + stockOutCodes[parseInt(info['fn_stock_outs'])][0]
                + '</td></tr>'
                + '<tr><td>Base Surplus</td><td>'
                + surplusCodes[parseInt(info['base_schedule']['Surplus'])][0]
                + '</td></tr>'
                + '<tr><td>Population</td><td>'
                + info['fi_tot_pop']
                + '</td></tr>'
                + '<tr><td>Fridges</td><td>'
                + fridges
                + '</td></tr></table'
                + '</div>';
        infoWindow.content = contentString;
        infoWindow.open(map, marker);
    };
}

function computeHeight() {
    var content = $('#content').height();
    var header = $('#header').height();
    var footer = $('#footer').height();

    return Math.floor(content - header - footer);
}

function computeWidth() {
    var content = $('#content').width();
    var navBar = $('#nav-bar').width();

    return Math.floor(content - navBar);
}

function resize() {
    $('#map-canvas').height(computeHeight());
    $('#map-canvas').width(computeWidth());
    // $('#map-canvas').css('height', height + 'px');
    // $('#map-canvas').css('width', width + 'px');
}

$(window).resize(function() {
    resize();
});

/*
 * Returns a string version of the object for debugging
 * purposes. The string contains each field of the object
 * and its corresponding value.
 */
function getString(obj) {
    var res = '';
    for (f in obj) {
        res = res + ', ' + f + ': ' + obj[f];
    }
    return res;
}