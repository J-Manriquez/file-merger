// src/managers/FileManager.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class FileManager {
    private fileWatchers: Map<string, fs.FSWatcher> = new Map();

    async mergeSelectedFiles(): Promise<void> {
        const files = Array.from(this.fileWatchers.keys());
        if (files.length > 0) {
            await this.mergeFiles(files);
        } else {
            vscode.window.showWarningMessage('No files selected to merge');
        }
    }

    // Añadir el método getOutputPath
    private getOutputPath(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder open');
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        return path.join(rootPath, 'merged_script.txt');
    }

    async mergeFiles(files: string[]): Promise<void> {
        try {
            const mergedContent = await this.generateMergedContent(files);
            const outputPath = this.getOutputPath();

            await fs.promises.writeFile(outputPath, mergedContent, 'utf8');
            this.watchFiles(files, outputPath);

            vscode.window.showInformationMessage('Files merged successfully!');
        } catch (error: unknown) {
            // Corregir el manejo del error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Error merging files: ${errorMessage}`);
        }
    }

    private async generateMergedContent(files: string[]): Promise<string> {
        let content = '';

        for (const file of files) {
            const fileContent = await fs.promises.readFile(file, 'utf8');
            content += `Ruta al script: ${file}\n`;
            content += `Nombre del script: ${path.basename(file)}\n`;
            content += `Contenido del script:\n${fileContent}\n`;
            content += '\n--------------------------------------------------\n\n';
        }

        return content;
    }

    private watchFiles(files: string[], outputPath: string): void {
        files.forEach(file => {
            const watcher = fs.watch(file, () => {
                this.mergeFiles(files); // Actualizar cuando hay cambios
            });
            this.fileWatchers.set(file, watcher);
        });
    }

    stopWatching(files: string[]): void {
        files.forEach(file => {
            const watcher = this.fileWatchers.get(file);
            if (watcher) {
                watcher.close();
                this.fileWatchers.delete(file);
            }
        });
    }
}
