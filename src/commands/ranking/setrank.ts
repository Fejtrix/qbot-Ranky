// --- Synchronize Discord Roles via Bloxlink API ---
            try {
                const bloxlinkApiKey = process.env.BLOXLINK_API_KEY || (config as any).bloxlinkApiKey;
                const bloxlinkGuildId = (config as any).bloxlinkGuildId;

                console.log('Fetching Discord ID from Bloxlink for Roblox ID:', robloxUser.id);

                if (bloxlinkApiKey && bloxlinkGuildId) {
                    const response = await fetch(`https://api.blox.link/v4/public/guilds/${bloxlinkGuildId}/roblox-to-discord/${robloxUser.id}`, {
                        headers: {
                            'Authorization': bloxlinkApiKey
                        }
                    });

                    if (response.ok) {
                        const data = await response.json() as { discordIDs?: string[] };
                        const discordId = data.discordIDs?.[0];

                        console.log('Resolved Bloxlink Discord ID:', discordId);

                        if (discordId && ctx.guild) {
                            const discordMember = await ctx.guild.members.fetch(discordId).catch((err) => {
                                console.error('Could not fetch Discord member from guild:', err);
                                return null;
                            });

                            if (discordMember && (config as any).discordRolesMap) {
                                const targetDiscordRoleId = (config as any).discordRolesMap[role.id];
                                const oldDiscordRoleId = (config as any).discordRolesMap[robloxMember.role.id];

                                console.log('Assigning Discord Role:', targetDiscordRoleId, 'Removing Old Role:', oldDiscordRoleId);

                                if (oldDiscordRoleId && discordMember.roles.cache.has(oldDiscordRoleId)) {
                                    await discordMember.roles.remove(oldDiscordRoleId).catch((e) => console.error('Failed to remove old role:', e));
                                }
                                if (targetDiscordRoleId && !discordMember.roles.cache.has(targetDiscordRoleId)) {
                                    await discordManagerAdd: await discordMember.roles.add(targetDiscordRoleId).catch((e) => console.error('Failed to add new role:', e));
                                    console.log('Successfully updated Discord role!');
                                }
                            }
                        } else {
                            console.log('No linked Discord ID found for this Roblox user in Bloxlink for this server.');
                        }
                    } else {
                        console.error('Bloxlink API request failed with status:', response.status);
                    }
                } else {
                    console.log('Bloxlink API Key or Guild ID is missing in configuration/environment variables.');
                }
            } catch (discordErr) {
                console.error('Failed to sync Discord roles:', discordErr);
            }
            // ---------------------------------
