require('dotenv').config();
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';

const app: any = express();
const PORT = process.env.PORT || 4000;

// Health check endpoint
app.get('/healthz', (req: any, res: any) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create Apollo Server
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, // Enable GraphQL Playground
  context: ({ req }) => ({
    // Add any context you need here
  })
});

async function startServer() {
  try {
    // Start Apollo Server
    await apolloServer.start();

    // Mount Apollo middleware
    apolloServer.applyMiddleware({ app, path: '/graphql' });

    // Start Express server
    app.listen(PORT, () => {
      console.log('🚀 QuickBites Support Bot Server');
      console.log('='.repeat(50));
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log(`🔍 GraphQL Playground: http://localhost:${PORT}/graphql`);
      console.log(`❤️  Health check: http://localhost:${PORT}/healthz`);
      console.log('='.repeat(50));
      console.log('Ready to handle support conversations!');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  apolloServer.stop().then(() => {
    console.log('Apollo server stopped');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  apolloServer.stop().then(() => {
    console.log('Apollo server stopped');
    process.exit(0);
  });
});

// Start the server
startServer();
