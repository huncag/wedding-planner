import type { MealPreference } from "@/lib/rsvp";

export const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "hu", label: "Magyar", short: "HU" },
  { code: "ro", label: "Română", short: "RO" },
] as const;

export type Language = (typeof LANGUAGES)[number]["code"];

/** Cookie the public RSVP page uses to remember the chosen language. */
export const LANGUAGE_COOKIE = "rsvp_language";

export function isLanguage(value: string | undefined | null): value is Language {
  return LANGUAGES.some((language) => language.code === value);
}

export type RsvpCopy = {
  languageLabel: string;
  venueLine: string;
  saveTheDate: string;
  longDate: string;
  ceremonyLine: string;
  kindlyReply: string;
  willYouJoin: string;
  intro: string;
  footer: string;
  form: {
    nameLabel: string;
    namePlaceholder: string;
    contactLegend: string;
    contactHint: string;
    emailLabel: string;
    phoneLabel: string;
    attendanceLegend: string;
    acceptTitle: string;
    acceptNote: string;
    declineTitle: string;
    declineNote: string;
    peopleLegend: string;
    peopleHint: string;
    personNameLabel: string;
    personNamePlaceholder: string;
    mealLabel: string;
    mealPlaceholder: string;
    addPerson: string;
    removePerson: string;
    dietaryLabel: string;
    dietaryPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    privacy: string;
    errors: {
      nameRequired: string;
      contactRequired: string;
      invalidEmail: string;
      attendanceRequired: string;
      personNameRequired: string;
      mealRequired: string;
      saveFailed: string;
      networkFailed: string;
    };
  };
  success: {
    thankYou: string;
    attendingBody: string;
    partyHeading: string;
    partySizeOne: string;
    partySizeOther: string;
    declinedBody: string;
    next: string;
    sendAnother: string;
  };
  meals: Record<MealPreference, string>;
};

const EN: RsvpCopy = {
  languageLabel: "Language",
  venueLine: "Teleki Castle · Gernyeszeg",
  saveTheDate: "Save the date",
  longDate: "Saturday, 27 May 2028",
  ceremonyLine: "Ceremony at 15:00 · Gernyeszeg, Romania",
  kindlyReply: "Kindly reply",
  willYouJoin: "Will you join us?",
  intro:
    "Please send your reply as soon as you know — it helps us plan the menu, seating and every last detail. Replies appear in our planner the moment they are sent.",
  footer: "We cannot wait to celebrate with you",
  form: {
    nameLabel: "Your name",
    namePlaceholder: "First and last name",
    contactLegend: "How can we reach you?",
    contactHint: "Give us at least one of the two so we can confirm the details.",
    emailLabel: "Email",
    phoneLabel: "Phone",
    attendanceLegend: "Will you join us?",
    acceptTitle: "Joyfully accepts",
    acceptNote: "Saturday, 27 May 2028 · 15:00",
    declineTitle: "Regretfully declines",
    declineNote: "We will miss you, but thank you for telling us.",
    peopleLegend: "Who is coming?",
    peopleHint:
      "Add everyone who is coming with you, then pick a meal for each person.",
    personNameLabel: "Name",
    personNamePlaceholder: "Full name",
    mealLabel: "Meal",
    mealPlaceholder: "Choose a meal…",
    addPerson: "Add another person",
    removePerson: "Remove person",
    dietaryLabel: "Dietary needs or allergies (optional)",
    dietaryPlaceholder: "e.g. nut allergy, gluten free",
    messageLabel: "A note for us (optional)",
    messagePlaceholder: "Anything you would like us to know",
    submit: "Send my reply",
    submitting: "Sending your reply…",
    privacy: "Your details are only visible to the two of us.",
    errors: {
      nameRequired: "Please tell us your name.",
      contactRequired:
        "Add an email address or a phone number so we can reach you.",
      invalidEmail: "That email address does not look right.",
      attendanceRequired: "Please let us know whether you can join us.",
      personNameRequired: "Please give a name for everyone who is coming.",
      mealRequired: "Please choose a meal for every person.",
      saveFailed:
        "We could not save your reply. Please try again in a moment, or send us a message directly.",
      networkFailed:
        "We could not reach the RSVP service. Check your connection and try again.",
    },
  },
  success: {
    thankYou: "Thank you, {name}!",
    attendingBody:
      "Your reply is with us. We cannot wait to celebrate with you at {venue} on {date}.",
    partyHeading: "Who is coming",
    partySizeOne: "1 person",
    partySizeOther: "{count} people",
    declinedBody:
      "We are sorry you cannot make it, but thank you for letting us know. You will be missed.",
    next: "Plans changed? Send another reply or get in touch with us directly and we will update your place.",
    sendAnother: "Send another reply",
  },
  meals: {
    meat: "Meat",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    kids: "Children's menu",
  },
};

