# Guía de Commits - Benko Tour

Este proyecto ya tiene avances importantes. Desde ahora usaremos mensajes claros para que GitHub muestre exactamente qué se hizo.

## Formato recomendado

```text
tipo(area): cambio principal
```

## Tipos sugeridos

- `feat`: nueva funcionalidad
- `fix`: corrección de error
- `style`: ajustes visuales (sin cambiar lógica)
- `refactor`: mejora interna de código
- `docs`: documentación
- `chore`: tareas de mantenimiento

## Áreas sugeridas

- `home`
- `reservas`
- `tienda`
- `catalogo`
- `moda`
- `musica`
- `gastronomia`
- `otros`
- `auth`
- `firebase`
- `ui`

## Ejemplos reales para este proyecto

- `feat(catalogo): agregar carrito lateral plegable en moda, musica, gastronomia y otros`
- `fix(moda): detectar imagenes con extension .jpg.png en tarjetas`
- `style(home): simplificar hero y mejorar seccion de valoraciones`
- `feat(firebase): guardar reservas en solicitudes_reserva con esquema validado`
- `docs(proyecto): actualizar flujo de assets e imagenes de catalogo`

## Regla practica

Si el commit toca mas de una pagina, usa `catalogo` o `ui` como area.
Si solo toca una pagina puntual, usa esa area (`moda`, `reservas`, etc.).
