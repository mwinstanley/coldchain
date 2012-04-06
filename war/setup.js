var updateButton = false;

$(document).ready(function() {
    $('#tabs div').hide();
    $('#tabs div:first').show();
    $('#tabs ul li:first').addClass('active');

    $('#tabs ul li a').click(function(){
        $('#tabs ul li').removeClass('active');
        $(this).parent().addClass('active');
        var currentTab = $(this).attr('href');
        $('#tabs div').hide();
        $(currentTab).show();
        return false;
    });
    
    requestUserOptions();
});

function requestHeader(userOptions, id) {
    $.ajax({
        type: 'GET',
        url: '/coldchain',
        data: 'type=h&' + id,
        success: function(responseText) {
            console.log(userOptions);
            var options = userOptions ? JSON.parse(userOptions) : null;
            setUpFileTab(options);
            setUpTable(responseText, options);
            setUpValueSelectors(options);
        }
    });
}
    
function requestUserOptions() {
    var urlVars = getUrlVars();
    var id = null;
    if (urlVars['id'] && urlVars['id'].match(/^\d+$/)) {
        id = 'id=' + urlVars['id'];
        document.cookie = 'id=' + escape(urlVars['id']);
    }
    if (id != null) {
        $.ajax({
            type: 'GET',
            url: '/coldchaininfo',
            data: id,
            success: function(responseText) {
                requestHeader(responseText, id);
            }
        });
    } else {
        setUpFileTab(null);
    }
}


//--------------- TAB SET UP -------------------------
function setUpFileTab(options) {
    var $table = $('<table>');
    var $thead = $('<thead>');
    var $tr = $('<tr>');
    $('<th>').append('Type of file').appendTo($tr);
    $('<th>').append('File name').appendTo($tr);
    $('<th>').append('Join on this column from the main file').appendTo($tr);
    $('<th>').append('Join on this column from the secondary file').appendTo($tr);
    
    $thead.append($tr);
    $table.append($thead);
    
    var $tbody = $('<tbody>');
    var hasData = options != null;
    var fileTypes = ['Main facility data', 'Refrigerator data', 'Schedule data'];
    for (var i = 0; i < fileTypes.length; i++) {
        $tr = $('<tr>');
        $('<td>').append('<p>' + fileTypes[i] + '</p>').appendTo($tr);
        $('<td>').append( $('<input>', {
            type: 'text',
            val: hasData ? options.files[i].name : '',
            'class': 'text'
        })).appendTo($tr);
        if (i != 0) {
            $('<td>').append( $('<input>', {
                type: 'text',
                val: hasData ? options.files[i].main : '',
                    'class': 'text'
            })).appendTo($tr);
            $('<td>').append( $('<input>', {
                type: 'text',
                val: hasData ? options.files[i].secondary : '',
                        'class': 'text'
            })).appendTo($tr);
        }
        $tbody.append($tr);
    }
    $table.append($tbody);
    $('#files').append($table);
    var $button = makeSubmitButtonFiles('Submit', false);
    $('#files').append($button);
    if (options != null) {
        var $buttonUpdate = makeSubmitButtonFiles('Update', true);
        $('#files').append($buttonUpdate);
    }
}

function setUpTable(header, options) {
    var $table = $('<table>');
    var $thead = $('<thead>');
    var $tr = $('<tr>');
    $('<th>').append('Field name').appendTo($tr);
    $('<th>').append('Rename field').appendTo($tr);
    $('<th>').append('Include in map?').appendTo($tr);
    $('<th>').append('Type of field').appendTo($tr);
    
    $thead.append($tr);
    $table.append($thead);
    
    var $tbody = $('<tbody>');
    var header = header.split(',');
    var fields = options == null ? null : options["fields"];
    var num = 0;
    for (var i = 0; i < header.length; i++) {
        var found = fields != null && num < fields.length && fields[num]["id"] == header[i];
        $tr = $('<tr>');
        $('<td>').append('<p>' + header[i] + '</p>').appendTo($tr);
        $('<td>').append( $('<input>', {
            type: 'text',
            val: found ? fields[num]["name"] : header[i],
            name: header[i],
            'class': 'text'
        })).appendTo($tr);
        var $checkbox =  $('<input>', {
            type: 'checkbox',
            val: found ? fields[num]["name"] : header[i],
            name: header[i],
            'class': 'check'
        });
        if (found) {
            $checkbox.attr('checked','checked');
            updateButton = true;
        }
        $('<td>').append($checkbox).appendTo($tr);
        var $select = $('<select>', {
            name: header[i] + '_type'
        });
        var typeOptions = ['Discrete', 'Continuous', 'Unique', 'String'];
        $.each(typeOptions, function(val, text) {
            $select.append(
                    $('<option></option>').val(text.toUpperCase()).html(text)
            );
        });
        $select.val(found ? fields[num]["fieldType"] : 0);
        $('<td>').append($select).appendTo($tr);
        $tbody.append($tr);
        if (found) {
            num++;
        }
    }
    $table.append($tbody);
    $('#fields').append($table);
    var $button = makeSubmitButtonFields('Submit', null);
    $('#fields').append($button);
    if (options != null) {
        var $buttonUpdate = makeSubmitButtonFields('Update', true);
        $('#fields').append($buttonUpdate);
    }
}

