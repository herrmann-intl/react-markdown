import marked from 'marked'
import React from 'react'
import _ from 'lodash'

let i = 0

function getKey(text){
  i = i+1
  return i
}

export class ReactRenderer extends marked.Renderer{
    constructor(options){
      super(options)
      this.interpolations = options.interpolations
      this.paragraph = this.paragraph.bind(this);
      this.textPreprocessor = options.textPreprocessor
    }

    normalizeText(text){
      // If all the children being rendered are just text elements,
      // feed them into a the textPreprocessor as a single template to allow
      // for additional transformations
      return this.textPreprocessor && _.every(text, t=> typeof(t) == "string") ?
        this.textPreprocessor(text.join(" ")) :
        text
    }

    heading(text, level, raw) {
      const TagName = `h${level}`
      const id = `${this.options.headerPrefix} ${raw.toLowerCase().replace(/[^\w]+/g, '-')}`
      return <TagName id={id}>text</TagName>
    }

    list(body, ordered) {
      const type = ordered ? 'ol' : 'ul';
      return React.createElement(type, {}, body)
    };

    listitem(text) {
      return <li key={getKey(text)}>{this.normalizeText(text)}</li>
    }

    link(href, title, text) {
      if (this.options.sanitize) {
        try {
          var prot = decodeURIComponent(unescape(href))
            .replace(/[^\w:]/g, '')
            .toLowerCase();
        } catch (e) {
          return <a></a>;
        }
        if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) {
          return <a></a>;
        }
      }
      return <a href={href} title={title}>{text}</a>

    }

    paragraph(text){
      return <p key={getKey(text)}>{this.normalizeText(text)}</p>
    }

    strong(text) {
      return (
        <strong key={getKey(text)}>
          {this.normalizeText(text)}
        </strong>
      )
    };

    em(text){
     return <em key={getKey(text)}>{this.normalizeText(text)}</em>
    }

    image(href, title, text){
      let props = { src: href, alt: text };
      if (title){
        props = _.merge({title: title})
      }
      return <img {...props} />;
    }
}

