/* DevPars static multilingual build.
   Source: src/site.html (trilingual, data-lang spans).
   Output: ./index.html (de), ./en/index.html, ./fa/index.html  + sitemap.xml + robots.txt
   Per page: one language only, correct lang/dir, self-canonical, reciprocal hreflang,
   JSON-LD (ProfessionalService/Person/Service/FAQPage/WebSite), OG, FAQ section, contact form. */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src', 'site.html');
// ⚠️ When devpars.de goes live: set BASE = 'https://devpars.de' and re-run `node build.js`.
// (All absolute canonical/hreflang/OG/JSON-LD URLs are derived from BASE.)
const BASE = 'https://arichoana.github.io/devpars';
const PHONE = '+4915750724109';
const WA = '4915750724109';
const FORM_ENDPOINT = 'https://formsubmit.co/arman.nakhaie@gmail.com';

const LANGS = {
  de: { dir: 'ltr', out: 'index.html', depth: 0, urlPath: '/' },
  en: { dir: 'ltr', out: path.join('en', 'index.html'), depth: 1, urlPath: '/en/' },
  fa: { dir: 'rtl', out: path.join('fa', 'index.html'), depth: 1, urlPath: '/fa/' },
};

const META = {
  de: {
    title: 'Webseite & Software erstellen lassen in Essen | DevPars – Webentwickler zum Festpreis',
    desc: 'Webdesigner & .NET-Entwickler aus Essen: moderne Websites, Onlineshops, Terminbuchung & individuelle Software – DSGVO-konform, SEO-optimiert, zum fairen Festpreis. 100 % remote, deutschlandweit.',
    ogTitle: 'DevPars – Webseite & individuelle Software erstellen lassen | Essen',
  },
  en: {
    title: 'Web Development & Custom Software from Essen | DevPars – Senior Developer',
    desc: 'Senior full-stack .NET/C# developer from Essen, Germany: modern websites, online shops, booking systems & custom software – GDPR-compliant, fair fixed prices, 100% remote.',
    ogTitle: 'DevPars – Professional Websites & Custom Software | 100% remote',
  },
  fa: {
    title: 'طراحی سایت و نرم‌افزار سفارشی در آلمان | دِوپارس – برنامه‌نویس ایرانی در اِسن',
    desc: 'برنامه‌نویس و طراحِ ارشدِ ایرانی در اِسنِ آلمان: وب‌سایتِ مدرن، فروشگاهِ آنلاین، سیستمِ نوبت‌دهی و نرم‌افزارِ سفارشی — منطبق با DSGVO، قیمتِ ثابتِ منصفانه، ۱۰۰٪ ریموت در سراسر آلمان.',
    ogTitle: 'دِوپارس – طراحی سایت و نرم‌افزار سفارشی | برنامه‌نویس ایرانی در آلمان',
  },
};

