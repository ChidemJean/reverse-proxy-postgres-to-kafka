import net from 'net';

const LOCAL_PORT = parseInt(process.env.PROXY_PORT ?? '5432');
const PG_HOST = process.env.DB_HOST ?? '127.0.0.1';
const PG_PORT = parseInt(process.env.DB_PORT ?? '5432');

const extractInsertData = (text: string) => {
    const regex = /insert into ([^)]+) \(([^)]+)\) values \(([^)]+)\)/i;
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

        console.log(tableName, pairs);
    } else {
        console.log("Comando SQL não corresponde ao formato esperado.");
    }
}

const extractUpdateData = (text: string) => {
    const regex = /update ([^)]+) SET\s+([^;]+)\s+WHERE/i;
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

        console.log(tableName, pairs);
    } else {
        console.log("A consulta não corresponde ao padrão esperado.");
    }

}

const interceptSQL = (data: Buffer) => {
    const textData = data.toString('utf-8');

    if (textData.match(/INSERT/i)) {
        console.log('Insert detectado:');
        extractInsertData(textData);
        return;
    }

    if (textData.match(/UPDATE/i)) {
        console.log('Update detectado:');
        extractUpdateData(textData);
        return;
    }

    console.log(textData);
}

const interceptResponse = (data: Buffer) => {
    const textData = data.toString('utf-8');
    console.log(textData);
}

const server = net.createServer((clientSocket: net.Socket) => {
    console.log('Nova conexão:', clientSocket.remoteAddress);

    const pgSocket = net.createConnection({ host: PG_HOST, port: PG_PORT });

    clientSocket.on('data', (data: Buffer) => {
        console.log('----------------------------------------------------');
        console.log('> Novo dado: Cliente → PostgreSQL');
        interceptSQL(data);
        console.log('----------------------------------------------------');

        pgSocket.write(data); // Envia os dados para o PostgreSQL real
    });

    pgSocket.on('data', (data: Buffer) => {
        console.log('----------------------------------------------------');
        console.log('< Retorno PostgreSQL → Cliente');
        interceptResponse(data);
        console.log('----------------------------------------------------');

        clientSocket.write(data); // Envia a resposta para o cliente
    });

    clientSocket.on('error', (err: Error) => console.error('Erro no cliente:', err.message));
    pgSocket.on('error', (err: Error) => console.error('Erro no PostgreSQL:', err.message));

    clientSocket.on('close', () => pgSocket.end());
    pgSocket.on('close', () => clientSocket.end());
});

server.listen(LOCAL_PORT, () => {
    console.log(`Proxy PostgreSQL rodando na porta ${LOCAL_PORT}`);
});
