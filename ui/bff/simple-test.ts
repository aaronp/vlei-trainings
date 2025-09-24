import { Elysia } from 'elysia';

const simpleBran = new Elysia()
  .derive(() => {
    console.log('Simple derive called');
    return { testProp: 'test-value' };
  });

const app = new Elysia()
  .use(simpleBran)
  .get('/', (context) => {
    console.log('Handler called, keys:', Object.keys(context));
    return { keys: Object.keys(context), testProp: context.testProp };
  });

app.listen(3004);
console.log('Simple test server running at http://localhost:3004');