function unescape(html) {
 return html.replace(/&([#\w]+);/g, function (_, n) {
   n = n.toLowerCase();
   if (n === 'colon') return ':';
   if (n.charAt(0) === '#') {
     return n.charAt(1) === 'x'
       ? String.fromCharCode(parseInt(n.substring(2), 16))
       : String.fromCharCode(+n.substring(1));
   }
   return '';
 });
}

class ReactInlineLexer extends marked.InlineLexer{

  output(src){
        var out = []
            , link
            , text
            , href
            , cap;

        while (src) {
            // escape
            if (cap = this.rules.escape.exec(src)) {
                src = src.substring(cap[0].length);
                out.push(cap[1]);
                continue;
            }

            // autolink
            if (cap = this.rules.autolink.exec(src)) {
                src = src.substring(cap[0].length);
                if (cap[2] === '@') {
                    text = cap[1].charAt(6) === ':'
                        ? this.mangle(cap[1].substring(7))
                        : this.mangle(cap[1]);
                    href = this.mangle('mailto:') + text;
                } else {
                    text = escape(cap[1]);
                    href = text;
                }
                out.push(this.renderer.link(href, null, text));
                continue;
            }

            // url (gfm)
            if (cap = this.rules.url.exec(src)) {
                src = src.substring(cap[0].length);
                text = escape(cap[1]);
                href = text;
                out.push(this.renderer.link(href, null, text));
                continue;
            }

            // tag
            if (cap = this.rules.tag.exec(src)) {
                src = src.substring(cap[0].length);
                out.push(this.options.sanitize
                    ? escape(cap[0])
                    : cap[0]);
                continue;
            }

            // link
            if (cap = this.rules.link.exec(src)) {
                src = src.substring(cap[0].length);
                out.push(this.outputLink(cap, {
                    href:cap[2],
                    title:cap[3]
                }));
                continue;
            }

            // reflink, nolink
            if ((cap = this.rules.reflink.exec(src))
                || (cap = this.rules.nolink.exec(src))) {
                src = src.substring(cap[0].length);
                link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
                link = this.links[link.toLowerCase()];
                if (!link || !link.href) {
                    out.push(cap[0].charAt(0));
                    src = cap[0].substring(1) + src;
                    continue;
                }
                out.push(this.outputLink(cap, link));
                continue;
            }

            // strong
            if (cap = this.rules.strong.exec(src)) {
                src = src.substring(cap[0].length);
                out.push(this.renderer.strong(this.output(cap[2] || cap[1])));
                continue;
            }

            // em
            if (cap = this.rules.em.exec(src)) {
                src = src.substring(cap[0].length);
                out.push(this.renderer.em(this.output(cap[2] || cap[1])));
                continue;
            }

            // code
            if (cap = this.rules.code.exec(src)) {
                src = src.substring(cap[0].length);
                out.push(this.renderer.codespan(escape(cap[2], true)));
                continue;
            }

            // br
            if (cap = this.rules.br.exec(src)) {
                src = src.substring(cap[0].length);
                out.push(this.renderer.br());
                continue;
            }

            // del (gfm)
            if (cap = this.rules.del.exec(src)) {
                src = src.substring(cap[0].length);
                out.push(this.renderer.del(this.output(cap[1])));
                continue;
            }

            // text
            if (cap = this.rules.text.exec(src)) {
                src = src.substring(cap[0].length);
                out.push(this.smartypants(cap[0]));
                continue;
            }

            if (src) {
                throw new
                    Error('Infinite loop on byte: ' + src.charCodeAt(0));
            }
        }

        return out;
  }
}

export class ReactParser extends marked.Parser{

  parse(src){
    this.inline = new ReactInlineLexer(src.links, this.options, this.renderer);
    this.tokens = src.reverse();

    var out = [];
    while (this.next()) {
      out.push(this.tok());
    }

    return out.map((e,i)=> React.cloneElement(e, {key: i}));
  }

  tok() {
    switch (this.token.type) {
        case 'space':
        {
            return null;
        }
        case 'hr':
        {
            return this.renderer.hr();
        }
        case 'heading':
        {
            return this.renderer.heading(
                this.inline.output(this.token.text),
                this.token.depth,
                this.token.text);
        }
        case 'code':
        {
            return this.renderer.code(this.token.text,
                this.token.lang,
                this.token.escaped);
        }
        case 'table':
        {
            var header = ''
                , body = []
                , i
                , row
                , cell
                , flags
                , j;

            // header
            cell = [];
            for (i = 0; i < this.token.header.length; i++) {
                flags = { header:true, align:this.token.align[i] };
                cell.push(this.renderer.tablecell(
                    this.inline.output(this.token.header[i]),
                    { header:true, align:this.token.align[i] }
                ));
            }
            header.push(this.renderer.tablerow(cell));

            for (i = 0; i < this.token.cells.length; i++) {
                row = this.token.cells[i];

                cell = '';
                for (j = 0; j < row.length; j++) {
                    cell.push(this.renderer.tablecell(
                        this.inline.output(row[j]),
                        { header:false, align:this.token.align[j] }
                    ));
                }

                body.push(this.renderer.tablerow(cell));
            }
            return this.renderer.table(header, body);
        }
        case 'blockquote_start':
        {
            var body = [];

            while (this.next().type !== 'blockquote_end') {
                body.push(this.tok());
            }

            return this.renderer.blockquote(body);
        }
        case 'list_start':
        {
            var body = []
                , ordered = this.token.ordered;

            while (this.next().type !== 'list_end') {
                body.push( React.cloneElement(this.tok(), {key: body.length}));
            }

            return this.renderer.list(body, ordered);
        }
        case 'list_item_start':
        {
            var body = [];

            while (this.next().type !== 'list_item_end') {
                body.push(this.token.type === 'text'
                    ? this.parseText()
                    : this.tok()
                );
            }

            return this.renderer.listitem(body);
        }
        case 'loose_item_start':
        {
            var body = [];

            while (this.next().type !== 'list_item_end') {
                body.push(this.tok());
            }

            return this.renderer.listitem(body);
        }
        case 'html':
        {
            var html = !this.token.pre && !this.options.pedantic
                ? this.inline.output(this.token.text)
                : this.token.text;
            return this.renderer.html(html);
        }
        case 'paragraph':
        {
            return this.renderer.paragraph(this.inline.output(this.token.text));
        }
        case 'text':
        {
            return this.renderer.paragraph(this.parseText());
        }
    }
    }
}


// Renderer.prototype.code = function(code, lang, escaped) {
//   if (this.options.highlight) {
//     var out = this.options.highlight(code, lang);
//     if (out != null && out !== code) {
//       escaped = true;
//       code = out;
//     }
//   }
//
//   if (!lang) {
//     return '<pre><code>'
//       + (escaped ? code : escape(code, true))
//       + '\n</code></pre>';
//   }
//
//   return '<pre><code class="'
//     + this.options.langPrefix
//     + escape(lang, true)
//     + '">'
//     + (escaped ? code : escape(code, true))
//     + '\n</code></pre>\n';
// };
//
// Renderer.prototype.blockquote = function(quote) {
//   return '<blockquote>\n' + quote + '</blockquote>\n';
// };
//
// Renderer.prototype.html = function(html) {
//   return html;
// };
//
// Renderer.prototype.heading = function(text, level, raw) {
//   return '<h'
//     + level
//     + ' id="'
//     + this.options.headerPrefix
//     + raw.toLowerCase().replace(/[^\w]+/g, '-')
//     + '">'
//     + text
//     + '</h'
//     + level
//     + '>\n';
// };
//
// Renderer.prototype.hr = function() {
//   return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
// };
//
// Renderer.prototype.list = function(body, ordered) {
//   var type = ordered ? 'ol' : 'ul';
//   return '<' + type + '>\n' + body + '</' + type + '>\n';
// };
//
// Renderer.prototype.listitem = function(text) {
//   return '<li>' + text + '</li>\n';
// };
//
// Renderer.prototype.paragraph = function(text) {
//   return '<p>' + text + '</p>\n';
// };
//
// Renderer.prototype.table = function(header, body) {
//   return '<table>\n'
//     + '<thead>\n'
//     + header
//     + '</thead>\n'
//     + '<tbody>\n'
//     + body
//     + '</tbody>\n'
//     + '</table>\n';
// };
//
// Renderer.prototype.tablerow = function(content) {
//   return '<tr>\n' + content + '</tr>\n';
// };
//
// Renderer.prototype.tablecell = function(content, flags) {
//   var type = flags.header ? 'th' : 'td';
//   var tag = flags.align
//     ? '<' + type + ' style="text-align:' + flags.align + '">'
//     : '<' + type + '>';
//   return tag + content + '</' + type + '>\n';
// };
//
// // span level renderer
// Renderer.prototype.strong = function(text) {
//   return '<strong>' + text + '</strong>';
// };
//
// Renderer.prototype.em = function(text) {
//   return '<em>' + text + '</em>';
// };
//
// Renderer.prototype.codespan = function(text) {
//   return '<code>' + text + '</code>';
// };
//
// Renderer.prototype.br = function() {
//   return this.options.xhtml ? '<br/>' : '<br>';
// };
//
// Renderer.prototype.del = function(text) {
//   return '<del>' + text + '</del>';
// };
//
// Renderer.prototype.link = function(href, title, text) {
//   if (this.options.sanitize) {
//     try {
//       var prot = decodeURIComponent(unescape(href))
//         .replace(/[^\w:]/g, '')
//         .toLowerCase();
//     } catch (e) {
//       return '';
//     }
//     if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0) {
//       return '';
//     }
//   }
//   var out = '<a href="' + href + '"';
//   if (title) {
//     out += ' title="' + title + '"';
//   }
//   out += '>' + text + '</a>';
//   return out;
// };
//
//
// Renderer.prototype.text = function(text) {
//   return text;
// };
