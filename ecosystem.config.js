module.exports = {
    apps: [
        {
            name: 'bluesky-job',
            script: './bora_codar_hoje.js', // Substitua pelo caminho do seu script
            cron_restart: '10 8 * * *', // Define o cron para executar às 8:10 AM no horário do Brasil
            timezone: 'America/Sao_Paulo', // Define o fuso horário para o Brasil (horário de Brasília)
            env: {
                NODE_ENV: 'production',
                BLUESKY_USERNAME: process.env.BLUESKY_USERNAME,
                BLUESKY_PASSWORD: process.env.BLUESKY_PASSWORD,
            },
            log_date_format: "YYYY-MM-DD HH:mm Z",
        },
    ],
};