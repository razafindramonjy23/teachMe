/**
 * Catalogue des ressources par niveau.
 *
 * L'identité d'une ressource est son **URL** (voir `resourceId()`) : une même
 * page listée à plusieurs niveaux est une seule ressource, avec une seule case
 * « terminé ». L'identifiant est la clé de `resource_progress.resource_id`.
 *
 * L'URL est normalisée avant d'être hachée : protocole, `www.` et `/` final
 * sont ignorés. On peut donc passer un lien de http:// à https:// sans perdre
 * la progression. Changer le chemin ou l'hôte, en revanche, crée une nouvelle
 * ressource. Le fragment (#…) est conservé : il distingue des sections
 * (isabelperez.com/grammar.htm#Grammar ≠ #Vocabulary) et des pages d'applis
 * monopage (soundcomparisons.com/#/en/…).
 */

import { BookOpen, Headphones, PenTool, Video, Globe, Mic } from 'lucide-react'

export type ResourceCategory = {
  label: string
  icon: typeof BookOpen
  links: { title: string; url: string }[]
}

export type LevelEntry = {
  name: string
  code: string
  accent: string
  desc: string
  categories: ResourceCategory[]
}

export const levelData: Record<string, LevelEntry> = {
  beginner: {
    name: 'Beginner', code: 'A1', accent: 'green',
    desc: 'Commencez votre voyage en anglais avec des exercices simples et progressifs.',
    categories: [
      {
        label: 'Anglais général',
        icon: Globe,
        links: [
          { title: 'BBC Real Easy English', url: 'https://www.bbc.co.uk/learningenglish/english/features/real-easy-english' },
        ],
      },
      {
        label: 'Grammaire',
        icon: BookOpen,
        links: [
          { title: 'ESL Gold – Low Beginner Grammar', url: 'https://eslgold.com/improve-grammar/resources-by-level/low-beginner/' },
          { title: 'ESL Lounge – Level 1a', url: 'https://www.esl-lounge.com/level1a.php' },
          { title: 'GrammarBank – Beginner Lessons', url: 'https://www.grammarbank.com/beginners-esl-lessons.html' },
          { title: 'ESL Games World', url: 'https://eslgamesworld.com/members/games/levels/easy/index.html' },
          { title: 'British Council – Basic Grammar', url: 'https://learnenglish.britishcouncil.org/basic-grammar' },
          { title: 'Oxford Practice Grammar – Basic', url: 'https://elt.oup.com/student/practicegrammar/basic/?cc=global&selLanguage=en' },
        ],
      },
      {
        label: 'Vocabulaire',
        icon: PenTool,
        links: [
          { title: 'ESL Lounge – Vocabulary A1', url: 'https://www.esl-lounge.com/level1avocab.php' },
          { title: 'GrammarBank – Vocabulary', url: 'https://www.grammarbank.com/english-vocabulary-exercises.html' },
          { title: 'British Council – Basic Vocabulary', url: 'https://learnenglish.britishcouncil.org/basic-vocabulary' },
          { title: 'Learning Chocolate', url: 'https://www.learningchocolate.com/' },
          { title: 'Language Guide', url: 'https://www.languageguide.org/english/' },
          { title: 'A4ESL Vocabulary', url: 'http://a4esl.org/a/v.html' },
        ],
      },
      {
        label: 'Écoute',
        icon: Headphones,
        links: [
          { title: 'British Council – Listening A1', url: 'https://learnenglish.britishcouncil.org/skills/listening/beginner-a1' },
          { title: 'Daily Dictation', url: 'https://dailydictation.com/exercises' },
          { title: 'Speechling Dictation', url: 'https://speechling.com/dictation/englishb' },
        ],
      },
      {
        label: 'Expression orale',
        icon: Mic,
        links: [
          { title: 'British Council – Speaking A1', url: 'https://learnenglish.britishcouncil.org/skills/speaking/beginner-a1' },
          { title: 'ESL Gold – Speaking', url: 'https://www.eslgold.com/speaking/low_beginning' },
          { title: 'Daily ESL', url: 'https://www.dailyesl.com/' },
          { title: 'ESL Fast – Robot', url: 'https://www.eslfast.com/robot/' },
        ],
      },
      {
        label: 'Lecture',
        icon: BookOpen,
        links: [
          { title: 'ESL Lounge – Reading A1', url: 'https://www.esl-lounge.com/level1a-reading.php' },
          { title: 'British Council – Reading A1', url: 'https://learnenglish.britishcouncil.org/reading/beginner-a1-reading' },
        ],
      },
    ],
  },
  elementary: {
    name: 'Elementary', code: 'A2', accent: 'blue',
    desc: 'Construisez des bases solides avec des exercices de grammaire et de vocabulaire.',
    categories: [
      {
        label: 'Anglais général',
        icon: Globe,
        links: [
          { title: 'LEO Network', url: 'https://www.learn-english-online.org/' },
          { title: 'BBC Learning English – Courses', url: 'https://www.bbc.co.uk/learningenglish/english/courses' },
        ],
      },
      {
        label: 'Grammaire',
        icon: BookOpen,
        links: [
          { title: 'ESL Lounge – Level 1b Grammar', url: 'https://www.esl-lounge.com/level1bstructure.php' },
          { title: 'ESL Gold – High Beginning', url: 'https://www.eslgold.com/grammar/high_beginning/' },
          { title: 'SpeakSpeak – Elementary', url: 'http://speakspeak.com/english-grammar-exercises/elementary' },
          { title: 'English Club – Grammar Quizzes', url: 'http://www.englishclub.com/esl-quizzes/grammar-quizzes.htm' },
          { title: 'English Media Lab – Elementary', url: 'https://www.englishmedialab.com/elementaryquizzes.html' },
        ],
      },
      {
        label: 'Vocabulaire',
        icon: PenTool,
        links: [
          { title: 'ESL Lounge – Vocabulary A2', url: 'https://www.esl-lounge.com/level1bvocab.php' },
          { title: 'English Club – Vocabulary Quizzes', url: 'http://www.englishclub.com/esl-quizzes/vocabulary.htm' },
          { title: 'Picture Dictionary', url: 'https://www.pdictionary.com/' },
        ],
      },
      {
        label: 'Écoute',
        icon: Headphones,
        links: [
          { title: 'British Council – Listening A1', url: 'https://learnenglish.britishcouncil.org/skills/listening/beginner-a1' },
        ],
      },
      {
        label: 'Expression orale',
        icon: Mic,
        links: [
          { title: 'British Council – Speaking A1', url: 'https://learnenglish.britishcouncil.org/skills/speaking/beginner-a1' },
          { title: 'ESL Gold – Speaking High Beginning', url: 'https://www.eslgold.com/speaking/high_beginning.html' },
        ],
      },
      {
        label: 'Lecture',
        icon: BookOpen,
        links: [
          { title: 'ESL Lounge – Reading A2', url: 'https://www.esl-lounge.com/level1breadwrite.php' },
          { title: 'British Council – Reading A1', url: 'https://learnenglish.britishcouncil.org/reading/beginner-a1-reading' },
        ],
      },
    ],
  },
  'pre-intermediate': {
    name: 'Pre-Intermediate', code: 'B1-', accent: 'violet',
    desc: 'Développez votre vocabulaire et approfondissez la grammaire.',
    categories: [
      {
        label: 'Grammaire',
        icon: BookOpen,
        links: [
          { title: 'Englisch-Hilfen – Grammar', url: 'https://www.englisch-hilfen.de/en/inhalt_grammar.htm' },
          { title: 'Isabel Pérez – Grammar', url: 'http://www.isabelperez.com/grammar.htm#Grammar' },
          { title: 'A4ESL – Grammar', url: 'http://a4esl.org/q/h/grammar.html' },
          { title: 'Using English – Quizzes', url: 'http://www.usingenglish.com/quizzes/' },
        ],
      },
      {
        label: 'Vocabulaire',
        icon: PenTool,
        links: [
          { title: 'Englisch-Hilfen – Words', url: 'https://www.englisch-hilfen.de/en/words_inhalt.htm' },
          { title: 'English Club – Vocabulary', url: 'http://www.englishclub.com/vocabulary/' },
          { title: 'A4ESL – Vocabulary', url: 'http://a4esl.org/q/h/vocabulary.html' },
        ],
      },
      {
        label: 'Écoute',
        icon: Headphones,
        links: [
          { title: 'British Council – Listening B1', url: 'https://learnenglish.britishcouncil.org/skills/listening/intermediate-b1' },
        ],
      },
      {
        label: 'Expression orale',
        icon: Mic,
        links: [
          { title: 'British Council – Speaking B1', url: 'https://learnenglish.britishcouncil.org/skills/speaking/intermediate-b1' },
        ],
      },
      {
        label: 'Lecture',
        icon: BookOpen,
        links: [
          { title: 'British Council – Reading B1', url: 'https://learnenglish.britishcouncil.org/reading/intermediate-b1-reading' },
        ],
      },
    ],
  },
  intermediate: {
    name: 'Intermediate', code: 'B1', accent: 'amber',
    desc: 'Communiquez avec confiance dans des situations variées.',
    categories: [
      {
        label: 'Anglais général',
        icon: Globe,
        links: [
          { title: 'BBC 6-Minute English', url: 'https://www.bbc.co.uk/learningenglish/english/features/6-minute-english' },
        ],
      },
      {
        label: 'Grammaire',
        icon: BookOpen,
        links: [
          { title: 'Englisch-Hilfen – Grammar', url: 'https://www.englisch-hilfen.de/en/inhalt_grammar.htm' },
          { title: 'Isabel Pérez – Grammar', url: 'http://www.isabelperez.com/grammar.htm#Grammar' },
          { title: 'A4ESL – Grammar', url: 'http://a4esl.org/q/h/grammar.html' },
          { title: 'Using English – Quizzes', url: 'http://www.usingenglish.com/quizzes/' },
          { title: 'ESL Gold – High Intermediate', url: 'https://www.eslgold.com/grammar/high_intermediate' },
          { title: 'Oxford Practice Grammar – Intermediate', url: 'https://elt.oup.com/student/practicegrammar/int/?cc=global&selLanguage=en' },
        ],
      },
      {
        label: 'Vocabulaire',
        icon: PenTool,
        links: [
          { title: 'Englisch-Hilfen – Words', url: 'https://www.englisch-hilfen.de/en/words_inhalt.htm' },
          { title: 'English Club – Vocabulary', url: 'http://www.englishclub.com/vocabulary/' },
          { title: 'A4ESL – Vocabulary', url: 'http://a4esl.org/q/h/vocabulary.html' },
          { title: 'A4ESL – Idioms', url: 'http://a4esl.org/q/h/idioms.html' },
          { title: 'Isabel Pérez – Vocabulary', url: 'http://www.isabelperez.com/grammar.htm#Vocabulary' },
        ],
      },
      {
        label: 'Prononciation',
        icon: Mic,
        links: [
          { title: 'Isabel Pérez – Pronunciation', url: 'http://www.isabelperez.com/grammar.htm#pron' },
        ],
      },
      {
        label: 'Écoute',
        icon: Headphones,
        links: [
          { title: 'British Council – Listening B1', url: 'https://learnenglish.britishcouncil.org/skills/listening/intermediate-b1' },
        ],
      },
      {
        label: 'Expression orale',
        icon: Mic,
        links: [
          { title: 'British Council – Speaking B1', url: 'https://learnenglish.britishcouncil.org/skills/speaking/intermediate-b1' },
          { title: 'ESL Gold – Speaking High Intermediate', url: 'https://www.eslgold.com/speaking/high_intermediate' },
        ],
      },
      {
        label: 'Lecture',
        icon: BookOpen,
        links: [
          { title: 'British Council – Reading B1', url: 'https://learnenglish.britishcouncil.org/reading/intermediate-b1-reading' },
        ],
      },
    ],
  },
  'upper-intermediate': {
    name: 'Upper-Intermediate', code: 'B2', accent: 'orange',
    desc: 'Maîtrisez les nuances de la langue anglaise.',
    categories: [
      {
        label: 'Grammaire',
        icon: BookOpen,
        links: [
          { title: 'Englisch-Hilfen – Grammar', url: 'https://www.englisch-hilfen.de/en/inhalt_grammar.htm' },
          { title: 'Isabel Pérez – Grammar', url: 'http://www.isabelperez.com/grammar.htm' },
          { title: 'English Club – Grammar Quizzes', url: 'http://www.englishclub.com/esl-quizzes/grammar-quizzes.htm' },
        ],
      },
      {
        label: 'Vocabulaire',
        icon: PenTool,
        links: [
          { title: 'Englisch-Hilfen – Words', url: 'https://www.englisch-hilfen.de/en/words_inhalt.htm' },
          { title: 'A4ESL – Vocabulary', url: 'http://a4esl.org/q/h/vocabulary.html' },
          { title: 'English Club – Vocabulary Quizzes', url: 'http://www.englishclub.com/esl-quizzes/vocabulary-quizzes.htm' },
        ],
      },
      {
        label: 'Écoute',
        icon: Headphones,
        links: [
          { title: 'British Council – Listening C1', url: 'https://learnenglish.britishcouncil.org/skills/listening/advanced-c1' },
          { title: 'ESL Bits', url: 'https://esl-bits.eu/home.html' },
          { title: 'ELLLO', url: 'https://elllo.org/' },
        ],
      },
      {
        label: 'Expression orale',
        icon: Mic,
        links: [
          { title: 'Daily ESL', url: 'https://www.dailyesl.com/' },
        ],
      },
      {
        label: 'Lecture',
        icon: BookOpen,
        links: [
          { title: 'British Council – Reading C1', url: 'https://learnenglish.britishcouncil.org/reading/advanced-c1-reading' },
        ],
      },
    ],
  },
  advanced: {
    name: 'Advanced', code: 'C1', accent: 'red',
    desc: 'Perfectionnez votre anglais avec des contenus authentiques.',
    categories: [
      {
        label: 'Grammaire',
        icon: BookOpen,
        links: [
          { title: 'Englisch-Hilfen – Grammar', url: 'https://www.englisch-hilfen.de/en/inhalt_grammar.htm' },
          { title: 'Isabel Pérez – Grammar', url: 'http://www.isabelperez.com/grammar.htm' },
          { title: 'English Club – Grammar Quizzes', url: 'http://www.englishclub.com/esl-quizzes/grammar-quizzes.htm' },
          { title: 'Oxford Practice Grammar – Advanced', url: 'https://elt.oup.com/student/practicegrammar/advanced/?cc=global&selLanguage=en' },
        ],
      },
      {
        label: 'Vocabulaire',
        icon: PenTool,
        links: [
          { title: 'Englisch-Hilfen – Words', url: 'https://www.englisch-hilfen.de/en/words_inhalt.htm' },
          { title: 'A4ESL – Vocabulary', url: 'http://a4esl.org/q/h/vocabulary.html' },
          { title: 'ESL Gold – Advanced Vocabulary', url: 'https://www.eslgold.com/vocabulary/advanced' },
          { title: 'English Club – Vocabulary', url: 'http://www.englishclub.com/vocabulary/index.htm' },
          { title: 'ESL Gold – Academic Quiz', url: 'https://eslgold.com/vocabulary/academic_quiz/' },
        ],
      },
      {
        label: 'Écoute',
        icon: Headphones,
        links: [
          { title: 'British Council – Listening C1', url: 'https://learnenglish.britishcouncil.org/skills/listening/advanced-c1' },
          { title: 'ESL Bits', url: 'https://esl-bits.eu/home.html' },
          { title: 'ELLLO', url: 'https://elllo.org/' },
        ],
      },
      {
        label: 'Expression orale',
        icon: Mic,
        links: [
          { title: 'Daily ESL', url: 'https://www.dailyesl.com/' },
          { title: 'ESL Gold – Advanced Speaking', url: 'https://www.eslgold.com/speaking/advanced' },
        ],
      },
      {
        label: 'Lecture',
        icon: BookOpen,
        links: [
          { title: 'British Council – Reading C1', url: 'https://learnenglish.britishcouncil.org/reading/advanced-c1-reading' },
          { title: 'ESL Gold – Advanced Reading', url: 'https://www.eslgold.com/reading/advanced' },
          { title: 'Project Gutenberg', url: 'https://www.gutenberg.org/' },
        ],
      },
      {
        label: 'Écriture',
        icon: PenTool,
        links: [
          { title: 'British Council – Writing C1', url: 'https://learnenglish.britishcouncil.org/writing/advanced-c1-writing' },
        ],
      },
      {
        label: 'Prononciation',
        icon: Mic,
        links: [
          { title: 'Isabel Pérez – Pronunciation', url: 'http://www.isabelperez.com/grammar.htm#pron' },
        ],
      },
    ],
  },
  aviation: {
    name: 'Aviation English', code: 'AVI', accent: 'cyan',
    desc: 'Phraséologie et communications aériennes pour les professionnels de l\'aviation.',
    categories: [
      {
        label: 'Ressources principales',
        icon: Globe,
        links: [
          { title: 'Going Airside', url: 'http://www.goingairside.com/' },
          { title: 'ICAO – Site officiel', url: 'https://www.icao.int/Pages/default.aspx' },
          { title: 'ICAO English Test Sample Questions', url: 'https://aviationenglish.com/icao-english-test-questions/sample-questions-for-the-icao-english-test-personal-information' },
          { title: 'Revise Before Flight', url: 'https://www.revisebeforeflight.com/' },
          { title: 'Aviation English Vocabulary', url: 'https://english4aviation.pbworks.com/w/page/24013737/Vocabulary%20Resource' },
        ],
      },
      {
        label: 'Écoute – Dialectes',
        icon: Headphones,
        links: [
          { title: 'FluentU – Listen to English', url: 'https://www.fluentu.com/blog/english/listen-to-english/' },
          { title: 'Dialects Archive', url: 'https://www.dialectsarchive.com/test-your-english-comprehension' },
          { title: 'Sound Comparisons – Englishes', url: 'https://soundcomparisons.com/#/en/Englishes/map/daughter/Lgs_Sln' },
        ],
      },
      {
        label: 'Podcasts & Blogs',
        icon: Video,
        links: [
          { title: 'Airplane Geeks Podcast', url: 'http://www.airplanegeeks.com/' },
          { title: 'The Finer Points – Podcasts', url: 'https://www.learnthefinerpoints.com/podcast/?Podcasts=all' },
          { title: 'Aviation English Blog', url: 'https://aviationenglishasia.wordpress.com/2010/07/04/free-aviation-english-for-pilots-and-controllers/' },
        ],
      },
      {
        label: 'Ressources techniques',
        icon: BookOpen,
        links: [
          { title: 'See How It Flies', url: 'https://www.av8n.com/how/' },
          { title: 'Pilot Friend', url: 'https://www.pilotfriend.com/' },
          { title: 'Skybrary Aviation Safety', url: 'https://www.skybrary.aero/' },
          { title: 'Live ATC', url: 'http://liveatc.net/' },
          { title: 'Airport Technology', url: 'https://www.airport-technology.com' },
          { title: 'ATC Network', url: 'https://www.atc-network.com' },
          { title: 'Aviation Week', url: 'https://aviationweek.com/' },
        ],
      },
    ],
  },
  business: {
    name: 'Business English', code: 'BUS', accent: 'emerald',
    desc: 'Anglais professionnel pour les réunions, emails et présentations.',
    categories: [
      {
        label: 'Ressources Business',
        icon: Globe,
        links: [
          { title: 'BBC Learning English – Business', url: 'https://www.bbc.co.uk/learningenglish/english/features/the-english-we-speak' },
          { title: 'Business English Pod', url: 'https://www.businessenglishpod.com/' },
          { title: 'English Club – Business', url: 'https://www.englishclub.com/business-english/' },
          { title: 'BBC 6-Minute Business', url: 'https://www.bbc.co.uk/learningenglish/english/features/6-minute-english' },
        ],
      },
      {
        label: 'Écoute & Expression orale',
        icon: Headphones,
        links: [
          { title: 'British Council – Listening B2', url: 'https://learnenglish.britishcouncil.org/skills/listening/upper-intermediate-b2' },
          { title: 'ELLLO Business', url: 'https://elllo.org/' },
        ],
      },
      {
        label: 'Écriture professionnelle',
        icon: PenTool,
        links: [
          { title: 'British Council – Writing B2', url: 'https://learnenglish.britishcouncil.org/writing/upper-intermediate-b2-writing' },
          { title: 'Oxford Business English', url: 'https://www.oup.com/elt/catalogue/business-english/?cc=global&selLanguage=en' },
        ],
      },
    ],
  },
  cae: {
    name: 'C1 Advanced (CAE)', code: 'CAE', accent: 'purple',
    desc: 'Préparation intensive à la certification Cambridge C1 Advanced.',
    categories: [
      {
        label: 'Préparation officielle',
        icon: Globe,
        links: [
          { title: 'Cambridge English – C1 Advanced', url: 'https://www.cambridgeenglish.org/exams-and-tests/advanced/' },
          { title: 'Cambridge English – C1 Advanced', url: 'https://www.cambridgeenglish.org/exams-and-tests/qualifications/advanced/' },
          { title: 'Exam English – CAE Practice', url: 'https://www.examenglish.com/CAE/index.php' },
          { title: 'Test English – CAE', url: 'https://test-english.com/exams/cambridge-advanced/' },
        ],
      },
      {
        label: 'Grammaire & Vocabulaire',
        icon: BookOpen,
        links: [
          { title: 'Oxford Practice Grammar – Advanced', url: 'https://elt.oup.com/student/practicegrammar/advanced/?cc=global&selLanguage=en' },
          { title: 'Englisch-Hilfen', url: 'https://www.englisch-hilfen.de/en/inhalt_grammar.htm' },
        ],
      },
      {
        label: 'Écoute',
        icon: Headphones,
        links: [
          { title: 'British Council – Listening C1', url: 'https://learnenglish.britishcouncil.org/skills/listening/advanced-c1' },
        ],
      },
      {
        label: 'Lecture & Écriture',
        icon: PenTool,
        links: [
          { title: 'British Council – Reading C1', url: 'https://learnenglish.britishcouncil.org/reading/advanced-c1-reading' },
          { title: 'British Council – Writing C1', url: 'https://learnenglish.britishcouncil.org/writing/advanced-c1-writing' },
          { title: 'Project Gutenberg', url: 'https://www.gutenberg.org/' },
        ],
      },
    ],
  },
  ielts: {
    name: 'IELTS Preparation', code: 'IELTS', accent: 'coral',
    desc: 'Atteignez le score IELTS visé grâce à des tests et exercices officiels.',
    categories: [
      {
        label: 'Sites officiels',
        icon: Globe,
        links: [
          { title: 'IELTS.org – Site officiel', url: 'https://www.ielts.org' },
          { title: 'IDP IELTS – Préparation', url: 'https://ielts.idp.com/prepare' },
          { title: 'British Council – Free Practice Tests', url: 'https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-practice-tests' },
          { title: 'IDP IELTS – Prepare', url: 'https://idpielts.me/prepare/' },
        ],
      },
      {
        label: 'Tests pratiques',
        icon: BookOpen,
        links: [
          { title: 'Exam English – IELTS Tests', url: 'https://www.examenglish.com/IELTS/index.php' },
          { title: 'Test English – IELTS', url: 'https://test-english.com/exams/ielts/' },
          { title: 'IELTS Online Tests', url: 'https://ieltsonlinetests.com/ielts-exam-library' },
          { title: 'IELTS Exam – Practice Tests', url: 'https://www.ielts-writing.info/EXAM/practice_tests/' },
          { title: 'Mini IELTS', url: 'https://mini-ielts.com/' },
          { title: 'Exam English IELTS', url: 'https://www.examenglish.com/IELTS/index.html' },
          { title: 'IELTS Blog – Online Tests', url: 'https://www.ielts-blog.com/ielts-online-practice-tests/' },
        ],
      },
      {
        label: 'Guides & Préparation',
        icon: PenTool,
        links: [
          { title: 'IELTS Buddy', url: 'https://www.ieltsbuddy.com/' },
          { title: 'IELTS Up – Listening Practice', url: 'https://ielts-up.com/listening/ielts-listening-practice.html' },
          { title: 'Daily Dictation – IELTS Listening', url: 'https://dailydictation.com/exercises/ielts-listening' },
          { title: 'English Online – Exams', url: 'https://www.english-online.org.uk/exam.htm' },
        ],
      },
    ],
  },
}

