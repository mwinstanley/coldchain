$(document).ready(function() {
    requestHeader();
});

function requestHeader() {
    $.ajax({
        type: 'GET',
        url: '/coldchaininfo',
        data: 'file=TBL_FACILITIES.csv',
        success: function(responseText) {
            $tr = $('<tr>');
            $('<th>').append('Field name').appendTo($tr);
            $('<th>').append('Rename field').appendTo($tr);
            $('<th>').append('Include in map?').appendTo($tr);
            $('<th>').append('Type of field').appendTo($tr);
            $('#checkboxes').append($tr);
            var header = responseText.split(',');
            for (var i = 0; i < header.length; i++) {
                var $text = $('<input/>').attr({ type: 'text', name: header[i], value: header[i]}).addClass('text');
                var $ctrl = $('<input/>').attr({ type: 'checkbox', name: header[i], value: [i]}).addClass('chk');
                $tr = $('<tr>');
                $('<td>').append('<p>' + header[i] + '</p>').appendTo($tr);
                $('<td>').append( $('<input>', {
                    type: 'text',
                    val: header[i],
                    name: header[i],
                    'class': 'text'
                })).appendTo($tr);
                $('<td>').append( $('<input>', {
                    type: 'checkbox',
                    val: header[i],
                    name: header[i],
                    'class': 'check'
                })).appendTo($tr);
                $select = $('<select>', {
                    name: header[i] + '_type'
                });
                options = ['Discrete', 'Continuous', 'Unique'];
                $.each(options, function(val, text) {
                    $select.append(
                            $('<option></option>').val(val).html(text)
                    );
                });
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
                makeRequest(makeData(table));
            });
            $('<td>').append($button).appendTo($tr);
            $('#checkboxes').append($tr);
        }
    });
}

function addCell(value) {
    $('#checkboxes').append($('<td>')).append(value);
    //$('#checkboxes').append('</td>');
}

function makeData(table) {
    var res = "";
    for (var i = 0; i < table.length; i++) {
        // DEAL W/COMMAS IN USER-ENTERED FIELD
        res += '{' + table[i].field + ',' + table[i].name + ',' + table[i].type + '}';
    }
    return res;
}

function makeRequest(table) {
    console.log(table);
    $.ajax({
        type: "POST",
        url: "/coldchaininfo",
        data: table,
        processData: false,
        success: function(responseText) {
            $('<body>').append('<p>' + responseText + '</p>');
        }
    });
}