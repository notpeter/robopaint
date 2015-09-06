/**
 * @file RoboPaint Require module: provides a single function to help require
 * various named shortcut robopaint specific CommonJS modules listed below.
 */

var remote = require('remote');
var app = remote.require('app');
var appPath = app.getAppPath();

// List of shortcuts and paths to RP modules and other libraries.
var modules = {
  paper: {path: appPath + '/node_modules/paper/dist/paper-full', type: 'dom'},
  cnc_api: {path: appPath + '/node_modules/cncserver/example/cncserver.client.api', type: 'dom'},
  utils: {name: 'robopaint.utils', type: 'node'},
  mediasets: {name: 'robopaint.mediasets', type: 'node'},
  manager: {name: 'cncserver.manager', type: 'node'},
  wcb: {name: 'cncserver.wcb', type: 'node'},
  commander: {name: 'cncserver.commander', type: 'node'},
  cnc_utils: {name: 'cncserver.utils', type: 'node'}
};

/**
 * RoboPaint require wrapper function.
 *
 * @param {string} module
 *   The short name of the API module.
 * @param {function} callback
 *   Optional callback for when the script has loaded (for DOM insertion).
 */
 module.exports = rpRequire;
 function rpRequire(module, callback){
  var m = modules[module];

  if (m) {
    var modPath = m.path;

    if (m.name) {
      modPath = appPath + '/resources/rp_modules/' + m.name;
    }

    modPath+= '.js';

    if (m.type === 'dom') {
      if (m.added === true) {
        console.error('rpRequire DOM module "' + module + '" already loaded!"');
        return false;
      }
      insertScript(modPath).onload = callback;
      m.added = true;
    } else if (m.type === 'node') {
      return require(modPath);
    }
  } else { // Shortcut not found
    console.error('rpRequire module "' + module + '" not found or supported!"');
    return false;
  }

};

/**
 * Insert a script into the DOM of the mode page.
 *
 * @param {string} src
 *   The exact value of the src attribute to place in the script tag.
 */
function insertScript(src) {
  var script = window.document.createElement('script');
  script.src = src;

  script.async = false;
  window.document.head.appendChild(script);
  return script;
}