document.addEventListener('DOMContentLoaded', async () => {

  let DB_DATA = {};
  let PAGE_DATA = {};
  let currentLang = localStorage.getItem('userLanguage') || 'fr'; // Default to French
  let showdownConverter;

  const translations = {
      en: {
          navLogo: "EduMaroc",
          navHome: "Home",
          navAbout: "About Us",
          navPrivacy: "Privacy",
          searchPlaceholder: "Search for lessons, exercises...",
          pageTitleHome: "EduMaroc - Your Learning Platform",
          pageTitleSubject: "Subject - EduMaroc",
          pageTitleContent: "Content - EduMaroc",
          footerCopyright: "&copy; 2025 EduMaroc. All rights reserved.",
          errorTitle: "Content Error:",
          errorMessage: "We couldn't load the necessary content for the site.",
          errorSuggestion: "Please check your network connection.",
          lessons: "Lessons",
          exercises: "Exercises",
          summaries: "Summaries",
          solutionTitle: "Solution",
          showSolutionBtn: "Solution",
          hideSolutionBtn: "Hide Solution",
          emptyContent: "Content for this section will be added soon."
      },
      fr: {
          navLogo: "EduMaroc",
          navHome: "Accueil",
          navAbout: "À Propos",
          navPrivacy: "Confidentialité",
          searchPlaceholder: "Rechercher des leçons, exercices...",
          pageTitleHome: "EduMaroc - Votre Plateforme d'Apprentissage",
          pageTitleSubject: "Matière - EduMaroc",
          pageTitleContent: "Contenu - EduMaroc",
          footerCopyright: "&copy; 2025 EduMaroc. Tous droits réservés.",
          errorTitle: "Erreur de Contenu :",
          errorMessage: "Nous n'avons pas pu charger le contenu nécessaire pour le site.",
          errorSuggestion: "Veuillez vérifier votre connexion réseau.",
          lessons: "Leçons",
          exercises: "Exercices",
          summaries: "Résumés",
          solutionTitle: "Solution",
          showSolutionBtn: "Solution",
          hideSolutionBtn: "Cacher la Solution",
          emptyContent: "Le contenu de cette section sera bientôt ajouté."
      },
      ar: {
          navLogo: "EduMaroc",
          navHome: "الرئيسية",
          navAbout: "من نحن",
          navPrivacy: "الخصوصية",
          searchPlaceholder: "ابحث عن دروس، تمارين...",
          pageTitleHome: "EduMaroc - منصتك التعليمية",
          pageTitleSubject: "مادة - EduMaroc",
          pageTitleContent: "محتوى - EduMaroc",
          footerCopyright: "&copy; 2025 EduMaroc. جميع الحقوق محفوظة.",
          errorTitle: "خطأ في المحتوى:",
          errorMessage: "لم نتمكن من تحميل المحتوى اللازم للموقع.",
          errorSuggestion: "يرجى التحقق من اتصالك بالشبكة.",
          lessons: "الدروس",
          exercises: "التمارين",
          summaries: "الملخصات",
          solutionTitle: "الحل",
          showSolutionBtn: "الحل",
          hideSolutionBtn: "إخفاء الحل",
          emptyContent: "سيتم إضافة المحتوى لهذا القسم قريبا."
      }
  };

  function getTranslated(obj, lang) {
      if (!obj) return '';
      return obj[lang] || obj['fr'] || obj['en'] || '';
  }

  async function fetchJsonData(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) { throw new Error(`Network response was not ok for ${path}.`); }
        return await response.json();
    } catch (e) {
        console.error(`Could not fetch ${path}.`, e);
        return null; 
    }
  }

  function displayGlobalError(lang) {
      const t = translations[lang] || translations.en;
      const errorDiv = document.createElement('div');
      errorDiv.className = 'global-error';
      errorDiv.innerHTML = `<p><strong>${t.errorTitle}</strong> ${t.errorMessage} ${t.suggestion}</p>`;
      document.body.prepend(errorDiv);
  }

  function populateStaticTranslations(lang) {
    const t = translations[lang] || translations.en;
    document.querySelectorAll('[data-translate-key]').forEach(el => {
      const key = el.dataset.translateKey;
      if (t[key]) {
        if (el.tagName === 'INPUT' && el.type === 'search') {
          el.placeholder = t[key];
        } else {
          el.innerHTML = t[key];
        }
      }
    });
    const pageTitleEl = document.querySelector('title[data-translate-key]');
    if(pageTitleEl) { document.title = t[pageTitleEl.dataset.translateKey]; }
  }
  
  function populatePageContent(lang) {
    if (!PAGE_DATA) return;
    const content = PAGE_DATA[lang] || PAGE_DATA.fr || PAGE_DATA.en;
    if (!content) return;
    
    document.querySelectorAll('[data-page-prop]').forEach(el => {
        const key = el.dataset.pageProp;
        if (content[key] !== undefined) {
           if(el.dataset.isMarkdown && showdownConverter) {
             el.innerHTML = showdownConverter.makeHtml(content[key]);
           } else {
             el.innerHTML = content[key];
           }
        }
    });
  }
  
  function renderHomePage(subjects, lang) {
    const container = document.getElementById('subjects-grid-container');
    if (!container) return;
    container.innerHTML = subjects.map(subject => `
      <a href="./subject.html?id=${subject.id}" class="subject-card-link">
        <div class="subject-card" style="background-image: linear-gradient(rgba(18, 18, 18, 0.7), rgba(18, 18, 18, 0.7)), url('${subject.backgroundImage}');">
          <h2 class="subject-card-title">${getTranslated(subject.name, lang)}</h2>
        </div>
      </a>
    `).join('');
  }

  function renderSubjectPage(subject, lang) {
      if (subject.primaryColor) {
        document.body.style.setProperty('--subject-primary-color', subject.primaryColor);
      }
      const t = translations[lang];
      document.title = `${getTranslated(subject.name, lang)} - ${t.pageTitleSubject}`;

      const titleHeader = document.getElementById('subject-title-header');
      if (titleHeader) titleHeader.textContent = getTranslated(subject.name, lang);
      
      const container = document.getElementById('levels-container');
      if (!container) return;
      
      container.innerHTML = subject.levels.map(level => {
          const createList = (items, type) => {
              if (!items || items.length === 0) {
                  return `<p class="empty-content">${t.emptyContent}</p>`;
              }
              return `<ul>${items.map(item => `
                  <li><a href="./content.html?subject=${subject.id}&level=${level.id}&type=${type}&id=${item.id}">${getTranslated(item.title, lang)}</a></li>
              `).join('')}</ul>`;
          };

          return `
              <section class="level-section">
                  <h2 class="level-title">${getTranslated(level.name, lang)}</h2>
                  <div class="content-category">
                      <h3>${t.lessons}</h3>
                      ${createList(level.lessons, 'lessons')}
                  </div>
                  <div class="content-category">
                      <h3>${t.exercises}</h3>
                      ${createList(level.exercises, 'exercises')}
                  </div>
                   <div class="content-category">
                      <h3>${t.summaries}</h3>
                      ${createList(level.summaries, 'summaries')}
                  </div>
              </section>
          `;
      }).join('');
  }

  function renderContentPage(item, subject, level, type, lang) {
      const t = translations[lang];
      if (subject.primaryColor) {
        document.body.style.setProperty('--subject-primary-color', subject.primaryColor);
      }
      document.title = `${getTranslated(item.title, lang)} - ${t.pageTitleContent}`;

      const bgHeader = document.getElementById('content-bg-header');
      if(bgHeader && item.backgroundImage) {
          bgHeader.style.backgroundImage = `url('${item.backgroundImage}')`;
      } else if (bgHeader) {
          bgHeader.style.display = 'none';
      }

      const breadcrumbsContainer = document.getElementById('breadcrumbs-container');
      if(breadcrumbsContainer) {
          breadcrumbsContainer.innerHTML = `
              <a href="./index.html" data-translate-key="navHome">${t.navHome}</a> &raquo;
              <a href="./subject.html?id=${subject.id}">${getTranslated(subject.name, lang)}</a> &raquo;
              <span>${getTranslated(level.name, lang)}</span>
          `;
      }

      const contentTitle = document.getElementById('content-title');
      if(contentTitle) contentTitle.textContent = getTranslated(item.title, lang);

      const contentMain = document.getElementById('content-main');
      if (contentMain) {
          const contentText = getTranslated(item.content, lang);
          if (contentText && typeof contentText === 'string') {
              if (showdownConverter) {
                  try {
                      contentMain.innerHTML = showdownConverter.makeHtml(contentText);
                  } catch (e) {
                      console.error("Showdown conversion failed:", e);
                      contentMain.innerText = contentText; // Fallback to plain text
                  }
              } else {
                  console.error("Showdown converter not available.");
                  contentMain.innerText = contentText; // Fallback to plain text
              }
          } else {
              contentMain.innerHTML = `<p class="empty-content">${t.emptyContent}</p>`;
          }
      }


      const solutionFab = document.getElementById('solution-fab');
      const solutionContainer = document.getElementById('solution-container');
      if (type === 'exercises' && item.solution) {
          if (solutionFab) solutionFab.style.display = 'flex';
          const solutionContent = document.getElementById('solution-content');
          const solutionText = getTranslated(item.solution, lang);

          if(solutionContent && solutionText && showdownConverter) {
            solutionContent.innerHTML = showdownConverter.makeHtml(solutionText);
          } else if (solutionContent) {
            solutionContent.innerText = solutionText || '';
          }
      } else {
          if (solutionFab) solutionFab.style.display = 'none';
          if (solutionContainer) solutionContainer.style.display = 'none';
      }
  }

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('userLanguage', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    // Reset any subject-specific theme when changing language globally
    document.body.style.removeProperty('--subject-primary-color');

    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        if(lang === 'fr') langToggle.textContent = 'العربية';
        else if (lang === 'ar') langToggle.textContent = 'English';
        else langToggle.textContent = 'Français';
    }

    populateStaticTranslations(lang);
    
    const bodyId = document.body.id;
    if (bodyId.endsWith('-page')) populatePageContent(lang);
    
    if (!DB_DATA.subjects) return;

    if (bodyId === 'home-page') {
      renderHomePage(DB_DATA.subjects, lang);
    }
    else if (bodyId === 'subject-page') {
        const subjectId = new URLSearchParams(window.location.search).get('id');
        const subject = DB_DATA.subjects.find(s => s.id === subjectId);
        if(subject) renderSubjectPage(subject, lang);
    }
    else if (bodyId === 'content-page') {
        const params = new URLSearchParams(window.location.search);
        const subjectId = params.get('subject');
        const levelId = params.get('level');
        const type = params.get('type');
        const itemId = params.get('id');
        
        const subject = DB_DATA.subjects.find(s => s.id === subjectId);
        const level = subject?.levels.find(l => l.id === levelId);
        const item = level?.[type]?.find(i => i.id === itemId);

        if(item && subject && level) renderContentPage(item, subject, level, type, lang);
    }
  }
  
  function getNextLang(current) {
      if (current === 'fr') return 'ar';
      if (current === 'ar') return 'en';
      return 'fr';
  }

  function setActiveNav() {
      const currentPage = window.location.pathname.split("/").pop();
      document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
      let activeId;
      switch(currentPage) {
        case '': case 'index.html': activeId = 'nav-home'; break;
        case 'about.html': activeId = 'nav-about'; break;
        case 'privacy.html': activeId = 'nav-privacy'; break;
      }
      if (activeId) document.getElementById(activeId)?.classList.add('active');
  }

  function initializeEventListeners() {
      const langToggle = document.getElementById('lang-toggle');
      if (langToggle) {
        langToggle.addEventListener('click', (e) => { e.preventDefault(); setLanguage(getNextLang(currentLang)); });
      }

      const navToggle = document.querySelector('.nav-toggle');
      const navMenu = document.querySelector('.nav-menu');
      if (navToggle && navMenu) {
          navToggle.addEventListener('click', () => { navMenu.classList.toggle('active'); navToggle.classList.toggle('active'); });
      }

      const solutionFab = document.getElementById('solution-fab');
      if (solutionFab) {
          solutionFab.addEventListener('click', () => {
              const solutionContainer = document.getElementById('solution-container');
              const fabText = solutionFab.querySelector('.fab-text');
              const t = translations[currentLang];
              const isVisible = solutionContainer.style.display === 'block';
              solutionContainer.style.display = isVisible ? 'none' : 'block';
              fabText.textContent = isVisible ? t.showSolutionBtn : t.hideSolutionBtn;
              if (!isVisible) {
                  solutionContainer.scrollIntoView({ behavior: 'smooth' });
              }
          });
      }
  }
  
  async function loadSharedComponents() {
      try {
          const response = await fetch('nav.html');
          if (!response.ok) throw new Error('Shared components (nav.html) not found');
          const componentsHtml = await response.text();
          document.body.insertAdjacentHTML('afterbegin', componentsHtml);
          // Initialize showdown converter here to ensure it's available for all rendering functions
          if (window.showdown) {
              showdownConverter = new showdown.Converter({tables: true, simplifiedAutoLink: true, openLinksInNewWindow: true});
          } else {
              console.error("Showdown library not loaded.");
          }
      } catch (error) {
          console.error('Failed to load shared components:', error);
      }
  }
  
  async function initializeApp() {
    await loadSharedComponents();
    
    const bodyId = document.body.id;
    let pageDataPath;
    if (bodyId === 'home-page') pageDataPath = 'home.json';
    else if (bodyId === 'about-page') pageDataPath = 'about.json';
    else if (bodyId === 'privacy-page') pageDataPath = 'privacy.json';

    const [dbData, pageData] = await Promise.all([
        fetchJsonData('database.json'),
        pageDataPath ? fetchJsonData(pageDataPath) : Promise.resolve({})
    ]);

    if (!dbData) {
        displayGlobalError(currentLang);
        return;
    }

    DB_DATA = dbData;
    PAGE_DATA = pageData || {};

    setLanguage(currentLang);
    setActiveNav();
    initializeEventListeners();
  }

  initializeApp();
});