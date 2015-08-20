/**
 * templater.js
 *
 * Implements a micro-render for templating handlebars-style
 * templates.
 *
 * Ref:
 * https://github.com/krasimir/absurd/blob/master/lib/processors/html/helpers/TemplateEngine.js
 *
 * USAGE
 * var Render = reuqire('/path/to/template.js');
 * var tpl = '<div> {{ this.name }} </div>'
 * var html = Render(tpl, { name : 'jack' });
 *
 */

// TODO
// This renderer does not allow unused properties and will throw an error
// For future usability, it would be nice ot have 

var re = /{{(.+?)}}/g,
    regexp =  /(^( )?(var|if|for|else|switch|case|break|{|}|;))(.*)?/g,
    Fn = Function;

// renders the template as required
function Render(tpl, data) {
  'use strict';

  var cursor = 0,
      code = 'with (scope) { var r=[];\n',
      match, result;

  // esc is for escape
  function append(line, esc) {
    code += esc ?
      (line.match(regexp) ? line + '\n' : 'r.push(' + line + ');\n') :
      (line !== '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
  }

  // loop through the template, replacing javascript
  match = re.exec(tpl);
  while (match) {
    append(tpl.slice(cursor, match.index));
    append(match[1], true);
    cursor = match.index + match[0].length;
    match = re.exec(tpl);
  }

  append(tpl.substr(cursor, tpl.length - cursor));
  code = (code + 'return r.join(\'\'); }').replace(/[\r\t\n]/g, '');

  // attempt compilation
  try {    
    result = new Fn('scope', code).apply(data, [data]);
  } catch (error) {
    // console.error(error.message, '\n', code);
    console.error(error);
    console.error('HELP: Are you missing properties?\n');
  }

  return result;
}

module.exports =  Render;
