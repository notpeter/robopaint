# RoboPaint Modes
Everything you need to know about this creating or modifying the custom
RoboPaint interaction layer we call a "mode"!

## What is a "mode"?
A mode for RoboPaint shows up as a bubble on the home screen, and a tool bar tab
over every other mode and the home screen. These modes are complete web
applications with a base HTML file that is loaded into a controller sub-window
[Electron WebView](https://github.com/atom/electron/blob/master/docs/api/web-view-tag.md)
by RoboPaint, and loads shared JS/CSS, or anything else you like.

The "core" modes are `edit` and `paint`, with more coming as we think of them.
Each mode is intended to interact with the API in its own unique way, and
therefore allows an infinite set of functionality to piggyback on the existing
featureset and connectivity within RoboPaint.

## File Structure
Modes have **two** minimum required files: `package.json` and some root
`.html` file configured within it. That's it! Everything else about how the
page works is dealt with inside the `package.json` and your html file.

```javascript
|mymode/
|- package.json
|- mymode.html
|- mymode.css
|- mymode.js
|- _i18n/
|--- mymode.en-US.json
|--- mymode.fr.json
|-- ...
```

We recommend simply copying one of the existing modes that comes with RoboPaint,
and renaming the folder and the other files. RoboPaint support full translation,
so we also highly recommend designing your app to take full advantage of this.

## File Format: package.json
Though not exactly a node module, we take a cue from NPM and use the "open"
format for `package.json` to hold all top level mode configuration. See the
comments below for explanation on the non-obvious keys. It's expected the module
to be loaded via `npm install`, but how it gets into where RoboPaint can read it
isn't written in stone.


```javascript
{
  "name": "robopaint-mode-example", // Universal namespace ID for NPM, should be in this format!
  "version": "0.8.0",
  "type": "robopaint_mode", // If not equal to this, this package will be ignored.
  "main": "example.js",  // Not actually used by anything (as it should be included in your HTML)
  "author": "techninja",
  "license": "MIT",
  "robopaint": {  // All RoboPaint specific details should live here
    "core": false,  // If true, will be available by default. Otherwise it must be turned on manually.
    "debug": true,  // If true, the modes devtools window will open by default.
    "i18n": "native",  // The type of translation this mode supports. Either DOM or native, see below for details.
    "icon": "icon-font", // ICON: TODO: Changing format soon...
    "index": "example.html", // The path to the HTML file to open relative to this folder
    "name": "example", // The machine name of the mode. Lowercase, no spaces, same as folder.
    "opensvg": false,  // Set to true if this mode cares about opening SVGs.
    "weight": 2,  // How far left or right to place in the navigation
    "dependencies": [ // RoboPaint/Node/DOM modules to preload into the mode (so you don't have to!)
      "paper",
      "jquery",
      "underscore",
      "mediasets"
    ]
  }
}
```

## Translation (i18n): Now required for modes!
A requirement for RP modes is a bare minimum set of translation for its
informational strings, and at best, a full set of all strings shown to the user
in the default language of English, with support for other languages optional
but highly suggested. Just put your JSON translation files in your
`mymode/_i18n` folder and RP will parse and apply translations according to the
following two methods:

The two ways a mode will be translated:
 * **`native`**: Use i18next style attribute tags and translate strings in
place of all user displayed translatable text, and these will all be dynamically
replaced by their appropriate language  translated string automatically whenever
a language is selected globally. This is the best method when you control all
the code for the mode.
 * **`dom`**: Using a jQuery DOM selector mapping file, when a language is
selected, RP will iterate through the given DOM mapping and replace the
text contents with the translation string given. This is the best method when
the majority of code is third party and can't be directly edited.

### File Format: Mode translation `_i18n/[modename].[languagecode].json`
These are the minimum entries required for a mode. (Comments are for clarity and
are not actually allowed in valid JSON.)
```javascript
{
  "_meta": {  // Meta information is for reference only, not used directly.
    "creator": "myname",
    "target": "en-US",
    "release": "0.9.5",
    "basetype": "mode"
  },
  "info": {
    "word": "Print", // The word to be placed in the bubble navigation
    "description": "My mode!", // Text to show show on mode button hover
    "title": "My Mode Title", // If not core, will show in settings with checkbox to enable
    "detail": "Lots of detail text" // If not core, will show in settings below title
  },
  "myi18nsection": { // Optional standard i18next translation key:value structure...
     "mystring": "My string" // Available for translation at modes.[modename].myi18nsection.mystring
  }
}
```

### File Format: Mode DOM translation map `_i18n/[modename].map.json`
Only required if your translation mode is `dom` instead of `native`. Expects one
key outside of the `_meta` key, an array named `map` with the data pairs in the
format of key: jQuery selector, value: fully namespaced translation key. See the
excerpt of the Edit mode DOM map below for example.
```javascript
{
  "_meta": {
    "creator": "rogerfachini",
    "release": "0.9.5",
    "basetype": "DOMmap"
  },
  "map": {
    ".menu_title:eq(1)": "modes.edit.menu.file.title",
    ".menu_title:eq(2)": "modes.edit.menu.edit.title",
    ...
    "#tool_select": {"title": "modes.tools.select"} // Can also set attribute text directly with an object
  }
}
```

## HTML/JS Mode API
Your JavaScript has full Node.JS access, and HTML DOM access at the same time.
Feel free to use node modules specific to your mode in your `package.json`, or
use any of the modules available/used in RoboPaint or Electron. Also available
are the following `window` global variables:

 * `i18n`: The full i18next CommonJS client module, loaded with the modes full
 translation set, and the RP central translations for common strings.
 * `app`: The electron app object from the main process.
 * `rpRequire`: The helper function for adding RP "modules", external libraries,
 and any other commonly useful code. See rp.require.js for a full list of
 shortcuts
 * `ipc`: The Inter Process Communication module for sending events and messages
to/from the main window process. Most of this is managed here, but having this
globally available makes custom comms possible.
 * `cncserver`: _Only_ the clientside DOM API wrappers for cncserver.
 * `robopaint`: A limited version of the robopaint object. Contains: `settings`
 (read only), `utils`, `canvas`, `cncserver`, and the following:
    * `robopaint.pauseTillEmpty(init)` : Tell RoboPaint to pause the cncserver
    buffer until after pauseTillEmpty(false) has been called, and the
    local push buffer to the main buffer has been emptied. This ensures a
    perfectly smooth start to printing.
 * `mode`: JSON Package of the current mode, with `path`, and utility functions:
    * `mode.run({mixed})`: Emulation IPC passthrough of original commander
    API shortcut. Allows immediate queuing of ~500 cmds/sec to CNCServer, no
    callbacks required. See cncserver.commander.js for a full list of
    supported shortcut commands and their arguments.
    * `mode.settings`: An object with setters/getters to manage storing this
    modes specific settings. Automatically stores in `localStorage` per botType.
    * `mode.settings.$manage(selectors)`: A full settings management system for
    form elements. List the selectors for each input element you want to
    track, and from one call this will load, track changes & save all
    values automagically keyed on each elements ID!
    * `mode.fullCancel(message)`: Standardized full cancel, buffer clear and
    park with status message.

**The mode object is also where event callback functions should be defined, full
supported list here:**
 * `mode.translateComplete()`: Called whenever translate is done. Happens on
 init, and after every language change.
 * `mode.onPenUpdate(actualPen)`: Called when the bot actually moves, the
 the object will contain the full CNCServer pen object of where it
 should or will be after the "lastDuration" key value. Usually used to operate
 the live draw pen indicator.
 * `mode.onCallbackEvent(name)`: When a "callbackname" is run into the
 CNCserver buffer and eventually run, this will fire with the `name` given.
 Usually sent at the end of long jobs like autoPaint.
 * `mode.bindControls()`: A handy function to store all your control button
 bindings, called when the page is fully loaded & translation is done, but
 before .
 * `mode.onClose(callback)`: Called whenever the user attempts to either change
 the mode, or close the application. If implemented, the user can only close or
 change the mode once "callback" has been called.
 * `mode.onFullyResumed()` & `mode.onFullyPaused()`: A mode can run pause or
 resume, but doesn't know when this happens until these are called.
 * `mode.onMessage(channel, data)`: For any undefined gen events, wraps ipc.

### Quick Example

Here's a quick example using `mode.run()` for quick sequential moves and
actions. This will buffer the commands to pick a color, draw a square, wash the
brush, then park.

```javascript
mode.run([
  ['tool', 'color3'],
  'up',
  ['move', {x: 20, y: 20}],
  'down',
  ['move', {x: 400, y: 20}],
  ['move', {x: 400, y: 400}],
  ['move', {x: 20, y: 400}],
  ['move', {x: 20, y: 20}],
  'wash',
  'park'
]);
```

And that's just the start! Experiment with the example modes, make it better,
tweak it, or even just toss it all out. It's all up to you.

## Contribute back
If you'd like to get ***your*** mode back into the RoboPaint project,
just follow the instructions for contributing back with a pull request at the
bottom of [the main project readme](https://github.com/evil-mad/robopaint). To
be eligible for being added to RoboPaint, your mode must pass code quality and
security standards, and be available via [NPM](https://npmjs.org).