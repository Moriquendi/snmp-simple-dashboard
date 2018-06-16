#!/usr/bin/env nodejs

var express = require('express');
var app = express();
var path = require('path');

// Tutaj mówimy co się stanie, gdy ktoś wejdzie na nasz adres.
// My przekazujemy plik basic.html, który wyświetli wykresy.
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/Chart.js/samples/charts/line/basic.html');
});

// Tutaj musimy powiedzieć że wszystko co jest w katalogu "public" jest
// dostępne (czyli ktos może wejść przez 167.99.244.194/public/.../basic.html i pobrać plik)
app.use(express.static(__dirname + '/public'));
console.log(__dirname + '/public');

// Aplikacja działa na porcie 8080
app.listen(8080);

console.log('Server running at http://localhost:8080/');




// Poniżej mamy kod, który regularnie pobiera dane z drugiego serwera
// i zapisuje je do pliku.

var snmp = require('snmp-native'); // For using SNMP protocol
var fs = require('fs'); // For writing to files

// Sesja do naszego drugiego komputera (ustawiliśmy SNMP na tamtym komputerze na port 161)
var session = new snmp.Session({ host: '178.62.34.44', port: 161 });


// Tutaj mamy timer, który jest odpalany co 1 sec
setInterval(function() {
  // Najpierw pobieramy informacje o dostępnej pamięci (identyfikator .1.3.6.1.4.1.2021.4.11.0)
  session.get({ oid: '.1.3.6.1.4.1.2021.4.11.0' }, function (error, varbinds) {
     if (error) {
          console.log('Fail :( ' +  error);
      } else {
          console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + varbinds[0].type + ')');
          // Zapisujemy pobraną informacje do pliku, w formacie [timestamp],[value]
         fs.appendFileSync('public/Chart.js/samples/charts/line/data.csv', Date.now() + ',' + varbinds[0].value + '\n');
      }
  });

  // To samo co wyżej tylko dla wolnego miejsca na dysku.
  session.get({ oid: '.1.3.6.1.4.1.2021.9.1.7.1' }, function (error, varbinds) {
     if (error) { console.log('Fail :( ' +  error); } else {
          console.log(varbinds[0].oid + ' = ' + varbinds[0].value + ' (' + varbinds[0].type + ')');
         fs.appendFileSync('public/Chart.js/samples/charts/line/disk_data.csv', Date.now() + ',' + varbinds[0].value + '\n');
      }
  });
}, 1000); // Every 1 seconds


// Drugi timer odpalany co 5 minut, który czyści oba pliki
// (po to żebyśmy nie zapchali przeglądarki milionami punktów do rysowania)
setInterval(function() {
  fs.writeFileSync("public/Chart.js/samples/charts/line/disk_data.csv", "");

  fs.writeFileSync("public/Chart.js/samples/charts/line/data.csv", "");
}, 300000); // Every 5 minutes