const FAQ = {
  de: [
    ['Was kostet eine Website?', 'Einfache Websites starten bei ca. 690 € (Onepager), mehrseitige Business-Websites ab 1.690 € – immer als transparenter Festpreis, kein Abo. Den genauen Preis nenne ich nach einem kurzen, kostenlosen Gespräch.'],
    ['Arbeiten Sie deutschlandweit und remote?', 'Ja, zu 100 % remote – egal wo in Deutschland Sie sind. Persönliche Termine im Raum Essen/Ruhrgebiet sind ebenfalls möglich.'],
    ['Sprechen Sie Deutsch und Persisch?', 'Ja – Deutsch, Englisch und Persisch (Farsi). Ich betreue auch persischsprachige Kundinnen und Kunden und baue zweisprachige Websites mit korrektem RTL.'],
    ['Festpreis oder Stundensatz?', 'Websites zum Festpreis – Sie wissen vorher genau, was es kostet. Individuelle Software läuft optional über einen fairen Stundensatz (89 €/Std.) oder über Festpreis-Pakete.'],
    ['Sind die Websites DSGVO-konform?', 'Ja. Jede Website kommt rechtssicher mit Impressum, Datenschutzerklärung, Cookie-Banner und – auf Wunsch – Hosting auf deutschen Servern.'],
    ['Wie lange dauert ein Projekt?', 'Ein Onepager ist oft in wenigen Tagen online, eine Business-Website meist in 1–3 Wochen – abhängig vom Umfang und davon, wie schnell die Inhalte vorliegen.'],
  ],
  en: [
    ['What does a website cost?', 'Simple websites start around €690 (one-pager), multi-page business sites from €1,690 – always a transparent fixed price, no subscription. I give you the exact price after a short, free call.'],
    ['Do you work remotely across Germany?', 'Yes, 100% remote – wherever you are in Germany. In-person meetings in the Essen/Ruhr area are also possible.'],
    ['Do you speak German and Persian?', 'Yes – German, English and Persian (Farsi). I also serve Persian-speaking clients and build bilingual websites with proper right-to-left (RTL) support.'],
    ['Fixed price or hourly rate?', 'Websites at a fixed price – you know the cost upfront. Custom software optionally runs on a fair hourly rate (€89/h) or fixed-price packages.'],
    ['Are the websites GDPR-compliant?', 'Yes. Every website ships legally compliant with an imprint, privacy policy, cookie banner and – on request – hosting on German servers.'],
    ['How long does a project take?', 'A one-pager is often live in a few days, a business website usually in 1–3 weeks – depending on scope and how quickly the content is ready.'],
  ],
  fa: [
    ['هزینه‌ی یک وب‌سایت چقدر است؟', 'وب‌سایت‌های ساده از حدودِ ۶۹۰€ (تک‌صفحه) و سایت‌های چندصفحه‌ایِ کسب‌وکار از ۱۶۹۰€ شروع می‌شوند — همیشه قیمتِ ثابت و شفاف، بدونِ اشتراک. قیمتِ دقیق را بعد از یک گفت‌وگوی کوتاهِ رایگان می‌گویم.'],
    ['آیا ریموت و در سراسر آلمان کار می‌کنید؟', 'بله، ۱۰۰٪ ریموت — هر جای آلمان که باشید. جلسه‌ی حضوری در منطقه‌ی اِسن/روهر هم ممکن است.'],
    ['آلمانی و فارسی صحبت می‌کنید؟', 'بله — آلمانی، انگلیسی و فارسی. مشتریانِ فارسی‌زبان را هم پشتیبانی می‌کنم و وب‌سایتِ دوزبانه با راست‌به‌چپِ (RTL) درست می‌سازم.'],
    ['قیمتِ ثابت یا ساعتی؟', 'وب‌سایت‌ها قیمتِ ثابت دارند — از قبل دقیق می‌دانید چقدر می‌شود. نرم‌افزارِ سفارشی به‌صورتِ اختیاری با نرخِ منصفانه‌ی ساعتی (۸۹€) یا پکیجِ ثابت انجام می‌شود.'],
    ['آیا سایت‌ها منطبق با DSGVO هستند؟', 'بله. هر وب‌سایت با Impressum، سیاستِ حریمِ خصوصی، بنرِ کوکی و — در صورتِ تمایل — هاست روی سرورهای آلمان تحویل می‌شود.'],
    ['یک پروژه چقدر طول می‌کشد؟', 'یک تک‌صفحه اغلب در چند روز آنلاین می‌شود، یک سایتِ کسب‌وکار معمولاً ۱ تا ۳ هفته — بسته به حجمِ کار و سرعتِ آماده‌شدنِ محتوا.'],
  ],
};

