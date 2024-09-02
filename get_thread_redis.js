import redisService from './redis.js'; // Serviço Redis conforme definido anteriormente
import { isFollowerInHandle } from './lib.js'
import { Agent, BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import db from './database.js'; // Certifique-se de ter configurado o banco de dados corretamente
import * as process from 'process';
import { login } from './lib.js';

dotenv.config();

const user = process.env.BLUESKY_USERNAME;
const password = process.env.BLUESKY_PASSWORD;

const agent = new BskyAgent({
    service: 'https://bsky.social',
});


async function LikesFollowesPost(params, agent) {
    const bool = await isFollowerInHandle(params.authoHandle);

    console.log(bool, params.authoHandle)

    if (bool) {
        console.log(params)
        // await agent.like(params.uri, params.cid)
        return
    }

    return
}



// Função para consumir e processar dados da hash table no Redis
export async function consumirRedisHashTable() {

    // await login(agent)

    try {
        // Recupera todos os posts armazenados na hash table
        const posts = await redisService.client.hGetAll('timeline:hashtag:RPGTEXTUAL');
        const postsArray = Object.values(posts).map(value => JSON.parse(value));

        console.log(postsArray.length)


        for (const p of postsArray) {

            const curtidas = p.curtidas;
            const repost = p.repost;
            const reposta = p.repostas;
            const text = p.texto.text
            const textCreated = p.texto.createdAt;
            const lang = p.texto.langs;
            const authoHandle = p.autor.handle;
            const postUri = p.autor.handle;
            const displayName = p.autor.displayName
            const cid = p.uri
            const uri = p.cid

            await LikesFollowesPost({ uri, cid, authoHandle, text, curtidas }, agent);


        }


        // Configura os critérios de filtragem
        // const minLikes = 10; // Exemplo: Filtra posts com no mínimo 10 likes
        // const minReposts = 5; // Exemplo: Filtra posts com no mínimo 5 reposts
        // const regex = /#studytwt/; // Exemplo: Filtra posts cujo texto contém a hashtag #studytwt
        // const handlesAmigos = ['tchaguitos.bsky.social', 'liviamonte1ro.bsky.social']; // Exemplo: Filtra posts de autores que estão na lista de amigos

        // Processa posts com base nos critérios definidos
        // const postsProcessados = processarPosts(postsArray, { minLikes, minReposts, regex, handlesAmigos });

        // Exemplo de armazenamento ou processamento adicional dos posts filtrados
        // for (const post of postsProcessados) {
        //     console.log('Post filtrado:', post);

        //     // Aqui você pode adicionar lógica adicional para armazenar ou processar os posts
        //     // Por exemplo, armazenar em outra hash table, enviar notificações, etc.
        //     // Exemplo: armazenar posts filtrados em uma nova hash table no Redis
        //     await redisService.client.hSet('filtered_posts', post.uri, JSON.stringify(post));
        // }
    } catch (error) {
        console.error('Erro ao consumir dados da hash table do Redis:', error);
    }
}

// Configurar o cron job para consumir dados da hash table às 00:00 todos os dias
consumirRedisHashTable()