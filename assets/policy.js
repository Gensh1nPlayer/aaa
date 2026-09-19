(() => {
  "use strict";

  const pageKey = document.body.dataset.policyPage === "terms" ? "terms" : "privacy";
  const supportedLanguages = ["en", "fr", "de", "ar", "ja"];
  let tocObserver = null;

  const copy = {
    en: {
      nav: { home: "Home", accounts: "Accounts", services: "Services", warranty: "Warranty", faq: "FAQ", contact: "Contact" },
      auth: "Authenticator",
      a11y: { skip: "Skip to policy content", openNav: "Open navigation", closeNav: "Close navigation", mobileNav: "Mobile navigation" },
      footer: {
        line1: "© 2021–2026 Roshine Account Store.",
        line2: "Overwatch accounts, straight answers, and support that continues after checkout.",
        nav: { home: "Home", services: "Services", contact: "Contact", privacy: "Privacy", terms: "Terms" }
      },
      ui: {
        home: "Home",
        contents: "On this page",
        updated: "Updated September 20, 2026",
        staticSite: "Static storefront",
        privacy: "Privacy",
        terms: "Terms",
        note: "This page is written to describe the current Roshine storefront and order flow. It is general information and not legal advice."
      },
      privacy: {
        kicker: "PRIVACY & DATA",
        title: "Privacy Policy",
        intro: "What stays in your browser, what we receive when you open a Discord order, and what we keep for delivery, warranty, and dispute support—explained without the legal fog.",
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
          <p>The site currently loads display fonts from Google Fonts, which may receive ordinary request data such as your IP address and browser information. Discord, Battle.net, email and payment providers operate under their own privacy policies. Links to those services do not mean that Roshine controls their data practices.</p>

          <h2>10. Minors, updates and contact</h2>
          <p>The service is not intended for minors. We may revise this policy when the storefront or order process changes and will update the date shown above. For privacy requests, email <a href="mailto:roshine_store@roshine.love">roshine_store@roshine.love</a> or use the <a href="../#contact">contact section</a>.</p>`
      },
      terms: {
        kicker: "STORE TERMS",
        title: "Terms of Service",
        intro: "What we confirm before payment, what you receive at handover, when warranty applies, and what both sides need to do if something goes wrong.",
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
        home: "Accueil", contents: "Sur cette page", updated: "Mis à jour le 20 septembre 2026", staticSite: "Vitrine statique",
        privacy: "Confidentialité", terms: "Conditions",
        note: "Cette page décrit la vitrine Roshine et le parcours de commande actuels. Elle fournit des informations générales et ne constitue pas un conseil juridique."
      },
      privacy: {
        kicker: "CONFIDENTIALITÉ & DONNÉES",
        title: "Politique de confidentialité",
        intro: "Ce qui reste dans votre navigateur, ce que nous recevons lors d’une commande Discord et ce que nous conservons pour la livraison, la garantie et les litiges, en termes simples.",
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
          <p>Le site charge actuellement ses polices d’affichage depuis Google Fonts, qui peut recevoir des données de requête ordinaires telles que l’adresse IP et les informations du navigateur. Discord, Battle.net, l'e-mail et les prestataires de paiement appliquent leurs propres politiques de confidentialité. Roshine ne contrôle pas leurs pratiques.</p>
          <h2>10. Mineurs, mises à jour et contact</h2>
          <p>Le service n'est pas destiné aux mineurs. Cette politique peut évoluer avec la vitrine ou le parcours de commande. Pour une demande de confidentialité : <a href="mailto:roshine_store@roshine.love">roshine_store@roshine.love</a> ou la <a href="../#contact">section Contact</a>.</p>`
      },
      terms: {
        kicker: "CONDITIONS DE VENTE",
        title: "Conditions d'utilisation",
        intro: "Ce que nous confirmons avant le paiement, ce que vous recevez au transfert, quand la garantie s’applique et les responsabilités de chacun en cas de problème.",
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
        home: "Home", contents: "Auf dieser Seite", updated: "Aktualisiert am 20. September 2026", staticSite: "Statische Website",
        privacy: "Datenschutz", terms: "AGB",
        note: "Diese Seite beschreibt den aktuellen Roshine-Shop und Bestellablauf. Sie dient der allgemeinen Information und ist keine Rechtsberatung."
      },
      privacy: {
        kicker: "DATENSCHUTZ & DATEN",
        title: "Datenschutzerklärung",
        intro: "Was im Browser bleibt, was wir bei einer Discord-Bestellung erhalten und was wir für Übergabe, Garantie und Streitfälle speichern – klar erklärt.",
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
          <p>Die Website lädt derzeit Anzeigeschriften von Google Fonts. Dabei können übliche Anfragedaten wie IP-Adresse und Browserinformationen an Google übermittelt werden. Discord, Battle.net, E-Mail- und Zahlungsanbieter haben eigene Datenschutzrichtlinien. Roshine kontrolliert deren Datenverarbeitung nicht.</p>
          <h2>10. Minderjährige, Änderungen und Kontakt</h2>
          <p>Der Service richtet sich nicht an Minderjährige. Änderungen am Shop oder Bestellprozess können zu einer Aktualisierung führen. Datenschutzanfragen an <a href="mailto:roshine_store@roshine.love">roshine_store@roshine.love</a> oder über den <a href="../#contact">Kontaktbereich</a>.</p>`
      },
      terms: {
        kicker: "SHOP-BEDINGUNGEN",
        title: "Nutzungsbedingungen",
        intro: "Was vor der Zahlung bestätigt wird, was du bei der Übergabe erhältst, wann die Garantie greift und was beide Seiten bei Problemen tun müssen.",
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
        home: "الرئيسية", contents: "في هذه الصفحة", updated: "آخر تحديث: 20 سبتمبر 2026", staticSite: "واجهة ثابتة",
        privacy: "الخصوصية", terms: "الشروط",
        note: "تصف هذه الصفحة واجهة Roshine ومسار الطلب الحاليين. وهي معلومات عامة وليست استشارة قانونية."
      },
      privacy: {
        kicker: "الخصوصية والبيانات",
        title: "سياسة الخصوصية",
        intro: "ما يبقى داخل متصفحك، وما نستلمه عند فتح طلب عبر Discord، وما نحتفظ به للتسليم والضمان والنزاعات، بصياغة واضحة.",
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
          <p>يحمّل الموقع حالياً خطوط العرض من Google Fonts، وقد تتلقى بيانات طلب معتادة مثل عنوان IP ومعلومات المتصفح. لدى Discord وBattle.net والبريد ومزودي الدفع سياسات خصوصية مستقلة، ولا تتحكم Roshine في ممارساتهم.</p>
          <h2>10. القاصرون والتحديث والتواصل</h2>
          <p>الخدمة غير مخصصة للقاصرين. قد نحدّث السياسة عند تغيير الواجهة أو الطلب. لطلبات الخصوصية: <a href="mailto:roshine_store@roshine.love">roshine_store@roshine.love</a> أو <a href="../#contact">قسم التواصل</a>.</p>`
      },
      terms: {
        kicker: "شروط المتجر",
        title: "شروط الاستخدام",
        intro: "ما نؤكده قبل الدفع، وما تستلمه عند التسليم، ومتى ينطبق الضمان، وما يجب على الطرفين فعله عند حدوث مشكلة.",
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

    ja: {
      nav: { home: "ホーム", accounts: "在庫", services: "購入方法", warranty: "保証", faq: "FAQ", contact: "お問い合わせ" },
      auth: "Authenticator",
      a11y: { skip: "ポリシー本文へ移動", openNav: "メニューを開く", closeNav: "メニューを閉じる", mobileNav: "モバイルメニュー" },
      footer: {
        line1: "© 2021–2026 Roshine Account Store.",
        line2: "分かりやすいアカウント情報、率直な回答、購入後も続くサポート。",
        nav: { home: "ホーム", services: "サービス", contact: "お問い合わせ", privacy: "プライバシー", terms: "利用規約" }
      },
      ui: {
        home: "ホーム", contents: "このページの内容", updated: "2026年9月20日更新", staticSite: "静的ストアフロント",
        privacy: "プライバシー", terms: "利用規約",
        note: "このページは現在のRoshineストアと注文手順について説明する一般情報であり、法律上の助言ではありません。"
      },
      privacy: {
        kicker: "プライバシー & データ",
        title: "プライバシーポリシー",
        intro: "ブラウザ内に残る情報、Discord注文時に受け取る情報、引き渡し・保証・紛争対応のために保管する情報を分かりやすく説明します。",
        body: `<h2>1. 適用範囲と現在のサイト構成</h2>
          <p>このポリシーは、<a href="../">roshine.love</a>の閲覧、在庫確認、プライベートAuthenticatorツールの利用、Discordまたはメールでのお問い合わせに適用されます。公開ストアは顧客アカウントを必要としない<strong>静的ウェブサイト</strong>です。</p>
          <h2>2. ウェブサイトが保存する情報</h2>
          <p>サイトは選択言語を記憶するためにブラウザのローカルストレージを使用します。在庫の検索・並び替えはブラウザ内で処理され、送信されません。AuthenticatorのPrivate Keyもブラウザ内で処理される設計です。第三者へ送らないでください。</p>
          <p>ホスティングまたはCDN事業者は、配信、安全性、信頼性のためにIPアドレス、ブラウザ、閲覧ページ、時刻など通常の技術情報を処理する場合があります。</p>
          <h2>3. お問い合わせ時に受け取る情報</h2>
          <p>Discordまたはメールで送信されたハンドル名、メールアドレス、アカウントID、スクリーンショット、メッセージ、サポート履歴を受け取る場合があります。注文と無関係な機密情報は送らないでください。</p>
          <h2>4. 注文と支払い</h2>
          <p>注文はDiscordで手動確認します。アカウントID、注文日時、引き渡し状況、サポート・紛争記録を必要な範囲で保持する場合があります。支払いは外部事業者が処理し、このサイトがカード番号全体を意図的に収集・保存することはありません。</p>
          <h2>5. 情報の利用目的</h2>
          <ul><li>在庫、支払い、引き渡しの確認。</li><li>アカウント引き渡し、保証、アフターサポート。</li><li>不正、悪用、セキュリティ事故、紛争の調査。</li><li>サイトの安全性と信頼性の維持。</li><li>適用される法的義務への対応。</li></ul>
          <h2>6. 共有と開示</h2>
          <p>ホスティング、通信、支払い、注文サポートに必要な範囲でサービス事業者と共有します。第三者広告のために個人情報を販売しません。</p>
          <h2>7. 保存期間と安全性</h2>
          <p>注文・サポート記録は、引き渡し確認、保証、紛争、不正防止、法的要件に合理的に必要な期間のみ保持します。固有のパスワードを使用し、復旧情報とPrivate Keyを秘密にしてください。</p>
          <h2>8. 選択とリクエスト</h2>
          <p>ブラウザから保存済み言語設定を削除できます。適用される場合、正当な記録保持要件に従い、注文・サポート情報の開示、訂正、削除を依頼できます。</p>
          <h2>9. 外部サービス</h2>
          <p>現在、表示フォントはGoogle Fontsから読み込まれ、IPアドレスやブラウザ情報など通常のリクエスト情報がGoogleへ送信される場合があります。Discord、Battle.net、メール、支払い事業者はそれぞれのプライバシーポリシーに従います。Roshineがそれらのデータ処理を管理するものではありません。</p>
          <h2>10. 未成年者、更新、お問い合わせ</h2>
          <p>本サービスは未成年者を対象としていません。サイトや注文手順の変更に合わせて本ポリシーを更新する場合があります。お問い合わせは<a href="mailto:roshine_store@roshine.love">roshine_store@roshine.love</a>または<a href="../#contact">お問い合わせセクション</a>をご利用ください。</p>`
      },
      terms: {
        kicker: "ストア利用条件", title: "利用規約",
        intro: "支払い前に確認する内容、引き渡し時に受け取るもの、保証の適用条件、問題発生時に双方が行うことをまとめています。",
        body: `<h2>1. 同意と利用資格</h2>
          <p>Roshineへ注文することで、居住地域でデジタル商品を適法に購入でき、提供情報が正確で、本規約とサイトに表示された保証内容へ同意することを確認します。</p>
          <h2>2. 在庫と掲載情報</h2>
          <p>販売状況は注文の進行に合わせて更新され、新しい在庫は通常7日単位で追加されます。Discordで確認するまで在庫は保証されません。既知のチート、悪用、規約違反履歴があるアカウントは除外します。</p>
          <p>掲載内容は確認時点の状態です。重要な情報は確認・引き渡し時にゲーム内およびBattle.net記録と照合できます。</p>
          <h2>3. 注文、価格、支払い</h2>
          <p>注文はアカウントIDまたはスクリーンショットを使いDiscordで手動処理します。支払い前に価格、在庫、支払い方法、手数料を確認してください。Roshineを名乗る未確認の相手へ支払わないでください。</p>
          <h2>4. 引き渡しと確認</h2>
          <p>多くの注文は入金確認後すみやかに引き渡します。高額アカウントは追加確認が必要な場合があります。購入者は受領後できるだけ早く、通常30分以内にログイン情報とアカウントを確認してください。</p>
          <h2>5. 返金と掲載内容の訂正</h2>
          <p>正しく引き渡されたデジタル商品は原則最終取引です。初回ログインできない、未開示の異常状態がある、重要な掲載情報を確認できない場合は、訂正、交換、返金の対象となることがあります。セキュリティ情報を変更する前にご連絡ください。</p>
          <h2>6. 保証と購入後サポート</h2>
          <p>元所有者に起因する取り戻し、侵害、恒久的消失が確認された場合、証拠確認と復旧を先に行い、復旧できなければ状況と在庫に応じて同等品交換、返金または適正な補償を案内します。地域変更とBAN異議申し立ては有料オプションで、公式結果は保証されません。</p>
          <h2>7. 購入者の責任</h2>
          <ul><li>ログイン情報、復旧情報、Private Keyを安全に保管し共有しないこと。</li><li>引き渡し手順に従い、初期期間は安定した端末とIPを使用すること。</li><li>チート、悪用、詐欺、規約違反に使用しないこと。</li><li>保証・紛争対応時に正確な証拠を提示すること。</li></ul>
          <h2>8. プラットフォーム上のリスク</h2>
          <p>アカウント取引はBlizzardに公式サポートされていません。地域、端末、IP、セキュリティ情報の変更は制限を引き起こす場合があり、プラットフォームの判断はRoshineの管理外です。</p>
          <h2>9. 責任と変更</h2>
          <p>Roshineは掲載と保証で明示した約束に責任を負います。情報共有、誤用、規約違反、サポート対象外の変更、第三者プラットフォームの判断による損失には責任を負いません。</p>
          <h2>10. お問い合わせ</h2>
          <p>注文、保証、紛争に関するサポートは、サイト上の公式<a href="../#contact">Discordまたはメール</a>からアカウントIDを添えてご連絡ください。</p>`
      }
    },

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
  const edgeLanguage = String(window.__ROSHINE_EDGE_LANG__ || "").toLowerCase();
  const browserLanguage = (() => {
    const locale = String(navigator.language || "en").toLowerCase();
    return supportedLanguages.find(language => locale.startsWith(language)) || "en";
  })();
  const initialLanguage = supportedLanguages.includes(languageFromUrl)
    ? languageFromUrl
    : supportedLanguages.includes(savedLanguage)
      ? savedLanguage
      : supportedLanguages.includes(edgeLanguage)
        ? edgeLanguage
        : browserLanguage;

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

  function normalizeUnsupportedLanguageParam() {
    const url = new URL(window.location.href);
    const requested = url.searchParams.get("lang");
    if (!requested || supportedLanguages.includes(requested)) return;
    url.searchParams.delete("lang");
    history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  normalizeUnsupportedLanguageParam();

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
    const triggerValue = document.getElementById("languageTriggerValue");
    if (triggerValue) triggerValue.textContent = language === "ja" ? "日本語" : language.toUpperCase();
    document.getElementById("languageTrigger")?.setAttribute("aria-label", `Language: ${triggerValue?.textContent || language.toUpperCase()}`);
    document.querySelectorAll("[data-language-value]").forEach(option => {
      const selected = option.dataset.languageValue === language;
      option.setAttribute("aria-selected", String(selected));
      option.tabIndex = selected ? 0 : -1;
    });

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
    if (event.key !== "Escape") return;
    if (mobileMenuToggle?.getAttribute("aria-expanded") === "true") closeMobileNav(true);
    const picker = document.getElementById("languagePicker");
    if (picker?.dataset.open === "true") {
      picker.dataset.open = "false";
      document.getElementById("languageMenu")?.setAttribute("hidden", "");
      document.getElementById("languageTrigger")?.setAttribute("aria-expanded", "false");
      document.getElementById("languageTrigger")?.focus();
    }
  });

  const languagePicker = document.getElementById("languagePicker");
  const languageTrigger = document.getElementById("languageTrigger");
  const languageMenu = document.getElementById("languageMenu");
  const closeLanguageMenu = () => {
    if (!languagePicker || !languageMenu || !languageTrigger) return;
    languagePicker.dataset.open = "false";
    languageMenu.hidden = true;
    languageTrigger.setAttribute("aria-expanded", "false");
  };
  languageTrigger?.addEventListener("click", () => {
    const opening = languagePicker?.dataset.open !== "true";
    if (!languagePicker || !languageMenu) return;
    languagePicker.dataset.open = String(opening);
    languageMenu.hidden = !opening;
    languageTrigger.setAttribute("aria-expanded", String(opening));
    if (opening) languageMenu.querySelector('[aria-selected="true"]')?.focus();
  });
  languageMenu?.addEventListener("click", event => {
    const option = event.target.closest("[data-language-value]");
    if (!option) return;
    applyLanguage(option.dataset.languageValue, true);
    closeLanguageMenu();
    languageTrigger?.focus();
  });
  document.addEventListener("click", event => {
    if (languagePicker && !languagePicker.contains(event.target)) closeLanguageMenu();
  });
  document.getElementById("langSelect")?.addEventListener("change", (event) => applyLanguage(event.target.value, true));
  applyLanguage(initialLanguage);
})();
