const { exit } = require('process');
const { appendFile, writeFile, readFile } = require('fs/promises');
const path = require('path');

const liczbaOsobnikowPopulacji = 300;
const liczbaPokolen = 1000;
const prawdopodobienstwoKrzyzowania = 0.8;
const prawdopodobienstwoMutacji = 0.1;
const liczbaUczestnikowPojedynkuSelekcji = 10;
const liczbaWykonanProgramu = 10;

const logFormat = {
    error: "\x1b[31m%s\x1b[0m"
};

let miasta = [], macierzOdleglosci = [], populacja = [];

(async () => {

    let daneWejsciowe = process.argv[2];
    if (!daneWejsciowe || path.extname(daneWejsciowe) !== '.tsp') {
        console.error(logFormat.error, 'ERROR: Nie podano poprawnej sciezki do pliku z danymi');
        return;
    }

    let plikWynikowy = process.argv[3];
    if (!plikWynikowy) {
        console.error(logFormat.error, 'ERROR: Nie podano pliku wynikowego');
    }

    try {
        miasta = await pobierzDaneMiastZPliku(daneWejsciowe);
    } catch(err) {
        console.error(logFormat.error, 'ERROR: Blad wczytywania danych z pliku');
        console.error(logFormat.error, err);
    } 

    for (let i = 0; i < miasta.length; i++) {
        macierzOdleglosci[i] = [];
        for (let j = 0; j < miasta.length; j++) {
            macierzOdleglosci[i][j] = odleglosc(miasta[i], miasta[j]);
        }
    }
   
    for (let i = 0; i < liczbaWykonanProgramu; i++) {
        populacja = wygenerujPopulacjeStartowa(liczbaOsobnikowPopulacji, miasta);

        for (let j = 0; j < liczbaPokolen; j++) {
            populacja = krzyzujPopulacje(populacja);
            populacja = mutujPopulacje(populacja);
            populacja = dokonajSelekcji(populacja, liczbaUczestnikowPojedynkuSelekcji);
        }
    
        let najlepszy = najlepszyOsobnik(populacja);
    
        try {
            await appendFile(plikWynikowy, `${najlepszy.trasa.join(' ')} ${najlepszy.dlugosc}\n`);
        } catch (err) {
            console.error(logFormat.error, err);
        }
    }

})();

/**
 * Selekcja turniejowa
 * @param {Object[]} populacja 
 * @param {number} liczbaOsobnikowDoPojedynku
 * @returns {Object[]}
 */
function dokonajSelekcji(populacja, liczbaOsobnikowDoPojedynku) {
    let zwyciezcy = [];
    let uczestnicyPojedynku;

    while (zwyciezcy.length < populacja.length) {
        uczestnicyPojedynku = shuffle(populacja).slice(0, liczbaOsobnikowDoPojedynku);
        zwyciezcy.push(najlepszyOsobnik(uczestnicyPojedynku));
    }

    return zwyciezcy;
}

/**
 * 
 * @param {Object[]} populacja 
 * @returns {Object[]}
 */
 function krzyzujPopulacje(populacja) {
    let skrzyzowanaPopulacja = [], para = [];

    populacja = shuffle(populacja);

    while (populacja.length > 1) {
        para = [populacja[0], populacja[1]];
        populacja.splice(0, 2);
        if (Math.random() > prawdopodobienstwoKrzyzowania) {
            skrzyzowanaPopulacja = skrzyzowanaPopulacja.concat(para);
        } else {
            skrzyzowanaPopulacja.push(krzyzujOsobniki(para[0], para[1]));
            skrzyzowanaPopulacja.push(krzyzujOsobniki(para[1], para[0]));
        }
    }

    // jezeli zostal osobnik bez pary to przechodzi dalej
    if (populacja.length) {
        skrzyzowanaPopulacja.push(populacja[0]);
    }

    return skrzyzowanaPopulacja;
}

/**
 * 
 * @param {Object[]} populacja 
 * @returns {Object[]}
 */
function mutujPopulacje(populacja) {
    populacja.forEach(osobnik => {
        if (Math.random() <= prawdopodobienstwoMutacji) {
            mutujOsobnika(osobnik);
        }
    });
    return populacja;
}

/**
 * Krzyzuje osobniki w nastepujacy sposób - bierze polowe trasy z pierwszego rodzica 
 * i uzupelnia druga polowe wg kolejnosci brakujacych elementow w drugim rodzicu.
 * @param {Object} rodzic1
 * @param {Object} rodzic2
 * @returns {Object} skrzyzowany potomek
 */
function krzyzujOsobniki(rodzic1, rodzic2) {
    let potomek = {};
    potomek.trasa = rodzic1.trasa.slice(0, Math.floor(rodzic1.trasa.length / 2));

    for (let i = 0; i < rodzic2.trasa.length; i++) {
        if (potomek.trasa.includes(rodzic2.trasa[i]) === false) {
            potomek.trasa.push(rodzic2.trasa[i]);
        }
        if (potomek.trasa.length === rodzic2.trasa.length) {
            break;
        }
    }
    potomek.dlugosc = dlugoscTrasy(potomek.trasa);
    return potomek;
}

/**
 * Mutuje osobnika poprzez zamianę dwóch elementów trasy miejscami
 * @param {Object} osobnik
 * @returns {Object} osobnik po mutacji
 */
function mutujOsobnika(osobnik) {
    let wierzcholkiDoZamiany = shuffle(Array.from(Array(osobnik.trasa.length).keys())).slice(0, 2);
    let tmp = osobnik.trasa[wierzcholkiDoZamiany[0]];
    osobnik.trasa[wierzcholkiDoZamiany[0]] = osobnik.trasa[wierzcholkiDoZamiany[1]];
    osobnik.trasa[wierzcholkiDoZamiany[1]] = tmp;
    osobnik.dlugosc = dlugoscTrasy(osobnik.trasa);
    return osobnik;
}

function wygenerujPopulacjeStartowa(liczbaOsobnikowPopulacji, miasta) {
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
        miasto = el.trim().replace(/ +/g, ';').split(';');
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

function dlugoscTrasy(trasa) {
    let dlugosc = 0;
    for (let i = 0; i < trasa.length - 1; i++) {
        dlugosc += macierzOdleglosci[trasa[i] - 1][trasa[i + 1] - 1];
    }
    // zamkniecie trasy
    dlugosc += macierzOdleglosci[trasa[trasa.length - 1] - 1][trasa[0] - 1];
    return dlugosc;
}

/**
 * Zwraca najlepszego osobnika populacji (osobnik o najkrotszej trasie)
 * @param {Object[]} populacja 
 * @returns {Object} najlepszy osobnik
 */
function najlepszyOsobnik(populacja) {
    let najlepszy = populacja[0];
    for (let i = 1; i < populacja.length; i++) {
        if (populacja[i].dlugosc < najlepszy.dlugosc) {
            najlepszy = populacja[i];
        }
    }
    return najlepszy;
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

/**
 * 
 * @param {number} min 
 * @param {number} max 
 * @returns {number} Liczba Int z zakresu [min, max)
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
} 