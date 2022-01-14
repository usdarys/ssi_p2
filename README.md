# ssi_p2

Rozwiązanie problemu komiwojazera algorytmem genetycznym.

Uruchomienie programu

    node tsp.js [plik zrodlowy] [plik wynikowy]

np.

    node tsp.js dane/bier127.tsp wyniki/bier1.txt
    node tsp.js dane/pr144.tsp wyniki/pr1.txt

Parametry konfiguracji dzialania programu:

    const liczbaOsobnikowPopulacji = 300;
    const liczbaPokolen = 1000;
    const prawdopodobienstwoKrzyzowania = 0.8;
    const prawdopodobienstwoMutacji = 0.1;
    const liczbaUczestnikowPojedynkuSelekcji = 10;
    const liczbaWykonanProgramu = 10;