/* Übungsbibliothek und Standard-Routinen */
(function () {
  'use strict';
  const Gym = (window.Gym = window.Gym || { act: {}, ui: {} });

  Gym.MUSCLES = ['Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps', 'Beine', 'Gesäß', 'Waden', 'Bauch', 'Cardio'];
  Gym.EQUIPMENT = ['Langhantel', 'Kurzhantel', 'Maschine', 'Kabel', 'Körpergewicht', 'Kettlebell', 'Cardiogerät', 'Sonstiges'];

  // kind: weight = Gewicht × Wdh. | body = Körpergewicht (Wdh., optional Zusatzgewicht)
  //       time = Haltezeit in Sekunden | cardio = Distanz + Minuten
  Gym.KINDS = { weight: 'Gewicht × Wiederholungen', body: 'Körpergewicht', time: 'Zeit (Sekunden)', cardio: 'Cardio (Distanz, Dauer)' };

  const L = 'Langhantel', K = 'Kurzhantel', M = 'Maschine', C = 'Kabel', B = 'Körpergewicht', G = 'Cardiogerät';
  const lib = [
    // Brust
    ['bankdruecken', 'Bankdrücken', 'Brust', L],
    ['schraegbank', 'Schrägbankdrücken', 'Brust', L],
    ['kh-bankdruecken', 'Kurzhantel-Bankdrücken', 'Brust', K],
    ['kh-schraegbank', 'Kurzhantel-Schrägbankdrücken', 'Brust', K],
    ['brustpresse', 'Brustpresse', 'Brust', M],
    ['butterfly', 'Butterfly', 'Brust', M],
    ['kabel-flys', 'Kabelzug-Flys', 'Brust', C],
    ['kh-flys', 'Kurzhantel-Flys', 'Brust', K],
    ['liegestuetze', 'Liegestütze', 'Brust', B, 'body'],
    ['dips', 'Dips', 'Brust', B, 'body'],
    // Rücken
    ['kreuzheben', 'Kreuzheben', 'Rücken', L],
    ['klimmzuege', 'Klimmzüge', 'Rücken', B, 'body'],
    ['latzug', 'Latzug', 'Rücken', C],
    ['lh-rudern', 'Langhantelrudern', 'Rücken', L],
    ['kh-rudern', 'Kurzhantelrudern', 'Rücken', K],
    ['kabelrudern', 'Rudern am Kabel', 'Rücken', C],
    ['tbar-rudern', 'T-Bar-Rudern', 'Rücken', L],
    ['rudermaschine', 'Rudermaschine sitzend', 'Rücken', M],
    ['ueberzuege', 'Überzüge am Kabel', 'Rücken', C],
    ['hyperextensions', 'Rückenstrecker', 'Rücken', B, 'body'],
    ['shrugs', 'Shrugs', 'Rücken', K],
    // Schultern
    ['schulterdruecken', 'Schulterdrücken (Langhantel)', 'Schultern', L],
    ['kh-schulterdruecken', 'Kurzhantel-Schulterdrücken', 'Schultern', K],
    ['schulterpresse', 'Schulterpresse', 'Schultern', M],
    ['seitheben', 'Seitheben', 'Schultern', K],
    ['kabel-seitheben', 'Seitheben am Kabel', 'Schultern', C],
    ['frontheben', 'Frontheben', 'Schultern', K],
    ['reverse-flys', 'Reverse Flys', 'Schultern', K],
    ['face-pulls', 'Face Pulls', 'Schultern', C],
    // Bizeps
    ['lh-curls', 'Langhantel-Curls', 'Bizeps', L],
    ['kh-curls', 'Kurzhantel-Curls', 'Bizeps', K],
    ['hammer-curls', 'Hammer-Curls', 'Bizeps', K],
    ['scott-curls', 'Scott-Curls', 'Bizeps', L],
    ['kabel-curls', 'Kabel-Curls', 'Bizeps', C],
    ['konz-curls', 'Konzentrations-Curls', 'Bizeps', K],
    // Trizeps
    ['trizepsdruecken', 'Trizepsdrücken am Kabel', 'Trizeps', C],
    ['ueberkopf-trizeps', 'Überkopf-Trizepsstrecken', 'Trizeps', C],
    ['skull-crushers', 'Skull Crushers', 'Trizeps', L],
    ['enges-bankdruecken', 'Enges Bankdrücken', 'Trizeps', L],
    ['kickbacks', 'Trizeps-Kickbacks', 'Trizeps', K],
    // Beine
    ['kniebeugen', 'Kniebeugen', 'Beine', L],
    ['frontkniebeugen', 'Frontkniebeugen', 'Beine', L],
    ['beinpresse', 'Beinpresse', 'Beine', M],
    ['hackenschmidt', 'Hackenschmidt-Kniebeuge', 'Beine', M],
    ['ausfallschritte', 'Ausfallschritte', 'Beine', K],
    ['bulgarian', 'Bulgarische Split-Kniebeugen', 'Beine', K],
    ['goblet-squat', 'Goblet Squat', 'Beine', 'Kettlebell'],
    ['rum-kreuzheben', 'Rumänisches Kreuzheben', 'Beine', L],
    ['beinstrecker', 'Beinstrecker', 'Beine', M],
    ['beinbeuger', 'Beinbeuger', 'Beine', M],
    ['adduktoren', 'Adduktoren-Maschine', 'Beine', M],
    // Gesäß
    ['hip-thrust', 'Hip Thrust', 'Gesäß', L],
    ['glute-bridge', 'Glute Bridge', 'Gesäß', B, 'body'],
    ['kabel-kickbacks', 'Kickbacks am Kabel', 'Gesäß', C],
    ['abduktoren', 'Abduktoren-Maschine', 'Gesäß', M],
    // Waden
    ['wadenheben', 'Wadenheben stehend', 'Waden', M],
    ['wadenheben-sitzend', 'Wadenheben sitzend', 'Waden', M],
    // Bauch
    ['crunches', 'Crunches', 'Bauch', B, 'body'],
    ['situps', 'Sit-ups', 'Bauch', B, 'body'],
    ['beinheben', 'Beinheben hängend', 'Bauch', B, 'body'],
    ['kabel-crunches', 'Kabel-Crunches', 'Bauch', C],
    ['russian-twist', 'Russian Twist', 'Bauch', B, 'body'],
    ['ab-wheel', 'Ab-Wheel', 'Bauch', B, 'body'],
    ['plank', 'Plank', 'Bauch', B, 'time'],
    ['seitstuetz', 'Seitstütz', 'Bauch', B, 'time'],
    // Cardio
    ['laufband', 'Laufband', 'Cardio', G, 'cardio'],
    ['ergometer', 'Fahrradergometer', 'Cardio', G, 'cardio'],
    ['crosstrainer', 'Crosstrainer', 'Cardio', G, 'cardio'],
    ['rudergeraet', 'Rudergerät', 'Cardio', G, 'cardio'],
    ['stepper', 'Stepper', 'Cardio', G, 'cardio'],
    ['seilspringen', 'Seilspringen', 'Cardio', 'Sonstiges', 'time'],
  ];
  Gym.LIBRARY = lib.map(([id, name, muscle, equip, kind]) => ({ id, name, muscle, equip, kind: kind || 'weight' }));

  // Für die Satz-Zählung im Trainingsplan werden Beine und Schultern genauer aufgeteilt, weil die
  // Teile sehr unterschiedlich viel Training bekommen (z. B. vordere Schulter durch jedes Drücken).
  const Q = 'Quadrizeps', HB = 'Beinbeuger', SV = 'Schulter vorne', SS = 'Schulter seitlich', SH = 'Schulter hinten';
  Gym.PARTS = { Beine: [Q, HB, 'Adduktoren'], Schultern: [SV, SS, SH] };
  Gym.PART = {
    kniebeugen: Q, frontkniebeugen: Q, beinpresse: Q, hackenschmidt: Q, ausfallschritte: Q, bulgarian: Q, 'goblet-squat': Q, beinstrecker: Q,
    'rum-kreuzheben': HB, beinbeuger: HB, adduktoren: 'Adduktoren',
    schulterdruecken: SV, 'kh-schulterdruecken': SV, schulterpresse: SV, frontheben: SV,
    seitheben: SS, 'kabel-seitheben': SS, 'reverse-flys': SH, 'face-pulls': SH,
  };
  // Teil, auf den die Sätze einer Übung zählen (eigene Übungen: selbst gewählt, sonst eine Annahme)
  Gym.part = (ex) => ex.part || Gym.PART[ex.id] || (ex.muscle === 'Beine' ? Q : ex.muscle === 'Schultern' ? SS : ex.muscle);
  // Reihenfolge der Zeilen in der Wochenübersicht
  Gym.COUNT_ORDER = ['Brust', 'Rücken', SV, SS, SH, 'Bizeps', 'Trizeps', Q, HB, 'Gesäß', 'Adduktoren', 'Waden', 'Bauch'];

  // Muskeln, die bei einer Übung mitarbeiten. Ihre Sätze zählen in der Wochenübersicht des
  // Trainingsplans halb. Übungen mit einem Eintrag gelten als Grundübungen.
  const TRI = 'Trizeps', BIZ = 'Bizeps', GES = 'Gesäß';
  Gym.SECONDARY = {
    bankdruecken: [SV, TRI], schraegbank: [SV, TRI], 'kh-bankdruecken': [SV, TRI], 'kh-schraegbank': [SV, TRI],
    brustpresse: [SV, TRI], liegestuetze: [SV, TRI], dips: [SV, TRI],
    kreuzheben: [HB, GES], klimmzuege: [BIZ], latzug: [BIZ], 'lh-rudern': [BIZ, SH], 'kh-rudern': [BIZ, SH],
    kabelrudern: [BIZ, SH], 'tbar-rudern': [BIZ, SH], rudermaschine: [BIZ, SH],
    schulterdruecken: [TRI, SS], 'kh-schulterdruecken': [TRI, SS], schulterpresse: [TRI, SS],
    'enges-bankdruecken': ['Brust', SV],
    kniebeugen: [GES], frontkniebeugen: [GES], beinpresse: [GES], hackenschmidt: [GES], ausfallschritte: [GES],
    bulgarian: [GES], 'goblet-squat': [GES], 'rum-kreuzheben': [GES], 'hip-thrust': [HB],
  };
  // Grundübung (mehrgelenkig): längere Pause, schwere und leichte Tage laut Plan
  Gym.isCompound = (ex) => !!(Gym.SECONDARY[ex.id] || ex.compound);
  // Pause nach einem Satz: Grundübungen länger, weil kurze Pausen dort Wiederholungen kosten
  Gym.restFor = (ex) => { const st = Gym.S.settings; return (Gym.isCompound(ex) ? st.restSecBig || 150 : st.restSec) || 90; };

  Gym.defaultRoutines = () => [
    { id: 'r-push', name: 'Push (Brust, Schultern, Trizeps)', items: [
      { exId: 'bankdruecken', sets: 4, reps: '6–8' },
      { exId: 'kh-schraegbank', sets: 3, reps: '8–10' },
      { exId: 'kh-schulterdruecken', sets: 3, reps: '8–10' },
      { exId: 'seitheben', sets: 3, reps: '12–15' },
      { exId: 'trizepsdruecken', sets: 3, reps: '10–12' },
    ] },
    { id: 'r-pull', name: 'Pull (Rücken, Bizeps)', items: [
      { exId: 'kreuzheben', sets: 3, reps: '5' },
      { exId: 'klimmzuege', sets: 3, reps: '6–10' },
      { exId: 'lh-rudern', sets: 3, reps: '8–10' },
      { exId: 'face-pulls', sets: 3, reps: '12–15' },
      { exId: 'kh-curls', sets: 3, reps: '10–12' },
    ] },
    { id: 'r-legs', name: 'Beine', items: [
      { exId: 'kniebeugen', sets: 4, reps: '6–8' },
      { exId: 'rum-kreuzheben', sets: 3, reps: '8–10' },
      { exId: 'beinpresse', sets: 3, reps: '10–12' },
      { exId: 'beinbeuger', sets: 3, reps: '10–12' },
      { exId: 'wadenheben', sets: 4, reps: '12–15' },
    ] },
    { id: 'r-full', name: 'Ganzkörper', items: [
      { exId: 'kniebeugen', sets: 3, reps: '8' },
      { exId: 'bankdruecken', sets: 3, reps: '8' },
      { exId: 'latzug', sets: 3, reps: '10' },
      { exId: 'kh-schulterdruecken', sets: 3, reps: '10' },
      { exId: 'plank', sets: 3, reps: '60 s' },
    ] },
  ];
})();
