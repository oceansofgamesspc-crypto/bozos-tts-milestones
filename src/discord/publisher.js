const API = 'https://discord.com/api/v10';

async function discordFetch(token, endpoint, options = {}) {
  const response = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bot ${token}`,
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Discord ${response.status}: ${body}`);
  }
  return response;
}

export async function verifyChannel({ token, guildId, channelId }) {
  const response = await discordFetch(token, `/channels/${channelId}`);
  const channel = await response.json();
  if (channel.guild_id !== guildId) {
    throw new Error(`MILESTONE_CHANNEL_ID ${channelId} does not belong to MILESTONE_GUILD_ID ${guildId}`);
  }
  return channel;
}

export async function fetchServerCount(token) {
  let after = '0';
  let total = 0;
  while (true) {
    const response = await discordFetch(token, `/users/@me/guilds?limit=200&after=${after}`);
    const guilds = await response.json();
    total += guilds.length;
    if (guilds.length < 200) return total;
    after = guilds[guilds.length - 1].id;
  }
}

function payload({ content, filename, editing = false }) {
  return {
    content: content || '',
    allowed_mentions: { parse: [] },
    embeds: [{
      color: 0xa855f7,
      image: { url: `attachment://${filename}` },
      footer: { text: 'BOZOS TTS • 100 SERVER MILESTONE' }
    }],
    ...(editing ? { attachments: [{ id: '0', filename }] } : {})
  };
}

export async function createMessage({ token, channelId, buffer, filename, content }) {
  const form = new FormData();
  form.append('payload_json', JSON.stringify(payload({ content, filename })));
  form.append('files[0]', new Blob([buffer], { type: 'image/gif' }), filename);
  const response = await discordFetch(token, `/channels/${channelId}/messages`, {
    method: 'POST',
    body: form
  });
  return response.json();
}

export async function editMessage({ token, channelId, messageId, buffer, filename, content }) {
  const form = new FormData();
  form.append('payload_json', JSON.stringify(payload({ content, filename, editing: true })));
  form.append('files[0]', new Blob([buffer], { type: 'image/gif' }), filename);
  const response = await discordFetch(token, `/channels/${channelId}/messages/${messageId}`, {
    method: 'PATCH',
    body: form
  });
  return response.json();
}
