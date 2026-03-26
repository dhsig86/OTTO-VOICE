export default async function handler(req, res) {
  // Apenas aceita requisições POST com texto
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { text, voiceId } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Nenhum texto fornecido.' });
  }

  // Se o paciente não informou uma Voice_ID clonada no Setup, usamos a voz natural "Rachel" (Exemplo premium padrão)
  // Ou passe a Rachel ID: 21m00Tcm4TlvDq8ikWAM
  const finalVoiceId = voiceId?.trim() || '21m00Tcm4TlvDq8ikWAM';
  
  // A chave fica protegida DENTRO da Vercel e NUNCA vai pro celular do paciente
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'API Key da ElevenLabs não configurada no servidor.' });
  }

  try {
    // Comunicação Server-to-Server com ElevenLabs garantindo segurança
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${finalVoiceId}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2', // Suporta PT-BR hiper-realista nativamente
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.1, // Sutil melhora nas inflexões contextuais do texto
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Erro ElevenLabs (${response.status}): ${errText}`);
    }

    // Retorna o fluxo (Stream) de áudio cru/binário para o Front-End
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.status(200).send(buffer);

  } catch (error) {
    console.error('OTTO VOX Severless TTS Error:', error);
    res.status(500).json({ error: error.message || 'Falha na comunicação com a IA de voz' });
  }
}
