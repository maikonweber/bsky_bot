import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import { CronJob } from 'cron';
import * as process from 'process';
import { RichText } from '@atproto/api';
import db from './database'

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
    console.log(instance)
}

main()