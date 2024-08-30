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

// Bot de Postagem Diária
async function dailyPost() {
    await login();

    const menssagem = "E aí, o que vai codar hoje? @samsantosb.bsky.social #bolhadev";
    const rt = await createRichTextMessage(menssagem);

    const postRecord = {
        $type: 'app.bsky.feed.post',
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString(),
    };

    await agent.post(postRecord);
    console.log("Just posted a daily motivational message!");
}

// Bot de Boas-Vindas para Novos Seguidores
async function welcomeNewFollowers() {
    await login();

    const follower = await agent.getFollowers({ actor: agent.did });
    const newFollowers = follower.data.followers;

    for (const f of newFollowers) {
        await agent.follow(f.did);
        const welcomeMessage = `Obrigado por seguir, ${f.handle}! Fique à vontade para interagir e aprender mais sobre desenvolvimento.`;
        const rt = await createRichTextMessage(welcomeMessage);
        await agent.post({
            $type: 'app.bsky.feed.post',
            text: rt.text,
            facets: rt.facets,
            createdAt: new Date().toISOString(),
        });
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
