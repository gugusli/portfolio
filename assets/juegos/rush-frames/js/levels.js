/* ============================================================
   Rush Frames — definición de niveles
   Cada nivel es un objeto plano (formato del diseño original).
   La geometría está verificada contra la física REAL del juego
   (tools/verify.mjs, que ejecuta el player.js original):
   altura máx. de salto = 147 px (+ ~16 px de "snap" de aterrizaje)
   · alcance plano máx. = 200 px a velocidad completa (340 px/s)
   · coyote = 100 ms · jump buffer = 100 ms.
   Reglas de diseño aplicadas:
   · Ninguna plataforma invade la "banda de arco" de otra ruta.
   · Ninguna superficie de despegue por encima de y=150 (los
     saltos no salen del canvas).
   · Cada aterrizaje tolera el error humano (+23 px de "press
     tardío") más allá del punto de aterrizaje natural.
   ============================================================ */
"use strict";

const LEVELS = [

  /* ------------------------------------------------------------
     NIVEL 1 — Primeros pasos
     Introducción: un hueco fácil y una subida en dos escalones,
     sin hazards. Enseña a saltar y a encadenar salto + dirección.
     ------------------------------------------------------------ */
  {
    id: "level1",
    name: "Primeros pasos",
    hint: "El cronómetro arranca con tu primer movimiento",
    spawn: { x: 50, y: 370 },
    goal: { x: 720, y: 150, width: 40, height: 60 },
    platforms: [
      { x: 0,   y: 400, width: 250, height: 20 }, // suelo inicial
      { x: 330, y: 400, width: 470, height: 20 }, // suelo largo (hueco de 80 px)
      { x: 400, y: 300, width: 140, height: 16 }, // plataforma intermedia
      { x: 650, y: 210, width: 150, height: 20 }  // plataforma de la meta
    ],
    hazards: []
  },

  /* ------------------------------------------------------------
     NIVEL 2 — Paso fino
     Plataformas más separadas + 2 hazards: pinchos al borde del
     suelo de salida y un foso con pinchos entre B y C.
     La subida final (C→D→E→F) exige precisión real.
     ------------------------------------------------------------ */
  {
    id: "level2",
    name: "Paso fino",
    hint: "Los pinchos no perdonan",
    spawn: { x: 50, y: 370 },
    goal: { x: 185, y: 110, width: 40, height: 60 },
    platforms: [
      { x: 0,   y: 400, width: 200, height: 20 }, // suelo de salida
      { x: 300, y: 400, width: 130, height: 20 }, // B — hueco de 100 px
      { x: 560, y: 400, width: 130, height: 20 }, // C — hueco de 130 px
      { x: 660, y: 290, width: 110, height: 16 }, // D — inicio del ascenso
      { x: 420, y: 230, width: 120, height: 16 }, // E — salto hacia la izquierda
      { x: 180, y: 170, width: 130, height: 16 }  // F — plataforma de la meta
    ],
    hazards: [
      { x: 170, y: 386, width: 30,  height: 14 }, // pinchos en el borde del suelo
      { x: 430, y: 432, width: 130, height: 18 }  // pinchos en el foso B–C
    ]
  },

  /* ------------------------------------------------------------
     NIVEL 3 — El atajo
     Dos rutas hacia la meta (abajo a la derecha), en corredores
     verticales separados para que ninguna plataforma interfiera
     el arco de la otra:
     · RUTA SEGURA (arriba): saltar pronto desde el suelo → u0 →
       u1 → u2 (paso alto y largo) → dejarse caer al final.
     · ATAJO (abajo, rápido): despegue tardío a máxima velocidad
       → s1 → s2 (plataforma estrecha sobre el foso de pinchos).
       Quedarse corto o pasarse en s1→s2 = pinchos = reinicio.
     La horquilla: saltar pronto (~x<90) te lleva a u0; saltar
     tarde (~x>90) a s1. Entre ambas no hay zona muerta.
     ------------------------------------------------------------ */
  {
    id: "level3",
    name: "El atajo",
    hint: "Hay una ruta rápida… si te atreves",
    spawn: { x: 30, y: 380 },
    goal: { x: 720, y: 350, width: 40, height: 60 },
    platforms: [
      { x: 0,   y: 410, width: 170, height: 20 }, // suelo de salida
      { x: 200, y: 300, width: 40,  height: 16 }, // u0 — ruta segura, paso 1
      { x: 330, y: 210, width: 60,  height: 16 }, // u1 — ruta segura, paso 2
      { x: 480, y: 160, width: 170, height: 16 }, // u2 — paso alto (drop seguro a meta)
      { x: 260, y: 390, width: 110, height: 16 }, // s1 — atajo, zona de aterrizaje
      { x: 450, y: 390, width: 60,  height: 16 }, // s2 — atajo (estrecho, riesgo)
      { x: 560, y: 410, width: 240, height: 20 }  // suelo de la meta
    ],
    hazards: [
      { x: 170, y: 440, width: 190, height: 10 }, // foso de pinchos (parte 1)
      { x: 360, y: 440, width: 200, height: 10 }  // foso de pinchos (parte 2)
    ]
  },

  /* ------------------------------------------------------------
     NIVEL 4 — La escalera
     Nueva habilidad: la escalada con foso. Todo el piso derecho es
     pinchos: caerse = reinicio. Tres saltos de subida rítmicos
     (subidas de 90-90-70) enseñan el mecanismo — aprender uno es
     aprender el nivel — y un tramo aéreo final de dos plataformas
     chicas (40 px) corona la subida. Las subidas están lejos del
     techo de 147: el reto no es la altura, es no caerse nunca.
     ------------------------------------------------------------ */
  {
    id: "level4",
    name: "La escalera",
    hint: "Mirá para arriba, no para abajo",
    spawn: { x: 40, y: 370 },
    goal: { x: 710, y: 90, width: 40, height: 60 },
    platforms: [
      { x: 0,   y: 400, width: 150, height: 20 }, // suelo de salida
      { x: 200, y: 310, width: 44,  height: 16 }, // P1 — escalón 1 (subida 90, hueco 50)
      { x: 330, y: 220, width: 44,  height: 16 }, // P2 — escalón 2 (subida 90, hueco 86)
      { x: 460, y: 150, width: 44,  height: 16 }, // P3 — escalón 3 (subida 70, hueco 86)
      { x: 600, y: 160, width: 36,  height: 16 }, // P4 — tramo aéreo (caída 10, hueco 96)
      { x: 700, y: 150, width: 36,  height: 16 }  // P5 — plataforma de la meta
    ],
    hazards: [
      { x: 160, y: 440, width: 640, height: 10 }  // foso: caerse de la escalera = pinchos
    ]
  },

  /* ------------------------------------------------------------
     NIVEL 5 — Contratiempo
     Nueva habilidad: el ritmo. Tres campos de pinchos sobre el
     piso con "bolsillos" de aterrizaje cada vez más chicos:
     70 px → 60 px → 80 px tras el campo largo. El campo de
     120 px (s3) NO se puede saltar a media velocidad: hay que
     llegar con casi toda la velocidad (≥ ~290 px/s) y saltar
     en el momento justo. Mantener derecha + buffer de salto
     es la forma natural de encadenar. El salto final cruza el
     foso y aterriza pasada la franja de pinchos de la meta.
     ------------------------------------------------------------ */
  {
    id: "level5",
    name: "Contratiempo",
    hint: "El campo largo se salta a toda velocidad",
    spawn: { x: 30, y: 370 },
    goal: { x: 740, y: 270, width: 40, height: 60 },
    platforms: [
      { x: 0,   y: 400, width: 610, height: 20 }, // piso con los tres campos
      { x: 690, y: 330, width: 110, height: 20 }  // plataforma de la meta (elevada 70)
    ],
    hazards: [
      { x: 150, y: 386, width: 50,  height: 14 },  // s1 — calentamiento (bolsillo de 70)
      { x: 280, y: 386, width: 70,  height: 14 },  // s2 — bolsillo de 60
      { x: 410, y: 386, width: 120, height: 14 },  // s3 — el campo largo: pide velocidad
      { x: 610, y: 440, width: 80,  height: 10 },  // foso final
      { x: 690, y: 316, width: 30,  height: 14 }   // pinchos al borde de la meta
    ]
  },

  /* ------------------------------------------------------------
     NIVEL 6 — Salto de fe
     Nueva habilidad: la precisión aérea sin red. Cero piso: una
     cadena de plataformas flotantes (40-52 px) sobre un mar de
     pinchos. La cadena exige despegar a VELOCIDAD SATURRADA (con
     la carrera completa): un salto flojo cae corto en el mar. p3
     es el único descanso (85 px). El final es el contrasalto:
     desde p4, saltar en diagonal hacia ARRIBA-IZQUIERDA a p5
     (subida 110) y de ahí a la meta en lo alto.
     ------------------------------------------------------------ */
  {
    id: "level6",
    name: "Salto de fe",
    hint: "Abajo no hay suelo, solo pinchos",
    spawn: { x: 30, y: 370 },
    goal: { x: 740, y: 30, width: 40, height: 60 },
    platforms: [
      { x: 0,   y: 400, width: 120, height: 20 }, // repisa de salida
      { x: 285, y: 380, width: 50,  height: 16 }, // p1 — caída 20, hueco 165: a fondo
      { x: 455, y: 350, width: 45,  height: 16 }, // p2 — subida 30, hueco 120
      { x: 570, y: 315, width: 85,  height: 16 }, // p3 — descanso (única ancha)
      { x: 715, y: 260, width: 45,  height: 16 }, // p4 — subida 55
      { x: 600, y: 150, width: 40,  height: 16 }, // p5 — contrasalto arriba-izquierda (subida 110)
      { x: 700, y: 90,  width: 100, height: 20 }  // plataforma de la meta
    ],
    hazards: [
      { x: 120, y: 440, width: 680, height: 10 }  // el mar de pinchos
    ]
  },

  /* ------------------------------------------------------------
     NIVEL 7 — Doble filo
     Dos rutas, como en el nivel 3, pero ambas exigen:
     · SEGURA (arriba): escalera u1→u5 con plataformas de 40-48
       px; sin hazards propios, pero cada salto pide puntería.
     · RÁPIDA (abajo): l1→l2→l3 flotando sobre el foso, con dos
       saltos casi al límite (huecos de 150 y 165 px: solo
       cuadran a ~toda velocidad). Ahorra ~1,5 s y el corazón.
     La horquilla está en el suelo de salida: salto bajo y
     plano → l1; salto alto (subida 110) → u1.
     ------------------------------------------------------------ */
  {
    id: "level7",
    name: "Doble filo",
    hint: "Dos rutas: la rápida muerde",
    spawn: { x: 30, y: 380 },
    goal: { x: 740, y: 290, width: 40, height: 60 },
    platforms: [
      { x: 0,   y: 410, width: 130, height: 20 }, // suelo de salida (la horquilla)
      { x: 200, y: 300, width: 44,  height: 16 }, // u1 — ruta segura (subida 110)
      { x: 280, y: 185, width: 48,  height: 16 }, // u2 — (subida 115)
      { x: 410, y: 150, width: 40,  height: 16 }, // u3 — (subida 35)
      { x: 545, y: 190, width: 40,  height: 16 }, // u4 — descenso
      { x: 655, y: 280, width: 40,  height: 16 }, // u5 — última bajada
      { x: 230, y: 410, width: 36,  height: 16 }, // l1 — atajo: entrada
      { x: 416, y: 390, width: 32,  height: 16 }, // l2 — hueco de 150 px desde l1
      { x: 613, y: 390, width: 36,  height: 16 }, // l3 — hueco de 165 px desde l2
      { x: 690, y: 350, width: 110, height: 20 }  // plataforma de la meta
    ],
    hazards: [
      { x: 130, y: 440, width: 560, height: 10 }  // foso bajo ambas rutas
    ]
  },

  /* ------------------------------------------------------------
     NIVEL 8 — Piso espinado
     Nueva habilidad: leer dónde aterrizar ANTES de saltar. Cada
     plataforma de la escalera tiene pinchos ENCIMA en un borde:
     hay que caer en la zona sana (50-80 px) y frenar ahí. El
     punto crítico es s2→s3: despegar desde el borde de s2 y caer
     pasado los pinchos izquierdos de s3 (que tiene pinchos a
     ambos lados: solo el centro es seguro). El final salta los
     pinchos propios de s4 y cae 80 px sobre la plataforma de meta.
     ------------------------------------------------------------ */
  {
    id: "level8",
    name: "Piso espinado",
    hint: "Aterrizá donde no brilla el rojo",
    spawn: { x: 30, y: 370 },
    goal: { x: 745, y: 270, width: 40, height: 60 },
    platforms: [
      { x: 0,   y: 400, width: 110, height: 20 }, // suelo de salida
      { x: 170, y: 370, width: 110, height: 16 }, // s1 — pinchos a la izquierda
      { x: 310, y: 330, width: 120, height: 16 }, // s2 — pinchos a la derecha
      { x: 455, y: 290, width: 145, height: 16 }, // s3 — pinchos a AMBOS lados
      { x: 650, y: 250, width: 90,  height: 16 }, // s4 — pinchos a la derecha
      { x: 730, y: 330, width: 70,  height: 20 }  // plataforma de la meta (caída 80)
    ],
    hazards: [
      { x: 170, y: 356, width: 36, height: 14 },  // pinchos sobre s1 (izquierda)
      { x: 390, y: 316, width: 40, height: 14 },  // pinchos sobre s2 (derecha)
      { x: 455, y: 276, width: 35, height: 14 },  // pinchos sobre s3 (izquierda)
      { x: 565, y: 276, width: 35, height: 14 },  // pinchos sobre s3 (derecha)
      { x: 700, y: 236, width: 40, height: 14 },  // pinchos sobre s4 (derecha)
      { x: 110, y: 440, width: 690, height: 10 }  // foso
    ]
  },

  /* ------------------------------------------------------------
     NIVEL 9 — Al límite
     La cima de la precisión: plataformas de 26-36 px y huecos al
     borde de lo posible. La cadena q1→q2→q3 exige tres saltos
     seguidos a velocidad máxima (huecos de 156/179/184 px); no
     hay atajo: desde q2 no se alcanza q4 ni por asomo. El giro
     final (subida 100 al borde derecho del canvas) y el
     contrasalto casi a fondo hacia q5 completan el examen. Este
     nivel no perdona el apuro, perdona el pulso.
     ------------------------------------------------------------ */
  {
    id: "level9",
    name: "Al límite",
    hint: "Distancias al borde de lo posible",
    spawn: { x: 25, y: 370 },
    goal: { x: 420, y: 30, width: 40, height: 60 },
    platforms: [
      { x: 0,   y: 400, width: 100, height: 20 }, // suelo de salida
      { x: 240, y: 390, width: 36,  height: 16 }, // q1 — calentamiento (hueco 156, a fondo)
      { x: 455, y: 375, width: 26,  height: 16 }, // q2 — encadenado (hueco 179, a fondo)
      { x: 665, y: 360, width: 26,  height: 16 }, // q3 — encadenado (hueco 184, al límite)
      { x: 740, y: 260, width: 26,  height: 16 }, // q4 — el giro: subida 100 desde el final de la cadena
      { x: 600, y: 160, width: 28,  height: 16 }, // q5 — contrasalto a fondo arriba-izquierda (subida 100)
      { x: 380, y: 90,  width: 120, height: 20 }  // plataforma de la meta
    ],
    hazards: [
      { x: 100, y: 440, width: 700, height: 10 }  // todo el fondo es pinchos
    ]
  },

  /* ------------------------------------------------------------
     NIVEL 10 — La última puerta
     El examen final: tres actos, una sola vida por intento.
     · Acto 1 (ritmo): tres campos de pinchos con bolsillos de
       66 px, igual que el nivel 5 pero más exigentes.
     · Acto 2 (aterrizaje quirúrgico): c1 y c2 con pinchos
       encima; subir leyendo las zonas sanas.
     · Acto 3 (gauntlet aéreo): c3 → t1 → t2 → t3, saltos en
       diagonal hacia arriba-izquierda entre plataformas chicas,
       y la meta en el rincón superior izquierdo.
     ------------------------------------------------------------ */
  {
    id: "level10",
    name: "La última puerta",
    hint: "Todo lo aprendido, junto y sin red",
    spawn: { x: 25, y: 380 },
    goal: { x: 210, y: 50, width: 40, height: 60 },
    platforms: [
      { x: 0,   y: 410, width: 540, height: 20 }, // piso del acto 1
      { x: 560, y: 390, width: 80,  height: 16 }, // c1 — pinchos a la derecha
      { x: 700, y: 330, width: 75,  height: 16 }, // c2 — pinchos a la izquierda
      { x: 600, y: 260, width: 45,  height: 16 }, // c3 — giro a la izquierda
      { x: 710, y: 160, width: 34,  height: 16 }, // t1 — gauntlet: subida 100
      { x: 560, y: 150, width: 32,  height: 16 }, // t2 — salto 118 a la izquierda
      { x: 420, y: 150, width: 32,  height: 16 }, // t3 — salto 108 a la izquierda
      { x: 160, y: 110, width: 120, height: 20 }  // plataforma de la meta
    ],
    hazards: [
      { x: 120, y: 396, width: 60, height: 14 },  // campo 1 (bolsillo de 66)
      { x: 270, y: 396, width: 60, height: 14 },  // campo 2 (bolsillo de 66)
      { x: 420, y: 396, width: 60, height: 14 },  // campo 3 + foso (bolsillo de 60)
      { x: 540, y: 440, width: 260, height: 10 }, // foso bajo los actos 2 y 3
      { x: 620, y: 376, width: 20, height: 14 },  // pinchos sobre c1 (derecha)
      { x: 700, y: 316, width: 20, height: 14 }   // pinchos sobre c2 (izquierda)
    ]
  }
];
