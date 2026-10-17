/* Display-only rank terminology. Never applied to skin names or stored account data. */
(function (root) {
  'use strict';
  const terms = {
    'Grandmaster':['Grand maître','Großmeister','Grandmaster','グランドマスター','宗师'],
    'Master':['Maître','Meister','Master','マスター','大师'],
    'Champion':['Virtuose','Champion','Champion','チャンピオン','英杰'],
    'Emerald':['Émeraude','Smaragd','Emerald','エメラルド','翡翠'],
    'Diamond':['Diamant','Diamant','Diamond','ダイヤモンド','钻石'],
    'Platinum':['Platine','Platin','Platinum','プラチナ','白金'],
    'Gold':['Or','Gold','Gold','ゴールド','黄金'],
    'Silver':['Argent','Silber','Silver','シルバー','白银'],
    'Bronze':['Bronze','Bronze','Bronze','ブロンズ','青铜'],
    'Unranked':['Non classé','Ohne Rang','Unranked','アンランク','未定级'],
    'Rank Reset':['Réinitialisation du rang','Rangzurücksetzung','إعادة ضبط الرتبة','ランク・リセット','段位重置'],
    'Fresh Rank Ready':['Compétition débloquée','Rangliste freigeschaltet','اللعب التنافسي متاح','ライバル・プレイ解放済み','排位解锁'],
    'Placement':['Parties de placement','Platzierungsspiele','مباريات تحديد الرتبة','スキル認定マッチ','定级赛']
  };
  const languages = ['fr','de','ar','ja','zh'];
  const pattern = new RegExp('\\b('+Object.keys(terms).join('|')+')\\b','gi');
  function translate(value, language) {
    const index = languages.indexOf(String(language || '').split('-')[0]);
    if (index < 0) return String(value);
    return String(value).replace(pattern, match => {
      const key = Object.keys(terms).find(key => key.toLowerCase() === match.toLowerCase());
      return terms[key][index];
    });
  }
  root.RoshineGameTerms = Object.freeze({translate});
})(typeof window === 'object' ? window : globalThis);
