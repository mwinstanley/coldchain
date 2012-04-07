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

var userOptions;

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
            requestData();
            
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

function requestData() {
    $.ajax({
        type: "GET",
        url: "/coldchain",
        data: "type=d&id=" + getCookie('id'),
        success: function(responseText) {
            console.log(responseText);
            var json = JSON.parse(responseText);
            userOptions = json.options;
            parseUserOptions(userOptions);
            var data = json.facilities;
            for (var i = 0; i < data.length; i++) {
                var lat = data[i][userOptions.lat];
                var lon = data[i][userOptions.lon];
                if (parseFloat(lon) < 32) {
                    console.log("ERROR");
                }
                if (lat != null && lon != null) {
                    addMarker(new google.maps.LatLng(parseFloat(lat), parseFloat(lon)), data[i]);
                }
            }
            setUpUI();
            resize();
            showCategory(selections.category);
        }
    });
}

function parseUserOptions(options) {
    options.map = [];
    options.filter = [];
    options.infoBox = [];
    options.size = [];
    for (var i = 0; i < options.fields.length; i++) {
        var field = options.fields[i];
        var id = field.id;
        var display = field.displayType;
        if (display == 'MAP') {
            options.map.push(id);
        } else if (display == 'FILTER') {
            options.filter.push(id);
        } else if (display == 'SIZE') {
            options.size.push(id);
        } else if (display == 'UTMLAT') {
            options.lat = id;
        } else if (display == 'UTMLON') {
            options.lon = id;
        }
        if (field.inInfoBox) {
            console.log('Adding ' + id + ' to info box');
            options.infoBox.push(id);
        }
        var vals = {};
        for (var j = 0; j < field.values.length; j++) {
            var val = field.values[j];
            vals[val.id] = val;
        }
        field.values = vals;
        options[id] = field;
    }
    options.fields = null;
}

function addElement(element, name) {
    $tr = $('<tr>');
    $('<td>').append('<p>' + name + '</p>').append(element).appendTo($tr);
    $('#nav-bar table').append($tr);
}

function addDropBoxOptions(box, id, options, func) {
    var $select = $('<select>', {
        name: box
    });
    $.each(options, function(val, text) {
        $select.append(
                $('<option></option>').val(val).html(text)
        );
    });
    $select.change(function() {
        console.log($select.val());
        func(id, $select.val());
    });
    addElement($select, box);
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
                setImage(marker, marker.info[category], category);
            }
            var include = true;
            for (var i = 0; i < userOptions.filter.length; i++) {
                var curFilter = userOptions.filter[i];
                include = include && (selections[curFilter] == null ||
                                      selections[curFilter].length == 0 ||
                                      marker.info[curFilter] == selections[curFilter]);
            }
            if (include) {
                marker.setMap(map);
            } else {
                marker.setMap(null);
            }
            
        }
    }
    showKey(category);
}

function applyFilter(filter, value) {
    console.log('filter = ' + filter + ', value = ' + value);
    selections[filter] = value;
    if (markers) {
        for (m in markers) {
            var marker = markers[m];
            var include = value == '' || marker.info[filter] == value;
            for (var i = 0; i < userOptions.filter.length; i++) {
                var curFilter = userOptions.filter[i];
                include = include && (selections[curFilter] == null ||
                                      selections[curFilter].length == 0 ||
                                      marker.info[curFilter] == selections[curFilter]);
            }
            if (include) {
                marker.setMap(map);
            } else {
                marker.setMap(null);
            }
        }
    }
}

