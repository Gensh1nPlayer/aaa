(() => {
  "use strict";

  const pageKey = document.body.dataset.policyPage === "terms" ? "terms" : "privacy";
  const supportedLanguages = ["en", "fr", "de", "ar", "zh"];
  let tocObserver = null;

  const copy = {
    en: {
      nav: { home: "Home", accounts: "Accounts", services: "Services", warranty: "Warranty", faq: "FAQ", contact: "Contact" },
      auth: "Authenticator",
      a11y: { skip: "Skip to policy content", openNav: "Open navigation", closeNav: "Close navigation", mobileNav: "Mobile navigation" },
      footer: {
        line1: "© 2021–2026 Roshine Account Store.",
        line2: "All rights reserved — your reliable account supplier.",
        nav: { home: "Home", services: "Services", contact: "Contact", privacy: "Privacy", terms: "Terms" }
      },
      ui: {
        home: "Home",
        contents: "On this page",
        updated: "Updated July 22, 2026",
        staticSite: "Static storefront",
        privacy: "Privacy",
        terms: "Terms",
        note: "This page is written to describe the current Roshine storefront and order flow. It is general information and not legal advice."
      },
      privacy: {
        kicker: "PRIVACY & DATA",
        title: "Privacy Policy",
        intro: "A clear summary of what the static storefront stores, what information we receive when you contact us, and how order-related data is handled.",
        body: `<h2>1. Scope and current site model</h2>
          <p>This policy applies when you browse <a href="../">roshine.love</a>, view the account inventory, use the private Authenticator utility, or contact Roshine through Discord or email. The public storefront is a <strong>static website</strong>: it does not require a customer account and does not use a public ordering bot.</p>

          <h2>2. Information stored by the website</h2>
          <p>The storefront uses browser local storage only to remember your selected language. Inventory filters and sorting run locally in your browser and are not submitted to us. The Authenticator utility is designed to process the private key locally in your browser; do not send that key to anyone.</p>
          <p>Our hosting or CDN provider may process ordinary technical request data, such as IP address, browser type, requested page and time, for delivery, security and reliability.</p>

          <h2>3. Information received when you contact us</h2>
          <p>If you contact us on Discord or by email, we receive the information you choose to send, which may include your handle, email address, account ID, screenshots, messages and support history. Do not send unrelated sensitive personal information.</p>

          <h2>4. Orders and payments</h2>
          <p>Orders are confirmed manually through Discord. We may retain the account ID, order time, delivery status and relevant support or dispute notes. Payments are handled by third-party payment providers; we do not intentionally collect or store full card numbers on this website.</p>

          <h2>5. How information is used</h2>
          <ul>
            <li>Confirm availability, payment and delivery.</li>
            <li>Provide account handover, warranty and after-sales support.</li>
            <li>Investigate fraud, abuse, security incidents or disputes.</li>
            <li>Maintain the security and reliability of the storefront.</li>
            <li>Meet applicable legal obligations.</li>
          </ul>

          <h2>6. Sharing and disclosure</h2>
          <p>We share only what is reasonably necessary with service providers involved in hosting, communications, payment or order support. We do not sell personal information for third-party advertising.</p>

          <h2>7. Retention and security</h2>
          <p>Order and support records are kept only for as long as reasonably needed for delivery confirmation, warranty service, disputes, fraud prevention or legal requirements. No internet service can guarantee absolute security, so use a unique password and keep recovery details and private keys confidential.</p>

          <h2>8. Your choices and requests</h2>
          <p>You can clear the saved language preference through your browser. Where applicable, you may ask us to access, correct or delete information associated with your order or support conversation, subject to legitimate record-keeping requirements.</p>

          <h2>9. External services</h2>
          <p>Discord, Battle.net, email and payment providers operate under their own privacy policies. Links to those services do not mean that Roshine controls their data practices.</p>

          <h2>10. Minors, updates and contact</h2>
          <p>The service is not intended for minors. We may revise this policy when the storefront or order process changes and will update the date shown above. For privacy requests, email <a href="mailto:roshine_store@roshine.love">roshine_store@roshine.love</a> or use the <a href="../#contact">contact section</a>.</p>`
      },
      terms: {
        kicker: "STORE TERMS",
        title: "Terms of Service",
        intro: "The current rules for inventory listings, manual Discord orders, account verification, delivery, warranty and buyer responsibilities.",
        body: `<h2>1. Acceptance and eligibility</h2>
          <p>By placing an order with Roshine, you confirm that you can lawfully purchase digital goods in your location, that the information you provide is accurate, and that you accept these terms together with the warranty information shown on the storefront.</p>

          <h2>2. Inventory and listing accuracy</h2>
          <p>Sales status is updated in real time as accounts are sold, while new inventory is typically added every 7 days. Availability is not guaranteed until confirmed on Discord. Each listed account comes from a real player with a normal play history, not a scripted, botted, studio-farmed or mass-produced account, and we exclude accounts with known histories of cheating, abuse or other rule violations.</p>
          <p>Listing details describe the account at the time of verification. Key facts can be cross-checked against official in-game and Battle.net records during the verification and handover process.</p>

          <h2>3. Ordering, pricing and payment</h2>
          <p>Orders are handled manually through Discord using the account ID or a screenshot. Price, availability, payment method and any applicable fee must be confirmed before payment. Never pay an unverified person claiming to represent Roshine.</p>

          <h2>4. Delivery and inspection</h2>
          <p>Most orders are delivered within 5 minutes after confirmed payment; rare high-tier accounts may require additional preparation. The buyer should test the supplied credentials and review the account promptly, normally within <strong>30 minutes</strong> of delivery. If verification must be delayed, notify us immediately.</p>

          <h2>5. Refunds and listing corrections</h2>
          <p>Digital goods are normally final once correctly delivered. A correction, replacement or refund may apply if the credentials supplied by us prevent the first login, the account had an undisclosed abnormal status at delivery, or a material listing fact cannot be verified. Contact us before changing security information so the issue can be documented.</p>

          <h2>6. Warranty and after-sales support</h2>
          <p>If an account is reclaimed, hacked or permanently lost because of a previous-owner issue, the lifetime security warranty provides an equal-value replacement or full compensation after verification. Eligible OW2 accounts also receive unlimited assistance for unlock-related issues. Region changes and unban appeal assistance are optional paid services; official approval is never guaranteed.</p>

          <h2>7. Buyer responsibilities</h2>
          <ul>
            <li>Keep credentials, recovery details and private keys secure and do not share them.</li>
            <li>Follow the handover instructions and use a stable device and IP during the initial security period.</li>
            <li>Do not use the account for cheating, abuse, fraud or any activity that violates game or platform rules.</li>
            <li>Provide accurate evidence when requesting warranty or dispute support.</li>
          </ul>

          <h2>8. Platform risk disclosure</h2>
          <p>Account trading is not officially supported by Blizzard. Changes in location, device, IP address or security information can trigger platform risk controls, and platform decisions remain outside Roshine's control. A stable device and IP for about 7 days before making major account changes can reduce, but not eliminate, that risk.</p>

          <h2>9. Liability and changes</h2>
          <p>Roshine is responsible for the commitments expressly stated in the listing and warranty. We are not responsible for losses caused by buyer credential sharing, misuse, rule violations, unsupported modifications or third-party platform decisions. Terms may be updated when the storefront, support scope or legal requirements change.</p>

          <h2>10. Contact</h2>
          <p>For order, warranty or dispute support, contact us through the official <a href="../#contact">Discord or email links</a> shown on the storefront and include the account ID.</p>`
      }
    },

    fr: {
      nav: { home: "Accueil", accounts: "Comptes", services: "Services", warranty: "Garantie", faq: "FAQ", contact: "Contact" },
      auth: "Authenticator",
      a11y: { skip: "Aller au contenu de la politique", openNav: "Ouvrir la navigation", closeNav: "Fermer la navigation", mobileNav: "Navigation mobile" },
      footer: {
        line1: "© 2021–2026 Roshine Account Store.",
        line2: "Tous droits réservés — votre fournisseur fiable.",
        nav: { home: "Accueil", services: "Services", contact: "Contact", privacy: "Confidentialité", terms: "Conditions" }
      },
      ui: {
        home: "Accueil", contents: "Sur cette page", updated: "Mis à jour le 22 juillet 2026", staticSite: "Vitrine statique",
        privacy: "Confidentialité", terms: "Conditions",
        note: "Cette page décrit la vitrine Roshine et le parcours de commande actuels. Elle fournit des informations générales et ne constitue pas un conseil juridique."
      },
      privacy: {
        kicker: "CONFIDENTIALITÉ & DONNÉES",
        title: "Politique de confidentialité",
        intro: "Un résumé clair de ce que la vitrine statique conserve, des informations reçues lorsque vous nous contactez et du traitement des données de commande.",
        body: `<h2>1. Portée et fonctionnement du site</h2>
          <p>Cette politique s'applique lorsque vous consultez <a href="../">roshine.love</a>, l'inventaire, l'outil Authenticator privé ou lorsque vous contactez Roshine via Discord ou e-mail. La vitrine publique est un <strong>site statique</strong> : aucun compte client n'est requis et aucun bot public ne prend les commandes.</p>
          <h2>2. Informations conservées par le site</h2>
          <p>Le stockage local du navigateur sert uniquement à mémoriser la langue. Les filtres et le tri fonctionnent localement et ne nous sont pas envoyés. L'outil Authenticator traite la clé privée localement dans le navigateur ; ne communiquez cette clé à personne.</p>
          <p>Notre hébergeur ou CDN peut traiter des données techniques ordinaires — adresse IP, navigateur, page demandée et heure — pour la livraison, la sécurité et la fiabilité.</p>
          <h2>3. Informations reçues lors d'un contact</h2>
          <p>Sur Discord ou par e-mail, nous recevons les éléments que vous choisissez d'envoyer : identifiant, adresse e-mail, ID du compte, captures, messages et historique d'assistance. N'envoyez pas de données personnelles sensibles sans rapport avec la commande.</p>
          <h2>4. Commandes et paiements</h2>
          <p>Les commandes sont confirmées manuellement sur Discord. Nous pouvons conserver l'ID du compte, l'heure, l'état de livraison et les notes utiles au support ou aux litiges. Les paiements sont traités par des prestataires tiers ; ce site ne collecte ni ne conserve volontairement les numéros complets de carte.</p>
          <h2>5. Utilisation des informations</h2>
          <ul><li>Confirmer la disponibilité, le paiement et la livraison.</li><li>Assurer le transfert, la garantie et le support après-vente.</li><li>Examiner la fraude, les abus, les incidents de sécurité ou les litiges.</li><li>Maintenir la sécurité et la fiabilité de la vitrine.</li><li>Respecter les obligations légales applicables.</li></ul>
          <h2>6. Partage et divulgation</h2>
          <p>Nous partageons uniquement le nécessaire avec les prestataires d'hébergement, de communication, de paiement ou d'assistance. Nous ne vendons pas de données personnelles à des fins de publicité tierce.</p>
          <h2>7. Conservation et sécurité</h2>
          <p>Les dossiers de commande et d'assistance sont conservés pendant la durée raisonnablement nécessaire à la livraison, la garantie, la prévention de la fraude, aux litiges ou aux obligations légales. Aucun service en ligne ne garantit une sécurité absolue : utilisez un mot de passe unique et protégez les informations de récupération et les clés privées.</p>
          <h2>8. Vos choix et demandes</h2>
          <p>Vous pouvez effacer la préférence de langue dans votre navigateur. Lorsque la loi le permet, vous pouvez demander l'accès, la correction ou la suppression des informations liées à votre commande ou à vos échanges, sous réserve des obligations légitimes de conservation.</p>
          <h2>9. Services externes</h2>
          <p>Discord, Battle.net, l'e-mail et les prestataires de paiement appliquent leurs propres politiques de confidentialité. Roshine ne contrôle pas leurs pratiques.</p>
          <h2>10. Mineurs, mises à jour et contact</h2>
          <p>Le service n'est pas destiné aux mineurs. Cette politique peut évoluer avec la vitrine ou le parcours de commande. Pour une demande de confidentialité : <a href="mailto:roshine_store@roshine.love">roshine_store@roshine.love</a> ou la <a href="../#contact">section Contact</a>.</p>`
      },
      terms: {
        kicker: "CONDITIONS DE VENTE",
        title: "Conditions d'utilisation",
        intro: "Les règles actuelles concernant l'inventaire, les commandes manuelles sur Discord, la vérification, la livraison, la garantie et les responsabilités de l'acheteur.",
        body: `<h2>1. Acceptation et éligibilité</h2>
          <p>En commandant auprès de Roshine, vous confirmez pouvoir acheter légalement des biens numériques dans votre juridiction, fournir des informations exactes et accepter ces conditions ainsi que la garantie présentée sur la vitrine.</p>
          <h2>2. Inventaire et exactitude des annonces</h2>
          <p>Le statut des ventes est actualisé en temps réel et de nouveaux comptes sont généralement ajoutés tous les 7 jours. La disponibilité n'est garantie qu'après confirmation sur Discord. Chaque compte provient d'un vrai joueur avec un historique normal, et non d'un script, bot, studio ou d'une production de masse. Les comptes ayant un historique connu de triche, d'abus ou d'infraction sont exclus.</p>
          <p>Les informations décrivent le compte au moment de la vérification. Les éléments clés peuvent être recoupés avec les données officielles en jeu et Battle.net lors du contrôle et du transfert.</p>
          <h2>3. Commande, prix et paiement</h2>
          <p>La commande est traitée manuellement sur Discord avec l'ID du compte ou une capture. Le prix, la disponibilité, le moyen de paiement et les frais éventuels doivent être confirmés avant paiement. Ne payez jamais une personne non vérifiée prétendant représenter Roshine.</p>
          <h2>4. Livraison et vérification</h2>
          <p>La plupart des commandes sont livrées sous 5 minutes après confirmation du paiement ; certains comptes haut de gamme demandent plus de préparation. L'acheteur doit tester les identifiants et vérifier le compte rapidement, normalement sous <strong>30 minutes</strong>. Tout retard doit être signalé immédiatement.</p>
          <h2>5. Remboursements et corrections</h2>
          <p>Les biens numériques sont normalement définitifs après une livraison correcte. Une correction, un remplacement ou un remboursement peut s'appliquer si les identifiants empêchent la première connexion, si le compte avait un état anormal non signalé à la livraison ou si un élément essentiel de l'annonce ne peut être vérifié.</p>
          <h2>6. Garantie et support après-vente</h2>
          <p>Si un compte est récupéré, piraté ou définitivement perdu à cause de l'ancien propriétaire, la garantie de sécurité à vie prévoit un remplacement équivalent ou une compensation complète après vérification. Les comptes OW2 éligibles bénéficient aussi d'une assistance illimitée pour les problèmes de déverrouillage. Les changements de région et l'aide aux appels de bannissement sont payants et optionnels, sans garantie d'approbation officielle.</p>
          <h2>7. Responsabilités de l'acheteur</h2>
          <ul><li>Protéger les identifiants, informations de récupération et clés privées.</li><li>Suivre les consignes de transfert et conserver un appareil et une IP stables pendant la période initiale.</li><li>Ne pas utiliser le compte pour la triche, les abus, la fraude ou toute violation des règles.</li><li>Fournir des preuves exactes pour une demande de garantie ou un litige.</li></ul>
          <h2>8. Risques liés à la plateforme</h2>
          <p>Le commerce de comptes n'est pas officiellement pris en charge par Blizzard. Les changements de lieu, appareil, IP ou sécurité peuvent déclencher des contrôles. Les décisions de la plateforme échappent à Roshine. Un appareil et une IP stables pendant environ 7 jours réduisent le risque sans l'éliminer.</p>
          <h2>9. Responsabilité et modifications</h2>
          <p>Roshine répond des engagements expressément indiqués dans l'annonce et la garantie. Nous ne sommes pas responsables des pertes dues au partage d'identifiants, à une mauvaise utilisation, à une infraction, à une modification non prise en charge ou à une décision de plateforme. Ces conditions peuvent évoluer avec le service ou la loi.</p>
          <h2>10. Contact</h2>
          <p>Pour une commande, une garantie ou un litige, utilisez les liens officiels <a href="../#contact">Discord ou e-mail</a> de la vitrine et indiquez l'ID du compte.</p>`
      }
    },

    de: {
      nav: { home: "Home", accounts: "Accounts", services: "Services", warranty: "Garantie", faq: "FAQ", contact: "Kontakt" },
      auth: "Authenticator",
      a11y: { skip: "Zum Richtlinientext springen", openNav: "Navigation öffnen", closeNav: "Navigation schließen", mobileNav: "Mobile Navigation" },
      footer: {
        line1: "© 2021–2026 Roshine Account Store.",
        line2: "Alle Rechte vorbehalten — dein zuverlässiger Anbieter.",
        nav: { home: "Home", services: "Services", contact: "Kontakt", privacy: "Datenschutz", terms: "AGB" }
      },
      ui: {
        home: "Home", contents: "Auf dieser Seite", updated: "Aktualisiert am 22. Juli 2026", staticSite: "Statische Website",
        privacy: "Datenschutz", terms: "AGB",
        note: "Diese Seite beschreibt den aktuellen Roshine-Shop und Bestellablauf. Sie dient der allgemeinen Information und ist keine Rechtsberatung."
      },
      privacy: {
        kicker: "DATENSCHUTZ & DATEN",
        title: "Datenschutzerklärung",
        intro: "Eine klare Übersicht darüber, was der statische Shop speichert, welche Angaben wir bei einer Kontaktaufnahme erhalten und wie Bestelldaten behandelt werden.",
        body: `<h2>1. Geltungsbereich und Website-Modell</h2>
          <p>Diese Erklärung gilt beim Besuch von <a href="../">roshine.love</a>, des Inventars, des privaten Authenticator-Tools sowie bei Kontakt über Discord oder E-Mail. Der öffentliche Shop ist eine <strong>statische Website</strong>: Ein Kundenkonto ist nicht erforderlich und Bestellungen laufen nicht über einen öffentlichen Bot.</p>
          <h2>2. Von der Website gespeicherte Daten</h2>
          <p>Der Browser speichert lokal nur die gewählte Sprache. Filter und Sortierung laufen lokal und werden nicht an uns gesendet. Das Authenticator-Tool verarbeitet den privaten Schlüssel lokal im Browser; geben Sie diesen Schlüssel niemals weiter.</p>
          <p>Hosting- oder CDN-Anbieter können übliche technische Anfragedaten wie IP-Adresse, Browser, aufgerufene Seite und Zeitpunkt für Auslieferung, Sicherheit und Zuverlässigkeit verarbeiten.</p>
          <h2>3. Angaben bei Kontaktaufnahme</h2>
          <p>Bei Kontakt über Discord oder E-Mail erhalten wir die freiwillig übermittelten Angaben, etwa Handle, E-Mail-Adresse, Account-ID, Screenshots, Nachrichten und Supportverlauf. Senden Sie keine unnötigen sensiblen Daten.</p>
          <h2>4. Bestellungen und Zahlungen</h2>
          <p>Bestellungen werden manuell über Discord bestätigt. Wir können Account-ID, Bestellzeit, Lieferstatus sowie relevante Support- oder Streitfallnotizen aufbewahren. Zahlungen werden von Drittanbietern verarbeitet; vollständige Kartennummern werden auf dieser Website nicht absichtlich erhoben oder gespeichert.</p>
          <h2>5. Verwendung der Daten</h2>
          <ul><li>Verfügbarkeit, Zahlung und Lieferung bestätigen.</li><li>Übergabe, Garantie und After-Sales-Support leisten.</li><li>Betrug, Missbrauch, Sicherheitsvorfälle oder Streitfälle untersuchen.</li><li>Sicherheit und Zuverlässigkeit des Shops erhalten.</li><li>Anwendbare rechtliche Pflichten erfüllen.</li></ul>
          <h2>6. Weitergabe</h2>
          <p>Wir geben nur die erforderlichen Informationen an Anbieter für Hosting, Kommunikation, Zahlung oder Support weiter. Personenbezogene Daten werden nicht für Werbung Dritter verkauft.</p>
          <h2>7. Aufbewahrung und Sicherheit</h2>
          <p>Bestell- und Supportdaten werden nur so lange aufbewahrt, wie es für Lieferung, Garantie, Streitfälle, Betrugsprävention oder rechtliche Pflichten angemessen ist. Kein Onlinedienst bietet absolute Sicherheit; verwenden Sie ein einzigartiges Passwort und schützen Sie Recovery-Daten und private Schlüssel.</p>
          <h2>8. Ihre Wahlmöglichkeiten</h2>
          <p>Die gespeicherte Sprachwahl kann im Browser gelöscht werden. Soweit anwendbar, können Sie Auskunft, Berichtigung oder Löschung Ihrer Bestell- und Supportdaten verlangen, vorbehaltlich legitimer Aufbewahrungspflichten.</p>
          <h2>9. Externe Dienste</h2>
          <p>Discord, Battle.net, E-Mail- und Zahlungsanbieter haben eigene Datenschutzrichtlinien. Roshine kontrolliert deren Datenverarbeitung nicht.</p>
          <h2>10. Minderjährige, Änderungen und Kontakt</h2>
          <p>Der Service richtet sich nicht an Minderjährige. Änderungen am Shop oder Bestellprozess können zu einer Aktualisierung führen. Datenschutzanfragen an <a href="mailto:roshine_store@roshine.love">roshine_store@roshine.love</a> oder über den <a href="../#contact">Kontaktbereich</a>.</p>`
      },
      terms: {
        kicker: "SHOP-BEDINGUNGEN",
        title: "Nutzungsbedingungen",
        intro: "Die aktuellen Regeln für Inventar, manuelle Discord-Bestellungen, Prüfung, Lieferung, Garantie und Pflichten des Käufers.",
        body: `<h2>1. Zustimmung und Berechtigung</h2>
          <p>Mit einer Bestellung bestätigen Sie, digitale Güter an Ihrem Standort rechtmäßig erwerben zu dürfen, richtige Angaben zu machen und diese Bedingungen sowie die im Shop beschriebene Garantie zu akzeptieren.</p>
          <h2>2. Inventar und Listing-Genauigkeit</h2>
          <p>Der Verkaufsstatus wird in Echtzeit aktualisiert; neue Accounts werden normalerweise alle 7 Tage ergänzt. Verfügbarkeit gilt erst nach Bestätigung auf Discord. Jeder Account stammt von einem echten Spieler mit normalem Spielverlauf und ist kein Script-, Bot-, Studio- oder Massenaccount. Accounts mit bekannter Cheat-, Missbrauchs- oder Regelverstoß-Historie werden ausgeschlossen.</p>
          <p>Angaben beschreiben den Account zum Prüfzeitpunkt. Wesentliche Fakten können während Prüfung und Übergabe mit offiziellen In-Game- und Battle.net-Daten abgeglichen werden.</p>
          <h2>3. Bestellung, Preis und Zahlung</h2>
          <p>Bestellungen erfolgen manuell auf Discord mit Account-ID oder Screenshot. Preis, Verfügbarkeit, Zahlungsart und mögliche Gebühren sind vor Zahlung zu bestätigen. Zahlen Sie niemals an eine ungeprüfte Person, die Roshine zu vertreten behauptet.</p>
          <h2>4. Lieferung und Prüfung</h2>
          <p>Die meisten Bestellungen werden innerhalb von 5 Minuten nach Zahlungsbestätigung geliefert; seltene High-Tier-Accounts benötigen ggf. mehr Zeit. Zugangsdaten und Account sind normalerweise innerhalb von <strong>30 Minuten</strong> zu prüfen. Eine Verzögerung ist sofort mitzuteilen.</p>
          <h2>5. Erstattung und Korrektur</h2>
          <p>Digitale Güter sind nach korrekter Lieferung grundsätzlich final. Korrektur, Ersatz oder Erstattung können gelten, wenn bereitgestellte Daten den ersten Login verhindern, ein nicht offengelegter abnormaler Zustand bei Lieferung vorlag oder eine wesentliche Listing-Angabe nicht verifizierbar ist.</p>
          <h2>6. Garantie und Support</h2>
          <p>Wird ein Account wegen eines Vorbesitzer-Problems zurückgeholt, gehackt oder dauerhaft verloren, bietet die lebenslange Sicherheitsgarantie nach Prüfung gleichwertigen Ersatz oder volle Entschädigung. Berechtigte OW2-Accounts erhalten unbegrenzte Unlock-Hilfe. Regionsänderung und Unban-Einspruch sind optionale Paid-Services; eine offizielle Genehmigung ist nie garantiert.</p>
          <h2>7. Pflichten des Käufers</h2>
          <ul><li>Zugangsdaten, Recovery-Informationen und private Schlüssel schützen.</li><li>Übergabeanweisungen befolgen und anfangs Gerät und IP stabil halten.</li><li>Den Account nicht für Cheating, Missbrauch, Betrug oder Regelverstöße nutzen.</li><li>Bei Garantie oder Streitfall richtige Nachweise vorlegen.</li></ul>
          <h2>8. Plattformrisiko</h2>
          <p>Account-Handel wird von Blizzard nicht offiziell unterstützt. Änderungen an Standort, Gerät, IP oder Sicherheit können Kontrollen auslösen; Plattformentscheidungen liegen außerhalb der Kontrolle von Roshine. Ein stabiles Gerät und eine stabile IP für etwa 7 Tage können das Risiko reduzieren, aber nicht beseitigen.</p>
          <h2>9. Haftung und Änderungen</h2>
          <p>Roshine haftet für ausdrücklich im Listing und in der Garantie genannte Zusagen. Nicht umfasst sind Verluste durch Teilen von Zugangsdaten, Fehlgebrauch, Regelverstöße, nicht unterstützte Änderungen oder Plattformentscheidungen. Bedingungen können bei Änderungen des Services oder der Rechtslage angepasst werden.</p>
          <h2>10. Kontakt</h2>
          <p>Für Bestellung, Garantie oder Streitfälle nutzen Sie die offiziellen <a href="../#contact">Discord- oder E-Mail-Links</a> im Shop und nennen Sie die Account-ID.</p>`
      }
    },

    ar: {
      nav: { home: "الرئيسية", accounts: "الحسابات", services: "الخدمات", warranty: "الضمان", faq: "الأسئلة", contact: "تواصل" },
      auth: "Authenticator",
      a11y: { skip: "الانتقال إلى محتوى السياسة", openNav: "فتح التنقل", closeNav: "إغلاق التنقل", mobileNav: "التنقل عبر الهاتف" },
      footer: {
        line1: "© 2021–2026 Roshine Account Store.",
        line2: "جميع الحقوق محفوظة — المورّد الموثوق للحسابات.",
        nav: { home: "الرئيسية", services: "الخدمات", contact: "تواصل", privacy: "الخصوصية", terms: "الشروط" }
      },
      ui: {
        home: "الرئيسية", contents: "في هذه الصفحة", updated: "آخر تحديث: 22 يوليو 2026", staticSite: "واجهة ثابتة",
        privacy: "الخصوصية", terms: "الشروط",
        note: "تصف هذه الصفحة واجهة Roshine ومسار الطلب الحاليين. وهي معلومات عامة وليست استشارة قانونية."
      },
      privacy: {
        kicker: "الخصوصية والبيانات",
        title: "سياسة الخصوصية",
        intro: "ملخص واضح لما تخزنه الواجهة الثابتة، وما نستلمه عند تواصلك معنا، وكيفية التعامل مع بيانات الطلب.",
        body: `<h2>1. النطاق وطبيعة الموقع</h2>
          <p>تنطبق هذه السياسة عند تصفح <a href="../">roshine.love</a> أو المخزون أو أداة Authenticator الخاصة، وعند التواصل مع Roshine عبر Discord أو البريد. الواجهة العامة <strong>موقع ثابت</strong> لا يتطلب حساب عميل ولا يستخدم روبوتاً عاماً للطلبات.</p>
          <h2>2. المعلومات التي يخزنها الموقع</h2>
          <p>يُستخدم التخزين المحلي للمتصفح فقط لتذكر اللغة. تعمل الفلاتر والترتيب داخل متصفحك ولا تُرسل إلينا. تعالج أداة Authenticator المفتاح الخاص محلياً في المتصفح؛ لا تشارك هذا المفتاح مع أي شخص.</p>
          <p>قد يعالج مزود الاستضافة أو CDN بيانات تقنية معتادة مثل IP ونوع المتصفح والصفحة والوقت لأغراض التسليم والأمان والموثوقية.</p>
          <h2>3. المعلومات عند التواصل</h2>
          <p>عبر Discord أو البريد نستلم ما تختار إرساله، مثل المعرّف والبريد وID الحساب واللقطات والرسائل وسجل الدعم. لا ترسل معلومات شخصية حساسة لا علاقة لها بالطلب.</p>
          <h2>4. الطلبات والمدفوعات</h2>
          <p>تُؤكد الطلبات يدوياً عبر Discord. قد نحتفظ بـ ID الحساب ووقت الطلب وحالة التسليم والملاحظات اللازمة للدعم أو النزاع. تعالج المدفوعات جهات خارجية، ولا نجمع أو نخزن عمداً أرقام البطاقات الكاملة في هذا الموقع.</p>
          <h2>5. استخدام المعلومات</h2>
          <ul><li>تأكيد التوفر والدفع والتسليم.</li><li>تقديم التسليم والضمان ودعم ما بعد البيع.</li><li>التحقيق في الاحتيال أو الإساءة أو الحوادث أو النزاعات.</li><li>الحفاظ على أمان وموثوقية الواجهة.</li><li>الوفاء بالالتزامات القانونية المطبقة.</li></ul>
          <h2>6. المشاركة والإفصاح</h2>
          <p>نشارك الحد الضروري فقط مع مزودي الاستضافة أو الاتصال أو الدفع أو الدعم. لا نبيع المعلومات الشخصية لإعلانات الجهات الخارجية.</p>
          <h2>7. الاحتفاظ والأمان</h2>
          <p>نحتفظ بسجلات الطلب والدعم للمدة اللازمة بشكل معقول للتسليم والضمان والنزاعات ومنع الاحتيال أو المتطلبات القانونية. لا توجد خدمة إنترنت تضمن الأمان الكامل؛ استخدم كلمة مرور فريدة واحمِ بيانات الاسترداد والمفاتيح الخاصة.</p>
          <h2>8. خياراتك وطلباتك</h2>
          <p>يمكنك حذف تفضيل اللغة من المتصفح. وحيث ينطبق، يمكنك طلب الوصول أو التصحيح أو الحذف لبيانات الطلب والدعم، مع مراعاة متطلبات الاحتفاظ المشروعة.</p>
          <h2>9. الخدمات الخارجية</h2>
          <p>لدى Discord وBattle.net والبريد ومزودي الدفع سياسات خصوصية مستقلة، ولا تتحكم Roshine في ممارساتهم.</p>
          <h2>10. القاصرون والتحديث والتواصل</h2>
          <p>الخدمة غير مخصصة للقاصرين. قد نحدّث السياسة عند تغيير الواجهة أو الطلب. لطلبات الخصوصية: <a href="mailto:roshine_store@roshine.love">roshine_store@roshine.love</a> أو <a href="../#contact">قسم التواصل</a>.</p>`
      },
      terms: {
        kicker: "شروط المتجر",
        title: "شروط الاستخدام",
        intro: "القواعد الحالية للمخزون والطلبات اليدوية عبر Discord والتحقق والتسليم والضمان ومسؤوليات المشتري.",
        body: `<h2>1. القبول والأهلية</h2>
          <p>عند الطلب من Roshine تؤكد قدرتك القانونية على شراء الأصول الرقمية في موقعك، وصحة معلوماتك، وقبول هذه الشروط ومعلومات الضمان الظاهرة في الواجهة.</p>
          <h2>2. المخزون ودقة الوصف</h2>
          <p>تُحدّث حالة المبيعات فورياً، ويُضاف مخزون جديد عادة كل 7 أيام. لا يُضمن التوفر حتى التأكيد على Discord. كل حساب من لاعب حقيقي وله سجل لعب طبيعي، وليس حساب سكربت أو بوت أو استوديو أو إنتاج جماعي. نستبعد الحسابات ذات التاريخ المعروف في الغش أو الإساءة أو مخالفة القواعد.</p>
          <p>يصف الإعلان الحساب وقت التحقق، ويمكن مطابقة المعلومات الأساسية مع سجلات اللعبة وBattle.net الرسمية أثناء التحقق والتسليم.</p>
          <h2>3. الطلب والسعر والدفع</h2>
          <p>تُعالج الطلبات يدوياً على Discord باستخدام ID الحساب أو لقطة. يجب تأكيد السعر والتوفر وطريقة الدفع والرسوم قبل الدفع. لا تدفع لشخص غير موثّق يدّعي تمثيل Roshine.</p>
          <h2>4. التسليم والفحص</h2>
          <p>تُسلّم معظم الطلبات خلال 5 دقائق بعد تأكيد الدفع، وقد تحتاج الحسابات النادرة المميزة وقتاً إضافياً. يجب اختبار بيانات الدخول وفحص الحساب سريعاً، عادة خلال <strong>30 دقيقة</strong>. أبلغنا فوراً إذا تعذر الفحص.</p>
          <h2>5. الاسترداد وتصحيح الوصف</h2>
          <p>تكون الأصول الرقمية نهائية بعد التسليم الصحيح. قد ينطبق التصحيح أو الاستبدال أو الاسترداد إذا منعت البيانات المقدمة أول تسجيل دخول، أو وُجدت حالة غير معلنة عند التسليم، أو تعذر التحقق من معلومة جوهرية في الإعلان.</p>
          <h2>6. الضمان ودعم ما بعد البيع</h2>
          <p>إذا استُعيد الحساب أو اختُرق أو فُقد نهائياً بسبب المالك السابق، يوفر ضمان الأمان مدى الحياة بديلاً بنفس القيمة أو تعويضاً كاملاً بعد التحقق. تحصل حسابات OW2 المؤهلة أيضاً على دعم غير محدود لمشكلات الفتح. تغيير المنطقة ومساعدة استئناف الحظر خدمات مدفوعة اختيارية ولا يُضمن قرار رسمي.</p>
          <h2>7. مسؤوليات المشتري</h2>
          <ul><li>حماية بيانات الدخول والاسترداد والمفاتيح الخاصة.</li><li>اتباع تعليمات التسليم والحفاظ على جهاز وIP ثابتين في الفترة الأولى.</li><li>عدم استخدام الحساب للغش أو الإساءة أو الاحتيال أو مخالفة القواعد.</li><li>تقديم أدلة صحيحة عند طلب الضمان أو النزاع.</li></ul>
          <h2>8. مخاطر المنصة</h2>
          <p>تداول الحسابات غير مدعوم رسمياً من Blizzard. قد يؤدي تغيير الموقع أو الجهاز أو IP أو الأمان إلى ضوابط منصة، وقرارات المنصة خارج سيطرة Roshine. يساعد ثبات الجهاز وIP نحو 7 أيام في تقليل الخطر دون إلغائه.</p>
          <h2>9. المسؤولية والتغييرات</h2>
          <p>تلتزم Roshine بما ورد صراحة في الإعلان والضمان. لا نتحمل خسائر مشاركة البيانات أو سوء الاستخدام أو المخالفات أو التعديلات غير المدعومة أو قرارات المنصة. قد تُحدّث الشروط عند تغيير الخدمة أو المتطلبات القانونية.</p>
          <h2>10. التواصل</h2>
          <p>لدعم الطلب أو الضمان أو النزاع، استخدم روابط <a href="../#contact">Discord أو البريد الرسمية</a> في الواجهة وأرسل ID الحساب.</p>`
      }
    },

    zh: {
      nav: { home: "主页", accounts: "库存", services: "服务", warranty: "售后", faq: "常见问题", contact: "联系" },
      auth: "Authenticator",
      a11y: { skip: "跳到政策正文", openNav: "打开导航", closeNav: "关闭导航", mobileNav: "移动端导航" },
      footer: {
        line1: "© 2021–2026 Roshine Account Store。",
        line2: "All rights reserved — your reliable account supplier.",
        nav: { home: "主页", services: "服务", contact: "联系", privacy: "隐私", terms: "条款" }
      },
      ui: {
        home: "主页", contents: "本页目录", updated: "更新于 2026 年 7 月 22 日", staticSite: "纯静态网站",
        privacy: "隐私政策", terms: "服务条款",
        note: "本页面按照 Roshine 当前网站与下单流程编写，仅用于一般信息说明，不构成法律意见。"
      },
      privacy: {
        kicker: "隐私与数据",
        title: "隐私政策",
        intro: "清晰说明纯静态网站会保存什么、你联系我们时会提供什么，以及订单相关信息如何被使用。",
        body: `<h2>1. 适用范围与当前网站模式</h2>
          <p>本政策适用于你浏览 <a href="../">roshine.love</a>、查看账号库存、使用私人 Authenticator 工具，以及通过 Discord 或邮件联系 Roshine 的场景。当前公开网站为<strong>纯静态网站</strong>：无需注册客户账号，也不使用公开下单机器人。</p>
          <h2>2. 网站本身保存的信息</h2>
          <p>网站仅使用浏览器本地存储记住你选择的语言。库存筛选与排序完全在浏览器本地运行，不会提交给我们。Authenticator 工具也在浏览器本地处理 Private Key；请勿把该密钥发送给任何人。</p>
          <p>托管或 CDN 服务商可能会为网页传输、安全和稳定性处理常规技术请求信息，例如 IP 地址、浏览器类型、访问页面与时间。</p>
          <h2>3. 主动联系我们时提供的信息</h2>
          <p>当你通过 Discord 或邮件联系我们时，我们会收到你主动发送的内容，例如 Discord 名称、邮箱、账号 ID、截图、聊天内容与售后记录。请勿发送与订单无关的敏感个人信息。</p>
          <h2>4. 订单与支付信息</h2>
          <p>所有订单均通过 Discord 人工确认。为完成交付与售后，我们可能保留账号 ID、下单时间、交付状态，以及必要的支持或争议记录。支付由第三方支付服务商处理；本网站不会主动收集或保存完整银行卡号。</p>
          <h2>5. 信息使用目的</h2>
          <ul><li>确认库存、付款与交付状态。</li><li>完成账号资料交接、质保与售后支持。</li><li>处理欺诈、滥用、安全事件或交易争议。</li><li>维护网站的安全性与稳定性。</li><li>在适用情况下履行法律义务。</li></ul>
          <h2>6. 信息共享</h2>
          <p>我们仅在合理必要范围内与网站托管、通信、支付或订单支持服务商共享信息。我们不会出售个人信息用于第三方广告。</p>
          <h2>7. 保存期限与安全</h2>
          <p>订单和售后记录仅在完成交付、履行质保、处理争议、防范欺诈或遵守法律所需的合理期限内保存。任何网络服务都无法保证绝对安全，请使用独立密码，并妥善保管恢复资料与 Private Key。</p>
          <h2>8. 你的选择与请求</h2>
          <p>你可以在浏览器中清除已保存的语言偏好。在适用法律允许范围内，你可以请求查询、更正或删除与订单或售后沟通相关的信息，但必要的交易和争议记录可能依法或基于正当理由保留。</p>
          <h2>9. 外部服务</h2>
          <p>Discord、Battle.net、邮件和支付平台均适用各自的隐私政策。网站提供相关链接并不代表 Roshine 能够控制这些平台的数据处理方式。</p>
          <h2>10. 未成年人、政策更新与联系</h2>
          <p>本服务不面向未成年人。网站功能或下单流程变化时，我们可能更新本政策与上方日期。隐私相关请求请发送至 <a href="mailto:roshine_store@roshine.love">roshine_store@roshine.love</a>，或通过主页的<a href="../#contact">联系区域</a>与我们沟通。</p>`
      },
      terms: {
        kicker: "商店规则",
        title: "服务条款",
        intro: "与当前网站同步的库存展示、Discord 人工下单、账号核验、交付、质保及买家责任规则。",
        body: `<h2>1. 接受条款与购买资格</h2>
          <p>向 Roshine 下单即表示：你可以在所在地区合法购买数字商品；你提供的信息真实准确；并接受本条款及主页展示的质保说明。</p>
          <h2>2. 库存与商品描述</h2>
          <p>账号销售状态实时更新，新库存通常每 7 天补充一次；最终库存以 Discord 人工确认为准。所有账号均来自真人玩家并具有正常游戏记录，不是脚本号、机器人号、工作室批量号或其他破坏游戏规则的账号。我们不会上架存在已知作弊、滥用或其他违规历史的账号。</p>
          <p>商品描述反映账号核验时的状态。描述中的关键信息可以在核验与交接过程中，通过游戏内与 Battle.net 官方记录交叉确认。</p>
          <h2>3. 下单、价格与付款</h2>
          <p>下单通过 Discord 人工完成，请发送账号 ID 或对应截图。付款前需确认账号仍有库存、最终价格、付款方式及可能产生的手续费。请勿向未经核验、但自称代表 Roshine 的个人付款。</p>
          <h2>4. 交付与验收</h2>
          <p>大部分订单在确认付款后 5 分钟内完成交付，少数顶级账号可能需要额外整理时间。收到账号后请尽快测试登录信息并检查描述，通常应在交付后的 <strong>30 分钟</strong>内完成；如遇特殊情况无法及时验收，请立即联系我们。</p>
          <h2>5. 退款与描述纠正</h2>
          <p>数字商品正确交付后原则上不支持无理由退款。若我们提供的信息导致首次登录失败、账号在交付时存在未披露的异常状态，或关键商品描述无法核验，可根据实际情况提供信息纠正、等值替换或退款。处理前请勿擅自修改安全信息，以便保留核验依据。</p>
          <h2>6. 质保与售后支持</h2>
          <p>若因前号主问题导致账号被找回、被盗或永久丢失，核验后按照终身安全质保提供等值替换或全额补偿。符合条件的 OW2 账号还提供不限次数的解锁问题协助。区服变更与解封申诉协助属于可选付费服务，最终官方审核结果不作保证。</p>
          <h2>7. 买家责任</h2>
          <ul><li>妥善保管账号密码、恢复资料与 Private Key，不得向他人泄露或共享。</li><li>遵循账号交接说明，在初始安全期内尽量保持同一设备与稳定 IP。</li><li>不得使用账号作弊、滥用、欺诈或从事违反游戏及平台规则的行为。</li><li>申请质保或处理争议时，应提供真实、完整的核验材料。</li></ul>
          <h2>8. 平台风险提示</h2>
          <p>账号交易不被 Blizzard 官方支持。登录地区、设备、IP 或安全信息变化可能触发平台风控，相关平台决定不由 Roshine 控制。建议在重大信息变更前保持同一设备与稳定 IP 使用约 7 天；该做法只能降低风险，无法完全消除风险。</p>
          <h2>9. 责任范围与条款更新</h2>
          <p>Roshine 对商品描述与质保中明确承诺的内容负责。因买家共享账号、使用不当、违规行为、不受支持的修改或第三方平台决定造成的损失，不属于我们的责任范围。网站服务、售后范围或法律要求发生变化时，本条款可能更新。</p>
          <h2>10. 联系方式</h2>
          <p>订单、质保或争议问题请通过主页展示的官方 <a href="../#contact">Discord 或邮箱入口</a>联系我们，并提供账号 ID。</p>`
      }
    }
  };

  const ids = {
    navHome: "home", navAccounts: "accounts", navServices: "services", navWarranty: "warranty", navFaq: "faq", navContact: "contact",
    mobileNavHome: "home", mobileNavAccounts: "accounts", mobileNavServices: "services", mobileNavWarranty: "warranty", mobileNavFaq: "faq", mobileNavContact: "contact"
  };

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element && value !== undefined) element.textContent = value;
  };

  const languageFromUrl = new URLSearchParams(window.location.search).get("lang");
  const savedLanguage = localStorage.getItem("roshine_lang");
  const initialLanguage = supportedLanguages.includes(languageFromUrl)
    ? languageFromUrl
    : (supportedLanguages.includes(savedLanguage) ? savedLanguage : "en");

  function buildToc() {
    const content = document.getElementById("policyContent");
    const toc = document.getElementById("policyTocLinks");
    if (!content || !toc) return;

    if (tocObserver) tocObserver.disconnect();
    toc.textContent = "";
    const headings = [...content.querySelectorAll("h2")];

    headings.forEach((heading, index) => {
      heading.id = `section-${index + 1}`;
      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent;
      if (index === 0) link.classList.add("active");
      toc.appendChild(link);
    });

    if (!("IntersectionObserver" in window)) return;
    const links = [...toc.querySelectorAll("a")];
    tocObserver = new IntersectionObserver((entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (!visible) return;
      links.forEach((link) => link.classList.toggle("active", link.hash === `#${visible.target.id}`));
    }, { rootMargin: "-20% 0px -68%", threshold: 0 });
    headings.forEach((heading) => tocObserver.observe(heading));
  }

  function languageUrl(page, language) {
    return `../${page}/?lang=${encodeURIComponent(language)}`;
  }

  function applyLanguage(language, updateUrl = false) {
    if (!supportedLanguages.includes(language)) language = "en";
    const t = copy[language];
    const page = t[pageKey];
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.title = `${page.title} — Roshine Account Store`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", page.intro);
    localStorage.setItem("roshine_lang", language);

    Object.entries(ids).forEach(([id, key]) => setText(id, t.nav[key]));
    setText("authBtnText", t.auth);
    setText("mobileNavAuth", t.auth);
    setText("skipLink", t.a11y.skip);
    setText("breadcrumbHome", t.ui.home);
    setText("breadcrumbCurrent", page.title);
    setText("policyKicker", page.kicker);
    setText("policyTitle", page.title);
    setText("policyIntro", page.intro);
    setText("policyUpdated", t.ui.updated);
    setText("policyStatic", t.ui.staticSite);
    setText("privacySwitch", t.ui.privacy);
    setText("termsSwitch", t.ui.terms);
    setText("tocTitle", t.ui.contents);
    setText("policyNote", t.ui.note);
    setText("footerLine1", t.footer.line1);
    setText("footerLine2", t.footer.line2);
    setText("footHome", t.footer.nav.home);
    setText("footServices", t.footer.nav.services);
    setText("footContact", t.footer.nav.contact);
    setText("footPrivacy", t.footer.nav.privacy);
    setText("footTerms", t.footer.nav.terms);

    const content = document.getElementById("policyContent");
    if (content) content.innerHTML = page.body;
    const selector = document.getElementById("langSelect");
    if (selector) selector.value = language;

    const privacyUrl = languageUrl("privacy", language);
    const termsUrl = languageUrl("terms", language);
    document.getElementById("privacySwitch")?.setAttribute("href", privacyUrl);
    document.getElementById("termsSwitch")?.setAttribute("href", termsUrl);
    document.getElementById("footPrivacy")?.setAttribute("href", privacyUrl);
    document.getElementById("footTerms")?.setAttribute("href", termsUrl);
    buildToc();

    const toggle = document.getElementById("mobileMenuToggle");
    if (toggle?.getAttribute("aria-expanded") !== "true") toggle?.setAttribute("aria-label", t.a11y.openNav);
    document.getElementById("mobileNav")?.setAttribute("aria-label", t.a11y.mobileNav);

    if (updateUrl) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("lang", language);
        history.replaceState(null, "", url);
      } catch { /* Local preview can restrict history updates. */ }
    }
  }

  const mobileMenuToggle = document.getElementById("mobileMenuToggle");
  const mobileNav = document.getElementById("mobileNav");

  function closeMobileNav(restoreFocus = false) {
    mobileMenuToggle?.setAttribute("aria-expanded", "false");
    mobileNav?.setAttribute("data-open", "false");
    mobileNav?.setAttribute("aria-hidden", "true");
    const lang = supportedLanguages.includes(document.documentElement.lang) ? document.documentElement.lang : "en";
    mobileMenuToggle?.setAttribute("aria-label", copy[lang].a11y.openNav);
    if (restoreFocus) mobileMenuToggle?.focus();
  }

  mobileMenuToggle?.addEventListener("click", () => {
    const opening = mobileMenuToggle.getAttribute("aria-expanded") !== "true";
    const lang = supportedLanguages.includes(document.documentElement.lang) ? document.documentElement.lang : "en";
    mobileMenuToggle.setAttribute("aria-expanded", String(opening));
    mobileMenuToggle.setAttribute("aria-label", opening ? copy[lang].a11y.closeNav : copy[lang].a11y.openNav);
    mobileNav?.setAttribute("data-open", String(opening));
    mobileNav?.setAttribute("aria-hidden", String(!opening));
    if (opening) window.setTimeout(() => mobileNav?.querySelector("a")?.focus(), 40);
  });

  mobileNav?.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMobileNav();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenuToggle?.getAttribute("aria-expanded") === "true") closeMobileNav(true);
  });

  document.getElementById("langSelect")?.addEventListener("change", (event) => applyLanguage(event.target.value, true));
  applyLanguage(initialLanguage);
})();
