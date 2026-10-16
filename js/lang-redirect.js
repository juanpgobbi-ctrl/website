/* Root page: send visitors to their browser language (default German). */
(function () {
  var langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'de']);
  var target = 'de';
  for (var i = 0; i < langs.length; i++) {
    var l = String(langs[i]).toLowerCase();
    if (l.indexOf('de') === 0) { target = 'de'; break; }
    if (l.indexOf('en') === 0) { target = 'en'; break; }
    if (l.indexOf('es') === 0) { target = 'es'; break; }
  }
  location.replace(target + '/index.html');
})();
