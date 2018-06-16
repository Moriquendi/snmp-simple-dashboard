# Simple Network Management Protocol - Dokumentacja Projektu

Nazwa projektu: Web application for monitoring Linux OS resources (CPU, RAM, disk space, disk utilization) using SNMP agents

Technologia: HTML, JS, Digital Ocean server

Autorzy: Maciej Łobodziński, Michał Śmiałko

Data: 16/06/2018

Kierunek: Informatyka IV Niestacjonarne

Projekt na Githubie: https://github.com/Moriquendi/snmp-simple-dashboard

- - - -

### Instalacja pakietów

1. Wymagane pakiety na komputerze Managera:
`sudo apt-get install snmp snmp-mibs-downloader`

Pakiet `snmp-mibs-downloader`  umożliwia odwoływanie się do obiektów MIB po ‘nazwie’ i nie wymaga podawania dokładnej ścieżki.

2. Wymagane pakiety na komputerze Agenta:
`sudo apt-get install snmpd`

### Konfiguracja Managera

Plik `/etc/snmp/snmp.conf` to ‘globalne ustawienia’ które podają jakiego użytkownika/hasła używać gdy wołamy komendy protokołu SNMP.

1. By umożliwić importowanie plików MIB musimy usunąć linię kodu  `mibs :`
2. Następnie dodajemy dane użytkownika:
``` bash
defSecurityName michal
defSecurityLevel authPriv
defAuthType MD5
defPrivType DES
defAuthPassphrase mehmehmeh
defPrivPassphrase mehmehmeh
```

Poprawnie skonfigurowany plik umożliwi nam wysyłanie zapytań w formacie:
`snmpget [host] [OID]`

zamiast dłuższego zapisu wymagającego podawanie loginu/hasła:
`snmpget -u demo -l authPriv -a MD5 -x DES -A my_new_password -X my_new_password remote_host sysUpTime.0`

Przykład:
`snmpget 178.62.34.44 .1.3.6.1.4.1.2021.9.1.7.1`


### Konfiguracja Agenta

Wszystkich zmian dokonujemy w pliku `/etc/snmp/snmpd.conf`, który jest plikiem konfiguracyjnym daemona.

1. By pozwolić na wszystkie połączenia dodajemy (opcja powinna zostać potem zablokowana):
`agentAddress udp:161,udp6:[::1]:161`

2. Tworzymy tymczasowego użytkownika protokołu SNMP, którego login i hasło są używane w komunikacji dodając wpis w formacie
`createUser name MD5 temp_password DES`

W naszym przypadku użyliśmy:
login: michal
hasło: mehmehmeh

Oraz dodaliśmy:
	- `rwuser` by użytkownik miał dostęp read and write (możemy też użyć `rouser` by dostać dostęp read-only).
	- oraz  `priv`  by wymusić używanie szyfrowania

``` bash
createUser michal MD5 mehmehmeh DES
rwuser michal priv
rwuser demo priv
```

By przetestować użytkownika należy zrestartować serwis:
`sudo service snmpd restart`  oraz użyć narzędzia `snmpusm`

3. Byśmy mogli się odwoływać do poszczególnych zasobów dodajemy:

``` bash

# Cumulus specific
view systemonly included .1.3.6.1.4.1.40310.1
view systemonly included .1.3.6.1.4.1.40310.2

# Memory utilization
view systemonly included .1.3.6.1.4.1.2021.4

# CPU utilization
view systemonly included .1.3.6.1.4.1.2021.11

# Disk
view systemonly included .1.3.6.1.4.1.2021.9
```


### Pobieranie wartości

Zapytaniem którego używaliśmy w naszym projekcie jest  `snmpget`. Możemy nim odczytać każdą wartość OID do której użytkownik ma dostęp.

`snmpget authentication_info host 1.3.6.1.2.1.1.1.0`
a dzięki temu, że zainstalowaliśmy mib-managera możemy też odwoływać się przez:
`snmpget authentication_info host sysDescr.0`

**Inne zapytania, których mogliśmy użyć to na przykład:**

1. `snmpgetnext`  pozwala nam pobrać ‘kolejną’ wartość, po tej którą podamy.
	Zapytanie
	`snmpgetnext authentication_info host sysDescr.0`
	zwraca nam ObjectID, które używamy w kolejnym zapytaniu:
	`snmpgetnext authentication_info host sysObjectID.0`

2. `SnmpWalk` pozwala przejść przed drzewo OID i pobrac ich wartości

3. `SnmpSet` pozwala zapisać wartość do OID.
`snmpset authentication_info host OID_to_modify data_type new_value`
Dzięki pakietowi `snmp-mibs-downloader` możemy prosto przypisywać wartości używając `=` :
`snmpset authentication_info host sysLocation.0 = "Krakow"`

4. Warto wspomnieć jeszcze o `snmpbulkget` które optymalizuje ilość potrzebnych zapytań poprzez wysłanie więcej niż jednego OID / wartości w jednym pakiecie danych.

### Uruchomienie serwera i pliki Managera

**Pliki** w głównym katalogu Menadżera
1. `server.js` - to plik z kodem naszego serwera. Jego proces jest uruchomiony w tle.
2. `public` - w tym katalogu  znajdują się Chart.js, html etc. Pliki z tego katalogu są publiczne, aby przeglądarka miała do nich dostęp. Plik .html naszego dashboardu znajduję się pod ścieżką `public/Chart.js/samples/charts/line/basic.html`.

**Serwer**
1. `pm2 kill` - Zabija wszystkie uruchomione procesy
2. `pm2 start test.js` - Uruchamia proces serwera (w tle)