function setUpValueSelectors(options) {
    // set up headers
    $('#instructions').append('<p>Select how to display your data. Colors are only applicable for mapping data. Possible ' +
                        'colors are blue, green, orange, red, white, and yellow.</p>');
    
    var $table = $('<table>');
    var $thead = $('<thead>');
    
    var $tr = $('<tr>');
    $('<th>').append('Field name').appendTo($tr);
    $('<th>').append('Type of field').appendTo($tr);
    $('<th>').append('Include in facility info box').appendTo($tr);
    $('<th>').append('Display type of field').appendTo($tr);
    $('<th>').append('Possible values (comma separated)').appendTo($tr);
    $('<th>').append('Names of values (comma separated, in order)').appendTo($tr);
    $('<th>').append('Value colors (comma separated, in order)').appendTo($tr);
    $thead.append($tr);
    $table.append($thead);
    
    var $tbody = $('<tbody>');
    var fields = options == null ? null : options["fields"];
    if (fields == null) {
        return;
    }
    for (var i = 0; i < fields.length; i++) {
        
        //var found = fields != null && num < fields.length && fields[num]["id"] == header[i];
        $tr = $('<tr>');
        $('<td>').append('<p>' + fields[i]['id'] + '</p>').appendTo($tr);
        
        $('<td>').append('<p>' + fields[i]['fieldType'] + '</p>').appendTo($tr);
        
        var $checkbox =  $('<input>', {
            type: 'checkbox',
            val: 'show_in_box',
            name: 'show_in_box',
            'class': 'check'
        });
        if (fields[i].inInfoBox) {
            $checkbox.attr('checked','checked');
        }
        $('<td>').append($checkbox).appendTo($tr);
        
        var $select = $('<select>', {
            name: 'display_type'
        });
        var typeOptions = ['None', 'Map', 'Filter', 'Size', 'UTMLat', 'UTMLon'];
        $.each(typeOptions, function(val, text) {
            $select.append(
                    $('<option></option>').val(text.toUpperCase()).html(text)
            );
        });
        $select.val('NONE');
        if (fields[i].displayType) {
            $select.val(fields[i].displayType);
        }
        $('<td>').append($select).appendTo($tr);
        
        var colors = '';
        var ids = '';
        var names = '';
        for (j = 0; j < fields[i].values.length; j++) {
            if (j != 0) {
                names += ',';
                ids += ',';
            }
            var vals = fields[i].values[j];
            if (vals.color) {
                colors += (j != 0 ? ',' : '') + vals.color;
            }
            ids += vals.id;
            names += vals.name;
        }
        
        
        $('<td>').append( $('<input>', {
            type: 'text',
            val: ids,
            name: fields[i]['id'] + '_id',
            'class': 'text'
        })).appendTo($tr);
        
        $('<td>').append( $('<input>', {
            type: 'text',
            val: names,
            name: fields[i]['id'] + '_name',
            'class': 'text'
        })).appendTo($tr);
        
        $('<td>').append( $('<input>', {
            type: 'text',
            val: colors,
            name: fields[i]['id'] + '_color',
            'class': 'text'
        })).appendTo($tr);
        
        $tbody.append($tr);
        console.log('Appended another row to value tab');
    }
    $table.append($tbody);
    $('#values').append($table);
    var $button = makeSubmitButtonValues();
    $('#values').append($button);
}

function makeSubmitButtonFiles(text, id) {
    var $button =  $('<input>', {
        type: 'button',
        val: text,
        name: text,
        'class': 'btn',
    });
    $button.click(function() {
        var table = $('#files tbody tr').map(function() {
            var $row = $(this);
            var res = {file: $row.find(':nth-child(2)').find('input').val(),
                       joinMain: $row.find(':nth-child(3)').find('input').val(),
                       joinSecondary: $row.find(':nth-child(4)').find('input').val()
                 };
            return res;
        });
        var cookieID = id ? getCookie('id') : null;
        makeRequest(makeFileData(table, cookieID), id);
    });
    return $button;
}

