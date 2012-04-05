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
    requestHeader();
});

function requestHeader() {
    $.ajax({
        type: 'GET',
        url: '/coldchain',
        data: 'file=TBL_FACILITIES.csv&type=h',
        success: function(responseText) {
            requestUserOptions(responseText);
        }
    });
}
    
function requestUserOptions(headers) {
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
                setUpTable(headers, responseText);
                setUpValueSelectors(responseText);
            }
        });
    } else {
        setUpTable(headers, null)
    }
}

function setUpTable(header, userOptions) {
    $tr = $('<tr>');
    $('<th>').append('Field name').appendTo($tr);
    $('<th>').append('Rename field').appendTo($tr);
    $('<th>').append('Include in map?').appendTo($tr);
    $('<th>').append('Type of field').appendTo($tr);
    $('#checkboxes').append($tr);
    var header = header.split(',');
    console.log('useroptions = ' + userOptions);
    var options = userOptions ? JSON.parse(userOptions) : null;
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
        $checkbox =  $('<input>', {
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
        $select = $('<select>', {
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
        $('#checkboxes').append($tr);
        if (found) {
            num++;
        }
    }
    $tr = $('<tr>');
    $button = makeSubmitButtonFields('Submit', null);
    $('<td>').append($button).appendTo($tr);
    if (options != null) {
        $buttonUpdate = makeSubmitButtonFields('Update', true);
        $('<td>').append($buttonUpdate).appendTo($tr);
    }
    $('#checkboxes').append($tr);
}

function makeSubmitButtonFields(text, id) {
    $button =  $('<input>', {
        type: 'button',
        val: text,
        name: text,
        'class': 'btn',
    });
    $button.click(function() {
        var table = $('#checkboxes tr').map(function() {
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
    $button =  $('<input>', {
        type: 'button',
        val: 'Update Values',
        name: 'update-values',
        'class': 'btn',
    });
    $button.click(function() {
        var table = $('#tab-2 tr').map(function() {
            var $row = $(this);
            var res = {id: $row.find(':nth-child(1)').find('p').text(),
                       displayType: $row.find(':nth-child(3)').find('select').val(),
                       values: $row.find(':nth-child(4)').find('input').val(),
                       names: $row.find(':nth-child(5)').find('input').val(),
                       colors: $row.find(':nth-child(6)').find('input').val()
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
    $('#checkboxes').append($('<td>')).append(value);
    //$('#checkboxes').append('</td>');
}

function makeValuesData(table, id) {
    console.log(table);
    var res = 'data=[';
    // omit index 0 - which is the header
    for (var i = 1; i < table.length; i++) {
        // DEAL W/COMMAS IN USER-ENTERED FIELD
        if (i != 1) {
            res += ', ';
        }
        res += '{ "id": "' + table[i].id + '", ' +
                 '"displayType": "' + table[i].displayType + '"';
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
                $('#checkboxes').append($tr);
            }
            $('#your_id').empty();
            $('#your_id').append('<p>Your user ID is ' + responseText + '</p>');
            document.cookie = 'id=' + escape(responseText);
            console.log(getCookie('id'));
            scrollTo(0,0);
        }
    });
}

function setUpValueSelectors(userOptions) {
    // set up headers
    $('#tab-2').append('<p>Select how to display your data. Colors are only applicable for mapping data. Possible ' +
                        'colors are blue, green, orange, red, white, and yellow.</p>');
    
    $tr = $('<tr>');
    $('<th>').append('Field name').appendTo($tr);
    $('<th>').append('Type of field').appendTo($tr);
    $('<th>').append('Display type of field').appendTo($tr);
    $('<th>').append('Possible values (comma separated)').appendTo($tr);
    $('<th>').append('Names of values (comma separated, in order)').appendTo($tr);
    $('<th>').append('Value colors (comma separated, in order)').appendTo($tr);
    $('#tab-2').append($tr);
    
    var options = userOptions ? JSON.parse(userOptions) : null;
    var fields = options == null ? null : options["fields"];
    for (var i = 0; i < fields.length; i++) {
        
        //var found = fields != null && num < fields.length && fields[num]["id"] == header[i];
        $tr = $('<tr>');
        $('<td>').append('<p>' + fields[i]["id"] + '</p>').appendTo($tr);
        
        $('<td>').append('<p>' + fields[i]["fieldType"] + '</p>').appendTo($tr);
        
        $select = $('<select>', {
            name: 'display_type'
        });
        var typeOptions = ['Map', 'Filter', 'Size', 'None'];
        $.each(typeOptions, function(val, text) {
            $select.append(
                    $('<option></option>').val(text.toUpperCase()).html(text)
            );
        });
        $select.val('MAP');
        $('<td>').append($select).appendTo($tr);
        
        $('<td>').append( $('<input>', {
            type: 'text',
            val: 'enter here',
            name: fields[i]['id'] + '_id',
            'class': 'text'
        })).appendTo($tr);
        
        $('<td>').append( $('<input>', {
            type: 'text',
            val: 'enter here',
            name: fields[i]['id'] + '_name',
            'class': 'text'
        })).appendTo($tr);
        
        $('<td>').append( $('<input>', {
            type: 'text',
            val: 'enter here',
            name: fields[i]['id'] + '_color',
            'class': 'text'
        })).appendTo($tr);
        
        $('#tab-2').append($tr);
        console.log('Appended another row to value tab');
    }
    $button = makeSubmitButtonValues();
    $('#tab-2').append($button);
}

//Read a page's GET URL variables and return them as an associative array.
function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function getCookie(c_name)
{
var i,x,y,ARRcookies=document.cookie.split(";");
for (i=0;i<ARRcookies.length;i++)
{
  x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
  y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
  x=x.replace(/^\s+|\s+$/g,"");
  if (x==c_name)
    {
    return unescape(y);
    }
  }
}