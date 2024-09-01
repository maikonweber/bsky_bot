import { createClient } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

class RedisService {
    constructor() {
        this.client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        });

        this.client.on('error', (err) => console.error('Erro ao conectar ao Redis:', err));
        this.conectar(); // Conectar automaticamente ao instanciar a classe
    }

    // Método para conectar ao Redis
    async conectar() {
        try {
            if (!this.client.isOpen) {
                await this.client.connect();
                console.log('Conectado ao Redis com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao conectar ao Redis:', error);
        }
    }

    // Método para definir um valor no Redis
    async set(key, value) {
        try {
            await this.client.set(key, value);
            console.log(`Chave "${key}" definida com valor "${value}".`);
        } catch (error) {
            console.error('Erro ao definir chave no Redis:', error);
        }
    }

    // Método para obter um valor do Redis
    async get(key) {
        try {
            const value = await this.client.get(key);
            console.log(`Valor obtido para a chave "${key}": ${value}`);
            return value;
        } catch (error) {
            console.error('Erro ao obter chave do Redis:', error);
        }
    }

    // Método para deletar uma chave do Redis
    async del(key) {
        try {
            await this.client.del(key);
            console.log(`Chave "${key}" deletada do Redis.`);
        } catch (error) {
            console.error('Erro ao deletar chave no Redis:', error);
        }
    }

    // Método para fechar a conexão com o Redis
    async desconectar() {
        try {
            await this.client.disconnect();
            console.log('Conexão com Redis fechada.');
        } catch (error) {
            console.error('Erro ao fechar conexão com Redis:', error);
        }
    }
}

// Exportar uma instância da classe RedisService
const redisService = new RedisService();
export default redisService;
