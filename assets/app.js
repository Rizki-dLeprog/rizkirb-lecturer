class ProgrammingAcademy {
  constructor(data) {
    this.data = data;
    this.courseId = data[0]?.id || '';
    this.moduleId = data[0]?.modules[0]?.id || '';
    this.topicId = data[0]?.modules[0]?.topics[0]?.id || '';
    this.openExerciseId = null;
    this.expandedCourseId = null;
    this.courseSwitcher = document.getElementById('courseSwitcher');
    this.moduleList = document.getElementById('moduleList');
    this.content = document.getElementById('content');
    this.searchInput = document.getElementById('searchInput');
    this.sidebar = document.getElementById('sidebar');
    this.sidebarOverlay = document.getElementById('sidebarOverlay');
    this.mobileMenu = document.getElementById('mobileMenu');
    this.themeToggle = document.getElementById('themeToggle');
    this.topbar = document.querySelector('.topbar');
    this.lastScrollY = window.scrollY;
    this.headerScrollAnchor = window.scrollY;
    this.headerScrollDirection = 0;
    this.headerHidden = false;
    this.headerScrollTicking = false;
    this.appShell = document.querySelector('.app-shell');
    this.sidebarMedia = window.matchMedia('(max-width: 900px)');
    this.desktopSidebarCollapsed = false;
    this.backToTop = document.getElementById('backToTop');
    this.bindGlobalEvents();
    this.render();
  }

  get course() { return this.data.find(c => c.id === this.courseId) || this.data[0]; }
  get module() { return this.course.modules.find(m => m.id === this.moduleId) || this.course.modules[0]; }
  get topic() { return this.module.topics.find(t => t.id === this.topicId) || this.module.topics[0]; }

  bindGlobalEvents() {
    this.searchInput.addEventListener('input', () => this.render());
    this.mobileMenu.addEventListener('click', () => this.toggleSidebar());
    this.themeToggle.addEventListener('click', () => this.toggleTheme());
    this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());
    const onSidebarViewportChange = () => this.syncSidebarState();
    if (this.sidebarMedia.addEventListener) this.sidebarMedia.addEventListener('change', onSidebarViewportChange);
    else if (this.sidebarMedia.addListener) this.sidebarMedia.addListener(onSidebarViewportChange);
    this.backToTop.addEventListener('click', () => this.scrollToTop());
    window.addEventListener('scroll', () => this.handleWindowScroll(), { passive: true });
    this.searchInput.addEventListener('focus', () => this.setHeaderHidden(false));
    this.searchInput.addEventListener('blur', () => { this.lastScrollY = window.scrollY; });
    this.updateBackToTop();
    this.updateHeaderVisibility();
    this.syncThemeToggle();
    this.syncSidebarState();
    window.addEventListener('keydown', event => { if (event.key === 'Escape') this.closeSidebar(); });
  }

  countExercises(scope) {
    if (scope.exercises) return scope.exercises.length;
    if (scope.topics) return scope.topics.reduce((sum,t)=>sum+t.exercises.length,0);
    if (scope.modules) return scope.modules.reduce((sum,m)=>sum+this.countExercises(m),0);
    return 0;
  }

  countTopics(course) {
    return course.modules.reduce((sum,module)=>sum+module.topics.length,0);
  }

  render() {
    this.renderCourses();
    this.renderModules();
    const query = this.searchInput.value.trim();
    if (query) this.renderSearchResults(query);
    else this.renderModuleContent();
  }

  courseIconMarkup(id) {
    const icons = {
      java: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 9.5h10v4.1a4.9 4.9 0 0 1-4.9 4.9h-.2a4.9 4.9 0 0 1-4.9-4.9Z"/><path d="M15.5 10.7h1.3a2.5 2.5 0 1 1 0 5h-1.9M6.8 21h9.4"/><path d="M9.2 2.8c-1.6 1.4 1.4 2.1-.2 3.7M13.1 2.3c-1.7 1.5 1.5 2.2-.2 3.9"/></svg>',
      python: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.3 3.7h5.1a3.5 3.5 0 0 1 3.5 3.5v3.4H9.7a3.8 3.8 0 0 0-3.8 3.8v1.1"/><path d="M15.7 20.3h-5.1a3.5 3.5 0 0 1-3.5-3.5v-3.4h7.2a3.8 3.8 0 0 0 3.8-3.8V8.5"/><circle cx="11" cy="7.2" r=".85" fill="currentColor" stroke="none"/><circle cx="13" cy="16.8" r=".85" fill="currentColor" stroke="none"/></svg>',
      php: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2"/><path d="M8.4 8.7 5.7 12l2.7 3.3M15.6 8.7l2.7 3.3-2.7 3.3M13.8 7.4l-3.6 9.2"/></svg>',
      cpp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2.8 7.9 4.6v9.2L12 21.2l-7.9-4.6V7.4Z"/><path d="M12.8 8.2a4 4 0 1 0 0 7.6"/><path d="M15.6 9.4v4M13.6 11.4h4M20 9.4v4M18 11.4h4"/></svg>',
      'software-engineering': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7.3 12 3l7 4.3-7 4.2Z"/><path d="m5 11.7 7 4.2 7-4.2M5 16.1l7 4.2 7-4.2"/><path d="M12 7.1v4.1"/></svg>',
      'data-mining': '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="9.8" cy="5.5" rx="5.8" ry="2.5"/><path d="M4 5.5v4.4c0 1.4 2.6 2.5 5.8 2.5s5.8-1.1 5.8-2.5V5.5M4 9.9v4.4c0 1.4 2.6 2.5 5.8 2.5 1 0 2-.1 2.8-.3"/><path d="m14.3 17.2 2.1-2.2 1.7 1.5 2.2-2.7"/><circle cx="14.3" cy="17.2" r=".7" fill="currentColor" stroke="none"/><circle cx="16.4" cy="15" r=".7" fill="currentColor" stroke="none"/><circle cx="18.1" cy="16.5" r=".7" fill="currentColor" stroke="none"/><circle cx="20.3" cy="13.8" r=".7" fill="currentColor" stroke="none"/></svg>'
    };
    return icons[id] || '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 9h8M8 12h8M8 15h5"/></svg>';
  }

  renderCourses() {
    this.courseSwitcher.innerHTML = '';
    this.moduleList = null;

    this.data.forEach(course => {
      const isActive = course.id === this.course.id;
      const isOpen = isActive && this.expandedCourseId === course.id;

      const item = document.createElement('div');
      item.className = 'course-accordion-item' + (isOpen ? ' open' : '');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'course-btn' + (isActive ? ' active' : '');
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      button.title = isActive ? `${course.name} - ${isOpen ? 'hide' : 'show'} modules` : `${course.name} - show modules`;

      const icon = document.createElement('span');
      icon.className = 'course-icon course-icon-' + course.id;
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = this.courseIconMarkup(course.id);

      const copy = document.createElement('span');
      copy.className = 'course-copy';
      const name = document.createElement('span');
      name.className = 'course-name';
      name.textContent = course.short;
      const code = document.createElement('span');
      code.className = 'course-code';
      code.textContent = course.name;
      copy.append(name, code);

      const arrow = document.createElement('span');
      arrow.className = 'course-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.innerHTML = '<svg viewBox="0 0 20 20"><path d="m6 8 4 4 4-4"/></svg>';
      button.append(icon, copy, arrow);

      button.addEventListener('click', () => {
        if (course.id === this.courseId) {
          this.expandedCourseId = this.expandedCourseId === course.id ? null : course.id;
          this.render();
          return;
        }

        this.courseId = course.id;
        this.moduleId = course.modules[0].id;
        this.topicId = course.modules[0].topics[0].id;
        this.expandedCourseId = course.id;
        this.openExerciseId = null;
        this.searchInput.value = '';
        this.render();
        this.scrollMainTop();
      });

      item.appendChild(button);

      if (isOpen) {
        const panel = document.createElement('div');
        panel.className = 'course-modules-panel';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', `${course.name} modules`);

        const panelLabel = document.createElement('div');
        panelLabel.className = 'course-modules-label';
        panelLabel.textContent = 'Modules';

        const list = document.createElement('div');
        list.className = 'module-list nested-module-list';
        list.id = 'moduleList';

        panel.append(panelLabel, list);
        item.appendChild(panel);
        this.moduleList = list;
      }

      this.courseSwitcher.appendChild(item);
    });
  }

  searchTextForTopic(topic) {
    const material = topic.material ? JSON.stringify(topic.material) : '';
    return [topic.title, topic.description, material, ...topic.exercises.flatMap(e=>[
      e.title, e.prompt, e.starterCode || '', ...(e.instructions || [])
    ])].join(' ').toLocaleLowerCase('id');
  }

  renderModules() {
    if (!this.moduleList) return;
    const q = this.searchInput.value.trim().toLocaleLowerCase('id');
    this.moduleList.innerHTML = '';
    const modules = this.course.modules.filter(module => {
      if (!q) return true;
      const overview = module.materialOverview ? JSON.stringify(module.materialOverview) : '';
      const haystack = [module.title,module.description,overview,...module.topics.map(t=>this.searchTextForTopic(t))].join(' ').toLocaleLowerCase('id');
      return haystack.includes(q);
    });
    if (!modules.length) {
      this.moduleList.innerHTML = '<div class="sidebar-empty">No matching modules.</div>';
      return;
    }
    modules.forEach(module => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'module-btn' + (module.id === this.module.id ? ' active' : '');
      button.setAttribute('aria-current', module.id === this.module.id ? 'page' : 'false');
      button.innerHTML = `<span class="module-num">${this.escape(module.no)}</span><span><span class="module-title">${this.escape(module.title)}</span><span class="module-sub">${module.topics.length} topics · ${this.countExercises(module)} ${this.course.mode==='theory'?'learning exercises':'exercises'}</span></span>`;
      button.addEventListener('click', () => {
        this.moduleId = module.id;
        this.topicId = module.topics[0].id;
        this.openExerciseId = null;
        this.searchInput.value = '';
        this.render();
        this.closeSidebar();
        this.scrollMainTop();
      });
      this.moduleList.appendChild(button);
    });
  }

  renderBreadcrumb(topic = null) {
    return `<nav class="breadcrumb" aria-label="Breadcrumb"><button class="crumb-course" type="button" data-crumb-course>${this.escape(this.course.name)}</button><span class="crumb-sep" aria-hidden="true">/</span><button type="button" data-crumb-module>${this.escape(this.module.title)}</button>${topic?`<span class="crumb-sep" aria-hidden="true">/</span><span aria-current="page">${this.escape(topic.title)}</span>`:''}</nav>`;
  }

  renderModuleOverview(overview) {
    if (!overview) return '';
    return `<div class="module-overview">
      <div class="lesson-label">Module Overview</div>
      <p class="module-lead">${this.escape(overview.lead)}</p>
      <div class="module-discussion">${(overview.discussion||[]).map(p=>`<p>${this.escape(p)}</p>`).join('')}</div>
      ${(overview.keyPoints||[]).length?`<ul class="key-grid">${overview.keyPoints.map(item=>`<li>${this.escape(item)}</li>`).join('')}</ul>`:''}
    </div>`;
  }

  courseSoftwareRequirements(course) {
    const requirements = {
      java: ['JDK', 'Java IDE', 'JDBC Driver'],
      python: ['Python 3', 'pip', 'Code Editor / IDE'],
      php: ['PHP Runtime', 'Local Web Server', 'Web Browser'],
      cpp: ['C++ Compiler', 'Build Tools', 'Code Editor / IDE'],
      'software-engineering': ['Diagramming Tool', 'Version Control', 'Document Editor'],
      'data-mining': ['RapidMiner', 'Dataset / CSV Files', 'Spreadsheet Viewer']
    };
    return requirements[course.id] || ['Code Editor / IDE'];
  }

  renderModuleContent() {
    const c=this.course,m=this.module;
    const moduleTabs=c.modules.map(module=>`<button type="button" class="main-module-tab${module.id===m.id?' active':''}" data-main-module="${this.escape(module.id)}" aria-current="${module.id===m.id?'page':'false'}"><span class="main-module-label"><span class="main-module-no">${this.escape(module.no)}.</span><span class="main-module-title">${this.escape(module.title)}</span></span></button>`).join('');
    this.content.innerHTML = `${this.renderBreadcrumb(null)}
      <section class="course-strip" aria-labelledby="courseTitle">
        <div class="course-hero-top">
          <div class="course-hero-copy">
            <div class="course-kicker">${c.mode==='theory'?'Learning Material & Applied Practice':'Learning Material & Coding Practice'}</div>
            <h1 id="courseTitle">${this.escape(c.name)}</h1>
            <p>${this.escape(c.subtitle)}</p>
          </div>
          <div class="course-meta" aria-label="Course statistics"><span class="course-stat stat-modules"><strong>${c.modules.length}</strong> modules</span><span class="course-stat stat-topics"><strong>${this.countTopics(c)}</strong> topics</span><span class="course-stat stat-exercises"><strong>${this.countExercises(c)}</strong> ${c.mode==='theory'?'learning exercises':'exercises'}</span></div>
        </div>
      </section>
      <nav class="main-module-tabs" style="--module-count:${c.modules.length}" aria-label="${this.escape(c.name)} modules">${moduleTabs}</nav>
      <section class="module-card" aria-labelledby="moduleTitle">
        <div class="module-eyebrow">Module ${this.escape(m.no)}</div>
        <h2 id="moduleTitle">${this.escape(m.title)}</h2>
        <p>${this.escape(m.description)}</p>
        ${this.renderModuleOverview(m.materialOverview)}
      </section>
      <div id="topicContainer"></div>`;
    this.bindBreadcrumb();
    this.content.querySelectorAll('[data-main-module]').forEach(button=>{
      button.addEventListener('click',()=>{
        const module=c.modules.find(item=>item.id===button.dataset.mainModule);
        if(!module || module.id===this.moduleId) return;
        this.moduleId=module.id;
        this.topicId=module.topics[0]?.id || '';
        this.openExerciseId=null;
        this.searchInput.value='';
        this.render();
        this.scrollMainTop();
      });
    });
    const container=document.getElementById('topicContainer');
    m.topics.forEach((topic,index)=>container.appendChild(this.buildTopic(topic,index)));
    if (this.openExerciseId) requestAnimationFrame(()=>this.scrollToExercise(this.openExerciseId));
  }

  renderMaterial(material) {
    if (!material) return '';
    const codeExamples=(material.codeExamples&&material.codeExamples.length)
      ? material.codeExamples
      : (material.exampleCode ? [{
          title:material.exampleTitle||'Complete Example',
          language:material.exampleLanguage||this.course.short,
          code:material.exampleCode
        }] : []);
    return `<div class="material">
      <div class="lesson-label">Lesson Material & Discussion</div>
      <p class="material-summary">${this.escape(material.summary)}</p>
      <div class="material-discussion">${(material.discussion||[]).map(p=>`<p>${this.escape(p)}</p>`).join('')}</div>
      ${(material.keyPoints||[]).length?`<ul class="material-points">${material.keyPoints.map(item=>`<li>${this.escape(item)}</li>`).join('')}</ul>`:''}
      ${material.note?`<div class="material-note">${this.escape(material.note)}</div>`:''}
      ${material.workedExample?`<div class="worked-example"><div class="worked-example-title">${this.escape(material.workedExample.title||'Worked Example')}</div>${material.workedExample.summary?`<p class="worked-example-summary">${this.escape(material.workedExample.summary)}</p>`:''}${material.workedExample.formula?`<pre class="worked-formula">${this.escape(material.workedExample.formula)}</pre>`:''}${(material.workedExample.steps||[]).length?`<ol class="worked-steps">${material.workedExample.steps.map(step=>`<li>${this.escape(step)}</li>`).join('')}</ol>`:''}</div>`:''}
      ${codeExamples.length?`<details class="source-code-collection"><summary><span>Source Code</span><span>${codeExamples.length} examples</span></summary><div class="source-code-list">${codeExamples.map((example,index)=>`<details class="source-code-item"><summary>${this.escape(example.title||`Example ${index+1}`)}</summary><div class="codebox"><div class="codebar"><span>${this.escape(example.language||this.course.short)} · ${this.escape(example.title||`Example ${index+1}`)}</span><button type="button" class="copy-feedback" data-copy-material-code="${index}">Copy Source Code</button></div><pre><code>${this.escape(example.code||'')}</code></pre></div></details>`).join('')}</div></details>`:''}
    </div>`;
  }

  buildTopic(topic,index) {
    const section=document.createElement('section');
    section.className='topic';
    section.id=topic.id;
    section.innerHTML=`<header class="topic-head"><div><div class="topic-index">${topic.section?`Section ${this.escape(topic.section)}`:`Topic ${String(index+1).padStart(2,'0')}`}</div><h3>${this.escape(topic.title)}</h3><p>${this.escape(topic.description)}</p></div><div class="topic-count">${topic.exercises.length} exercises</div></header>
      ${this.renderMaterial(topic.material)}
      <details class="exercise-group"><summary class="exercise-section-head"><span class="exercise-section-title">${this.course.mode==='theory'?'Learning Exercises':'Coding Exercises'}</span><span>${topic.exercises.length} exercises</span></summary>
      <div class="exercise-list"></div></details>`;
    const list=section.querySelector('.exercise-list');
    topic.exercises.forEach((exercise,idx)=>list.appendChild(this.buildExercise(topic,exercise,idx)));
    const codeExamples=(topic.material?.codeExamples&&topic.material.codeExamples.length)
      ? topic.material.codeExamples
      : (topic.material?.exampleCode ? [{
          title:topic.material.exampleTitle||'Complete Example',
          language:topic.material.exampleLanguage||this.course.short,
          code:topic.material.exampleCode
        }] : []);
    section.querySelectorAll('[data-copy-material-code]').forEach(button=>{
      const example=codeExamples[Number(button.dataset.copyMaterialCode)];
      if(example?.code) button.addEventListener('click',()=>this.copyWithFeedback(example.code,button,'Copy Source Code'));
    });
    return section;
  }


  buildExercise(topic,exercise,index) {
    const article=document.createElement('article');
    article.className='exercise';
    article.id=exercise.id;
    const panelId=`panel-${exercise.id}`;
    const isOpen=this.openExerciseId===exercise.id;
    article.innerHTML=`<button class="exercise-toggle" type="button" aria-expanded="${isOpen?'true':'false'}" aria-controls="${panelId}">
      <span class="exercise-no">${index+1}</span>
      <span><span class="exercise-title">${this.escape(exercise.title)}</span><span class="exercise-meta"><span class="badge badge-type">${this.escape(exercise.type)}</span><span class="badge ${this.difficultyClass(exercise.difficulty)}">${this.escape(exercise.difficulty)}</span></span></span>
      <span class="chevron" aria-hidden="true">▼</span>
    </button>
    <div class="exercise-panel" id="${panelId}" ${isOpen?'':'hidden'}>
      <p class="exercise-prompt">${this.escape(exercise.prompt)}</p>
      ${exercise.starterCode?`<div class="section-label">Starter Code (complete the required parts)</div><div class="codebox"><div class="codebar"><span>${this.escape(exercise.language||this.course.short)} · ${this.escape(exercise.estimatedTime || '')}</span><button type="button" class="copy-feedback" data-copy-code>Copy Starter Code</button></div><pre><code>${this.escape(exercise.starterCode)}</code></pre></div>`:''}
      <div class="section-label">Requirement</div>
      <ol class="requirements">${(exercise.instructions||[]).map(item=>`<li>${this.escape(item)}</li>`).join('')}</ol>
      <div class="exercise-actions"><button type="button" class="action-btn copy-feedback" data-copy-instructions>Copy Instructions</button></div>
    </div>`;
    const toggle=article.querySelector('.exercise-toggle');
    const panel=article.querySelector('.exercise-panel');
    toggle.addEventListener('click',()=>{
      const open=toggle.getAttribute('aria-expanded')==='true';
      toggle.setAttribute('aria-expanded',String(!open));
      panel.hidden=open;
      this.topicId=topic.id;
      this.openExerciseId=open?null:exercise.id;
      this.updateBreadcrumbOnly(open?null:topic);
    });
    const codeButton=article.querySelector('[data-copy-code]');
    if(codeButton) codeButton.addEventListener('click',()=>this.copyWithFeedback(exercise.starterCode,codeButton,'Copy Starter Code'));
    const instructionButton=article.querySelector('[data-copy-instructions]');
    instructionButton.addEventListener('click',()=>{
      const text=[exercise.title,'',exercise.prompt,'',...(exercise.instructions||[]).map((x,i)=>`${i+1}. ${x}`)].join('\n');
      this.copyWithFeedback(text,instructionButton,'Copy Instructions');
    });
    return article;
  }

  renderSearchResults(query) {
    const q=query.toLocaleLowerCase('id');
    const results=[];
    this.course.modules.forEach(module=>{
      const moduleHay=(module.title+' '+module.description+' '+(module.materialOverview?JSON.stringify(module.materialOverview):'')).toLocaleLowerCase('id');
      if(moduleHay.includes(q)) results.push({type:'Module',title:module.title,path:this.course.name,moduleId:module.id,topicId:module.topics[0].id});
      module.topics.forEach(topic=>{
        const topicMaterial = topic.material ? JSON.stringify(topic.material) : '';
        const topicHay=(topic.title+' '+topic.description+' '+topicMaterial).toLocaleLowerCase('id');
        if(topicHay.includes(q)) results.push({type:topic.material?'Lesson / Topic':'Topic',title:topic.title,path:`${this.course.name} / ${module.title}`,moduleId:module.id,topicId:topic.id});
        topic.exercises.forEach(exercise=>{
          const hay=(exercise.title+' '+exercise.prompt+' '+(exercise.starterCode||'')+' '+(exercise.instructions||[]).join(' ')).toLocaleLowerCase('id');
          if(hay.includes(q)) results.push({type:'Exercise',title:exercise.title,path:`${this.course.name} / ${module.title} / ${topic.title}`,moduleId:module.id,topicId:topic.id,exerciseId:exercise.id});
        });
      });
    });
    const capped=results.slice(0,100);
    this.content.innerHTML=`<section class="search-panel" aria-labelledby="searchTitle"><header class="search-head"><h2 id="searchTitle">Search Results</h2><p>${results.length} results for “${this.escape(query)}” in ${this.escape(this.course.name)}</p></header><div class="search-results">${capped.length?capped.map((r,i)=>`<button type="button" class="search-result" data-result="${i}"><span class="result-context">${this.escape(r.type)}</span><span class="result-title">${this.escape(r.title)}</span><span class="result-path">${this.escape(r.path)}</span></button>`).join(''):'<div class="no-results">No matching modules, topics, lessons, or exercises.</div>'}</div></section>`;
    this.content.querySelectorAll('[data-result]').forEach(button=>button.addEventListener('click',()=>{
      const r=capped[Number(button.dataset.result)];
      this.moduleId=r.moduleId;
      this.topicId=r.topicId;
      this.openExerciseId=r.exerciseId||null;
      this.searchInput.value='';
      this.render();
      this.closeSidebar();
      requestAnimationFrame(()=>r.exerciseId?this.scrollToExercise(r.exerciseId):document.getElementById(r.topicId)?.scrollIntoView({block:'start'}));
    }));
  }

  bindBreadcrumb() {
    const courseButton=this.content.querySelector('[data-crumb-course]');
    const moduleButton=this.content.querySelector('[data-crumb-module]');
    if(courseButton) courseButton.addEventListener('click',()=>this.scrollMainTop());
    if(moduleButton) moduleButton.addEventListener('click',()=>document.getElementById('moduleTitle')?.scrollIntoView({block:'start'}));
  }

  updateBreadcrumbOnly(topic) {
    const existing=this.content.querySelector('.breadcrumb');
    if(!existing) return;
    const holder=document.createElement('div');
    holder.innerHTML=this.renderBreadcrumb(topic);
    existing.replaceWith(holder.firstElementChild);
    this.bindBreadcrumb();
  }

  difficultyClass(level) {
    return level==='Beginner'?'badge-basic':level==='Intermediate'?'badge-mid':'badge-advanced';
  }

  async copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(text); return true; } catch {}
    }
    const area=document.createElement('textarea');
    area.value=text;
    area.setAttribute('readonly','');
    area.style.position='fixed';
    area.style.opacity='0';
    document.body.appendChild(area);
    area.select();
    let ok=false;
    try { ok=document.execCommand('copy'); } catch { ok=false; }
    area.remove();
    return ok;
  }

  async copyWithFeedback(text,button,defaultLabel) {
    const ok=await this.copyText(text);
    button.textContent=ok?'Copied':'Copy failed';
    this.showToast(ok?'Copied to clipboard.':'Clipboard is unavailable. Select and copy the text manually.');
    window.setTimeout(()=>{button.textContent=defaultLabel;},1100);
  }

  showToast(message) {
    const toast=document.getElementById('toast');
    toast.textContent=message;
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer=setTimeout(()=>toast.classList.remove('show'),1800);
  }

  syncThemeToggle() {
    const dark = document.documentElement.dataset.theme === 'dark';
    const target = dark ? 'light' : 'dark';
    this.themeToggle.setAttribute('aria-label', `Switch to ${target} mode`);
    this.themeToggle.title = `Switch to ${target} mode`;
  }

  toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('dleprog-theme', next); } catch {}
    this.syncThemeToggle();
  }

  syncSidebarState() {
    if (this.sidebarMedia.matches) {
      this.appShell.classList.remove('sidebar-collapsed');
      this.sidebar.classList.remove('open');
      this.sidebarOverlay.classList.remove('show');
      this.mobileMenu.setAttribute('aria-expanded','false');
      this.mobileMenu.setAttribute('aria-label','Open course navigation');
      this.mobileMenu.title='Open sidebar';
      return;
    }
    this.sidebar.classList.remove('open');
    this.sidebarOverlay.classList.remove('show');
    this.appShell.classList.toggle('sidebar-collapsed',this.desktopSidebarCollapsed);
    const expanded=!this.desktopSidebarCollapsed;
    this.mobileMenu.setAttribute('aria-expanded',String(expanded));
    this.mobileMenu.setAttribute('aria-label',expanded?'Close course navigation':'Open course navigation');
    this.mobileMenu.title=expanded?'Close sidebar':'Open sidebar';
  }

  toggleSidebar() {
    if (this.sidebarMedia.matches) {
      const open=!this.sidebar.classList.contains('open');
      this.sidebar.classList.toggle('open',open);
      this.sidebarOverlay.classList.toggle('show',open);
      if (open) this.setHeaderHidden(false);
      this.mobileMenu.setAttribute('aria-expanded',String(open));
      this.mobileMenu.setAttribute('aria-label',open?'Close course navigation':'Open course navigation');
      this.mobileMenu.title=open?'Close sidebar':'Open sidebar';
      return;
    }
    this.desktopSidebarCollapsed=!this.desktopSidebarCollapsed;
    this.syncSidebarState();
  }

  closeSidebar() {
    if (!this.sidebarMedia.matches) return;
    this.sidebar.classList.remove('open');
    this.sidebarOverlay.classList.remove('show');
    this.mobileMenu.setAttribute('aria-expanded','false');
    this.mobileMenu.setAttribute('aria-label','Open course navigation');
    this.mobileMenu.title='Open sidebar';
  }

  handleWindowScroll() {
    this.updateBackToTop();
    if (this.headerScrollTicking) return;
    this.headerScrollTicking = true;
    requestAnimationFrame(() => {
      this.updateHeaderVisibility();
      this.headerScrollTicking = false;
    });
  }

  setHeaderHidden(hidden) {
    if (!this.topbar || this.headerHidden === hidden) return;
    this.headerHidden = hidden;
    this.topbar.classList.toggle('header-hidden', hidden);
    document.documentElement.classList.toggle('header-hidden', hidden);
  }

  updateHeaderVisibility() {
    const currentY = Math.max(0, window.scrollY);
    const delta = currentY - this.lastScrollY;
    const direction = delta > 0 ? 1 : delta < 0 ? -1 : this.headerScrollDirection;
    const searchFocused = document.activeElement === this.searchInput;
    const mobileSidebarOpen = this.sidebarMedia.matches && this.sidebar.classList.contains('open');

    if (direction !== this.headerScrollDirection) {
      this.headerScrollDirection = direction;
      this.headerScrollAnchor = this.lastScrollY;
    }

    if (currentY < 72 || searchFocused || mobileSidebarOpen) {
      this.setHeaderHidden(false);
      this.headerScrollAnchor = currentY;
    } else if (direction > 0 && currentY > 120 && currentY - this.headerScrollAnchor > 24) {
      this.setHeaderHidden(true);
    } else if (direction < 0 && this.headerScrollAnchor - currentY > 10) {
      this.setHeaderHidden(false);
    }
    this.lastScrollY = currentY;
  }

  updateBackToTop() {
    this.backToTop.classList.toggle('show', window.scrollY > 420);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  scrollMainTop() { document.getElementById('mainContent').scrollIntoView({block:'start'}); }
  scrollToExercise(id) { document.getElementById(id)?.scrollIntoView({block:'center'}); }
  escape(value) { return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
}

const copyrightYear = document.getElementById('copyrightYear');
if (copyrightYear) copyrightYear.textContent = new Date().getFullYear();

new ProgrammingAcademy(COURSE_DATA);
