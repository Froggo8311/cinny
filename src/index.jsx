import React from 'react';
import ReactDom from 'react-dom';
import './font';
import './index.scss';

import settings from './client/state/settings';

import App from './app/pages/App';

settings.applyTheme();

if (navigator.serviceWorker) {
  navigator.serviceWorker.register(new URL('./serviceWorker.js', import.meta.url), { scope: window.location.pathname })
    .then((reg) => reg.update().then(() => console.log('Service worker updated')));
}

ReactDom.render(
  <App />,
  document.getElementById('root'),
);