export const ICON_MAP: Record<string, typeof BookOpen> = {
  'Grammaire': BookOpen,
  'Vocabulaire': PenTool,
  'Écoute': Headphones,
  'Écoute – Dialectes': Headphones,
  'Expression orale': Mic,
  'Lecture': BookOpen,
  'Écriture': PenTool,
  'Prononciation': Mic,
  'Anglais général': Globe,
  'Ressources principales': Globe,
  'Ressources Business': Globe,
  'Sites officiels': Globe,
}

/**
 * Forme canonique d'une URL pour l'identité d'une ressource.
 * Ignore : protocole, casse de l'hôte, préfixe `www.`, `/` final avant `?`/`#`.
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  const match = trimmed.match(/^[a-z][a-z0-9+.-]*:\/\/([^/?#]*)(.*)$/i)
  const host = (match ? match[1] : '').toLowerCase().replace(/^www\./, '')
  let rest = match ? match[2] : trimmed
  // retire le « / » final du chemin, sans toucher à la requête ni au fragment
  rest = rest.replace(/\/+(?=([?#]|$))/, '')
  return host + rest
}

/** Hachage FNV-1a 32 bits, déterministe dans le navigateur comme dans Node. */
function fnv1a(value: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36).padStart(7, '0')
}

/** Slug ASCII, lisible par un humain qui parcourt la table. */
function slugify(value: string, max: number): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/, '')
}

