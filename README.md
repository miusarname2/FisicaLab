# FísicaLab

Simulador educativo e interactivo de física mecánica. Permite explorar el movimiento rectilíneo uniformemente variado (MRUV), el tiro parabólico y comprobar cálculos propios mediante simulaciones, gráficas y visualizaciones 2D/3D.

La aplicación está pensada como apoyo para clases y prácticas: modifica las condiciones iniciales, observa cómo cambian los resultados y contrasta las predicciones con el modelo matemático.

## Contenido

- [Qué puedes hacer](#qué-puedes-hacer)
- [Cómo empezar](#cómo-empezar)
- [Cómo usar la aplicación](#cómo-usar-la-aplicación)
- [Modelos físicos y supuestos](#modelos-físicos-y-supuestos)
- [Tecnologías](#tecnologías)
- [Estructura del proyecto](#estructura-del-proyecto)

## Qué puedes hacer

### 1. MRUV y dinámica

Configura la masa, la distancia, el tiempo total y la velocidad inicial de un móvil. La aplicación calcula y representa su posición, velocidad, aceleración, fuerza neta, energía cinética y trabajo. Puedes reproducir o pausar el movimiento, reiniciarlo, ajustar la velocidad de reproducción y explorar la escena en 2D o 3D.

Incluye perfiles de ejemplo, gráficas cinemáticas interactivas y una visualización de vectores. El modo Juego añade elementos de puntuación y celebración; el modo Laboratorio ofrece la experiencia sin ese enfoque arcade.

### 2. Tiro parabólico

Experimenta con la velocidad y el ángulo de lanzamiento, la altura inicial, la gravedad, la masa del proyectil y la posición de un objetivo. Elige entre proyectiles de ejemplo y entornos con distinta gravedad. La simulación presenta la trayectoria en 2D o 3D, gráficas, ecuaciones y resultados como el tiempo de vuelo, la altura máxima, el alcance, la velocidad final y la energía.

Al completar un lanzamiento, se informa si la trayectoria alcanza el objetivo y se calcula una puntuación de hasta 1000 puntos según la distancia al centro.

### 3. ¡Inténtalo tú mismo!

Selecciona un ejercicio de MRUV o de tiro parabólico, calcula primero tus respuestas y luego introdúcelas para compararlas con los valores del simulador. Hay problemas con datos aleatorios y una explicación de los resultados. La calificación otorga de cero a tres estrellas según la precisión promedio; se obtienen tres estrellas con al menos un 85 %.

## Cómo empezar

### Requisitos

- [Bun](https://bun.sh/) para instalar las dependencias usando el archivo de bloqueo incluido (`bun.lock`).
- Un navegador moderno con soporte para módulos ES, Canvas y WebGL para aprovechar las escenas 3D.

También puedes usar Node.js y npm en lugar de Bun.

### Instalación y ejecución

Desde la carpeta del proyecto, instala las dependencias y arranca el servidor de desarrollo:

```bash
bun install
bun run dev
```

Abre la dirección que Vite muestra en la terminal (por defecto, `http://localhost:3000`).

Con npm:

```bash
npm install
npm run dev
```

### Comprobaciones y compilación

```bash
bun run lint
bun run build
```

`lint` ejecuta la comprobación de TypeScript sin emitir archivos. `build` genera la versión de producción en `dist/`. Para servir esa compilación localmente:

```bash
bun run preview
```

No hace falta configurar una clave de Gemini ni un servicio externo para ejecutar las simulaciones: los cálculos físicos se realizan en el navegador.

## Cómo usar la aplicación

1. Elige uno de los tres escenarios desde la barra superior.
2. En MRUV o tiro parabólico, selecciona la vista 2D o 3D.
3. Cambia los parámetros con los controles y observa cómo se actualizan la simulación y los resultados.
4. En MRUV, inicia, pausa o reinicia el movimiento; también puedes inspeccionar las gráficas y los vectores.
5. En tiro parabólico, lanza el proyectil y compara su trayectoria con el objetivo. Consulta las gráficas, ecuaciones y resultados al terminar.
6. En ¡Inténtalo tú mismo!, resuelve primero el problema y luego usa la evaluación para contrastar tus respuestas.

## Modelos físicos y supuestos

- **MRUV:** aceleración constante. Para la distancia objetivo `d`, el tiempo total `T` y la velocidad inicial `v₀`, se calcula `a = 2(d - v₀T) / T²`; la posición y la velocidad siguen `x(t) = v₀t + ½at²` y `v(t) = v₀ + at`.
- **Dinámica y energía:** se usan `F = ma`, `Ec = ½mv²` y `W = Fx`.
- **Tiro parabólico:** movimiento horizontal uniforme y movimiento vertical con aceleración constante `-g`. Se descompone la velocidad inicial en sus componentes horizontal y vertical.
- **Alcance y objetivo:** el impacto se determina comparando el alcance calculado con la distancia al objetivo y su radio de tolerancia.
- **Simplificaciones:** no se simulan resistencia del aire ni otras fuerzas de arrastre. Por ello, cambiar la masa del proyectil modifica las magnitudes de energía, pero no su trayectoria ideal. La simulación no sustituye un experimento físico ni contempla todos los efectos de un sistema real.

## Tecnologías

- React y TypeScript para la interfaz y la lógica de la aplicación.
- Vite para el servidor de desarrollo y la compilación.
- Three.js y React Three Fiber para las escenas 3D.
- D3.js para las gráficas.
- Tailwind CSS para los estilos.

## Estructura del proyecto

```text
src/
├── App.tsx                 # Navegación y estado de los escenarios
├── components/             # Controles, simulaciones, gráficas y ventanas
├── types/                  # Tipos de parámetros y resultados físicos
└── utils/                  # Cálculos, audio y efectos visuales
```

Los modelos y cálculos principales están en `src/utils/physics.ts` (MRUV) y `src/utils/parabolic.ts` (tiro parabólico).

## Créditos

Proyecto académico de Física Mecánica, Universidad Cooperativa de Colombia (UCC). Autoría indicada en la aplicación: Oscar M Alvarez G.
