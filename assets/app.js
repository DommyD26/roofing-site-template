async function loadSite(){
  const res = await fetch('/data/site.json');
  const conf = await res.json();
  const brand = document.querySelector('#brand');
  const cta = document.querySelector('#cta-phone');
  const city = document.querySelector('#city');
  const cityFoot = document.querySelector('#city-foot');
  const headline = document.querySelector('#headline');
  const year = document.querySelector('#year');
  const blogList = document.querySelector('#blog-list');

  brand.textContent = conf.brand_name;
  cta.textContent = `Call ${conf.phone_display}`;
  cta.href = `tel:${conf.phone}`;
  city.textContent = conf.city;
  cityFoot.textContent = conf.city;
  headline.innerHTML = `Your Local Roofing Experts in <span id="city">${conf.city}</span>`;
  year.textContent = new Date().getFullYear();

  // load blog summaries if available
  if (conf.posts && conf.posts.length){
    blogList.innerHTML = '';
    conf.posts.slice(0,3).forEach(p => {
      const el = document.createElement('a');
      el.href = p.url;
      el.className = 'card';
      el.innerHTML = `<strong>${p.title}</strong><div>${p.excerpt||''}</div>`;
      blogList.appendChild(el);
    });
  }
}
loadSite();
