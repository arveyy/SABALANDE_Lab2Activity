let currentUser = null;

function navigateTo(hash) {
  window.location.hash = hash;
}

function handleRouting() {
  const hash = window.location.hash || '#/';
  const pages = document.querySelectorAll('.page');

  pages.forEach(page => page.classList.remove('active'));

  switch(hash) {
    case '#/':
      document.getElementById('home-page').classList.add('active');
      break;
    case '#/register':
      document.getElementById('register-page').classList.add('active');
      break;
    case '#/verify-email':
      document.getElementById('verify-email-page').classList.add('active');
      break;
    case '#/login':
      document.getElementById('login-page').classList.add('active');
      break;
    case '#/profile':
      if (!currentUser) { navigateTo('#/login'); return; }
      document.getElementById('profile-page').classList.add('active');
      renderProfile();
      break;
    case '#/employees':
    case '#/departments':
    case '#/accounts':
      if (!currentUser || !currentUser.isAdmin) { navigateTo('#/'); return; }
      document.getElementById(hash.slice(2) + '-page').classList.add('active');
      break;
    case '#/requests':
      if (!currentUser) { navigateTo('#/login'); return; }
      document.getElementById('requests-page').classList.add('active');
      break;
  }
}

window.addEventListener('hashchange', handleRouting);
window.addEventListener('load', () => {
  handleRouting();
});
