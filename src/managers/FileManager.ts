import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class FileManager {
    private fileWatchers: Map<string, fs.FSWatcher> = new Map();

    async mergeFiles(files: string[]): Promise<void> {
        try {
            // Filtrar solo archivos (no directorios)
            const fileStats = await Promise.all(
                files.map(async file => ({
                    path: file,
                    isDirectory: (await fs.promises.stat(file)).isDirectory()
                }))
            );
            const validFiles = fileStats
                .filter(stat => !stat.isDirectory)
                .map(stat => stat.path);

            if (validFiles.length === 0) {
                vscode.window.showWarningMessage('No valid files selected for merging');
                return;
            }

            const mergedContent = await this.generateMergedContent(validFiles);
            const outputPath = this.getOutputPath();

            await fs.promises.writeFile(outputPath, mergedContent, 'utf8');
            this.startWatching(validFiles, outputPath);

            vscode.window.showInformationMessage('Files merged successfully!');

            // Abrir el archivo fusionado
            const document = await vscode.workspace.openTextDocument(outputPath);
            await vscode.window.showTextDocument(document);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Error merging files: ${errorMessage}`);
        }
    }

    startWatching(files: string[], outputPath: string): void {
        // Limpiar watchers anteriores
        this.stopAllWatchers();

        // Crear nuevos watchers
        files.forEach(file => {
            const watcher = fs.watch(file, async () => {
                try {
                    const mergedContent = await this.generateMergedContent(files);
                    await fs.promises.writeFile(outputPath, mergedContent, 'utf8');
                    vscode.window.showInformationMessage('Merged file updated');
                } catch (error) {
                    vscode.window.showErrorMessage(`Error updating merged file: ${error}`);
                }
            });
            this.fileWatchers.set(file, watcher);
        });
    }

    private getOutputPath(): string {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder open');
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return path.join(workspaceFolders[0].uri.fsPath, `merged_script_${timestamp}.txt`);
    }

    private async generateMergedContent(files: string[]): Promise<string> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            throw new Error('No workspace folder open');
        }
        const workspacePath = workspaceFolders[0].uri.fsPath;

        let content = '';
        for (const file of files) {
            const fileContent = await fs.promises.readFile(file, 'utf8');
            // Convertir a ruta relativa
            const relativePath = path.relative(workspacePath, file);
            content += `Ruta al script: ${relativePath}\n`;
            content += `Nombre del script: ${path.basename(file)}\n`;
            content += `Contenido del script:\n${fileContent}\n`;
            content += '\n--------------------------------------------------\n\n';
        }
        return content;
    }

    private stopAllWatchers(): void {
        this.fileWatchers.forEach(watcher => watcher.close());
        this.fileWatchers.clear();
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