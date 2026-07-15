/**
 * CAREER PORTFOLIO — Static JSON Version
 * Loads data from data.json and renders the entire page
 */

let DATA = null;
let currentGalleryIdx = -1;
let certImages = [];

document.addEventListener('DOMContentLoaded', async function () {
    try {
        const res = await fetch('data.json');
        if (!res.ok) throw new Error('Failed to load data.json');
        DATA = await res.json();
        renderAll();
        document.getElementById('loading').style.display = 'none';
        document.getElementById('pageContent').classList.add('visible');
    } catch (err) {
        document.getElementById('loading').innerHTML =
            '<i class="fas fa-exclamation-triangle" style="color:var(--accent)"></i><p>Gagal memuat data. Pastikan data.json tersedia.</p>';
        console.error(err);
    }

    // Navbar toggle
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    if (toggle && menu) {
        toggle.addEventListener('click', function () { menu.classList.toggle('active'); });
        menu.querySelectorAll('.nav-link').forEach(function (link) {
            link.addEventListener('click', function () { menu.classList.remove('active'); });
        });
    }

    // Navbar scroll shadow
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function () {
            navbar.style.boxShadow = window.scrollY > 10 ? '0 2px 20px rgba(0,0,0,0.08)' : 'none';
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        });
    });

    // Back to projects
    document.getElementById('backToProjects').addEventListener('click', function () { showMainPage(); });

    // Close lightbox with Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { closeGallery(); closeProjectLightbox(); closeCertLightbox(); }
    });
});

function renderAll() {
    const h = DATA.hero;
    if (!h) return;

    document.getElementById('navName').textContent = h.name || 'Portfolio';
    document.getElementById('heroName').textContent = h.name;
    document.getElementById('heroTitle').textContent = h.title;
    document.getElementById('heroDesc').textContent = h.description;
    if (h.photo) {
        const img = document.getElementById('heroPhoto');
        img.src = h.photo;
        img.style.display = 'block';
        document.getElementById('heroAvatar').style.display = 'none';
    }

    document.getElementById('statExp').textContent = DATA.experiences.length;
    document.getElementById('statProj').textContent = DATA.projects.length;
    document.getElementById('statCert').textContent = DATA.certificates.length;
    document.getElementById('statSkills').textContent = DATA.skills.length;

    // CV download
    if (h.cv) {
        document.getElementById('downloadCV').href = h.cv;
    } else {
        document.getElementById('downloadCV').style.display = 'none';
    }

    // ATS hidden
    const atsDiv = document.createElement('div');
    atsDiv.className = 'ats-hidden';
    const atsSkills = DATA.skills.map(function (s) { return s.name; }).join(', ');
    const atsTech = [];
    DATA.projects.forEach(function (p) {
        if (p.tech_stack) { p.tech_stack.split(',').forEach(function (t) { atsTech.push(t.trim()); }); }
    });
    atsDiv.innerHTML = '<p>Professional skills: ' + atsSkills + '.</p>' +
        '<p>Technologies: ' + [...new Set(atsTech)].join(', ') + '.</p>' +
        '<p>Total experience: ' + DATA.experiences.length + ' positions. Total projects: ' + DATA.projects.length +
        '. Total certifications: ' + DATA.certificates.length + '.</p>';
    document.body.appendChild(atsDiv);

    // JSON-LD
    const jsonLd = {
        '@context': 'https://schema.org', '@type': 'Person',
        name: h.name, jobTitle: h.title, description: h.description,
        email: h.email, telephone: h.phone, url: window.location.origin,
        sameAs: [h.linkedin, h.github].filter(Boolean)
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd, null, 2);
    document.head.appendChild(script);

    renderExperiences();
    renderProjects();
    renderSkills();
    renderCertificates();
    renderGallery();
    renderContact(h);
    renderFooter(h);
}