const HU: RsvpCopy = {
  languageLabel: "Nyelv",
  venueLine: "Teleki Kastély · Gernyeszeg",
  saveTheDate: "Jegyezzétek meg a dátumot",
  longDate: "2028. május 27., szombat",
  ceremonyLine: "Szertartás 15:00-kor · Gernyeszeg, Románia",
  kindlyReply: "Kérjük, válaszoljatok",
  willYouJoin: "Velünk ünnepeltek?",
  intro:
    "Kérjük, amint tudjátok, küldjétek el a válaszotokat — ez segít megtervezni az étkezést, az ültetést és minden apró részletet. A válaszok azonnal megjelennek a szervezőnkben.",
  footer: "Alig várjuk, hogy együtt ünnepelhessünk veletek",
  form: {
    nameLabel: "A neved",
    namePlaceholder: "Kereszt- és vezetéknév",
    contactLegend: "Hogyan érhetünk el?",
    contactHint:
      "Add meg legalább az egyiket, hogy egyeztetni tudjunk a részletekről.",
    emailLabel: "E-mail",
    phoneLabel: "Telefonszám",
    attendanceLegend: "Velünk leszel?",
    acceptTitle: "Örömmel elfogadom",
    acceptNote: "2028. május 27., szombat · 15:00",
    declineTitle: "Sajnos nem tudok jönni",
    declineNote: "Hiányozni fogsz, de köszönjük, hogy szóltál.",
    peopleLegend: "Kik jönnek?",
    peopleHint:
      "Add hozzá mindenkit, aki veled jön, majd válaszd ki mindenkinek az étkezését.",
    personNameLabel: "Név",
    personNamePlaceholder: "Teljes név",
    mealLabel: "Étkezés",
    mealPlaceholder: "Válassz étkezést…",
    addPerson: "Újabb személy hozzáadása",
    removePerson: "Személy eltávolítása",
    dietaryLabel: "Étrendi igények vagy allergiák (nem kötelező)",
    dietaryPlaceholder: "pl. mogyoróallergia, gluténmentes",
    messageLabel: "Üzenet nekünk (nem kötelező)",
    messagePlaceholder: "Bármi, amit szeretnél, hogy tudjunk",
    submit: "Válasz elküldése",
    submitting: "Küldés…",
    privacy: "Az adataidat csak ketten látjuk.",
    errors: {
      nameRequired: "Kérjük, add meg a neved.",
      contactRequired:
        "Adj meg egy e-mail-címet vagy telefonszámot, hogy elérhessünk.",
      invalidEmail: "Ez az e-mail-cím nem tűnik megfelelőnek.",
      attendanceRequired: "Kérjük, mondd el, hogy tudsz-e jönni.",
      personNameRequired: "Kérjük, mindenkinek add meg a nevét, aki jön.",
      mealRequired: "Kérjük, mindenkinek válaszd ki az étkezést.",
      saveFailed:
        "Nem sikerült elmenteni a választ. Próbáld újra egy pillanat múlva, vagy írj nekünk közvetlenül.",
      networkFailed:
        "Nem érhető el a válaszadó szolgáltatás. Ellenőrizd az internetkapcsolatot, és próbáld újra.",
    },
  },
  success: {
    thankYou: "Köszönjük, {name}!",
    attendingBody:
      "Megkaptuk a válaszodat. Alig várjuk, hogy {date} napján együtt ünnepelhessünk veletek a {venue} helyszínén.",
    partyHeading: "Kik jönnek",
    partySizeOne: "1 fő",
    partySizeOther: "{count} fő",
    declinedBody:
      "Sajnáljuk, hogy nem tudsz jönni, de köszönjük, hogy szóltál. Hiányozni fogsz.",
    next: "Megváltozott a terv? Küldj új választ, vagy írj nekünk közvetlenül, és frissítjük a helyedet.",
    sendAnother: "Új válasz küldése",
  },
  meals: {
    meat: "Hús",
    vegetarian: "Vegetáriánus",
    vegan: "Vegán",
    kids: "Gyerekmenü",
  },
};

