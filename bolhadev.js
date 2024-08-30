import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';
import * as process from 'process';
import { RichText } from '@atproto/api';
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

// Bot para seguir a hashtag #bolhadev e responder a posts
async function followAndReplyToBolhaDev() {
    await login();

    const getTimeLine = await agent.getTimeline({ limit: 100 });
    const posts = getTimeLine.data.feed;

    for (const post of posts) {
        const postText = post.post.text || ''; // Garantir que postText não seja undefined

        if (postText.toLowerCase().includes('#bolhadev')) {
            // Seguir o autor do post
            await agent.follow(post.post.author.did);

            // Responder ao post com uma mensagem
            const replyMessage = `Excelente post sobre #bolhadev! 🚀 Continue compartilhando conhecimento.`;
            const rt = await createRichTextMessage(replyMessage);

            await agent.post({
                $type: 'app.bsky.feed.post',
                text: rt.text,
                facets: rt.facets,
                createdAt: new Date().toISOString(),
                reply: {
                    root: { cid: post.post.cid, uri: post.post.uri },
                    parent: { cid: post.post.cid, uri: post.post.uri }
                },
            });

            console.log(`Replied to post with #bolhadev and followed the author.`);
        }
    }
}

// Agendamento do bot com Cron
const scheduleFollowAndReply = '*/15 * * * *'; // A cada 15 minutos

const jobFollowAndReply = new CronJob(scheduleFollowAndReply, followAndReplyToBolhaDev, null, true, 'America/Sao_Paulo');

// Inicia o job
jobFollowAndReply.start();

console.log("Bot to follow and reply to #bolhadev started!");
