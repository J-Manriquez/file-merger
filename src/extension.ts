import * as vscode from 'vscode';
import { FileExplorerProvider, FileTreeItem } from './providers/FileExplorerProvider';
import { SelectionStorage, StoredSelection, SelectionItem } from './storage/SelectionStorage';
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
    const savedSelectionsProvider = storage.getSavedSelectionsProvider();
    vscode.window.registerTreeDataProvider('savedSelections', savedSelectionsProvider);

    // Registrar el proveedor para selecciones activas
    vscode.window.registerTreeDataProvider(
        'activeSelections',
        storage.getActiveSelectionsProvider()
    );

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

        vscode.commands.registerCommand('fileMerger.generateMergeFromSaved', (item: SelectionItem) => {
            if (item && item.selection && item.selection.files.length > 0) {
                fileManager.mergeFiles(item.selection.files);
            } else {
                vscode.window.showWarningMessage('No files in this selection');
            }
        }),

        vscode.commands.registerCommand('fileMerger.toggleActive', (item: SelectionItem) => {
            if (item && item.selection) {
                storage.toggleSelectionActive(item.selection.name);
                if (item.selection.isActive) {
                    const outputPath = item.selection.name + '_merged.txt';
                    fileManager.startWatching(item.selection.files, outputPath);
                    vscode.window.showInformationMessage(`Selection "${item.selection.name}" is now active`);
                } else {
                    fileManager.stopWatching(item.selection.files);
                    vscode.window.showInformationMessage(`Selection "${item.selection.name}" is now inactive`);
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
        vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer');
    });
}

export function deactivate() {
    // Limpiar recursos al desactivar la extensión
}