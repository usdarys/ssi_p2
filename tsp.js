/**
 * dane w pliku to: ID, x, y
 * Osobnik powinien być: permutacja zbioru (ID-ków miast) [dowolny n-elementowy ciag n-elementowego zbioru] + dodatkowe pole na długość trasy [uwaga trasa ma ma byc zamknieta tzn dlugosc musi uwzgledniac zlaczenie ostatniego z pierwszym]
 * Chyba najlepiej jako obiekt czyli populacja to 
 * [
 *      { trasa: [1, 2, 3, 4, 5], dlugosc: 45 },
 *      { trasa: [1, 3, 2, 5, 4], dlugosc: 78 }
 * ]
 * 
 * Agorytm powinien:
 * 1. Zaladowac dane miast (ID, x, y)
 * 2. Stworzyc macierz odleglosci miedzy miastami (przyda sie do obliczania dlugosci zeby nie liczyc tego za kazdym razem)
 * 3. Wygenerowac poczatkowa populacje - ile osobnikow w populacji? dowolnie - dodać na to parametr
 * 4. Przemielić x - populacji (x dowolne, dodać parametr)
 *      - krzyzowac populacje
 *      - mutowac populacje
 *      - dokonac selekcji osobnikow do kolejnej populacji
 * 5. Wybrac najlepszego osobnika (najkrotsza dlugosc trasy) i zapisac go do pliku
 * 
 * 
 * Wyjscie - plik z rozwiazaniem - najlepszy osobik czyli: trasa (ciag, oddzielane spacja) + dlugosc trasy
 * 
 * "Do każdego z dwóch zbiorów danych trzeba wygenerować 10 wyników (rozwiązań). " - czy to ma byc 10 wynikow w jednym pliku czy 10 plikow? najlepiej dodac parametr na liczbe wykonac programu
 */

const { exit } = require('process');
const { appendFile, writeFile, readFile } = require('fs/promises');
const path = require('path');

const logFormat = {
    error: "\x1b[31m%s\x1b[0m"
};

const liczbaOsobnikowPopulacji = 10;
const liczbaPopulacji = 10;

(async () => {

    let daneWejsciowe = process.argv[2];
    if (!daneWejsciowe || path.extname(daneWejsciowe) !== '.tsp') {
        console.error(logFormat.error, 'ERROR: Nie podano poprawnej sciezki do pliku z danymi');
        return;
    }

    let miasta = [], macierzOdleglosci = [], populacja = [];

    try {
        miasta = await pobierzDaneMiastZPliku(daneWejsciowe);
    } catch(err) {
        console.error(logFormat.error, 'ERROR: Blad wczytywania danych z pliku');
        console.error(logFormat.error, err);
    } 

    miasta = miasta.slice(0, 5);

    for (let i = 0; i < miasta.length; i++) {
        macierzOdleglosci[i] = [];
        for (let j = 0; j < miasta.length; j++) {
            macierzOdleglosci[i][j] = odleglosc(miasta[i], miasta[j]);
        }
    }

    //console.log(macierzOdleglosci);
    //return;


   
    populacja = wygenerujPopulacjeStartowa(liczbaOsobnikowPopulacji, miasta, macierzOdleglosci);
    console.log(populacja);

    // for (let j = 0; j < liczbaPopulacji; j++) {
    //     populacja = krzyzujPopulacje(populacja);
    //     populacja = mutujPopulacje(populacja);
    //     populacja = wybierzOsobnikow(populacja);
    // }

})();

function wygenerujPopulacjeStartowa(liczbaOsobnikowPopulacji, miasta, macierzOdleglosci) {
    let populacja = [];
    for (let i = 0; i < liczbaOsobnikowPopulacji; i++) {
        populacja[i] = {};
        populacja[i].trasa = shuffle(miasta.map(el => el.id));
        populacja[i].dlugosc = dlugoscTrasy(populacja[i].trasa, macierzOdleglosci);
    }
    return populacja;
}

async function pobierzDaneMiastZPliku(plik) {
    let dane = await readFile(plik, 'utf8');
    dane = dane.split('\n');
    dane = dane.slice(dane.indexOf('NODE_COORD_SECTION') + 1, dane.indexOf('EOF'));
    return dane.map(el => {
        miasto = el.trim().replace(/  +/g, ';').split(';');
        return {
            id: +miasto[0],
            x: +miasto[1],
            y: +miasto[2]
        };
    });
}

function odleglosc(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function dlugoscTrasy(trasa, macierzOdleglosci) {
    let dlugosc = 0;
    for (let i = 0; i < trasa.length - 1; i++) {
        //console.log(`bieremy z macierzOdleglosci[${trasa[i] - 1}][${trasa[i+1] - 1}]`);
        dlugosc += macierzOdleglosci[trasa[i] - 1][trasa[i + 1] - 1];
    }
    //console.log(`zamkniecie: bieremy z macierzOdleglosci[${trasa[trasa.length - 1] - 1}][${trasa[0] - 1}]`);
    dlugosc += macierzOdleglosci[trasa[trasa.length - 1] - 1][trasa[0] - 1];
    return dlugosc;
}

/**
 * 
 * @param {number[]} arr 
 * @returns {number[]}
 */
 function shuffle(arr) {
    let currentIndex = arr.length, randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
    }
    return arr;
}