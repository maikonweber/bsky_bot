// Função para verificar se a data de indexação do post está dentro de um intervalo
import { parseISO } from 'date-fns';
import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import * as process from 'process';
import { RichText } from '@atproto/api';
import db from './database.js'
import { gunzip } from 'zlib';


const bolhadev = 'did:plc:kzbpdq77iuqrf5vvsh5uocqb';

dotenv.config();

const user = process.env.BLUESKY_USERNAME;
const password = process.env.BLUESKY_PASSWORD;

const agent = new BskyAgent({
    service: 'https://bsky.social',
});


export function setupCronJobs(jobs) {

    // const jobs = {
    //     dailyPost: {
    //         schedule: '10 8 * * *',
    //         task: dailyPost, // Fuction
    //         timezone: 'America/Sao_Paulo'
    //     }
    //  } 

    const cronJobs = [];

    for (const [name, { schedule, task, timezone }] of Object.entries(jobs)) {
        const job = new CronJob(schedule, task, null, true, timezone);
        cronJobs.push(job);
        console.log(`${name} cron job started!`);
    }

    return cronJobs;
}

export async function findByLastPhaseForPost() {
    const sql = `SELECT * FROM blue_sky_phase 
                WHERE post_at IS NULL
                AND deleted_at IS NULL
                ORDER BY created_at ASC
                LIMIT 1;`;

    // Executa a consulta para obter as linhas
    const getRows = await db.query(sql);

    return getRows;
}

export async function isFollowerInDb(did) {
    const sql = 'SELECT 1 FROM blue_sky_followers WHERE did = $1';
    const result = await db.query(sql, [did]);
    return result.rowCount > 0;
}

// Função para inserir dados no banco
export async function insertFollower(follower) {
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


// F = Follow Perfil
export async function storeFolloweOrUpdate(f) {

    const sql = `
    INSERT INTO blue_sky_followers (payload, did, handle)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO UPDATE
    SET payload = EXCLUDED.payload,
        did = EXCLUDED.did,
        handle = EXCLUDED.handle,
        created_at = EXCLUDED.created_at,
        deleted_at = EXCLUDED.deleted_at
`;

    // Dados a serem inseridos/atualizados
    const values = [
        JSON.stringify(f),              // payload
        f.did,                          // did
        f.handle,                       // handle
    ];

    try {
        await db.query(sql, values);
    } catch (error) {
        console.error('Erro ao inserir ou atualizar seguidor:', error);
    }
}

export async function updateSendPostQueue(id) {
    const sqlDeleted = `UPDATE blue_sky_phase 
                        SET post_at = now() 
                        WHERE id = $1;`;

    // Executa a atualização do post
    await db.query(sqlDeleted, [id]);
}

export async function findByFollower(handle) {
    const sql = `SELECT * from blue_sky_follwer WHERE handle = $1`;


    return db.query(sql, [handle])
}
// Função para login
export async function login() {
    await agent.login({ identifier: user, password: password });
}

// Função para criar uma mensagem com RichText
export async function createRichTextMessage(text) {
    const rt = new RichText({ text });
    await rt.detectFacets(agent);
    return rt;
}

export function filtrarPorDataIndexacao(post, dataInicio, dataFim) {
    const dataIndexacao = parseISO(post.dataIndexacao);
    const inicio = parseISO(dataInicio);
    const fim = parseISO(dataFim);

    return dataIndexacao >= inicio && dataIndexacao <= fim;
}

// Função para verificar se um post tem mais de N likes ou reposts
export function filtrarPorLikesOuReposts(post, minLikes, minReposts) {
    return post.curtidas >= minLikes || post.reposts >= minReposts;
}

// Função para verificar se o texto do post contém um regex específico
export function filtrarPorTextoRegex(post, regex) {
    return regex.test(post.texto.text);
}

// Função para verificar se o handle do autor é um dos amigos
export function filtrarPorAmigos(post, handlesAmigos) {
    return handlesAmigos.includes(post.autor.handle);
}

// Função para verificar se um post tem pelo menos N reposts
export function filtrarPorReposts(post, minReposts) {
    return post.reposts >= minReposts;
}


// Função para processar posts com base em vários critérios
export function processarPosts(posts, { minLikes, minReposts, regex, handlesAmigos }) {
    return posts.filter(post => {
        const atendeCritériosLikesReposts = filtrarPorLikesOuReposts(post, minLikes, minReposts);
        const atendeCritériosRegex = regex ? filtrarPorTextoRegex(post, regex) : true;
        const atendeCritériosAmigos = handlesAmigos ? filtrarPorAmigos(post, handlesAmigos) : true;

        return atendeCritériosLikesReposts && atendeCritériosRegex && atendeCritériosAmigos;
    });
}