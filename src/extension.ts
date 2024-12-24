// src/extension.ts
import * as vscode from 'vscode';
import { SelectionProvider } from './providers/SelectionProvider';
import { FileManager } from './managers/FileManager';
import { SelectionStorage } from './storage/SelectionStorage';

export function activate(context: vscode.ExtensionContext) {
    const storage = new SelectionStorage(context);
    const fileManager = new FileManager();
    const selectionProvider = new SelectionProvider(storage, fileManager);

    // Registrar proveedores de vista
    vscode.window.registerTreeDataProvider(
        'savedSelections',
        selectionProvider.getSavedSelectionsProvider()
    );

    vscode.window.registerTreeDataProvider(
        'activeSelections',
        selectionProvider.getActiveSelectionsProvider()
    );

    // Registrar comandos
    context.subscriptions.push(
        vscode.commands.registerCommand('fileMerger.newSelection', () => {
            selectionProvider.createNewSelection();
        }),

        vscode.commands.registerCommand('fileMerger.saveSelection', async () => {
            const name = await vscode.window.showInputBox({
                prompt: 'Enter a name for this selection'
            });
            if (name) {
                selectionProvider.saveCurrentSelection(name);
            }
        }),

        vscode.commands.registerCommand('fileMerger.mergeFiles', () => {
            fileManager.mergeSelectedFiles();
        })
    );
}