/* ---------- EXPERIENCES ---------- */
function renderExperiences() {
    const container = document.getElementById('timelineContainer');
    if (!DATA.experiences.length) { container.innerHTML = '<p style="color:var(--text-muted)">Belum ada data pengalaman.</p>'; return; }
    DATA.experiences.forEach(function (exp) {
        const start = formatDate(exp.start_date);
        const end = exp.is_current ? 'Sekarang' : (exp.end_date ? formatDate(exp.end_date) : '');
        container.insertAdjacentHTML('beforeend',
            '<article class="timeline-item"><div class="timeline-dot"></div><time class="timeline-date">' + start + ' — ' + end + '</time>' +
            '<div class="timeline-content"><div style="display:flex;gap:16px;align-items:flex-start">' +
            (exp.photo ? '<img src="' + exp.photo + '" alt="' + exp.company + ' — ' + exp.position + '" class="timeline-photo" loading="lazy">' : '') +
            '<div><h3 class="timeline-position">' + exp.position + '</h3>' +
            '<h4 class="timeline-company">' + exp.company + ' <span class="timeline-location">' + (exp.location || '') + '</span></h4>' +
            (exp.description ? '<p class="timeline-desc">' + exp.description.replace(/\r?\n/g, '<br>') + '</p>' : '') +
            '</div></div></div></article>');
    });
}

/* ---------- PROJECTS ---------- */
function renderProjects() {
    const container = document.getElementById('projectsContainer');
    if (!DATA.projects.length) { container.innerHTML = '<p style="color:var(--text-muted)">Belum ada project.</p>'; return; }
    DATA.projects.forEach(function (proj) {
        container.insertAdjacentHTML('beforeend',
            '<div class="project-link" onclick="showProject(\'' + proj.slug + '\')">' +
            '<div class="project-icon"><i class="fas fa-code"></i></div>' +
            '<div class="project-body"><h3 class="project-title">' + proj.title + '</h3>' +
            '<p class="project-subtitle">' + (proj.subtitle || '') + '</p>' +
            '<p class="project-desc">' + proj.description + '</p>' +
            (proj.tech_stack ? '<div class="project-tech">' + proj.tech_stack.split(',').map(function (t) {
                return '<span class="tech-tag">' + t.trim() + '</span>';
            }).join('') + '</div>' : '') +
            '</div><div class="project-arrow"><i class="fas fa-arrow-right"></i></div></div>');
    });
}

function showProject(slug) {
    const proj = DATA.projects.find(function (p) { return p.slug === slug; });
    if (!proj) return;
    document.getElementById('pageContent').classList.remove('visible');
    document.getElementById('pageProject').classList.add('visible');
    document.getElementById('pageProject').style.display = 'block';
    window.scrollTo(0, 0);
    document.getElementById('projectDetailTitle').textContent = proj.title;
    document.getElementById('projectDetailSubtitle').textContent = proj.subtitle || '';
    document.getElementById('projectDetailDesc').textContent = proj.description || '';

    const bodyEl = document.getElementById('projectDetailBody');
    if (proj.body) { bodyEl.innerHTML = '<p>' + proj.body.replace(/\r?\n/g, '<br>') + '</p>'; bodyEl.style.display = 'block'; }
    else { bodyEl.style.display = 'none'; }

    const techEl = document.getElementById('projectDetailTech');
    if (proj.tech_stack) {
        techEl.innerHTML = '<h3>Tech Stack</h3><div class="tech-tags">' +
            proj.tech_stack.split(',').map(function (t) { return '<span class="tech-tag">' + t.trim() + '</span>'; }).join('') + '</div>';
        techEl.style.display = 'block';
    } else { techEl.style.display = 'none'; }

    const imagesContainer = document.getElementById('projectImagesGrid');
    const imagesSection = document.getElementById('projectDetailImages');
    if (proj.images && proj.images.length) {
        imagesContainer.innerHTML = '';
        proj.images.forEach(function (img) {
            const div = document.createElement('div');
            div.className = 'project-image-item';
            div.onclick = function () { openProjectLightbox(img); };
            div.innerHTML = '<img src="' + img + '" alt="Project image" loading="lazy">';
            imagesContainer.appendChild(div);
        });
        imagesSection.style.display = 'block';
    } else { imagesSection.style.display = 'none'; }
    document.title = proj.title + ' — Maulana';
}

