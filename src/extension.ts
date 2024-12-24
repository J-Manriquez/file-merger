import * as vscode from 'vscode';
import { FileExplorerProvider, FileTreeItem } from './providers/FileExplorerProvider';
import { SelectionStorage, StoredSelection } from './storage/SelectionStorage';
import { FileManager } from './managers/FileManager';

export function activate(context: vscode.ExtensionContext) {
    const storage = new SelectionStorage(context);
    const fileManager = new FileManager();
    const fileExplorerProvider = new FileExplorerProvider();

    // Registrar proveedores de vista
    const treeView = vscode.window.createTreeView('newSelection', {
        treeDataProvider: fileExplorerProvider,
        showCollapseAll: true,
        canSelectMany: true
    });

    // Registrar el proveedor para selecciones guardadas
    vscode.window.registerTreeDataProvider(
        'savedSelections',
        storage.getSavedSelectionsProvider()
    );

    // Registrar el proveedor para selecciones activas
    vscode.window.registerTreeDataProvider(
        'activeSelections',
        storage.getActiveSelectionsProvider()
    );

    // Registrar comandos
    context.subscriptions.push(
        vscode.commands.registerCommand('fileMerger.refresh', () => {
            fileExplorerProvider.refresh();
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

        vscode.commands.registerCommand('fileMerger.useSelection', (selection: StoredSelection) => {
            fileManager.mergeFiles(selection.files);
        }),

        vscode.commands.registerCommand('fileMerger.editSelection', async (selection: StoredSelection) => {
            // Crear una nueva vista temporal para selección
            const tempProvider = new FileExplorerProvider();
            const tempTreeView = vscode.window.createTreeView('tempSelection', {
                treeDataProvider: tempProvider,
                showCollapseAll: true,
                canSelectMany: true
            });

            // Pre-seleccionar los archivos existentes
            selection.files.forEach(file => {
                tempProvider.toggleSelection(new FileTreeItem(
                    vscode.Uri.file(file),
                    vscode.FileType.File,
                    true
                ));
            });

            // Mostrar diálogo de confirmación
            const result = await vscode.window.showInformationMessage(
                'Select files and click Save when done',
                'Save',
                'Cancel'
            );

            if (result === 'Save') {
                const newFiles = tempProvider.getSelectedFiles();
                storage.updateSelection(selection.name, newFiles);
                vscode.window.showInformationMessage(`Selection "${selection.name}" updated`);
            }

            tempTreeView.dispose();
        }),

        vscode.commands.registerCommand('fileMerger.generateMergeFromSaved', (selection: StoredSelection) => {
            if (selection.files.length > 0) {
                fileManager.mergeFiles(selection.files);
            } else {
                vscode.window.showWarningMessage('No files in this selection');
            }
        }),

        vscode.commands.registerCommand('fileMerger.deleteSelection', (selection: StoredSelection) => {
            storage.deleteSelection(selection.name);
            vscode.window.showInformationMessage(`Selection "${selection.name}" deleted`);
        }),

        vscode.commands.registerCommand('fileMerger.toggleActive', (selection: StoredSelection) => {
            storage.toggleSelectionActive(selection.name);
            if (selection.isActive) {
                const outputPath = selection.name + '_merged.txt';
                fileManager.startWatching(selection.files, outputPath);
            } else {
                fileManager.stopWatching(selection.files);
            }
        })
    );

    // Manejar eventos de checkbox
    treeView.onDidChangeCheckboxState(async (e) => {
        for (const [item] of e.items) {
            await fileExplorerProvider.toggleSelection(item as FileTreeItem);
        }
    });
}

export function deactivate() {
    // Limpiar recursos al desactivar la extensión
}