/**
 * Identifiant stable d'une ressource : `<slug lisible>~<hash>`.
 * Le slug aide à lire la base ; le hash de l'URL normalisée garantit
 * l'unicité même quand le slug est tronqué. Toujours ≤ 100 caractères.
 */
export function resourceId(url: string): string {
  const canonical = normalizeUrl(url)
  return `${slugify(canonical, 90)}~${fnv1a(canonical)}`
}

/** Nombre d'emplacements de ressources d'un niveau (une même page peut figurer dans plusieurs niveaux). */
export function levelResourceCount(levelSlug: string): number {
  const level = levelData[levelSlug]
  if (!level) return 0
  return level.categories.reduce((total, cat) => total + cat.links.length, 0)
}

/** Identifiants d'un niveau, dans l'ordre d'affichage. */
export function levelResourceIds(levelSlug: string): string[] {
  const level = levelData[levelSlug]
  if (!level) return []
  return level.categories.flatMap(cat => cat.links.map(l => resourceId(l.url)))
}

/** Identifiants distincts de tout le catalogue. */
export function allResourceIds(): string[] {
  return Array.from(new Set(Object.keys(levelData).flatMap(levelResourceIds)))
}

/** Nombre de ressources distinctes du catalogue (une page listée à 5 niveaux compte une fois). */
export function totalResourceCount(): number {
  return allResourceIds().length
}

export type ResourceLocation = {
  id: string
  levelSlug: string
  levelName: string
  accent: string
  category: string
  title: string
  url: string
}

/** Premier emplacement d'une ressource dans le catalogue, ou `null` si elle a été retirée. */
export function findResource(id: string): ResourceLocation | null {
  for (const [levelSlug, level] of Object.entries(levelData)) {
    for (const cat of level.categories) {
      for (const link of cat.links) {
        if (resourceId(link.url) === id) {
          return {
            id,
            levelSlug,
            levelName: level.name,
            accent: level.accent,
            category: cat.label,
            title: link.title,
            url: link.url,
          }
        }
      }
    }
  }
  return null
}
