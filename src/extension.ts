// The module "vscode" contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { Position, TextDocument, Uri } from "vscode";
import { promises as fs, readdirSync, lstatSync } from "fs";
import path = require("path");
import yaml = require("js-yaml");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    const Cookiecutter = vscode.commands.registerCommand("extension.cookiecutter", async (param) => {
        let openEditor;
        if (vscode.window.activeTextEditor.document.uri.scheme === "SEARCH_EDITOR_SCHEME") {
            vscode.window.showInformationMessage("You can't use cookiecutter in Search Editor");
            return;
        }
        if (param === undefined && vscode.window.activeTextEditor !== undefined) {
            if (vscode.window.activeTextEditor.document.uri.scheme === "file") {
                openEditor = path.dirname(vscode.window.activeTextEditor.document.uri.fsPath);
            }
        } else {
            openEditor = param.fsPath;
        }

        const isWin = process.platform === "win32";
        let term = vscode.window.activeTerminal;

        const ccConf = isWin === true ? path.join(process.env.USERPROFILE, ".cookiecutterrc") : path.join(process.env.HOME, ".cookiecutterrc");
        const cookieCuttersRC = await fs.readFile(ccConf, "utf8");
        const tmpDir = yaml.load(cookieCuttersRC).cookiecutters_dir;
        const re = /^~/g;
        const ccDir = tmpDir.replace(re, isWin === true ? process.env.USERPROFILE : process.env.HOME);
        const items = srcPath => {
            return readdirSync(srcPath).filter(file => lstatSync(path.join(srcPath, file)).isDirectory())
        }
        const template = ccDir => {
            return vscode.window.showQuickPick(items(ccDir), {
                placeHolder: "Choosing a template.",
                ignoreFocusOut: true,
            });
        };
        await template(ccDir).then(selection => {
            // the user canceled the selection
            if (selection === undefined || selection === "") {
                return;
            }
            let termProfile = "";

            try {
                termProfile = isWin === true ? vscode.workspace.getConfiguration("terminal").get("external.windowsExec") : vscode.workspace.getConfiguration("terminal").get("external.linuxExec");

                if (termProfile === undefined) {
                    vscode.window.showErrorMessage(`Config option terminal.external.${isWin === true ? "windowsExec" : "linuxExec"} is not defined.`);
                    return;
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Config option terminal.external.${isWin === true ? "windowsExec" : "linuxExec"} is not defined.`);
                return;
            }

            // the user selected some item. You could use `selection.name` too
            const command = `cookiecutter -o ${openEditor} ${selection}`;

            if (vscode.window.terminals.length < 1) {

                term = vscode.window.createTerminal(termProfile);
            } else {
                term = vscode.window.activeTerminal;
            } 1
            term.show();
            term.sendText(command);
        });

    });
    context.subscriptions.push(Cookiecutter);

}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;


