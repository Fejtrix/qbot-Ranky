import { QbotClient } from './structures/QbotClient';
import { Client as RobloxClient } from 'bloxy';
import { handleInteraction } from './handlers/handleInteraction';
import { handleLegacyCommand } from './handlers/handleLegacyCommand';
import { config } from './config'; 
import { Group } from 'bloxy/dist/structures';
import { recordShout } from './events/shout';
import { checkSuspensions } from './events/suspensions';
import { recordAuditLogs } from './events/audit';
import { recordMemberCount } from './events/member';
import { clearActions } from './handlers/abuseDetection';
import { checkBans } from './events/bans';
import { checkWallForAds } from './events/wall';
import http from 'http';
require('dotenv').config();

// [Crash Handlers - Prints exact error instead of exiting silently]
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// [Ensure Setup]
if (!process.env.ROBLOX_COOKIE) {
    console.error('ROBLOX_COOKIE is not set in the environment variables.');
    process.exit(1);
}

require('./database');
require('./api');

// [HTTP Server for Render Port Binding]
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Qbot is alive and running!');
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`HTTP server is listening on port ${PORT}`);
});

// [Clients]
const discordClient = new QbotClient();
discordClient.login(process.env.DISCORD_TOKEN);
const robloxClient = new RobloxClient({ credentials: { cookie: process.env.ROBLOX_COOKIE } });
let robloxGroup: Group = null;

(async () => {
    try {
        await robloxClient.login();
        robloxGroup = await robloxClient.getGroup(config.groupId);
        
        // [Events]
        checkSuspensions();
        checkBans();
        if (config.logChannels.shout) recordShout();
        if (config.recordManualActions) recordAuditLogs();
        if (config.memberCount.enabled) recordMemberCount();
        if (config.antiAbuse.enabled) clearActions();
        if (config.deleteWallURLs) checkWallForAds();
        
        console.log('Qbot successfully connected to Roblox and started all events!');
    } catch (error) {
        console.error('Failed to initialize Roblox client or events:', error);
    }
})();

// [Handlers]
discordClient.on('interactionCreate', handleInteraction as any);
discordClient.on('messageCreate', handleLegacyCommand);

// [Module]
export { discordClient, robloxClient, robloxGroup };
