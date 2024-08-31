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
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (did) DO UPDATE
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
async function dailyPost() {
    await login();
    // did:plc:kzbpdq77iuqrf5vvsh5uocqb/feed/aaakgbtfraxaq
    const menssagem = "E aí, o que vai codar hoje? #bolhadev https://www.horadecodar.dev/";
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
}

// Bot de Boas-Vindas para Novos Seguidores
// const knownFollowers = new Set(); // Usando um Set para armazenar seguidores conhecidos

async function welcomeNewFollowers() {
    await login();

    const followerResponse = await agent.getFollowers({ actor: agent.did });
    const newFollowers = followerResponse.data.followers;

    for (const f of newFollowers) {
        const isInDb = await isFollowerInDb(f.did);
        if (!isInDb) {  // Verifica se o seguidor já está na tabela
            await insertFollower(f);  // Adiciona o novo seguidor à tabela

            await agent.follow(f.did);  // Segue o novo seguidor
            const welcomeMessage = `Obrigado por seguir, ${f.handle}! Fique à vontade para interagir e aprender mais sobre desenvolvimento.`;
            const rt = await createRichTextMessage(welcomeMessage);

            await agent.post({
                $type: 'app.bsky.feed.post',
                text: rt.text,
                facets: rt.facets,
                createdAt: new Date().toISOString(),
            });
        }
    }

    console.log("Welcomed new followers!");
}

// Bot de Resumo de Interações Semanais
async function weeklySummary() {
    await login();

    const getTimeLine = await agent.getTimeline({ limit: 100 });
    const post = getTimeLine.data.feed;

    let likeCount = 0;
    post.forEach(el => {
        likeCount += el.post.likeCount || 0;
    });

    const summaryMessage = `Resumo semanal: Você teve ${likeCount} curtidas nas suas postagens. Continue compartilhando conhecimento!`;
    const rt = await createRichTextMessage(summaryMessage);

    await agent.post({
        $type: 'app.bsky.feed.post',
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
    });

    console.log("Posted a weekly summary!");
}

// Bot de Curadoria de Conteúdo
async function contentCuration() {
    await login();

    const getTimeLine = await agent.getTimeline({ limit: 100 });
    const jsPosts = getTimeLine.data.feed.filter(el => el.post.text.toLowerCase().includes('javascript'));

    let curatedMessage = "Os melhores posts sobre #JavaScript desta semana são:\n";
    jsPosts.forEach((el, index) => {
        curatedMessage += `${index + 1}. ${el.post.text}\n`;
    });

    const rt = await createRichTextMessage(curatedMessage);

    await agent.post({
        $type: 'app.bsky.feed.post',
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
    });

    console.log("Curated content posted!");
}

// Agendamento dos Bots com Cron
const scheduleDailyPost = '10 8 * * *'; // Diariamente às 8:10 AM
const scheduleWelcomeFollowers = '*/10 * * * *'; // A cada 10 minutos
const scheduleWeeklySummary = '0 9 * * 1'; // Toda segunda-feira às 9:00 AM
const scheduleContentCuration = '0 18 * * 5'; // Toda sexta-feira às 6:00 PM


// Cron jobs
const jobDailyPost = new CronJob(scheduleDailyPost, dailyPost, null, true, 'America/Sao_Paulo');
const jobWelcomeFollowers = new CronJob(scheduleWelcomeFollowers, welcomeNewFollowers, null, true, 'America/Sao_Paulo');
const jobWeeklySummary = new CronJob(scheduleWeeklySummary, weeklySummary, null, true, 'America/Sao_Paulo');
const jobContentCuration = new CronJob(scheduleContentCuration, contentCuration, null, true, 'America/Sao_Paulo');



// Inicia os jobs
jobDailyPost.start();
jobWelcomeFollowers.start();
jobWeeklySummary.start();
jobContentCuration.start();

console.log("All cron jobs started!");
