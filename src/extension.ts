import * as vscode from 'vscode';
import { FileExplorerProvider, FileTreeItem } from './providers/FileExplorerProvider';
import { SelectionStorage, StoredSelection, SelectionItem } from './storage/SelectionStorage';
import { FileManager } from './managers/FileManager';
import path = require('path');
import * as fs from 'fs';


export function activate(context: vscode.ExtensionContext) {
    const fileManager = new FileManager();
    const storage = new SelectionStorage(context, fileManager);
    const fileExplorerProvider = new FileExplorerProvider();

    // Registrar proveedores de vista
    const treeView = vscode.window.createTreeView('newSelection', {
        treeDataProvider: fileExplorerProvider,
        showCollapseAll: true,
        canSelectMany: true
    });

    // Registrar el proveedor para selecciones guardadas
    const savedSelectionsProvider = storage.getSavedSelectionsProvider();
    vscode.window.registerTreeDataProvider('savedSelections', savedSelectionsProvider);

    // Registrar comandos
    context.subscriptions.push(
        vscode.commands.registerCommand('fileMerger.refresh', () => {
            fileExplorerProvider.refresh();
            // Forzar actualización de la vista de selecciones guardadas
            storage.refresh();
        }),

        vscode.commands.registerCommand('fileMerger.toggleSelection', async (item: FileTreeItem) => {
            await fileExplorerProvider.toggleSelection(item);
        }),

        vscode.commands.registerCommand('fileMerger.saveSelection', async () => {
            const name = await vscode.window.showInputBox({
                prompt: 'Enter a name for this selection'
            });
            if (name) {
                const selectedFiles = fileExplorerProvider.getSelectedFiles();
                if (selectedFiles.length > 0) {
                    storage.saveSelection(name, selectedFiles);
                    vscode.window.showInformationMessage(`Selection "${name}" saved successfully`);
                } else {
                    vscode.window.showWarningMessage('No files selected to save');
                }
            }
        }),

        vscode.commands.registerCommand('fileMerger.mergeFiles', () => {
            const selectedFiles = fileExplorerProvider.getSelectedFiles();
            if (selectedFiles.length > 0) {
                fileManager.mergeFiles(selectedFiles);
            } else {
                vscode.window.showWarningMessage('No files selected to merge');
            }
        }),

        vscode.commands.registerCommand('fileMerger.openMergedFile', (item: SelectionItem) => {
            if (item && item.selection) {
                const mergedFilePath = fileManager.getMergedFilePath(item.selection.name);
                if (mergedFilePath && fs.existsSync(mergedFilePath)) {
                    vscode.workspace.openTextDocument(mergedFilePath)
                        .then(doc => vscode.window.showTextDocument(doc))
                        .then(undefined, error => { // Corregir el manejo de errores
                            vscode.window.showErrorMessage(`Error opening merged file: ${error}`);
                        });
                } else {
                    vscode.window.showWarningMessage('Merged file not found. Try activating the selection first.');
                }
            }
        }),

        vscode.commands.registerCommand('fileMerger.generateMergeFromSaved', (item: SelectionItem) => {
            if (item && item.selection && item.selection.files.length > 0) {
                fileManager.mergeFiles(item.selection.files);
            } else {
                vscode.window.showWarningMessage('No files in this selection');
            }
        }),

        vscode.commands.registerCommand('fileMerger.deleteSelection', async (item: SelectionItem) => {
            if (item && item.selection) {
                const answer = await vscode.window.showWarningMessage(
                    `Are you sure you want to delete "${item.selection.name}"?`,
                    'Yes',
                    'No'
                );
                if (answer === 'Yes') {
                    storage.deleteSelection(item.selection.name);
                    vscode.window.showInformationMessage(`Selection "${item.selection.name}" deleted`);
                }
            }
        }),

        vscode.commands.registerCommand('fileMerger.editSelection', async (item: SelectionItem) => {
            if (item && item.selection) {
                // Limpiar selección actual
                fileExplorerProvider.refresh();

                // Pre-seleccionar los archivos de la selección guardada
                for (const file of item.selection.files) {
                    const uri = vscode.Uri.file(file);
                    const fileItem = new FileTreeItem(
                        uri,
                        vscode.FileType.File,
                        true
                    );
                    await fileExplorerProvider.toggleSelection(fileItem);
                }

                // Cambiar a la vista de nueva selección
                await vscode.commands.executeCommand('workbench.view.extension.file-merger-explorer');
                await vscode.commands.executeCommand('newSelection.focus');

                // Mostrar mensaje informativo
                vscode.window.showInformationMessage(
                    `Editing "${item.selection.name}". Make your changes and save as a new selection.`
                );
            }
        }),

        vscode.commands.registerCommand('fileMerger.toggleActive', (item: SelectionItem) => {
            if (item && item.selection) {
                storage.toggleSelectionActive(item.selection.name);
                if (!item.selection.isActive) {
                    fileManager.stopWatching(item.selection.name); // Usar el nombre en lugar del array
                }
            }
        })
    );


    // Manejar eventos de checkbox
    treeView.onDidChangeCheckboxState(async (e) => {
        for (const [item] of e.items) {
            await fileExplorerProvider.toggleSelection(item as FileTreeItem);
        }
    });

    // Suscribirse a cambios en las selecciones
    storage.onDidChangeSelections(() => {
        // vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
    });
}

export function deactivate() {
    // Limpiar recursos al desactivar la extensión
}