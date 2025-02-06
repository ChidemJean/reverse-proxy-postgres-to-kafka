import { SqlMatcher } from "./SqlMatcher";

export type ExtractedSqlData  = {
    tableName: string;
    operation: 'insert' | 'update';
    fields: { [column:string]: string }[]
};

export class SqlDataExtractor {
    matcher: SqlMatcher;

    constructor() {
        this.matcher = new SqlMatcher();
    }

    extract(text: string): ExtractedSqlData | null {
        const operation = this.matcher.execute(text);

        if (operation == "insert") {
            return this.extractInsertData(text);
        }

        if (operation == "update") {
            return this.extractUpdateData(text);
        }

        return null;
    }

    extractUpdateData(text: string): ExtractedSqlData & { whereClause: string } | null {
        const regex = /update\s+(\w+)\s+set\s+([\s\S]+?)\s+where\s+([\s\S]*?)(?=\x00|$)/i;
        const match = text.match(regex);
    
        if (match) {
            const tableName = match[1].replace(/\"|\'$/g, '');
            const setClause = match[2];
            const pairs = setClause.split(',').map(pair => {
                const [coluna, valor] = pair.trim().split('=');
                return {
                    [coluna.trim()]: valor.trim().replace(/['"]/g, '')
                };
            });
            const whereClause = match[3].trim();
    
            return {
                tableName,
                fields: pairs,
                whereClause,
                operation: "update"
            }
        } else {
            console.log("A consulta não corresponde ao padrão esperado.");
        }

        return null;
    }

    extractInsertData(text: string): ExtractedSqlData | null {
        const regex = /insert\s+into\s+([^)]+)\s+\(([^)]+)\)\s+values\s+\(([^)]+)\)/i;
        const match = text.match(regex);
    
        if (match) {
            const tableName = match[1].trim().replace(/\"|\'$/g, '');
            const columns = match[2].split(',').map(col => col.replace(/\"|\'$/g, '').trim());
            const values = match[3].split(',').map(val => val.trim().replace(/^'|'$/g, ''));
    
            const pairs = columns.map((col, idx) => {
                return {
                    [col]: values[idx].replace(/['"]/g, '')
                }
            });
    
            return {
                tableName,
                fields: pairs,
                operation: "insert"
            }
        } else {
            console.log("Comando SQL não corresponde ao formato esperado.");
        }

        return null;
    }

}