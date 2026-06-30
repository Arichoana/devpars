/* DevPars landing/article page generator.
   Reads src/landing-content.json (array of {label,page}) produced by the content workflow,
   wraps each in the site layout (header/footer/CSS, root-relative paths), injects SEO +
   JSON-LD (Service/Article + FAQPage + BreadcrumbList), writes /<slug>/index.html, and
   regenerates the FULL sitemap.xml (homepage de/en/fa + all landing pages).
   Run AFTER build.js:  node build.js && node build-landing.js */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const BASE = 'https://devpars.de';
const WA = '4915750724109';
const PUBDATE = '2026-06-30';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
const logoSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7l-5 5 5 5"></path><path d="M16 7l5 5-5 5"></path></svg>';
const waSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.13c-.24.68-1.2 1.26-1.97 1.42-.52.11-1.2.2-3.49-.75-2.93-1.21-4.81-4.18-4.96-4.37-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.02-2.42.27-.29.59-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.59.82 2.02.89 2.17.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.69-.81.88-1.09.19-.28.37-.23.62-.14z"></path></svg>';
const tgSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.27 18.7 19.4c-.24 1.06-.87 1.32-1.77.82l-4.89-3.6-2.36 2.27c-.26.26-.48.48-.99.48l.35-5.02 9.13-8.25c.4-.35-.09-.55-.62-.2L6.27 13.1 1.4 11.58c-1.06-.33-1.08-1.06.22-1.57l19.05-7.34c.88-.33 1.65.2 1.23 1.6z"></path></svg>';

function header() {
  return `<header class="site-header">
  <div class="container nav">
    <a href="/" class="brand" aria-label="DevPars"><span class="logo" aria-hidden="true">${logoSvg}</span><span>DevPars<small>Software &amp; Web · remote</small></span></a>
    <nav class="nav-links" aria-label="Hauptnavigation">
      <a href="/#services">Leistungen</a>
      <a href="/#work">Referenzen</a>
      <a href="/#pricing">Preise</a>
      <a href="/#about">Über mich</a>
    </nav>
    <div class="nav-actions">
      <a href="/#contact" class="btn btn-primary" style="padding:10px 18px">Projekt anfragen</a>
    </div>
  </div>
</header>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="container footer-cols">
    <div class="foot-col">
      <div class="brand" style="font-size:1.05rem"><span class="logo" style="width:30px;height:30px" aria-hidden="true">${logoSvg}</span><span>DevPars</span></div>
      <p class="foot-tag">Webseiten &amp; individuelle Software aus Essen — für das Ruhrgebiet und deutschlandweit.</p>
      <div class="foot-contact">
        <a href="https://wa.me/${WA}" target="_blank" rel="noopener" aria-label="WhatsApp">${waSvg}</a>
        <a href="https://t.me/DevPars_de" target="_blank" rel="noopener" aria-label="Telegram">${tgSvg}</a>
      </div>
    </div>
    <div class="foot-col">
      <h4>Leistungen</h4>
      <a href="/webseite-erstellen-lassen-essen/">Webseite erstellen lassen</a>
      <a href="/online-shop-erstellen-lassen/">Online-Shop erstellen lassen</a>
      <a href="/online-terminbuchung/">Online-Terminbuchung</a>
      <a href="/individuelle-software-entwickeln-lassen/">Software &amp; REST-API</a>
    </div>
    <div class="foot-col">
      <h4>Branchen &amp; Standorte</h4>
      <a href="/webseite-fuer-restaurants/">Webseite für Restaurants</a>
      <a href="/webseite-fuer-handwerker/">Webseite für Handwerker</a>
      <a href="/persische-webseite/">Zweisprachig Deutsch-Persisch</a>
      <span>Essen · Ruhrgebiet · deutschlandweit</span>
    </div>
    <div class="foot-col">
      <h4>Kontakt</h4>
      <a href="/#contact">Projekt anfragen</a>
      <a href="/impressum.html">Impressum</a>
      <a href="/datenschutz.html">Datenschutz</a>
      <a href="/blog/was-kostet-eine-website/">Was kostet eine Website?</a>
    </div>
  </div>
  <div class="container" style="margin-top:18px;font-size:.8rem;color:var(--ink-400)">© <span id="year">2026</span> DevPars · Arman N.</div>
</footer>`;
}

