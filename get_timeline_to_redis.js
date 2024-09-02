import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import db from './database.js'; // Certifique-se de ter configurado o banco de dados corretamente
import * as process from 'process';
import redisService from './redis.js';
import { CronJob } from 'cron';
import { login } from './lib.js';

dotenv.config();

const user = process.env.BLUESKY_USERNAME;
const password = process.env.BLUESKY_PASSWORD;
const specificFeedDid = 'did:plc:kzbpdq77iuqrf5vvsh5uocqb';

const agent = new BskyAgent({
    service: 'https://bsky.social',
});

const HASHTABLE_KEY = 'timeline:hashtag:RPGTEXTUAL'; // Nome da hash table

export async function adicionarPostNaHashTable(post) {
    try {
        const { uri } = post; // Usamos o URI como identificador único
        await redisService.client.hSet(HASHTABLE_KEY, uri, JSON.stringify(post)); // Adiciona o post à hash table

        // Verifica o número de itens na hash table e remove o mais antigo se necessário
        const keys = await redisService.client.hKeys(HASHTABLE_KEY);
        if (keys.length > 1000) {
            const oldestKey = keys[0]; // A lógica real pode variar conforme a necessidade
            await redisService.client.hDel(HASHTABLE_KEY, oldestKey); // Remove o item mais antigo
        }

        console.log(`Post com URI ${uri} adicionado à hash table.`);
    } catch (error) {
        console.error('Erro ao adicionar post na hash table:', error);
    }
}


export async function fetchTimeline(params = { limit: 100 }) {
    await login(agent)
    try {
        const timeline = await agent.getTimeline(params); // Busca os 50 posts mais recentes
        // console.log(timeline)
        return timeline.data.feed;
    } catch (error) {
        console.error('Erro ao buscar timeline:', error);
    }
}

export function extrairInformacoesPost(post) {
    console.log(post)
    const { uri, cid, author, record, replyCount, repostCount, likeCount, quoteCount, indexedAt } = post.post;

    return {
        uri,
        cid,
        autor: author, // Supondo que o autor é um objeto com um campo 'handle'
        texto: record, // Supondo que o texto está no campo 'text' do 'record'
        respostas: replyCount,
        reposts: repostCount,
        curtidas: likeCount,
        citacoes: quoteCount,
        dataIndexacao: indexedAt,
    };
}


async function filterAndStorePostsByHashtag(posts) {
    for (const p of posts) {
        const procesPost = extrairInformacoesPost(p)
        console.log(procesPost)

        await adicionarPostNaHashTable(procesPost);

    }


    // console.log(procesPost)

    // const matchingPosts = procesPost.filter(post => post.text.includes(hashtag));

    // for (const post of matchingPosts) {
    //     try {
    //         const key = `hashtag:${hashtag}:${post.uri}`;
    //         // await redisService.set(key, JSON.stringify(post));
    //         console.log(`Post armazenado no Redis com a chave: ${key}`);
    //     } catch (error) {
    //         console.error(`Erro ao armazenar post no Redis:`, error);
    //     }
    // }
}

async function main() {
    await login(agent); // Realizar login
    const posts = await fetchTimeline(); // Buscar a timeline
    await filterAndStorePostsByHashtag(posts);
}


const scheduleWelcomeFollowers = '*/40 * * * *'; // A cada 10 minutos


// Cron jobs
const jobDailyPost = new CronJob(scheduleWelcomeFollowers, main, null, true, 'America/Sao_Paulo');



// Inicia os jobs
jobDailyPost.start();

main();



