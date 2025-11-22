


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
          metaDescriptionSubject: "Explore lessons, exercises, and summaries for {subjectName} on EduMaroc, your platform for the Moroccan curriculum.",
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
          emptyContent: "Content for this section will be added soon.",
          noContentForSubject: "Content for this subject will be added soon. Please check back later.",
          noResults: "No results found."
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
          metaDescriptionSubject: "Explorez les leçons, exercices et résumés pour la matière {subjectName} sur EduMaroc, votre plateforme pour le programme marocain.",
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
          emptyContent: "Le contenu de cette section sera bientôt ajouté.",
          noContentForSubject: "Le contenu de cette matière sera bientôt ajouté. Veuillez revenir plus tard.",
          noResults: "Aucun résultat trouvé."
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
          metaDescriptionSubject: "استكشف الدروس والتمارين والملخصات لمادة {subjectName} على EduMaroc، منصتك للمنهاج المغربي.",
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
          emptyContent: "سيتم إضافة المحتوى لهذا القسم قريبا.",
          noContentForSubject: "سيتم إضافة محتوى لهذه المادة قريبا. يرجى المراجعة لاحقا.",
          noResults: "لا توجد نتائج."
      }
  };

  function getTranslated(item, lang, property = 'content') {
      if (!item) return '';

      const textObject = item[property];
      if (typeof textObject !== 'object' || textObject === null) {
          const value = textObject?.[lang] || item[property];
          return (typeof value === 'string') ? value : '';
      }

      let targetText = textObject[lang] || textObject.fr || '';
      if (typeof targetText !== 'string') return '';
      
      const isTranslatableContent = (property === 'content' || property === 'solution');

      // Case 1: The item uses the modern `images` map with placeholders.
      if (isTranslatableContent && item.images && Object.keys(item.images).length > 0) {
          targetText = targetText.replace(/%%IMAGE_\d+%%/g, (placeholder) => {
              const imageData = item.images[placeholder];
              if (imageData && imageData.filename) {
                  return `![${imageData.prompt || 'image'}](${imageData.filename})`;
              }
              return ''; // Hide placeholder if image isn't uploaded yet
          });
      }
      // Case 2: Legacy content where images are only in French markdown.
      // We inject the French images into the translated text.
      else if (isTranslatableContent && lang !== 'fr' && textObject.fr) {
          const frenchText = textObject.fr;
          // Find all full markdown image tags in the French text
          const frenchImages = frenchText.match(/!\[.*?\]\(.*?\)/g) || [];
          
          if (frenchImages.length > 0) {
              // Replace placeholders in the target text with actual image tags from French
              let imageIndex = 0;
              targetText = targetText.replace(/%%IMAGE_\d+%%/g, () => {
                  if (imageIndex < frenchImages.length) {
                      return frenchImages[imageIndex++];
                  }
                  return ''; // Not enough images in French source, remove placeholder
              });
          }
      }

      return targetText;
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

  function setMetaDescription(description) {
    if (!description) return;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
  }

  function displayGlobalError(lang) {
      const t = translations[lang] || translations.en;
      const errorDiv = document.createElement('div');
      errorDiv.className = 'global-error';
      errorDiv.innerHTML = `<p><strong>${t.errorTitle}</strong> ${t.errorMessage} ${t.errorSuggestion}</p>`;
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
          <h2 class="subject-card-title">${getTranslated(subject, lang, 'name')}</h2>
        </div>
      </a>
    `).join('');
  }

  function renderSubjectPage(subject, lang) {
      if (subject.primaryColor) {
        document.body.style.setProperty('--subject-primary-color', subject.primaryColor);
      }
      const t = translations[lang];
      const subjectName = getTranslated(subject, lang, 'name');
      document.title = `${subjectName} - ${t.pageTitleSubject}`;
      setMetaDescription(t.metaDescriptionSubject.replace('{subjectName}', subjectName));

      const titleHeader = document.getElementById('subject-title-header');
      if (titleHeader) titleHeader.textContent = subjectName;
      
      const container = document.getElementById('levels-container');
      if (!container) return;
      
      const levelHasVisibleContent = (level) => {
        return level.lessons && level.lessons.some(item => item.status === 'verified' || item.status === undefined);
      };

      const visibleLevels = subject.levels.filter(levelHasVisibleContent);

      if (visibleLevels.length === 0) {
          container.innerHTML = `<p class="empty-content" style="text-align: center; font-size: 1.1rem; padding: 40px 20px;">${t.noContentForSubject}</p>`;
          return;
      }

      const createAssociatedList = (items, type, subjectId, levelId, lang) => {
        if (!items || items.length === 0) return '';
        const visibleItems = items.filter(item => item.status === 'verified' || item.status === undefined);
        if (visibleItems.length === 0) return '';
        return `
            <h4 class="content-list-title">${t[type]}</h4>
            <ul>${visibleItems.map(item => `
                <li><a href="./content.html?subject=${subjectId}&level=${levelId}&type=${type}&id=${item.id}">${getTranslated(item, lang, 'title')}</a></li>
            `).join('')}</ul>`;
      };
      
      container.innerHTML = visibleLevels.map((level, index) => {
          // Filter logic updated: Show all verified lessons regardless of title
          const visibleLessons = (level.lessons || []).filter(l => (l.status === 'verified' || l.status === undefined));

          if (visibleLessons.length === 0) return '';

          return `
            <section class="level-section">
                <h2 class="level-title">${getTranslated(level, lang, 'name')}</h2>
                ${visibleLessons.map((lesson, lessonIndex) => {
                    const lessonExercises = (level.exercises || []).filter(e => e.lessonId === lesson.id);
                    const lessonSummaries = (level.summaries || []).filter(s => s.lessonId === lesson.id);
                    
                    const exercisesList = createAssociatedList(lessonExercises, 'exercises', subject.id, level.id, lang);
                    const summariesList = createAssociatedList(lessonSummaries, 'summaries', subject.id, level.id, lang);
                    
                    const hasAssociatedContent = exercisesList || summariesList;

                    // Removed 'open' attribute from the first accordion per user request
                    return `
                      <details class="lesson-accordion">
                        <summary class="lesson-accordion-title">
                          <a href="./content.html?subject=${subject.id}&level=${level.id}&type=lessons&id=${lesson.id}">${getTranslated(lesson, lang, 'title')}</a>
                        </summary>
                        <div class="lesson-accordion-content">
                          ${hasAssociatedContent ? `
                              <div class="lesson-associated-content">
                                  ${exercisesList}
                                  ${summariesList}
                              </div>
                          ` : `<p class="empty-content" style="padding: 10px 0;">${t.emptyContent}</p>`}
                        </div>
                      </details>
                    `;
                }).join('')}
            </section>
          `;
      }).join('');
  }


  function renderContentPage(item, subject, level, type, lang) {
      const t = translations[lang];
      if (subject.primaryColor) {
        document.body.style.setProperty('--subject-primary-color', subject.primaryColor);
      }
      
      const itemTitle = getTranslated(item, lang, 'title');
      document.title = `${itemTitle} - ${t.pageTitleContent}`;
      
      let contentText = getTranslated(item, lang, 'content');
      if (contentText && typeof contentText === 'string') {
        const snippet = contentText.substring(0, 150).replace(/#|\*|\[.*\]\(.*\)|%%IMAGE_\d+%%/g, '').replace(/\s+/g, ' ').trim() + '...';
        setMetaDescription(`${itemTitle}: ${snippet}`);
      }


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
              <a href="./subject.html?id=${subject.id}">${getTranslated(subject, lang, 'name')}</a> &raquo;
              <span>${getTranslated(level, lang, 'name')}</span>
          `;
      }

      const contentTitle = document.getElementById('content-title');
      if(contentTitle) contentTitle.textContent = itemTitle;

      const contentMain = document.getElementById('content-main');
      if (contentMain) {
          let htmlContent = '';

          // 1. Render Markdown Content
          if (contentText && typeof contentText === 'string') {
              if (showdownConverter) {
                  try {
                      htmlContent += showdownConverter.makeHtml(contentText);
                  } catch (e) {
                      console.error("Showdown conversion failed:", e);
                      htmlContent += contentText; // Fallback to plain text
                  }
              } else {
                  console.error("Showdown converter not available.");
                  htmlContent += contentText; // Fallback to plain text
              }
          } else {
              htmlContent += `<p class="empty-content">${t.emptyContent}</p>`;
          }

          // 2. Render YouTube Video AT THE END if ID is present and valid
          if (item.youtubeVideoId && typeof item.youtubeVideoId === 'string' && item.youtubeVideoId.trim() !== '') {
              htmlContent += `
                <div class="video-container" style="margin-top: 30px; width: 100%;">
                    <iframe src="https://www.youtube.com/embed/${item.youtubeVideoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width: 100%; height: 100%;"></iframe>
                </div>
              `;
          }
          
          contentMain.innerHTML = htmlContent;
      }


      const solutionFab = document.getElementById('solution-fab');
      const solutionContainer = document.getElementById('solution-container');
      if (item.solution && (item.solution.fr || item.solution[lang])) {
          if (solutionFab) solutionFab.style.display = 'flex';
          const solutionContent = document.getElementById('solution-content');
          const solutionText = getTranslated(item, lang, 'solution');

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

  function normalizeText(text, lang) {
    if (!text) return '';
    text = text.toLowerCase(); // Basic normalization for all
    if (lang === 'ar') {
        // Remove diacritics, normalize Alef, Yaa, and Teh marbuta
        return text
            .replace(/[\u064B-\u0652]/g, "") 
            .replace(/[أإآ]/g, "ا")
            .replace(/ى/g, "ي")
            .replace(/ة/g, "ه");
    }
    return text;
  }

  function searchContent(query, lang) {
    const results = {};
    if (!DB_DATA.subjects) return results;

    const normalizedQuery = normalizeText(query, lang);

    DB_DATA.subjects.forEach(subject => {
        if (!subject.levels) return;
        
        const subjectMatches = [];
        const addedItems = new Set(); // Use a Set to track added item IDs to prevent duplicates
        const contentTypes = ['lessons', 'exercises', 'summaries'];
        
        subject.levels.forEach(level => {
            contentTypes.forEach(type => {
                if (!level[type]) return;
                
                level[type].forEach(item => {
                    if (addedItems.has(item.id)) return; // Skip if already added

                    const title = getTranslated(item, lang, 'title');
                    const content = getTranslated(item, lang, 'content');
                    const solution = (type === 'exercises') ? getTranslated(item, lang, 'solution') : '';

                    const normalizedTitle = normalizeText(title, lang);
                    const normalizedContent = normalizeText(content, lang);
                    const normalizedSolution = normalizeText(solution, lang);
                    
                    const isVerified = item.status === 'verified' || item.status === undefined;
                    const queryFound = normalizedTitle.includes(normalizedQuery) ||
                                        normalizedContent.includes(normalizedQuery) ||
                                        normalizedSolution.includes(normalizedQuery);

                    if (isVerified && queryFound) {
                        subjectMatches.push({ ...item, type, levelId: level.id, subjectId: subject.id });
                        addedItems.add(item.id); // Mark as added
                    }
                });
            });
        });
        
        if (subjectMatches.length > 0) {
            results[subject.id] = {
                name: getTranslated(subject, lang, 'name'),
                items: subjectMatches
            };
        }
    });

    return results;
  }

  function displaySearchResults(results, lang) {
    const container = document.getElementById('search-results');
    const t = translations[lang] || translations.en;
    if (Object.keys(results).length === 0) {
        container.innerHTML = `<div class="search-result-item">${t.noResults}</div>`;
        container.style.display = 'block';
        return;
    }

    let html = '';
    for (const subjectId in results) {
        const subjectData = results[subjectId];
        html += `<div class="search-category">${subjectData.name}</div>`;
        subjectData.items.forEach(item => {
            const url = `./content.html?subject=${item.subjectId}&level=${item.levelId}&type=${item.type}&id=${item.id}`;
            html += `<a href="${url}" class="search-result-item">${getTranslated(item, lang, 'title')}</a>`;
        });
    }
    
    container.innerHTML = html;
    container.style.display = 'block';
  }
  
  function renderPageForLanguage(lang) {
    populateStaticTranslations(lang);
    populatePageContent(lang);

    const bodyId = document.body.id;
    if (bodyId === 'home-page' || bodyId === 'about-page' || bodyId === 'privacy-page') {
      if(PAGE_DATA && PAGE_DATA[lang] && PAGE_DATA[lang].meta_description) {
          setMetaDescription(PAGE_DATA[lang].meta_description);
      }
    }

    if (!DB_DATA || !DB_DATA.subjects) return;
    
    // Page-specific render functions
    if (bodyId === 'home-page') {
      renderHomePage(DB_DATA.subjects, lang);
    } else if (bodyId === 'subject-page') {
      const subjectId = new URLSearchParams(window.location.search).get('id');
      const subject = DB_DATA.subjects.find(s => s.id === subjectId);
      if (subject) renderSubjectPage(subject, lang);
    } else if (bodyId === 'content-page') {
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

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('userLanguage', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    // Reset subject-specific theme color on language change to avoid persistence across pages
    document.body.style.removeProperty('--subject-primary-color');

    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        if(lang === 'fr') langToggle.textContent = 'العربية';
        else if (lang === 'ar') langToggle.textContent = 'English';
        else langToggle.textContent = 'Français';
    }
    
    renderPageForLanguage(lang);
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

      const searchInput = document.getElementById('site-search');
      const searchResultsContainer = document.getElementById('search-results');

      if (searchInput && searchResultsContainer) {
          searchInput.addEventListener('input', () => {
              const query = searchInput.value.trim();

              if (query.length < 2) {
                  searchResultsContainer.innerHTML = '';
                  searchResultsContainer.style.display = 'none';
                  return;
              }

              const results = searchContent(query, currentLang);
              displaySearchResults(results, currentLang);
          });

          document.addEventListener('click', (e) => {
              if (!searchInput.contains(e.target) && !searchResultsContainer.contains(e.target)) {
                  searchResultsContainer.style.display = 'none';
              }
          });
      }
      
      const shareBtn = document.getElementById('share-btn');
      if (shareBtn) {
          shareBtn.addEventListener('click', async (e) => {
              e.preventDefault();
              const shareData = {
                  title: document.title,
                  text: `Check out this page on EduMaroc!`,
                  url: window.location.href
              };
              try {
                  if (navigator.share) {
                      await navigator.share(shareData);
                  } else {
                      alert('Web Share API is not supported in your browser. You can copy the link manually.');
                  }
              } catch (err) {
                  console.error("Share failed:", err);
              }
          });
      }
  }
  
  async function loadSharedComponents() {
      try {
          const [navResponse, footerResponse] = await Promise.all([
              fetch('nav.html'),
              fetch('footer.html')
          ]);

          if (!navResponse.ok) throw new Error('Shared component nav.html not found');
          if (!footerResponse.ok) throw new Error('Shared component footer.html not found');

          const navHtml = await navResponse.text();
          const footerHtml = await footerResponse.text();

          document.body.insertAdjacentHTML('afterbegin', navHtml);
          document.body.insertAdjacentHTML('beforeend', footerHtml);

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

    // Fetch master subjects file and page-specific data
    const [masterDbData, pageData] = await Promise.all([
        fetchJsonData('database.json'),
        pageDataPath ? fetchJsonData(pageDataPath) : Promise.resolve({})
    ]);

    if (!masterDbData || !Array.isArray(masterDbData.subjects)) {
        displayGlobalError(currentLang);
        return;
    }

    // Define all level data files
    const levelFiles = [
        'math-1ac.json', 'math-2ac.json', 'math-3ac.json',
        'physics-1ac.json', 'physics-2ac.json', 'physics-3ac.json',
        'science-1ac.json', 'science-2ac.json', 'science-3ac.json'
    ];
    
    // Fetch all level data in parallel
    const levelsDataResults = await Promise.all(
        levelFiles.map(file => fetchJsonData(file).catch(e => null)) // Fetch and ignore errors for missing files
    );

    // Group fetched level data by subject ID based on filename convention
    const levelDataBySubject = {};
    levelFiles.forEach((file, index) => {
        const data = levelsDataResults[index];
        if (data) {
            const subjectId = file.split('-')[0]; // 'math', 'physics', 'science'
            if (!levelDataBySubject[subjectId]) {
                levelDataBySubject[subjectId] = [];
            }
            levelDataBySubject[subjectId].push(data);
        }
    });

    // Merge level data into the master DB structure
    masterDbData.subjects.forEach(subject => {
        const subjectLevels = levelDataBySubject[subject.id] || [];
        // Sort levels to ensure correct order (1ac, 2ac, 3ac)
        subjectLevels.sort((a, b) => a.id.localeCompare(b.id));
        subject.levels = subjectLevels;
    });

    DB_DATA = masterDbData;
    PAGE_DATA = pageData || {};

    setActiveNav();
    initializeEventListeners();
    setLanguage(currentLang);
  }

  initializeApp();
});