const RO: RsvpCopy = {
  languageLabel: "Limbă",
  venueLine: "Castelul Teleki · Gernyeszeg",
  saveTheDate: "Rezervă data",
  longDate: "sâmbătă, 27 mai 2028",
  ceremonyLine: "Cununia la ora 15:00 · Gernyeszeg, România",
  kindlyReply: "Te rugăm să răspunzi",
  willYouJoin: "Vii cu noi?",
  intro:
    "Te rugăm să trimiți răspunsul cât mai curând — ne ajută să planificăm meniul, așezarea în sală și fiecare detaliu. Răspunsurile apar imediat în planificatorul nostru.",
  footer: "Abia așteptăm să sărbătorim împreună cu voi",
  form: {
    nameLabel: "Numele tău",
    namePlaceholder: "Prenume și nume",
    contactLegend: "Cum te putem contacta?",
    contactHint:
      "Dă-ne cel puțin unul dintre ele, ca să putem confirma detaliile.",
    emailLabel: "E-mail",
    phoneLabel: "Telefon",
    attendanceLegend: "Vii la nuntă?",
    acceptTitle: "Accept cu bucurie",
    acceptNote: "sâmbătă, 27 mai 2028 · 15:00",
    declineTitle: "Nu pot veni, din păcate",
    declineNote: "Ne va fi dor de tine, dar mulțumim că ne-ai anunțat.",
    peopleLegend: "Cine vine?",
    peopleHint:
      "Adaugă fiecare persoană care vine cu tine, apoi alege meniul pentru fiecare.",
    personNameLabel: "Nume",
    personNamePlaceholder: "Nume complet",
    mealLabel: "Meniul",
    mealPlaceholder: "Alege un meniu…",
    addPerson: "Adaugă o altă persoană",
    removePerson: "Elimină persoana",
    dietaryLabel: "Cerințe alimentare sau alergii (opțional)",
    dietaryPlaceholder: "de ex. alergie la nuci, fără gluten",
    messageLabel: "Un mesaj pentru noi (opțional)",
    messagePlaceholder: "Orice ai vrea să știm",
    submit: "Trimite răspunsul",
    submitting: "Se trimite…",
    privacy: "Datele tale sunt vizibile doar pentru noi doi.",
    errors: {
      nameRequired: "Te rugăm să ne spui numele tău.",
      contactRequired:
        "Adaugă o adresă de e-mail sau un număr de telefon ca să te putem contacta.",
      invalidEmail: "Această adresă de e-mail nu pare corectă.",
      attendanceRequired: "Te rugăm să ne spui dacă poți veni.",
      personNameRequired:
        "Te rugăm să adaugi numele fiecărei persoane care vine.",
      mealRequired: "Te rugăm să alegi meniul pentru fiecare persoană.",
      saveFailed:
        "Nu am putut salva răspunsul. Încearcă din nou în câteva momente sau scrie-ne direct.",
      networkFailed:
        "Serviciul de răspuns nu este disponibil. Verifică conexiunea și încearcă din nou.",
    },
  },
  success: {
    thankYou: "Mulțumim, {name}!",
    attendingBody:
      "Răspunsul tău a ajuns la noi. Abia așteptăm să sărbătorim cu tine la {venue} în {date}.",
    partyHeading: "Cine vine",
    partySizeOne: "1 persoană",
    partySizeOther: "{count} persoane",
    declinedBody:
      "Ne pare rău că nu poți veni, dar mulțumim că ne-ai anunțat. Ne va fi dor de tine.",
    next: "Ți s-a schimbat planul? Trimite un alt răspuns sau scrie-ne direct și îți actualizăm locul.",
    sendAnother: "Trimite un alt răspuns",
  },
  meals: {
    meat: "Carne",
    vegetarian: "Vegetarian",
    vegan: "Vegan",
    kids: "Meniul copiilor",
  },
};

export const RSVP_COPY: Record<Language, RsvpCopy> = {
  en: EN,
  hu: HU,
  ro: RO,
};

export function rsvpCopy(language: Language): RsvpCopy {
  return RSVP_COPY[language] ?? EN;
}

/** Replaces `{name}`-style placeholders in a translated string. */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
