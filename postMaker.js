import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';
import * as process from 'process';
import { RichText } from '@atproto/api';
import db from './database.js'


const specificFeedDid = 'did:plc:kzbpdq77iuqrf5vvsh5uocqb';
const studyT = 'did:plc:kzbpdq77iuqrf5vvsh5uocqb/feed/aaakgyzyuw4us'
dotenv.config();

const user = process.env.BLUESKY_USERNAME;
const password = process.env.BLUESKY_PASSWORD;

const agent = new BskyAgent({
    service: 'https://bsky.social',
});

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


async function main() {
    // Consulta para obter o próximo post a ser enviado
    const sql = `SELECT * FROM blue_sky_phase 
                WHERE post_at IS NULL
                AND deleted_at IS NULL
                ORDER BY created_at ASC
                LIMIT 1;`;

    // Executa a consulta para obter as linhas
    const getRows = await db.query(sql);
    // Verifica se há algum resultado
    if (getRows.rows.length === 0) {
        console.log('No posts to process.');
        return;
    }

    // Extrai o texto e o ID do post
    const text = getRows.rows[0].text;
    const id = getRows.rows[0].id;

    // Mandar via Agent para o feed da bolhadev
    // (Adicione aqui o código para postar no feed)
    await login();

    const menssagem = text;
    const rt = await createRichTextMessage(menssagem);

    const postRecord = {
        $type: 'app.bsky.feed.post',
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
        // Postando no feed específico usando o `did`
        feed: specificFeedDid,
    };


    await agent.post(postRecord);

    console.log("Just posted a daily motivational message!");

    // Consulta SQL para marcar o post como enviado
    const sqlDeleted = `UPDATE blue_sky_phase 
                        SET post_at = now() 
                        WHERE id = $1;`;

    // Executa a atualização do post
    await db.query(sqlDeleted, [id]);

    console.log(`Post with ID ${id} updated to be posted.`);
}




const job = new CronJob(scheduleDailyPost, main, null, true, 'America/Sao_Paulo');


job.start();