function jsonLd(p, url, isArticle, crumbName) {
  const graph = [];
  if (isArticle) {
    graph.push({ '@type': 'BlogPosting', '@id': url + '#article', headline: p.h1, description: p.metaDesc, inLanguage: 'de',
      mainEntityOfPage: url, datePublished: PUBDATE, dateModified: PUBDATE,
      author: { '@id': BASE + '/#arman' }, publisher: { '@id': BASE + '/#devpars' }, image: BASE + '/assets/img/og.png' });
  } else {
    graph.push({ '@type': 'Service', '@id': url + '#service', name: p.h1, description: p.metaDesc, url,
      provider: { '@id': BASE + '/#devpars' }, areaServed: [{ '@type': 'Country', name: 'Germany' }, { '@type': 'City', name: 'Essen' }, { '@type': 'AdministrativeArea', name: 'Ruhrgebiet' }],
      availableChannel: { '@type': 'ServiceChannel', serviceUrl: BASE + '/#contact' } });
  }
  graph.push({ '@type': 'BreadcrumbList', '@id': url + '#bc', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Start', item: BASE + '/' },
    { '@type': 'ListItem', position: 2, name: crumbName, item: url },
  ] });
  if (p.faq && p.faq.length) {
    graph.push({ '@type': 'FAQPage', '@id': url + '#faq', mainEntity: p.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

function pageHtml(entry) {
  const p = entry.page;
  const isArticle = p.slug.startsWith('blog/');
  const url = BASE + '/' + p.slug + '/';
  const crumbName = isArticle ? 'Magazin' : 'Leistungen';
  const crumbLabel = isArticle ? 'Magazin' : 'Leistungen';

  const sections = p.sections.map((s) => `
  <section class="section-sm">
    <div class="container" style="max-width:780px">
      <h2 class="reveal">${esc(s.heading)}</h2>
      <div class="reveal lp-body">${s.bodyHtml}</div>
    </div>
  </section>`).join('');

  const faq = (p.faq && p.faq.length) ? `
  <section class="section" id="faq" style="background:var(--ink-50)">
    <div class="container" style="max-width:820px">
      <div class="section-head center reveal"><span class="eyebrow">FAQ</span><h2>Häufige Fragen</h2></div>
      <div class="faq-list">${p.faq.map((f) => `
        <details class="faq-item reveal"><summary>${esc(f.q)}</summary><div class="faq-a">${esc(f.a)}</div></details>`).join('')}
      </div>
    </div>
  </section>` : '';

  return `<!DOCTYPE html>
<html lang="de" dir="ltr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.metaDesc)}">
<meta name="theme-color" content="#2ea69d">
<link rel="canonical" href="${url}">
<meta property="og:type" content="${isArticle ? 'article' : 'website'}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.metaDesc)}">
<meta property="og:url" content="${url}">
<meta property="og:site_name" content="DevPars">
<meta property="og:locale" content="de_DE">
<meta property="og:image" content="${BASE}/assets/img/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.metaDesc)}">
<meta name="twitter:image" content="${BASE}/assets/img/og.png">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/fonts.css">
<link rel="stylesheet" href="/assets/css/styles.css">
<script type="application/ld+json">${jsonLd(p, url, isArticle, crumbName)}</script>
</head>
<body>
${header()}
<main id="top">
<section class="hero">
  <span class="hero-blob b1"></span>
  <span class="hero-blob b2"></span>
  <div class="container" style="position:relative;z-index:1;max-width:820px">
    <nav class="crumbs reveal" aria-label="Breadcrumb"><a href="/">Start</a> <span>›</span> <span>${esc(crumbLabel)}</span></nav>
    <h1 class="reveal" style="margin-top:10px">${esc(p.h1)}</h1>
    <div class="lead reveal">${p.introHtml}</div>
    <div class="hero-cta reveal">
      <a href="/#contact" class="btn btn-primary btn-lg">Kostenloses Angebot</a>
      <a href="https://wa.me/${WA}" class="btn btn-outline btn-lg" target="_blank" rel="noopener">WhatsApp</a>
    </div>
  </div>
</section>
${sections}
${faq}
<section class="section">
  <div class="container">
    <div class="contact reveal">
      <span class="eyebrow" style="color:var(--brand-300)">${esc(crumbLabel)}</span>
      <h2 style="max-width:18ch">${esc(p.ctaHeading)}</h2>
      <p style="max-width:56ch">${esc(p.ctaText)}</p>
      <div class="contact-actions" style="display:flex;flex-wrap:wrap;gap:13px;margin-top:24px">
        <a href="/#contact" class="btn btn-primary btn-lg">Projekt anfragen</a>
        <a href="https://wa.me/${WA}" class="btn btn-outline btn-lg" target="_blank" rel="noopener">Direkt per WhatsApp</a>
      </div>
    </div>
  </div>
</section>
</main>
${footer()}
<script src="/assets/js/app.js"></script>
<script>document.getElementById('year').textContent=new Date().getFullYear();</script>
</body></html>`;
}

// ---- build ----
const content = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'landing-content.json'), 'utf8'));
const landingUrls = [];
for (const entry of content) {
  if (!entry || !entry.page || !entry.page.slug) { console.log('skip', entry && entry.label); continue; }
  const slug = entry.page.slug.replace(/^\/+|\/+$/g, '');
  const outDir = path.join(ROOT, slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), pageHtml(entry), 'utf8');
  landingUrls.push(BASE + '/' + slug + '/');
  console.log('built', slug + '/index.html');
}

// ---- full sitemap (homepage de/en/fa + landing) ----
const homeAlt = `    <xhtml:link rel="alternate" hreflang="de" href="${BASE}/"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${BASE}/en/"/>\n    <xhtml:link rel="alternate" hreflang="fa" href="${BASE}/fa/"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/"/>`;
let urls = [`${BASE}/`, `${BASE}/en/`, `${BASE}/fa/`].map((u) => `  <url>\n    <loc>${u}</loc>\n${homeAlt}\n  </url>`);
urls = urls.concat(landingUrls.map((u) => `  <url>\n    <loc>${u}</loc>\n    <changefreq>monthly</changefreq>\n  </url>`));
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
console.log('built sitemap.xml with', 3 + landingUrls.length, 'urls');
console.log('DONE landing:', landingUrls.length);
