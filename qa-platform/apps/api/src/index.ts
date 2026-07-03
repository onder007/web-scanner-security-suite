import fastify from 'fastify';
import cors from '@fastify/cors';
import { SinglePageAnalyzer } from '@qa/crawler';
import { BrokenLinkScanner, SEOAnalyzer } from '@qa/plugins';

const server = fastify({ logger: true });

server.register(cors, {
  origin: '*',
});

const analyzer = new SinglePageAnalyzer();
analyzer.registerPlugin(new BrokenLinkScanner());
analyzer.registerPlugin(new SEOAnalyzer());

// Initialize playwright on boot
analyzer.init().catch(err => server.log.error(err));

server.post('/api/check', async (request, reply) => {
  const { url, pluginName } = request.body as { url: string; pluginName: string };
  if (!url || !pluginName) {
    return reply.status(400).send({ error: 'URL and pluginName are required' });
  }

  try {
    const reports = await analyzer.runCheck(url, pluginName);
    return reply.send({ success: true, reports });
  } catch (error: any) {
    server.log.error(error);
    return reply.status(500).send({ success: false, error: error.message });
  }
});

const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
    console.log('API Server running on http://localhost:3001');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

process.on('SIGINT', async () => {
  await analyzer.close();
  process.exit(0);
});
