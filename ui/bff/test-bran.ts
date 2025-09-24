import { Elysia } from 'elysia';
import { branContext } from './middleware/branContext';

const testApp = new Elysia()
  .use(branContext)
  .get('/', (context) => {
    console.log('Full context:', Object.keys(context));
    console.log('branBran:', context.branBran);
    return { 
      keys: Object.keys(context),
      bran: context.branBran,
      isNewBran: context.branIsNewBran
    };
  });

// Start the test server
testApp.listen(3003);
console.log('Test server running at http://localhost:3003');