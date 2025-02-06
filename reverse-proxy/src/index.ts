import net from 'net';
import { ExtractedSqlData, SqlDataExtractor } from './sql/SqlDataExtractor';
import QueueCollection from './collections/Queue';
import { PostgresqlHandler } from './handlers/PostgresqlHandler';

const LOCAL_PORT = parseInt(process.env.PROXY_PORT ?? '5432');
const PG_HOST = process.env.DB_HOST ?? '127.0.0.1';
const PG_PORT = parseInt(process.env.DB_PORT ?? '5432');

const sqlDataExtractor = new SqlDataExtractor();
const postgresHandler = new PostgresqlHandler();

const server = net.createServer((clientSocket: net.Socket) => {
    console.log('Nova conexão:', clientSocket.remoteAddress);

    const commandsQueue = new QueueCollection<ExtractedSqlData>();

    const pgSocket = net.createConnection({ host: PG_HOST, port: PG_PORT });

    clientSocket.on('data', (data: Buffer) => {
        const textData = data.toString('utf-8');
        console.log('----------------------------------------------------');
        console.log('> Novo dado: Cliente → PostgreSQL');
        const extractedData = sqlDataExtractor.extract(textData);
        if (extractedData) {
            commandsQueue.enqueue(extractedData);
        }
        console.log('----------------------------------------------------');

        pgSocket.write(data); // Envia os dados para o PostgreSQL real
    });

    pgSocket.on('data', (data: Buffer) => {
        console.log('----------------------------------------------------');
        console.log('< Retorno PostgreSQL → Cliente');
        const okRes = postgresHandler.interceptResponse(data);
        console.log('----------------------------------------------------');
        if (okRes) { 
            const extractedData = commandsQueue.dequeue();
            console.log(extractedData);
        }

        clientSocket.write(data); // Envia a resposta para o cliente
    });

    clientSocket.on('error', (err: Error) => console.error('Erro no cliente:', err.message));
    pgSocket.on('error', (err: Error) => console.error('Erro no PostgreSQL:', err.message));

    clientSocket.on('close', () => {
        commandsQueue.clean();
        pgSocket.end();
    });
    pgSocket.on('close', () => {
        commandsQueue.clean();
        clientSocket.end()
    });
});

server.listen(LOCAL_PORT, () => {
    console.log(`Proxy PostgreSQL rodando na porta ${LOCAL_PORT}`);
});