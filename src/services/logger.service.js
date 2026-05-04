import { IncomingWebhook } from '@slack/webhook';

let webhook;

if (process.env.SLACK_WEBHOOK_URL) {
    webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
}

export const logErrorToSlack = async (err, req) => {
    if (!webhook || process.env.NODE_ENV === 'test') return;

    await webhook.send({
        text: `*ERROR 5XX* en \`${req.method} ${req.path}\``,
        attachments: [{
            color: 'danger',
            fields: [
                { title: 'Timestamp', value: new Date().toISOString(), short: true },
                { title: 'Ruta', value: `${req.method} ${req.originalUrl}`, short: true },
                { title: 'Mensaje', value: err.message },
                { title: 'Stack', value: err.stack?.slice(0, 500) ?? 'No disponible' }
            ]
        }]
    });
};
