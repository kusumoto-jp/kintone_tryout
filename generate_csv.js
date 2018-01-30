(function() {
    'use strict';
    const appId = 9;
    const viewName = '出力用一覧（当月&出力済除外）';

    kintone.events.on('app.record.index.show', function (event) {
        if (event.viewName === viewName) {
            var records = event.records;
            var csvButton;
            var csv = [];

            //ボタンの有無をチェック
            if (!csvButton) {
                setBtn();
                csvButton.addEventListener('click', toClick);
            }

            //ボタンエレメントの生成
            function setBtn() {
                var spaceEl = kintone.app.getHeaderMenuSpaceElement();
                var text = document.createTextNode('CSVファイル出力');
                csvButton = document.createElement('button');
                csvButton.appendChild(text);
                spaceEl.appendChild(csvButton);
            }

            function toClick() {
                alert('CSVを出力します');
                getMakeCsv();
                downloadFile(csv);
            }

            function getMakeCsv() {
                // フィールドコード
                var taxAccountantCheck, tax, csvOutput, paymentDueDate, name, expences, date, content, price = "";

                //現在のレコード情報を取得
                csv += ['税理士チェック', '税金', 'CSV出力', '支払い予定日', '氏名', '費目', '日付', '内容', '金額', '\n'];
                for (var i = 0; i < records.length; i++) {
                    taxAccountantCheck = records[i]['tax_accountant_check']['value'];
                    tax = records[i]['tax']['value'];
                    csvOutput = records[i]['csv_output']['value'];
                    paymentDueDate = records[i]['payment_due_date']['value'];
                    name = records[i]['name']['value'];
                    expences = records[i]['expences']['value'];
                    date = records[i]['date']['value'];
                    content = records[i]['content']['value'];
                    price = records[i]['price']['value'];

                    if(taxAccountantCheck.length > 0 && date < beginningOfMonth() && csvOutput.length <= 0) {
                        csv += taxAccountantCheck + ',' + tax + ',' + csvOutput + ',' + paymentDueDate + ',' + name + ',' + expences + ',' + date + ',' + content + ',' + price + ',' + '\n';
                        checkAsDownloaded(records[i]['$id'].value);
                    }
                }
            }

            function beginningOfMonth() {
                var checkDate = new Date();
                checkDate.setDate(1);
                var y = checkDate.getFullYear();
                var m = ("00" + (checkDate.getMonth()+1)).slice(-2);
                var d = ("00" + checkDate.getDate()).slice(-2);
                checkDate = y + "-" + m + "-" + d;
                return checkDate;
            }

            function downloadFile(csv) {
                var filename = 'expences' + '.csv';
                var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
                var blob = new Blob([bom, csv], {type: 'text/csv'});

                if (window.navigator.msSaveBlob) {
                    window.navigator.msSaveBlob(blob, filename);
                } else {
                    var url = (window.URL || window.webkitURL);
                    var blobUrl = url.createObjectURL(blob);
                    var e = document.createEvent('MouseEvents');
                    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                    var a = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
                    a.href = blobUrl;
                    a.download = filename;
                    a.dispatchEvent(e);
                }
            }

            function checkAsDownloaded(recordId) {
                kintone.api(
                    kintone.api.url('/k/v1/records', true),
                    'GET', {
                        app: appId,
                        query: "csv_output not in (\"済\")"
                    },
                    function(response) {
                        var records = response.records;
                        updateRecords(createPutRecords(records, recordId));
                    }
                );
            }

            function createPutRecords(records, recordId) {
                var putRecords = [];
                for(var i = 0; i < records.length; i++) {
                    var record = records[i];
                    var csvCheck = recordId === record['$id'].value ? ['済'] : []
                    putRecords[i] = {
                        id: record['$id'].value,
                        record: {
                            csv_output: {
                                value: csvCheck
                            }
                        }
                    };
                }
                return putRecords;
            }

            function updateRecords(records) {
                kintone.api(
                    kintone.api.url('/k/v1/records', true),
                    'PUT', {
                        app: appId,
                        records: records
                    },
                    function(response) {
                        alert('更新が完了しました');
                    }
                );
            }
        }
    });
})();