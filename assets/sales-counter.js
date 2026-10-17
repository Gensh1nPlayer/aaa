/* Snapshot baseline: 982 lifetime sales on 2026-10-18, including these 163 stock IDs.
 * Count newly Sold IDs from the loaded accounts.json, never browser-local visits/events.
 * Keep this baseline fixed. When archiving later sales, roll the baseline forward first.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RoshineSalesCounter = api;
})(typeof window === 'object' ? window : null, function () {
  'use strict';
  const baselineTotal = 982;
  const baselineSoldIds = new Set(["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","43","44","183","45","46","47","48","49","50","51","52","53","54","55","56","57","58","59","60","186","61","62","63","64","65","66","67","68","69","70","71","72","73","74","184","75","76","77","78","79","80","81","82","83","84","85","86","87","88","89","90","91","92","93","94","95","96","97","98","99","100","101","102","103","104","105","106","107","108","109","111","112","113","114","115","116","117","118","119","120","121","122","123","124","125","126","127","128","129","130","132","133","134","135","137","138","139","140","141","142","143","144","145","146","147","148","149","150","152","153","155","158","159","160","164","165","167","170","173","174","181"]);
  function totalSold(accounts) {
    const added = new Set();
    for (const row of Array.isArray(accounts) ? accounts : []) {
      if (!row || !['number','string'].includes(typeof row.id)) continue;
      const id = String(row.id);
      if (/^[1-9]\d{0,9}$/.test(id) && /^sold$/i.test(String(row.status || '').trim()) && !baselineSoldIds.has(id)) added.add(id);
    }
    return baselineTotal + added.size;
  }
  return Object.freeze({totalSold});
});
