const {h, Component} = require('preact');
const styles = require('./App.scss');

let nextId = 0;

class App extends Component {
  constructor() {
    super();

    this.id = nextId++;
    this.messageHandler = this.messageHandler.bind(this);
  }

  componentDidMount() {
    window.addEventListener('message', this.messageHandler, false);
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.messageHandler, false);
  }

  messageHandler(event) {
    if (
      typeof event.data === 'object' &&
      event.data.domain === 'odyssey-wcms-snippets'
    ) {
      switch (event.data.type) {
        case 'init':
          this.frame.contentWindow.postMessage({
            type: 'id',
            id: this.id
          }, '*');
          break;
        case 'height':
          if (event.data.id === this.id) {
            this.frame.height = `${event.data.height}px`;
          }
          break;
        default:
          break;
      }
    }
  }
  
  render({content, hasHeader, hasNav, title}) {
    return (
      <div className={styles.root}>
        <div className={styles.editor}>
          <div className={styles.editorLabel}>
            Text:
          </div>
          <div className={styles.editorBox}>
            {contentToEditor(content)}
          </div>
        </div>
        <div className={styles.rendered}>
          <iframe
            ref={frame => this.frame = frame}
            src={frameSrc(contentToMarkup(content), hasHeader, hasNav, title)}
            frameBorder="0"
            scrolling="no"
            seamless />
        </div>
      </div>
    );
  }
}

function contentToEditor(content) {
  return content.map(line => {
    if (!line.length) {
      return <br/>;
    }

    switch (line[0]) {
      case '#':
        return (<p title="Tag">{`#${line[1]}`}</p>);
      case '>':
        return (<p title="Blockquote" className={styles.blockQuote}><p>{line[1]}</p>{line[2] ? <footer>{line[2]}</footer> : null}</p>);
      case '"':
        return (<p title="Pull-quote" className={styles.pullQuote}><p>{line[1]}</p>{line[2] ? <footer>{line[2]}</footer> : null}</p>);
      case '@':
        return (<a title="Internal Link" href={line[2]} target="_blank">{line[1]}</a>);
      default:
        break;
    }

    return (<p title="Text" className={line[1] && styles[line[0]]} dangerouslySetInnerHTML={{__html: line[1] || line[0]}}></p>);
  });
}

function contentToMarkup(content) {
  return content.map(line => {
    if (!line.length) {
      return '';
    }

    switch (line[0]) {
      case '#':
        return `<a name="${line[1]}"> </a>`;
      case '>':
        return (`<blockquote><p>${line[1]}</p>${line[2] ? `<p class="p--pullquote-byline">${line[2]}</p>` : ''}</blockquote>`);
      case '"':
        return (`<blockquote class="quote--pullquote"><p>${line[1]}</p>${line[2] ? `<p class="p--pullquote-byline">${line[2]}</p>` : ''}</blockquote>`);
      case '@':
        if (line[1] === 'image') {
          return `
            <figure class="embed-content">
              <article class="type-photo">
                <a href="${line[2]}">
                  <img src="${line[2]}" width="220" height="147" />
                  ${line[3] ? `<h3><strong>Photo</strong>${line[3]}</h3>` : ''}
                  ${line[4] ? `<span class="attribution">${line[4]}</span>` : ''}
                </a>
              </article>
            </figure>
          `;
        }

        return '';
      default:
        break;
    }

    if (line[1]) {
      return `<${line[0]}>${line[1]}</${line[0]}>`;
    }
    
    return line[0];
  })
  .join('\n');
}

function frameSrc(html, hasHeader, hasNav, title) {
  const doc = encodeURI(`
<!doctype html>
<html land="en-AU">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { margin: 0; min-height: 0 !important; }
      ${hasNav ? '' : '.Nav {display: none !important; }'}
      ${hasHeader ? '' : '.Header, .HiddenFirstPar {display: none !important;}'}
      .Main ~ * {display: none !important; }
    </style>
  </head>
  <body class="platform-mobile">
    <header>
      <nav id="abcHeader" class="global"></nav>
    </header>
    <div class="content">
      <article>
        <header>
          <h1>${title || 'WCMS Snippet'}</h1>
        </header>
        <div class="story richtext">
          ${hasHeader ? '' : '<p class="HiddenFirstPar"></p>'}
          ${html}
        </div>
      </article>
    </div>
    <script>
      (function (w, d, t, a) {
        w.onload = function () {
          var ls = d.getElementsByTagName(t)[0];
          a.forEach(function (src) {
            var s = document.createElement(t);
            s.async = true;
            s.src = src;
            ls.parentNode.insertBefore(s, ls);
          });
        };
        w.addEventListener('message', function (event) { 
          function postHeight() {
            w.parent.postMessage({
              domain: 'odyssey-wcms-snippets',
              type: 'height',
              id: event.data.id,
              height: d.documentElement.offsetHeight
            }, '*');
          }

          w.onresize = postHeight;
          postHeight();
        });
        setTimeout(function () {
          w.parent.postMessage({
            domain: 'odyssey-wcms-snippets',
            type: 'init'
          }, '*');
        }, 250);
      }(window, document, 'script', [
        'http://www.abc.net.au/res/sites/news-projects/odyssey/2.7.0/index.js'
      ]));
    </script>
    
  </body>
</html>
  `);

  return `data:text/html;charset=utf-8,${doc}`;
}

module.exports = App;
