import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';
import * as process from 'process';
import { RichText } from '@atproto/api'
dotenv.config();

const user = process.env.BLUESKY_USERNAME
const password = process.env.BLUESKY_PASSWORD

console.log(user, password)
// Create a Bluesky Agent 

const agent = new BskyAgent({
    service: 'https://bsky.social',
})


const menssagem = "E ai o que vai codar hoje ? @samsantosb.bsky.social #bolhadev"

const rt = new RichText({
    text: menssagem
})

async function main() {

    // const session = new CredentialSession({
    //     service: new URL('https://bsky.social'),
    // })

    await agent.login({ identifier: user, password: password })

    await rt.detectFacets(agent);

    const postRecord = {
        $type: 'app.bsky.feed.post',
        text: rt.text,
        facets: rt.facets,
        createdAt: new Date().toISOString()
    }


    await agent.post(postRecord);

    console.log("Just posted!")
}

async function newFollow() {
    await agent.login({ identifier: user, password: password });

    const follower = await agent.getFollowers({ actor: agent.did });
    const newFollowers = follower.data.followers;

    newFollowers.forEach(async (f) => {
        // Enviar uma mensagem de boas-vindas ou seguir de volta
        await agent.follow(f.did);
        const welcomeMessage = `Obrigado por seguir, ${f.handle}! Fique à vontade para interagir e aprender mais sobre desenvolvimento.`;
        await agent.post({ text: welcomeMessage });
    });

    console.log("Welcomed new followers!");
}

// main();


// Run this on a cron job
const scheduleExpressionMinute = '* * * * *'; // Run once every minute for testing
const scheduleExpression = '10 8 * * *'; // Run every day at 7:00 AM



const job = new CronJob(scheduleExpression, main, null, true, 'America/Sao_Paulo', () => {
    console.log("Cron job started at:", new Date().toISOString());
    main();
});

const newFollowCron = new CronJob(scheduleExpression, main, null, true, 'America/Sao_Paulo', () => {
    console.log("Cron job started at:", new Date().toISOString());
    main();
});

job.start();
