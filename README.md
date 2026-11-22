# Générateur de QR code

Un site simple pour créer des QR codes personnalisés, avec aperçu en direct. Il fonctionne sans compte, sans serveur et sans étape de compilation. Tout est généré dans le navigateur, et aucune donnée n'est envoyée.

## Fonctionnalités

- **Contenus :** lien, texte, Wi-Fi, e-mail, téléphone et fiche contact (vCard).
- **Formes :** 6 styles de points, 3 contours de coins et 2 centres de coins.
- **Couleurs :** palettes, couleurs libres, dégradé linéaire ou radial, coins séparés et fond transparent.
- **Logo SVG :** import par fichier, glisser-déposer ou code collé, avec réglage de la taille et de l'espace autour.
- **Lisibilité :** alerte en cas de contraste faible ou de couleurs inversées, et choix du niveau de correction d'erreur.
- **Export :** PNG, JPEG et WebP jusqu'à 4096 px, ou SVG.
- **Mobile :** interface à onglets adaptée au tactile, au mode paysage et au clavier virtuel.

## Lancer le projet

Clonez le dépôt, puis ouvrez `index.html` dans un navigateur :

```bash
git clone https://github.com/sacez53/qr-code-generator.git
cd qr-code-generator
```

Le bouton « Copier l'image » dépend de l'accès au presse-papiers du navigateur. Il peut donc ne pas apparaître quand le fichier est ouvert directement. Il nécessite une page servie en HTTPS ou depuis `localhost`, par exemple avec :

```bash
npx serve .
```

## Structure

```text
index.html        Page d'accueil
home.css          Styles de l'accueil
home.js           QR code interactif de l'accueil
generateur.html   Page du générateur
style.css         Styles du générateur
app.js            Logique du générateur
vendor/           Bibliothèque QR code et police, en local
```

## Données et confidentialité

Les réglages et le logo sont conservés dans le `localStorage` du navigateur pour être retrouvés à la visite suivante. Le mot de passe Wi-Fi n'y est jamais enregistré, mais il est inscrit en clair dans le QR code généré.

## Limites

- Les QR codes sont statiques : pour changer leur contenu, il faut en générer un nouveau.
- Un logo très grand, un contraste faible ou des couleurs inversées peuvent gêner la lecture. Testez toujours le QR code avec un téléphone avant de l'imprimer.

## Technologies

- HTML, CSS et JavaScript, sans framework
- [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) 1.9.2 (licence MIT)
- [Schibsted Grotesk](https://fontsource.org/fonts/schibsted-grotesk) (licence SIL OFL 1.1)
