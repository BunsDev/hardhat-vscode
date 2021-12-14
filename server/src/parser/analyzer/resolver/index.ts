import { execSync } from "child_process";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import * as yaml from "js-yaml";

import * as utils from "@common/utils";
import { ImportDirective } from "@common/types";

const DAPP_FILENAME = ".dapprc";
const BROWNIE_FILENAME = "brownie-config";

export const BROWNIE_PACKAGE_PATH = path.resolve(os.homedir(), ".brownie", "packages");

const dappRemappingCache: { [path: string]: { [alias: string]: string } } = {};
const brownieRemappingCache: { [path: string]: { [alias: string]: string } } = {};

export function resolveDependency(cwd: string, stopAt: string, importDirective: ImportDirective): string {
    const paths = [cwd];

    let resolvedPath = resolveDappDependency(cwd, stopAt, importDirective.path, paths);
    if (resolvedPath) {
        importDirective.path = resolvedPath;
        return require.resolve(importDirective.path, { paths });
    }

    resolvedPath = resolveBrownieDependency(cwd, stopAt, importDirective.path, paths);
    if (resolvedPath) {
        importDirective.path = resolvedPath;
        return require.resolve(importDirective.path, { paths });
    }

    return require.resolve(importDirective.path, { paths });
}

function resolveDappDependency(cwd: string, stopAt: string, importPath: string, paths: string[]): string | undefined {
    try {
        const dappFileDir = utils.findUpSync(DAPP_FILENAME, { cwd, stopAt });

        if (dappFileDir) {
            const dappFilePath = path.resolve(dappFileDir, DAPP_FILENAME);

            if (!dappRemappingCache[dappFilePath]) {
                const output = execSync(`. ${dappFilePath} && echo $DAPP_REMAPPINGS`, { encoding: "utf-8" });
                const aliases = output.replace("\n", " ").trim().split(/\s+/);

                dappRemappingCache[dappFilePath] = {};
                for (const alias of aliases) {
                    const aliasSplit = alias.split("=");
                    if (aliasSplit.length === 2) {
                        dappRemappingCache[dappFilePath][aliasSplit[0]] = aliasSplit[1];
                    }
                }
            }

            for (const alias of Object.keys(dappRemappingCache[dappFilePath])) {
                if (alias === importPath.slice(0, alias.length)) {
                    paths.push(dappFileDir);
                    return `./${path.join(dappRemappingCache[dappFilePath][alias], importPath.slice(alias.length))}`;
                }
            }
        }
        return undefined;
    } catch (err) {
        return undefined;
    }
}

function resolveBrownieDependency(cwd: string, stopAt: string, importPath: string, paths: string[]): string | undefined {
    try {
        let brownieFilePath;
        let brownieFileDir;

        for (const ext of [".yaml", ".yml"]) {
            brownieFileDir = utils.findUpSync(`${BROWNIE_FILENAME}${ext}`, { cwd, stopAt });
            if (brownieFileDir) {
                brownieFilePath = path.resolve(brownieFileDir, `${BROWNIE_FILENAME}${ext}`);
                break;
            }
        }

        if (brownieFilePath) {
            if (!brownieRemappingCache[brownieFilePath]) {
                const brownieConfig: any = yaml.load(fs.readFileSync(brownieFilePath, 'utf8'));

                if (brownieConfig?.compiler?.solc?.remappings) {
                    brownieRemappingCache[brownieFilePath] = {};
                    for (const alias of brownieConfig.compiler.solc.remappings) {
                        const aliasSplit = alias.split("=");
                        if (aliasSplit.length === 2) {
                            brownieRemappingCache[brownieFilePath][aliasSplit[0]] = aliasSplit[1];
                        }
                    }
                }
            }

            for (const alias of Object.keys(brownieRemappingCache[brownieFilePath])) {
                if (alias === importPath.slice(0, alias.length)) {
                    paths.push(BROWNIE_PACKAGE_PATH);
                    return `./${path.join(brownieRemappingCache[brownieFilePath][alias], importPath.slice(alias.length))}`;
                }
            }
        }
        return undefined;
    } catch (err) {
        return undefined;
    }
}
