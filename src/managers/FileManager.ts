// mnbgv xdxdxd jajajaj hahahahha xd

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class FileManager {
    private fileWatchers: Map<string, fs.FSWatcher> = new Map();
    private mergedFilePaths: Map<string, string> = new Map(); // Para trackear archivos merge

    async mergeFiles(files: string[], outputPath?: string): Promise<string> {
        try {
            // Filtrar solo archivos (no directorios) y verificar su existencia
            const validFiles = await this.filterValidFiles(files);

            if (validFiles.length === 0) {
                vscode.window.showWarningMessage('No valid files selected for merging');
                return '';
            }

            const mergedContent = await this.generateMergedContent(validFiles);
            const finalOutputPath = outputPath || this.getOutputPath();

            await fs.promises.writeFile(finalOutputPath, mergedContent, 'utf8');

            vscode.window.showInformationMessage('Files merged successfully!');

            // Abrir el archivo fusionado
            const document = await vscode.workspace.openTextDocument(finalOutputPath);
            await vscode.window.showTextDocument(document);

            return finalOutputPath;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Error merging files: ${errorMessage}`);
            return '';
        }
    }

    async startWatching(selectionName: string, files: string[]): Promise<void> {
        try {
            // Filtrar solo archivos válidos
            const validFiles = await this.filterValidFiles(files);

            if (validFiles.length === 0) {
                vscode.window.showWarningMessage('No valid files to watch');
                return;
            }

            // Detener watchers existentes para esta selección
            this.stopWatching(selectionName);

            // Verificar si existe un archivo merge previo o crear uno nuevo
            let outputPath = this.mergedFilePaths.get(selectionName);
            if (!outputPath || !fs.existsSync(outputPath)) {
                outputPath = this.getMergeFilePath(selectionName);
                const mergedContent = await this.generateMergedContent(validFiles);
                await fs.promises.writeFile(outputPath, mergedContent, 'utf8');

                // Abrir el archivo fusionado
                const document = await vscode.workspace.openTextDocument(outputPath);
                await vscode.window.showTextDocument(document);
            }

            this.mergedFilePaths.set(selectionName, outputPath);

            // Crear nuevos watchers solo para archivos válidos
            validFiles.forEach(file => {
                const watcher = fs.watch(file, async () => {
                    try {
                        const mergedContent = await this.generateMergedContent(validFiles);
                        await fs.promises.writeFile(outputPath!, mergedContent, 'utf8');
                        vscode.window.showInformationMessage(`Merged file for "${selectionName}" updated`);
                    } catch (error) {
                        vscode.window.showErrorMessage(`Error updating merged file: ${error}`);
                    }
                });
                this.fileWatchers.set(`${selectionName}:${file}`, watcher);
            });

            vscode.window.showInformationMessage(`Started watching ${validFiles.length} files for "${selectionName}"`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error setting up file watching: ${error}`);
        }
    }

    // Nuevo método para filtrar archivos válidos
    private async filterValidFiles(files: string[]): Promise<string[]> {
        const validFiles: string[] = [];

        for (const file of files) {
            try {
                const stats = await fs.promises.stat(file);
                if (stats.isFile()) {
                    validFiles.push(file);
                }
            } catch (error) {
                console.warn(`Could not access file ${file}:`, error);
            }
        }

        return validFiles;
    }

    stopWatching(selectionName: string): void {
        // Cerrar todos los watchers asociados a esta selección
        for (const [key, watcher] of this.fileWatchers.entries()) {
            if (key.startsWith(`${selectionName}:`)) {
                watcher.close();
                this.fileWatchers.delete(key);
            }
        }
    }

    private getOutputPath(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder open');
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return path.join(workspaceFolders[0].uri.fsPath, `merged_script_${timestamp}.txt`);
    }

    getMergeFilePath(selectionName: string): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder open');
        }
        return path.join(workspaceFolders[0].uri.fsPath, `${selectionName}_merged.txt`);
    }

    getMergedFilePath(selectionName: string): string | undefined {
        return this.mergedFilePaths.get(selectionName);
    }

    private async generateMergedContent(files: string[]): Promise<string> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder open');
        }
        const workspacePath = workspaceFolders[0].uri.fsPath;

        let content = '';
        for (const file of files) {
            try {
                const stats = await fs.promises.stat(file);
                if (stats.isFile()) {
                    const fileContent = await fs.promises.readFile(file, 'utf8');
                    const relativePath = path.relative(workspacePath, file);
                    content += `Ruta al script: ${relativePath}\n`;
                    content += `Nombre del script: ${path.basename(file)}\n`;
                    content += `Contenido del script:\n${fileContent}\n`;
                    content += '\n--------------------------------------------------\n\n';
                }
            } catch (error) {
                console.warn(`Error reading file ${file}:`, error);
            }
        }
        return content;
    }
}