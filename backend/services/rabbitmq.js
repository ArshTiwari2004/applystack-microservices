const amqp = require('amqplib');

let connection = null;
let channel = null;

// Queue names
const QUEUES = {
    EMAIL_NOTIFICATIONS: 'email_notifications',
    JOB_REMINDERS: 'job_reminders',
    BACKGROUND_TASKS: 'background_tasks'
};

// Initialize RabbitMQ connection
async function connectRabbitMQ() {
    const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

    try {
        connection = await amqp.connect(rabbitmqUrl);
        channel = await connection.createChannel();

        // Create all queues
        for (const queue of Object.values(QUEUES)) {
            await channel.assertQueue(queue, { durable: true });
        }

        console.log('Successfully connected to RabbitMQ');

        // Handle connection errors
        connection.on('error', (err) => {
            console.error('RabbitMQ connection error:', err);
        });

        connection.on('close', () => {
            console.log('RabbitMQ connection closed');
        });

        return channel;
    } catch (error) {
        console.error('Failed to connect to RabbitMQ:', error);
        // Don't crash the app if RabbitMQ is not available
        return null;
    }
}

// Get channel
function getRabbitMQChannel() {
    return channel;
}

// Send message to queue
async function sendToQueue(queueName, message) {
    if (!channel) {
        console.warn('RabbitMQ not connected, message not sent');
        return false;
    }

    try {
        channel.sendToQueue(
            queueName,
            Buffer.from(JSON.stringify(message)),
            { persistent: true }
        );
        console.log(`Message sent to queue ${queueName}`);
        return true;
    } catch (error) {
        console.error('Error sending to queue:', error);
        return false;
    }
}

// Queue specific helpers

// Send email notification
async function queueEmailNotification(email, subject, body, type = 'general') {
    return sendToQueue(QUEUES.EMAIL_NOTIFICATIONS, {
        email,
        subject,
        body,
        type,
        timestamp: new Date().toISOString()
    });
}

// Queue job application reminder
async function queueJobReminder(userId, jobId, reminderType, scheduledTime) {
    return sendToQueue(QUEUES.JOB_REMINDERS, {
        userId,
        jobId,
        reminderType, // 'interview', 'follow_up', 'deadline'
        scheduledTime,
        timestamp: new Date().toISOString()
    });
}

// Queue background task
async function queueBackgroundTask(taskType, payload) {
    return sendToQueue(QUEUES.BACKGROUND_TASKS, {
        taskType,
        payload,
        timestamp: new Date().toISOString()
    });
}

// Consume messages from queue (for workers)
async function consumeQueue(queueName, callback) {
    if (!channel) {
        console.warn('RabbitMQ not connected, cannot consume');
        return false;
    }

    try {
        await channel.consume(queueName, async (msg) => {
            if (msg) {
                const content = JSON.parse(msg.content.toString());
                try {
                    await callback(content);
                    channel.ack(msg);
                } catch (error) {
                    console.error('Error processing message:', error);
                    // Reject and requeue the message
                    channel.nack(msg, false, true);
                }
            }
        });
        console.log(`Started consuming from queue ${queueName}`);
        return true;
    } catch (error) {
        console.error('Error consuming queue:', error);
        return false;
    }
}

// Close RabbitMQ connection
async function closeRabbitMQ() {
    if (connection) {
        await connection.close();
        console.log('RabbitMQ connection closed');
    }
}

module.exports = {
    QUEUES,
    connectRabbitMQ,
    getRabbitMQChannel,
    sendToQueue,
    queueEmailNotification,
    queueJobReminder,
    queueBackgroundTask,
    consumeQueue,
    closeRabbitMQ
};