function alterSize(sizing, field) {
    
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
    
    // TODO: Allow changes to center of map.
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

    // Set up mapping.
    var categories = {};
    for (var i = 0; i < userOptions.map.length; i++) {
        var mapCategory = userOptions.map[i];
        if (!selections.category) {
            selections.category = mapCategory;
        }
        console.log(userOptions);
        categories[mapCategory] = userOptions[mapCategory].name;
    }
    addDropBoxOptions('Category', 'category', categories, function(type, category) {
        showCategory(category);
        showKey(category);
    });

    // Set up filters.
    for (var i = 0; i < userOptions.filter.length; i++) {
        var filter = userOptions.filter[i];
        var name = userOptions[filter].name;
        var types = {'': 'None'};
        for (v in userOptions[filter].values) {
            types[v] = userOptions[filter].values[v].name;
        }
        addDropBoxOptions(name, filter, types, applyFilter);
    }
    
    /*var types2 = {
            'all' : 'All',
            'national-regional' : 'National/Regional',
            'district' : 'District',
            'health-center' : 'Health Center',
            'health-post' : 'Health Post',
            'other' : 'Other'
    };
    addDropBoxOptions('#facility-type', types2, showTypes);
*/
    // Set up regions
  
  //  addDropBoxOptions('#region', regions, showOneRegion);

    // Set up size options
    var sizes = {};
    for (var i = 0; i < userOptions.size.length; i++) {
        var size = userOptions.size[i];
        if (!selections.size) {
            selections.size = size;
        }
        sizes[size] = userOptions[size].name;
    }
    addDropBoxOptions('Size', 'size', sizes, alterSize);
    
    $button =  $('<input>', {
        type: 'button',
        val: 'Consider Size',
        name: 'update-size',
        'class': 'btn',
    });
    $button.click(function() {
        if (selections.considerSize) {
            $button.html('Consider size');
        } else {
            $button.html('Ignore size');
        }
        selections.considerSize = !selections.considerSize;
        showCategory(selections.category);
    });
    addElement($button, 'Sizing');
    

    // Set up vaccine schedules
    /*var schedule = {
        'base_schedule' : 'Base',
        'pcv_schedule' : 'Pneumo.',
        'rota_schedule' : 'Pneumo. + Rota'
    };
    selections.schedule = 'base_schedule';
    addDropBoxOptions('#schedule', schedule, showSchedule);*/
}

// ------------------ KEY ----------------------------------------
/*
 * Display the key based on the current type of information being displayed.
 */
function showKey(type) {
    var panelText = '<table><tr><td>(KEY) ' + userOptions[type].name + ':</td>';
    var values = userOptions[type].values;
    for (v in values) {
        var color = values[v].color;
        var name = values[v].name;
        panelText += '<td><img src="images/' + color + '.png" width="15px" height="15px"/> ' + name + '</td>'
    }
    panelText += '</tr></table>';

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
    // TODO: how to make markers so they aren't cut off, without using "optimized"
    var marker = new google.maps.Marker({
        position : location,
        map : map,
        optimized : false
    });
    marker.info = info;

    // Marker starts out displaying electrictiy information
    //setImage(marker, parseInt(info['fi_electricity']), 'fi_electricity');

    var listener = makeInfoBoxListener(marker);
    google.maps.event.addListener(marker, 'click', listener);
    // google.maps.event.addListener(marker, 'mouseover', listener);
    return marker;
}

/*
 * Set the image of the given marker to represent the given category's value.
 */
function setImage(marker, value, category) {
    var attrs = userOptions[category].values[value];
    var imageName;
    if (attrs) {
        imageName = attrs.color;
    } else {
        imageName = 'white';
    }
    var zoom = map.getZoom();
    var factor = 40000 / (zoom / 7) / (zoom / 7) / (zoom / 7);
    var scale = marker.info['fi_tot_pop'] / factor;
    if (!selections.considerSize) {
        scale = (zoom - 7) * 3 + 6;
    } else if (marker.info[selections.size] < factor * ((zoom - 7) * 3 + 3)) {
        scale = (zoom - 7) * 3 + 3;
    } else if (marker.info[selections.size] > factor * ((zoom - 7) * 8 + 15)) {
        scale = (zoom - 7) * 8 + 15;
    }

    imageName = 'images/' + imageName + '.png';
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
        var contentString = '<div id="popup-content"><table>';
        for (var i = 0; i < userOptions.infoBox.length; i++) {
            var infoBoxField = userOptions.infoBox[i];
            var name = userOptions[infoBoxField].name;
            var infoPoint = info[infoBoxField];
            var value = userOptions[infoBoxField].values[infoPoint] ?
                    userOptions[infoBoxField].values[infoPoint].name : infoPoint;
            contentString += '<tr><td>' + name + '</td><td>' + value + '</td></tr>';
        }
        contentString += '</table></div>';
        
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