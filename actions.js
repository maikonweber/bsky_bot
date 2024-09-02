import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';
import * as process from 'process';
import { RichText } from '@atproto/api';
import db from './database.js'; // Certifique-se de ter configurado o banco de dados corretamente

dotenv.config();

const user = process.env.BLUESKY_USERNAME;
const password = process.env.BLUESKY_PASSWORD;
const specificFeedDid = 'did:plc:kzbpdq77iuqrf5vvsh5uocqb';

const agent = new BskyAgent({
    service: 'https://bsky.social',
});

// Função para verificar se o seguidor já está na tabela
async function isFollowerInDb(did) {
    const sql = 'SELECT 1 FROM blue_sky_followers WHERE did = $1';
    const result = await db.query(sql, [did]);
    return result.rowCount > 0;
}

// Função para inserir dados no banco
async function insertFollower(follower) {
    const sql = `
        INSERT INTO blue_sky_followers (payload, did, handle)
        VALUES ($1, $2, $3)
        ON CONFLICT (handle) DO UPDATE
        SET payload = EXCLUDED.payload,
            handle = EXCLUDED.handle,
            created_at = EXCLUDED.created_at
    `;
    const values = [
        JSON.stringify(follower),      // payload
        follower.did,                  // did
        follower.handle,               // handle
    ];
    try {
        await db.query(sql, values);
    } catch (error) {
        console.error('Erro ao inserir ou atualizar seguidor:', error);
    }
}

// Função para login
async function login() {
    await agent.login({ identifier: user, password: password });
}

// Função para criar uma mensagem com RichText
async function createRichTextMessage(text) {
    const rt = new RichText({ text });
    await rt.detectFacets(agent);
    return rt;
}

// Bot de Postagem Diária