/* Wedding Planner — Export / Import backup of all localStorage keys starting with "wp-" (sync bookkeeping excluded),
   plus a generic saveFile() used for CSV exports. Native: Filesystem + Share sheet; browser: download. */
(function () {
  'use strict';
  var PREFIX = 'wp-', APP = 'wedding-planner';
  var cap = window.Capacitor, native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  function plugin(n) { try { return (cap.Plugins && cap.Plugins[n]) || (cap.registerPlugin ? cap.registerPlugin(n) : null); } catch (e) { return null; } }
  function collect() {
    var data = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0 && k.indexOf('wp-sync-') !== 0) data[k] = localStorage.getItem(k);
      }
    } catch (e) {}
    return { app: APP, version: 1, exportedAt: new Date().toISOString(), keys: data };
  }
  function stamp() { return new Date().toISOString().slice(0, 16).replace(/[-:T]/g, ''); }
  async function saveFile(name, text, mime) {
    var FS = native && plugin('Filesystem'), SH = native && plugin('Share');
    if (FS && SH) {
      try {
        var r = await FS.writeFile({ path: name, data: text, directory: 'CACHE', encoding: 'utf8' });
        await SH.share({ title: name, text: name, url: r.uri, dialogTitle: 'Save / send file' });
        return;
      } catch (e) { if (e && /cancel/i.test(String(e.message || e))) return; alert('Export failed: ' + (e && e.message || e)); return; }
    }
    var blob = new Blob([text], { type: mime || 'application/octet-stream' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function doExport() { return saveFile('wedding-planner-backup-' + stamp() + '.json', JSON.stringify(collect(), null, 2), 'application/json'); }
  function doImport(file) {
    var fr = new FileReader();
    fr.onload = function () {
      var obj;
      try { obj = JSON.parse(fr.result); } catch (e) { alert('Not a valid backup file.'); return; }
      var keys = obj && obj.app === APP && obj.keys;
      if (!keys || typeof keys !== 'object') { alert('Not a Wedding Planner backup file.'); return; }
      var names = Object.keys(keys).filter(function (k) { return k.indexOf(PREFIX) === 0 && k.indexOf('wp-sync-') !== 0 && typeof keys[k] === 'string'; });
      if (!names.length) { alert('Backup contains no data.'); return; }
      if (!confirm('Restore ' + names.length + ' saved sections from backup dated ' + (obj.exportedAt || '?') + '?\nThis replaces the matching data on this device.')) return;
      names.forEach(function (k) { try { localStorage.setItem(k, keys[k]); } catch (e) {} });
      location.reload();
    };
    fr.readAsText(file);
  }
  window.WPBackup = { collect: collect, saveFile: saveFile, exportJSON: doExport, importFile: doImport, stamp: stamp };
})();