function showMainPage() {
    document.getElementById('pageProject').classList.remove('visible');
    document.getElementById('pageProject').style.display = 'none';
    document.getElementById('pageContent').classList.add('visible');
    document.title = 'Maulana — Expert in Culinary & System Development';
    window.scrollTo(0, 0);
}

function openProjectLightbox(imgSrc) {
    document.getElementById('projectLightboxImg').src = imgSrc;
    document.getElementById('projectLightbox').classList.add('show');
    document.body.style.overflow = 'hidden';
}
function closeProjectLightbox() {
    document.getElementById('projectLightbox').classList.remove('show');
    document.body.style.overflow = '';
}

/* ---------- SKILLS ---------- */
function renderSkills() {
    const container = document.getElementById('skillsContainer');
    const categories = { Office: { icon: 'fa-file-excel', color: '#2ecc71' }, Language: { icon: 'fa-language', color: '#3498db' }, Cook: { icon: 'fa-utensils', color: '#e67e22' }, System: { icon: 'fa-laptop-code', color: '#9b59b6' } };
    const categorized = {};
    DATA.skills.forEach(function (s) { if (!categorized[s.category]) categorized[s.category] = []; categorized[s.category].push(s); });

    // ATS hidden
    const atsDiv = document.createElement('div'); atsDiv.className = 'ats-hidden';
    for (var cat in categorized) {
        atsDiv.innerHTML += '<h3>' + cat + '</h3><ul>';
        categorized[cat].forEach(function (s) { atsDiv.innerHTML += '<li>' + s.name + ' — ' + s.proficiency + '%</li>'; });
        atsDiv.innerHTML += '</ul>';
    }
    container.parentNode.insertBefore(atsDiv, container);

    for (var cat in categorized) {
        var cd = categories[cat] || { icon: 'fa-star', color: '#c0392b' };
        var html = '<div class="skill-category"><div class="skill-category-header"><i class="fas ' + cd.icon + '" style="color:' + cd.color + '"></i><h3>' + cat + '</h3></div><div class="skill-items">';
        categorized[cat].forEach(function (s) {
            html += '<div class="skill-item"><div class="skill-info"><span class="skill-name">' + s.name + '</span><span class="skill-pct">' + s.proficiency + '%</span></div><div class="skill-bar"><div class="skill-fill" style="width:' + s.proficiency + '%;background:' + cd.color + '"></div></div></div>';
        });
        html += '</div></div>';
        container.insertAdjacentHTML('beforeend', html);
    }
}

/* ---------- CERTIFICATES ---------- */
function renderCertificates() {
    const container = document.getElementById('certsContainer');
    if (!DATA.certificates.length) { container.innerHTML = '<p style="color:var(--text-muted)">Belum ada sertifikat.</p>'; return; }
    DATA.certificates.forEach(function (cert, idx) {
        container.insertAdjacentHTML('beforeend',
            '<div class="cert-card" onclick="openCertLightbox(' + idx + ')" style="cursor:pointer">' +
            (cert.image ? '<img src="' + cert.image + '" alt="' + cert.title + '" class="cert-image" loading="lazy">'
                : '<div class="cert-placeholder"><i class="fas fa-certificate"></i></div>') +
            '<div class="cert-body"><h3 class="cert-title">' + cert.title + '</h3>' +
            (cert.issuer ? '<p class="cert-issuer">' + cert.issuer + '</p>' : '') +
            (cert.description ? '<p class="cert-desc">' + cert.description + '</p>' : '') +
            '</div></div>');
    });
}

// Certificates lightbox
var currentCertIdx = -1;
function openCertLightbox(idx) {
    currentCertIdx = idx;
    certImages = DATA.certificates.map(function (c) { return c.image; }).filter(Boolean);
    document.getElementById('lightboxImg').src = certImages[idx] || '';
    document.getElementById('certLightbox').classList.add('show');
    document.body.style.overflow = 'hidden';
    // Reuse gallery nav
    updateCertNav();
}
function closeCertLightbox() {
    document.getElementById('certLightbox').classList.remove('show');
    document.body.style.overflow = '';
}
function certNav(dir) {
    var newIdx = currentCertIdx + dir;
    if (newIdx < 0 || newIdx >= certImages.length) return;
    currentCertIdx = newIdx;
    document.getElementById('lightboxImg').src = certImages[newIdx];
    updateCertNav();
}
function updateCertNav() {
    var prev = document.querySelector('#certLightbox .lightbox-prev');
    var next = document.querySelector('#certLightbox .lightbox-next');
    if (prev) prev.style.display = currentCertIdx > 0 ? 'block' : 'none';
    if (next) next.style.display = currentCertIdx < certImages.length - 1 ? 'block' : 'none';
}

