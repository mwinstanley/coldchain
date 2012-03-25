$(document).ready(function() {
    requestHeader();
});

function requestHeader() {
    var urlVars = getUrlVars();
    var extraParam = '';
    if (urlVars['id'] && urlVars['id'].match(/^\d+$/)) {
        extraParam = '&id=' + urlVars['id'];
        document.cookie = 'id=' + escape(urlVars['id']);
    }
    $.ajax({
        type: 'GET',
        url: '/coldchaininfo',
        data: 'file=TBL_FACILITIES.csv' + extraParam,
        success: function(responseText) {
            $tr = $('<tr>');
            $('<th>').append('Field name').appendTo($tr);
            $('<th>').append('Rename field').appendTo($tr);
            $('<th>').append('Include in map?').appendTo($tr);
            $('<th>').append('Type of field').appendTo($tr);
            $('#checkboxes').append($tr);
            var parts = responseText.split('\t');
            var header = parts[0].split(',');
            console.log('useroptions = ' + parts[1]);
            var options = parts[1] ? JSON.parse(parts[1]) : null;
            for (var i = 0; i < header.length; i++) {
                $tr = $('<tr>');
                $('<td>').append('<p>' + header[i] + '</p>').appendTo($tr);
                $('<td>').append( $('<input>', {
                    type: 'text',
                    val: options != null && options[header[i]] ? options[header[i]].name : header[i],
                    name: header[i],
                    'class': 'text'
                })).appendTo($tr);
                $checkbox =  $('<input>', {
                    type: 'checkbox',
                    val: options != null && options[header[i]] ? options[header[i]].name : header[i],
                    name: header[i],
                    'class': 'check'
                });
                if (options != null && options[header[i]]) {
                    $checkbox.attr('checked','checked');
                }
                $('<td>').append($checkbox).appendTo($tr);
                $select = $('<select>', {
                    name: header[i] + '_type'
                });
                var typeOptions = ['Discrete', 'Continuous', 'Unique'];
                $.each(typeOptions, function(val, text) {
                    $select.append(
                            $('<option></option>').val(val).html(text)
                    );
                });
                $select.val(options != null && options[header[i]] ? options[header[i]].type : 0);
                $('<td>').append($select).appendTo($tr);
                $('#checkboxes').append($tr);
            }
            $tr = $('<tr>');
            $button =  $('<input>', {
                type: 'button',
                val: 'Submit',
                name: 'Submit',
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
                })
                console.log(table);
                makeRequest(makeData(table, null));
            });
            $('<td>').append($button).appendTo($tr);
            $buttonUpdate =  $('<input>', {
                type: 'button',
                val: 'Update',
                name: 'Update',
                'class': 'btn',
            });
            $buttonUpdate.click(function() {
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
                })
                console.log(table);
                makeRequest(makeData(table, getCookie('id')));
            });
            $('<td>').append($buttonUpdate).appendTo($tr);
            $('#checkboxes').append($tr);
        }
    });
}

function addCell(value) {
    $('#checkboxes').append($('<td>')).append(value);
    //$('#checkboxes').append('</td>');
}

function makeData(table, id) {
    var res = 'val=';
    for (var i = 0; i < table.length; i++) {
        // DEAL W/COMMAS IN USER-ENTERED FIELD
        res += '{' + table[i].field + ',' + table[i].name + ',' + table[i].type + '}';
    }
    if (id != null) {
        res = 'id=' + id + "&" + res;
    } 
    return res;
}

function makeRequest(table) {
    console.log(table);
    $.ajax({
        type: "POST",
        url: "/coldchaininfo",
        data: table,
        success: function(responseText) {
            console.log(responseText);
            $('#checkboxes').append('<p>' + responseText + '</p>');
            document.cookie = 'id=' + escape(responseText);
        }
    });
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