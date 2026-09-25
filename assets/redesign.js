(() => {
  const copy = {
    en: {
      openSince:'Open since 2021', liveInventory:'Live inventory', howToBuy:'How to buy', availableNow:'available now', owSplit:'OW1 / OW2', currentRange:'current range', accountsSold:'accounts sold',
      featuredDrop:'FEATURED STOCK', activeCurrency:'Active Currencies & Time Played', viewDetails:'View details →', clearDetails:'Clear account details', guidedHandover:'Guided handover',
      moreThanAccounts:'MORE THAN ACCOUNTS', storeTitle:'Everything around your order, in one place.', storeDesc:'Start with the live account list, then use Discord when you are ready to confirm availability, payment, or a service request.',
      accountsOffer:'Overwatch accounts', accountsOfferDesc:'From clean starter accounts to OW1 collections, rare cosmetics, rank-ready options, and stacked inventories.', browseAccounts:'Browse accounts',
      currencyOffer:'Discount Coins & Mythic Prisms', currencyOfferDesc:'Availability changes. Review the current options, pricing, delivery method, and important conditions before ordering.', viewCurrencyDetails:'View prices & details',
      currencyKicker:'COINS & MYTHIC PRISMS', currencyTitle:'Choose the delivery option that fits your order.', currencyIntro:'Two separate options with different delivery methods. Confirm current availability and eligibility on Discord before payment.',
      creditServiceEyebrow:'DIRECT CREDIT · ALL REGIONS', creditServiceTitle:'Discount Coins & Mythic Prisms', confirmAvailability:'CONFIRM FIRST', creditServiceDesc:'Coins or Prisms are credited to an eligible Battle.net account using an unofficial promotional pricing method.', owCoins:'Overwatch Coins', mythicPrisms:'Mythic Prisms', orderOnDiscord:'Order on Discord',
      keyServiceEyebrow:'CD KEY · BATTLE.NET REDEMPTION', keyServiceTitle:'Discount Overwatch Coins', temporarilyPaused:'PAUSED', keyServiceDesc:'A redeemable Battle.net CD KEY for standard Overwatch Coins. New orders are currently paused until stock returns.', deliveryLabel:'Delivery', keyDelivery:'Redeem the supplied CD KEY directly through your Battle.net account.', askRestockDiscord:'Ask about restock on Discord',
      directCreditConditions:'Direct-credit conditions', currencyNoticeOne:'The direct-credit option supports Battle.net accounts across all regions, subject to eligibility.', currencyNoticeTwo:'Spend credited Coins or Prisms immediately after login; they are not intended to be saved for later.', currencyNoticeThree:'Within 1–24 hours the remaining balance may become negative, while purchased items are expected to remain.', currencyNoticeFour:'Availability, delivery method, timing, and account suitability must be confirmed on Discord before payment.',
      serviceOffer:'Account services', serviceOfferDesc:'Region-change assistance and unban appeal support for eligible accounts. Results depend on the account and official review.', reviewServices:'Review services',
      fastDelivery:'Fast handover after payment', directSupport:'Direct support through Discord', warrantyScope:'Clear warranty scope', paymentChoices:'Card, PayPal, crypto & gift cards',
      storyKicker:'FROM A GOOGLE SHEET TO ROSHINE', storyTitle:'Built on referrals, not ad spend.', storyIntro:'I started trading Overwatch accounts with friends in 2021. What began as a small list for people I knew grew through repeat buyers and recommendations—not paid promotion.',
      storyStartTitle:'A small start', storyStartText:'The first accounts were sourced for friends, personal use, and a small circle of buyers. Every deal was handled directly.',
      storyMarketplaceYear:'MARKETPLACE', storyMarketplaceTitle:'IGVault Top 3 Overwatch seller', storyMarketplaceText:'The store later ranked among IGVault’s Top 3 Overwatch sellers. High platform fees eventually made a direct Discord store the better way to serve returning buyers.',
      storyDiscordYear:'DISCORD', storyDiscordTitle:'Word of mouth did the work', storyDiscordText:'Advertising stayed close to zero. Buyers came back, introduced friends, and helped the community grow across Europe, the United States, Japan, and beyond.',
      storyWebsiteTitle:'The list became a real storefront', storyWebsiteText:'The original Google Sheet moved here, with searchable live stock and Imgur screenshots so each account is easier to compare before opening a ticket.',
      priceKicker:'WHY THE PRICE IS DIFFERENT', priceTitle:'Not the cheapest account. A safer handover.', priceText:'I do not compete with anonymous, mass-listed accounts on price. You pay more for a clearer account history, screenshots, direct answers before payment, guided delivery, and support if a verified previous-owner problem appears later.',
      pricePointOne:'Account details and availability confirmed before payment', pricePointTwo:'Stripe, PayPal, Binance and Bitcoin options', pricePointThree:'Recovery first, then replacement, refund or fair compensation when covered', priceFootnote:'Warranty eligibility depends on the cause, available proof, and safe account handling after delivery.',
      paymentWord:'PAYMENT', methodsWord:'METHODS', paymentDesc:'Cards are processed through Stripe. Pay with Visa, Mastercard, PayPal, Bitcoin, or supported gift cards.', contactNote:'Send the account ID—or a screenshot if that is easier. We will confirm what is available and answer any questions before payment.', searchStock:'Search stock'
    },
    fr: {
      openSince:'Ouvert depuis 2021', liveInventory:'Stock en direct', howToBuy:'Comment acheter', availableNow:'disponibles', owSplit:'OW1 / OW2', currentRange:'fourchette actuelle', accountsSold:'comptes vendus',
      featuredDrop:'SÉLECTION', activeCurrency:'Monnaies disponibles & temps de jeu', viewDetails:'Voir les détails →', clearDetails:'Informations claires', guidedHandover:'Transfert accompagné',
      moreThanAccounts:'PLUS QUE DES COMPTES', storeTitle:'Tout ce qui entoure votre commande, au même endroit.', storeDesc:'Commencez par le stock en direct, puis utilisez Discord pour confirmer la disponibilité, le paiement ou une demande de service.',
      accountsOffer:'Comptes Overwatch', accountsOfferDesc:'Comptes récents, collections OW1, cosmétiques rares, options classées et inventaires complets.', browseAccounts:'Voir les comptes',
      currencyOffer:'Coins & prismes mythiques à prix réduit', currencyOfferDesc:'La disponibilité varie. Consultez les options, tarifs, modes de livraison et conditions importantes avant de commander.', viewCurrencyDetails:'Voir les tarifs et détails',
      currencyKicker:'COINS & PRISMES MYTHIQUES', currencyTitle:'Choisissez le mode de livraison adapté à votre commande.', currencyIntro:'Deux options distinctes avec des modes de livraison différents. Confirmez la disponibilité et l’éligibilité sur Discord avant le paiement.',
      creditServiceEyebrow:'CRÉDIT DIRECT · TOUTES RÉGIONS', creditServiceTitle:'Coins & prismes mythiques à prix réduit', confirmAvailability:'À CONFIRMER', creditServiceDesc:'Les Coins ou Prismes sont crédités sur un compte Battle.net éligible via une méthode de tarification promotionnelle non officielle.', owCoins:'Coins Overwatch', mythicPrisms:'Prismes mythiques', orderOnDiscord:'Commander sur Discord',
      keyServiceEyebrow:'CD KEY · ACTIVATION BATTLE.NET', keyServiceTitle:'Coins Overwatch à prix réduit', temporarilyPaused:'EN PAUSE', keyServiceDesc:'Une CD KEY Battle.net échangeable contre des Coins Overwatch standards. Les nouvelles commandes sont suspendues jusqu’au retour du stock.', deliveryLabel:'Livraison', keyDelivery:'Activez directement la CD KEY fournie sur votre compte Battle.net.', askRestockDiscord:'Demander le réassort sur Discord',
      directCreditConditions:'Conditions du crédit direct', currencyNoticeOne:'L’option de crédit direct prend en charge les comptes Battle.net de toutes les régions, sous réserve d’éligibilité.', currencyNoticeTwo:'Dépensez les Coins ou Prismes crédités immédiatement après la connexion ; ils ne sont pas destinés à être conservés.', currencyNoticeThree:'Sous 1 à 24 heures, le solde restant peut devenir négatif, tandis que les objets achetés devraient rester.', currencyNoticeFour:'La disponibilité, le mode de livraison, le délai et l’éligibilité du compte doivent être confirmés sur Discord avant paiement.',
      serviceOffer:'Services de compte', serviceOfferDesc:'Aide au changement de région et aux appels de bannissement pour les comptes éligibles. Le résultat dépend de l’examen officiel.', reviewServices:'Voir les services',
      fastDelivery:'Transfert rapide après paiement', directSupport:'Support direct sur Discord', warrantyScope:'Garantie clairement définie', paymentChoices:'Carte, PayPal, crypto et cartes cadeaux',
      storyKicker:'DE GOOGLE SHEETS À ROSHINE', storyTitle:'Une boutique construite par les recommandations.', storyIntro:'J’ai commencé à échanger des comptes Overwatch avec des amis en 2021. La petite liste de départ a grandi grâce aux clients fidèles et au bouche-à-oreille, sans publicité payante.',
      storyStartTitle:'Des débuts simples', storyStartText:'Les premiers comptes étaient destinés à des amis, à un usage personnel et à un petit cercle d’acheteurs. Chaque vente était gérée directement.',
      storyMarketplaceYear:'MARKETPLACE', storyMarketplaceTitle:'Ancien vendeur Overwatch Top 3 sur IGVault', storyMarketplaceText:'La boutique s’est ensuite classée parmi les trois meilleurs vendeurs Overwatch d’IGVault. Les frais élevés ont rendu la vente directe sur Discord plus adaptée aux clients fidèles.',
      storyDiscordYear:'DISCORD', storyDiscordTitle:'Le bouche-à-oreille a fait le reste', storyDiscordText:'La publicité est restée presque inexistante. Les clients sont revenus, ont recommandé la boutique et ont développé la communauté en Europe, aux États-Unis, au Japon et ailleurs.',
      storyWebsiteTitle:'La liste est devenue une vraie boutique', storyWebsiteText:'L’ancien Google Sheet est maintenant un stock consultable, avec des captures Imgur pour comparer plus facilement chaque compte avant d’ouvrir un ticket.',
      priceKicker:'POURQUOI LE PRIX EST DIFFÉRENT', priceTitle:'Pas le compte le moins cher. Un transfert plus sûr.', priceText:'Je ne cherche pas à battre le prix des comptes anonymes vendus en masse. Le tarif couvre un historique plus clair, des captures, des réponses avant paiement, un transfert accompagné et un support en cas de problème vérifié lié à l’ancien propriétaire.',
      pricePointOne:'Détails et disponibilité confirmés avant le paiement', pricePointTwo:'Paiement par Stripe, PayPal, Binance ou Bitcoin', pricePointThree:'Récupération d’abord, puis remplacement, remboursement ou compensation si le cas est couvert', priceFootnote:'La garantie dépend de la cause, des preuves disponibles et de la bonne sécurisation du compte après la livraison.',
      paymentWord:'MOYENS DE', methodsWord:'PAIEMENT', paymentDesc:'Les cartes sont traitées par Stripe. Payez par Visa, Mastercard, PayPal, Bitcoin ou carte cadeau prise en charge.', contactNote:'Envoyez l’ID du compte, ou une capture si c’est plus simple. Nous confirmons la disponibilité et répondons avant le paiement.', searchStock:'Rechercher'
    },
    de: {
      openSince:'Seit 2021 geöffnet', liveInventory:'Live-Bestand', howToBuy:'So funktioniert es', availableNow:'jetzt verfügbar', owSplit:'OW1 / OW2', currentRange:'aktuelle Spanne', accountsSold:'Accounts verkauft',
      featuredDrop:'AUSGEWÄHLTER BESTAND', activeCurrency:'Verfügbare Währungen & Spielzeit', viewDetails:'Details ansehen →', clearDetails:'Klare Accountdaten', guidedHandover:'Begleitete Übergabe',
      moreThanAccounts:'MEHR ALS ACCOUNTS', storeTitle:'Alles rund um deine Bestellung an einem Ort.', storeDesc:'Starte mit dem Live-Bestand und nutze Discord, wenn du Verfügbarkeit, Zahlung oder einen Service klären möchtest.',
      accountsOffer:'Overwatch-Accounts', accountsOfferDesc:'Von frischen Starter-Accounts bis zu OW1-Sammlungen, seltenen Cosmetics, Rank-Optionen und großen Inventaren.', browseAccounts:'Accounts ansehen',
      currencyOffer:'Günstige Coins & Mythic Prisms', currencyOfferDesc:'Die Verfügbarkeit ändert sich. Prüfe Optionen, Preise, Liefermethode und wichtige Bedingungen vor der Bestellung.', viewCurrencyDetails:'Preise & Details ansehen',
      currencyKicker:'COINS & MYTHIC PRISMS', currencyTitle:'Wähle die passende Lieferoption für deine Bestellung.', currencyIntro:'Zwei getrennte Optionen mit unterschiedlichen Liefermethoden. Verfügbarkeit und Eignung vor der Zahlung auf Discord bestätigen.',
      creditServiceEyebrow:'DIREKTE GUTSCHRIFT · ALLE REGIONEN', creditServiceTitle:'Günstige Coins & Mythic Prisms', confirmAvailability:'ZUERST BESTÄTIGEN', creditServiceDesc:'Coins oder Prismen werden über eine inoffizielle Aktionspreismethode einem geeigneten Battle.net-Account gutgeschrieben.', owCoins:'Overwatch Coins', mythicPrisms:'Mythische Prismen', orderOnDiscord:'Auf Discord bestellen',
      keyServiceEyebrow:'CD KEY · BATTLE.NET-EINLÖSUNG', keyServiceTitle:'Günstige Overwatch Coins', temporarilyPaused:'PAUSIERT', keyServiceDesc:'Ein einlösbarer Battle.net-CD-KEY für reguläre Overwatch Coins. Neue Bestellungen sind bis zur Auffüllung pausiert.', deliveryLabel:'Lieferung', keyDelivery:'Den bereitgestellten CD KEY direkt im Battle.net-Account einlösen.', askRestockDiscord:'Auf Discord nach Bestand fragen',
      directCreditConditions:'Bedingungen der Direktgutschrift', currencyNoticeOne:'Die Direktgutschrift unterstützt geeignete Battle.net-Accounts aus allen Regionen.', currencyNoticeTwo:'Gutgeschriebene Coins oder Prismen direkt nach dem Login ausgeben; sie sind nicht zum späteren Sparen gedacht.', currencyNoticeThree:'Innerhalb von 1–24 Stunden kann der Restbetrag negativ werden; gekaufte Gegenstände sollten erhalten bleiben.', currencyNoticeFour:'Verfügbarkeit, Liefermethode, Dauer und Eignung des Accounts müssen vor der Zahlung auf Discord bestätigt werden.',
      serviceOffer:'Account-Services', serviceOfferDesc:'Hilfe bei Regionswechseln und Entbannungsanträgen für geeignete Accounts. Das Ergebnis hängt von der offiziellen Prüfung ab.', reviewServices:'Services ansehen',
      fastDelivery:'Schnelle Übergabe nach Zahlung', directSupport:'Direkter Support über Discord', warrantyScope:'Klare Garantiebedingungen', paymentChoices:'Karte, PayPal, Krypto & Gift Cards',
      storyKicker:'VON GOOGLE SHEETS ZU ROSHINE', storyTitle:'Durch Empfehlungen gewachsen, nicht durch Werbung.', storyIntro:'2021 begann ich, Overwatch-Accounts mit Freunden zu handeln. Aus einer kleinen Liste wurde durch Stammkunden und Empfehlungen ein internationaler Shop – ohne bezahlte Werbung.',
      storyStartTitle:'Ein kleiner Anfang', storyStartText:'Die ersten Accounts waren für Freunde, den Eigenbedarf und einen kleinen Käuferkreis. Jeder Kauf wurde direkt betreut.',
      storyMarketplaceYear:'MARKTPLATZ', storyMarketplaceTitle:'Ehemaliger IGVault Top-3-Overwatch-Verkäufer', storyMarketplaceText:'Später gehörte der Shop zu den Top 3 der Overwatch-Verkäufer auf IGVault. Wegen der hohen Gebühren war ein direkter Discord-Shop schließlich die bessere Lösung für Stammkunden.',
      storyDiscordYear:'DISCORD', storyDiscordTitle:'Mundpropaganda hat den Shop aufgebaut', storyDiscordText:'Werbung gab es fast keine. Käufer kamen zurück, empfahlen Freunde und ließen die Community in Europa, den USA, Japan und weiteren Regionen wachsen.',
      storyWebsiteTitle:'Aus der Liste wurde ein richtiger Shop', storyWebsiteText:'Die frühere Google-Sheet-Liste ist jetzt ein durchsuchbarer Live-Bestand mit Imgur-Screenshots, damit Accounts vor dem Ticket leichter vergleichbar sind.',
      priceKicker:'WARUM DER PREIS ANDERS IST', priceTitle:'Nicht der billigste Account. Eine sicherere Übergabe.', priceText:'Ich konkurriere nicht mit anonymen Massenangeboten um den niedrigsten Preis. Bezahlt werden nachvollziehbarere Daten, Screenshots, klare Antworten vor der Zahlung, begleitete Übergabe und Hilfe bei einem bestätigten Problem mit dem Vorbesitzer.',
      pricePointOne:'Accountdaten und Verfügbarkeit vor Zahlung bestätigt', pricePointTwo:'Stripe, PayPal, Binance und Bitcoin', pricePointThree:'Zuerst Wiederherstellung, danach Ersatz, Erstattung oder faire Entschädigung bei gedeckten Fällen', priceFootnote:'Die Garantie hängt von Ursache, Nachweisen und sicherem Umgang mit dem Account nach der Übergabe ab.',
      paymentWord:'ZAHLUNGS', methodsWord:'ARTEN', paymentDesc:'Kartenzahlungen laufen über Stripe. Möglich sind Visa, Mastercard, PayPal, Bitcoin und unterstützte Gift Cards.', contactNote:'Sende die Account-ID oder einfach einen Screenshot. Wir bestätigen die Verfügbarkeit und beantworten Fragen vor der Zahlung.', searchStock:'Bestand suchen'
    },
    ar: {
      openSince:'نعمل منذ 2021', liveInventory:'مخزون مباشر', howToBuy:'طريقة الشراء', availableNow:'متاح الآن', owSplit:'OW1 / OW2', currentRange:'النطاق الحالي', accountsSold:'حساباً تم بيعه',
      featuredDrop:'حساب مميز', activeCurrency:'العملات المتاحة ووقت اللعب', viewDetails:'عرض التفاصيل ←', clearDetails:'تفاصيل واضحة', guidedHandover:'تسليم بمساعدة',
      moreThanAccounts:'أكثر من مجرد حسابات', storeTitle:'كل ما تحتاجه لطلبك في مكان واحد.', storeDesc:'ابدأ بالمخزون المباشر، ثم استخدم Discord لتأكيد التوفر أو الدفع أو طلب خدمة.',
      accountsOffer:'حسابات Overwatch', accountsOfferDesc:'حسابات جديدة ومجموعات OW1 وعناصر نادرة وخيارات تنافسية ومخزونات كبيرة.', browseAccounts:'تصفح الحسابات',
      currencyOffer:'عملات وMythic Prisms مخفضة', currencyOfferDesc:'يتغير التوفر. راجع الخيارات والأسعار وطريقة التسليم والشروط المهمة قبل الطلب.', viewCurrencyDetails:'عرض الأسعار والتفاصيل',
      currencyKicker:'العملات وMYTHIC PRISMS', currencyTitle:'اختر طريقة التسليم المناسبة لطلبك.', currencyIntro:'خياران منفصلان بطرق تسليم مختلفة. أكد التوفر والأهلية عبر Discord قبل الدفع.',
      creditServiceEyebrow:'إضافة مباشرة · جميع المناطق', creditServiceTitle:'عملات وMythic Prisms مخفضة', confirmAvailability:'أكد أولاً', creditServiceDesc:'تُضاف Coins أو Prisms إلى حساب Battle.net مؤهل باستخدام طريقة تسعير ترويجية غير رسمية.', owCoins:'عملات Overwatch', mythicPrisms:'Mythic Prisms', orderOnDiscord:'اطلب عبر Discord',
      keyServiceEyebrow:'CD KEY · استرداد BATTLE.NET', keyServiceTitle:'عملات Overwatch مخفضة', temporarilyPaused:'متوقف مؤقتاً', keyServiceDesc:'CD KEY قابل للاسترداد لعملات Overwatch العادية. الطلبات الجديدة متوقفة حتى عودة المخزون.', deliveryLabel:'التسليم', keyDelivery:'استرد CD KEY المقدم مباشرة من خلال حساب Battle.net.', askRestockDiscord:'اسأل عن عودة المخزون عبر Discord',
      directCreditConditions:'شروط الإضافة المباشرة', currencyNoticeOne:'يدعم خيار الإضافة المباشرة حسابات Battle.net في جميع المناطق وفق الأهلية.', currencyNoticeTwo:'أنفق Coins أو Prisms المضافة فور تسجيل الدخول؛ فهي غير مخصصة للحفظ لاحقاً.', currencyNoticeThree:'خلال 1–24 ساعة قد يصبح الرصيد المتبقي سالباً، بينما يُتوقع بقاء العناصر المشتراة.', currencyNoticeFour:'يجب تأكيد التوفر وطريقة التسليم والمدة وملاءمة الحساب عبر Discord قبل الدفع.',
      serviceOffer:'خدمات الحساب', serviceOfferDesc:'مساعدة تغيير المنطقة واستئناف الحظر للحسابات المؤهلة. النتيجة تعتمد على الحساب والمراجعة الرسمية.', reviewServices:'عرض الخدمات',
      fastDelivery:'تسليم سريع بعد الدفع', directSupport:'دعم مباشر عبر Discord', warrantyScope:'نطاق ضمان واضح', paymentChoices:'بطاقة وPayPal وعملات رقمية وبطاقات هدايا',
      storyKicker:'من GOOGLE SHEETS إلى ROSHINE', storyTitle:'متجر نما بالتوصيات لا بالإعلانات.', storyIntro:'بدأت بيع وتبادل حسابات Overwatch مع الأصدقاء في 2021. تحولت القائمة الصغيرة إلى متجر يخدم عملاء متكررين بفضل التوصيات، من دون حملات إعلانية مدفوعة.',
      storyStartTitle:'بداية صغيرة', storyStartText:'كانت الحسابات الأولى للأصدقاء والاستخدام الشخصي ودائرة صغيرة من المشترين، وكان كل طلب يُدار بشكل مباشر.',
      storyMarketplaceYear:'السوق', storyMarketplaceTitle:'بائع Overwatch سابق ضمن أفضل 3 على IGVault', storyMarketplaceText:'وصل المتجر لاحقاً إلى أفضل ثلاثة بائعين لحسابات Overwatch على IGVault. بسبب الرسوم المرتفعة أصبح متجر Discord المباشر أفضل للعملاء المتكررين.',
      storyDiscordYear:'DISCORD', storyDiscordTitle:'التوصيات بنت المجتمع', storyDiscordText:'بقي الإعلان شبه معدوم. عاد المشترون وعرّفوا أصدقاءهم، فنما المجتمع في أوروبا والولايات المتحدة واليابان ومناطق أخرى.',
      storyWebsiteTitle:'تحولت القائمة إلى متجر فعلي', storyWebsiteText:'انتقلت قائمة Google Sheets القديمة إلى مخزون مباشر قابل للبحث مع صور Imgur لتسهيل مقارنة الحسابات قبل فتح تذكرة.',
      priceKicker:'لماذا السعر مختلف', priceTitle:'ليس الأرخص، لكنه تسليم أكثر أماناً.', priceText:'لا أنافس الحسابات المجهولة المعروضة بكميات كبيرة على أقل سعر. السعر يشمل تاريخاً أوضح وصوراً وإجابات قبل الدفع وتسليماً بمساعدة ودعماً عند ثبوت مشكلة مرتبطة بالمالك السابق.',
      pricePointOne:'تأكيد تفاصيل الحساب وتوفره قبل الدفع', pricePointTwo:'خيارات Stripe وPayPal وBinance وBitcoin', pricePointThree:'محاولة الاسترداد أولاً ثم الاستبدال أو الاسترداد المالي أو التعويض العادل للحالات المشمولة', priceFootnote:'تعتمد أهلية الضمان على السبب والأدلة المتاحة وطريقة حماية الحساب بعد التسليم.',
      paymentWord:'طرق', methodsWord:'الدفع', paymentDesc:'تُعالج البطاقات عبر Stripe. تتوفر Visa وMastercard وPayPal وBitcoin وبطاقات الهدايا المدعومة.', contactNote:'أرسل ID الحساب أو لقطة شاشة. سنؤكد التوفر ونجيب عن أسئلتك قبل الدفع.', searchStock:'ابحث في المخزون'
    },
    ja: {
      openSince:'2021年から運営', liveInventory:'リアルタイム在庫', howToBuy:'購入方法', availableNow:'販売中', owSplit:'OW1 / OW2', currentRange:'現在の価格帯', accountsSold:'販売済みアカウント',
      featuredDrop:'注目アカウント', activeCurrency:'利用可能な通貨 & プレイ時間', viewDetails:'詳細を見る →', clearDetails:'明確なアカウント情報', guidedHandover:'引き渡しサポート',
      moreThanAccounts:'アカウント販売だけではありません', storeTitle:'購入前から引き渡し後まで、一か所で。', storeDesc:'リアルタイム在庫から選び、在庫確認・支払い・サービスの相談はDiscordで直接行えます。',
      accountsOffer:'Overwatchアカウント', accountsOfferDesc:'初心者向けからOW1コレクション、希少スキン、ランク向け、大型インベントリまで。', browseAccounts:'アカウントを見る',
      currencyOffer:'割引コイン & ミシック・プリズム', currencyOfferDesc:'在庫状況は変わります。注文前に現在の選択肢、価格、引き渡し方法、重要条件をご確認ください。', viewCurrencyDetails:'価格と詳細を見る',
      currencyKicker:'コイン & ミシック・プリズム', currencyTitle:'注文に合う受け取り方法を選べます。', currencyIntro:'引き渡し方法が異なる2つのオプションです。支払い前にDiscordで在庫と対象条件をご確認ください。',
      creditServiceEyebrow:'直接付与 · 全地域対応', creditServiceTitle:'割引コイン & ミシック・プリズム', confirmAvailability:'事前確認必須', creditServiceDesc:'非公式のプロモーション価格方式を利用し、対象のBattle.netアカウントへCoinsまたはPrismsを付与します。', owCoins:'Overwatch Coins', mythicPrisms:'ミシック・プリズム', orderOnDiscord:'Discordで注文',
      keyServiceEyebrow:'CD KEY · BATTLE.NET交換', keyServiceTitle:'割引Overwatch Coins', temporarilyPaused:'一時停止中', keyServiceDesc:'通常のOverwatch Coinsと交換できるBattle.net CD KEYです。在庫補充まで新規注文を停止しています。', deliveryLabel:'受け取り方法', keyDelivery:'提供されたCD KEYをBattle.netアカウントで直接交換します。', askRestockDiscord:'Discordで再入荷を確認',
      directCreditConditions:'直接付与の注意事項', currencyNoticeOne:'直接付与は、対象条件を満たす全地域のBattle.netアカウントに対応します。', currencyNoticeTwo:'付与されたCoinsまたはPrismsはログイン後すぐに使用し、後日のために保存しないでください。', currencyNoticeThree:'1～24時間後に残高がマイナスになる場合がありますが、購入済みアイテムは残る想定です。', currencyNoticeFour:'在庫、引き渡し方法、所要時間、アカウントの対象可否は支払い前にDiscordで確認してください。',
      serviceOffer:'アカウントサービス', serviceOfferDesc:'対象アカウント向けに地域変更やBAN異議申し立てをサポートします。結果は公式審査により、保証されません。', reviewServices:'サービスを見る',
      fastDelivery:'入金確認後すみやかに引き渡し', directSupport:'Discordで直接サポート', warrantyScope:'明確な保証範囲', paymentChoices:'カード、PayPal、暗号資産、ギフトカード',
      storyKicker:'GOOGLE SHEETSからROSHINEへ', storyTitle:'広告ではなく、紹介で育ったストア。', storyIntro:'2021年、友人とのOverwatchアカウント売買から始めました。小さなリストが、リピーターと紹介によって少しずつ広がりました。',
      storyStartTitle:'小さなスタート', storyStartText:'最初は友人、自分用、そして少人数の購入者向けでした。すべての取引を直接対応していました。',
      storyMarketplaceYear:'マーケット', storyMarketplaceTitle:'元IGVault Overwatchトップ3セラー', storyMarketplaceText:'その後、IGVaultでOverwatch部門トップ3に入りました。高い手数料をきっかけに、リピーターへ直接対応できるDiscord販売へ移行しました。',
      storyDiscordYear:'DISCORD', storyDiscordTitle:'口コミで広がりました', storyDiscordText:'広告はほぼ使っていません。購入者が戻り、友人を紹介してくれたことで、欧州、米国、日本などにコミュニティが広がりました。',
      storyWebsiteTitle:'リストから本格的なストアへ', storyWebsiteText:'以前のGoogle Sheets在庫表を、検索できるリアルタイム在庫とImgurスクリーンショットを備えたサイトへ移行しました。',
      priceKicker:'価格が違う理由', priceTitle:'最安値ではなく、より安心できる引き渡し。', priceText:'匿名の大量出品と最安値を競うつもりはありません。明確な履歴、スクリーンショット、支払い前の確認、引き渡しサポート、そして元所有者に関する確認済みトラブルへの対応を含む価格です。',
      pricePointOne:'支払い前に詳細と在庫を確認', pricePointTwo:'Stripe、PayPal、Binance、Bitcoinに対応', pricePointThree:'対象ケースは復旧を優先し、その後に交換・返金・適正な補償', priceFootnote:'保証対象は原因、確認できる証拠、引き渡し後の安全な管理状況によって判断されます。',
      paymentWord:'お支払い', methodsWord:'方法', paymentDesc:'カード決済はStripe経由です。Visa、Mastercard、PayPal、Bitcoin、対応ギフトカードを利用できます。', contactNote:'アカウントID、または分かりやすいスクリーンショットを送ってください。支払い前に在庫とご質問を確認します。', searchStock:'在庫を検索'
    },
  };

  const getLanguage = () => {
    const value = document.getElementById('langSelect')?.value || document.documentElement.lang || 'en';
    return copy[value] ? value : 'en';
  };

  function applyRedesignCopy() {
    const language = getLanguage();
    document.querySelectorAll('[data-rd-key]').forEach(element => {
      const value = copy[language][element.dataset.rdKey];
      if (value) element.textContent = value;
    });
  }

  function parsePrice(value) {
    const number = Number(String(value || '').replace(/[^0-9.]/g, ''));
    return Number.isFinite(number) ? number : null;
  }

  async function updateLiveSummary() {
    try {
      const response = await fetch('./accounts.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`Inventory request failed: ${response.status}`);
      const payload = await response.json();
      const accounts = Array.isArray(payload.accounts) ? payload.accounts : [];
      const available = accounts.filter(account => /in\s*stock/i.test(String(account.status || '')));
      const ow1 = available.filter(account => /\bOW1\b/i.test(String(account.level || ''))).length;
      const ow2 = available.filter(account => /\bOW2\b/i.test(String(account.level || ''))).length;
      const prices = available.map(account => parsePrice(account.price)).filter(value => value !== null);
      const minimum = prices.length ? Math.min(...prices) : null;
      const maximum = prices.length ? Math.max(...prices) : null;
      document.getElementById('rdAvailableCount').textContent = String(available.length);
      document.getElementById('rdVersionSplit').textContent = `${ow1} / ${ow2}`;
      document.getElementById('rdPriceRange').textContent = minimum === null ? '—' : `$${minimum.toFixed(0)}–$${maximum.toFixed(0)}`;
    } catch (error) {
      console.warn('[redesign] Live summary unavailable', error);
    }
  }

  function openStockSearch() {
    const search = document.getElementById('accountSearch');
    const accounts = document.getElementById('accounts');
    const mobileToggle = document.getElementById('mobileFilterToggle');
    accounts?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.innerWidth <= 700 && mobileToggle?.getAttribute('aria-expanded') !== 'true') mobileToggle?.click();
    window.setTimeout(() => search?.focus({ preventScroll: true }), window.innerWidth <= 700 ? 380 : 650);
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion) {
    document.body.classList.add('rd-motion');
    document.querySelectorAll('.rd-reveal').forEach(element => {
      element.style.setProperty('--rd-delay', `${element.dataset.delay || 0}ms`);
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('rd-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .1 });
    document.querySelectorAll('.rd-reveal').forEach(element => observer.observe(element));
  }

  const languageSelect = document.getElementById('langSelect');
  languageSelect?.addEventListener('change', () => window.setTimeout(applyRedesignCopy));
  document.getElementById('rdSearchLauncher')?.addEventListener('click', openStockSearch);
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openStockSearch();
    }
  });
  window.addEventListener('scroll', () => document.querySelector('.header')?.classList.toggle('rd-scrolled', scrollY > 20), { passive: true });

  applyRedesignCopy();
  updateLiveSummary();
})();
