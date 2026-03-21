import * as dotenv from 'dotenv';
import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env' });

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.error('GROQ_API_KEY não encontrada no .env');
  process.exit(1);
}

const groq = new Groq({ apiKey });

async function testVision() {
  console.log('\n--- Testando GROQ Vision (Lata Redbull) ---');
  try {
    const imagePath = path.join(process.cwd(), 'public/testes-com-ia/Lata Redbull Maçã.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'O que é este produto? Responda apenas o nome e marca.' },
            { type: 'image_url', image_url: { url: base64Image } },
          ],
        },
      ],
      model: 'llama-3.2-11b-vision-preview',
    });

    console.log('Resultado Vision:', completion.choices[0]?.message?.content);
  } catch (error: any) {
    console.error('Erro no Vision:', error.message);
  }
}

async function testVoice() {
  console.log('\n--- Testando GROQ Voice (Whisper) ---');
  try {
    const audioPath = path.join(process.cwd(), 'public/testes-com-ia/teste-lista-de-compras.m4a');
    
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-large-v3',
      language: 'pt',
      response_format: 'text',
    });

    console.log('Transcrição:', transcription);
  } catch (error: any) {
    console.error('Erro no Voice:', error.message);
  }
}

async function runTests() {
  await testVision();
  await testVoice();
}

runTests();
