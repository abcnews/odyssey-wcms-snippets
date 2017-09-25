const {h, render} = require('preact');

const roots = Array.from(document.querySelectorAll('[data-odyssey-wcms-snippets-root]'));

if (window.__ODYSSEY__) {
  unwrapRoots();
} else {
  window.addEventListener('odyssey:api', unwrapRoots);
}

function unwrapRoots() {
  const main = document.querySelector('.Main');

  roots.forEach(root => {
    let parent = root;

    while (parent.parentElement !== main) {
      parent = parent.parentElement;
    }

    main.insertBefore(root, parent);
    main.removeChild(parent);

    root.classList.add('u-full');
  });
}

function init() {
  const App = require('./components/App');

  roots.forEach(root => {
    const config = root.querySelector('noscript');
    const functionBody = `return [${config.textContent}];`;
    const content = (new Function(functionBody))();

    root.classList.add('u-full');

    render(<App
      content={content}
      hasHeader={config.hasAttribute('header')}
      hasNav={config.hasAttribute('nav')}
      title={config.getAttribute('title')}
    />, root, root.lastChild);
  });

}

init();

if (module.hot) {
  module.hot.accept('./components/App', () => {
    try {
      init();
    } catch (err) {
      const ErrorBox = require('./components/ErrorBox');

      render(<ErrorBox error={err} />, root, root.firstChild);
    }
  });
}

if (process.env.NODE_ENV === 'development') {
  require('preact/devtools');
  
  console.debug(`[odyssey-wcms-snippets] public path: ${__webpack_public_path__}`);
}
