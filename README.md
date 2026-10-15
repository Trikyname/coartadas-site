# coartadas-site

La web pública de **Coartadas** en GitHub Pages: https://trikyname.github.io/coartadas-site/
Un push a `main` publica.

Es estática: sin paso de compilación, sin frameworks, sin rastreadores y sin peticiones a otros
dominios (las fuentes van en `fonts/`). Funciona en el móvil.

## Ficheros

- `index.html`: la portada. Nombre y «Murder Puzzles» / «Puzles de asesinato», un caso jugable, la
  descripción del juego, «Muy pronto en Google Play y App Store» **sin enlaces** (el juego aún no
  está publicado) y el pie con las páginas legales y el contacto. En inglés y en español: al entrar
  sigue el idioma del navegador y el botón de arriba lo cambia (la elección se guarda en
  `localStorage` de ese navegador, nada más). Los textos de cada idioma llevan `data-l="en"` o
  `data-l="es"`.
- `caso.js`: el caso jugable. Un plano de cuatro estancias con puertas, tres sospechosos y tres
  horas; se toca a alguien y luego una estancia, o se arrastra. El tablero sólo enseña lo colocado
  y los pasos que la casa no permite; si la noche es correcta sólo se dice al acusar (regla del
  juego: el feedback es de estado, nunca de corrección). Contiene los datos del caso y las
  comprobaciones de reglas, que comparte con `check-case.js`.
- `check-case.js`: prueba el caso antes de publicarlo. `node check-case.js` prueba todas las
  noches posibles y falla si no hay exactamente una que cumpla la casa, el crimen y las pistas, si
  alguna pista sobra, si hace falta adivinar o si alguna pista pone a alguien en la escena del
  crimen (directamente o con las reglas de la casa). **Si se cambia el caso, se pasa este script.**
- `privacy.html`: la política de privacidad, en inglés y en español en la misma página. Es la URL
  que piden las fichas de Google Play y de App Store Connect.
- `delete-data.html`: cómo pedir el borrado de datos (URL de borrado de datos que puede pedir Play).
- `site.css`: el aspecto del juego. Serigrafía de tres tintas sobre papel, campos de tinta rectos y
  objetos redondos, con los colores de `Assets/UI/Tokens.uss` del repo del juego y sus reglas de
  `.docs/design/design-system.md`.
- `fonts/`: las fuentes del juego (Staatliches, Karla y Caveat), con licencia SIL OFL 1.1, que
  permite incrustarlas en una web; el texto de la licencia está en `fonts/LICENSES.txt`.
- `favicon.svg`, `favicon-32.png` y `apple-touch-icon.png`: el icono del juego (disco y cerradura).
- `share.png`: la imagen que enseñan las redes y los chats al compartir el enlace (1200×630, en
  inglés; `og:image` en `index.html`).
- La cabecera de la portada (cerradura sobre disco ocre y campo azul) es un SVG dentro de
  `index.html`; en el móvil pasa a ser una banda encima del nombre.

El icono, la imagen para compartir y la cabecera salen de los gráficos de tienda de Claude Design,
guardados en `.docs/design/tienda/entrega/` del repo del juego.

## Cuando salga en las tiendas

En `index.html`, las dos líneas «Coming soon…» / «Muy pronto…» (portada y banda azul) se cambian
por enlaces a cada tienda, y la frase del veredicto del caso (`soon` en `caso.js`) también.

## Textos

La descripción de la portada es la de las fichas de las tiendas (`.docs/notes/ficha-tiendas-2026-10-14.md`
del repo del juego: la larga en-US en inglés y la es-ES en español); no se afirma nada que no esté
allí. Cada frase de `privacy.html` y `delete-data.html` sale de la sección «Privacidad» de esa misma
nota y de las comprobaciones contra el código hechas el 14/10/2026. Si el juego cambia lo que envía
(por ejemplo cuando se activen las descargas de casos diarios o se apague el diagnóstico del
motor), se revisa la política y se cambia su fecha de vigencia.

## Ver en local

`python -m http.server 8765 --bind 127.0.0.1` en esta carpeta y abrir http://127.0.0.1:8765/.
