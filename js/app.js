/**
 * CAREER PORTFOLIO — Static JSON Version
 * Loads data from data.json and renders the entire page
 */

let DATA = null;
let currentGalleryIdx = -1;

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
        toggle.addEventListener('click', function () {
            menu.classList.toggle('active');
        });
        menu.querySelectorAll('.nav-link').forEach(function (link) {
            link.addEventListener('click', function () {
                menu.classList.remove('active');
            });
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
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Back to projects
    document.getElementById('backToProjects').addEventListener('click', function () {
        showMainPage();
    });

    // Close gallery lightbox with Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeGallery();
            closeProjectLightbox();
        }
    });
});

function renderAll() {
    const h = DATA.hero;
    if (!h) return;

    // Nav
    document.getElementById('navName').textContent = h.name || 'Portfolio';

    // Hero
    document.getElementById('heroName').textContent = h.name;
    document.getElementById('heroTitle').textContent = h.title;
    document.getElementById('heroDesc').textContent = h.description;
    if (h.photo) {
        const img = document.getElementById('heroPhoto');
        img.src = h.photo;
        img.style.display = 'block';
        document.getElementById('heroAvatar').style.display = 'none';
    }

    // Stats
    document.getElementById('statExp').textContent = DATA.experiences.length;
    document.getElementById('statProj').textContent = DATA.projects.length;
    document.getElementById('statCert').textContent = DATA.certificates.length;
    const allSkills = {};
    DATA.skills.forEach(function (s) {
        if (!allSkills[s.category]) allSkills[s.category] = [];
        allSkills[s.category].push(s);
    });
    document.getElementById('statSkills').textContent = DATA.skills.length;

    // ATS hidden block
    const atsDiv = document.createElement('div');
    atsDiv.className = 'ats-hidden';
    const atsSkills = DATA.skills.map(function (s) { return s.name; }).join(', ');
    const atsTech = [];
    DATA.projects.forEach(function (p) {
        if (p.tech_stack) {
            p.tech_stack.split(',').forEach(function (t) { atsTech.push(t.trim()); });
        }
    });
    atsDiv.innerHTML = '<p>Professional skills: ' + atsSkills + '.</p>' +
        '<p>Technologies: ' + [...new Set(atsTech)].join(', ') + '.</p>' +
        '<p>Total experience: ' + DATA.experiences.length + ' positions. Total projects: ' + DATA.projects.length +
        '. Total certifications: ' + DATA.certificates.length + '.</p>';
    document.body.appendChild(atsDiv);

    // JSON-LD
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: h.name,
        jobTitle: h.title,
        description: h.description,
        email: h.email,
        telephone: h.phone,
        url: window.location.origin,
        sameAs: [h.linkedin, h.github].filter(Boolean)
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd, null, 2);
    document.head.appendChild(script);

    // Experiences
    renderExperiences();

    // Projects
    renderProjects();

    // Skills
    renderSkills(allSkills);

    // Certificates
    renderCertificates();

    // Gallery
    renderGallery();

    // Contact
    renderContact();

    // Footer
    renderFooter(h);
}

/* ---------- EXPERIENCES ---------- */
function renderExperiences() {
    const container = document.getElementById('timelineContainer');
    if (!DATA.experiences.length) {
        container.innerHTML = '<p style="color:var(--text-muted)">Belum ada data pengalaman.</p>';
        return;
    }
    DATA.experiences.forEach(function (exp) {
        const start = formatDate(exp.start_date);
        const end = exp.is_current ? 'Sekarang' : (exp.end_date ? formatDate(exp.end_date) : '');
        const html = '<article class="timeline-item">' +
            '<div class="timeline-dot"></div>' +
            '<time class="timeline-date">' + start + ' — ' + end + '</time>' +
            '<div class="timeline-content">' +
            '<div style="display:flex;gap:16px;align-items:flex-start">' +
            (exp.photo ? '<img src="' + exp.photo + '" alt="' + exp.company + ' — ' + exp.position + '" class="timeline-photo" loading="lazy">' : '') +
            '<div>' +
            '<h3 class="timeline-position">' + exp.position + '</h3>' +
            '<h4 class="timeline-company">' + exp.company + ' <span class="timeline-location">' + (exp.location || '') + '</span></h4>' +
            (exp.description ? '<p class="timeline-desc">' + exp.description.replace(/\r?\n/g, '<br>') + '</p>' : '') +
            '</div></div></div></article>';
        container.insertAdjacentHTML('beforeend', html);
    });
}