const T = {
  de: {
    faqEyebrow: 'FAQ', faqHeading: 'Häufige Fragen',
    contactEyebrow: 'Kontakt', contactHeading: 'Lassen Sie uns Ihr Projekt besprechen',
    contactSub: 'Kostenloses Erstgespräch, klares Festpreis-Angebot, Antwort meist innerhalb von 24 Stunden. Schreiben Sie mir auf Deutsch, English oder فارسی.',
    formTitle: 'Projektanfrage', formSub: 'Erzählen Sie kurz, was Sie brauchen – ein paar Stichworte genügen.',
    fName: 'Name', fEmail: 'E-Mail', fPhone: 'Telefon', fType: 'Was brauchen Sie?', fBudget: 'Budget (optional)',
    fMsg: 'Ihre Nachricht', fMsgPh: 'Worum geht es? Je mehr Details, desto besser.', fFile: 'Datei / Foto anhängen (optional)',
    optional: 'optional',
    types: ['Bitte wählen…', 'Webseite / Homepage', 'Onepager', 'Online-Shop', 'Terminbuchung', 'Individuelle Software / App', 'Bestehende Seite überarbeiten', 'Sonstiges'],
    budgets: ['Noch unklar', 'unter 500 €', '500–1.000 €', '1.000–3.000 €', 'über 3.000 €'],
    consent: 'Ich habe die <a href="datenschutz.html">Datenschutzerklärung</a> gelesen und bin mit der Verarbeitung meiner Angaben zur Kontaktaufnahme einverstanden.',
    submit: 'Anfrage senden', orWa: 'Oder direkt:',
  },
  en: {
    faqEyebrow: 'FAQ', faqHeading: 'Frequently asked questions',
    contactEyebrow: 'Contact', contactHeading: "Let's talk about your project",
    contactSub: 'Free first call, a clear fixed-price quote, reply usually within 24 hours. Write to me in German, English or فارسی.',
    formTitle: 'Project request', formSub: 'Tell me briefly what you need – a few keywords are enough.',
    fName: 'Name', fEmail: 'Email', fPhone: 'Phone', fType: 'What do you need?', fBudget: 'Budget (optional)',
    fMsg: 'Your message', fMsgPh: "What's it about? The more detail, the better.", fFile: 'Attach a file / photo (optional)',
    optional: 'optional',
    types: ['Please choose…', 'Website / Homepage', 'One-pager', 'Online shop', 'Booking system', 'Custom software / app', 'Revamp an existing site', 'Other'],
    budgets: ['Not sure yet', 'under €500', '€500–1,000', '€1,000–3,000', 'over €3,000'],
    consent: 'I have read the <a href="../datenschutz.html">privacy policy</a> and agree to my details being processed to get in touch.',
    submit: 'Send request', orWa: 'Or directly:',
  },
  fa: {
    faqEyebrow: 'سؤالات متداول', faqHeading: 'سؤال‌های پرتکرار',
    contactEyebrow: 'تماس', contactHeading: 'بیایید درباره‌ی پروژه‌تان صحبت کنیم',
    contactSub: 'مشاوره‌ی اولیه‌ی رایگان، پیشنهادِ قیمتِ ثابت و روشن، پاسخ معمولاً ظرفِ ۲۴ ساعت. به آلمانی، انگلیسی یا فارسی برایم بنویسید.',
    formTitle: 'درخواست پروژه', formSub: 'کوتاه بگویید چه می‌خواهید — چند کلمه هم کافی است.',
    fName: 'نام', fEmail: 'ایمیل', fPhone: 'تلفن', fType: 'چه می‌خواهید؟', fBudget: 'بودجه (اختیاری)',
    fMsg: 'پیامِ شما', fMsgPh: 'موضوع چیست؟ هرچه جزئی‌تر، بهتر.', fFile: 'پیوستِ فایل / عکس (اختیاری)',
    optional: 'اختیاری',
    types: ['انتخاب کنید…', 'وب‌سایت', 'تک‌صفحه', 'فروشگاهِ آنلاین', 'سیستمِ نوبت‌دهی', 'نرم‌افزار / اپِ سفارشی', 'بازطراحیِ سایتِ موجود', 'سایر'],
    budgets: ['هنوز مشخص نیست', 'زیر ۵۰۰€', '۵۰۰–۱۰۰۰€', '۱۰۰۰–۳۰۰۰€', 'بالای ۳۰۰۰€'],
    consent: '<a href="../datenschutz.html">سیاستِ حریمِ خصوصی</a> را خوانده‌ام و با پردازشِ اطلاعاتم برای تماس موافقم.',
    submit: 'ارسالِ درخواست', orWa: 'یا مستقیم:',
  },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';

function langSwitchHtml(cur) {
  const href = { de: cur === 'de' ? './' : '../', en: cur === 'en' ? './' : (cur === 'de' ? 'en/' : '../en/'), fa: cur === 'fa' ? './' : (cur === 'de' ? 'fa/' : '../fa/') };
  const lbl = { de: 'DE', en: 'EN', fa: 'فا' };
  return ['de', 'en', 'fa'].map((l) =>
    `<a href="${href[l]}" hreflang="${l}" class="${l === cur ? 'active' : ''}"${l === cur ? ' aria-current="page"' : ''}>${lbl[l]}</a>`
  ).join('');
}

function faqHtml(lang) {
  const t = T[lang];
  const items = FAQ[lang].map(([q, a]) => `
      <details class="faq-item reveal">
        <summary>${esc(q)}</summary>
        <div class="faq-a">${a}</div>
      </details>`).join('');
  return `
<section class="section" id="faq">
  <div class="container" style="max-width:820px">
    <div class="section-head center reveal">
      <span class="eyebrow">${esc(t.faqEyebrow)}</span>
      <h2>${esc(t.faqHeading)}</h2>
    </div>
    <div class="faq-list">${items}
    </div>
  </div>
</section>`;
}

function formHtml(lang) {
  const t = T[lang];
  const opts = (arr) => arr.map((o, i) => `<option${i === 0 ? ' value=""' : ` value="${esc(o)}"`}>${esc(o)}</option>`).join('');
  return `
      <form class="form-card reveal" action="${FORM_ENDPOINT}" method="POST" enctype="multipart/form-data">
        <input type="hidden" name="_subject" value="DevPars – Projektanfrage (${lang})">
        <input type="hidden" name="_template" value="table">
        <input type="hidden" name="_captcha" value="false">
        <input type="text" name="_honey" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
        <h3>${esc(t.formTitle)}</h3>
        <p class="fc-sub">${esc(t.formSub)}</p>
        <div class="form-row">
          <div class="field"><label>${esc(t.fName)} <span class="req">*</span></label><input class="input" type="text" name="Name" required></div>
          <div class="field"><label>${esc(t.fEmail)} <span class="req">*</span></label><input class="input" type="email" name="E-Mail" required></div>
        </div>
        <div class="form-row">
          <div class="field"><label>${esc(t.fPhone)} <span class="opt">(${esc(t.optional)})</span></label><input class="input" type="tel" name="Telefon"></div>
          <div class="field"><label>${esc(t.fType)}</label><select class="select" name="Projektart">${opts(t.types)}</select></div>
        </div>
        <div class="field"><label>${esc(t.fBudget)}</label><select class="select" name="Budget">${opts(t.budgets)}</select></div>
        <div class="field"><label>${esc(t.fMsg)} <span class="req">*</span></label><textarea class="textarea" name="Nachricht" placeholder="${esc(t.fMsgPh)}" required></textarea></div>
        <div class="field"><label>${esc(t.fFile)}</label><input class="file-input" type="file" name="attachment" accept="image/*,.pdf,.doc,.docx"></div>
        <label class="consent"><input type="checkbox" required> <span>${t.consent}</span></label>
        <button type="submit" class="btn btn-primary btn-lg">${esc(t.submit)}</button>
      </form>`;
}

function jsonLd(lang) {
  const desc = META[lang].desc;
  const url = BASE + LANGS[lang].urlPath;
  const graph = [
    {
      '@type': 'ProfessionalService', '@id': BASE + '/#devpars', name: 'DevPars',
      url, image: BASE + '/assets/img/og.png', logo: BASE + '/assets/img/favicon.svg',
      description: desc, telephone: PHONE, email: 'info@devpars.de', priceRange: '€€',
      areaServed: [
        { '@type': 'Country', name: 'Germany' }, { '@type': 'City', name: 'Essen' },
        { '@type': 'City', name: 'Bochum' }, { '@type': 'City', name: 'Dortmund' },
        { '@type': 'City', name: 'Düsseldorf' }, { '@type': 'AdministrativeArea', name: 'Ruhrgebiet' },
      ],
      address: { '@type': 'PostalAddress', addressLocality: 'Essen', addressCountry: 'DE' },
      knowsLanguage: ['de', 'en', 'fa'],
      founder: { '@id': BASE + '/#arman' }, provider: { '@id': BASE + '/#arman' },
      sameAs: ['https://t.me/DevPars_de', 'https://github.com/Arichoana'],
      serviceType: ['Webentwicklung', 'Webdesign', 'Online-Shop', 'Terminbuchungssystem', 'Individuelle Softwareentwicklung', 'REST API', 'Automatisierung'],
    },
    {
      '@type': 'Person', '@id': BASE + '/#arman', name: 'Arman Nakhaie',
      jobTitle: 'Senior Full-Stack .NET/C# Developer', url,
      worksFor: { '@id': BASE + '/#devpars' },
      knowsLanguage: ['de', 'en', 'fa'],
      knowsAbout: ['.NET', 'C#', 'ASP.NET Core', 'REST API', 'Webentwicklung', 'Online-Shops', 'WPF', '.NET MAUI', 'SQL', 'Automatisierung'],
      address: { '@type': 'PostalAddress', addressLocality: 'Essen', addressCountry: 'DE' },
      sameAs: ['https://github.com/Arichoana', 'https://t.me/DevPars_de'],
    },
    {
      '@type': 'WebSite', '@id': url + '#website', url, name: 'DevPars',
      inLanguage: lang, publisher: { '@id': BASE + '/#devpars' },
    },
    {
      '@type': 'FAQPage', '@id': url + '#faq',
      mainEntity: FAQ[lang].map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ];
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

function rewriteRelative($, depth) {
  if (!depth) return;
  const fix = (v) => {
    if (!v) return v;
    if (/^(https?:)?\/\//.test(v) || v.startsWith('#') || v.startsWith('mailto:') || v.startsWith('tel:') || v.startsWith('data:') || v.startsWith('/')) return v;
    return '../'.repeat(depth) + v;
  };
  $('[href]').each((_, el) => { const $e = $(el); if (!$e.attr('href').startsWith('#') && !$e.is('.lang-switch a')) $e.attr('href', fix($e.attr('href'))); });
  $('[src]').each((_, el) => { const $e = $(el); $e.attr('src', fix($e.attr('src'))); });
}

function build(lang) {
  const cfg = LANGS[lang];
  const $ = cheerio.load(fs.readFileSync(SRC, 'utf8'), { decodeEntities: false });

  // 1) language split: keep only this language's data-lang nodes.
  // Keep the matching element AS-IS (just drop the data-lang attr) so meaningful
  // tags like <small>/<div> survive; remove the other languages entirely.
  $('[data-lang]').each((_, el) => {
    const $e = $(el);
    if ($e.attr('data-lang') === lang) { $e.removeAttr('data-lang'); }
    else { $e.remove(); }
  });

  // 2) html lang/dir
  $('html').attr('lang', lang).attr('dir', cfg.dir);

  // 3) clean head bits we control
  $('title').removeAttr('data-t-de').removeAttr('data-t-en').removeAttr('data-t-fa').text(META[lang].title);
  $('meta[name="description"]').attr('content', META[lang].desc);
  $('meta[property="og:title"]').attr('content', META[lang].ogTitle);
  $('meta[property="og:description"]').attr('content', META[lang].desc);

  // 4) fix relative asset/link paths for depth BEFORE injecting absolute head tags
  rewriteRelative($, cfg.depth);

  // 5) inject SEO head: canonical, hreflang cluster, OG extras, JSON-LD
  const head = $('head');
  const abs = BASE + cfg.urlPath;
  head.append(`\n<link rel="canonical" href="${abs}">`);
  head.append(`\n<link rel="alternate" hreflang="de" href="${BASE}/">`);
  head.append(`\n<link rel="alternate" hreflang="en" href="${BASE}/en/">`);
  head.append(`\n<link rel="alternate" hreflang="fa" href="${BASE}/fa/">`);
  head.append(`\n<link rel="alternate" hreflang="x-default" href="${BASE}/">`);
  head.append(`\n<meta property="og:url" content="${abs}">`);
  head.append(`\n<meta property="og:site_name" content="DevPars">`);
  head.append(`\n<meta property="og:locale" content="${lang === 'de' ? 'de_DE' : lang === 'en' ? 'en_US' : 'fa_IR'}">`);
  head.append(`\n<meta property="og:image" content="${BASE}/assets/img/og.png">`);
  head.append(`\n<meta name="twitter:card" content="summary_large_image">`);
  head.append(`\n<meta name="twitter:title" content="${esc(META[lang].ogTitle)}">`);
  head.append(`\n<meta name="twitter:description" content="${esc(META[lang].desc)}">`);
  head.append(`\n<meta name="twitter:image" content="${BASE}/assets/img/og.png">`);
  head.append(`\n<meta name="robots" content="index,follow,max-image-preview:large">`);
  head.append(`\n<script type="application/ld+json">${jsonLd(lang)}</script>`);

  // 6) rebuild language switcher as <a> links (desktop + add a mobile copy)
  $('.lang-switch').html(langSwitchHtml(lang)).attr('role', null).attr('aria-label', 'Sprache / Language');

  // 7) inject FAQ before #contact and the contact form
  $('#contact').before(faqHtml(lang));
  $('#faq a[href="#contact"]'); // noop guard
  $('#contact .contact-actions').replaceWith(
    `<div class="contact-grid">
      <div class="contact-left">
        <a href="https://wa.me/${WA}" class="btn btn-outline btn-lg wa-quick" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.13c-.24.68-1.2 1.26-1.97 1.42-.52.11-1.2.2-3.49-.75-2.93-1.21-4.81-4.18-4.96-4.37-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.02-2.42.27-.29.59-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.59.82 2.02.89 2.17.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.69-.81.88-1.09.19-.28.37-.23.62-.14z"/></svg>
          WhatsApp
        </a>
        <p class="wa-note">${esc(T[lang].orWa)} +49 157 5072 4109</p>
      </div>
      ${formHtml(lang)}
    </div>`
  );

  // 8) write
  const outPath = path.join(ROOT, cfg.out);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const html = $.html();
  fs.writeFileSync(outPath, /^<!doctype/i.test(html) ? html : '<!DOCTYPE html>\n' + html, 'utf8');
  console.log('built', cfg.out);
}

function sitemap() {
  const langs = Object.keys(LANGS);
  const alt = langs.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE}${LANGS[l].urlPath}"/>`).join('\n') +
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/"/>`;
  const urls = langs.map((l) => `  <url>\n    <loc>${BASE}${LANGS[l].urlPath}</loc>\n${alt}\n  </url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  console.log('built sitemap.xml');
}

function robots() {
  const txt = `User-agent: *\nAllow: /\nDisallow: /danke.html\n\nSitemap: ${BASE}/sitemap.xml\n`;
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), txt, 'utf8');
  console.log('built robots.txt');
}

Object.keys(LANGS).forEach(build);
sitemap();
robots();
console.log('DONE');
