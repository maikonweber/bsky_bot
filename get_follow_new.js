import { BskyAgent } from '@atproto/api';
import * as dotenv from 'dotenv';
import db from './database.js'; // Certifique-se de ter configurado o banco de dados corretamente
import * as process from 'process';

dotenv.config();

const user = process.env.BLUESKY_USERNAME;
const password = process.env.BLUESKY_PASSWORD;
const specificFeedDid = 'did:plc:kzbpdq77iuqrf5vvsh5uocqb';

const agent = new BskyAgent({
    service: 'https://bsky.social',
});



// Função para login
async function login() {
    await agent.login({ identifier: user, password: password });
}

// Função para inserir dados no banco

// Função para obter e armazenar seguidores e seguindo
async function storeFollowersAndFollowing() {
    await login();

    const followersResponse = await agent.getFollowers({ actor: agent.did });
    const followers = followersResponse.data.followers || [];

    for (const f of followers) {
        console.log('Follower:', f);

        // Construir a consulta SQL para inserção/atualização
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


}

storeFollowersAndFollowing().then(() => {
    console.log('Dados armazenados com sucesso');
}).catch(err => {
    console.error('Erro ao armazenar dados:', err);
});
