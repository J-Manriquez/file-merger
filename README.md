# File Merger for VS Code

Una extensión para Visual Studio Code que permite fusionar múltiples archivos en un solo script con un formato personalizado.

## Características

- ✨ Selección múltiple de archivos y carpetas
- 📁 Fusión automática de archivos en un solo script
- 💾 Guardado de selecciones para uso futuro
- 🔄 Vigilancia automática de cambios en archivos seleccionados
- 📋 Formato personalizado para el archivo fusionado

## Requisitos

- Visual Studio Code 1.85.0 o superior

## Instalación

1. Abre Visual Studio Code
2. Presiona `Ctrl+Shift+X` (Windows/Linux) o `Cmd+Shift+X` (macOS)
3. Busca "File Merger"
4. Haz clic en Instalar

## Uso

1. **Crear una nueva selección**
   - Haz clic en el icono de File Merger en la barra de actividad
   - Selecciona "Nueva Selección"
   - Elige los archivos o carpetas que deseas fusionar

2. **Guardar una selección**
   - Después de crear una selección, haz clic en "Guardar Selección"
   - Asigna un nombre a tu selección
   - La selección quedará guardada para uso futuro

3. **Usar una selección guardada**
   - Ve a la sección "Selecciones Guardadas"
   - Haz clic en la selección que deseas usar
   - Los archivos se fusionarán automáticamente

4. **Activar vigilancia de cambios**
   - Selecciona una selección guardada
   - Activa la opción "Vigilar cambios"
   - Los cambios en los archivos originales actualizarán automáticamente el archivo fusionado

## Formato del archivo fusionado

Cada archivo en la fusión se presenta con el siguiente formato:

Ruta al script: [ruta/al/script]
Nombre del script: [nombre_del_script]
Contenido del script:
[contenido_del_script]


## Configuración

Esta extensión contribuye con las siguientes configuraciones:

* `fileMerger.autoUpdate`: habilita/deshabilita la actualización automática de archivos fusionados
* `fileMerger.outputFormat`: personaliza el formato de salida del archivo fusionado

## Comandos

Esta extensión proporciona los siguientes comandos:

* `fileMerger.newSelection`: Crear una nueva selección
* `fileMerger.saveSelection`: Guardar la selección actual
* `fileMerger.mergeFiles`: Fusionar archivos seleccionados

## Solución de problemas

### Los archivos no se actualizan automáticamente
- Verifica que la opción de vigilancia esté activada
- Asegúrate de que los archivos originales no hayan sido movidos o eliminados

### Error al fusionar archivos
- Verifica que tienes permisos de escritura en la carpeta de destino
- Asegúrate de que los archivos seleccionados existen y son accesibles

## Contribuir

¡Las contribuciones son bienvenidas!

## Registro de cambios

Ver 

## Licencia

Esta extensión está licenciada bajo la [MIT License].

---

**¡Disfruta usando File Merger!** 🚀