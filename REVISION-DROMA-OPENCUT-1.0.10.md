# Revisión DRÖMA Video Editor 1.0.10 y base OpenCut

20 de octubre de 2026. Trabajo local sin IA ni procesamiento de medios en la nube.

## Cambios del editor DRÖMA actual

| Área | Resultado |
| --- | --- |
| Biblioteca | Marca ✓ Añadido y número de usos; derivado de los clips reales. Se actualiza al añadir, duplicar, dividir, borrar, deshacer y recuperar un proyecto. |
| Fundidos y transiciones | Se reservan fotogramas reales para ambos vídeos. No se rellenan los intervalos sin material con una imagen congelada. |
| Duración | Si el recorte no deja material suficiente, se ajustan sus extremos y se cierra el intervalo en esa pista. Puede reducirse la duración del montaje. Las pistas independientes y los marcadores no se desplazan. Deshacer recupera el estado anterior; eliminar la transición conserva los recortes. |
| Reproducción | Precarga en el primer fotograma del fundido. Evita búsquedas repetidas y múltiples solicitudes play() mientras una anterior sigue pendiente. |
| Audio separado | Cuando conserva los mismos tiempos y origen del vídeo, sus recortes y el fundido de audio permanecen sincronizados. |
| Filtros | Siete estilos más Original; intensidad de 0 a 100 %, activación/desactivación e intensidad animable. |
| Fotogramas clave | Transformación, color, desenfoque, intensidad del filtro, volumen, balance y parámetros de audio. Curvas lineal, acelerar, desacelerar y suave; se conserva la curva al dividir o recortar. |
| Máscaras | Círculo y rectángulo redondeado se combinan con los cuatro recortes. |
| Desenfoque | Su intensidad visual se mantiene proporcional a la resolución del render. |
| Audio | Intensidad con señal seca/procesada; cortes ajustables en Teléfono; ganancia de Presencia; umbral, relación, ataque y relajación del Compresor. Sin efecto utiliza la señal directa. |

## Verificación realizada

109 pruebas automatizadas de escritorio y 102 de web, sin fallos. Incluyen avance de ambos vídeos en cada fotograma del fundido a velocidades 0,25×, 1× y 4×, reserva de material, precarga, ausencia de búsquedas repetidas, cancelación de reproducción pendiente, sincronización de audio separado y conservación de curvas.

30 comprobaciones con render raster real de Skia: siete filtros, seis ajustes, dos combinaciones de máscara y recorte, cinco modos de fusión, cinco animaciones y cinco transiciones. También se comprueban la neutralidad a intensidad cero y la desactivación de filtros. El croma y los parámetros del audio tienen pruebas adicionales del procesamiento y de las conexiones/control de sus nodos.

Esto verifica código y composición raster, no sustituye una sesión de edición completa en navegador con archivos y códecs reales. La escucha de audio, fluidez en cada equipo, interacción de ratón y exportación prolongada necesitan QA manual. No se dispone de un navegador de pruebas controlable en esta sesión.

## Adaptación real de OpenCut

Se ha preparado una aplicación web derivada del código público de OpenCut Classic, revisión cf5e79e919144200294fb9fed22a222592a0aeea, bajo licencia MIT. Usa sus componentes de edición y el motor Rust/WASM publicado opencut-wasm 0.2.10. Se conserva la autoría y licencia original.

La adaptación está compilada para alojamiento estático, tiene identidad DRÖMA, portada original, manual, proyectos nuevos vacíos, indicador de medios usados y retirada de la biblioteca conservando las fuentes. Se han retirado de la interfaz las herramientas de IA y los catálogos que necesitan servicios remotos. No incluye telemetría ni el envío de feedback del sitio original.

Se ha comprobado la inicialización del módulo WASM, cinco conversiones exactas entre tiempo y segundos y la correspondencia entre fotogramas y tiempo. La compilación incluye el núcleo y los recursos locales. La prueba manual de la interfaz y exportación de la adaptación sigue pendiente. Se entrega como base de desarrollo accesible por opencut/index.html; no reemplaza automáticamente los proyectos actuales.

## Diferencias que continúan abiertas

| Objetivo | Situación real |
| --- | --- |
| Transiciones en la nueva base | El panel de OpenCut Classic de origen sigue pendiente. Las transiciones corregidas están en el editor DRÖMA actual y aún deben migrarse. |
| Proyectos anteriores | Los .droma siguen abriéndose en el editor actual. El formato de OpenCut es distinto; falta el importador. |
| Escritorio con motor OpenCut | Los instaladores 1.0.10 actualizan el editor actual. La nueva base OpenCut todavía no sustituye su motor. |
| Interfaz completamente en español | El editor actual está en español; la base OpenCut conserva textos heredados en inglés. |
| Catálogo completo de CapCut | No se ha reproducido ni verificado todo el catálogo. Sus efectos y recursos propietarios no forman parte de OpenCut ni de esta entrega. |
| Herramientas convencionales avanzadas | Siguen pendientes curvas de velocidad, inversión con audio, estabilización, LUT 3D y otras máscaras/efectos avanzados. |

La entrega avanza hacia la equivalencia funcional solicitada. No se presenta como clon completo ni como producto con todas las prestaciones de CapCut comprobadas.

## Fuentes contrastadas

- Proyecto OpenCut y estado de su reescritura: https://github.com/OpenCut-app/OpenCut
- Código Classic y arquitectura original: https://github.com/OpenCut-app/opencut-classic
- Licencia: https://github.com/OpenCut-app/opencut-classic/blob/main/LICENSE
- Controles y tipos de fotogramas clave documentados por CapCut: https://www.capcut.com/resource/how-to-add-keyframes-in-capcut

El informe se apoya además en la revisión del código de los paneles, efectos, reproducción y almacenamiento de la copia descargada de OpenCut Classic.