function makeSubmitButtonFields(text, id) {
    var $button =  $('<input>', {
        type: 'button',
        val: text,
        name: text,
        'class': 'btn',
    });
    $button.click(function() {
        var table = $('#fields tbody tr').map(function() {
            var $row = $(this);
            var res;
            if ($row.find(':nth-child(3)').find('input').is(':checked')) {
                res = {field: $row.find(':nth-child(1)').find('p').text(),
                        name: $row.find(':nth-child(2)').find('input').val(),
                        type: $row.find(':nth-child(4)').find('select').val()
                 };
            } else {
                res = null;
            }
            return res;
        });
        table = table.filter(function(val) {
            return val != null;
        });
        console.log(table);
        var cookieID = id ? getCookie('id') : null;
        makeRequest(makeFieldData(table, cookieID), id);
    });
    return $button;
}

function makeSubmitButtonValues() {
    var $button =  $('<input>', {
        type: 'button',
        val: 'Update Values',
        name: 'update-values',
        'class': 'btn',
    });
    $button.click(function() {
        var table = $('#values tbody tr').map(function() {
            var $row = $(this);
            var res = {id: $row.find(':nth-child(1)').find('p').text(),
                       displayType: $row.find(':nth-child(4)').find('select').val(),
                       values: $row.find(':nth-child(5)').find('input').val(),
                       names: $row.find(':nth-child(6)').find('input').val(),
                       colors: $row.find(':nth-child(7)').find('input').val(),
                       inInfoBox: $row.find(':nth-child(3)').find('input').is(':checked') ? 'true' : 'false'
            };
            return res;
        });
        var cookieID = getCookie('id');
        if (cookieID != null) {
            makeRequest(makeValuesData(table, cookieID), true);
        }
    });
    return $button;
}

function addCell(value) {
    $('#fields').append($('<td>')).append(value);
    //$('#fields').append('</td>');
}

function makeFileData(table, id) {
    console.log(table);
    var res = 'data=[';
    for (var i = 0; i < table.length; i++) {
        if (i != 0) {
            res += ', ';
        }
        res += '{ "file": "' + table[i].file + '", ' +
               '"joinMain": "' + table[i].joinMain + '", ' +
               '"joinSecondary": "' + table[i].joinSecondary + '" }';
    }
    res += ']';
    if (id != null) {
        res = 'id=' + id + "&" + res;
    }
    res = 'type=s&' + res;
    return res;
}

function makeValuesData(table, id) {
    console.log(table);
    var res = 'data=[';
    for (var i = 0; i < table.length; i++) {
        // DEAL W/COMMAS IN USER-ENTERED FIELD
        if (i != 0) {
            res += ', ';
        }
        res += '{ "id": "' + table[i].id + '", ' +
                 '"displayType": "' + table[i].displayType + '", ' +
                 '"inInfoBox": "' + table[i].inInfoBox + '"';
        var valSplit = table[i].values != undefined && table[i].values.length != 0 ?
                            table[i].values.split(',') : null;
        var colSplit = table[i].colors != undefined && table[i].colors.length != 0 ?
                            table[i].colors.split(',') : null;
        var namSplit = table[i].names != undefined && table[i].names.length != 0 ?
                            table[i].names.split(',') : null;
        if (valSplit != null) {
            res += ', "values": [';
            for (var j = 0; j < valSplit.length; j++) {
                if (j != 0) {
                    res += ',';
                }
                res += '{"id": "' + (valSplit ? valSplit[j] : '') + '", ' +
                       '"name": "' + (namSplit ? namSplit[j] : '') + '", ' +
                       '"color": "' + (colSplit ? colSplit[j] : '') + '"}';
            }
            res += ']';
        }
        res += ' }';
    }
    res += ']';
    res = 'id=' + id + "&" + res;
    res = 'type=v&' + res;
    return res;
}

function makeFieldData(table, id) {
    var res = 'data=[';
    for (var i = 0; i < table.length; i++) {
        // DEAL W/COMMAS IN USER-ENTERED FIELD
        if (i != 0) {
            res += ', ';
        }
        res += '{ "id": "' + table[i].field + '", ' +
                 '"name": "' + table[i].name + '", ' +
                 '"fieldType": "' + table[i].type + '" }';
    }
    res += ']';
    if (id != null) {
        res = 'id=' + id + "&" + res;
    }
    res = 'type=f&' + res;
    return res;
}

function makeRequest(table, update) {
    console.log(table);
    $.ajax({
        type: (update ? "POST" : "PUT"),
        url: "/coldchaininfo",
        data: table,
        success: function(responseText) {
            console.log(responseText);
            if (!update && !updateButton) {
                $tr = $('<tr>');
                $button = makeSubmitButtonFields('Update', getCookie('id'));
                $('<td>').append($button).appendTo($tr);
                $('#fields').append($tr);
            }
            $('#your_id').empty();
            $('#your_id').append('<p>Your user ID is ' + responseText + '</p>');
            document.cookie = 'id=' + escape(responseText);
            console.log(getCookie('id'));
            scrollTo(0,0);
        }
    });
}