/* ---------- GALLERY ---------- */
function renderGallery() {
    const container = document.getElementById('galleryContainer');
    if (!DATA.gallery.length) { container.innerHTML = '<p style="color:var(--text-muted)">Belum ada foto.</p>'; return; }
    DATA.gallery.forEach(function (img, idx) {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.onclick = function () { openGallery(idx); };
        div.innerHTML = '<img src="' + img + '" alt="Gallery" loading="lazy">';
        container.appendChild(div);
    });
}

var galleryImages = [];
function openGallery(idx) {
    currentGalleryIdx = idx;
    galleryImages = DATA.gallery;
    document.getElementById('lightboxImg').src = DATA.gallery[idx];
    document.getElementById('galleryLightbox').classList.add('show');
    document.body.style.overflow = 'hidden';
    updateGalleryNav();
}
function closeGallery() {
    document.getElementById('galleryLightbox').classList.remove('show');
    document.body.style.overflow = '';
}
function galleryNav(dir) {
    var newIdx = currentGalleryIdx + dir;
    if (newIdx < 0 || newIdx >= galleryImages.length) return;
    currentGalleryIdx = newIdx;
    document.getElementById('lightboxImg').src = galleryImages[newIdx];
    updateGalleryNav();
}
function updateGalleryNav() {
    document.getElementById('galleryPrev').style.display = currentGalleryIdx > 0 ? 'block' : 'none';
    document.getElementById('galleryNext').style.display = currentGalleryIdx < galleryImages.length - 1 ? 'block' : 'none';
}

/* ---------- CONTACT ---------- */
function renderContact(h) {
    const container = document.getElementById('contactContainer');
    var items = [];
    if (h.email) items.push({ href: 'mailto:' + h.email, icon: 'fa-envelope', iconClass: '', label: 'Email', value: h.email });
    if (h.phone) items.push({ href: 'tel:' + h.phone, icon: 'fa-phone', iconClass: '', label: 'Telepon', value: h.phone });
    if (h.linkedin) items.push({ href: h.linkedin, icon: 'fa-linkedin-in', iconClass: 'linkedin', label: 'LinkedIn', value: 'Terhubung via LinkedIn' });
    if (h.github) items.push({ href: h.github, icon: 'fa-github', iconClass: 'github', label: 'GitHub', value: 'Lihat portfolio code' });

    items.forEach(function (item) {
        container.insertAdjacentHTML('beforeend',
            '<a href="' + item.href + '" target="_blank" class="contact-item" ' +
            (item.label === 'Email' ? '' : '') +
            '><div class="contact-icon ' + item.iconClass + '"><i class="fas ' + item.icon + '"></i></div>' +
            '<div class="contact-item-label"><strong>' + item.label + '</strong><span>' + item.value + '</span></div></a>');
    });
}

/* ---------- FOOTER ---------- */
function renderFooter(h) {
    document.getElementById('footerText').innerHTML = '&copy; ' + new Date().getFullYear() + ' ' + (h.name || 'Portfolio') + '. All rights reserved.';
    var links = '';
    if (h.email) links += '<a href="mailto:' + h.email + '"><i class="fas fa-envelope"></i></a>';
    if (h.linkedin) links += '<a href="' + h.linkedin + '"><i class="fab fa-linkedin"></i></a>';
    if (h.github) links += '<a href="' + h.github + '"><i class="fab fa-github"></i></a>';
    document.getElementById('footerLinks').innerHTML = links;
}

/* ---------- FORMAT DATE ---------- */
function formatDate(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T00:00:00');
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return months[d.getMonth()] + ' ' + d.getFullYear();
}