/* ---------- PROJECTS ---------- */
function renderProjects() {
    const container = document.getElementById('projectsContainer');
    if (!DATA.projects.length) {
        container.innerHTML = '<p style="color:var(--text-muted)">Belum ada project.</p>';
        return;
    }
    DATA.projects.forEach(function (proj) {
        const html = '<div class="project-link" onclick="showProject(\'' + proj.slug + '\')">' +
            '<div class="project-icon"><i class="fas fa-code"></i></div>' +
            '<div class="project-body">' +
            '<h3 class="project-title">' + proj.title + '</h3>' +
            '<p class="project-subtitle">' + (proj.subtitle || '') + '</p>' +
            '<p class="project-desc">' + proj.description + '</p>' +
            (proj.tech_stack ? '<div class="project-tech">' +
                proj.tech_stack.split(',').map(function (t) {
                    return '<span class="tech-tag">' + t.trim() + '</span>';
                }).join('') + '</div>' : '') +
            '</div>' +
            '<div class="project-arrow"><i class="fas fa-arrow-right"></i></div>' +
            '</div>';
        container.insertAdjacentHTML('beforeend', html);
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

    // Body
    const bodyEl = document.getElementById('projectDetailBody');
    if (proj.body) {
        bodyEl.innerHTML = '<p>' + proj.body.replace(/\r?\n/g, '<br>') + '</p>';
        bodyEl.style.display = 'block';
    } else {
        bodyEl.style.display = 'none';
    }

    // Tech stack
    const techEl = document.getElementById('projectDetailTech');
    if (proj.tech_stack) {
        techEl.innerHTML = '<h3>Tech Stack</h3><div class="tech-tags">' +
            proj.tech_stack.split(',').map(function (t) {
                return '<span class="tech-tag">' + t.trim() + '</span>';
            }).join('') + '</div>';
        techEl.style.display = 'block';
    } else {
        techEl.style.display = 'none';
    }

    // Images
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
    } else {
        imagesSection.style.display = 'none';
    }

    // Set page title
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
    const lb = document.getElementById('projectLightbox');
    document.getElementById('projectLightboxImg').src = imgSrc;
    lb.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeProjectLightbox() {
    document.getElementById('projectLightbox').classList.remove('show');
    document.body.style.overflow = '';
}

/* ---------- SKILLS ---------- */
function renderSkills(categorized) {
    const container = document.getElementById('skillsContainer');
    const categories = {
        Office: { icon: 'fa-file-excel', color: '#2ecc71' },
        Language: { icon: 'fa-language', color: '#3498db' },
        Cook: { icon: 'fa-utensils', color: '#e67e22' },
        System: { icon: 'fa-laptop-code', color: '#9b59b6' }
    };

    // ATS hidden
    const atsDiv = document.createElement('div');
    atsDiv.className = 'ats-hidden';
    for (var cat in categorized) {
        atsDiv.innerHTML += '<h3>' + cat + '</h3><ul>';
        categorized[cat].forEach(function (s) {
            atsDiv.innerHTML += '<li>' + s.name + ' — ' + s.proficiency + '%</li>';
        });
        atsDiv.innerHTML += '</ul>';
    }
    container.parentNode.insertBefore(atsDiv, container);

    for (var cat in categorized) {
        var catData = categories[cat] || { icon: 'fa-star', color: '#c0392b' };
        var html = '<div class="skill-category">' +
            '<div class="skill-category-header">' +
            '<i class="fas ' + catData.icon + '" style="color:' + catData.color + '"></i>' +
            '<h3>' + cat + '</h3></div><div class="skill-items">';
        categorized[cat].forEach(function (s) {
            html += '<div class="skill-item">' +
                '<div class="skill-info"><span class="skill-name">' + s.name + '</span><span class="skill-pct">' + s.proficiency + '%</span></div>' +
                '<div class="skill-bar"><div class="skill-fill" style="width:' + s.proficiency + '%;background:' + catData.color + '"></div></div>' +
                '</div>';
        });
        html += '</div></div>';
        container.insertAdjacentHTML('beforeend', html);
    }
}

/* ---------- CERTIFICATES ---------- */
function renderCertificates() {
    const container = document.getElementById('certsContainer');
    if (!DATA.certificates.length) {
        container.innerHTML = '<p style="color:var(--text-muted)">Belum ada sertifikat.</p>';
        return;
    }
    DATA.certificates.forEach(function (cert) {
        var html = '<div class="cert-card">' +
            (cert.image
                ? '<img src="' + cert.image + '" alt="' + cert.title + '" class="cert-image" loading="lazy">'
                : '<div class="cert-placeholder"><i class="fas fa-certificate"></i></div>') +
            '<div class="cert-body">' +
            '<h3 class="cert-title">' + cert.title + '</h3>' +
            (cert.issuer ? '<p class="cert-issuer">' + cert.issuer + '</p>' : '') +
            (cert.description ? '<p class="cert-desc">' + cert.description + '</p>' : '') +
            '</div></div>';
        container.insertAdjacentHTML('beforeend', html);
    });
}

/* ---------- GALLERY ---------- */
function renderGallery() {
    const container = document.getElementById('galleryContainer');
    if (!DATA.gallery.length) {
        container.innerHTML = '<p style="color:var(--text-muted)">Belum ada foto.</p>';
        return;
    }
    DATA.gallery.forEach(function (img, idx) {
        var div = document.createElement('div');
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
    var lb = document.getElementById('galleryLightbox');
    document.getElementById('lightboxImg').src = DATA.gallery[idx];
    lb.classList.add('show');
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
function renderContact() {
    const container = document.getElementById('contactContainer');
    const h = DATA.hero;
    var items = [];

    if (h.email) {
        items.push({
            href: 'mailto:' + h.email,
            icon: 'fa-envelope',
            iconClass: '',
            label: 'Email',
            value: h.email
        });
    }
    if (h.phone) {
        items.push({
            href: 'tel:' + h.phone,
            icon: 'fa-phone',
            iconClass: '',
            label: 'Telepon',
            value: h.phone
        });
    }
    if (h.linkedin) {
        items.push({
            href: h.linkedin,
            icon: 'fa-linkedin-in',
            iconClass: 'linkedin',
            label: 'LinkedIn',
            value: 'Terhubung via LinkedIn'
        });
    }
    if (h.github) {
        items.push({
            href: h.github,
            icon: 'fa-github',
            iconClass: 'github',
            label: 'GitHub',
            value: 'Lihat portfolio code'
        });
    }

    items.forEach(function (item) {
        var html = '<a href="' + item.href + '" target="_blank" class="contact-item">' +
            '<div class="contact-icon ' + item.iconClass + '"><i class="fab ' + item.icon + '"></i></div>' +
            '<div class="contact-item-label"><strong>' + item.label + '</strong><span>' + item.value + '</span></div>' +
            '</a>';
        container.insertAdjacentHTML('beforeend', html);
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
